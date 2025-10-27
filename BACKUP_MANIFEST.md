# Production Survey Backup Manifest - October 27, 2025

**Backup Date:** Mon 27 Oct 2025 18:30:00 AEDT
**Backup Location:** `/Users/gregtilse/projects/clientculture/survey_docs/production_backup_oct27_2025/`
**Production Server:** ec2-user@clientculture.net
**Production Path:** `/var/www/html/survey/`

---

## Purpose

This backup captures all production survey module changes made between **October 25-27, 2025**. These improvements are NOT yet in the developer's GitHub repository, making this backup critical for:

1. **Version Control:** Production is ahead of GitHub by ~5 days of improvements
2. **Emergency Restoration:** Quick recovery if production files are accidentally overwritten
3. **Documentation:** Complete record of what changed and why
4. **Knowledge Transfer:** Full context for future development work

---

## Files Backed Up (11 Total)

### Frontend Application Files

#### 1. `index.html` (23 KB)
**Purpose:** Main feedback form (webview display)

**Recent Changes (Oct 25-27):**
- ✅ Firm name binding in footer (Oct 27 Late Evening)
  - Reads `firmName` URL parameter
  - Displays in footer: "...contact at [Firm Name]"
- ✅ NPS context display section
  - Shows selected score with visual confirmation
  - Hidden on mobile (< 640px) via CSS
- ✅ Auto-close logic removed (Oct 27 Evening Part 2)
  - Previously closed window after thank you message
  - Now stays open (correct UX)
- ✅ Thank you message enhancement (Oct 27 Late Evening)
  - Includes firm name: "...improve our service at [Firm Name]."
  - Left-aligned formatting

**Key Sections:**
- Line ~15: Firm name URL parameter reading
- Line ~180: Footer firm name binding
- Line ~120: NPS context display (with mobile hiding via CSS)
- Line ~210: Enhanced thank you message

---

#### 2. `app.js` (15 KB)
**Purpose:** Knockout.js view model for feedback form

**Recent Changes (Oct 25-27):**
- ✅ Auto-close logic removed (Oct 27 Evening Part 2)
  - Was at lines 268-278 in wizardState subscription
  - Removed window.close() on wizardState 4 (thank you page)
- ✅ Second extra question threshold adjusted (Oct 27 Afternoon)
  - Line 359: Changed from scores 8-10 to scores 9-10
  - "Exceptional service" question now only for Promoters
- ✅ Firm name handling
  - Reads firmName from URL parameters
  - Binds to footer display

**Critical Functions:**
- `submitScore()`: Handles score submission
- `submitFeedback()`: Handles feedback form submission
- `wizardState` observable: Controls UI state flow

---

#### 3. `styles.css` (4.9 KB)
**Purpose:** Application styling (desktop + mobile)

**Recent Changes (Oct 25-27):**
- ✅ Footer visibility fixes (Oct 27 Late Evening)
  - Auto-height with proper padding (replaced fixed height)
  - Visible without scrolling on both desktop and mobile
- ✅ Mobile NPS context hiding (Oct 27 Evening Part 2)
  - Line 142-151: Media query (max-width: 640px)
  - `#divFeedback #nps-context { display: none !important; }`
  - Prevents "wall of buttons" confusion on mobile
- ✅ Mobile button layout fixes (Oct 27 Evening Part 2)
  - Line 172-187: Submit button full-width
  - "Change score" link fully visible
  - Stacked vertical layout on mobile

**Key Media Queries:**
- Line 142: Mobile NPS context hiding
- Line 172: Mobile button and link visibility

---

### Email Templates

#### 4. `email_template_reminder.html` (21 KB)
**Purpose:** Multi-purpose reminder email template (webview + inline scores + confirmation)

**Recent Changes (Oct 25-27):**
- ✅ Confirmation mode improvements (Oct 26 Evening)
  - Submit Score button added (replaced "please confirm" text)
  - Matched styling with index.html (seamless visual continuity)
  - Fixed footer positioning
  - Fixed highlighted button text color (white on blue)
- ✅ Favicon added (Oct 27 Afternoon)
- ✅ Firm name pass-through (Oct 27 Late Evening)
  - Captures firmName from email data
  - Passes via URL parameter to index.html
  - Three-part implementation
