# Bug: No Validation on business_status Before Database Save

**Severity:** Low
**File:** `app.js` (line ~841), `database/schema.sql` (lines ~47-53)

## Description
The `business_status` value from Google Places API is saved directly to the database without validation against the schema's CHECK constraint.

## Details
- Schema defines: `CHECK (business_status IN ('OPERATIONAL', 'CLOSED_TEMPORARILY', 'CLOSED_PERMANENTLY', 'UNKNOWN'))`
- App saves `place.businessStatus` directly with no validation
- If Google returns an unexpected value (e.g., a new status type), the database INSERT will fail

## Expected Behavior
- Validate `business_status` against allowed values before saving
- Default to `'UNKNOWN'` if the value doesn't match any expected status
- Log unexpected values for monitoring

## Impact
- Database save fails silently if Google introduces new status values
- Relatively low probability but causes hard-to-diagnose failures

## Resolution
**Fixed on 2026-03-02.**
- Added `VALID_BUSINESS_STATUSES` constant array with the 4 allowed values
- `saveBusiness()` now validates `place.status` against this list before saving
- Unknown/unexpected values default to `'UNKNOWN'`
- **Files changed:** `app.js` (`saveBusiness()`)
