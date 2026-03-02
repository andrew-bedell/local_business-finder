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

The entire app lives inside a single IIFE `(function() { 'use strict'; ... })()`. Code is organized into labeled sections marked by `// ── Section Name ──` comments. Search for `// ──` to navigate between sections.

| Section Marker | Key Functions | Purpose |
|---|---|---|
| `// ── i18n ──` | `translations`, `t()`, `applyLanguage()` | Translation objects (EN/ES) and language switching |
| `// ── Toast Notifications ──` | `showToast(message, type)` | User feedback notifications |
| `// ── Supabase ──` | `loadSavedIds()`, `saveBusiness()`, `saveAllBusinesses()` | Database client init and persistence |
| `// ── State ──` | — | App state: `apiKey`, `allResults`, `filteredResults`, `isSearching`, `mapsLoaded` |
| `// ── DOM refs ──` | `$()` shorthand | Cached DOM element references |
| `// ── Initialize ──` | `init()`, `fetchApiKeyFromServer()` | Event binding, language setup, server key fetch |
| `// ── API Key Management ──` | `saveApiKey()`, `showApiStatus()` | Save key to localStorage, validate input |
| `// ── Google Maps Loading ──` | `loadGoogleMaps()`, `initServices()` | Dynamic script injection, geocoder initialization |
| `// ── Search Button State ──` | `updateSearchButton()` | Enable/disable search based on required inputs |
| `// ── Main Search Flow ──` | `startSearch()`, `resetSearchButton()` | Geocode → searchNearby → map → filter → render |
| `// ── Country Selection ──` | `onCountryChange()`, `updateRadiusLabels()` | Country-aware placeholders and km/mile switching |
| `// ── Timeout helper ──` | `withTimeout(promise, ms, label)` | Race promise against timeout for network calls |
| `// ── Geocoding ──` | `geocodeLocation()` | Address to coordinates via Google Geocoder |
| `// ── Places Search ──` | `searchPlaces()` | `Place.searchNearby()` with field selection |
| `// ── Map Place objects ──` | `mapPlaceToResult()` | Normalize Google API response to internal format |
| `// ── Progress ──` | `updateProgress()` | Update progress bar and status text |
| `// ── Display Results ──` | `showResults()`, `applyFilterAndSort()`, `renderTable()` | Filter, sort, and render results table |
| `// ── Export CSV ──` | `exportCsv()` | Download filtered results as CSV |
| `// ── Clear Results ──` | `clearResults()` | Reset results state and hide UI sections |
| `// ── Utility ──` | `escapeHtml()`, `renderStars()`, `csvEscape()` | HTML sanitization, star display, CSV formatting |
| `// ── Sentiment Analysis ──` | `analyzeSentiment()`, `getTopReviews()` | Keyword-based scoring with rating weight |
| `// ── Photo URLs ──` | `getPhotoUrl()` | Extract photo URI from Google Places photo objects |
| `// ── Detail Modal ──` | `openDetailModal()` | Photos, reviews, hours, copy-to-clipboard modal |

## Design System

All design tokens live in `styles.css` as CSS custom properties on `:root`. New UI must use these tokens — never hardcode colors, radii, or shadows.

### Color Palette

| Token | Value | Usage |
|---|---|---|
| `--bg` | `#0f1117` | Page background |
| `--bg-card` | `#1a1d27` | Card/panel backgrounds |
| `--bg-input` | `#252833` | Input fields, table headers, inset surfaces |
| `--bg-hover` | `#2a2d3a` | Hover states on rows, interactive surfaces |
| `--border` | `#2e3140` | Default borders (cards, inputs, table cells) |
| `--border-focus` | `#6366f1` | Focused input border (matches primary) |
| `--text` | `#e8eaf0` | Primary text |
| `--text-muted` | `#8b8fa3` | Secondary text (labels, descriptions, metadata) |
| `--text-dim` | `#5c6078` | Tertiary text (timestamps, separators, disabled) |
| `--primary` | `#6366f1` | Indigo — buttons, links, active states |
| `--primary-hover` | `#818cf8` | Lighter indigo — button hover |
| `--primary-bg` | `rgba(99, 102, 241, 0.12)` | Indigo tint — ghost buttons, highlights |
| `--success` | `#22c55e` | Green — success toasts, "has website" badges |
| `--success-bg` | `rgba(34, 197, 94, 0.12)` | Green tint — success badge backgrounds |
| `--warning` | `#f59e0b` | Amber — warning toasts, star ratings, "no website" badges |
| `--warning-bg` | `rgba(245, 158, 11, 0.12)` | Amber tint — warning badge backgrounds |
| `--danger` | `#ef4444` | Red — error toasts, destructive actions |
| `--danger-bg` | `rgba(239, 68, 68, 0.12)` | Red tint — error badge backgrounds |

