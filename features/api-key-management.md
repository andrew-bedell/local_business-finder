# API Key Management

## Summary
Secure handling of the Google Places API key with localStorage persistence and a Vercel serverless proxy option.

## Details
- User enters their Google Places API key in the UI
- Key is saved to localStorage for persistence across sessions
- Google Maps JavaScript API is loaded dynamically only after a key is provided
- A Vercel serverless function (`api/config.js`) can serve the API key from environment variables as an alternative to client-side entry

## Key Files
- `app.js` — API key save/load, dynamic Google Maps script loading
- `api/config.js` — Vercel serverless endpoint for API key proxy

## Behavior
- On page load, checks localStorage for a saved API key
- If found, automatically loads Google Maps API
- If not found, prompts user to enter their key
- Vercel endpoint reads `GOOGLE_API_KEY` from environment variables
