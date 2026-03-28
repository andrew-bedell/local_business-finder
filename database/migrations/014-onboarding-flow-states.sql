-- Migration 014: Expand onboarding_flows step CHECK constraint
-- Supports the new resolver + orchestrator + state machine architecture

-- Drop the old CHECK constraint and add the expanded one
ALTER TABLE onboarding_flows DROP CONSTRAINT IF EXISTS onboarding_flows_step_check;
ALTER TABLE onboarding_flows ADD CONSTRAINT onboarding_flows_step_check
  CHECK (step IN (
    -- Entry
    'new_inbound', 'resolving_lead',
    -- Google match phase
    'awaiting_business_name_for_match', 'awaiting_location_for_match',
    'attempting_google_match', 'awaiting_google_match_selection',
    -- Confirmation & identity fill
    'confirmed_known_fields',
    'awaiting_contact_name', 'awaiting_email', 'awaiting_phone',
    'awaiting_business_name', 'awaiting_address',
    -- Enrichment collection
    'awaiting_photos', 'awaiting_hours', 'awaiting_about_us', 'awaiting_founder_story',
    -- Services loop
    'awaiting_service_name', 'awaiting_service_description', 'awaiting_service_price',
    'awaiting_more_services',
    -- Final
    'awaiting_extra_notes', 'awaiting_final_confirmation',
    -- Generation + terminal
    'enrich', 'generate', 'complete', 'abandoned', 'error', 'human_review',
    -- Legacy (backward compat for in-flight flows)
    'collect_info', 'search_business', 'verify_business', 'confirm_data'
  ));

-- Update the partial index for abandonment detection to include human_review
DROP INDEX IF EXISTS idx_onboarding_flows_last_activity;
CREATE INDEX idx_onboarding_flows_last_activity
  ON onboarding_flows (last_activity_at)
  WHERE step NOT IN ('complete', 'abandoned', 'error', 'human_review');
