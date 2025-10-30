# Survey Reminder System Fix Plan
**Date:** 2025-10-30
**Priority:** HIGH
**Issue:** Reminder system accumulating "unsent" reminders and had catastrophic failure on Oct 27, 2025

---

## Executive Summary

On Oct 27, 2025, changes to the reminder cron job resulted in 1,000 old reminder surveys being sent before the issue was caught. Investigation revealed 39,000 accumulated "unsent" reminders dating back to 2017, which were deleted. Current analysis shows the system is still accumulating unsent reminders (34 in the last week) due to:

1. **Legitimately unsendable reminders** not being marked as processed
2. **emailStatus mismatches** between what's scheduled vs. what can be sent
3. **No cleanup mechanism** for unsendable reminders

---

## Problem Analysis

### What Happened on Oct 27, 2025

Three simultaneous changes created a perfect storm:

1. **Cron frequency changed:** 1x/day (midnight) → 12x/day (every 2 hours)
2. **Date filter changed:** `DATE(reminderDate) = CURDATE()` → `reminderDate <= UTC_TIMESTAMP()`
3. **Batch limit doubled:** 300 → 600

**Result:**
- Daily capacity increased from 300 to 7,200 reminders/day (24x)
- Date filter change opened floodgates to ALL historical reminders (back to 2017)
- System sent 1,000 ancient reminders before being stopped

### Root Causes

#### 1. Filter Mismatch Between Scripts

**`background_job.php` query:**
```sql
SELECT DISTINCT(surveyId) FROM Survey_Log
WHERE Survey.type = 0
  AND reminderDate IS NOT NULL
  AND reminderDate <= UTC_TIMESTAMP()
  AND reminderDate >= UTC_TIMESTAMP() - INTERVAL 30 DAY
  AND score IS NULL
  AND reminderSentOnDate IS NULL
```

**`survey_emailer.php` query adds MORE filters:**
```sql
WHERE Client.active=1
  AND Client.sendSurveyEmail=1
  AND Survey_Log.emailStatus=2
```

**Problem:** Reminders that pass the first filter but fail the second stay marked as "unsent" forever.

#### 2. No Cleanup for Legitimately Unsendable Reminders

Reminders that CAN'T be sent accumulate forever:
- Clients who unsubscribe (`sendSurveyEmail=0`)
- Clients marked inactive (`active=0`)
- Emails that bounced/failed (`emailStatus=3,4`)

#### 3. Historical Accumulation

**Before Oct 27:**
- 300 reminders/day capacity (1 run × 300 limit)
- System likely needed MORE than 300/day
- Excess accumulated over years → 39,000 backlog

**Current Situation (after fixes):**
- 3,600 reminders/day capacity (12 runs × 300 limit)
- But still accumulating ~5-10 unsendable reminders/day

---

## Current State (as of Oct 30, 2025)

### What's Working ✅
- Cron runs 12x/day reliably (every 2 hours)
- 30-day safety window prevents ancient reminders
- Concurrency lock prevents overlapping runs
- System correctly respects unsubscribe/inactive status

### What's Broken ❌
- 34 reminders accumulated in last 7 days
- All 34 are legitimately unsendable but marked as "unsent"
- Metrics show false "delivery failures"
- No way to distinguish "failed to send" from "unable to send"

### Breakdown of Current 34 Unsent Reminders
- **4 reminders:** Unsubscribed clients (`sendSurveyEmail=0`)
- **30 reminders:** Failed email status (`emailStatus=3,4` instead of `2`)

---

## The Fix Plan

### Phase 1: Immediate Fixes (Tomorrow)

#### Fix 1: Revert Date Filter to Safe Version
**File:** `/var/www/html/background_job.php` line 66

**Change FROM:**
```php
"reminderDate IS NOT NULL AND reminderDate <= UTC_TIMESTAMP() AND reminderDate >= UTC_TIMESTAMP() - INTERVAL 30 DAY AND score IS NULL AND reminderSentOnDate IS NULL"
```

**Change TO:**
```php
"reminderDate IS NOT NULL AND DATE(reminderDate) = CURDATE() AND score IS NULL AND reminderSentOnDate IS NULL"
```

