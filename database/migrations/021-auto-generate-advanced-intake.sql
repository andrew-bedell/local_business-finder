-- Prioritize high-intent intake leads for automatic website generation.
-- The cron calls this RPC before its REST fallback, so keep the eligibility
-- rules aligned with api/cron/generate-websites.js.

DROP FUNCTION IF EXISTS public.get_eligible_for_auto_generate(integer);

CREATE OR REPLACE FUNCTION public.get_eligible_for_auto_generate(max_count integer DEFAULT 3)
RETURNS SETOF public.businesses
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT b.*
  FROM public.businesses b
  WHERE NULLIF(btrim(b.name), '') IS NOT NULL
    AND NULLIF(btrim(b.address_full), '') IS NOT NULL
    AND NULLIF(btrim(b.phone), '') IS NOT NULL
    AND b.pipeline_status IN ('saved', 'lead')
    AND (b.business_status = 'OPERATIONAL' OR b.business_status IS NULL)
    AND (b.whatsapp_status IN ('valid', 'unvalidated') OR b.whatsapp_status IS NULL)
    AND COALESCE((b.outreach_steps ->> '_cancelled')::boolean, false) = false
    AND EXISTS (
      SELECT 1
      FROM public.business_reviews r
      WHERE r.business_id = b.id
    )
    AND EXISTS (
      SELECT 1
      FROM public.business_photos p
      WHERE p.business_id = b.id
        AND (
          NULLIF(btrim(p.url), '') IS NOT NULL
          OR NULLIF(btrim(p.storage_path), '') IS NOT NULL
        )
        AND COALESCE(p.has_text_overlay, false) = false
    )
    AND NOT EXISTS (
      SELECT 1
      FROM public.generated_websites w
      WHERE w.business_id = b.id
        AND (
          NULLIF(btrim(w.config ->> 'html'), '') IS NOT NULL
          OR NULLIF(btrim(w.config ->> 'draft_html'), '') IS NOT NULL
        )
    )
  ORDER BY
    CASE b.lead_source
      WHEN 'advanced_intake' THEN 0
      WHEN 'website_form' THEN 1
      ELSE 2
    END,
    b.created_at ASC
  LIMIT GREATEST(1, LEAST(COALESCE(max_count, 3), 24));
$$;

GRANT EXECUTE ON FUNCTION public.get_eligible_for_auto_generate(integer) TO anon, authenticated, service_role;
