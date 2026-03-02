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