- ✅ Auto-close logic added (Oct 27 Evening Part 2)
  - **Confirmation mode:** Auto-close after Submit Score click
  - **Webview mode:** Auto-close after score button click
  - Removed `target="_blank"` in webview mode
  - Lines 495-501: Confirmation mode auto-close
  - Lines ~380: Webview mode auto-close

**Three Operating Modes:**
1. **Webview Mode:** Single button → Opens same window → Auto-closes
2. **Inline Score Mode:** 11 buttons (0-10) → Confirmation page
3. **Confirmation Mode:** Selected score + Submit Score button → Auto-closes

**Critical Sections:**
- Line 129: Firm name variable capture
- Line 495-501: Auto-close on Submit Score
- Line ~380: Auto-close on webview button click
- Line ~200: NPS score buttons (0-10)

---

#### 5. `email_template_reminder_single.html` (6.7 KB)
**Purpose:** Single-button reminder template (default for most vendors)

**Created:** Oct 27, 2025 (Morning session)

**Features:**
- Single "Submit your score" button
- Matches initial email style (consistent UX)
- Favicon included
- Footer text: "firms" (not "professionals")
- Webview mode: Opens email_template_reminder.html

**Why Created:**
- Simplifies default reminder flow
- Optional inline scores require manual vendor-specific switch
- Most vendors use this template (cleaner, simpler)

---

#### 6. `email_template_initial.html` (6.7 KB)
**Purpose:** Initial survey email template

**Recent Changes (Oct 25-27):**
- ✅ Footer text updated (Oct 27 Afternoon)
  - Changed "professionals" → "firms"
  - Consistency with webforms
- ✅ Favicon added (Oct 27 Afternoon)
  - Brand consistency across all pages

**Features:**
- Single "Submit your score" button (always)
- Opens webview in email_template_reminder.html
- Clean, simple design

---

### Backend PHP Files

#### 7. `survey_emailer.php` (43 KB)
**Purpose:** Email sending logic and template selection

**Recent Changes (Oct 25-27):**
- ✅ Vendor-specific inline score switch added (Oct 27 Morning)
  - Line 129: `$inlineScoreVendorIds` array
  - Manual control over which vendors get inline score emails
- ✅ Demo vendor added for testing (Oct 27 Evening Part 2)
  - `$inlineScoreVendorIds = ['xv8iF4ktxfthn'];` // Elston Wealth demo
  - Testing scheduled for Oct 28, 08:05 UTC

**Template Selection Logic:**
```php
// Line 129
$inlineScoreVendorIds = ['xv8iF4ktxfthn']; // Demo vendor only

// Later in code:
if (in_array($vendorId, $inlineScoreVendorIds)) {
    $template = 'email_template_reminder.html'; // Inline scores
} else {
    $template = 'email_template_reminder_single.html'; // Default single button
}
```

**Critical Functions:**
- `sendInitialEmails()`: Sends initial survey emails
- `sendReminderEmails()`: Sends reminder emails (called by background_job.php)
- Template selection logic for reminders

---

#### 8. `background_job.php` (10 KB)
**Purpose:** Cron job handler for reminder emails

**Recent Changes (Oct 27):**
- ✅ Safe reminder query deployed (Oct 27, 5:23 PM UTC)
  - Added 30-day safety window
  - `reminderDate <= UTC_TIMESTAMP() AND reminderDate >= UTC_TIMESTAMP() - INTERVAL 30 DAY`
  - Prevents old reminders from sending
- ✅ Concurrency lock added
  - Prevents duplicate sends during overlapping cron runs
- ✅ Cron schedule changed: Every 2 hours (from daily)
  - Runs at: 00:05, 02:05, 04:05, 06:05, 08:05, 10:05, 12:05, 14:05, 16:05, 18:05, 20:05, 22:05 UTC
  - Result: Reminders sent within 2 hours of scheduled time (all timezones)

**Critical Query:**
```sql
SELECT * FROM Survey_Log
WHERE reminderDate IS NOT NULL
AND reminderDate <= UTC_TIMESTAMP()
AND reminderDate >= UTC_TIMESTAMP() - INTERVAL 30 DAY
AND reminderSentOnDate IS NULL
AND emailStatus IN ('DELIVERED', 'SENT')
```

**Why This Matters:**
- Fixed timezone timing bug (Australian reminders were 23 hours early)
- UK reminders now during business hours (not midnight)
- All timezones within 2-hour accuracy

---

#### 9. `survey.php` (9.9 KB)
**Purpose:** Entry point for survey system

