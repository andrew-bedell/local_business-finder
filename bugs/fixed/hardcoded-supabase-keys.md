# Bug: Hardcoded Supabase Credentials in Source Code

**Severity:** Medium
**File:** `app.js` (lines ~420-421)

## Description
The Supabase URL and publishable key are hardcoded directly in the JavaScript source code.

## Details
```javascript
const SUPABASE_URL = 'https://xagfwyknlutmmtfufbfi.supabase.co';
const SUPABASE_KEY = 'sb_publishable_...';
```

- While publishable keys have limited permissions (read-only by default with RLS), embedding them in source is a security concern
- Keys cannot be rotated without updating and redeploying the source code
- Any user inspecting the source can see the project URL and key

## Expected Behavior
- Load Supabase credentials from environment variables or a server endpoint (similar to the `api/config.js` pattern used for the Google API key)
- Or prompt the user to enter their own Supabase credentials (matching the API key management pattern)

## Impact
- Security risk if RLS policies are misconfigured
- Credential rotation requires code changes

## Resolution
**Fixed on 2026-03-02.**
- Extended `api/config.js` to serve `SUPABASE_URL` and `SUPABASE_ANON_KEY` from environment variables alongside the Google API key
- Added `initSupabaseFromConfig(url, key)` function in `app.js` to re-initialize the Supabase client with server-provided credentials
- `fetchApiKeyFromServer()` now checks for Supabase credentials in the response and re-initializes the client if present
- Hardcoded values remain as fallbacks for local development when the server endpoint is unavailable
- Renamed hardcoded constants to `SUPABASE_URL_FALLBACK` and `SUPABASE_KEY_FALLBACK` to clarify their role
- **Files changed:** `app.js` (Supabase init, `fetchApiKeyFromServer()`), `api/config.js`
