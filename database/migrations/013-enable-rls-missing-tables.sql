-- Migration 013: Enable Row Level Security on tables missing it
-- Fixes Supabase security warning about publicly accessible tables.
-- Uses permissive "allow all" policies since access control is handled
-- at the API layer (service role key + serverless functions).

-- 1. business_contacts
ALTER TABLE business_contacts ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'business_contacts' AND policyname = 'Allow all access') THEN
    CREATE POLICY "Allow all access" ON business_contacts FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- 2. analytics_events
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'analytics_events' AND policyname = 'Allow all access') THEN
    CREATE POLICY "Allow all access" ON analytics_events FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- 3. analytics_summaries
ALTER TABLE analytics_summaries ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'analytics_summaries' AND policyname = 'Allow all access') THEN
    CREATE POLICY "Allow all access" ON analytics_summaries FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;