**Why:**
- Only processes TODAY's reminders (safest approach)
- Prevents any future backlog from being processed
- Still runs 12x/day so all daily reminders will be caught

**Impact:** ✅ Prevents future catastrophic failures

---

#### Fix 2: Add Cleanup for Unsendable Reminders
**File:** `/var/www/html/background_job.php` after line 90

**Add this code:**
```php
// Mark legitimately unsendable reminders as processed
// This prevents them from accumulating as "unsent" forever
$cleanupStmt = $conn->exec("UPDATE Survey_Log sl
  INNER JOIN Client c ON c.objectId = sl.clientId
  SET sl.reminderEmailStatus = 9,
      sl.note = CASE
        WHEN c.sendSurveyEmail = 0 THEN 'Client unsubscribed'
        WHEN c.active = 0 THEN 'Client inactive'
        WHEN sl.emailStatus = 3 THEN 'Email bounced'
        WHEN sl.emailStatus = 4 THEN 'Email delivery failed'
        ELSE 'Unable to send reminder'
      END
  WHERE DATE(sl.reminderDate) = CURDATE()
    AND sl.reminderSentOnDate IS NULL
    AND sl.score IS NULL
    AND (c.sendSurveyEmail = 0 OR c.active = 0 OR sl.emailStatus NOT IN (0,1,2))");

if(!DEV && $cleanupStmt) {
  file_put_contents("/var/www/html/admin/background_job.log",
    gmdate("Y-m-d H:i:s") . " - Marked $cleanupStmt unsendable reminders" . PHP_EOL,
    FILE_APPEND);
}
```

**Why:**
- Marks unsendable reminders with status 9 (new status)
- Records WHY they couldn't be sent in `note` field
- Prevents accumulation of "unsent" reminders
- Keeps metrics accurate

**Impact:** ✅ Stops accumulation of unsendable reminders

---

#### Fix 3: Update Survey Emailer (Same Logic)
**Files to update with `CURDATE()` filter:**
- `/var/www/html/survey/survey_emailer.php` line 107
- `/var/www/html/survey/survey_emailer.php` line 513
- `/var/www/html/survey/survey_emailer.php` line 834

**Change FROM:**
```php
"Survey_Log.reminderDate >= UTC_TIMESTAMP() - INTERVAL 30 DAY"
```

**Change TO:**
```php
"DATE(Survey_Log.reminderDate) = CURDATE()"
```

**Impact:** ✅ Ensures emailer only processes today's reminders

---

### Phase 2: Monitoring & Cleanup (Tomorrow Afternoon)

#### Action 1: Clean Up Current 34 Unsendable Reminders

**Run this SQL query once:**
```sql
UPDATE Survey_Log sl
INNER JOIN Client c ON c.objectId = sl.clientId
SET sl.reminderEmailStatus = 9,
    sl.note = CASE
      WHEN c.sendSurveyEmail = 0 THEN 'Client unsubscribed'
      WHEN c.active = 0 THEN 'Client inactive'
      WHEN sl.emailStatus = 3 THEN 'Email bounced'
      WHEN sl.emailStatus = 4 THEN 'Email delivery failed'
      ELSE 'Unable to send reminder'
    END
WHERE sl.reminderDate < UTC_TIMESTAMP()
  AND sl.reminderDate >= UTC_TIMESTAMP() - INTERVAL 7 DAY
  AND sl.reminderSentOnDate IS NULL
  AND sl.score IS NULL
  AND (c.sendSurveyEmail = 0 OR c.active = 0 OR sl.emailStatus NOT IN (0,1,2));
```

**Impact:** ✅ Cleans up current backlog

---

#### Action 2: Add Monitoring Query

**Create a daily monitoring query:**
```sql
-- Check for accumulating unsent reminders
SELECT
    DATE(reminderDate) as scheduled_date,
    COUNT(*) as total_scheduled,
    SUM(CASE WHEN reminderSentOnDate IS NOT NULL THEN 1 ELSE 0 END) as sent,
    SUM(CASE WHEN reminderSentOnDate IS NULL AND reminderEmailStatus != 9 THEN 1 ELSE 0 END) as truly_unsent,
    SUM(CASE WHEN reminderEmailStatus = 9 THEN 1 ELSE 0 END) as unable_to_send
FROM Survey_Log
WHERE reminderDate >= CURDATE() - INTERVAL 7 DAY
    AND reminderDate IS NOT NULL
GROUP BY DATE(reminderDate)
ORDER BY scheduled_date DESC;
```

