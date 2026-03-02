# Data Architecture Overview

## Guiding Principles

1. **Client-first, server-light** — The browser is the application runtime. There is no backend application server. Serverless functions handle only what the client cannot (secret management, future webhook endpoints).
2. **Supabase as the single persistence layer** — All durable business data lives in Supabase PostgreSQL. File assets live in Supabase Storage. There is no secondary database, no caching tier, no message queue.
3. **No caching layer** — Data flows from external APIs → in-memory processing → Supabase persistence. No Redis, no service workers caching API responses, no localStorage data cache. Keep the architecture simple until scale demands otherwise.
4. **Direct API + scraping hybrid for data sourcing** — Gather-phase data comes from official platform APIs where available and web scraping where APIs are unavailable, rate-limited, or cost-prohibitive.
5. **Photos are persisted, not linked** — All photos used in generated websites are downloaded and stored in Supabase Storage. Source URLs are recorded for provenance but not relied upon at serving time, since third-party URLs expire or change.
6. **Schema is forward-looking, code catches up** — The database schema (`database/schema.sql`) is designed for the complete pipeline. Application code currently implements only the Find phase and is incrementally extended to use the full schema.

## Technology Stack

| Layer | Technology | Role |
|---|---|---|
| **Client runtime** | Vanilla HTML/CSS/JS (no framework) | All UI, search, filtering, data display |
| **Database** | Supabase PostgreSQL | Business records, reviews, menus, social profiles, website generation tracking |
| **File storage** | Supabase Storage | Persisted photos (originals and AI-generated), menu images |
| **Serverless functions** | Vercel Functions (Node.js) | API key proxy (`api/config.js`), future webhook handlers |
| **Published websites** | Vercel | Hosting for generated business websites |
| **External APIs** | Google Places API (New), Google Maps JS API | Business discovery, geocoding, photos, reviews, hours |
| **Future external APIs** | Facebook, Instagram, Yelp, TripAdvisor, others | Social profiles, reviews, photos (Gather phase) |
| **Future AI services** | NanoBanana API | AI-generated images to fill visual gaps |
| **Future OCR** | Google Cloud Vision or Tesseract | Menu photo → structured data extraction |

## System Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                          USER'S BROWSER                             │
│                                                                     │
│  index.html + app.js + styles.css                                   │
│  ┌────────────┐  ┌──────────────┐  ┌──────────────┐  ┌───────────┐ │
│  │    Find     │→│    Gather    │→│    Curate     │→│  Generate  │ │
│  │  (search)   │  │  (enrich)    │  │  (select)    │  │ (website)  │ │
│  └──────┬─────┘  └──────┬───────┘  └──────┬───────┘  └─────┬─────┘ │
│         │               │                 │                 │       │
└─────────┼───────────────┼─────────────────┼─────────────────┼───────┘
          │               │                 │                 │
          ▼               ▼                 ▼                 ▼
   ┌─────────────┐ ┌──────────────┐  ┌───────────┐   ┌─────────────┐
   │ Google APIs  │ │ Social APIs  │  │ AI / OCR  │   │   Vercel    │
   │ Places, Maps │ │ FB, IG, Yelp │  │ NanoBanana│   │  (hosting)  │
   │ Geocoder     │ │ TripAdvisor  │  │ Cloud OCR │   │             │
   └─────────────┘ └──────────────┘  └───────────┘   └─────────────┘
                          │                 │
                          ▼                 ▼
                   ┌─────────────────────────────┐
                   │         SUPABASE             │
                   │  ┌──────────┐ ┌───────────┐  │
                   │  │PostgreSQL│ │  Storage   │  │
                   │  │ 6 tables │ │  (photos)  │  │
                   │  └──────────┘ └───────────┘  │
                   └─────────────────────────────┘
```

## Data Locations Summary

| Data Type | Where It Lives | Why |
|---|---|---|
| User preferences (language, API key) | `localStorage` | Ephemeral, per-device, no auth required |
| Business records | Supabase PostgreSQL (`businesses`) | Durable, queryable, shared across sessions |
| Social profiles | Supabase PostgreSQL (`business_social_profiles`) | Relational link to businesses |
| Reviews | Supabase PostgreSQL (`business_reviews`) | Scored and curated for website generation |
| Menu items | Supabase PostgreSQL (`business_menus`) | Structured data extracted from images |
| Website generation records | Supabase PostgreSQL (`generated_websites`) | Track generation status and config |
| Photos (files) | Supabase Storage | Persistent, CDN-served, not dependent on third-party URL stability |
| Photo metadata | Supabase PostgreSQL (`business_photos`) | Source, type, dimensions, primary flag |
| In-flight search results | Browser memory (`allResults`, `filteredResults`) | Session-scoped, not persisted until user saves |
| Published websites | Vercel | Static hosting with global CDN |

## What This Is Not

- **Not a microservices architecture.** There is one client, one database, and thin serverless functions. No service mesh, no containers, no orchestration.
- **Not an event-driven system.** Data flows synchronously through the pipeline in the user's browser session. There are no queues, no pub/sub, no background workers (yet).
- **Not a multi-tenant platform.** There is no user authentication, no tenant isolation, no RBAC. The Supabase anon key has open RLS policies. This is appropriate for the current single-operator use case but must change before any multi-user deployment.
