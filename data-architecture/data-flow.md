# Data Flow

How data moves through the full pipeline, what triggers each phase, and what gets persisted where.

## Pipeline Overview

```
FIND ──→ GATHER ──→ CURATE ──→ GENERATE ──→ SELL ──→ MANAGE ──→ ANALYZE
 │          │          │           │           │         │          │
 │          │          │           ▼           ▼         │          │
 │          │          │     Vercel (site)   Stripe     │          │
 │          │          │                                │          │
 ▼          ▼          ▼                                ▼          ▼
 └──────────┴──────────┴────────────────────────────────┴──────────┴──→ Supabase
```

**Phase summary:**

| Phase | Purpose | Operator/Customer |
|---|---|---|
| Find | Discover businesses without websites | Operator |
| Gather | Enrich with photos, reviews, social profiles | Operator |
| Curate | Score, classify, and select best content | Operator |
| Generate | Build and publish the website | Operator |
| Sell | Convert prospect to paying customer via Stripe | Operator |
| Manage | Handle edit requests, re-publish, site lifecycle | Both |
| Analyze | Track website performance, surface insights | Customer |

Each phase reads from the previous phase's output and writes enriched data back to Supabase. The browser holds working data in memory during a session; persistence happens on explicit user action (save) or automatically during Gather/Curate processing.

---

## Phase 1: Find

**Trigger:** User clicks Search after entering location, business type, and radius.

**Input:** User-provided search parameters (location string, business type, radius, country).

**Data flow:**

```
User Input (location, type, radius)
       │
       ▼
geocodeLocation()          ← Google Geocoder API
       │
       ├── latitude, longitude (in-memory only today — BUG: not persisted)
       │
       ▼
searchPlaces()             ← Google Places API (searchNearby)
       │
       ├── Fields requested: displayName, formattedAddress,
       │   nationalPhoneNumber, websiteURI, rating, userRatingCount,
       │   businessStatus, googleMapsURI, types, id (placeId),
       │   reviews, photos, regularOpeningHours
       │
       ▼
mapPlaceToResult()         → Normalize to internal business object
       │
       ▼
Filter: !place.website     → Keep only businesses without websites
       │
       ▼
allResults[] / filteredResults[]   (in-memory arrays)
       │
       ▼
renderTable()              → Display in UI
       │
       ▼ (user action: Save / Save All)
saveBusiness()             → Supabase `businesses` table (upsert on place_id)
```

**What gets persisted (Find phase):**

| Destination | Data | Notes |
|---|---|---|
| Supabase `businesses` | name, place_id, phone, rating, review_count, business_status, maps_url, types, hours, search_location, search_type | Missing: latitude, longitude, website, address_full (see active bugs) |
| Browser memory | Full business objects including photos, reviewData, hours | Lost on page refresh if not saved |
| localStorage | Nothing | Business data never stored in localStorage |

**What should be persisted but isn't (known bugs):**
- `latitude` / `longitude` — calculated during geocoding but not included in the save payload
- `website` — captured as `place.website` but omitted from save
- `address` — saved as `address` instead of `address_full` (column name mismatch)
- `reviews` — sent to a non-existent column on `businesses`; should go to `business_reviews`

---

## Phase 2: Gather (Not Yet Implemented)

**Trigger:** Automatic after a business is saved, or manually triggered by user for enrichment.

**Input:** A saved business record with at minimum `place_id`, `name`, and location data.

**Data flow:**

```
Saved business (from Supabase)
       │
       ├──→ Google Places Details API
       │       → Additional photos, full review text, price_level
       │       → Write to: business_photos, business_reviews
       │
       ├──→ Social Media Discovery (direct API + scraping)
       │       → Search by business name + location
       │       → Facebook Page API / scrape
       │       → Instagram Graph API / scrape
       │       → Yelp API / scrape
       │       → TripAdvisor API / scrape
       │       → Write to: business_social_profiles
       │
       ├──→ Platform-specific enrichment
       │       → Yelp reviews → business_reviews (source: 'yelp')
       │       → TripAdvisor reviews → business_reviews (source: 'tripadvisor')
       │       → Facebook reviews → business_reviews (source: 'facebook')
       │       → Platform photos → business_photos (with source tag)
       │
       ├──→ Photo download & storage
       │       → Download photos from all sources
       │       → Upload to Supabase Storage
       │       → Update business_photos.storage_path
       │
       └──→ Category mapping
               → Map Google Places types[] to human-readable category/subcategory
               → Update businesses.category, businesses.subcategory
```

**What gets persisted (Gather phase):**

| Destination | Data |
|---|---|
| Supabase `business_social_profiles` | Platform URLs, handles, discovery timestamps |
| Supabase `business_photos` | Photo metadata (source, type, URL, storage_path, dimensions) |
| Supabase `business_reviews` | Reviews from all sources (text, rating, author, published date) |
| Supabase Storage | Photo files (originals downloaded from all platforms) |
| Supabase `businesses` | Updated category, subcategory, data_completeness_score |