**Schedule:** Run daily, alert if `truly_unsent > 0` after 24 hours

**Impact:** ✅ Early warning system for future issues

---

#### Action 3: Update Dashboard Reporting

**Modify reports to show three categories:**
1. **Sent:** `reminderSentOnDate IS NOT NULL`
2. **Unable to Send:** `reminderEmailStatus = 9`
3. **Pending/Failed:** Everything else

**Impact:** ✅ Accurate metrics for stakeholders

---

### Phase 3: Long-term Improvements (Next Week)

#### Improvement 1: Investigate emailStatus 3 & 4

**Research Questions:**
- What do emailStatus 3 and 4 actually mean?
- Are these from AWS SES bounce notifications?
- Should we update emailStatus definitions?

**Files to review:**
- `/var/www/html/survey/survey_emailer.php`
- `/var/www/html/awsnotification.php` (if exists)

---

#### Improvement 2: Review Limit Settings

**Current:** 300 reminders per survey per run
**Capacity:** 3,600/day (12 runs × 300)

**Questions:**
- What's the average daily reminder volume?
- What's the peak (Thursday spike)?
- Should we increase to 500 or keep at 300?

**Action:** Monitor for 1 week, then decide

---

#### Improvement 3: Add Automated Alerts

**Create monitoring script:** `/var/www/html/monitor_reminders.sh`

```bash
#!/bin/bash
# Check for unsent reminders older than 6 hours

UNSENT_COUNT=$(mysql -h client-culture-v8.c1kfmstpx3aa.ap-southeast-2.rds.amazonaws.com \
  -u admin -pR36S4pd1l0tU04bmymXO KlientKulture -N -e \
  "SELECT COUNT(*) FROM Survey_Log
   WHERE DATE(reminderDate) = CURDATE()
   AND reminderDate < UTC_TIMESTAMP() - INTERVAL 6 HOUR
   AND reminderSentOnDate IS NULL
   AND reminderEmailStatus != 9
   AND score IS NULL")

if [ "$UNSENT_COUNT" -gt 0 ]; then
  echo "WARNING: $UNSENT_COUNT reminders pending for >6 hours"
  # Send alert email
fi
```

**Schedule:** Run every hour via cron

---

## Testing Plan

### Pre-Deployment Testing

**1. Test on development database:**
```sql
-- Create test reminder
INSERT INTO Survey_Log (objectId, surveyId, clientId, reminderDate, score, reminderSentOnDate, emailStatus)
VALUES ('TEST123', 'existingSurveyId', 'existingClientId', CURDATE(), NULL, NULL, 2);

-- Run cleanup manually
UPDATE Survey_Log SET reminderEmailStatus = 9, note = 'Test'
WHERE objectId = 'TEST123' AND emailStatus = 3;

-- Verify
SELECT * FROM Survey_Log WHERE objectId = 'TEST123';
```

**2. Backup production database before changes**

**3. Deploy during low-traffic period (Sunday morning)**

---

### Post-Deployment Verification

**Day 1 (Sunday):**
- ✅ Check cron is running 12x/day
- ✅ Verify no old reminders being processed
- ✅ Confirm cleanup code is marking unsendable reminders
- ✅ Check logs: `/var/www/html/admin/background_job.log`

**Day 2-7 (Monitor):**
- ✅ Run monitoring query daily
- ✅ Verify no accumulation of "truly unsent" reminders
- ✅ Track reminder delivery rates
- ✅ Watch for any vendor complaints

**Week 2:**
- ✅ Review metrics with stakeholders
- ✅ Confirm fix is working as expected
- ✅ Document any edge cases discovered

---

## Rollback Plan

**If issues arise:**