**Status:** No recent changes (Oct 25-27)

**Function:** Routes requests to appropriate handlers

---

### Utility Files

#### 10. `numbertowordsconverter.js` (1.8 KB)
**Purpose:** Converts numbers to words (e.g., 0 → "Zero", 10 → "Ten")

**Status:** No recent changes (Oct 25-27)

**Usage:** NPS score display in emails and webview

---

#### 11. `BACKUP_DATE.txt`
**Purpose:** Metadata file tracking backup date and purpose

**Contents:**
```
Mon 27 Oct 2025 18:30:00 AEDT
Production Survey Module Backup - October 27, 2025
```

---

## Summary of Changes by Date

### October 25-26, 2025
- Webview mode fixes
- Email template dual-purpose design
- Confirmation mode with Submit Score button
- Visual continuity (matching styles across all pages)
- Footer positioning fixes

### October 27, 2025 (Morning)
- Created `email_template_reminder_single.html`
- Added vendor-specific inline score switch
- Simplified default reminder flow
- Production test completed successfully

### October 27, 2025 (Afternoon)
- Footer text: "professionals" → "firms"
- Added favicon to all templates
- Second extra question threshold: 8-10 → 9-10

### October 27, 2025 (Late Evening - 6:00pm)
- Footer visibility fixes (auto-height)
- Firm name pass-through (score page → feedback form)
- Three-part implementation across templates

### October 27, 2025 (Evening Part 2 - 6:30pm-7:15pm)
- Auto-close moved from feedback form to score page
- Mobile NPS context hidden (prevents "wall of buttons")
- Mobile button layout fixes (full-width, fully visible)
- Demo vendor configured for inline score testing

### October 27, 2025 (Reminder Fix - 5:23pm UTC)
- Safe reminder query with 30-day window
- Concurrency lock
- Cron schedule: Daily → Every 2 hours
- Timezone timing bug FIXED

---

## Critical Business Logic Changes

### 1. Reminder Timing Fix (Most Critical)
**Before:** Reminders sent once daily, timezone issues, old reminders could send
**After:** Reminders every 2 hours, 30-day safety window, concurrency lock
**Impact:** Australian reminders at correct time, UK reminders during business hours

### 2. Template Selection (Default Behavior Change)
**Before:** All reminders used email_template_reminder.html (inline scores)
**After:** Default uses email_template_reminder_single.html (single button), inline scores opt-in
**Impact:** Simpler default UX, inline scores available per vendor via manual switch

### 3. Auto-Close Behavior (UX Improvement)
**Before:** Feedback form auto-closed after thank you message
**After:** Score page auto-closes after redirecting to feedback form
**Impact:** User ends with feedback form open (can review thank you message)

### 4. Mobile UX (Conversion Rate Improvement)
**Before:** NPS context (11 buttons) shown on mobile, creating "wall"
**After:** NPS context hidden on mobile (< 640px)
**Impact:** Clear path to feedback questions, higher mobile completion rate

---

## Testing Status

### Completed Tests (Oct 25-27)
- ✅ Single-button reminder flow (default)
- ✅ Webview mode (desktop + mobile)
- ✅ Footer firm name display
- ✅ Auto-close behavior
- ✅ Mobile button visibility

### Pending Tests (Scheduled Oct 28, 08:05 UTC)
- ⏳ Inline score reminder email (demo account: Elston Wealth)
- ⏳ Complete desktop flow with inline scores
- ⏳ Complete mobile flow with inline scores
- ⏳ All recent improvements together

---

## Database Changes

### October 27, 2025
- **Cleaned old reminders:** 39,000 rows with reminderDate < 90 days ago
- **Current reminder count:** ~1,000 scheduled for this week
- **Status:** Database optimized, only active reminders remain

---

## Restoration Instructions

### Emergency Full Restoration

If production files are lost or corrupted:

