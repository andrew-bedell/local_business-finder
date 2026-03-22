-- ============================================================================
-- Migration 011: Scheduling & Booking System
-- ============================================================================
-- Adds 9 new tables for the scheduling/booking pipeline plus 2 columns to businesses.
-- Supports two business models:
--   - Appointment-based (barber, salon, spa): services with duration, staff schedules, time slots
--   - Class-based (gym, yoga studio): recurring group classes with capacity + membership plans
-- ============================================================================


-- ── Column additions to businesses ──

ALTER TABLE businesses ADD COLUMN IF NOT EXISTS scheduling_type TEXT
  CHECK (scheduling_type IN ('appointment_based', 'class_based'));

ALTER TABLE businesses ADD COLUMN IF NOT EXISTS scheduling_config JSONB DEFAULT '{}';


-- ============================================================================
-- 1. STAFF_MEMBERS — Staff/employees of the business
-- ============================================================================

CREATE TABLE IF NOT EXISTS staff_members (
  id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id       BIGINT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name              TEXT NOT NULL,
  phone             TEXT,
  email             TEXT,
  photo_url         TEXT,
  bio               TEXT,
  specialties       TEXT[] DEFAULT '{}',
  is_active         BOOLEAN DEFAULT TRUE,
  sort_order        INTEGER DEFAULT 0,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  last_updated_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_staff_members_business ON staff_members (business_id);
CREATE INDEX IF NOT EXISTS idx_staff_members_active ON staff_members (business_id, is_active) WHERE is_active = TRUE;

ALTER TABLE staff_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access" ON staff_members FOR ALL USING (true) WITH CHECK (true);

CREATE TRIGGER staff_members_updated_at
  BEFORE UPDATE ON staff_members
  FOR EACH ROW EXECUTE FUNCTION update_last_updated_at();


-- ============================================================================
-- 2. STAFF_SCHEDULES — Recurring weekly availability per staff member
-- ============================================================================

CREATE TABLE IF NOT EXISTS staff_schedules (
  id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  staff_member_id   UUID NOT NULL REFERENCES staff_members(id) ON DELETE CASCADE,
  business_id       BIGINT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  day_of_week       INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),  -- 0=Sunday
  start_time        TIME NOT NULL,
  end_time          TIME NOT NULL,
  is_active         BOOLEAN DEFAULT TRUE,
  created_at        TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE (staff_member_id, day_of_week, start_time)
);

CREATE INDEX IF NOT EXISTS idx_staff_schedules_staff ON staff_schedules (staff_member_id);
CREATE INDEX IF NOT EXISTS idx_staff_schedules_business ON staff_schedules (business_id);

ALTER TABLE staff_schedules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access" ON staff_schedules FOR ALL USING (true) WITH CHECK (true);


-- ============================================================================
-- 3. STAFF_EXCEPTIONS — Days off, holidays, custom hours
-- ============================================================================

CREATE TABLE IF NOT EXISTS staff_exceptions (
  id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  staff_member_id   UUID NOT NULL REFERENCES staff_members(id) ON DELETE CASCADE,
  business_id       BIGINT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  exception_date    DATE NOT NULL,
  is_available      BOOLEAN DEFAULT FALSE,    -- false = day off, true = custom hours
  start_time        TIME,                     -- only used when is_available = true
  end_time          TIME,                     -- only used when is_available = true
  reason            TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE (staff_member_id, exception_date)
);

CREATE INDEX IF NOT EXISTS idx_staff_exceptions_staff ON staff_exceptions (staff_member_id);
CREATE INDEX IF NOT EXISTS idx_staff_exceptions_business ON staff_exceptions (business_id);
CREATE INDEX IF NOT EXISTS idx_staff_exceptions_date ON staff_exceptions (exception_date);

ALTER TABLE staff_exceptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access" ON staff_exceptions FOR ALL USING (true) WITH CHECK (true);


-- ============================================================================
-- 4. BOOKING_SERVICES — Services or class types offered
-- ============================================================================

