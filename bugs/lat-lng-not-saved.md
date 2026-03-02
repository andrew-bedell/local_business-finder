# Bug: Latitude/Longitude Not Saved to Database

**Severity:** Critical
**File:** `app.js` (lines ~692, 439-466)

## Description
The geocoding step retrieves latitude and longitude coordinates, but they are never included in the data saved to the database.

## Details
- `geocodeLocation()` returns coordinates used for the `searchNearby()` call
- The `saveBusiness()` function does not include `latitude` or `longitude` in the upsert row
- The schema defines both as `DECIMAL(10, 7)` columns

## Expected Behavior
Latitude and longitude should be captured from either the geocoding result or the place details and saved to the `businesses` table.

## Impact
- Location-based queries on saved businesses are impossible
- Map features in the Generate phase will not work
- Prevents distance calculations between businesses
