-- Migration 020: Separate high-intent personalized intake submissions.

ALTER TABLE businesses DROP CONSTRAINT IF EXISTS businesses_lead_source_check;

ALTER TABLE businesses ADD CONSTRAINT businesses_lead_source_check
  CHECK (lead_source IN (
    'search',
    'cold_outreach',
    'website_form',
    'advanced_intake',
    'whatsapp_inbound',
    'referral',
    'ad_meta',
    'ad_google',
    'organic_social',
    'organic_search',
    'referral_content',
    'manual',
    'other'
  ));
