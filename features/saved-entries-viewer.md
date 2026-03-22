# Saved Entries Viewer

## Summary
A dedicated view within the app to browse, search, filter, and manage all businesses saved to Supabase — turning the database from write-only to fully interactive.

## Status
Not Started

## Priority
High — Prerequisite for Prospect-to-Customer Pipeline and all downstream management features.

## Details

### Problem
Currently the app can save businesses to Supabase but has no way to view them. The database is effectively write-only from the UI. Users must query Supabase directly to see saved data.

### Solution
Add a "Saved Businesses" view accessible from the main app. This is not a separate HTML page — it's a new section in `index.html` that toggles visibility with the search results section, consistent with the existing single-page pattern.

### UI Design

**Navigation:**
- Add a simple toggle/tab in the header or above the results area: "Search" | "Saved"
- Clicking "Saved" hides search form + results and shows the saved entries view
- Clicking "Search" returns to the current search experience
- Active tab uses `--primary` color; inactive uses `--text-muted`

**Saved Entries View:**
- Card container (`.card`) with header "Saved Businesses" and count badge
- Filter bar (reuse `.input` styling):
  - Text search (name, address, phone — client-side filter on loaded data)
  - Category dropdown (populated from distinct `category` values in data)
  - Status dropdown: All | Operational | Closed Temporarily | Closed Permanently
  - Pipeline status dropdown: All | Prospect | Customer | Churned (future — once Prospect-to-Customer Pipeline is built)
  - Sort: Name A-Z | Name Z-A | Rating High-Low | Newest Saved | Data Completeness
- Results table (reuse `.results-table` pattern):
  - Columns: Name, Address, Phone, Rating, Reviews, Category, Status, Saved Date, Actions
  - Actions: View (opens detail modal), Edit (future), Delete
- Pagination or "Load More" button if > 50 entries
- Empty state message when no saved businesses exist

**Data Loading:**
- On tab switch to "Saved", fetch from Supabase: `supabase.from('businesses').select('*').order('created_at', { ascending: false })`
- Cache the loaded data in memory to avoid refetching on every tab switch
- "Refresh" button to force re-fetch
- Show loading spinner during fetch

### Behavior

1. Tab switch to "Saved" triggers data load (or uses cached data if recent)
2. Filters apply client-side on the loaded dataset (no server-side filtering needed at this scale)
3. "View" button opens the existing detail modal with business data
4. "Delete" button shows confirmation, then calls `supabase.from('businesses').delete().eq('id', businessId)` with cascade
5. Count badge updates as filters change
6. All text strings go through `t()` for i18n

### Database Query

Primary query for the saved entries list:
```sql
SELECT id, place_id, name, address_full, phone, rating, review_count,
       category, business_status, data_completeness_score, created_at
FROM businesses
ORDER BY created_at DESC
```

No new tables required. This feature reads from the existing `businesses` table.

### Detail Modal Enhancement

When viewing a saved business from the Saved Entries view, the detail modal should display:
- All data currently shown (photos, reviews, hours, contact)
- Additionally: social profiles (from `business_social_profiles`), data completeness score
- A "last updated" timestamp
- Link to Google Maps

This reuses `openDetailModal()` but may need to accept a database row (not just an in-memory search result object) as input.

## Key Files
- `index.html` — New HTML section for saved entries view, navigation tabs
- `app.js` — New functions: `loadSavedBusinesses()`, `renderSavedTable()`, `filterSavedBusinesses()`, `deleteBusiness()`
- `styles.css` — Tab navigation styles (minimal — reuse existing patterns)

## Dependencies
- Supabase integration must be working (it is, despite bugs)
- Fix `save-business-schema-mismatch` bug first for meaningful saved data

## i18n Keys Needed
- `savedBusinesses` — "Saved Businesses"
- `savedTab` — "Saved"
- `searchTab` — "Search"
- `savedCount` — "{0} businesses saved"
- `savedEmpty` — "No saved businesses yet. Search and save businesses to see them here."
- `savedLoading` — "Loading saved businesses..."
- `savedRefresh` — "Refresh"
- `savedDelete` — "Delete"
- `savedDeleteConfirm` — "Delete this business? This cannot be undone."
- `savedDeleteSuccess` — "Business deleted"
- `savedFilterCategory` — "All Categories"
- `savedFilterStatus` — "All Statuses"
- `savedSortNewest` — "Newest Saved"
- `savedSortCompleteness` — "Data Completeness"