**Rules:**
- Dark theme only — there is no light theme toggle.
- Semantic colors (`success`, `warning`, `danger`) map to specific meanings. Do not repurpose them.
- Tint variants (`*-bg`) are always `rgba(color, 0.12)` of their parent — maintain this pattern for new colors.

### Typography

| Element | Font Size | Weight | Color |
|---|---|---|---|
| Page base | `14px` | 400 | `--text` |
| Logo / page title | `24px` (desktop), `20px` (mobile) | 800 | `--text` |
| Card headings (`h2`) | `16px` | 700 | `--text` |
| Modal heading (`h2`) | `20px` | 700 | `--text` |
| Modal section heading (`h3`) | `15px` | 700 | `--text` |
| Form labels | `13px` | 600 | `--text-muted` |
| Table headers (`th`) | `12px` uppercase | 600 | `--text-muted` |
| Table body | `13px` | 400 | `--text` |
| Badges | `12px` | 600 | Varies by badge type |
| Small text (timestamps, captions) | `11px`–`12px` | 400 | `--text-dim` |
| Buttons | `14px` (standard), `15px` (search), `13px` (text buttons), `12px` (row buttons) | 600 | Varies |

**Font stack:** `'Inter', -apple-system, BlinkMacSystemFont, sans-serif`
**Line height:** `1.5` (base), `1.6` (review text)
**Letter spacing:** `-0.5px` on logo, `0.5px` on table headers

### Spacing

No formal spacing scale — use values consistent with existing patterns:

| Context | Value |
|---|---|
| Page padding | `24px` horizontal (`20px` on mobile) |
| Card padding | `24px` (`16px` on mobile) |
| Card gap (between cards) | `20px` |
| Form field gap | `14px` |
| Form label to input gap | `6px` |
| Button padding | `10px 20px` (standard), `14px` (full-width search), `5px 14px` (row buttons) |
| Table cell padding | `10px 14px` (`8px 10px` on mobile) |
| Modal body/header padding | `24px` (`16px` on mobile) |
| Toast padding | `12px 20px` |
| Badge padding | `4px 10px` (standard), `2px 8px` (sentiment) |

### Borders & Radii

| Token | Value | Usage |
|---|---|---|
| `--radius` | `8px` | Buttons, inputs, cards, table wrappers, toasts |
| `--radius-lg` | `12px` | Cards, modal content |
| Badge radius | `20px` | Status badges (pill shape) |
| Sentiment badge radius | `12px` | Smaller pill badges |
| Scrollbar thumb radius | `4px` | Custom scrollbar |
| Border style | `1px solid var(--border)` | All component borders |

### Shadows

| Token | Value | Usage |
|---|---|---|
| `--shadow` | `0 2px 8px rgba(0, 0, 0, 0.3)` | Toast notifications |
| Modal overlay | `rgba(0, 0, 0, 0.7)` + `blur(4px)` | Modal backdrop |

### Animations & Transitions

| Name | Duration | Easing | Usage |
|---|---|---|---|
| Property transitions | `0.15s` | default | Background, color, border, opacity on hover/focus |
| Image hover scale | `0.2s` | default | Photo gallery `scale(1.05)` |
| `fadeIn` | `0.2s` | ease | Modal overlay appearance |
| `slideUp` | `0.25s` | ease | Modal content entrance (20px → 0) |
| `spin` | `0.6s` | linear infinite | Loading spinner rotation |
| `toastIn` | `0.3s` | ease | Toast slide in from right (40px) |
| `toastOut` | `0.3s` | ease | Toast fade out (starts at 3.7s) |
| Button active | `0.1s` | default | `scale(0.97)` press effect |

### Responsive Breakpoints

| Breakpoint | Target |
|---|---|
| `@media (max-width: 768px)` | Tablet — stacks form rows, reduces padding |
| `@media (max-width: 480px)` | Phone — full-width buttons, compact modal, smaller photo grid |

### Layout

- **Max width:** `--max-width: 1100px` — applied to `.header-inner` and `.main`
- **Layout model:** Flexbox throughout. No CSS Grid except photo gallery (`grid-template-columns: repeat(auto-fill, minmax(170px, 1fr))`)
- **Content flow:** Single column, vertically stacked cards

