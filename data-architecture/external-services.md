# External Services

Every external service the system integrates with — current and planned. Includes purpose, auth method, data sourced, and integration approach.

## Currently Integrated

### Google Places API (New)

| Field | Value |
|---|---|
| **Purpose** | Business discovery, details, photos, reviews |
| **Pipeline phase** | Find, Gather |
| **Auth** | API key (stored in localStorage or served via `api/config.js` proxy) |
| **Client library** | Google Maps JavaScript API (loaded dynamically via `<script>`) |
| **Key methods** | `Place.searchNearby()`, `place.getURI()` (photos) |
| **Data sourced** | Business name, address, phone, website, rating, review count, reviews (text + author), photos, hours, types, place ID, maps URL, business status |
| **Rate limits** | Per-project quotas set in Google Cloud Console. Default: 6,000 QPM for Places API |
| **Cost model** | Pay-per-use. searchNearby and Place Details billed per request + per field category (Basic, Contact, Atmosphere) |
| **Integration** | Direct — client-side JavaScript via Google Maps JS API |

### Google Geocoding API

| Field | Value |
|---|---|
| **Purpose** | Convert user-entered location string to latitude/longitude |
| **Pipeline phase** | Find |
| **Auth** | Same API key as Places (bundled in Maps JS API) |
| **Client library** | `google.maps.Geocoder` (part of Maps JS API) |
| **Key methods** | `geocoder.geocode({ address })` |
| **Data sourced** | Latitude, longitude for the search center point |
| **Rate limits** | 50 QPS per project |
| **Cost model** | $5 per 1,000 requests |
| **Integration** | Direct — client-side JavaScript |

### Supabase

| Field | Value |
|---|---|
| **Purpose** | Persistent data storage (PostgreSQL) and file storage |
| **Pipeline phase** | All phases |
| **Auth** | Anon key (currently hardcoded in `app.js` — see `bugs/hardcoded-supabase-keys.md`) |
| **Client library** | Supabase JS SDK v2 (loaded via CDN `<script>` tag) |
| **Key methods** | `supabase.from('table').upsert()`, `supabase.from('table').select()`, `supabase.storage.from('bucket').upload()` |
| **Data sourced** | N/A — this is our persistence layer, not a data source |
| **Rate limits** | Depends on Supabase plan (Free: 500 MB database, 1 GB storage, 50,000 monthly active users) |
| **Cost model** | Free tier available. Pro plan $25/month for higher limits |
| **Integration** | Direct — client-side JavaScript via SDK |

### Vercel Functions

| Field | Value |
|---|---|
| **Purpose** | API key proxy, future webhook handlers |
| **Pipeline phase** | Infrastructure (supports Find phase) |
| **Auth** | Environment variables set in Vercel dashboard |
| **Current functions** | `api/config.js` — serves Google API key from `process.env.GOOGLE_PLACES_API_KEY` |
| **Data sourced** | N/A — proxies secrets, doesn't source data |
| **Rate limits** | Hobby: 100 GB-hours/month, 12 concurrent executions |
| **Cost model** | Free tier (Hobby). Pro $20/month |
| **Integration** | Fetch from client to `/api/config` endpoint |

---

## Planned: Social Media Platforms

Integration approach: **Direct APIs where available, web scraping as fallback.** Each platform provides social profile links, and some provide reviews/photos.

### Facebook Pages API

| Field | Value |
|---|---|
| **Purpose** | Business page discovery, reviews, photos |
| **Pipeline phase** | Gather |
| **Auth** | Facebook App access token (OAuth 2.0) |
| **Data sourced** | Page URL, page ratings/reviews, cover photo, profile photo, posts with photos |
| **Writes to** | `business_social_profiles` (platform: 'facebook'), `business_reviews` (source: 'facebook'), `business_photos` (source: 'facebook') |
| **Integration** | Direct API — Graph API v18+ |
| **Fallback** | Scrape public page info if API access is restricted |

### Instagram Graph API

| Field | Value |
|---|---|
| **Purpose** | Business profile discovery, photos |
| **Pipeline phase** | Gather |
| **Auth** | Instagram Business/Creator token via Facebook Login |
| **Data sourced** | Profile URL, handle, recent post photos |
| **Writes to** | `business_social_profiles` (platform: 'instagram'), `business_photos` (source: 'instagram') |
| **Integration** | Direct API — requires linked Facebook Page |
| **Fallback** | Scrape public profile and recent posts |

### WhatsApp Business

| Field | Value |
|---|---|
| **Purpose** | Discover WhatsApp contact number for business |
| **Pipeline phase** | Gather |
| **Auth** | N/A — discovered via other platforms or Google |
| **Data sourced** | WhatsApp number/link |
| **Writes to** | `business_social_profiles` (platform: 'whatsapp'), `businesses.whatsapp` |
| **Integration** | Scrape from Facebook Page, Google listing, or business website (if exists elsewhere) |

### Twitter / X API

