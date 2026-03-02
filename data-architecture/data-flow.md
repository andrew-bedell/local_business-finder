# Data Flow

How data moves through the Find → Gather → Curate → Generate pipeline, what triggers each phase, and what gets persisted where.

## Pipeline Overview

```
FIND ──→ GATHER ──→ CURATE ──→ GENERATE
 │          │          │           │
 │          │          │           ▼
 │          │          │     Vercel (published site)
 │          │          │
 ▼          ▼          ▼
 └──────────┴──────────┴──→ Supabase PostgreSQL + Storage
```

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
