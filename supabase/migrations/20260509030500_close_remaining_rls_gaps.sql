-- ============================================================================
-- Migration 019: Close remaining RLS gaps on contact + analytics tables
-- ============================================================================

ALTER TABLE IF EXISTS public.business_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.analytics_summaries ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF to_regclass('public.business_contacts') IS NOT NULL THEN
    DROP POLICY IF EXISTS "employee all access" ON public.business_contacts;
    CREATE POLICY "employee all access"
      ON public.business_contacts
      FOR ALL
      TO authenticated
      USING (public.is_employee())
      WITH CHECK (public.is_employee());
  END IF;
END
$$;
