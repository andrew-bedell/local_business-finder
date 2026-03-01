# CLAUDE.md — Local Business Finder

## Project Overview

A client-side web application that finds local businesses **without websites** using the Google Places API (New). Users search by location, country, and business type, then view results with reviews, photos, and sentiment analysis. Results can be exported to CSV or saved to a Supabase database.

## Architecture

**Stack:** Vanilla HTML/CSS/JS — no build tools, no frameworks, no bundler.

```
index.html   — Single-page HTML shell (semantic sections, data-i18n attributes)
app.js       — All application logic in one IIFE (1,250 lines)
styles.css   — Dark-theme design system using CSS custom properties
```

**External dependencies (CDN only):**
- Google Maps JavaScript API + Places API (New) — loaded dynamically after user provides API key
- Supabase JS SDK v2 — loaded via `<script>` tag in index.html
- Google Fonts (Inter)

**No package.json, no node_modules, no build step.** Open `index.html` directly or serve with any static file server.

## Code Structure (app.js)

The entire app lives inside a single IIFE `(function() { 'use strict'; ... })()`. Code is organized into labeled sections:

| Section | Lines (approx) | Purpose |
|---|---|---|
| i18n | 1–400 | `translations` object (EN/ES), `t()` helper, `applyLanguage()` |
| Toast Notifications | 405–413 | `showToast(message, type)` |
| Supabase | 415–508 | Client init, `loadSavedIds()`, `saveBusiness()`, `saveAllBusinesses()` |
| State & DOM refs | 510–542 | App state variables, cached `$()` selectors |
| Initialize | 544–580 | `init()` — event binding, language setup |
| API Key Management | 582–627 | Save key to localStorage, load Google Maps script |
| Search Flow | 644–703 | `startSearch()` — geocode → searchNearby → map → filter → render |
| Country/Radius | 712–736 | Country selection, km/mile label switching |
| Geocoding | 748–770 | `geocodeLocation()` with timeout wrapper |
| Places Search | 772–794 | `searchPlaces()` using `Place.searchNearby()` |
| Data Mapping | 796–824 | `mapPlaceToResult()` — normalize API response to internal format |
| Results Display | 832–958 | `showResults()`, `applyFilterAndSort()`, `renderTable()` |
| CSV Export | 960–990 | `exportCsv()` |
| Utilities | 1002–1015 | `escapeHtml()`, `csvEscape()` |
| Sentiment Analysis | 1017–1082 | Keyword-based scoring, `getTopReviews()` |
| Photo URLs | 1084–1088 | `getPhotoUrl()` |
| Detail Modal | 1090–1247 | `openDetailModal()` — photos, reviews, hours, copy-to-clipboard |

## Coding Conventions

### JavaScript
- **IIFE pattern:** All code is wrapped in `(function() { 'use strict'; ... })()`. No globals except the Google Maps callback `window._gmapsCallback`.
- **DOM access:** Use the local `$` shorthand (`const $ = (sel) => document.querySelector(sel)`) for cached refs at module top. Use `document.getElementById()` or `document.querySelector()` for dynamic lookups.
- **Naming:** `camelCase` for variables and functions. Constants like `SUPABASE_URL` use `UPPER_SNAKE_CASE`.
- **String interpolation:** Template literals for HTML generation. The `t(key, ...args)` function for all user-facing strings (i18n).
- **Async patterns:** `async/await` for API calls. `withTimeout()` wrapper for network requests.
- **HTML generation:** Build HTML strings with template literals, inject via `innerHTML`. Always sanitize dynamic values with `escapeHtml()`.
- **Event handling:** `addEventListener` — never inline `onclick` attributes.
- **No classes or modules.** Plain functions and closures.

### CSS
- **Design tokens via CSS custom properties** on `:root` — colors, radii, shadows, max-width.
- **Dark theme by default** (`--bg: #0f1117`). Color palette: indigo primary (`#6366f1`), green success, amber warning, red danger.
- **BEM-lite naming:** `.card`, `.card-header`, `.btn-primary`, `.badge-no-site`. No strict BEM — flat class names for simple elements.
- **Responsive:** Mobile-first breakpoints at `768px` and `480px` using `@media (max-width: ...)`.
- **Font:** Inter via Google Fonts, 14px base size.

### HTML
- **Single `index.html`** with semantic sections: `<header>`, `<main>`, `<footer>`.
- **i18n attributes:** `data-i18n="key"` for text content, `data-i18n-placeholder="key"` for placeholders, `data-i18n-label="key"` for optgroup labels.
- **No component framework.** Sections toggle visibility via `style.display`.

## Data Flow

```
User Input → geocodeLocation() → searchPlaces() → mapPlaceToResult()
  → filter (no website) → applyFilterAndSort() → renderTable()
```

### Internal Business Object Shape
```js
{
  name: string,           // place.displayName
  address: string,        // place.formattedAddress
  phone: string,          // place.nationalPhoneNumber
  website: string,        // place.websiteURI (empty = no website)
  rating: number,         // 0–5
  reviewCount: number,    // place.userRatingCount
  status: string,         // 'OPERATIONAL' | 'CLOSED_TEMPORARILY' | 'CLOSED_PERMANENTLY' | 'UNKNOWN'
  mapsUrl: string,        // place.googleMapsURI
  types: string[],        // place.types
  placeId: string,        // place.id
  reviewData: Array<{     // normalized review objects
    text: string,
    rating: number,
    relativePublishTimeDescription: string,
    authorAttribution: { displayName: string, photoURI: string } | null
  }>,
  photos: object[],       // Google Places photo objects (use .getURI())
  hours: string[]         // weekdayDescriptions from regularOpeningHours
}
```

### Supabase `businesses` Table Schema
```js
{
  place_id: string,       // primary key, unique
  name: string,
  address: string,
  phone: string,
  rating: number | null,
  review_count: number,
  business_status: string,
  maps_url: string,
  types: string[],
  reviews: object[],      // serialized review objects
  hours: string[],
  search_location: string,
  search_type: string
}
```

## i18n System

- Two languages: English (`en`) and Spanish (`es`).
- All user-facing strings go through `t(key, ...args)`.
- Placeholders use `{0}`, `{1}`, etc. for interpolation.
- When adding new UI text:
  1. Add the key to **both** `translations.en` and `translations.es`.
  2. Use `data-i18n="yourKey"` in HTML or call `t('yourKey')` in JS.

## Key Patterns to Follow

1. **No build tooling.** Keep it as plain HTML/CSS/JS served statically.
2. **All new strings must be i18n'd** — add to both `en` and `es` translation objects.
3. **Sanitize all dynamic content** with `escapeHtml()` before injecting into the DOM.
4. **Keep everything in the IIFE.** Don't leak globals.
5. **Use CSS custom properties** for any new colors, spacing, or design tokens.
6. **Prefer `async/await`** over raw promises. Wrap network calls with `withTimeout()`.
7. **Responsive design:** Test at 768px and 480px breakpoints. Use flexbox, avoid fixed widths.
8. **No new CDN dependencies** without discussion. The app should remain lightweight.
9. **localStorage** for user preferences (API key, language). Supabase for persistent business data.
10. **Toast notifications** via `showToast(message, 'success' | 'error' | 'warning')` for user feedback.

## Testing

No automated test suite. Test manually by:
1. Opening `index.html` in a browser
2. Entering a Google Places API key
3. Searching for businesses in different countries/types
4. Verifying results render, export works, and save-to-DB functions correctly
