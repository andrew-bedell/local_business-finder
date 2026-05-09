-- ============================================================================
-- Migration 017: Enrichment audit log + global pause controls
-- ============================================================================
-- Adds persistent run logs for enrichment attempts, a system setting used to
-- pause enrichment globally when an upstream API is blocked, and corrects the
-- "completed" heuristic so search-time amenities alone do not count as a
-- successful enrichment.
-- ============================================================================

CREATE TABLE IF NOT EXISTS system_settings (
  key                     TEXT PRIMARY KEY,
  value                   JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS enrichment_runs (
  id                      UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id             BIGINT REFERENCES businesses(id) ON DELETE CASCADE,
  place_id                TEXT,
  trigger_source          TEXT NOT NULL DEFAULT 'manual'
                            CHECK (trigger_source IN ('manual', 'cron', 'unknown')),
  status                  TEXT NOT NULL DEFAULT 'started'
                            CHECK (status IN ('started', 'completed', 'retry', 'failed', 'skipped', 'blocked')),
  attempt                 INTEGER NOT NULL DEFAULT 0
                            CHECK (attempt >= 0),
  data_id                 TEXT,
  error_message           TEXT,
  warnings                TEXT[],
  step_results            JSONB NOT NULL DEFAULT '{}'::jsonb,
  evidence                JSONB NOT NULL DEFAULT '{}'::jsonb,
  started_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finished_at             TIMESTAMPTZ,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_enrichment_runs_business
  ON enrichment_runs (business_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_enrichment_runs_status
  ON enrichment_runs (status, created_at DESC);

ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrichment_runs ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'system_settings'
      AND policyname = 'Allow all access'
  ) THEN
    CREATE POLICY "Allow all access"
      ON system_settings
      FOR ALL
      USING (true)
      WITH CHECK (true);
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'enrichment_runs'
      AND policyname = 'Allow all access'
  ) THEN
    CREATE POLICY "Allow all access"
      ON enrichment_runs
      FOR ALL
      USING (true)
      WITH CHECK (true);
  END IF;
END
$$;

UPDATE businesses AS b
SET enrichment_status = CASE
  WHEN b.place_id IS NULL
    OR b.place_id LIKE 'marketing-%'
    OR b.place_id LIKE 'manual-%'
    OR b.place_id LIKE 'builder-%'
    OR b.place_id LIKE 'onboarding-%'
    THEN 'skipped'
  WHEN b.enrichment_status IN ('in_progress', 'retry', 'failed')
    THEN b.enrichment_status
  WHEN EXISTS (
    SELECT 1
    FROM business_photos bp
    WHERE bp.business_id = b.id
      AND bp.source = 'google'
    LIMIT 1
  )
    THEN 'completed'
  ELSE 'pending'
END,
enrichment_last_finished_at = CASE
  WHEN b.place_id IS NULL
    OR b.place_id LIKE 'marketing-%'
    OR b.place_id LIKE 'manual-%'
    OR b.place_id LIKE 'builder-%'
    OR b.place_id LIKE 'onboarding-%'
    THEN COALESCE(b.enrichment_last_finished_at, NOW())
  WHEN EXISTS (
    SELECT 1
    FROM business_photos bp
    WHERE bp.business_id = b.id
      AND bp.source = 'google'
    LIMIT 1
  )
    THEN COALESCE(b.enrichment_last_finished_at, NOW())
  ELSE NULL
END,
enrichment_next_retry_at = CASE
  WHEN b.place_id IS NULL
    OR b.place_id LIKE 'marketing-%'
    OR b.place_id LIKE 'manual-%'
    OR b.place_id LIKE 'builder-%'
    OR b.place_id LIKE 'onboarding-%'
    THEN NULL
  WHEN EXISTS (
    SELECT 1
    FROM business_photos bp
    WHERE bp.business_id = b.id
      AND bp.source = 'google'
    LIMIT 1
  )
    THEN NULL
  ELSE b.enrichment_next_retry_at
END
WHERE TRUE;

INSERT INTO system_settings (key, value)
VALUES ('enrichment_pipeline', jsonb_build_object('paused', false, 'updatedAt', NOW()))
ON CONFLICT (key) DO NOTHING;

ALTER TABLE generated_websites
  ADD COLUMN IF NOT EXISTS generated_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

UPDATE generated_websites
SET generated_at = COALESCE(generated_at, NOW()),
    created_at = COALESCE(created_at, NOW())
WHERE generated_at IS NULL
   OR created_at IS NULL;
