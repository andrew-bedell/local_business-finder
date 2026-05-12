-- Add inbound-lead Kanban stages while preserving existing customer statuses.

ALTER TABLE businesses DROP CONSTRAINT IF EXISTS businesses_pipeline_status_check;

ALTER TABLE businesses ADD CONSTRAINT businesses_pipeline_status_check
  CHECK (pipeline_status IN (
    'saved',
    'lead',
    'website_created',
    'interested',
    'cold_outreach_ready',
    'demo',
    'active_customer',
    'inactive_customer'
  ));