## Component Reference

Reusable UI patterns defined in `styles.css`. New features must use these existing components — do not create parallel patterns.

### Buttons

| Class | Usage | Style |
|---|---|---|
| `.btn` | Base class (required on all buttons) | Flex center, 600 weight, `scale(0.97)` on active, `opacity: 0.5` when disabled |
| `.btn-primary` | Primary actions (Save Key, Search) | Solid `--primary` background, white text |
| `.btn-secondary` | Secondary actions (Export, Clear) | `--bg-input` background, bordered |
| `.btn-text` | Inline/tertiary actions (Setup Guide) | Transparent, `--primary` text, small padding |
| `.btn-search` | Full-width search button | Extends `.btn-primary`, 100% width, larger text |
| `.btn-view` | Table row "View" button | Ghost indigo, fills solid on hover |
| `.btn-save-row` | Table row "Save" button | Ghost indigo, fills solid on hover |
| `.btn-save-db` | Bulk "Save All to DB" | Ghost indigo, fills solid on hover |

### Cards

| Class | Usage |
|---|---|
| `.card` | Container — `--bg-card` background, `--radius-lg` corners, `24px` padding |
| `.card-header` | Flex row with `h2` and action button, `16px` bottom margin |

### Badges

| Class | Usage |
|---|---|
| `.badge` | Base — pill shape, 12px bold text |
| `.badge-no-site` | Amber — business has no website |
| `.badge-has-site` | Green — business has a website |
| `.badge-saved` | Green — business saved to DB |
| `.sentiment-badge` | Base for sentiment indicators |
| `.sentiment-great` | Green — high sentiment score |
| `.sentiment-good` | Indigo — moderate sentiment score |

### Inputs

| Class | Usage |
|---|---|
| `.input` | All text inputs and selects — `--bg-input` background, focus ring with `--primary-bg` glow |
| `select.input` | Adds custom chevron SVG, removes native appearance |
| `.input-sort` | Constrained-width select for sort dropdowns (`max-width: 180px`) |

### Modal

| Class | Usage |
|---|---|
| `.modal-overlay` | Fixed fullscreen backdrop with blur |
| `.modal-content` | Centered dialog — `800px` max-width, `85vh` max-height, flex column |
| `.modal-header` | Title area with close button, bottom border |
| `.modal-body` | Scrollable content area |
| `.modal-footer` | Action buttons, top border |
| `.modal-close` | `×` button — 28px, muted color |

### Table

| Class | Usage |
|---|---|
| `.results-table-wrapper` | Overflow-x scroll container with border |
| `.results-table` | Full-width, collapsed borders, 13px text |
| `.col-*` | Column width constraints (`.col-num`, `.col-name`, `.col-address`, etc.) |

### Toast Notifications

