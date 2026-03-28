-- 012-employee-commissions.sql
-- Adds tracking codes for employees, sales rep attribution on customers,
-- and per-product commission amounts for the commission tracking system.

-- Add tracking code to employees (one per employee, unique)
ALTER TABLE employees ADD COLUMN IF NOT EXISTS tracking_code TEXT UNIQUE;
CREATE INDEX IF NOT EXISTS idx_employees_tracking_code ON employees (tracking_code) WHERE tracking_code IS NOT NULL;

-- Add sales rep attribution to customers (permanent, like referral_code)
ALTER TABLE customers ADD COLUMN IF NOT EXISTS sales_rep_employee_id UUID REFERENCES employees(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_customers_sales_rep ON customers (sales_rep_employee_id) WHERE sales_rep_employee_id IS NOT NULL;

-- Add per-product commission amount (default $100 MXN)
ALTER TABLE products ADD COLUMN IF NOT EXISTS commission_amount DECIMAL(10, 2) DEFAULT 100.00;
