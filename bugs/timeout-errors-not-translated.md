# Bug: Timeout Error Messages Not Translated

**Severity:** Low
**File:** `app.js` (lines ~763-771)

## Description
Error messages from the `withTimeout()` wrapper are hardcoded in English and not passed through the i18n system.

## Details
```javascript
setTimeout(() => reject(new Error(
  `${label} timed out after ${ms / 1000}s. Check your API key and network connection.`
)), ms)
```

- The message is always in English regardless of the selected language
- Spanish-language users see mixed English/Spanish error messages
- The error text is technical and not user-friendly

## Expected Behavior
- Timeout error messages should use `t('timeoutError', label, seconds)` with translations in both EN and ES
- Error messages shown in toasts should be user-friendly in both languages

## Impact
- Poor UX for Spanish-language users
- Inconsistent language experience
