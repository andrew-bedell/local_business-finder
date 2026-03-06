-- ============================================================================
-- Local Business Finder — Supabase Database Schema
-- ============================================================================
-- Run this file in the Supabase SQL Editor to create all tables.
-- Source of truth for the data model. See CLAUDE.md for high-level overview.
-- ============================================================================

-- ============================================================================
-- 1. BUSINESSES — Core business record
-- ============================================================================
-- Central table for every discovered business. One row per Google Place ID.
-- Expanded to support the full Find → Gather → Curate → Generate pipeline.

CREATE TABLE IF NOT EXISTS businesses (
  id                      UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  place_id                TEXT UNIQUE NOT NULL,

  -- Identity
  name                    TEXT NOT NULL,
  description             TEXT,
  category                TEXT,                -- primary category: restaurant, salon, contractor, etc.
  subcategory             TEXT,                -- e.g., cuisine type, specialty

  -- Location
  address_full            TEXT,                -- full formatted address (from Google)
  address_street          TEXT,
  address_city            TEXT,
  address_state           TEXT,
  address_zip             TEXT,
  address_country         TEXT,
  latitude                DECIMAL(10, 7),
  longitude               DECIMAL(10, 7),
  service_area            TEXT,                -- for mobile/traveling businesses

  -- Contact
  phone                   TEXT,
  whatsapp                TEXT,
  email                   TEXT,
  website                 TEXT,                -- empty string = no website (our targets)

  -- Google Places data
  maps_url                TEXT,
  types                   TEXT[],              -- Google Places type tags
  rating                  DECIMAL(2, 1),       -- 0.0–5.0
  review_count            INTEGER DEFAULT 0,
  price_level             INTEGER,             -- 1–4 ($–$$$$)
  business_status         TEXT DEFAULT 'UNKNOWN'
                            CHECK (business_status IN (
                              'OPERATIONAL',
                              'CLOSED_TEMPORARILY',
                              'CLOSED_PERMANENTLY',
                              'UNKNOWN'
                            )),
  hours                   JSONB,               -- weekday descriptions array

  -- Business details (gathered from multiple sources)
  thumbnail               TEXT,                -- thumbnail image URL from search results
  service_options         TEXT[],              -- e.g., Dine-in, Takeout, Delivery
  amenities               TEXT[],              -- e.g., Wi-Fi, Parking, Outdoor seating
  highlights              TEXT[],              -- e.g., Great cocktails, Cozy atmosphere
  payment_methods         TEXT[],
  languages_spoken        TEXT[],
  accessibility_info      TEXT,
  parking_info            TEXT,
  year_established        INTEGER,
  owner_name              TEXT,

  -- Search context (how this business was discovered)
  search_location         TEXT,
  search_type             TEXT,

  -- Tracking
  data_completeness_score INTEGER DEFAULT 0    -- 0–100, how much data we've gathered
                            CHECK (data_completeness_score BETWEEN 0 AND 100),
  first_discovered_at     TIMESTAMPTZ DEFAULT NOW(),
  last_updated_at         TIMESTAMPTZ DEFAULT NOW(),
  created_at              TIMESTAMPTZ DEFAULT NOW()
);

-- Index for searching by location and category
CREATE INDEX IF NOT EXISTS idx_businesses_category ON businesses (category);
CREATE INDEX IF NOT EXISTS idx_businesses_city ON businesses (address_city);
CREATE INDEX IF NOT EXISTS idx_businesses_status ON businesses (business_status);
CREATE INDEX IF NOT EXISTS idx_businesses_completeness ON businesses (data_completeness_score);


-- ============================================================================
-- 2. BUSINESS_SOCIAL_PROFILES — Social media & platform links
-- ============================================================================
-- One row per platform per business.
-- Stores links to Facebook, Instagram, WhatsApp, Yelp, delivery apps, etc.

CREATE TABLE IF NOT EXISTS business_social_profiles (
  id                      UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id             UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,

  platform                TEXT NOT NULL
                            CHECK (platform IN (
                              'facebook',
                              'instagram',
                              'whatsapp',
                              'twitter',
                              'tiktok',
                              'linkedin',
                              'youtube',
                              'yelp',
                              'tripadvisor',
                              'opentable',
                              'resy',
                              'doordash',
                              'ubereats',
                              'grubhub'
                            )),
  url                     TEXT,                -- full URL to the profile/page
  handle                  TEXT,                -- @handle or username (if applicable)
  follower_count          INTEGER,             -- number of followers on this platform
  post_count              INTEGER,             -- number of posts on this platform

  discovered_at           TIMESTAMPTZ DEFAULT NOW(),
  created_at              TIMESTAMPTZ DEFAULT NOW(),

  -- One profile per platform per business
  UNIQUE (business_id, platform)
);

CREATE INDEX IF NOT EXISTS idx_social_profiles_business ON business_social_profiles (business_id);


-- ============================================================================
-- 3. BUSINESS_PHOTOS — Photos from all sources
-- ============================================================================
-- Stores photo references from Google Places, social media, and AI generation.
-- Photos can be stored as URLs (external) or in Supabase Storage (persisted).