---

## Phase 3: Curate (Not Yet Implemented)

**Trigger:** After Gather completes, or manually triggered by user to re-curate.

**Input:** Enriched business record with photos, reviews, and social profiles.

**Data flow:**

```
Enriched business data (from Supabase)
       │
       ├──→ Sentiment Analysis (enhanced)
       │       → Score each review in business_reviews
       │       → Update sentiment_score, sentiment_label
       │       → Flag top reviews: is_curated = true
       │
       ├──→ Photo Categorization
       │       → Classify photos by type (exterior, interior, food, team, logo)
       │       → Update business_photos.photo_type
       │       → Select primary photo: is_primary = true
       │
       ├──→ Menu Extraction (restaurants only)
       │       → Find photos where photo_type = 'menu'
       │       → Send to OCR service (Google Cloud Vision / Tesseract)
       │       → Parse OCR text → structured menu items
       │       → Write to: business_menus (with source_photo_id FK)
       │
       └──→ Data Completeness Scoring
               → Evaluate: photos, reviews, social, menu, contact, hours
               → Update businesses.data_completeness_score (0-100)
```

**What gets persisted (Curate phase):**

| Destination | Data |
|---|---|
| Supabase `business_reviews` | sentiment_score, sentiment_label, is_curated flag |
| Supabase `business_photos` | photo_type classification, is_primary flag |
| Supabase `business_menus` | Structured menu items (category, name, description, price, currency) |
| Supabase `businesses` | data_completeness_score |

---

## Phase 4: Generate (Not Yet Implemented)

**Trigger:** User clicks "Generate Website" for a curated business.

**Input:** Fully curated business record with scored reviews, categorized photos, and optionally extracted menus.

**Data flow:**

```
Curated business data (from Supabase)
       │
       ├──→ Template Selection
       │       → Match businesses.category to template library
       │       → Extract or choose brand colors
       │
       ├──→ Content Assembly
       │       → Curated reviews (is_curated = true)
       │       → Categorized photos (by photo_type)
       │       → Menu items (if restaurant)
       │       → Contact info, hours, social links
       │
       ├──→ Visual Gap Filling
       │       → Identify missing photo types (e.g., no exterior photo)
       │       → Generate via NanoBanana API
       │       → Upload to Supabase Storage
       │       → Write to: business_photos (source: 'ai_generated')
       │
       ├──→ Website Generation
       │       → Populate template with assembled content
       │       → Write to: generated_websites (status: 'draft')
       │       → Store config JSON (selected content IDs, generation settings)
       │
       └──→ Publishing
               → Deploy to Vercel
               → Update generated_websites.status = 'published'
               → Update generated_websites.published_url
               → Update generated_websites.published_at
```

**What gets persisted (Generate phase):**

| Destination | Data |
|---|---|
| Supabase `generated_websites` | Template, colors, status, config JSON, published URL |
| Supabase `business_photos` | AI-generated images (source: 'ai_generated', photo_type: 'ai_generated') |
| Supabase Storage | AI-generated image files |
| Vercel | Published static website files |

---

## Phase 5: Sell (Not Yet Implemented)

**Trigger:** Operator clicks "Convert to Customer" on a prospect in the Saved Entries view.

**Input:** A saved business with a generated website, ready to be sold.

**Data flow:**

```
Operator selects prospect business
       │
       ├──→ Pipeline Status Progression (manual)
       │       → prospect → contacted → interested (manual status updates)
       │       → Update businesses.pipeline_status
       │
       ├──→ Convert to Customer (operator action)
       │       → Operator enters: customer email, contact name, monthly price
       │       → Client calls api/stripe/create-checkout-session.js
       │
       ├──→ Vercel Function: create-checkout-session.js
       │       → Creates Stripe Customer (stripe_customer_id)
       │       → Creates Stripe Checkout Session with monthly price
       │       → Returns Checkout Session URL
       │
       ├──→ Stripe Checkout (hosted by Stripe)
       │       → Business owner enters payment info on Stripe's page
       │       → Payment processed by Stripe
       │
       └──→ Stripe Webhook → api/stripe/webhook.js
               → Event: checkout.session.completed
               → Creates customers row (stripe_customer_id, email, price)
               → Creates subscriptions row (stripe_subscription_id, status: 'active')
               → Creates Supabase Auth user (email + temporary password)
               → Creates customer_users row (links auth user to customer)
               → Updates businesses.pipeline_status = 'customer'
```

**What gets persisted (Sell phase):**

| Destination | Data |
|---|---|
| Supabase `businesses` | pipeline_status ('customer'), pipeline_status_changed_at |
| Supabase `customers` | stripe_customer_id, email, contact_name, phone, monthly_price, currency |
| Supabase `subscriptions` | stripe_subscription_id, stripe_price_id, status, period dates |
| Supabase `customer_users` | auth_user_id (from Supabase Auth), customer_id, role |
| Supabase Auth | New user account (email + password) for the business owner |
| Stripe | Customer record, Subscription record, Payment Method (Stripe owns this data) |