```bash
# 1. Connect to production server
ssh -i ~/projects/pem/KlientKulture.pem ec2-user@clientculture.net

# 2. Navigate to survey directory
cd /var/www/html/survey/

# 3. Create backup of current state (if any files exist)
timestamp=$(date +%Y%m%d_%H%M%S)
mkdir -p backups/restore_$timestamp
cp *.html *.php *.js *.css backups/restore_$timestamp/ 2>/dev/null

# 4. Upload all files from local backup
# (Run this from your LOCAL machine, not on server)
cd /Users/gregtilse/projects/clientculture/survey_docs/production_backup_oct27_2025/

scp -i ~/projects/pem/KlientKulture.pem \
  index.html \
  app.js \
  styles.css \
  email_template_reminder.html \
  email_template_reminder_single.html \
  email_template_initial.html \
  survey_emailer.php \
  survey.php \
  background_job.php \
  numbertowordsconverter.js \
  ec2-user@clientculture.net:/var/www/html/survey/

# 5. Verify files on server
ssh -i ~/projects/pem/KlientKulture.pem ec2-user@clientculture.net \
  "ls -lh /var/www/html/survey/*.{html,php,js,css}"

# 6. Test production URL
# Visit: https://www.clientculture.net/survey/
```

### Selective File Restoration

To restore a single file (example: app.js):

```bash
# From LOCAL machine
scp -i ~/projects/pem/KlientKulture.pem \
  /Users/gregtilse/projects/clientculture/survey_docs/production_backup_oct27_2025/app.js \
  ec2-user@clientculture.net:/var/www/html/survey/app.js
```

### Verification Checklist

After restoration:
- [ ] Visit https://www.clientculture.net/survey/
- [ ] Test single-button reminder flow (webview)
- [ ] Test inline score flow (if vendor configured)
- [ ] Check footer firm name display
- [ ] Verify mobile layout (< 640px)
- [ ] Confirm auto-close behavior
- [ ] Check reminder cron job status: `crontab -l | grep background_job`

---

## Version Control Strategy

**Current State:**
- ✅ Production has latest code (Oct 27, 18:30 AEDT)
- ✅ Local backup exists (this directory)
- ❌ Developer's GitHub is out of sync (missing Oct 25-27 changes)

**See:** `GITHUB_SYNC_STRATEGY.md` for comprehensive plan to sync production → GitHub

---

## Related Documentation

- [INDEX.md](../INDEX.md) - Main documentation index
- [SURVEY_SYSTEM_COMPLETE.md](../SURVEY_SYSTEM_COMPLETE.md) - Complete system documentation
- [INCIDENT_REMINDER_FIX_ROLLBACK_OCT27_2025.md](../INCIDENT_REMINDER_FIX_ROLLBACK_OCT27_2025.md) - Reminder timing incident report
- [SESSION_NOTES_OCT27_2025_EVENING_PART2.md](../SESSION_NOTES_OCT27_2025_EVENING_PART2.md) - Latest session notes
- [MIGRATION_STRATEGY_SURVEY_TO_ANNIKAAI.md](../MIGRATION_STRATEGY_SURVEY_TO_ANNIKAAI.md) - Migration roadmap

---

## File Integrity Verification

To verify backup integrity:

```bash
cd /Users/gregtilse/projects/clientculture/survey_docs/production_backup_oct27_2025/

# Check all files exist
ls -lh *.html *.php *.js *.css

# Compare with production (from LOCAL machine)
ssh -i ~/projects/pem/KlientKulture.pem ec2-user@clientculture.net \
  "cd /var/www/html/survey && ls -lh *.{html,php,js,css}"
```

**Expected Files (11 total):**
```
-rw-r--r--  index.html (23K)
-rw-r--r--  app.js (15K)
-rw-r--r--  styles.css (4.9K)
-rw-r--r--  email_template_reminder.html (21K)
-rw-r--r--  email_template_reminder_single.html (6.7K)
-rw-r--r--  email_template_initial.html (6.7K)
-rw-r--r--  survey_emailer.php (43K)
-rw-r--r--  survey.php (9.9K)
-rw-r--r--  background_job.php (10K)
-rw-r--r--  numbertowordsconverter.js (1.8K)
-rw-r--r--  BACKUP_DATE.txt
```

---

## Contact Information

**Production Server:** AWS EC2 13.210.68.95 (clientculture.net)
**Database:** client-culture-v8.c1kfmstpx3aa.ap-southeast-2.rds.amazonaws.com
**Production URL:** https://www.clientculture.net/survey/
**Backup Location:** `/Users/gregtilse/projects/clientculture/survey_docs/production_backup_oct27_2025/`

---

**Backup Status:** ✅ Complete
**Files Verified:** ✅ All 11 files present
**Documentation:** ✅ Comprehensive
**Restoration Tested:** ⏳ Pending (instructions provided)

---

*This manifest ensures all improvements from October 25-27, 2025 are documented and recoverable.*
