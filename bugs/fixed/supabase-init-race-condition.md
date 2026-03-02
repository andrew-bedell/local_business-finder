# Bug: Race Condition in Supabase Client Initialization

**Severity:** Medium
**File:** `app.js` (init, fetchApiKeyFromServer, loadSavedIds)

## Description
`init()` calls `loadSavedIds()` synchronously at startup, then calls `fetchApiKeyFromServer()` asynchronously. If the server provides different Supabase credentials, the first `loadSavedIds()` call uses the hardcoded fallback credentials, and a second `loadSavedIds()` runs after re-initialization. This creates a race condition where the `savedPlaceIds` Set may contain stale data from the wrong Supabase instance.

## Details
```javascript
function init() {
  // ...
  loadSavedIds();           // runs immediately with fallback credentials
  // ...
  fetchApiKeyFromServer();  // async, may re-init Supabase and call loadSavedIds() again
}
```

In `fetchApiKeyFromServer()`:
```javascript
if (data.supabaseUrl && data.supabaseKey) {
  initSupabaseFromConfig(data.supabaseUrl, data.supabaseKey);  // Re-creates client
  loadSavedIds();  // Loads again with new credentials
}
```

## Steps to Reproduce
1. Deploy with `SUPABASE_URL` and `SUPABASE_ANON_KEY` env vars pointing to a different Supabase project than the hardcoded fallback
2. Open the app — `loadSavedIds()` fires twice with different credentials
3. The first call may fail or return wrong data

## Expected Behavior
Only call `loadSavedIds()` once, after the final Supabase client has been determined. Move the `loadSavedIds()` call from `init()` into `fetchApiKeyFromServer()` (in both the success and fallback paths).

## Impact
- Minor in practice: if both point to the same Supabase project, no visible issue
- If credentials differ, the savedPlaceIds Set may have incorrect entries, causing "Save" buttons to show "Saved" for businesses not actually saved in the active database

## Resolution
Removed the `loadSavedIds()` call from `init()`. Moved it into `fetchApiKeyFromServer()` so it runs exactly once after the final Supabase client is determined — in the success path (after potential re-init with server credentials), in the non-OK response path, and in the catch path (server unavailable). This ensures `savedPlaceIds` is always loaded from the correct Supabase instance.
