-- Migration 007: Contact info separation & Google Places matching support
-- Separates form-submitted contact info from Google/online business data

-- Add contact_name and contact_whatsapp to businesses
-- (contact_phone and contact_email already exist)
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS contact_name TEXT;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS contact_whatsapp TEXT;

-- Add address to marketing_leads for Google Places matching
ALTER TABLE marketing_leads ADD COLUMN IF NOT EXISTS address TEXT;

-- Index for place_id lookups (used by Google Places matching)
CREATE INDEX IF NOT EXISTS idx_businesses_place_id ON businesses (place_id) WHERE place_id IS NOT NULL;
