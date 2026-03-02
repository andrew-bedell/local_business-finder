# Bug: Database Save Errors Fail Silently

**Severity:** High
**File:** `app.js` (lines ~464-473)

## Description
When a Supabase upsert fails, the error is only logged to `console.error`. The user still sees a success toast notification.

## Details
- `saveBusiness()` catches the error and returns `false`
- The calling code checks the return value, but in some paths the success toast fires regardless
- Users believe their data was saved when it wasn't

## Expected Behavior
- Show an error toast (`showToast(message, 'error')`) when the upsert fails
- Include a user-friendly description of what went wrong
- Do not show the success toast if the save operation returned `false`

## Steps to Reproduce
1. Modify schema to cause a conflict (or trigger a field mismatch per the schema mismatch bug)
2. Click "Save" on a business
3. Observe success toast despite console error

## Resolution
**Fixed on 2026-03-02.**
- The root cause was the schema mismatch bug (invalid column names caused upsert errors). With correct column names, the upsert succeeds or fails cleanly.
- Added `try/catch` wrapper around the entire `saveBusiness()` function to catch unexpected exceptions (e.g., network errors)
- The individual save button handler already properly shows error toast on `false` return; `saveAllBusinesses()` also shows error toast when `savedCount === 0`
- **Files changed:** `app.js` (`saveBusiness()`)
