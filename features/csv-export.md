# CSV Export

## Summary
Export the current filtered results as a CSV file for use in spreadsheets or CRM tools.

## Details
- Exports all currently visible (filtered) results
- CSV includes: name, address, phone, rating, review count, status, Google Maps URL, place ID
- Values are properly escaped for CSV format (quotes, commas, newlines)
- File is downloaded directly via browser blob URL

## Key Files
- `app.js` — `exportCsv()`, `csvEscape()`

## Behavior
- Triggered by the "Export CSV" button
- Only exports results matching the current filter/sort state
- File is named with a timestamp for easy identification
