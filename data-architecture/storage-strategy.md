# Storage Strategy

Where each type of data lives, why it lives there, and how it moves between storage tiers.

## Storage Tiers

This system uses five storage tiers, each with a distinct purpose:

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
                          │ saveBusiness() / Gather / Curate / Sell
                          ▼
┌──────────────────────────────────────────────────────────┐
│                   SUPABASE (durable)                      │
│                                                          │
│  PostgreSQL                    Storage       Auth        │
│  ┌────────────────────────┐    ┌──────────┐  ┌────────┐ │
│  │ businesses             │    │ photos/  │  │ users  │ │
│  │ business_social_profiles│   │  {biz}/  │  │(customer│ │
│  │ business_photos        │    │   {file} │  │ logins)│ │
│  │ business_reviews       │    └──────────┘  └────────┘ │
│  │ business_menus         │                              │
│  │ generated_websites     │                              │
│  │ customers              │                              │
│  │ subscriptions          │                              │
│  │ customer_users         │                              │
│  │ edit_requests          │                              │
│  │ analytics_events       │                              │
│  │ analytics_summaries    │                              │
│  └────────────────────────┘                              │
│                                                          │
└──────────────────────────────────────────────────────────┘
          │                                    │
          │ Generate/Manage (publish)          │ Sell (billing)
          ▼                                    ▼
┌──────────────────────────┐   ┌───────────────────────────┐
│     VERCEL (public)       │   │     STRIPE (billing)      │
│                          │   │                           │
│  Published websites      │   │  Customer records         │
│  Serverless functions    │   │  Subscriptions            │
│  Cron jobs (analytics)   │   │  Payment methods          │
│                          │   │  Invoices                 │
└──────────────────────────┘   └───────────────────────────┘
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
| `businesses` | Core business identity, location, contact, Google data, pipeline status, tracking | Find, Gather, Sell (pipeline_status) | All phases |
| `business_social_profiles` | One row per platform per business (URL + handle) | Gather | Generate |
| `business_photos` | Photo metadata: source, type, URL, storage path, dimensions | Gather, Curate (classification), Generate (AI images) | Curate, Generate |
| `business_reviews` | Reviews from all sources with sentiment scores and curation flags | Gather (raw reviews), Curate (scoring + curation) | Generate, Analyze |
| `business_menus` | Structured menu items extracted from photos | Curate | Generate |
| `generated_websites` | Website generation records: template, colors, site_status, config, published URL, version | Generate, Manage (re-publish, status changes) | Manage, Analyze |
| `customers` | Business-to-customer relationship, Stripe references, billing details | Sell | Manage, Analyze |
| `subscriptions` | Stripe subscription status, billing periods, cancellation state | Sell (create), Stripe webhooks (update) | Manage, Admin Portal |
| `customer_users` | Links Supabase Auth users to customer records (for RLS) | Sell (user creation) | Admin Portal (RLS enforcement) |
| `edit_requests` | Customer-submitted website change requests with status lifecycle | Manage (customer submits), Manage (operator updates) | Manage |
| `analytics_events` | Raw website visitor tracking events | Analyze (tracking script) | Analyze (summarize cron) |
| `analytics_summaries` | Daily pre-aggregated metrics per business | Analyze (summarize cron) | Analyze (dashboard display) |

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

Multiple columns use JSONB for flexible, semi-structured data:

| Column | Table | Content |
|---|---|---|
| `hours` | `businesses` | Weekly schedule from Google (array of day strings or structured object) |
| `config` | `generated_websites` | Generation settings: selected review IDs, photo IDs, template overrides, color choices |
| `metadata` | `analytics_events` | Flexible event-specific data (e.g., social platform name for click_social events) |
| `top_referrers` | `analytics_summaries` | Aggregated referrer domains with visit counts |
| `device_breakdown` | `analytics_summaries` | Aggregated device type percentages |

JSONB is appropriate here because:
- `hours` format varies by source and doesn't need relational queries
- `config` is opaque to the database — only the application interprets it
- Analytics metadata and aggregations vary by event type and are only read by the dashboard

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

## Tier 6: Stripe (Billing Data)

**Purpose:** All payment-related data. Stripe is the system of record for billing — our database stores only reference IDs.

### What Stripe Owns

| Data | Stored In Stripe | Stored In Our DB |
|---|---|---|
| Customer identity | Full record (name, email, metadata) | `customers.stripe_customer_id` (reference only) |
| Payment methods | Card details, bank accounts (PCI-compliant vault) | Never — not even last 4 digits |
| Subscriptions | Full lifecycle (status, billing dates, invoices) | `subscriptions.stripe_subscription_id`, `status`, `period dates` (synced via webhooks) |
| Invoices | Full invoice records, line items, PDF generation | Not stored — read via Stripe API on demand for Admin Portal |
| Payment history | All transaction records | Not stored — read via Stripe API on demand |

### Why This Separation

- **PCI compliance** — Storing credit card data requires PCI DSS certification. By using Stripe Checkout and Customer Portal (both hosted by Stripe), payment data never touches our infrastructure.
- **Single source of truth** — Stripe is authoritative for billing state. Our database mirrors subscription status via webhooks but Stripe is always the canonical source.
- **Reduced liability** — If our database is compromised, no payment data is exposed.

### Sync Strategy

Stripe → Our DB (one-way via webhooks). We never write billing data back to Stripe from our database. The only writes to Stripe are:
- Creating checkout sessions (operator converts prospect to customer)
- Creating Customer Portal sessions (customer manages billing)

---

## Data Lifecycle

How data ages and when it should be refreshed:

| Data | Freshness Concern | Refresh Strategy |
|---|---|---|
| Business core info (name, address, phone) | Rarely changes | Re-search / manual update / customer self-service |
| Google rating & review count | Changes frequently | Refresh on re-enrichment (Gather phase re-run) |
| Reviews | New reviews added over time | Periodic re-gather (frequency TBD) |
| Photos | Relatively stable | Re-gather if completeness score is low |
| Social profiles | URLs can change, accounts deleted | Periodic re-validation (frequency TBD) |
| Menu items | Menus change seasonally | Re-extract from new menu photos |
| Generated websites | Stale if underlying data changes | Re-generate when source data updated or edit request completed |
| Subscription status | Real-time (payment events) | Stripe webhooks update status automatically |
| Analytics events | Continuous (every page visit) | Written in real-time by tracking script |
| Analytics summaries | Daily | Vercel Cron job runs daily rollup |
| Customer contact info | Customer-initiated | Self-service updates via Admin Portal |

### Automated vs. Manual Refresh

Most data updates are triggered by user action (re-search, re-enrich, re-generate). Three exceptions use automated server-side mechanisms:

| Mechanism | Purpose | Trigger |
|---|---|---|
| **Stripe webhooks** | Subscription lifecycle (payment success/failure, cancellation) | Stripe server-to-server callback → `api/stripe/webhook.js` |
| **Analytics tracking** | Website visitor events | Published website → `api/analytics/track.js` |
| **Vercel Cron** | Daily analytics summary rollups | Scheduled daily → `api/analytics/summarize.js` |
