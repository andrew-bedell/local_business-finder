# Bug: Review Author Fields Save Empty String Instead of NULL

**Severity:** Low
**File:** `app.js` (saveBusiness review mapping)

## Description
When saving reviews without author attribution, the code saves empty strings (`''`) for `author_name` and `author_photo_url` instead of `null`. The schema allows NULL for these columns, but empty strings make it impossible to distinguish between "no attribution provided" and "attribution provided but empty."

## Details
```javascript
author_name: r.authorAttribution ? r.authorAttribution.displayName || '' : '',
author_photo_url: r.authorAttribution ? r.authorAttribution.photoURI || '' : '',
```

## Expected Behavior
Save `null` when author data is unavailable:
```javascript
author_name: r.authorAttribution?.displayName || null,
author_photo_url: r.authorAttribution?.photoURI || null,
```

## Impact
- Minor data quality issue
- Queries filtering `WHERE author_name IS NULL` won't find anonymous reviews
- Could cause issues with the review upsert unique constraint (if added) since empty strings and NULLs behave differently in UNIQUE constraints

## Resolution
Changed the review mapping in `saveBusiness()` to use optional chaining with `|| null` fallback: `r.authorAttribution?.displayName || null` and `r.authorAttribution?.photoURI || null`. Missing or empty author data now stores `null` in the database.
