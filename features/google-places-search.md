# Google Places Search

## Summary
Search for local businesses using the Google Places API (New) with location-based geocoding and radius filtering.

## Details
- User enters a location (city, address, etc.) and a business type
- Location is geocoded via Google Geocoding API to get coordinates
- `Place.searchNearby()` performs a radius-based search using the Places API (New)
- Results are normalized into an internal business object via `mapPlaceToResult()`

## Key Files
- `app.js` — `startSearch()`, `geocodeLocation()`, `searchPlaces()`, `mapPlaceToResult()`
- `index.html` — Search form inputs and controls

## Data Captured
- Business name, address, phone, website URI
- Rating, review count, business status
- Google Maps URL, place ID, types array
- Reviews (text, rating, author, relative time)
- Photos (Google Places photo objects)
- Opening hours (weekday descriptions)

## Dependencies
- Google Maps JavaScript API (loaded dynamically after user provides API key)
- Google Places API (New)
