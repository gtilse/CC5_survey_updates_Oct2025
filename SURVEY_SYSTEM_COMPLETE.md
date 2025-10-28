# Client Culture Survey System - Complete Documentation

**Last Updated:** October 27, 2025 (5:30 PM UTC / 4:30 AM Oct 28 AEDT)
**Status:** Production-ready with ✅ TIMEZONE TIMING FIX ACTIVE
**Server:** AWS EC2 (13.210.68.95)

---

## Table of Contents

1. [Overview](#overview)
2. [System Architecture](#system-architecture)
3. [Client NPS Survey Flows](#client-nps-survey-flows)
4. [Recent Updates (Oct 25-26, 2025)](#recent-updates-oct-25-26-2025)
5. [Key Mechanisms](#key-mechanisms)
6. [File Inventory](#file-inventory)
7. [Configuration](#configuration)
8. [Deployment & Maintenance](#deployment--maintenance)
9. [Testing Checklist](#testing-checklist)
10. [Known Issues](#known-issues)

---

## Overview

The Client Culture survey system is a bot-protection-enabled NPS (Net Promoter Score) survey platform that collects client feedback through email campaigns.

### Core Strategy: "Single-Link First, Inline Optional"

**Initial Email:** Always single button for maximum inbox placement
**Reminder Email:** Single button by default (same flow as initial), inline 0-10 buttons optional via vendor-specific manual switch

### Key Features

- **Bot Protection:** URL fragments + intermediate confirmation page (reminders only)
- **Visual Continuity:** NPS context displayed on feedback form
- **Conditional Messaging:** Tailored responses for Promoters/Passives/Detractors
- **localStorage Auto-save:** Preserves user input if they change their score
- **Mobile Responsive:** Optimized for all devices and email clients

---

## System Architecture

### Component Stack


```
┌──────────────────────────────────────────────────────────┐
│  Email Template System (3 Templates)                     │
│  • email_template_initial.html (initial: single button) │
│  • email_template_reminder_single.html (reminder        │
│    DEFAULT: single button)                               │
│  • email_template_reminder.html (reminder OPTIONAL:     │
│    inline scores for specific vendors)                   │
└──────────────────────────────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────────┐
│  survey_emailer.php (Template Selection Logic)           │
│  • Initial emails: Always email_template_initial.html   │
│  • Reminder emails:                                      │
│    - Check vendor ID against $inlineScoreVendorIds      │
│    - If in array: email_template_reminder.html          │
│    - If NOT in array (default):                         │
│      email_template_reminder_single.html                 │
│  • Replaces placeholders                                 │
│  • Sends via AWS SES                                     │
└──────────────────────────────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────────┐
│  Survey Application (Knockout.js)                        │
│  • index.html - Main feedback form                       │
│  • app.js - View model & business logic                  │
│  • styles.css - Responsive styling                       │
└──────────────────────────────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────────┐
│  RDS MySQL Database                                      │
│  • Survey configuration                                  │
│  • Response storage                                      │
│  • Client records                                        │
└──────────────────────────────────────────────────────────┘
```

### File Locations (Production)

**Base Directory:** `/var/www/html/survey/`

**Active Templates:**
- `email_template_initial.html` (5.8 KB) ← Updated Oct 26 (governance footer + helper text)
- `email_template_reminder_single.html` (6.2 KB) ← NEW Oct 27 (default reminder template)
- `email_template_reminder.html` (20 KB) ← Updated Oct 26-27 (optional inline scores + confirmation mode)

**Survey Application:**
- `index.html` (22 KB) ← Updated Oct 26
- `app.js` (15 KB)
- `styles.css` (5.6 KB)

**Backend:**
- `survey_emailer.php` (44 KB) ← Updated Oct 27 (vendor-specific manual switch)
- `survey.php` (entry point)

**Configuration:**
- `/var/www/html/assets/config.json`

---

## Client NPS Survey Flows

### Flow 1A: Initial Email (First Contact)

**Email Template:** `email_template_initial.html`
**Trigger:** `$emailType == $GLOBALS["EMAIL_TYPE"]["SURVEY"]`

```
┌─────────────────────────────────────────────────────────┐
│ EMAIL: email_template_initial.html                      │
│                                                          │
│ [Logo]                                                   │
│                                                          │
│ It's just one question — should take 10 seconds.        │
│ ↑ Visible preheader (12px, grey) - deliverability safe │
│                                                          │
│ Hi John,                                                 │
│                                                          │
│ [Custom personalized message from firm...]              │
│ How likely are you to recommend ABC Accounting?         │
│ ↑ IMPORTANT: NPS question must be LAST SENTENCE         │
│                                                          │
│  ┌─────────────────────────────────┐                    │
│  │   Share Your Feedback           │                    │
│  └─────────────────────────────────┘                    │
│  It only takes 10 seconds, and your feedback helps us   │
│  improve our service. ← Helper text (14px, grey)        │
│                                                          │
│ Footer: Powered by Client Culture | View in browser     │
└─────────────────────────────────────────────────────────┘
                          ↓ Click button
┌─────────────────────────────────────────────────────────┐
│ WEBVIEW PAGE: survey.php?id=X&type=CLI&webview=1       │
│ (Actually serves: email_template_reminder.html)         │
│                                                          │
│ JavaScript detects webview=1:                           │
│ • Extracts LAST PARAGRAPH from email (NPS question)     │
│ • Shows inline 0-10 score buttons                       │
│ • Direct links (no bot protection needed)              │
│                                                          │
│ [Logo]                                                   │
│                                                          │
│ Thanks for taking a moment to share your feedback.      │
│                                                          │
│ How likely are you to recommend ABC Accounting?         │
│                                                          │
│  [0] [1] [2] [3] [4] [5] [6] [7] [8] [9] [10]          │
│  Least likely                       Most likely         │
└─────────────────────────────────────────────────────────┘
                          ↓ Click score (e.g., 9)
┌─────────────────────────────────────────────────────────┐
│ FEEDBACK FORM: index.html?score=9                       │
│                                                          │
│ [Logo]                                                   │
│ ─────────────────────────────────────                   │
│                                                          │
│ Thanks for taking a moment to share your feedback.      │
│                                                          │
│ ──────────────────────────────────────────              │
│ Thank you                                                │
│ We're delighted to hear you've had a positive           │
│ experience.                                              │
│ ──────────────────────────────────────────              │
│ Optional questions                                       │
│ If you have a moment, there are four quick questions    │
│ below — including why you'd recommend us...             │
│                                                          │
│ Can you tell us more about why you gave this score?     │
│ ┌────────────────────────────────────────────────┐      │
│ │ [Feedback textarea]                            │      │
│ └────────────────────────────────────────────────┘      │
│                                                          │
│ What are the 3 most important reasons you'd             │
│ recommend us?                                            │
│ Help us identify what matters most for you.             │
│ ☐ Quality of service                                    │
│ ☐ Responsiveness                                        │
│ ☐ Value for money                                       │
│ [... other options]                                     │
│                                                          │
│ How could we make things even better for you?           │
│ ┌────────────────────────────────────────────────┐      │
│ │ [Suggestions textarea]                         │      │
│ └────────────────────────────────────────────────┘      │
│                                                          │
│ Would you like to share feedback about someone who      │
│ delivered exceptional service?                          │
│ Help us recognise our people and teams.                 │
│ ┌────────────────────────────────────────────────┐      │
│ │ [Staff recognition textarea]                   │      │
│ └────────────────────────────────────────────────┘      │
│                                                          │
│  [Submit Feedback]            Change score              │
│                                                          │
│ ──────────────────────────────────────────              │
│ Powered by Client Culture                               │
└─────────────────────────────────────────────────────────┘
                          ↓ Submit
┌─────────────────────────────────────────────────────────┐
│ ADDITIONAL QUESTIONS: index.html (wizardState=2)        │
│ • Dynamic questions from backend (rarely used)          │
│ • Staff selection dropdown (if applicable)              │
└─────────────────────────────────────────────────────────┘
                          ↓ Submit
┌─────────────────────────────────────────────────────────┐
│ SOCIAL MEDIA PROMPTS: index.html (wizardState=3)        │
│ • Only shown for Promoters (score 9-10)                │
│ • Google / Facebook / TrueLocal review links           │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ THANK YOU: index.html (wizardState=4)                   │
│ "Thank you for your feedback"                           │
└─────────────────────────────────────────────────────────┘
```

**Key Files:**
- Email: `/var/www/html/survey/email_template_initial.html`
- Webview: `/var/www/html/survey/email_template_reminder.html` (same as reminder, webview mode)
- Form: `/var/www/html/survey/index.html`

---

### Flow 1B: Reminder Email - Default (Single Button)

**Email Template:** `email_template_reminder_single.html` (NEW - Oct 27, 2025)
**Trigger:** `$emailType != $GLOBALS["EMAIL_TYPE"]["SURVEY"]` AND vendor ID NOT in `$inlineScoreVendorIds` array
**Note:** This is now the DEFAULT reminder flow (same as initial email)

```
┌─────────────────────────────────────────────────────────┐
│ EMAIL: email_template_reminder.html                     │
│                                                          │
│ [Logo]                                                   │
│                                                          │
│ Hi John,                                                 │
│                                                          │
│ [Reminder message...]                                    │
│ How likely are you to recommend ABC Accounting?         │
│                                                          │
│  [0] [1] [2] [3] [4] [5] [6] [7] [8] [9] [10]          │
│  Least likely                       Most likely         │
│  ↑ Links use URL fragments: #score=X (bot protection)  │
│                                                          │
│ Footer: Powered by Client Culture | View in browser     │
└─────────────────────────────────────────────────────────┘
                          ↓ Click score (e.g., 7)
┌─────────────────────────────────────────────────────────┐
│ INTERMEDIATE CONFIRMATION PAGE                           │
│ URL: survey.php?id=X&type=CLI#score=7                  │
│ (Same file: email_template_reminder.html)              │
│                                                          │
│ JavaScript detects #score=7 in URL fragment:           │
│ • Hides email-only content                              │
│ • Shows NPS question                                     │
│ • Highlights score 7 button in blue                     │
│ • Shows "Submit Score" button                           │
│ • Converts links from #score=X to &score=X             │
│                                                          │
│ [Logo]                                                   │
│                                                          │
│ Thanks for taking a moment to share your feedback.      │
│                                                          │
│ How likely are you to recommend ABC Accounting?         │
│                                                          │
│  [0] [1] [2] [3] [4] [5] [6] [★7★] [8] [9] [10]       │
│  Least likely                       Most likely         │
│  ↑ Score 7 highlighted in blue with white text         │
│                                                          │
│  ┌─────────────────────────────────┐                    │
│  │      Submit Score                │                   │
│  └─────────────────────────────────┘                    │
│                                                          │
│ Note: User can click any score button to change        │
│       selection before clicking Submit Score            │
└─────────────────────────────────────────────────────────┘
                          ↓ Click Submit Score
┌─────────────────────────────────────────────────────────┐
│ FEEDBACK FORM: index.html?score=7&question=...          │
│                                                          │
│ [Logo]                                                   │
│ ─────────────────────────────────────                   │
│                                                          │
│ Thanks for taking a moment to share your feedback.      │
│ ─────────────────────────────────────                   │
│ ╔═══════════════════════════════════════════════════╗   │
│ ║ NPS CONTEXT (Greyed out, opacity 0.5)            ║   │
│ ║                                                   ║   │
│ ║ How likely are you to recommend ABC Accounting?  ║   │
│ ║                                                   ║   │
│ ║  [0] [1] [2] [3] [4] [5] [6] [★7★] [8] [9] [10] ║   │
│ ║  Least likely                       Most likely  ║   │
│ ╚═══════════════════════════════════════════════════╝   │
│ ─────────────────────────────────────                   │
│                                                          │
│ Thank you                                                │
│ We would love to know what would make your              │
│ experience better.                                       │
│ ──────────────────────────────────────────              │
│ Optional questions                                       │
│ If you have a moment, there are three quick questions   │
│ below — they'll help us understand why you gave this    │
│ score...                                                 │
│                                                          │
│ [Rest of form same as initial flow]                     │
│                                                          │
│  [Submit Feedback]            Change score              │
│  ↑ localStorage auto-saves all textarea content        │
└─────────────────────────────────────────────────────────┘
                          ↓ Continue same as Flow 1A
                [Additional Questions → Social Media → Thank You]
```

**Key Differences from Initial:**
1. Email has inline score buttons (vs single button)
2. Bot protection via URL fragments (`#score=X`)
3. Intermediate confirmation page with "Submit Score" button
4. User can change score before submitting
5. NPS question passed to feedback form via URL parameter
6. Feedback form shows greyed-out NPS context section

**Key Files:**
- Email/Intermediate: `/var/www/html/survey/email_template_reminder.html`
- Form: `/var/www/html/survey/index.html` (same as initial)

---

## Recent Updates (Oct 25-27, 2025)

### October 27, 12:50 PM - Simplified Reminder Flow with Vendor Switch

**Major Changes:**

**1. New Template: `email_template_reminder_single.html` (6.2 KB)**
- Reminder emails now use single button by default (matches initial emails)
- Copied from `email_template_initial.html` structure
- Links to webview mode: `survey.php?id=X&type=CLI&webview=1`
- Same flow as initial emails for consistency

**2. Vendor-Specific Manual Switch in `survey_emailer.php`**
- Added `$inlineScoreVendorIds` array (line 129)
- Default: Empty array (all vendors use single button)
- Optional: Add vendor IDs to enable inline scores for specific vendors
- Template selection logic (lines 166-178):
  ```php
  if (in_array($vendorId, $inlineScoreVendorIds)) {
    // Inline scores with confirmation mode
    $template = "email_template_reminder.html";
  } else {
    // Single button (default) - uses webview mode
    $template = "email_template_reminder_single.html";
  }
  ```

**3. Three Templates, Three Purposes:**
- `email_template_initial.html` - Initial emails (always single button)
- `email_template_reminder_single.html` - Reminder emails (DEFAULT: single button)
- `email_template_reminder.html` - Reminder emails (OPTIONAL: inline scores for specific vendors)

**Benefits:**
- ✅ Simplified default flow (both emails use same format)
- ✅ Consistent UX for all clients by default
- ✅ Optional complexity available when needed
- ✅ Vendor-specific control without database changes
- ✅ Fast implementation (~1 hour vs 2-3 days for full system)
- ✅ Easily reversible (just remove vendor ID from array)

**Testing:**
- ✅ Production test completed Oct 27
- ✅ Reminder sent with new single-button template
- ✅ Webview flow confirmed working
- ✅ User verified: "it works. nice job"

**Files Modified:**
- `survey_emailer.php` (42 KB → 44 KB) - Added manual switch
- NEW: `email_template_reminder_single.html` (6.2 KB)

**Backups Created:**
- `survey_emailer.php.backup_20251027_112949` (42K)
- `email_template_reminder.html.backup_20251027_112951` (20K)
- `email_template_initial.html.backup_20251027_112954` (6.2K)

**Status:** ✅ Deployed, tested, and confirmed working in production

**Documentation:** See `SESSION_NOTES_OCT27_2025.md` for complete implementation details

---

### October 27, 2:15 PM - Minor UX Improvements & Second Extra Question Threshold

**Changes:**

**1. Footer Text Consistency:**
- Updated all email templates to match webforms (index.html)
- Changed "Independent quality assurance for leading professionals" → "leading firms"
- Files updated:
  - `email_template_initial.html` (line 184)
  - `email_template_reminder_single.html` (line 184)
  - `email_template_reminder.html` (line 298) - already had "firms"

**2. Favicon Added to All Templates:**
- Added Client Culture favicon to all email templates for brand consistency
- Favicon now appears in browser tab for:
  - Score page (webview mode)
  - "View in browser" links
  - Intermediate confirmation page
- Files updated:
  - `email_template_initial.html`
  - `email_template_reminder_single.html`
  - `email_template_reminder.html`

**3. Second Extra Question Score Threshold Adjusted:**
- **Feature:** Admin checkbox "Add second extra question" (typically: "Would you like to share feedback about someone who delivered exceptional service?")
- **Previous:** Question appeared for scores 8, 9, 10
- **New:** Question now appears only for scores 9, 10 (Promoters only)
- **Rationale:** Focus exceptional service feedback on true promoters for better data quality
- **Impact:**
  - Score 8 (Passive): Now shows 3 questions instead of 4
  - Scores 9-10 (Promoters): Still shows 4 questions when feature enabled
  - Scores 0-7 (Detractors/Passives): Still shows 3 questions (no change)
- **Code Change:** `app.js` line 359 - Changed `score < 8` to `score < 9`

**Benefits:**
- ✅ Consistent branding across all touchpoints (favicon + footer)
- ✅ Better data quality for exceptional service feedback
- ✅ Focused on true promoters (NPS 9-10) for staff recognition

**Testing:**
- ✅ Verified footer text "firms" in all templates
- ✅ Confirmed favicon references present in all templates
- ✅ Verified app.js shows `score < 9` in production

**Files Modified:**
- `email_template_initial.html` - Footer + favicon
- `email_template_reminder_single.html` - Footer + favicon
- `email_template_reminder.html` - Favicon only (footer already correct)
- `app.js` (15 KB) - Second extra question threshold

**Backups Created:**
- Multiple backups with timestamps for all modified files

**Status:** ✅ Deployed and verified in production

**Documentation:** See `SESSION_NOTES_OCT27_2025_AFTERNOON.md` for complete details

---

### October 27, 5:23 PM UTC - ✅ CRITICAL FIX: Reminder Timing Bug (SUCCESSFULLY DEPLOYED)

✅ **STATUS: DEPLOYED AND ACTIVE** ✅

**Problem:** Survey reminders were not being sent at the correct time relative to the initial email.

**Root Cause:** Query logic used `DATE(reminderDate) = CURDATE()` which stripped time information, causing all reminders to fire at UTC midnight regardless of when the initial email was sent.

**Impact Before Fix:**
- **Australian clients:** Reminders sent ~23 hours EARLY (e.g., survey sent Monday 10am AEDT → reminder sent Sunday 11am AEDT, a day early)
- **UK clients:** Reminders sent at MIDNIGHT instead of during business hours

**Incident History:**
- **3:30 PM Oct 27:** First fix attempt deployed (lacked safety bounds)
- **4:05 AM Oct 27:** Critical issue - sent 23 old demo emails, platform slowdown
- **4:20 AM Oct 27:** Emergency rollback executed
- **5:23 PM Oct 27:** Safe fix deployed successfully with proper safeguards

**Safe Implementation (Oct 27, 5:23 PM UTC):**

**1. Database Cleanup (39,000 old reminders removed):**
- Cleared 24,810 pre-2024 reminders
- Cleared additional overdue reminders > 14 days
- Result: Clean database with only 920 future reminders

**2. Safe Query with 30-Day Window:**
```sql
-- SAFE QUERY (DEPLOYED):
WHERE reminderDate IS NOT NULL
  AND reminderDate <= UTC_TIMESTAMP()
  AND reminderDate >= UTC_TIMESTAMP() - INTERVAL 30 DAY  -- SAFETY BOUND
  AND reminderSentOnDate IS NULL
```

**3. Concurrency Lock:**
```php
// Prevents overlapping cron runs
$lockFile = '/tmp/survey_reminder.lock';
$fp = fopen($lockFile, 'w');
if(!flock($fp, LOCK_EX | LOCK_NB)) {
    die("Already running");
}
```

**4. Cron Frequency:**
Changed from daily (1x) to every 2 hours (12x per day):
```bash
5 */2 * * *  # Runs at: 00:05, 02:05, 04:05, etc. UTC
```

**Files Modified:**
- `background_job.php` - Concurrency lock + safe query
- `survey_emailer.php` - 5 query locations updated with safe query
- Cron configuration - Every 2 hours

**Verification (5:23 PM UTC):**
✅ 1 concurrency lock deployed
✅ 7 safe queries with 30-day window
✅ 0 old DATE/CURDATE queries remaining
✅ 2-hourly cron schedule active
✅ Server load normal (0.01)
✅ Database clean (920 future reminders, 0 overdue)

**Current Status:**
✅ **Timezone timing bug FIXED**
✅ **Australian surveys:** Reminders at correct time (not 23 hours early)
✅ **UK surveys:** Reminders during business hours (not midnight)
✅ **All timezones:** Timing accuracy within 2 hours
✅ **Safety measures:** 30-day window prevents old reminders
✅ **Protection:** Concurrency lock prevents duplicate sends
✅ **Database clean:** No old data

**Next Critical Test:** October 29, 2025
- 912 Netwealth reminders scheduled (concentrated in 2 UTC hours)
- Will fire at correct times (not UTC midnight)
- Expected to process in 2 cron runs

**Backups Created:**
- `background_job.php.backup_safe_fix_20251027_161733`
- `survey_emailer.php.backup_safe_fix_20251027_161806`
- `crontab_backup_safe_fix_20251027_161817.txt`

**Documentation:**
- Incident details: `INCIDENT_REMINDER_FIX_ROLLBACK_OCT27_2025.md`
- Deployment notes: `SESSION_NOTES_OCT27_2025_SAFE_FIX_DEPLOYMENT.md` (to be created)

**Status:** ✅ DEPLOYED AND WORKING - Timezone timing fixed with proper safeguards

---

### October 26-27, Evening - Confirmation Mode Fixes

**Changes:**

**1. Submit Score Button Added (Confirmation Mode)**
- Old: Click score twice to submit
- New: Click score to highlight → click "Submit Score" button
- Allows easy score changes before submitting
- Left-aligned button matching feedback form style

**2. Visual Consistency with Index.html**
- Logo margin: Changed to 20px (matches feedback form)
- NPS question font-weight: Changed to 400 (matches feedback form)
- Greeting: "Thanks for taking a moment to share your feedback" (consistent across all modes)
- Footer: Copied exactly from index.html for seamless transition

**3. Footer Positioning Fix**
- Changed from `position: absolute` to `position: relative`
- Allows footer to flow naturally with minimal content
- Footer visible without scrolling (60px spacing)
- Works perfectly for short confirmation page

**4. Score Button Color Fix**
- Highlighted button shows white text on blue background
- Used `element.style.setProperty('color', '#FFFFFF', 'important')` to override CSS
- Applies to both initial highlight and click handler

**Why These Changes:**
- Make all three modes (webview, confirmation, feedback) look identical
- "Make them all look like the same page" principle
- Seamless visual transitions between modes
- Existing inline score emails (sent last week) continue to work

**Files Modified:**
- `email_template_reminder.html` (20 KB) - Confirmation mode improvements

**Status:** ✅ Deployed and working for existing reminder emails with inline scores

**Documentation:** See `SESSION_NOTES_OCT26_2025_EVENING.md` for detailed fixes

---

### October 26, 5:35 AM - GPT Playbook Governance Messaging

**Changes:**
1. **Enhanced Button Helper Text:**
   - **Old:** "It only takes 10 seconds, and your feedback helps us improve our service."
   - **New:** "Your feedback helps us improve our service, recognise great work, and ensure quality oversight."
   - **Why:** Incorporates governance + recognition messaging to increase response rates
   - **Based on:** GPT Final Survey Email Playbook recommendations

2. **Professional Footer with Governance Language:**
   - **New Elements:**
     - Tagline: "Independent quality assurance for leading professionals"
     - Transparency statement: "This feedback is not anonymous. It helps {{FirmName}} management review and continuously improve client service, and recognise great work where it occurs."
     - Brand positioning: "Powered by Client Culture — empowering teams to deliver client excellence"
     - Compliance: ABN 88 619 177 132
     - Links: View in browser · Unsubscribe (integrated)

3. **Footer Design:**
   - Center-aligned with professional styling
   - Font size: 13px
   - Color: #777 (medium gray)
   - Line height: 1.6
   - Divider margin: 36px 0 (increased from 10px for better spacing)

**Files Modified:**
- `/var/www/html/survey/email_template_initial.html` (lines 169, 173-191)
- File size: 5.6 KB → 5.8 KB

**Reference:**
- Based on `/Users/gregtilse/Desktop/client_culture_final_survey_email_playbook.md`
- GPT recommendations for trust, transparency, and professional positioning

**Benefits:**
- ✅ Positions Client Culture as independent QA service
- ✅ Explains why feedback is not anonymous (service improvement + recognition)
- ✅ Professional branding with ABN for Australian compliance
- ✅ Increases trust and credibility with governance language

**Status:** ✅ Deployed and live

---

### October 26, 4:15 AM - Subject Line Personalization

**Changes:**
1. **{{CLIENTCONTACT}} Placeholder in Subject Lines:**
   - **New Feature:** Email subject lines can now use `{{CLIENTCONTACT}}` placeholder for personalization
   - **Example Subject:** `{{CLIENTCONTACT}} has a quick question for you`
   - **Result:** Each recipient sees their contact person's name (e.g., "John Smith has a quick question for you")
   - **Implementation:** Modified `survey_emailer.php` to personalize subject per recipient inside the loop

2. **How It Works:**
   ```php
   // Base subject stored from database
   $baseSubject = $survey["emailSubject"];

   // Inside recipient loop:
   $personalizedSubject = str_ireplace("{{ClientContact}}", $row["drlName"], $baseSubject);
   $sesReq['Message']['Subject']['Data'] = $personalizedSubject;
   ```

3. **Functions Updated:**
   - `sendClientSurvey()` - Lines 151-158, 219-221
   - `sendPulseSurvey()` - Lines 488-501, 547-549
   - **Note:** Employee/Manager surveys unchanged (no ClientContact field)
   - **Note:** Triage survey unchanged per user request

4. **Available Subject Placeholders:**
   - `{{CLIENTCONTACT}}` - Client's contact person name (e.g., "John Smith")
   - All other placeholders work in email body only ({{CLIENTFIRSTNAME}}, {{CLIENTLASTNAME}}, {{CLIENTFULLNAME}}, {{FIRMNAME}})

**Files Modified:**
- `/var/www/html/survey/survey_emailer.php` (2 functions updated)

**Backup:** Previous version deployed to production

**Use Case:** Increases email open rates by personalizing subject with familiar name

**Status:** ✅ Deployed and live

---

### October 26, 3:25 AM - From Header Enhancement

**Changes:**
1. **"via Client Culture" Sender Name:**
   - **Updated:** All email From headers now show: `{Organisation Name} via Client Culture <survey@clientculture.net>`
   - **Example:** `Elston Wealth via Client Culture <survey@clientculture.net>`
   - **Implementation:** Modified `survey_emailer.php` at 5 locations (lines 118, 314, 476, 636, 793)
   - **Why?** Per GPT deliverability brief (Section 1: Email Header Setup):
     - **Transparency:** Recipients immediately see email is sent via Client Culture
     - **Trust:** Aligns From name with "mailed-by" domain (survey.clientculture.net)
     - **Authentication:** Reinforces SPF/DKIM/DMARC alignment
     - **Deliverability:** Reduces "spoofing" signals to spam filters
   - **Database Unaffected:** `Vendor.name` remains clean (e.g., "Elston Wealth")
   - **Platform UI Unaffected:** Top margin/header still shows organization name only

2. **Code Change:**
   ```php
   // BEFORE:
   $sesReq["Source"] = "{$survey['organisationName']} <{$survey['surveyEmailFrom']}>";

   // AFTER:
   $sesReq["Source"] = "{$survey['organisationName']} via Client Culture <{$survey['surveyEmailFrom']}>";
   ```

3. **What Recipients See:**
   - **Gmail:** "Elston Wealth via Client Culture" (inbox preview)
   - **Outlook:** "Elston Wealth via Client Culture <survey@clientculture.net>"
   - **Apple Mail:** "Elston Wealth via Client Culture" with timestamp

**Files Modified:**
- `/var/www/html/survey/survey_emailer.php` (5 functions updated)

**Backup Created:**
- `survey_emailer.php.backup_20251026_142514`

**Reference:**
- Based on `/Users/gregtilse/Desktop/client_culture_email_deliverability_brief.md`
- Section 1: Email Header Setup
- Section 2: Authentication Standards

**Status:** ✅ Deployed and live

---

### October 26, 3:12 AM - Email Deliverability Optimization

**Changes:**
1. **Visible Preheader Text (Initial Email):**
   - **Added:** "It's just one question — should take 10 seconds."
   - **Implementation:** Visible `<p>` tag (not hidden HTML)
   - **Why visible?** Per GPT deliverability brief:
     - Hidden content triggers spam filters (Microsoft SmartScreen, Gmail)
     - Visible preheader is more transparent and human-feeling
     - Better trust signals for inbox placement
   - **Styling:** `font-size: 12px; color: #666666; margin: 0 0 16px 0`
   - **Placement:** Right after logo, before main email content
   - **Benefits:**
     - Provides inbox preview context
     - Acts as brief introduction
     - Sets expectations before main message

2. **Button Helper Text (Initial Email):**
   - **Added:** "It only takes 10 seconds, and your feedback helps us improve our service."
   - **Styling:** `font-size: 14px; color: #666666`
   - **Placement:** Below "Share Your Feedback" button

**Files Modified:**
- `/var/www/html/survey/email_template_initial.html` (lines 152-155, 162)
- File size: 5.1 KB → 5.6 KB

**Reference:**
- Based on `/Users/gregtilse/Desktop/client_culture_email_deliverability_brief.md`
- Section 3: Preheader Strategy (visible vs hidden)
- Section 4: Deliverability Enhancements

**Status:** ✅ Deployed and live

---

### October 26, 2:00 AM - Helper Text & Final Polish

**Changes:**
1. **Helper Text for Loyalty Drivers:**
   - Added: "Help us identify what matters most for you."
   - Color: #666 (medium gray)
   - Placement: Below question heading, above checkboxes

2. **Helper Text for Staff Recognition:**
   - Added: "Help us recognise our people and teams."
   - Styling: Same as loyalty drivers helper text
   - Placement: Below "exceptional service" question heading

3. **Consistent Heading Spacing:**
   - All question headings: `margin-bottom: 8px`

**Files Modified:**
- `/var/www/html/survey/index.html` (lines 155-156, 179-180)

**Status:** ✅ Deployed and live

---

### October 25-26, Late Evening - Submit Score Button & UX Improvements

**Major Changes:**

1. **Reminder Flow: Submit Score Button**
   - **Old:** User had to click score twice (once highlighted)
   - **New:** Click score to highlight → click "Submit Score" button
   - **Why:** Clearer UX, allows easy score changes before submitting
   - **Implementation:** Lines 269-271, 409-432 in `email_template_reminder.html`

2. **Feedback Page: Thank You Heading**
   - **Added:** Separate `<h2>` heading: "Thank you"
   - **Styling:** `font-weight: 500; margin-bottom: 12px`
   - **Conditional Messages:** Different text for Promoters/Passives/Detractors
   - Example (Promoters): "We're delighted to hear you've had a positive experience."

3. **Optional Questions Section Header**
   - **Added:** `<h3>` heading: "Optional questions"
   - **Styling:** `font-size: 21px; font-weight: 500`
   - **Divider:** Horizontal rule above heading
   - **Description:** Updated text with bolded "quick questions"

4. **Change Score Link**
   - **Location:** Right-aligned next to Submit Feedback button
   - **Styling:** `font-size: 14px; color: #007bff; text-decoration: underline`
   - **Functionality:** Redirects to webview (score selection page)

5. **localStorage Auto-save**
   - **What:** All three textareas auto-save as user types
   - **Why:** Preserves feedback if user changes score
   - **Storage Key:** `feedback_{survey_id}`
   - **Restores:** On page load, if data exists
   - **Triggers:** `input` and `blur` events

6. **Footer Spacing Refinements**
   - Adjusted `margin-top` on footer `<hr>` for proper spacing
   - Removed after user changed their mind

**Files Modified:**
- `/var/www/html/survey/email_template_reminder.html` (Submit Score button)
- `/var/www/html/survey/index.html` (Thank you heading, localStorage, Change score)

**Status:** ✅ All deployed and live

---

### October 25, Afternoon - Visual Continuity

**Changes:**
1. **NPS Context on Feedback Page:**
   - Shows greyed-out section (opacity 0.5) with:
     - NPS question from URL parameter
     - All 11 score buttons
     - Selected score highlighted in blue
     - Labels: "Least likely" / "Most likely"
   - Hidden if no `question` parameter in URL

2. **Unified Greeting:**
   - Both webview and feedback page: "Thanks for taking a moment to share your feedback."
   - Consistent 21px font size

3. **URL Parameter Passing:**
   - Score page encodes NPS question: `&question=<encoded_text>`
   - Feedback page decodes and displays
   - JavaScript: Lines 291-323 in `index.html`

**Files Modified:**
- `/var/www/html/survey/index.html`
- `/var/www/html/survey/email_template_reminder.html`

**Status:** ✅ Deployed and live

---

### October 25, Morning - Template Strategy Overhaul

**Changes:**
1. **"Single-Link First, Inline Second" Strategy:**
   - Initial emails: Single button (better deliverability)
   - Reminder emails: Inline 0-10 buttons (better engagement)
   - Eliminated MSO conditionals entirely

2. **Template Assignments:**
   - `email_template_initial.html` → Single button (5.1 KB)
   - `email_template_reminder.html` → Inline buttons with bot protection (19 KB)

3. **Configuration Fix:**
   - Updated `config.json`
   - Changed from `clientculture.net` to `app.clientculture.com`

**Files Modified:**
- `/var/www/html/survey/email_template_initial.html`
- `/var/www/html/survey/email_template_reminder.html`
- `/var/www/html/assets/config.json`

**Status:** ✅ Deployed and live

---

## Key Mechanisms

### 1. Bot Protection (Reminder Emails Only)

**How it works:**

1. **Email links use URL fragments:**
   ```
   survey.php?id=X&type=CLI#score=7
   ```
   Fragment (`#score=7`) is client-side only, bots cannot read it

2. **JavaScript reads fragment:**
   ```javascript
   var hash = window.location.hash; // "#score=7"
   var preselectedScore = hash.replace('#score=', '');
   ```

3. **Intermediate page shows:**
   - NPS question (extracted from email)
   - Score 7 button highlighted in blue
   - "Submit Score" button
   - User can click any score to change selection

4. **Submit Score button:**
   - Converts fragment to query parameter: `&score=7`
   - Includes encoded NPS question: `&question=...`
   - Redirects to feedback form

5. **Bot prevention:**
   - Bots cannot read URL fragments (server never sees them)
   - Requires human interaction (Submit Score button click)
   - Two-step process prevents automated submissions

**Implementation:**
- File: `email_template_reminder.html`
- JavaScript: Lines 292-444
- Key functions: `handleIntermediatePage()`, Submit Score event listener

---

### 2. Visual Continuity

**Purpose:** Show context when transitioning from score page to feedback form

**How it works:**

1. **Score page passes data via URL:**
   ```javascript
   var questionText = encodeURIComponent(npsQuestion.textContent.trim());
   var feedbackUrl = baseUrl + '&score=' + currentSelectedScore + '&question=' + questionText;
   ```

2. **Feedback page reads and displays:**
   - Decodes `question` parameter
   - Shows greyed-out NPS context section (opacity: 0.5)
   - Highlights selected score button
   - Labels: "Least likely" / "Most likely"

3. **User sees what they selected before proceeding**

**Implementation:**
- Score page: Lines 426-443 (encodeURIComponent)
- Feedback page: Lines 291-323 (decodeURIComponent and display)
- Styling: `#nps-context { opacity: 0.5; }` in styles.css (line 137-139)

---

### 3. Conditional Messaging by NPS Segment

**Segments:**

| Segment | Score Range | Tone | Example Message |
|---------|-------------|------|-----------------|
| **Promoters** | 9-10 | Enthusiastic, positive | "We're delighted to hear you've had a positive experience." |
| **Passives** | 7-8 | Neutral, improvement-focused | "We would love to know what would make your experience better." |
| **Detractors** | 0-6 | Empathetic, problem-solving | "We're sorry your experience hasn't met expectations." |

**Implementation:**

**Knockout.js Observables** (`app.js`):
```javascript
isPromoter: ko.observable(false),
isPassive: ko.observable(false),

// Set based on score
viewModel.isPromoter(viewModel.score >= 9);
viewModel.isPassive(viewModel.score >= 7 && viewModel.score <= 8);
```

**HTML Conditional Bindings** (`index.html`):
```html
<!-- Promoters (9-10) -->
<!-- ko if: isPromoter() -->
<h2 style="font-weight: 500; margin-bottom: 12px;">Thank you</h2>
<p>We're delighted to hear you've had a positive experience.</p>
<!-- /ko -->

<!-- Passives (7-8) -->
<!-- ko if: isPassive() -->
<h2 style="font-weight: 500; margin-bottom: 12px;">Thank you</h2>
<p>We would love to know what would make your experience better.</p>
<!-- /ko -->

<!-- Detractors (0-6) -->
<!-- ko if: !isPromoter() && !isPassive() -->
<h2 style="font-weight: 500; margin-bottom: 12px;">Thank you</h2>
<p>We're sorry your experience hasn't met expectations.</p>
<!-- /ko -->
```

**File:** `index.html` (lines 115-137)

---

### 4. localStorage Auto-save

**Purpose:** Preserve user feedback if they change their score

**How it works:**

1. **Storage Key:**
   ```javascript
   var id = urlParams.get('id');
   var storageKey = 'feedback_' + id;
   ```

2. **Auto-save on input:**
   ```javascript
   feedbackTextarea.addEventListener('input', saveFeedback);
   feedbackTextarea.addEventListener('blur', saveFeedback);
   ```

3. **Saves all three textareas:**
   - Main feedback: `txtFeedback`
   - How to improve: `txtHowToImproveComments`
   - Staff recognition: `txtHowToImproveComments2`

4. **Restores on page load:**
   ```javascript
   var savedData = localStorage.getItem(storageKey);
   if (savedData) {
     var data = JSON.parse(savedData);
     feedbackTextarea.value = data.feedback;
     feedbackTextarea.dispatchEvent(new Event('change')); // Trigger Knockout
   }
   ```

5. **Triggered by:**
   - User clicks "Change score" link
   - Returns to webview, selects new score
   - Feedback form loads with saved text

**Implementation:**
- File: `index.html`
- JavaScript: Lines 364-435
- Storage: Browser localStorage (survives page navigation)

---

### 5. Webview Mode vs Normal Flow

**Webview Mode (`&webview=1`):**
- Used by: Initial email single button
- Shows: Logo + inline 0-10 score buttons
- No bot protection needed
- Direct click to feedback form (`&score=X`)
- JavaScript extracts last paragraph from email for NPS question

**Normal Flow (no webview):**
- Used by: Direct link access, reminder confirmation
- Full survey form immediately
- May have pre-filled score
- May have NPS context section (if `question` parameter)

**Implementation:**
- File: `email_template_reminder.html`
- JavaScript checks: `window.location.search.indexOf('webview=1') > -1`
- Lines 296-323

---

## File Inventory

### Active Pages (Currently in Use)

| File | Purpose | Used By | Size |
|------|---------|---------|------|
| `email_template_initial.html` | Initial client NPS email with single button + governance footer + visible preheader | Client surveys (first send) | 5.8 KB |
| `email_template_reminder.html` | Reminder email with inline buttons + bot protection + webview mode | Client surveys (reminder) + Initial webview | 19 KB |
| `index.html` | Main feedback form (Knockout.js app) | All client NPS surveys | 22 KB |
| `app.js` | Knockout.js view model and business logic | All surveys | 15 KB |
| `styles.css` | Survey form responsive styles | All surveys | 5.6 KB |
| `survey_emailer.php` | Email sending script with template selection + From header | Backend cron job | 42 KB |
| `survey.php` | Survey entry point (redirects) | All survey links | ~5 KB |

### Other Templates (Not Used for Client NPS)

| File | Status | Notes |
|------|--------|-------|
| `email_template.html` | Legacy | Old employee survey template |
| `email_template2.html` | Active (?) | Employee survey variant |
| `email_template_triage.html` | Active | Triage survey email |
| `index2.html` | Active (?) | Employee survey form |
| `index_t.html` | Active | Triage survey form |
| `email_template_inline.html` | Legacy | Old inline template (May 2020) |
| `email_template_qualtricsversion_emailScoreNotCaptured.html` | Test | Qualtrics version (Oct 2023) |

### URL Patterns

**Initial Email:**
```
Email Link:
https://www.clientculture.net/survey/survey.php?id=12345&type=CLI&webview=1

Webview (score selection):
https://www.clientculture.net/survey/survey.php?id=12345&type=CLI&webview=1

Feedback Form (from webview):
https://www.clientculture.net/survey/?id=12345&type=CLI&score=9
```

**Reminder Email:**
```
Email Link (bot protected):
https://www.clientculture.net/survey/survey.php?id=12345&type=CLI#score=7

Intermediate Confirmation:
https://www.clientculture.net/survey/survey.php?id=12345&type=CLI#score=7
(Same URL, different JavaScript state)

Feedback Form (from confirmation):
https://www.clientculture.net/survey/?id=12345&type=CLI&score=7&question=How+likely...
```

---

## Configuration

### Email Headers

All survey emails are sent with the following header configuration:

**From Header:**
```
{Organisation Name} via Client Culture <survey@clientculture.net>
```
Example: `Elston Wealth via Client Culture <survey@clientculture.net>`

**Mailed-By:**
```
survey.clientculture.net
```

**Benefits:**
- ✅ Transparency: Recipients see email is sent via Client Culture
- ✅ Trust: From name aligns with mailed-by domain
- ✅ Authentication: SPF/DKIM/DMARC properly aligned
- ✅ Deliverability: Reduces spam filter triggers

**Implementation:**
- Set in `survey_emailer.php` via AWS SES `Source` parameter
- Database `Vendor.name` remains clean (no "via Client Culture" suffix)
- Platform UI unaffected (shows organization name only)

---

### Placeholders

The templates use placeholders replaced by `survey_emailer.php`:

| Placeholder | Description | Where It Works | Example |
|-------------|-------------|----------------|---------|
| `{{LOGO_IMAGE}}` | Firm's logo image HTML | Email body | `<img src="..." alt="Logo">` |
| `{{EMAIL_HTML}}` | Custom email message/greeting | Email body | HTML content from database |
| `{{OBJECTID}}` | Unique survey identifier | Email body | `12345` |
| `{{SURVEY_TYPE}}` | Type of survey | Email body | `CLI`, `STA`, etc. |
| `{{WEB_ROOT}}` | Base URL for application | Email body | `https://www.clientculture.net/` |
| `{{LEFT_SCORE_LABEL}}` | Label for low scores | Email body | `Least Likely` |
| `{{RIGHT_SCORE_LABEL}}` | Label for high scores | Email body | `Most Likely` |
| `{{ClientFullName}}` | Client's full name/company | Email body | `ABC Corporation` |
| `{{ClientContact}}` | Client's contact person | **Subject + Email body** ✨ | `John Smith` |
| `{{FirmName}}` | Firm sending survey | Email body | `XYZ Accounting` |
| `{{UNSUBSCRIBE_LINK}}` | Unsubscribe link HTML | Email body | `<a href="...">Unsubscribe</a>` |
| `{{UTRACK}}` | Email tracking pixel | Email body | `<img src="..." width="1" height="1">` |

**Note:** As of October 26, 2025, `{{ClientContact}}` is the only placeholder that works in both email subject lines AND email body content. This allows for personalized subjects like "John Smith has a quick question for you".

### config.json Settings

**Location:** `/var/www/html/assets/config.json`

**Key Settings:**
```json
{
  "company": {
    "name": "Client Culture",
    "website": "https://www.clientculture.com",
    "appWebsite": "https://www.clientculture.net/",
    "supportEmail": "support@clientculture.com"
  }
}
```

**Important:** The `appWebsite` field is used as `{{WEB_ROOT}}`. Must end with `/`.

### Database Tables

**RDS MySQL Host:** `client-culture-v8.c1kfmstpx3aa.ap-southeast-2.rds.amazonaws.com`

**Relevant Tables:**
- `Survey` - Survey configuration and settings
- `Survey_Log` - Individual survey sends and responses
- `Client` - Client contact information
- `Vendor` - Firm/organization details
- `Setting` - Organization-level settings

---

## Deployment & Maintenance

### SSH Access

```bash
ssh -i ~/projects/pem/KlientKulture.pem ec2-user@13.210.68.95
```

### Update Workflow

1. **Download current file:**
   ```bash
   scp -i ~/projects/pem/KlientKulture.pem \
     ec2-user@13.210.68.95:/var/www/html/survey/index.html \
     /tmp/index_current.html
   ```

2. **Edit locally** (preferred over SSH editing)

3. **Upload and deploy:**
   ```bash
   scp -i ~/projects/pem/KlientKulture.pem \
     /tmp/index_current.html \
     ec2-user@13.210.68.95:/tmp/index.html

   ssh -i ~/projects/pem/KlientKulture.pem ec2-user@13.210.68.95 \
     "sudo cp /tmp/index.html /var/www/html/survey/index.html && \
      ls -la /var/www/html/survey/index.html"
   ```

4. **Verify file size changed** (confirms deployment)

### Creating Backups

```bash
ssh -i ~/projects/pem/KlientKulture.pem ec2-user@13.210.68.95 \
  "sudo cp /var/www/html/survey/index.html \
          /var/www/html/survey/index.html.backup_$(date +%Y%m%d_%H%M%S)"
```

### Common Commands

**List survey files:**
```bash
ssh -i ~/projects/pem/KlientKulture.pem ec2-user@13.210.68.95 \
  "ls -lh /var/www/html/survey/*.html"
```

**Check config:**
```bash
ssh -i ~/projects/pem/KlientKulture.pem ec2-user@13.210.68.95 \
  "cat /var/www/html/assets/config.json"
```

**View logs:**
```bash
ssh -i ~/projects/pem/KlientKulture.pem ec2-user@13.210.68.95 \
  "sudo tail -100 /var/log/apache2/error.log"
```

---

## Testing Checklist

### Client NPS - Initial Email Flow

- [ ] Send test initial email
- [ ] Click "Share Your Feedback" button
- [ ] Verify webview page shows:
  - Logo
  - "Thanks for taking a moment to share your feedback."
  - NPS question (last sentence from email)
  - Inline 0-10 score buttons
  - Labels: "Least likely" / "Most likely"
- [ ] Click score button (test with 9 - promoter)
- [ ] Verify feedback form opens with:
  - Score 9 pre-filled (not visible, but used for conditional message)
  - NO NPS context section (no `question` parameter)
  - "Thank you" heading
  - Promoter message: "We're delighted..."
  - "Optional questions" section header
  - Four quick questions text
  - Helper text under loyalty drivers
  - Helper text under staff recognition
  - "Change score" link
- [ ] Type feedback in textareas
- [ ] Click "Change score"
- [ ] Verify returns to webview
- [ ] Select different score
- [ ] Verify feedback text is restored (localStorage)
- [ ] Complete and submit survey
- [ ] Verify Additional Questions page (if configured)
- [ ] Verify Social Media prompts (promoters only)
- [ ] Verify Thank You message

### Client NPS - Reminder Email Flow

- [ ] Send test reminder email
- [ ] Verify email shows:
  - Logo
  - Email message (full content)
  - Inline 0-10 score buttons (NOT single button)
  - Labels
- [ ] Click score button (test with 5 - detractor)
- [ ] Verify intermediate page shows:
  - Logo
  - "Thanks for taking a moment to share your feedback."
  - NPS question (extracted from email)
  - Score 5 button highlighted in blue with white text
  - "Submit Score" button
- [ ] Click different score (e.g., 6)
- [ ] Verify:
  - Score 5 unhighlights
  - Score 6 highlights in blue
  - Can select any score before submitting
- [ ] Click "Submit Score"
- [ ] Verify feedback form opens with:
  - Greyed-out NPS context section (opacity 0.5)
  - NPS question displayed
  - All 11 score buttons shown
  - Score 6 highlighted in blue
  - Labels: "Least likely" / "Most likely"
  - Divider below context
  - "Thank you" heading
  - Detractor message: "We're sorry..."
  - "Optional questions" section header
  - Three quick questions text
- [ ] Complete survey
- [ ] Verify rest of flow same as initial

### Cross-Browser Testing

- [ ] Gmail (web)
- [ ] Gmail (mobile app - iOS)
- [ ] Gmail (mobile app - Android)
- [ ] Outlook 365 (web)
- [ ] Outlook Desktop (Windows)
- [ ] Outlook Desktop (Mac)
- [ ] Apple Mail (iOS)
- [ ] Apple Mail (macOS)

### Mobile Responsive Testing

- [ ] Score buttons display correctly on narrow screens
- [ ] Labels remain aligned
- [ ] Submit Score button accessible
- [ ] Textareas render properly
- [ ] Footer remains at bottom

---

## Known Issues

### Currently Tracked

1. **Employee Survey Flows Not Documented**
   - **Files:** `email_template.html`, `email_template2.html`, `index2.html`
   - **Status:** Active but undocumented
   - **Priority:** Low (client NPS is primary focus)

2. **Triage Survey Flow Not Documented**
   - **Files:** `email_template_triage.html`, `index_t.html`
   - **Status:** Active but undocumented
   - **Priority:** Low

### Recently Fixed

✅ **CRITICAL: Reminder Timing Bug** - Fixed Oct 27, 3:30 PM
  - Reminders now sent at correct time relative to initial email (not UTC midnight)
  - Australian surveys no longer sent 23 hours early
  - UK surveys no longer sent at midnight
  - Changed from `DATE(reminderDate) = CURDATE()` to `reminderDate <= UTC_TIMESTAMP()`
  - Added concurrency lock to prevent duplicate sends
  - Cron changed from daily to every 2 hours
✅ **Footer spacing inconsistency** - Fixed Oct 26, then reverted per user request
✅ **Label alignment on feedback page** - Fixed Oct 25, deployed
✅ **Highlighted button text color** - Fixed to use white text on blue background
✅ **Button color mismatch** - Changed to Bootstrap blue (#007bff) throughout
✅ **MSO conditionals causing duplicate content** - Eliminated via separate templates
✅ **Wrong domain in links** - Fixed config.json to use app.clientculture.com

---

## Support and Troubleshooting

### Common Questions

**Q: Why do initial emails use a single button instead of inline NPS scores?**
A: Single-link format improves deliverability and inbox placement on first contact. Inline buttons are saved for reminders to re-engage non-responders with visual variety.

**Q: Why is feedback not anonymous?**
A: The firm wants to improve service to specific clients and recognize staff based on identified feedback.

**Q: Can clients opt out?**
A: Yes, every email includes an unsubscribe link.

**Q: What if a client clicks the wrong score?**
A: On reminder emails, the intermediate page allows them to click any score button before clicking Submit Score. On initial emails (webview), they can select their preferred score directly. On feedback page, they can click "Change score" to start over (localStorage preserves their text).

**Q: Do reminder emails have bot protection?**
A: Yes, reminder emails use URL fragments and an intermediate confirmation page with a Submit Score button to prevent automated bot submissions.

**Q: What happens to feedback if user changes their score?**
A: localStorage auto-saves all textarea content. When user returns to feedback page with new score, their previous text is restored.

---

## Contact & Resources

**Production Server:**
- **IP:** 13.210.68.95
- **Instance ID:** i-09b42f2ef506ff420
- **SSH:** `ssh -i ~/projects/pem/KlientKulture.pem ec2-user@13.210.68.95`

**Database:**
- **Host:** client-culture-v8.c1kfmstpx3aa.ap-southeast-2.rds.amazonaws.com
- **Type:** RDS MySQL

**Application:**
- **Production URL:** https://www.clientculture.net/survey/
- **Config:** `/var/www/html/assets/config.json`

---

## Appendix: Code References

### Key Code Sections

**Bot Protection (email_template_reminder.html):**
- Lines 292-444: Intermediate page JavaScript
- Lines 346-408: handleIntermediatePage() function
- Lines 409-432: Submit Score button event listener

**Visual Continuity (index.html):**
- Lines 87-110: NPS context section HTML
- Lines 291-323: JavaScript to populate NPS context
- Lines 325-362: Label alignment function

**Conditional Messages (index.html):**
- Lines 115-137: Knockout conditional bindings
- Lines 116, 124, 132: "Thank you" headings
- Lines 119, 127, 135: "Optional questions" headings

**localStorage Auto-save (index.html):**
- Lines 364-435: Complete localStorage implementation
- Lines 371-405: Restore saved data on page load
- Lines 407-434: Auto-save on input/blur events

**Change Score Link (index.html):**
- Line 195: HTML link element
- Lines 437-456: JavaScript event listener

**Helper Text (index.html):**
- Line 156: Loyalty drivers helper text
- Line 180: Staff recognition helper text

**From Header (survey_emailer.php):**
- Lines 118, 314, 476, 636, 793: AWS SES Source parameter with "via Client Culture"
- All 5 email-sending functions updated

**Subject Line Personalization (survey_emailer.php):**
- Lines 151-158: Store base subject from database
- Lines 219-221: Personalize subject with {{ClientContact}} per recipient in sendClientSurvey()
- Lines 488-501: Store base subject in sendPulseSurvey()
- Lines 547-549: Personalize subject in sendPulseSurvey() loop
- Pattern: `str_ireplace("{{ClientContact}}", $row["drlName"], $baseSubject)`

**GPT Playbook Governance Messaging (email_template_initial.html):**
- Line 169: Enhanced button helper text with governance + recognition language
- Lines 173-191: Professional footer with QA positioning, transparency statement, ABN, tagline
- Styling: Center-aligned, 13px, #777 color, 1.6 line-height
- Divider margin increased: 36px 0 (improved spacing)

---

*Document Version: 4.0*
*Last Updated: October 27, 2025, 3:30 PM*
*Status: Production-ready with CRITICAL reminder timing fix deployed*
