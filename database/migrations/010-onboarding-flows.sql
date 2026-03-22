-- Migration 010: Onboarding flows for WhatsApp self-service website creation
-- Tracks the state of each onboarding conversation through the pipeline

CREATE TABLE IF NOT EXISTS onboarding_flows (
  id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id   UUID NOT NULL REFERENCES whatsapp_conversations(id) ON DELETE CASCADE,
  phone             TEXT NOT NULL,
  step              TEXT NOT NULL DEFAULT 'collect_info'
                      CHECK (step IN (
                        'collect_info','search_business','verify_business',
                        'enrich','confirm_data','generate','complete','abandoned','error'
                      )),
  flow_data         JSONB DEFAULT '{}',
  business_id       BIGINT REFERENCES businesses(id) ON DELETE SET NULL,
  website_id        UUID,
  started_at        TIMESTAMPTZ DEFAULT NOW(),
  completed_at      TIMESTAMPTZ,
  last_activity_at  TIMESTAMPTZ DEFAULT NOW(),
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- Index for looking up active flows by phone (most common query)
CREATE INDEX IF NOT EXISTS idx_onboarding_flows_phone_step
  ON onboarding_flows (phone, step);

-- Index for conversation FK lookups
CREATE INDEX IF NOT EXISTS idx_onboarding_flows_conversation
  ON onboarding_flows (conversation_id);

-- Index for finding stale flows (abandonment check)
CREATE INDEX IF NOT EXISTS idx_onboarding_flows_last_activity
  ON onboarding_flows (last_activity_at)
  WHERE step NOT IN ('complete', 'abandoned', 'error');
