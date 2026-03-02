# Data Architecture Overview

## Guiding Principles

1. **Client-first, server-light** — The browser is the application runtime. There is no backend application server. Serverless functions handle only what the client cannot (secret management, webhook endpoints, Stripe operations, analytics ingestion).
2. **Supabase as the single persistence layer** — All durable business data lives in Supabase PostgreSQL. File assets live in Supabase Storage. Authentication uses Supabase Auth. There is no secondary database, no caching tier, no message queue.
3. **No caching layer** — Data flows from external APIs → in-memory processing → Supabase persistence. No Redis, no service workers caching API responses, no localStorage data cache. Keep the architecture simple until scale demands otherwise.
4. **Direct API + scraping hybrid for data sourcing** — Gather-phase data comes from official platform APIs where available and web scraping where APIs are unavailable, rate-limited, or cost-prohibitive.
5. **Photos are persisted, not linked** — All photos used in generated websites are downloaded and stored in Supabase Storage. Source URLs are recorded for provenance but not relied upon at serving time, since third-party URLs expire or change.
6. **Schema is forward-looking, code catches up** — The database schema (`database/schema.sql`) is designed for the complete pipeline. Application code currently implements only the Find phase and is incrementally extended to use the full schema.
7. **Two audiences, separated by auth** — The operator uses `index.html` (no auth required today, single-operator). Business owner customers use `admin.html` (authenticated via Supabase Auth, scoped to their own data via RLS).
8. **Stripe owns billing, we own the rest** — Stripe handles payment processing, subscription lifecycle, invoicing, and PCI compliance. Our system stores only the Stripe Customer ID and Subscription ID as foreign references. Sensitive payment data never touches our database.
9. **First-party analytics only** — Website visitor tracking uses a lightweight, privacy-friendly, first-party script. No cookies, no PII, no third-party analytics services. Raw events are rolled up into daily summaries.

## Technology Stack

| Layer | Technology | Role |
|---|---|---|
| **Client runtime** | Vanilla HTML/CSS/JS (no framework) | All UI, search, filtering, data display |
| **Customer portal** | Vanilla HTML/CSS/JS (`admin.html` + `admin.js`) | Business owner self-service: contact, billing, edit requests, analytics |
| **Authentication** | Supabase Auth | Customer login (email + password), session management, RLS enforcement |
| **Database** | Supabase PostgreSQL | Business records, reviews, menus, social profiles, customers, subscriptions, analytics, website tracking |
| **File storage** | Supabase Storage | Persisted photos (originals and AI-generated), menu images |
| **Serverless functions** | Vercel Functions (Node.js) | API key proxy, Stripe checkout/webhooks, analytics ingestion, Stripe Customer Portal |
| **Published websites** | Vercel | Hosting for generated business websites |
| **Payments** | Stripe | Subscription billing, checkout, invoicing, Customer Portal for payment management |
| **External APIs** | Google Places API (New), Google Maps JS API | Business discovery, geocoding, photos, reviews, hours |
| **Future external APIs** | Facebook, Instagram, Yelp, TripAdvisor, others | Social profiles, reviews, photos (Gather phase) |
| **Future AI services** | NanoBanana API | AI-generated images to fill visual gaps |
| **Future OCR** | Google Cloud Vision or Tesseract | Menu photo → structured data extraction |

## System Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        OPERATOR'S BROWSER                               │
│                                                                         │
│  index.html + app.js + styles.css                                       │
│  ┌──────┐ ┌────────┐ ┌────────┐ ┌──────────┐ ┌──────┐ ┌────────┐      │
│  │ Find │→│ Gather │→│ Curate │→│ Generate │→│ Sell │→│ Manage │      │
│  └──┬───┘ └───┬────┘ └───┬────┘ └────┬─────┘ └──┬───┘ └───┬────┘      │
│     │         │          │           │           │         │            │
└─────┼─────────┼──────────┼───────────┼───────────┼─────────┼────────────┘
      │         │          │           │           │         │
      ▼         ▼          ▼           ▼           ▼         │
