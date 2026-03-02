# Supabase Database Integration

## Summary
Save discovered businesses to a Supabase PostgreSQL database for persistent storage and later pipeline processing.

## Details
- Supabase JS SDK v2 is loaded via CDN
- Businesses can be saved individually ("Save" button per row) or in bulk ("Save All")
- Uses upsert with `place_id` as the conflict key to avoid duplicates
- Saved business IDs are loaded on init to show which businesses are already in the database

## Key Files
- `app.js` — `loadSavedIds()`, `saveBusiness()`, `saveAllBusinesses()`
- `database/schema.sql` — Full database schema (source of truth)

## Data Saved
- Core business fields: name, address, phone, rating, review count, status
- Google-specific: place ID, Maps URL, types array, hours
- Search context: search location, search type

## Dependencies
- Supabase JS SDK v2 (CDN)
- Supabase project with the schema from `database/schema.sql`
