# Storage Strategy

Where each type of data lives, why it lives there, and how it moves between storage tiers.

## Storage Tiers

This system uses four storage tiers, each with a distinct purpose:

```
┌──────────────────────────────────────────────────────────┐
│                   BROWSER (ephemeral)                     │
│                                                          │
│  localStorage          In-Memory (JS variables)          │
│  ┌──────────────┐      ┌────────────────────────┐        │
│  │ app_lang     │      │ allResults[]            │        │
│  │ api_key      │      │ filteredResults[]       │        │
│  └──────────────┘      │ (full business objects) │        │
│                        └────────────────────────┘        │
│                                                          │
└──────────────────────────────────────────────────────────┘
                          │
                          │ saveBusiness() / Gather / Curate
                          ▼
┌──────────────────────────────────────────────────────────┐
│                   SUPABASE (durable)                      │
│                                                          │
│  PostgreSQL                    Storage                   │
│  ┌────────────────────────┐    ┌───────────────────────┐ │
│  │ businesses             │    │ photos/               │ │
│  │ business_social_profiles│   │   {business_id}/      │ │
│  │ business_photos        │    │     {filename}        │ │
│  │ business_reviews       │    └───────────────────────┘ │
│  │ business_menus         │                              │
│  │ generated_websites     │                              │
│  └────────────────────────┘                              │
│                                                          │
└──────────────────────────────────────────────────────────┘
                          │
                          │ Generate phase (publish)
                          ▼
┌──────────────────────────────────────────────────────────┐
│                   VERCEL (public)                         │
│                                                          │
│  Published websites (static HTML/CSS/JS)                 │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

---

## Tier 1: localStorage (User Preferences)

**Purpose:** Store user-specific preferences that should survive page refreshes but are not business data.

**Characteristics:**
- Per-device, per-browser
- No authentication required
- ~5 MB limit (more than sufficient)
- Synchronous read/write

| Key | Type | Default | Purpose |
|---|---|---|---|
| `app_lang` | `'en'` \| `'es'` | `'en'` | UI language preference |
| `google_places_api_key` | `string` | `''` | User's Google Places API key |

**Rules:**
- Never store business data in localStorage.
- Always provide a fallback when reading: `localStorage.getItem('key') || 'default'`.
- New keys must be documented here and in the CLAUDE.md localStorage Keys table.

---

## Tier 2: Browser Memory (Session-Scoped Working Data)

**Purpose:** Hold search results and working data during the current browser session. This is the "workspace" where data is processed before persistence.

**Key variables (in `app.js` IIFE):**

| Variable | Type | Lifecycle | Content |
|---|---|---|---|
| `allResults` | `Array<BusinessObject>` | Search → page close | All results from the most recent search |
| `filteredResults` | `Array<BusinessObject>` | Filter change → page close | Subset of `allResults` after filter/sort |
| `apiKey` | `string` | Init → page close | Current Google API key |
| `mapsLoaded` | `boolean` | Maps load → page close | Whether Google Maps JS API is ready |
| `isSearching` | `boolean` | Search start → search end | Search lock flag |

**What lives here that doesn't exist in the database:**
- Raw Google Places photo objects (with `.getURI()` methods) — only the resulting URLs are persisted
- Review `relativePublishTimeDescription` — relative timestamps like "2 months ago" (not useful to persist)
- `authorAttribution.photoURI` — Google-hosted author photos (not downloaded)

**Data loss risk:** All in-memory data is lost on page refresh. Users must explicitly save businesses to Supabase. The UI should make this clear.

---

## Tier 3: Supabase PostgreSQL (Durable Business Data)

**Purpose:** All persistent, queryable business data. This is the single source of truth once data leaves browser memory.

### Table → Data Mapping

| Table | What It Stores | Written By Phase | Read By Phase |
|---|---|---|---|
| `businesses` | Core business identity, location, contact, Google data, tracking metadata | Find, Gather | Gather, Curate, Generate |
| `business_social_profiles` | One row per platform per business (URL + handle) | Gather | Generate |
| `business_photos` | Photo metadata: source, type, URL, storage path, dimensions | Gather, Curate (classification), Generate (AI images) | Curate, Generate |
| `business_reviews` | Reviews from all sources with sentiment scores and curation flags | Gather (raw reviews), Curate (scoring + curation) | Generate |
| `business_menus` | Structured menu items extracted from photos | Curate | Generate |
| `generated_websites` | Website generation records: template, colors, status, config, published URL | Generate | Generate (re-publish, archive) |

### Upsert Strategy

The `place_id` on `businesses` is the natural unique key. All saves use upsert semantics:

```
INSERT ... ON CONFLICT (place_id) DO UPDATE SET ...
```

This means:
- First save creates the record
- Subsequent saves (from Gather enrichment, re-search, etc.) update existing data
- No duplicate records for the same Google Place

### Foreign Key Cascade

All child tables (`business_social_profiles`, `business_photos`, `business_reviews`, `business_menus`, `generated_websites`) have `ON DELETE CASCADE` on their `business_id` foreign key. Deleting a business removes all associated data.

### JSONB Fields

Two columns use JSONB for flexible, semi-structured data:

| Column | Table | Content |
|---|---|---|
| `hours` | `businesses` | Weekly schedule from Google (array of day strings or structured object) |
| `config` | `generated_websites` | Generation settings: selected review IDs, photo IDs, template overrides, color choices |

JSONB is appropriate here because:
- `hours` format varies by source and doesn't need relational queries
- `config` is opaque to the database — only the application interprets it

### Array Fields

PostgreSQL arrays are used for multi-value fields that don't need their own table:

| Column | Table | Example Values |
|---|---|---|
| `types` | `businesses` | `{'restaurant', 'food', 'establishment'}` |
| `payment_methods` | `businesses` | `{'cash', 'credit_card', 'debit_card'}` |
| `languages_spoken` | `businesses` | `{'en', 'es'}` |

---

## Tier 4: Supabase Storage (File Assets)

**Purpose:** Persist photo files so generated websites don't depend on third-party URLs that may expire, change, or be rate-limited.

### Bucket Structure

```
photos/
  └── {business_id}/
        ├── google-exterior-001.jpg
        ├── google-interior-001.jpg
        ├── facebook-food-001.jpg
        ├── ai-exterior-001.png
        └── menu-001.jpg
