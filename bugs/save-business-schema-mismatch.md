# Bug: saveBusiness Field Names Don't Match Database Schema

**Severity:** Critical
**File:** `app.js` (lines ~439-466)

## Description
The `saveBusiness()` function saves fields that don't exist in the database schema, causing Supabase upsert failures.

## Details
1. **`reviews` field** — saves reviews as a flat JSON column on the `businesses` table, but the schema has no `reviews` column. Reviews should be saved to the separate `business_reviews` table.
2. **`address` field** — saves as `address`, but the schema defines `address_full` (plus parsed components: `address_street`, `address_city`, `address_state`, `address_zip`).

## Expected Behavior
- Reviews should be saved individually to `business_reviews` table with proper foreign key references
- Address should be saved as `address_full` to match the schema

## Steps to Reproduce
1. Search for businesses
2. Click "Save" on any result
3. Check browser console for Supabase error (column does not exist)

## Impact
Businesses may fail to save to the database entirely, while the UI shows a success toast.
