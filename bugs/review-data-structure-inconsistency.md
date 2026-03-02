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
