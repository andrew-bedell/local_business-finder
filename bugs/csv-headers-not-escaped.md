# Bug: CSV Export Headers Not Escaped

**Severity:** Low
**File:** `app.js` (exportCsv function)

## Description
CSV column headers use translated strings via `t()` but are not run through `csvEscape()`. If a translation contains commas, quotes, or newlines, the exported CSV will be malformed.

## Details
```javascript
const headers = ['#', t('thName'), t('thAddress'), t('thPhone'), t('thRating'), t('thReviews'), t('thStatus'), 'Google Maps URL'];
```

Current EN/ES translations are safe, but any future translation containing a comma (e.g., `"Nombre, Negocio"`) would break the CSV structure.

## Expected Behavior
Apply `csvEscape()` to header values:
```javascript
const headers = ['#', t('thName'), t('thAddress'), t('thPhone'), t('thRating'), t('thReviews'), t('thStatus'), 'Google Maps URL'].map(csvEscape);
```

## Impact
Low — current translations are safe. Risk increases as more languages are added.
