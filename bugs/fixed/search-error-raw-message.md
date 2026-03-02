# Bug: Search Error Shows Raw Error Message to User

**Severity:** Medium
**File:** `app.js` (line ~724)

## Description
When the main search flow catches an error, it displays the raw `err.message` directly to the user via `updateProgress()` instead of using a translated string through `t()`.

## Details
```javascript
} catch (err) {
  console.error('Search error:', err);
  updateProgress(0, `Error: ${err.message || 'An unexpected error occurred.'}`);
}
```

- The error message is always in English regardless of the selected language
- Raw error messages from Google APIs can be technical and confusing to users
- Violates the error handling pattern: "Never show raw error messages to the user. Always use `t()` for user-facing text."

## Steps to Reproduce
1. Set language to Spanish
2. Trigger a search error (e.g., use an invalid API key, disconnect network mid-search)
3. Observe the English error message in the progress section

## Expected Behavior
- Display a user-friendly, translated error message using `showToast(t('searchError'), 'error')` or `updateProgress(0, t('searchError'))`
- Log the technical details to `console.error` only

## Impact
- Spanish-language users see English error messages
- Technical API error strings exposed to non-technical users
- Inconsistent with error handling rules documented in CLAUDE.md

## Resolution
**Fixed on 2026-03-02.**
- Replaced `updateProgress(0, \`Error: \${err.message}\`)` with `updateProgress(0, t('searchError'))`
- Added `searchError` translation key to both EN and ES translations
- Raw error details are still logged to `console.error` for debugging
- **Files changed:** `app.js` (`startSearch()` catch block, EN/ES translations)