| Field | Value |
|---|---|
| **Purpose** | Business profile discovery |
| **Pipeline phase** | Gather |
| **Auth** | Bearer token (OAuth 2.0) |
| **Data sourced** | Profile URL, handle |
| **Writes to** | `business_social_profiles` (platform: 'twitter') |
| **Integration** | Direct API v2 |
| **Fallback** | Scrape public profile |

### TikTok API

| Field | Value |
|---|---|
| **Purpose** | Business profile discovery |
| **Pipeline phase** | Gather |
| **Auth** | App credentials |
| **Data sourced** | Profile URL, handle |
| **Writes to** | `business_social_profiles` (platform: 'tiktok') |
| **Integration** | Scrape (TikTok API for business is limited) |

### LinkedIn API

| Field | Value |
|---|---|
| **Purpose** | Business page discovery |
| **Pipeline phase** | Gather |
| **Auth** | OAuth 2.0 |
| **Data sourced** | Company page URL |
| **Writes to** | `business_social_profiles` (platform: 'linkedin') |
| **Integration** | Scrape (LinkedIn API is restrictive for third-party use) |

### YouTube Data API

| Field | Value |
|---|---|
| **Purpose** | Business channel discovery |
| **Pipeline phase** | Gather |
| **Auth** | API key |
| **Data sourced** | Channel URL |
| **Writes to** | `business_social_profiles` (platform: 'youtube') |
| **Integration** | Direct API v3 |

---

## Planned: Review Platforms

### Yelp Fusion API

| Field | Value |
|---|---|
| **Purpose** | Business reviews, photos, ratings |
| **Pipeline phase** | Gather |
| **Auth** | API key |
| **Data sourced** | Reviews (text, rating, author), photos, business URL |
| **Writes to** | `business_social_profiles` (platform: 'yelp'), `business_reviews` (source: 'yelp'), `business_photos` (source: 'yelp') |
| **Rate limits** | 5,000 API calls/day (free) |
| **Integration** | Direct API |
| **Fallback** | Scrape public business page |

### TripAdvisor Content API

| Field | Value |
|---|---|
| **Purpose** | Business reviews, photos, ratings |
| **Pipeline phase** | Gather |
| **Auth** | API key (partner program) |
| **Data sourced** | Reviews (text, rating, author), photos, business URL |
| **Writes to** | `business_social_profiles` (platform: 'tripadvisor'), `business_reviews` (source: 'tripadvisor'), `business_photos` (source: 'tripadvisor') |
| **Integration** | Direct API if partner access is granted |
| **Fallback** | Scrape public business page |

---

## Planned: Delivery & Reservation Platforms

These platforms are checked for profile existence only — no reviews or photos are pulled from them.

| Platform | Auth | Data Sourced | Integration |
|---|---|---|---|
| OpenTable | Scrape | Reservation page URL | Scrape search results |
| Resy | Scrape | Reservation page URL | Scrape search results |
| DoorDash | Scrape | Delivery page URL | Scrape search results |
| Uber Eats | Scrape | Delivery page URL | Scrape search results |
| Grubhub | Scrape | Delivery page URL | Scrape search results |

All write to `business_social_profiles` with their respective platform name.

---

## Planned: AI & Processing Services

### NanoBanana (AI Image Generation)

| Field | Value |
|---|---|
| **Purpose** | Generate images to fill visual gaps in website content |
| **Pipeline phase** | Generate |
| **Auth** | API key (TBD) |
| **Data sourced** | N/A — this service produces data, not sources it |
| **Data produced** | AI-generated images (exterior, interior, food, team, logo) |
| **Writes to** | Supabase Storage (file), `business_photos` (source: 'ai_generated', photo_type: 'ai_generated') |
| **Integration** | Direct API |

### OCR Service (Google Cloud Vision or Tesseract)

| Field | Value |
|---|---|
| **Purpose** | Extract text from menu photos |
| **Pipeline phase** | Curate |
| **Auth** | API key (Cloud Vision) or local processing (Tesseract via serverless function) |
| **Data sourced** | Raw text from menu images |
| **Data produced** | Structured menu items parsed from OCR output |
| **Writes to** | `business_menus` (with `source_photo_id` linking back to the menu photo) |
| **Integration** | TBD — Cloud Vision (API call) or Tesseract (serverless function) |

---

## Service Dependency Map

Which pipeline phases depend on which services:

| Phase | Required Services | Optional Services |
|---|---|---|
| **Find** | Google Places API, Google Geocoding API, Supabase | Vercel Functions (API key proxy) |
| **Gather** | Supabase, Supabase Storage | Facebook, Instagram, Yelp, TripAdvisor, Twitter, TikTok, LinkedIn, YouTube, WhatsApp, OpenTable, Resy, DoorDash, Uber Eats, Grubhub |
| **Curate** | Supabase | OCR service (menus) |
| **Generate** | Supabase, Supabase Storage, Vercel (hosting) | NanoBanana (gap filling) |

**Note:** Gather-phase services are all optional — the pipeline degrades gracefully. A business can proceed to Curate/Generate with only Google data if no social/review platform integrations are available.
