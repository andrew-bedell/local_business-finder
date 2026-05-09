-- ============================================================================
-- Migration: Trip Planner
-- ============================================================================
-- Adds Supabase-backed storage for trip planning:
--   - planner_trips
--   - planner_trip_members
--   - planner_items
-- Supports owner-controlled itineraries with future collaborator sharing.
-- ============================================================================

CREATE TABLE IF NOT EXISTS planner_trips (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_user_id   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  destination     TEXT,
  travelers       TEXT,
  start_date      DATE,
  end_date        DATE,
  notes           TEXT,
  share_mode      TEXT NOT NULL DEFAULT 'password_protected'
                    CHECK (share_mode IN ('private', 'password_protected')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_planner_trips_owner ON planner_trips (owner_user_id);
CREATE INDEX IF NOT EXISTS idx_planner_trips_dates ON planner_trips (start_date, end_date);
CREATE TABLE IF NOT EXISTS planner_trip_members (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  trip_id         UUID NOT NULL REFERENCES planner_trips(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role            TEXT NOT NULL DEFAULT 'viewer'
                    CHECK (role IN ('owner', 'collaborator', 'viewer')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (trip_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_planner_trip_members_trip ON planner_trip_members (trip_id);
CREATE INDEX IF NOT EXISTS idx_planner_trip_members_user ON planner_trip_members (user_id);
CREATE TABLE IF NOT EXISTS planner_items (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  trip_id         UUID NOT NULL REFERENCES planner_trips(id) ON DELETE CASCADE,
  kind            TEXT NOT NULL CHECK (kind IN ('stay', 'flight', 'activity', 'transport')),
  source          TEXT,
  import_method   TEXT NOT NULL DEFAULT 'manual'
                    CHECK (import_method IN ('manual', 'url', 'screenshot')),
  title           TEXT,
  url             TEXT,
  start_date      DATE,
  end_date        DATE,
  start_time      TIME,
  end_time        TIME,
  location        TEXT,
  price_text      TEXT,
  status          TEXT NOT NULL DEFAULT 'option'
                    CHECK (status IN ('option', 'selected', 'booked')),
  assigned_day    DATE,
  notes           TEXT,
  screenshot_json JSONB,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_planner_items_trip ON planner_items (trip_id);
CREATE INDEX IF NOT EXISTS idx_planner_items_kind ON planner_items (trip_id, kind);
CREATE INDEX IF NOT EXISTS idx_planner_items_day ON planner_items (trip_id, assigned_day);
ALTER TABLE planner_trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE planner_trip_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE planner_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "planner_trips_select" ON planner_trips;
CREATE POLICY "planner_trips_select"
  ON planner_trips
  FOR SELECT
  USING (
    owner_user_id = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM planner_trip_members m
      WHERE m.trip_id = planner_trips.id
        AND m.user_id = auth.uid()
    )
  );
DROP POLICY IF EXISTS "planner_trips_insert" ON planner_trips;
CREATE POLICY "planner_trips_insert"
  ON planner_trips
  FOR INSERT
  WITH CHECK (owner_user_id = auth.uid());
DROP POLICY IF EXISTS "planner_trips_update" ON planner_trips;
CREATE POLICY "planner_trips_update"
  ON planner_trips
  FOR UPDATE
  USING (owner_user_id = auth.uid())
  WITH CHECK (owner_user_id = auth.uid());
DROP POLICY IF EXISTS "planner_trips_delete" ON planner_trips;
CREATE POLICY "planner_trips_delete"
  ON planner_trips
  FOR DELETE
  USING (owner_user_id = auth.uid());
DROP POLICY IF EXISTS "planner_trip_members_select" ON planner_trip_members;
CREATE POLICY "planner_trip_members_select"
  ON planner_trip_members
  FOR SELECT
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM planner_trips t
      WHERE t.id = planner_trip_members.trip_id
        AND t.owner_user_id = auth.uid()
    )
  );
DROP POLICY IF EXISTS "planner_trip_members_insert" ON planner_trip_members;
CREATE POLICY "planner_trip_members_insert"
  ON planner_trip_members
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM planner_trips t
      WHERE t.id = planner_trip_members.trip_id
        AND t.owner_user_id = auth.uid()
    )
  );
DROP POLICY IF EXISTS "planner_trip_members_update" ON planner_trip_members;
CREATE POLICY "planner_trip_members_update"
  ON planner_trip_members
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM planner_trips t
      WHERE t.id = planner_trip_members.trip_id
        AND t.owner_user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM planner_trips t
      WHERE t.id = planner_trip_members.trip_id
        AND t.owner_user_id = auth.uid()
    )
  );
DROP POLICY IF EXISTS "planner_trip_members_delete" ON planner_trip_members;
CREATE POLICY "planner_trip_members_delete"
  ON planner_trip_members
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1
      FROM planner_trips t
      WHERE t.id = planner_trip_members.trip_id
        AND t.owner_user_id = auth.uid()
    )
  );
DROP POLICY IF EXISTS "planner_items_select" ON planner_items;
CREATE POLICY "planner_items_select"
  ON planner_items
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM planner_trips t
      WHERE t.id = planner_items.trip_id
        AND (
          t.owner_user_id = auth.uid()
          OR EXISTS (
            SELECT 1
            FROM planner_trip_members m
            WHERE m.trip_id = t.id
              AND m.user_id = auth.uid()
          )
        )
    )
  );
DROP POLICY IF EXISTS "planner_items_insert" ON planner_items;
CREATE POLICY "planner_items_insert"
  ON planner_items
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM planner_trips t
      WHERE t.id = planner_items.trip_id
        AND t.owner_user_id = auth.uid()
    )
  );
DROP POLICY IF EXISTS "planner_items_update" ON planner_items;
CREATE POLICY "planner_items_update"
  ON planner_items
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM planner_trips t
      WHERE t.id = planner_items.trip_id
        AND t.owner_user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM planner_trips t
      WHERE t.id = planner_items.trip_id
        AND t.owner_user_id = auth.uid()
    )
  );
DROP POLICY IF EXISTS "planner_items_delete" ON planner_items;
CREATE POLICY "planner_items_delete"
  ON planner_items
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1
      FROM planner_trips t
      WHERE t.id = planner_items.trip_id
        AND t.owner_user_id = auth.uid()
    )
  );
DROP TRIGGER IF EXISTS planner_trips_updated_at ON planner_trips;
CREATE TRIGGER planner_trips_updated_at
  BEFORE UPDATE ON planner_trips
  FOR EACH ROW EXECUTE FUNCTION update_last_updated_at();
DROP TRIGGER IF EXISTS planner_items_updated_at ON planner_items;
CREATE TRIGGER planner_items_updated_at
  BEFORE UPDATE ON planner_items
  FOR EACH ROW EXECUTE FUNCTION update_last_updated_at();
