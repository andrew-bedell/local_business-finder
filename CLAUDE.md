# CLAUDE.md — Local Business Finder

## Project Overview

A lead-to-website SaaS pipeline that finds local businesses **without websites**, gathers comprehensive data about them, generates ready-to-publish websites, sells hosting subscriptions, and provides ongoing website management with analytics.

**Pipeline:** Find → Gather → Curate → Generate → Sell → Manage → Analyze

1. **Find** — Search for businesses without websites via Google Places API
2. **Gather** — Enrich each business with photos, reviews, social profiles, menus, and contact info from Google, Facebook, Instagram, Yelp, and other sources
3. **Curate** — Use sentiment analysis to select the best reviews; organize photos by type; extract menu data from images
4. **Generate** — One-click website generation populated with contact info, services, curated reviews, photos, and menus. AI-generated images (via NanoBanana) fill visual gaps
5. **Sell** — Convert prospects to paying customers with Stripe subscription billing (monthly recurring)
6. **Manage** — Handle website edit requests from business owners; re-publish updated sites; manage site lifecycle (active/suspended/archived)
7. **Analyze** — First-party analytics tracking on published websites; customer-facing dashboard with visitor, action, and traffic insights

## Architecture

**Stack:** Vanilla HTML/CSS/JS — no build tools, no frameworks, no bundler.

```
index.html               — Operator app: single-page HTML shell (semantic sections, data-i18n attributes)
app.js                   — Operator app logic in one IIFE
styles.css               — Dark-theme design system using CSS custom properties
admin.html               — Customer admin portal (planned — separate authenticated page)
admin.js                 — Customer portal logic (planned — separate IIFE)
admin.css                — Customer portal styles (planned — extends design tokens from styles.css)
api/config.js            — Vercel serverless function (API key proxy)
api/stripe/              — Stripe serverless functions (planned)
  create-checkout-session.js — Create Stripe Checkout session for prospect conversion
  webhook.js             — Handle Stripe webhook events (payment, cancellation)
  customer-portal.js     — Create Stripe Customer Portal session
api/analytics/           — Analytics serverless functions (planned)
  track.js               — Receive tracking events from published websites
  summarize.js           — Daily cron job to roll up analytics into summaries
database/schema.sql      — Supabase database schema (source of truth)
data-architecture/       — System-level data architecture documentation
  overview.md            — Principles, technology stack, system diagram
  data-flow.md           — Pipeline data flow (Find → Gather → Curate → Generate → Sell → Manage → Analyze)
  external-services.md   — All external APIs, auth methods, rate limits
  storage-strategy.md    — Where data lives and why (localStorage, memory, Supabase, Stripe, Vercel)
```

**Two audiences, two entry points:**
- **Operator** uses `index.html` — search, save, enrich, generate, sell, manage
- **Customer** (business owner) uses `admin.html` — contact info, billing, edit requests, analytics

**External dependencies (CDN only):**
- Google Maps JavaScript API + Places API (New) — loaded dynamically after user provides API key
- Supabase JS SDK v2 — loaded via `<script>` tag in index.html and admin.html (includes Auth)
- Stripe.js — loaded in index.html for Checkout redirect (planned)
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
                ↓
SELL        Pipeline: prospect → contacted → interested → customer
            → Stripe Checkout for subscription billing (monthly)
            → Create customer account (Supabase Auth)
                ↓
MANAGE      Customer submits edit requests via Admin Portal
            → Operator reviews, applies edits, re-publishes
            → Site lifecycle: active / suspended / archived
                ↓
ANALYZE     Tracking script on published websites → analytics events
            → Daily rollups via Vercel Cron
            → Customer dashboard: visitors, actions, traffic sources