| Class | Usage |
|---|---|
| `.toast-container` | Fixed top-right container, z-index 2000 |
| `.toast` | Base — 14px, white text, shadow, auto-dismiss animation |
| `.toast-success` | Green background |
| `.toast-error` | Red background |
| `.toast-warning` | Amber background, dark text |

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
- **All tokens, colors, typography, spacing, and components are defined in the [Design System](#design-system) and [Component Reference](#component-reference) sections above.** Refer to those sections for specific values.
- **BEM-lite naming:** `.card`, `.card-header`, `.btn-primary`, `.badge-no-site`. No strict BEM — flat class names for simple elements.
- **New components** must reuse existing classes from the Component Reference before creating new ones.

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

Quick-reference checklist. Details are in the dedicated sections above.

1. **No build tooling.** Plain HTML/CSS/JS served statically.
2. **All new strings must be i18n'd** — add to both `en` and `es` translation objects.
3. **Sanitize all dynamic content** with `escapeHtml()` before injecting into the DOM.
4. **Keep everything in the IIFE.** Don't leak globals.
5. **Prefer `async/await`** over raw promises. Wrap network calls with `withTimeout()`.
6. **No new CDN dependencies** without discussion. The app should remain lightweight.
7. **Use existing design tokens and components** — see [Design System](#design-system) and [Component Reference](#component-reference).
8. **Follow error handling patterns** — see [Error Handling Patterns](#error-handling-patterns).
9. **Store preferences in localStorage, business data in Supabase** — see [localStorage Keys](#localstorage-keys).
10. **Track features and bugs** in the documentation folders — see [Lifecycle Rules](#lifecycle-rules).

## Documentation Folders & Lifecycle Rules

Project tracking is organized into three folders with strict lifecycle rules for how files move between them.

### Folder Structure

```
features/          — Completed, shipped features (one .md file per feature)
planned/           — Features designed but not yet built (one .md file per feature)
bugs/              — Active bugs that need fixing (one .md file per bug)
  └─ fixed/        — Bugs that have been resolved (moved here after fix)
```

### Lifecycle Rules

1. **Planned feature completed → move to `features/`**
   - When a feature from `planned/` is fully implemented, move its `.md` file to `features/`
   - Update the file content to reflect what was actually built (remove "Status: Not Started", add key files, actual behavior, etc.)
   - Delete the file from `planned/` — do not leave a copy behind

2. **New bug discovered → create in `bugs/`**
   - Create a new `.md` file in `bugs/` with: severity, affected file(s), description, steps to reproduce, expected behavior, and impact
   - Use kebab-case filenames (e.g., `save-business-schema-mismatch.md`)

3. **Bug fixed → move to `bugs/fixed/`**
   - When a bug is resolved, move its `.md` file from `bugs/` to `bugs/fixed/`
   - Add a `## Resolution` section to the file documenting what was changed and when
   - Delete the file from `bugs/` — do not leave a copy behind

### File Naming

- Use `kebab-case` for all filenames (e.g., `google-places-search.md`, `lat-lng-not-saved.md`)
- Names should be short but descriptive of the feature or bug

### File Templates

**Feature file (`features/` or `planned/`):**
```
# Feature Name
## Summary — one-line description
## Details — how it works
## Key Files — affected source files
## Dependencies — what it depends on
```

**Bug file (`bugs/` or `bugs/fixed/`):**
```
# Bug: Short Description
**Severity:** Critical | High | Medium | Low
**File:** affected file(s)
## Description — what's wrong
## Steps to Reproduce
## Expected Behavior
## Impact
## Resolution — (added when moved to fixed/)
```

## Error Handling Patterns

| Scenario | Action |
|---|---|
| **User-facing failure** (search fails, save fails, export fails) | `showToast(t('errorKey'), 'error')` — always use an i18n key |
| **User-facing warning** (no results, missing data) | `showToast(t('warningKey'), 'warning')` |
| **User-facing success** (save complete, export done) | `showToast(t('successKey'), 'success')` |
| **Internal/debug errors** | `console.error('Context:', error)` — include a descriptive context string |
| **Non-critical warnings** (Supabase not initialized, optional feature unavailable) | `console.warn('Context:', details)` |
| **Network timeouts** | Handled by `withTimeout(promise, ms, label)` — rejects with descriptive error after timeout |

**Rules:**
- Never show raw error messages to the user. Always use `t()` for user-facing text.
- Always `catch` async operations. Log to console for debugging, toast for the user.
- Do not silently swallow errors — at minimum `console.warn` so issues are discoverable.

## localStorage Keys

All user preferences are stored in `localStorage`. Supabase handles persistent data.

| Key | Type | Purpose |
|---|---|---|
| `app_lang` | `'en'` \| `'es'` | Selected UI language (default: `'en'`) |
| `google_places_api_key` | `string` | User's Google Places API key |

**Rules:**
- Keep localStorage for user preferences only — never store business data here.
- Always provide a default/fallback when reading (`|| 'en'`, `|| ''`).
- New keys must be documented in this table.

## Deployment & Environment

### Local Development
Serve statically — no build step required:
```
npx serve .          # or any static file server
open index.html      # or open directly in browser
```

### Vercel Deployment
The `api/` directory contains serverless functions deployed automatically by Vercel.

**Environment variables (set in Vercel dashboard):**

| Variable | Required | Purpose |
|---|---|---|
| `GOOGLE_PLACES_API_KEY` | Yes | Google Places API key served by `api/config.js` proxy |

### Supabase Setup
1. Create a Supabase project
2. Run `database/schema.sql` against the Supabase SQL editor
3. Configure Row Level Security (RLS) policies as needed
4. Update `SUPABASE_URL` and `SUPABASE_KEY` in `app.js` (see `bugs/hardcoded-supabase-keys.md` — this should eventually move to env vars)

## Testing

No automated test suite. Test manually by:
1. Opening `index.html` in a browser
2. Entering a Google Places API key
3. Searching for businesses in different countries/types
4. Verifying results render, export works, and save-to-DB functions correctly
