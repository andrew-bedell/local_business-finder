# CLAUDE.md — Local Business Finder

## Project Overview

A lead-to-website pipeline that finds local businesses **without websites**, gathers comprehensive data about them from multiple sources, and generates ready-to-publish websites using the collected information.

**Pipeline:** Find → Gather → Curate → Generate

1. **Find** — Search for businesses without websites via Google Places API
2. **Gather** — Enrich each business with photos, reviews, social profiles, menus, and contact info from Google, Facebook, Instagram, Yelp, and other sources
3. **Curate** — Use sentiment analysis to select the best reviews; organize photos by type; extract menu data from images
4. **Generate** — One-click website generation populated with contact info, services, curated reviews, photos, and menus. AI-generated images (via NanoBanana) fill visual gaps.

## Architecture

**Stack:** Vanilla HTML/CSS/JS — no build tools, no frameworks, no bundler.

```
index.html           — Single-page HTML shell (semantic sections, data-i18n attributes)
app.js               — All application logic in one IIFE
styles.css           — Dark-theme design system using CSS custom properties
api/config.js        — Vercel serverless function (API key proxy)
database/schema.sql  — Supabase database schema (source of truth)
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

### Current: Search & Filter
```
User Input → geocodeLocation() → searchPlaces() → mapPlaceToResult()
  → filter (no website) → applyFilterAndSort() → renderTable()
```

### Target: Full Pipeline
```
FIND        User Input → Google Places Search → Filter (no website)
                ↓
GATHER      Google Places details (photos, reviews, hours, menu photos)
            → Social media discovery (Facebook, Instagram, WhatsApp)
            → Third-party platforms (Yelp, TripAdvisor, OpenTable)
                ↓
CURATE      Sentiment analysis → select top reviews for website
            Menu photo → OCR/AI extraction → structured menu data
            Photo categorization (exterior, interior, food, team, logo)
                ↓
GENERATE    Select template by business category
            → Populate: contact, services, reviews, photos, menu
            → AI-generated images (NanoBanana) for gaps
            → Publish website
```

## Data Architecture

The database schema lives in `database/schema.sql` (executable source of truth). Below is the high-level overview.

### Tables Overview

| Table | Purpose |
|---|---|
| `businesses` | Core business record — identity, location, contact, ratings, operational details |
| `business_social_profiles` | Links to Facebook, Instagram, WhatsApp, Yelp, TripAdvisor, OpenTable, etc. |
| `business_photos` | Photos from all sources (Google, social media, AI-generated) with type classification |
| `business_reviews` | Reviews from all sources with sentiment scores and curation flags |
| `business_menus` | Structured menu items extracted from photos or online sources |
| `generated_websites` | Website generation records — template, status, selected content |

### Entity Relationships

```
businesses (1) ──→ (many) business_social_profiles
businesses (1) ──→ (many) business_photos
businesses (1) ──→ (many) business_reviews
businesses (1) ──→ (many) business_menus
businesses (1) ──→ (many) generated_websites
business_photos (1) ──→ (many) business_menus  (source photo for extraction)
```

### businesses

The central record for each discovered business. Expanded from the original flat schema to support the full pipeline.

| Column Group | Fields |
|---|---|
| **Identity** | `name`, `description`, `category`, `subcategory` |
| **Location** | `address_full`, `address_street`, `address_city`, `address_state`, `address_zip`, `address_country`, `latitude`, `longitude`, `service_area` |
| **Contact** | `phone`, `whatsapp`, `email`, `website` (empty for our targets) |
| **Google** | `place_id` (unique key), `maps_url`, `types[]`, `rating`, `review_count`, `price_level`, `business_status`, `hours` |
| **Details** | `payment_methods[]`, `languages_spoken[]`, `accessibility_info`, `parking_info`, `year_established`, `owner_name` |
| **Tracking** | `search_location`, `search_type`, `data_completeness_score`, `first_discovered_at`, `last_updated_at` |

### business_social_profiles

One row per platform per business. Platforms include: `facebook`, `instagram`, `whatsapp`, `twitter`, `tiktok`, `linkedin`, `youtube`, `yelp`, `tripadvisor`, `opentable`, `resy`, `doordash`, `ubereats`, `grubhub`.

### business_photos

Photos from any source, classified by type for website generation.

| Field | Purpose |
|---|---|
| `source` | `google`, `facebook`, `instagram`, `ai_generated` |
| `photo_type` | `exterior`, `interior`, `menu`, `product`, `food`, `team`, `logo`, `ai_generated` |
| `url` | Original source URL |
| `storage_path` | Path in Supabase Storage (for persisted copies) |
| `is_primary` | Featured image for the business |

### business_reviews

Reviews from all platforms, scored and curated for website use.

| Field | Purpose |
|---|---|
| `source` | `google`, `facebook`, `yelp`, `tripadvisor` |
| `sentiment_score` | Decimal score from sentiment analysis |
| `sentiment_label` | `very_positive`, `positive`, `neutral`, `negative` |
| `is_curated` | Flagged as selected for use on generated website |

### business_menus

Structured menu data extracted from photos or online sources (primarily for restaurants).

| Field | Purpose |
|---|---|
| `source_photo_id` | FK to the photo this was extracted from (if applicable) |
| `menu_category` | e.g., Appetizers, Entrees, Drinks, Desserts |
| `item_name` | Menu item name |
| `item_description` | Description text |
| `price` | Price as decimal |
| `currency` | USD, MXN, COP, etc. |

### generated_websites

Tracks each website generation attempt and its status.

| Field | Purpose |
|---|---|
| `template_name` | Template used (by business category) |
| `primary_color`, `secondary_color` | Brand colors (extracted or chosen) |
| `status` | `draft`, `published`, `archived` |
| `published_url` | Live URL once deployed |
| `config` | JSON blob with generation settings and selected content IDs |

### Naming Conventions

| Element | Convention | Example |
|---|---|---|
| Table names | `snake_case`, plural | `business_reviews` |
| Column names | `snake_case` | `review_count` |
| Primary keys | `id` (UUID) | `id UUID DEFAULT gen_random_uuid()` |
| Foreign keys | `{singular_table}_id` | `business_id` |
| Timestamps | `*_at` suffix | `created_at`, `first_discovered_at` |
| Booleans | `is_` prefix | `is_curated`, `is_primary` |
| Arrays | plural column name | `types`, `payment_methods` |
| JSON blobs | descriptive singular/plural | `hours`, `config` |
| Enums | stored as `TEXT` with CHECK constraints | `status TEXT CHECK (status IN (...))` |

### Internal Business Object Shape (In-Memory)
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

> **Note:** The in-memory object will expand as the gather/enrich pipeline is built. The database schema is the forward-looking design; the in-memory shape reflects what currently exists in `app.js`.

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
