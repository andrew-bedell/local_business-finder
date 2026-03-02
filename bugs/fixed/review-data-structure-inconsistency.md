# Bug: Review Data Structure Inconsistency

**Severity:** Medium
**File:** `app.js` (lines ~823-832, 453-458)

## Description
The review data structure differs between `mapPlaceToResult()` and `saveBusiness()`, causing data loss and potential errors.

## Details
- `mapPlaceToResult()` normalizes reviews with fields: `text`, `rating`, `relativePublishTimeDescription`, `authorAttribution` (object with `displayName` and `photoURI`)
- `saveBusiness()` re-maps reviews with different fields: `text`, `rating`, `time` (renamed), `author` (flattened to string)
- The author's `photoURI` is lost during the save transformation
- Field name `relativePublishTimeDescription` becomes `time` with no documentation

## Expected Behavior
- Use a single, consistent review data structure throughout the application
- Preserve all available data (including author photo URI)
- Align with the `business_reviews` table schema for eventual proper persistence

## Resolution
**Fixed on 2026-03-02.**
- Eliminated the re-mapping in `saveBusiness()` — reviews are no longer flattened to a different format
- Reviews are now saved directly to the `business_reviews` table using the normalized structure from `mapPlaceToResult()`, mapped to schema columns: `author_name`, `author_photo_url`, `rating`, `text`, `published_at`
- All data from `mapPlaceToResult()` is preserved including `authorAttribution.photoURI`
- **Files changed:** `app.js` (`saveBusiness()`)