CREATE TABLE IF NOT EXISTS business_photos (
  id                      UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id             UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,

  source                  TEXT NOT NULL
                            CHECK (source IN (
                              'google',         -- from Google Places API / Google Business Profile
                              'facebook',
                              'instagram',
                              'yelp',
                              'tripadvisor',
                              'ai_generated'    -- created via NanoBanana or similar
                            )),

  photo_type              TEXT
                            CHECK (photo_type IN (
                              'exterior',       -- outside of the business
                              'interior',       -- inside the business
                              'menu',           -- photo of a physical menu
                              'product',        -- product or service photo
                              'food',           -- food/drink items (restaurants)
                              'team',           -- staff or owner photos
                              'logo',           -- business logo
                              'ai_generated'    -- AI-created supporting image
                            )),

  url                     TEXT,                -- original source URL
  storage_path            TEXT,                -- path in Supabase Storage bucket (for persisted copies)
  caption                 TEXT,
  is_primary              BOOLEAN DEFAULT FALSE, -- featured image for the business
  width                   INTEGER,
  height                  INTEGER,

  created_at              TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_photos_business ON business_photos (business_id);
CREATE INDEX IF NOT EXISTS idx_photos_source ON business_photos (source);
CREATE INDEX IF NOT EXISTS idx_photos_type ON business_photos (photo_type);


-- ============================================================================
-- 4. BUSINESS_REVIEWS — Reviews from all platforms
-- ============================================================================
-- Reviews gathered from Google, Facebook, Yelp, TripAdvisor, etc.
-- Each review is scored with sentiment analysis and can be flagged for website use.

CREATE TABLE IF NOT EXISTS business_reviews (
  id                      UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id             UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,

  source                  TEXT NOT NULL
                            CHECK (source IN (
                              'google',
                              'facebook',
                              'yelp',
                              'tripadvisor'
                            )),

  -- Review content
  author_name             TEXT,
  author_photo_url        TEXT,
  rating                  INTEGER CHECK (rating BETWEEN 1 AND 5),
  text                    TEXT,
  published_at            TEXT,                -- relative time from API (e.g., "2 weeks ago")

  -- Sentiment analysis
  sentiment_score         DECIMAL(5, 4),       -- raw score from analysis
  sentiment_label         TEXT
                            CHECK (sentiment_label IN (
                              'very_positive',
                              'positive',
                              'neutral',
                              'negative'
                            )),

  -- Curation
  is_curated              BOOLEAN DEFAULT FALSE, -- selected for use on generated website

  -- Deduplication: client-computed hash of (source + author_name + text)
  -- Used for upsert conflict detection, avoids index size issues with long text
  review_hash             TEXT,

  created_at              TIMESTAMPTZ DEFAULT NOW(),

  -- Unique constraint for upsert: one review per hash per business
  UNIQUE (business_id, review_hash)
);

CREATE INDEX IF NOT EXISTS idx_reviews_business ON business_reviews (business_id);
CREATE INDEX IF NOT EXISTS idx_reviews_sentiment ON business_reviews (sentiment_label);
CREATE INDEX IF NOT EXISTS idx_reviews_curated ON business_reviews (is_curated) WHERE is_curated = TRUE;


-- ============================================================================
-- 5. BUSINESS_MENUS — Structured menu data
-- ============================================================================
-- Menu items extracted from photos (via OCR/AI) or gathered from online sources.
-- Primarily for restaurants but could apply to any service-based business.

CREATE TABLE IF NOT EXISTS business_menus (
  id                      UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id             UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  source_photo_id         UUID REFERENCES business_photos(id) ON DELETE SET NULL,

  menu_category           TEXT,                -- e.g., Appetizers, Entrees, Drinks, Desserts
  item_name               TEXT NOT NULL,
  item_description        TEXT,
  price                   DECIMAL(10, 2),
  currency                TEXT DEFAULT 'USD',  -- USD, MXN, COP, etc.

  created_at              TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_menus_business ON business_menus (business_id);


-- ============================================================================
-- 6. GENERATED_WEBSITES — Website generation tracking
-- ============================================================================
-- One row per generation attempt. Tracks template, status, and selected content.

CREATE TABLE IF NOT EXISTS generated_websites (
  id                      UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id             UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,

  template_name           TEXT,                -- template used (mapped to business category)
  primary_color           TEXT,                -- hex color for branding
  secondary_color         TEXT,                -- hex color for accents
  status                  TEXT DEFAULT 'draft'
                            CHECK (status IN ('draft', 'published', 'archived')),
  published_url           TEXT,                -- live URL once deployed

  -- Flexible config: selected photo IDs, review IDs, layout options, etc.
  config                  JSONB DEFAULT '{}',

  generated_at            TIMESTAMPTZ DEFAULT NOW(),
  published_at            TIMESTAMPTZ,
  created_at              TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_websites_business ON generated_websites (business_id);
CREATE INDEX IF NOT EXISTS idx_websites_status ON generated_websites (status);


-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================
-- Enable RLS on all tables. Policies should be configured based on your
-- Supabase auth setup. Below enables RLS without restrictive policies
-- (open access via anon key, matching current app behavior).

ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_social_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_menus ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_websites ENABLE ROW LEVEL SECURITY;

-- Open read/write policies for anon key (matches current app setup)
-- Replace these with proper auth policies when user authentication is added.

CREATE POLICY "Allow all access" ON businesses FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON business_social_profiles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON business_photos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON business_reviews FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON business_menus FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON generated_websites FOR ALL USING (true) WITH CHECK (true);


-- ============================================================================
-- UPDATED_AT TRIGGER
-- ============================================================================
-- Automatically updates last_updated_at on the businesses table when a row changes.

CREATE OR REPLACE FUNCTION update_last_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER businesses_updated_at
  BEFORE UPDATE ON businesses
  FOR EACH ROW
  EXECUTE FUNCTION update_last_updated_at();
