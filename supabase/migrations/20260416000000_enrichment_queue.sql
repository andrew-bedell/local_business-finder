-- ============================================================================
-- Migration 016: Background enrichment queue tracking
-- ============================================================================
-- Adds persistent enrichment lifecycle fields so businesses can be enriched
-- asynchronously in the background and retried over time.
-- ============================================================================

ALTER TABLE businesses
  ADD COLUMN IF NOT EXISTS enrichment_status TEXT DEFAULT 'pending'
    CHECK (enrichment_status IN ('pending', 'in_progress', 'completed', 'retry', 'failed', 'skipped')),
  ADD COLUMN IF NOT EXISTS enrichment_attempts INTEGER DEFAULT 0
    CHECK (enrichment_attempts >= 0),
  ADD COLUMN IF NOT EXISTS enrichment_last_started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS enrichment_last_finished_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS enrichment_next_retry_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS enrichment_last_error TEXT;

UPDATE businesses AS b
SET enrichment_status = CASE
  WHEN b.place_id IS NULL
    OR b.place_id LIKE 'marketing-%'
    OR b.place_id LIKE 'manual-%'
    OR b.place_id LIKE 'builder-%'
    OR b.place_id LIKE 'onboarding-%'
    THEN 'skipped'
  WHEN EXISTS (
    SELECT 1
    FROM business_photos bp
    WHERE bp.business_id = b.id
      AND bp.source IN ('google', 'facebook', 'instagram')
    LIMIT 1
  )
    OR EXISTS (
      SELECT 1
      FROM business_reviews br
      WHERE br.business_id = b.id
      LIMIT 1
    )
    OR EXISTS (
      SELECT 1
      FROM business_social_profiles sp
      WHERE sp.business_id = b.id
      LIMIT 1
    )
    OR COALESCE(array_length(b.service_options, 1), 0) > 0
    OR COALESCE(array_length(b.amenities, 1), 0) > 0
    OR COALESCE(array_length(b.highlights, 1), 0) > 0
    THEN 'completed'
  ELSE 'pending'
END
WHERE b.enrichment_status IS NULL;

UPDATE businesses
SET enrichment_attempts = 0
WHERE enrichment_attempts IS NULL;

UPDATE businesses
SET enrichment_last_finished_at = NOW()
WHERE enrichment_last_finished_at IS NULL
  AND enrichment_status IN ('completed', 'skipped');

UPDATE businesses
SET enrichment_next_retry_at = NULL
WHERE enrichment_status IN ('pending', 'completed', 'skipped')
  AND enrichment_next_retry_at IS NOT NULL;

UPDATE businesses
SET enrichment_last_error = NULL
WHERE enrichment_last_error IS NULL;

CREATE INDEX IF NOT EXISTS idx_businesses_enrichment_queue
  ON businesses (enrichment_status, enrichment_next_retry_at);

CREATE INDEX IF NOT EXISTS idx_businesses_enrichment_started
  ON businesses (enrichment_last_started_at)
  WHERE enrichment_status = 'in_progress';