┌───────────┐ ┌──────────┐ ┌─────────┐ ┌───────┐ ┌──────┐   │
│Google APIs│ │Social APIs│ │ AI/OCR  │ │Vercel │ │Stripe│   │
│Places,Maps│ │FB,IG,Yelp│ │NanoBnna │ │hosting│ │billing│  │
│Geocoder   │ │TripAdvsr │ │CloudOCR │ │       │ │       │   │
└───────────┘ └──────────┘ └─────────┘ └───────┘ └──────┘   │
                                                              │
┌─────────────────────────────────────────────────────────────┼───────────┐
│                     CUSTOMER'S BROWSER                       │           │
│                                                              │           │
│  admin.html + admin.js + admin.css                           │           │
│  ┌───────────┐ ┌──────────┐ ┌─────────┐ ┌─────────────┐     │           │
│  │  Contact  │ │ Billing  │ │ Edit    │ │  Analytics  │     │           │
│  │  Info     │ │ (Stripe) │ │ Requests│ │  Dashboard  │     │           │
│  └─────┬─────┘ └────┬─────┘ └────┬────┘ └──────┬──────┘     │           │
│        │            │            │              │            │           │
└────────┼────────────┼────────────┼──────────────┼────────────┘           │
         │            │            │              │                        │
         ▼            ▼            ▼              ▼                        ▼
  ┌──────────────────────────────────────────────────────────────────────────┐
  │                            SUPABASE                                      │
  │  ┌──────────┐ ┌───────────┐ ┌──────────────┐                            │
  │  │PostgreSQL│ │  Storage   │ │     Auth     │                            │
  │  │12 tables │ │  (photos)  │ │  (customers) │                            │
  │  └──────────┘ └───────────┘ └──────────────┘                            │
  └──────────────────────────────────────────────────────────────────────────┘
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
| Customer records | Supabase PostgreSQL (`customers`) | Business-to-customer relationship, Stripe references |
| Subscriptions | Supabase PostgreSQL (`subscriptions`) | Stripe subscription status, billing periods |
| Customer auth accounts | Supabase Auth | Email/password login, session tokens, password reset |
| Customer-to-auth mapping | Supabase PostgreSQL (`customer_users`) | Links Supabase Auth user to customer record |
| Edit requests | Supabase PostgreSQL (`edit_requests`) | Customer-submitted website change requests |
| Analytics events | Supabase PostgreSQL (`analytics_events`) | Raw website visitor tracking data |
| Analytics summaries | Supabase PostgreSQL (`analytics_summaries`) | Daily rollups for fast dashboard queries |
| Photos (files) | Supabase Storage | Persistent, CDN-served, not dependent on third-party URL stability |
| Photo metadata | Supabase PostgreSQL (`business_photos`) | Source, type, dimensions, primary flag |
| In-flight search results | Browser memory (`allResults`, `filteredResults`) | Session-scoped, not persisted until user saves |
| Published websites | Vercel | Static hosting with global CDN |
| Payment data (cards, invoices) | Stripe (never in our DB) | PCI compliance — Stripe owns all sensitive payment data |

## What This Is Not

- **Not a microservices architecture.** There is one client, one database, and thin serverless functions. No service mesh, no containers, no orchestration.
- **Not an event-driven system.** Data flows synchronously through the pipeline in the user's browser session. There are no queues, no pub/sub. The one exception is Stripe webhooks, which are asynchronous server-to-server callbacks.
- **Two-audience, not multi-tenant.** There are exactly two roles: the operator (us) and customers (business owners). This is not a general-purpose multi-tenant SaaS with arbitrary organizations. The operator sees all data; each customer sees only their own. Supabase RLS enforces this boundary for customer-facing pages.
- **Not a payment processor.** We never handle credit card numbers, bank details, or PCI-sensitive data. Stripe handles all payment operations. Our database stores only Stripe reference IDs (`stripe_customer_id`, `stripe_subscription_id`).