```

### Naming Convention

```
{source}-{photo_type}-{sequence}.{ext}
```

- `source`: `google`, `facebook`, `instagram`, `yelp`, `tripadvisor`, `ai`
- `photo_type`: `exterior`, `interior`, `food`, `product`, `team`, `logo`, `menu`
- `sequence`: zero-padded 3-digit counter (`001`, `002`, etc.)
- `ext`: original file extension, or `jpg` if unknown

### Storage Path Tracking

Every photo has two URL fields in `business_photos`:
- `url` — the original source URL (for provenance / re-download)
- `storage_path` — the Supabase Storage path (for serving)

Generated websites reference `storage_path`, never `url`. This decouples serving from the original source.

### Access Control

Supabase Storage buckets should be configured as:
- **Public read** for the `photos` bucket (since generated websites need to serve these images without auth)
- **Authenticated write** (service key or authenticated user) to prevent unauthorized uploads

---

## Tier 5: Vercel (Published Websites)

**Purpose:** Host the static files for generated business websites.

### What Gets Deployed

Each generated website is a self-contained static site:
- HTML file(s) populated with business data
- CSS for the chosen template
- Images referenced from Supabase Storage CDN URLs (not bundled)

### Deployment Flow

```
generated_websites.config (JSON) → template engine → static HTML/CSS
                                                         │
                                                         ▼
                                                   Vercel deploy
                                                         │
                                                         ▼
                                              generated_websites.published_url
```

The `published_url` is stored back in Supabase so the system knows where the live site is.

---

## Data Lifecycle

How data ages and when it should be refreshed:

| Data | Freshness Concern | Refresh Strategy |
|---|---|---|
| Business core info (name, address, phone) | Rarely changes | Re-search / manual update |
| Google rating & review count | Changes frequently | Refresh on re-enrichment (Gather phase re-run) |
| Reviews | New reviews added over time | Periodic re-gather (frequency TBD) |
| Photos | Relatively stable | Re-gather if completeness score is low |
| Social profiles | URLs can change, accounts deleted | Periodic re-validation (frequency TBD) |
| Menu items | Menus change seasonally | Re-extract from new menu photos |
| Generated websites | Stale if underlying data changes | Re-generate when source data is updated |

### No Automatic Refresh

There is no automated refresh mechanism today. All data updates are triggered by user action (re-search, re-enrich, re-generate). A future enhancement could add periodic background refresh, but that would require a server-side scheduler (Vercel Cron or Supabase Edge Functions), which is out of scope for the current client-first architecture.
