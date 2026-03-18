-- Migration: Pipeline stages & contact fields
-- Run this in the Supabase SQL Editor.

-- 1. Add contact fields
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS contact_phone TEXT;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS contact_email TEXT;

-- 2. Add pipeline_status column if it doesn't exist
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS pipeline_status TEXT DEFAULT 'saved';

-- 3. Add pipeline_status_changed_at if it doesn't exist
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS pipeline_status_changed_at TIMESTAMPTZ;

-- 4. Drop old constraint if it exists, add new one
ALTER TABLE businesses DROP CONSTRAINT IF EXISTS businesses_pipeline_status_check;
ALTER TABLE businesses ADD CONSTRAINT businesses_pipeline_status_check
  CHECK (pipeline_status IN ('saved', 'lead', 'demo', 'active_customer', 'inactive_customer'));

-- 5. Set default
ALTER TABLE businesses ALTER COLUMN pipeline_status SET DEFAULT 'saved';

-- 6. Set any NULL rows to 'saved'
UPDATE businesses SET pipeline_status = 'saved' WHERE pipeline_status IS NULL;