**1. Revert code changes:**
```bash
cd /Users/gregtilse/projects/clientculture/survey_docs/CC_survey_updates_production_backup_oct27_2025
scp -i ~/projects/pem/KlientKulture.pem background_job.php ec2-user@clientculture.net:/tmp/
ssh -i ~/projects/pem/KlientKulture.pem ec2-user@clientculture.net "sudo cp /tmp/background_job.php /var/www/html/background_job.php"
```

**2. Stop cron temporarily:**
```bash
# Comment out reminder cron jobs
sudo crontab -e
```

**3. Manual emergency fix:**
```sql
-- Reset any problematic reminders
UPDATE Survey_Log
SET reminderEmailStatus = NULL, note = NULL
WHERE reminderEmailStatus = 9;
```

---

## Communication Plan

### Before Deployment
**Email to:** Development team, key stakeholders
**Subject:** Survey Reminder System Maintenance - Sunday Morning
**Content:**
- Brief explanation of issue
- Planned fixes
- Expected downtime (if any)
- Who to contact if issues arise

### After Deployment
**Email to:** Same recipients
**Subject:** Survey Reminder System Update Complete
**Content:**
- What was fixed
- What to monitor
- New metrics available
- Request for feedback

---

## Success Criteria

**Week 1:**
- ✅ Zero "truly unsent" reminders accumulating
- ✅ All unsendable reminders marked with status 9
- ✅ Cron running reliably 12x/day
- ✅ No ancient reminders being processed

**Month 1:**
- ✅ Accurate reminder delivery metrics
- ✅ No vendor complaints about missing reminders
- ✅ Dashboard shows clear breakdown of sent/unsent/unable
- ✅ Monitoring alerts working

**Quarter 1:**
- ✅ System handling peak loads without issues
- ✅ Response rates on reminders measurable and improving
- ✅ No accumulation of any backlog
- ✅ Team confident in system reliability

---

## Questions to Resolve Tomorrow

1. **emailStatus field:** What are the official definitions of statuses 0-4?
2. **Historical data:** Should we mark ANY old reminders as status 9, or leave deleted?
3. **Reporting:** Who needs to be notified about these fixes?
4. **AWS SES:** Are statuses 3 & 4 coming from bounce notifications?
5. **Limit increase:** Should we test with higher limits or keep conservative?

---

## Files to Modify

### Primary Files (MUST change):
1. `/var/www/html/background_job.php` - Main cron job (2 changes)
2. `/var/www/html/survey/survey_emailer.php` - Email sender (3 changes)

### Supporting Files (review):
3. `/var/www/html/awsnotification.php` - May handle emailStatus updates
4. Dashboard/reporting queries - May need emailStatus 9 added

### Backup Before Changes:
```bash
ssh -i ~/projects/pem/KlientKulture.pem ec2-user@clientculture.net "
  sudo cp /var/www/html/background_job.php /var/www/html/background_job.php.backup_20251030
  sudo cp /var/www/html/survey/survey_emailer.php /var/www/html/survey/survey_emailer.php.backup_20251030
"
```

---

## Estimated Time

- **Code changes:** 30 minutes
- **Testing:** 1 hour
- **Deployment:** 30 minutes
- **Verification:** 1 hour
- **Documentation:** 30 minutes

**Total:** 3.5 hours

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| New code breaks reminders | Low | High | Test thoroughly, deploy Sunday AM, monitor closely |
| Cleanup marks wrong reminders | Low | Medium | Review SQL carefully, test on dev first |
| Misses legitimate reminders | Low | High | Use CURDATE() which is proven safe |
| emailStatus 9 conflicts | Medium | Low | Check if status 9 is already used elsewhere |
| Performance impact | Low | Low | Cleanup is single query, minimal overhead |

---

## Next Steps for Tomorrow

1. ☐ Review this plan with team
2. ☐ Answer outstanding questions
3. ☐ Backup production database
4. ☐ Make code changes to local copies
5. ☐ Test on development
6. ☐ Deploy to production (Sunday AM)
7. ☐ Monitor for 24 hours
8. ☐ Document results

---

**Created by:** Claude Code
**Review by:** Greg Tilse & Development Team
**Approval needed before:** Deployment
