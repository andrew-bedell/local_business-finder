# Bug: Review Upsert Uses Non-Existent Unique Constraint

**Severity:** Critical
**File:** `app.js` (saveBusiness, review upsert), `database/schema.sql` (business_reviews table)

## Description
The `saveBusiness()` function upserts reviews to `business_reviews` with `onConflict: 'business_id,source,author_name,text'`, but the `business_reviews` table has no UNIQUE constraint on those columns. Supabase will reject the upsert because it cannot find a matching conflict target.

## Details
```javascript
const { error: reviewError } = await supabaseClient
  .from('business_reviews')
  .upsert(reviewRows, { onConflict: 'business_id,source,author_name,text' });
```

The `business_reviews` table only has:
- Primary key on `id` (UUID)
- Index on `business_id` (not unique)
- Index on `sentiment_label` (not unique)
- Partial index on `is_curated` (not unique)

No composite unique constraint exists.

## Steps to Reproduce
1. Search for businesses
2. Click "Save" on any business with reviews
3. Check browser console — Supabase will return an error about missing unique constraint

## Expected Behavior
Either:
1. Add `UNIQUE (business_id, source, author_name, text)` constraint to `business_reviews` in schema.sql
2. Or change the upsert to a plain `.insert()` (accepting duplicate reviews on re-save)

## Impact
All review saves silently fail. Reviews are never persisted to the database despite the business record saving successfully.

## Resolution
Added a `review_hash` column to `business_reviews` with a `UNIQUE (business_id, review_hash)` constraint in `schema.sql`. The hash is a client-computed fingerprint of `source + author_name + text` using a simple string hash function (`reviewHash()` in app.js). Updated `saveBusiness()` to compute and include `review_hash` in review rows and changed `onConflict` to `'business_id,review_hash'`. This avoids index size issues with long review text and handles NULL author names cleanly.
