# Changelog

All notable changes to this project will be documented in this file.

## [2025-10-30] - PURL Response Rate Fix

### Problem
When vendors created both email surveys and PURLs (Personalized URLs) for the same client list, the dashboard response rates were incorrectly calculated. For example:
- 1,000 emails sent
- 1,000 PURLs created
- 500 responses received
- **Incorrect calculation**: 500 / 2,000 = 25% response rate
- **Correct calculation**: 500 / 1,000 = 50% response rate

The issue was that PURLs were being counted in the denominator (total surveys sent) even though they are not emailed - they are downloadable spreadsheets that vendors distribute manually.

### Solution
Added `AND sl.emailId IS NOT NULL` filter to SQL queries that calculate response rates. This works because:
- **PURLs**: Created with `emailId = NULL` (never sent via email)
- **Regular emails**: Get `emailId` populated by AWS SES when sent (e.g., from `emailer.php` lines 280, 439, 608, 765, 925)

### Files Changed

#### `/src/api/routes/_api.php` (Line 44)
**Endpoint**: `/quarterly_results` (External API for client reporting)

```php
// BEFORE:
"WHERE sl.vendorId = '$vendorId' AND sl.sentOnDate IS NOT NULL " .

// AFTER:
"WHERE sl.vendorId = '$vendorId' AND sl.sentOnDate IS NOT NULL AND sl.emailId IS NOT NULL " .
```

#### `/src/api/routes/_views.php` (Lines 157, 196, 360)
**Endpoint**: `/dashboardForLoggedUser` (Internal dashboard API)

**Line 157** - Staff responses query:
```php
"WHERE sl.vendorId='$vendorId' AND c.isDeleted = 0 AND sl.isDeleted=0 AND s.type=0 AND sl.emailId IS NOT NULL " .
```

**Line 196** - Organization responses query:
```php
"WHERE sl.vendorId='$vendorId' AND c.isDeleted = 0 AND sl.isDeleted=0 AND s.type=0 AND sl.emailId IS NOT NULL $whereClause " .
```

**Line 360** - Insights by group query:
```php
"WHERE sl.vendorId='$vendorId' AND c.isDeleted = 0 AND sl.isDeleted=0 AND s.type=0 AND sl.emailId IS NOT NULL AND u.active=1 " .
```

### Impact
- **Retroactive**: Fix applies to all historical data automatically
- **Dashboard**: Response rates now accurately reflect email-only surveys
- **Reports**: Quarterly results API now excludes PURLs from response rate calculations
- **No Breaking Changes**: External API functionality remains the same, just with more accurate numbers

### Testing
Verified with MySQL Workbench query on October 2025 data:
```sql
SELECT
    COUNT(*) as total_surveys,
    COUNT(emailId) as has_emailId,
    COUNT(*) - COUNT(emailId) as null_emailId
FROM Survey_Log
WHERE sentOnDate IS NOT NULL
    AND YEAR(sentOnDate) = 2025
    AND MONTH(sentOnDate) = 10;

-- Results: 5,938 total | 3,511 emails | 2,427 PURLs
```

### Deployment
- Deployed: 2025-10-30
- Server: `clientculture.net`
- Deployed files:
  - `/var/www/html/api/routes/_api.php`
  - `/var/www/html/api/routes/_views.php`
- No Apache restart required (PHP files hot-reload)
- Verified: Dashboard response rates updated immediately after deployment

### Database Schema Reference
**Survey_Log table** relevant fields:
- `objectId` - Primary key
- `emailId` - AWS SES Message ID (NULL for PURLs, populated for emails)
- `sentOnDate` - Date survey was sent
- `score` - NPS score (0-10, NULL if not responded)
- `clientId` - Foreign key to Client table
- `vendorId` - Foreign key to Vendor
