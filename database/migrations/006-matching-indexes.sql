-- Migration 006: Add email to marketing_leads + indexes for business matching
-- Run in Supabase SQL Editor

-- Add email column to marketing_leads
ALTER TABLE marketing_leads ADD COLUMN IF NOT EXISTS email TEXT;

-- Indexes for business matching queries
CREATE INDEX IF NOT EXISTS idx_businesses_email ON businesses (email) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_businesses_contact_email ON businesses (contact_email) WHERE contact_email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_businesses_phone ON businesses (phone) WHERE phone IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_businesses_contact_phone ON businesses (contact_phone) WHERE contact_phone IS NOT NULL;
