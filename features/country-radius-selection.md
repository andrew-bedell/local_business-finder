# Country & Radius Selection

## Summary
Country-aware search with automatic unit switching between kilometers and miles for the search radius.

## Details
- User selects a country from a dropdown before searching
- Radius input adjusts its label between "km" and "miles" based on the selected country
- US selections default to miles; all other countries default to kilometers
- Country selection is passed as context for geocoding accuracy

## Key Files
- `app.js` — Country selection handler, radius label switching
- `index.html` — Country dropdown, radius input with unit labels

## Behavior
- Selecting a US-based option switches radius labels to miles
- Selecting any other country switches to kilometers
- Radius value is converted to meters for the Google Places API call
