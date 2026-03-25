-- Migration 013: Add collect_social step to onboarding flows
-- Allows businesses not found on Google Maps to provide Facebook/Instagram links instead

ALTER TABLE onboarding_flows DROP CONSTRAINT IF EXISTS onboarding_flows_step_check;
ALTER TABLE onboarding_flows ADD CONSTRAINT onboarding_flows_step_check
  CHECK (step IN (
    'collect_info','search_business','verify_business',
    'collect_social',
    'enrich','confirm_data','generate','complete','abandoned','error'
  ));
