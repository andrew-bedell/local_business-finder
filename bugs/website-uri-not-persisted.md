# Bug: Website URI Not Persisted to Database

**Severity:** High
**File:** `app.js` (lines ~800, 439-466)

## Description
The Google Places API returns `websiteURI` for each business, and the app uses it to filter (no-website businesses), but it is never saved to the `website` column in the database.

## Details
- `mapPlaceToResult()` captures `place.websiteURI` as `website` on the in-memory object
- `saveBusiness()` does not include `website` in the row sent to Supabase
- The schema defines a `website` column on the `businesses` table

## Expected Behavior
The `website` field (even if empty string) should be saved to distinguish between "has no website" and "website not checked."

## Impact
- Cannot query the database for businesses without websites
- Loses the core filtering information that the pipeline depends on
