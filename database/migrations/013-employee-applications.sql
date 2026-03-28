-- Migration 013: Employee Applications table
-- Stores prospective employee applications from the public apply form

CREATE TABLE IF NOT EXISTS employee_applications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  message TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by UUID REFERENCES employees(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_employee_applications_status ON employee_applications (status);
CREATE INDEX IF NOT EXISTS idx_employee_applications_email ON employee_applications (email);

ALTER TABLE employee_applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access" ON employee_applications FOR ALL USING (true) WITH CHECK (true);