```

## Data Architecture

The database schema lives in `database/schema.sql` (executable source of truth). Below is the high-level overview.

### Tables Overview

| Table | Purpose | Phase |
|---|---|---|
| `businesses` | Core business record — identity, location, contact, ratings, pipeline status | Find, Gather, Sell |
| `business_social_profiles` | Links to Facebook, Instagram, WhatsApp, Yelp, TripAdvisor, OpenTable, etc. | Gather |
| `business_photos` | Photos from all sources (Google, social media, AI-generated) with type classification | Gather, Curate, Generate |
| `business_reviews` | Reviews from all sources with sentiment scores and curation flags | Gather, Curate |
| `business_menus` | Structured menu items extracted from photos or online sources | Curate |
| `generated_websites` | Website generation records — template, site status, version, selected content | Generate, Manage |
| `customers` | Business-to-customer relationship, Stripe references, billing details | Sell |
| `subscriptions` | Stripe subscription status, billing periods, cancellation state | Sell, Manage |
| `customer_users` | Links Supabase Auth users to customer records (RLS enforcement) | Sell |
| `edit_requests` | Customer-submitted website change requests with status lifecycle | Manage |
| `analytics_events` | Raw website visitor tracking events (page views, clicks, form submissions) | Analyze |
| `analytics_summaries` | Daily pre-aggregated metrics per business for fast dashboard queries | Analyze |

### Entity Relationships

```
businesses (1) ──→ (many) business_social_profiles
businesses (1) ──→ (many) business_photos
businesses (1) ──→ (many) business_reviews
businesses (1) ──→ (many) business_menus
businesses (1) ──→ (many) generated_websites
businesses (1) ──→ (many) customers
businesses (1) ──→ (many) edit_requests
businesses (1) ──→ (many) analytics_events
businesses (1) ──→ (many) analytics_summaries
business_photos (1) ──→ (many) business_menus     (source photo for extraction)
customers (1) ──→ (many) subscriptions
customers (1) ──→ (many) customer_users            (links to Supabase Auth)
customers (1) ──→ (many) edit_requests
generated_websites (1) ──→ (many) edit_requests    (which site the request is for)
generated_websites (1) ──→ (many) analytics_events (which site generated the event)
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
| **Pipeline** | `pipeline_status` (prospect/contacted/interested/customer/churned), `pipeline_status_changed_at` |
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
| `status` | `draft`, `published`, `archived` (generation status) |
| `site_status` | `active`, `suspended`, `archived` (hosting lifecycle) |
| `published_url` | Live URL once deployed |
| `config` | JSON blob with generation settings and selected content IDs |
| `version` | Integer counter incremented on each re-publish |
| `last_edited_at` | Timestamp of most recent content edit |

### customers

Business-to-customer relationship created when a prospect converts to a paying customer.

| Field | Purpose |
|---|---|
| `business_id` | FK to businesses — which business this customer owns |
| `stripe_customer_id` | Stripe Customer ID (unique reference) |
| `email` | Customer's email (used for auth and billing) |
| `contact_name` | Name of the business owner/contact |
| `monthly_price` | Subscription price as decimal |
| `currency` | `USD`, `MXN`, `COP`, etc. |
| `notes` | Operator notes about the customer |

### subscriptions

Stripe subscription records, synced via webhooks.

| Field | Purpose |
|---|---|
| `customer_id` | FK to customers |
| `stripe_subscription_id` | Stripe Subscription ID (unique reference) |
| `stripe_price_id` | Stripe Price ID |
| `status` | `active`, `past_due`, `cancelled`, `incomplete`, `trialing` |
| `current_period_start`, `current_period_end` | Current billing period dates |
| `cancel_at_period_end` | Whether subscription will cancel at period end |
| `cancelled_at` | Timestamp when cancellation was requested |

### customer_users

Links Supabase Auth users to customer records for RLS enforcement.

| Field | Purpose |
|---|---|
| `auth_user_id` | Supabase Auth user UUID (unique) |
| `customer_id` | FK to customers |
| `role` | `owner` or `manager` |

### edit_requests

Customer-submitted website change requests with status lifecycle.

| Field | Purpose |
|---|---|
| `business_id` | FK to businesses |
| `customer_id` | FK to customers |
| `website_id` | FK to generated_websites (nullable) |
| `request_type` | `content_update`, `photo_update`, `contact_update`, `hours_update`, `menu_update`, `design_change`, `other` |
| `description` | Free-text description of the requested change |
| `status` | `submitted`, `in_review`, `in_progress`, `completed`, `rejected` |
| `priority` | `low`, `normal`, `high`, `urgent` |
| `rejection_reason` | Operator's reason if rejected |

### analytics_events

Raw website visitor tracking events from the embedded first-party tracking script.

