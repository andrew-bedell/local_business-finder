# Results Table Display

## Summary
Renders search results in a sortable, filterable table with business details and action buttons.

## Details
- Results are displayed in a responsive table format
- Users can filter results by text search
- Users can sort results by name, rating, or review count
- Each row shows: business name, address, phone, rating (star display), review count, status, and action buttons
- "View" button opens a detail modal; "Save" button persists to Supabase

## Key Files
- `app.js` — `showResults()`, `applyFilterAndSort()`, `renderTable()`
- `styles.css` — Table styling, responsive breakpoints

## Features
- Text-based filtering across all visible columns
- Sort by multiple fields
- Star rating visual display
- Business status badges (Operational, Closed Temporarily, etc.)
- "No website" badge indicator
