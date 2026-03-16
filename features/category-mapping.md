# Business Category & Subcategory Mapping

**Phase:** Gather
**Status:** Complete

## Summary
Maps Google Places `types[]` array to clean `category` and `subcategory` values for template selection, audience filtering, and display.

## Details
- `CATEGORY_MAP` constant maps 80+ Google Places type strings to `{ category, subcategory }` pairs
- `mapTypesToCategory(types, fallback)` function picks the most specific match (prefers entries with a subcategory)
- `formatCategory(place)` returns display string like "Restaurant > Mexican Cuisine"
- Categories: Restaurant, Salon, Healthcare, Contractor, Automotive, Retail, Professional Services, Services, Hospitality
- Falls back to search type if no Google types match

## Key Files
- `employee/app.js` — `CATEGORY_MAP`, `mapTypesToCategory()`, `formatCategory()`, updated `saveBusiness()`, table rendering, detail modal
- `employee/admin.html` — Updated filter dropdown to use clean category names
- `employee/admin.js` — Filter now queries `category` column instead of `types` array

## Dependencies
- None — uses existing `category` and `subcategory` columns in `businesses` table