| Field | Purpose |
|---|---|
| `business_id` | FK to businesses |
| `website_id` | FK to generated_websites (nullable) |
| `event_type` | `page_view`, `click_phone`, `click_email`, `click_directions`, `click_social`, `form_submit` |
| `page_url` | URL of the page where the event occurred |
| `referrer` | Referring domain (domain only, not full URL) |
| `device_type` | `desktop`, `mobile`, `tablet` |
| `metadata` | JSONB — event-specific data |

### analytics_summaries

Daily pre-aggregated metrics per business for fast dashboard queries.

| Field | Purpose |
|---|---|
| `business_id` | FK to businesses |
| `date` | Date of the summary (unique per business + date) |
| `page_views`, `unique_visitors` | Traffic counts |
| `phone_clicks`, `email_clicks`, `direction_clicks`, `social_clicks`, `form_submissions` | Action counts |
| `top_referrers` | JSONB — referrer domains with visit counts |
| `device_breakdown` | JSONB — device type percentages |

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
11. **Update `data-architecture/`** when changing storage decisions, adding external services, or modifying the pipeline — see [Data Architecture Folder](#data-architecture-folder).

## Documentation Folders & Lifecycle Rules

Project tracking and architecture documentation is organized into dedicated folders.

### Folder Structure

```
data-architecture/ — System-level data architecture (not code, not schema — strategic decisions)
features/          — Completed, shipped features (one .md file per feature)
planned/           — Features designed but not yet built (one .md file per feature)
bugs/              — Active bugs that need fixing (one .md file per bug)
  └─ fixed/        — Bugs that have been resolved (moved here after fix)
```

### Data Architecture Folder

The `data-architecture/` folder documents how data flows through the entire system, what technologies are used, where data lives, and the principles governing data management. It is the strategic counterpart to `database/schema.sql` (which defines table structure).

| File | Content |
|---|---|
| `overview.md` | Guiding principles, technology stack, system diagram, data locations summary |
| `data-flow.md` | Step-by-step data flow through each pipeline phase, what gets persisted where |
| `external-services.md` | Catalog of all external services (current and planned) with auth, rate limits, integration approach |
| `storage-strategy.md` | Storage tiers (localStorage, browser memory, Supabase PostgreSQL, Supabase Storage, Vercel), file naming, data lifecycle |

**Rules:**
- Update these docs when adding new external services, changing storage decisions, or modifying the pipeline.
- `data-architecture/` is about *system-level decisions*. Table/column details belong in `database/schema.sql`.

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
| `STRIPE_SECRET_KEY` | For Sell phase | Stripe API secret key (server-side only, never in client code) |
| `STRIPE_PUBLISHABLE_KEY` | For Sell phase | Stripe publishable key (served to client for Checkout redirect) |
| `STRIPE_WEBHOOK_SECRET` | For Sell phase | Stripe webhook signing secret for verifying webhook payloads |
| `SUPABASE_SERVICE_ROLE_KEY` | For webhooks | Supabase service role key for server-side writes (bypasses RLS) |

### Supabase Setup
1. Create a Supabase project
2. Run `database/schema.sql` against the Supabase SQL editor
3. Configure Row Level Security (RLS) policies — open policies for operator, scoped policies for customer-facing tables
4. Enable Supabase Auth with email provider (for Customer Admin Portal)
5. Update `SUPABASE_URL` and `SUPABASE_KEY` in `app.js` (see `bugs/hardcoded-supabase-keys.md` — this should eventually move to env vars)

### Stripe Setup (for Sell phase)
1. Create a Stripe account
2. Create a Product + Price in Stripe dashboard (recurring monthly)
3. Set up webhook endpoint pointing to `https://your-domain/api/stripe/webhook`
4. Configure webhook events: `checkout.session.completed`, `invoice.payment_succeeded`, `invoice.payment_failed`, `customer.subscription.deleted`, `customer.subscription.updated`
5. Enable Stripe Customer Portal in Stripe dashboard settings
6. Set environment variables in Vercel dashboard

## Testing

No automated test suite. Test manually by:
1. Opening `index.html` in a browser
2. Entering a Google Places API key
3. Searching for businesses in different countries/types
4. Verifying results render, export works, and save-to-DB functions correctly