**Ongoing webhook events (subscription lifecycle):**

| Stripe Event | Action |
|---|---|
| `invoice.payment_succeeded` | Update subscription period dates |
| `invoice.payment_failed` | Set subscription status to `past_due` |
| `customer.subscription.deleted` | Set subscription status to `cancelled`, set pipeline_status to `churned` |
| `customer.subscription.updated` | Sync subscription status and cancel_at_period_end flag |

---

## Phase 6: Manage (Not Yet Implemented)

**Trigger:** Customer submits edit request via Admin Portal, or operator manages site lifecycle.

**Input:** An active customer with a published website.

**Data flow:**

```
CUSTOMER SIDE (admin.html):
       │
       ├──→ Submit Edit Request
       │       → Customer fills form: type, description, priority
       │       → Write to: edit_requests (status: 'submitted')
       │
       ├──→ Update Contact Info
       │       → Customer edits phone, email, address, hours
       │       → Update: businesses (within RLS scope)
       │       → Optionally auto-creates edit_request (type: 'contact_update')
       │
       └──→ Cancel Subscription
               → Sets cancel_at_period_end = true on Stripe subscription
               → Subscription remains active until period end
               → Stripe webhook fires at period end → status = 'cancelled'

OPERATOR SIDE (index.html):
       │
       ├──→ Review Edit Requests
       │       → View queue of submitted/in_review/in_progress requests
       │       → Update edit_requests.status as work progresses
       │
       ├──→ Apply Edits
       │       → Update business data, photos, reviews, menus in Supabase
       │       → Re-run Generate phase (or partial re-generation)
       │       → Re-publish to Vercel
       │       → Update generated_websites (version++, last_edited_at)
       │       → Mark edit_request as completed
       │
       └──→ Site Lifecycle Management
               → Subscription cancelled → site_status = 'suspended'
               → Subscription reactivated → site_status = 'active'
               → Business deleted → site_status = 'archived'
```

**What gets persisted (Manage phase):**

| Destination | Data |
|---|---|
| Supabase `edit_requests` | Request type, description, priority, status lifecycle, timestamps |
| Supabase `generated_websites` | site_status, version, last_edited_at |
| Supabase `businesses` | Contact info updates from customer self-service |
| Vercel | Re-published website files |

---

## Phase 7: Analyze (Not Yet Implemented)

**Trigger:** Continuous (tracking script fires on every published website visit) + customer views dashboard.

**Input:** Published website with embedded tracking script, customer viewing Admin Portal analytics section.

**Data flow:**

```
PUBLISHED WEBSITE (visitor interaction):
       │
       └──→ Tracking Script (embedded in generated website)
               → Fires on: page_view, click_phone, click_email,
               │  click_directions, click_social, form_submit
               → POST to: api/analytics/track.js
               → Write to: analytics_events

VERCEL CRON (daily):
       │
       └──→ api/analytics/summarize.js
               → Aggregate yesterday's analytics_events per business
               → Calculate: page_views, unique_visitors, phone_clicks,
               │  email_clicks, direction_clicks, social_clicks, form_submissions
               → Compute: top_referrers (JSONB), device_breakdown (JSONB)
               → Write to: analytics_summaries (upsert on business_id + date)

CUSTOMER ADMIN PORTAL (admin.html):
       │
       └──→ Analytics Dashboard
               → Read from: analytics_summaries (fast, pre-aggregated)
               → Display: visitor trends, action metrics, traffic sources, device breakdown
               → Date range selector: 7d / 30d / 90d / custom
               → Period-over-period comparison (% change from previous period)
```

**What gets persisted (Analyze phase):**

| Destination | Data |
|---|---|
| Supabase `analytics_events` | Raw events: event_type, page_url, referrer, device_type, metadata, timestamp |
| Supabase `analytics_summaries` | Daily rollups: page_views, unique_visitors, clicks by type, top_referrers, device_breakdown |

**Privacy:**
- No cookies, no PII, no IP addresses stored
- Device type from User-Agent category (not raw UA string)
- Referrer stored as domain only
- First-party tracking only — no third-party analytics services

---

## Cross-Cutting: Data Completeness Score

The `data_completeness_score` on `businesses` is calculated as a weighted sum updated after each phase:

| Criteria | Max Points | Source |
|---|---|---|
| Photos (3+ categorized) | 20 | business_photos |
| Reviews (5+ with sentiment) | 20 | business_reviews |
| Social profiles (2+ platforms) | 15 | business_social_profiles |
| Menu data (restaurants only) | 15 | business_menus |
| Contact info (phone + email) | 15 | businesses |
| Operating hours | 15 | businesses.hours |
| **Total** | **100** | |

This score determines readiness for website generation and helps prioritize businesses for enrichment.
