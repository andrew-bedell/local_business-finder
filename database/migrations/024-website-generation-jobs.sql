-- Migration 024: Durable website generation jobs
-- Customer-triggered site generation should survive refreshes and ended browser sessions.

CREATE TABLE IF NOT EXISTS public.website_generation_jobs (
  id                      UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id             BIGINT NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  customer_id             UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  requested_by_user_id    UUID,

  mode                    TEXT NOT NULL DEFAULT 'create'
                            CHECK (mode IN ('create', 'update')),
  existing_website_id     UUID REFERENCES public.generated_websites(id) ON DELETE SET NULL,

  status                  TEXT NOT NULL DEFAULT 'queued'
                            CHECK (status IN ('queued', 'running', 'completed', 'failed', 'cancelled')),
  stage                   TEXT NOT NULL DEFAULT 'queued'
                            CHECK (stage IN ('queued', 'research', 'photos', 'content', 'build', 'publish', 'completed', 'failed')),
  progress                INTEGER NOT NULL DEFAULT 0
                            CHECK (progress BETWEEN 0 AND 100),

  website_id              UUID REFERENCES public.generated_websites(id) ON DELETE SET NULL,
  published_url           TEXT,
  error_message           TEXT,
  attempts                INTEGER NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  locked_at               TIMESTAMPTZ,
  locked_by               TEXT,
  result                  JSONB NOT NULL DEFAULT '{}'::jsonb,
  metadata                JSONB NOT NULL DEFAULT '{}'::jsonb,

  started_at              TIMESTAMPTZ,
  finished_at             TIMESTAMPTZ,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_website_generation_jobs_business_active
  ON public.website_generation_jobs (business_id, created_at DESC)
  WHERE status IN ('queued', 'running');
CREATE INDEX IF NOT EXISTS idx_website_generation_jobs_status_created
  ON public.website_generation_jobs (status, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_website_generation_jobs_locked
  ON public.website_generation_jobs (status, locked_at)
  WHERE status = 'running';

ALTER TABLE public.website_generation_jobs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "customer read own website generation jobs" ON public.website_generation_jobs;
CREATE POLICY "customer read own website generation jobs"
  ON public.website_generation_jobs
  FOR SELECT
  TO authenticated
  USING (
    business_id IN (
      SELECT c.business_id
      FROM public.customers c
      JOIN public.customer_users cu ON cu.customer_id = c.id
      WHERE cu.auth_user_id = auth.uid()
    )
  );