CREATE TABLE IF NOT EXISTS booking_services (
  id                  UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id         BIGINT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name                TEXT NOT NULL,
  description         TEXT,
  duration_minutes    INTEGER NOT NULL CHECK (duration_minutes > 0),
  price               DECIMAL(10, 2) DEFAULT 0,
  currency            TEXT DEFAULT 'MXN' CHECK (currency IN ('MXN', 'USD', 'COP')),
  category            TEXT,
  max_capacity        INTEGER DEFAULT 1 CHECK (max_capacity > 0),  -- 1 = appointment, >1 = class
  requires_membership BOOLEAN DEFAULT FALSE,
  color               TEXT,                                        -- hex color for UI display
  is_active           BOOLEAN DEFAULT TRUE,
  sort_order          INTEGER DEFAULT 0,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  last_updated_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_booking_services_business ON booking_services (business_id);
CREATE INDEX IF NOT EXISTS idx_booking_services_active ON booking_services (business_id, is_active) WHERE is_active = TRUE;

ALTER TABLE booking_services ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access" ON booking_services FOR ALL USING (true) WITH CHECK (true);

CREATE TRIGGER booking_services_updated_at
  BEFORE UPDATE ON booking_services
  FOR EACH ROW EXECUTE FUNCTION update_last_updated_at();


-- ============================================================================
-- 5. BOOKING_SLOTS — Concrete bookable time windows
-- ============================================================================

CREATE TABLE IF NOT EXISTS booking_slots (
  id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id       BIGINT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  service_id        UUID NOT NULL REFERENCES booking_services(id) ON DELETE CASCADE,
  staff_member_id   UUID REFERENCES staff_members(id) ON DELETE SET NULL,
  slot_type         TEXT NOT NULL CHECK (slot_type IN ('class', 'appointment')),
  slot_date         DATE NOT NULL,
  start_time        TIME NOT NULL,
  end_time          TIME NOT NULL,
  max_capacity      INTEGER DEFAULT 1 CHECK (max_capacity > 0),
  booked_count      INTEGER DEFAULT 0,
  status            TEXT DEFAULT 'available'
                      CHECK (status IN ('available', 'full', 'cancelled')),
  notes             TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_booking_slots_business ON booking_slots (business_id);
CREATE INDEX IF NOT EXISTS idx_booking_slots_service ON booking_slots (service_id);
CREATE INDEX IF NOT EXISTS idx_booking_slots_staff ON booking_slots (staff_member_id);
CREATE INDEX IF NOT EXISTS idx_booking_slots_date ON booking_slots (business_id, slot_date);
CREATE INDEX IF NOT EXISTS idx_booking_slots_available ON booking_slots (business_id, slot_date, status) WHERE status = 'available';

ALTER TABLE booking_slots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access" ON booking_slots FOR ALL USING (true) WITH CHECK (true);


-- ============================================================================
-- 6. BOOKING_CLIENTS — End-customers of the business (gym members, salon clients)
-- ============================================================================

CREATE TABLE IF NOT EXISTS booking_clients (
  id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id       BIGINT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  phone             TEXT NOT NULL,              -- E.164 format
  name              TEXT,
  email             TEXT,
  notes             TEXT,
  is_active         BOOLEAN DEFAULT TRUE,
  otp_code          TEXT,                       -- SHA-256 hashed OTP
  otp_expires_at    TIMESTAMPTZ,
  total_bookings    INTEGER DEFAULT 0,
  last_booking_at   TIMESTAMPTZ,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  last_updated_at   TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE (business_id, phone)
);

CREATE INDEX IF NOT EXISTS idx_booking_clients_business ON booking_clients (business_id);
CREATE INDEX IF NOT EXISTS idx_booking_clients_phone ON booking_clients (business_id, phone);

ALTER TABLE booking_clients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access" ON booking_clients FOR ALL USING (true) WITH CHECK (true);

CREATE TRIGGER booking_clients_updated_at
  BEFORE UPDATE ON booking_clients
  FOR EACH ROW EXECUTE FUNCTION update_last_updated_at();


-- ============================================================================
-- 7. BOOKINGS — Actual reservations
-- ============================================================================

CREATE TABLE IF NOT EXISTS bookings (
  id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id       BIGINT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  slot_id           UUID NOT NULL REFERENCES booking_slots(id) ON DELETE CASCADE,
  client_id         UUID NOT NULL REFERENCES booking_clients(id) ON DELETE CASCADE,
  service_id        UUID NOT NULL REFERENCES booking_services(id) ON DELETE CASCADE,
  staff_member_id   UUID REFERENCES staff_members(id) ON DELETE SET NULL,
  status            TEXT DEFAULT 'confirmed'
                      CHECK (status IN ('confirmed', 'cancelled', 'completed', 'no_show')),
  booked_at         TIMESTAMPTZ DEFAULT NOW(),
  cancelled_at      TIMESTAMPTZ,
  cancellation_reason TEXT,
  admin_notes       TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE (slot_id, client_id)
);

CREATE INDEX IF NOT EXISTS idx_bookings_business ON bookings (business_id);
CREATE INDEX IF NOT EXISTS idx_bookings_slot ON bookings (slot_id);
CREATE INDEX IF NOT EXISTS idx_bookings_client ON bookings (client_id);
CREATE INDEX IF NOT EXISTS idx_bookings_service ON bookings (service_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings (business_id, status);

ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access" ON bookings FOR ALL USING (true) WITH CHECK (true);


-- ============================================================================
-- 8. MEMBERSHIP_PLANS — For class-based model
-- ============================================================================

CREATE TABLE IF NOT EXISTS membership_plans (
  id                  UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id         BIGINT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name                TEXT NOT NULL,
  description         TEXT,
  classes_per_month   INTEGER,                   -- NULL = unlimited
  price               DECIMAL(10, 2) DEFAULT 0,
  currency            TEXT DEFAULT 'MXN' CHECK (currency IN ('MXN', 'USD', 'COP')),
  allowed_services    UUID[],                    -- NULL = all services
  is_active           BOOLEAN DEFAULT TRUE,
  sort_order          INTEGER DEFAULT 0,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  last_updated_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_membership_plans_business ON membership_plans (business_id);
CREATE INDEX IF NOT EXISTS idx_membership_plans_active ON membership_plans (business_id, is_active) WHERE is_active = TRUE;

ALTER TABLE membership_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access" ON membership_plans FOR ALL USING (true) WITH CHECK (true);

CREATE TRIGGER membership_plans_updated_at
  BEFORE UPDATE ON membership_plans
  FOR EACH ROW EXECUTE FUNCTION update_last_updated_at();


-- ============================================================================
-- 9. CLIENT_MEMBERSHIPS — Assigns a plan to a client
-- ============================================================================

CREATE TABLE IF NOT EXISTS client_memberships (
  id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id       BIGINT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  client_id         UUID NOT NULL REFERENCES booking_clients(id) ON DELETE CASCADE,
  plan_id           UUID NOT NULL REFERENCES membership_plans(id) ON DELETE CASCADE,
  status            TEXT DEFAULT 'active'
                      CHECK (status IN ('active', 'paused', 'cancelled', 'expired')),
  period_start      DATE NOT NULL,
  period_end        DATE NOT NULL,
  classes_used      INTEGER DEFAULT 0,
  classes_limit     INTEGER,                    -- copied from plan at creation (NULL = unlimited)
  admin_notes       TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  last_updated_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_client_memberships_business ON client_memberships (business_id);
CREATE INDEX IF NOT EXISTS idx_client_memberships_client ON client_memberships (client_id);
CREATE INDEX IF NOT EXISTS idx_client_memberships_plan ON client_memberships (plan_id);
CREATE INDEX IF NOT EXISTS idx_client_memberships_active ON client_memberships (business_id, status) WHERE status = 'active';

ALTER TABLE client_memberships ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access" ON client_memberships FOR ALL USING (true) WITH CHECK (true);

CREATE TRIGGER client_memberships_updated_at
  BEFORE UPDATE ON client_memberships
  FOR EACH ROW EXECUTE FUNCTION update_last_updated_at();
