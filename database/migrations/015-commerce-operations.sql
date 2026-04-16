-- ============================================================================
-- Migration 015: Inventory, Supplier Ledger, and POS Operations
-- ============================================================================
-- Adds the operational commerce layer for customer businesses:
--   - Inventory catalog + stock movements
--   - Suppliers + purchase orders + payables
--   - Commerce customers + sales + receivables
--   - POS support with payment logging
-- ============================================================================


-- ============================================================================
-- 36. SUPPLIERS — Vendors that sell inventory to the business
-- ============================================================================

CREATE TABLE IF NOT EXISTS suppliers (
  id                  UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id         BIGINT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name                TEXT NOT NULL,
  contact_name        TEXT,
  phone               TEXT,
  email               TEXT,
  whatsapp            TEXT,
  address             TEXT,
  payment_terms_days  INTEGER DEFAULT 0 CHECK (payment_terms_days >= 0),
  notes               TEXT,
  is_active           BOOLEAN DEFAULT TRUE,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  last_updated_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_suppliers_business ON suppliers (business_id);
CREATE INDEX IF NOT EXISTS idx_suppliers_active ON suppliers (business_id, is_active) WHERE is_active = TRUE;

ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access" ON suppliers FOR ALL USING (true) WITH CHECK (true);

CREATE TRIGGER suppliers_updated_at
  BEFORE UPDATE ON suppliers
  FOR EACH ROW EXECUTE FUNCTION update_last_updated_at();


-- ============================================================================
-- 37. INVENTORY_ITEMS — Sellable products tracked by stock level
-- ============================================================================

CREATE TABLE IF NOT EXISTS inventory_items (
  id                  UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id         BIGINT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  primary_supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
  name                TEXT NOT NULL,
  sku                 TEXT,
  barcode             TEXT,
  description         TEXT,
  category            TEXT,
  unit_name           TEXT DEFAULT 'pieza',
  sale_price          DECIMAL(12, 2) DEFAULT 0 CHECK (sale_price >= 0),
  cost_price          DECIMAL(12, 2) DEFAULT 0 CHECK (cost_price >= 0),
  currency            TEXT DEFAULT 'MXN'
                        CHECK (currency IN ('MXN', 'USD', 'COP', 'PEN', 'ARS', 'CLP')),
  current_stock       DECIMAL(12, 3) DEFAULT 0 CHECK (current_stock >= 0),
  reorder_point       DECIMAL(12, 3) DEFAULT 0 CHECK (reorder_point >= 0),
  reorder_quantity    DECIMAL(12, 3) DEFAULT 0 CHECK (reorder_quantity >= 0),
  track_inventory     BOOLEAN DEFAULT TRUE,
  notes               TEXT,
  is_active           BOOLEAN DEFAULT TRUE,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  last_updated_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_inventory_items_business ON inventory_items (business_id);
CREATE INDEX IF NOT EXISTS idx_inventory_items_active ON inventory_items (business_id, is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_inventory_items_low_stock ON inventory_items (business_id, reorder_point, current_stock) WHERE is_active = TRUE;
CREATE UNIQUE INDEX IF NOT EXISTS idx_inventory_items_sku_unique ON inventory_items (business_id, sku) WHERE sku IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_inventory_items_barcode_unique ON inventory_items (business_id, barcode) WHERE barcode IS NOT NULL;

ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access" ON inventory_items FOR ALL USING (true) WITH CHECK (true);

CREATE TRIGGER inventory_items_updated_at
  BEFORE UPDATE ON inventory_items
  FOR EACH ROW EXECUTE FUNCTION update_last_updated_at();


-- ============================================================================
-- 38. INVENTORY_MOVEMENTS — Immutable stock in/out history
-- ============================================================================

CREATE TABLE IF NOT EXISTS inventory_movements (
  id                  UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id         BIGINT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  item_id             UUID NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
  movement_type       TEXT NOT NULL
                        CHECK (movement_type IN (
                          'opening_balance',
                          'purchase_receive',
                          'sale',
                          'sale_return',
                          'purchase_return',
                          'manual_adjustment',
                          'stock_count'
                        )),
  direction           TEXT NOT NULL CHECK (direction IN ('in', 'out')),
  quantity            DECIMAL(12, 3) NOT NULL CHECK (quantity > 0),
  unit_cost           DECIMAL(12, 2),
  unit_price          DECIMAL(12, 2),
  reference_type      TEXT
                        CHECK (reference_type IN ('purchase_order', 'sale', 'manual')),
  reference_id        UUID,
  notes               TEXT,
  occurred_at         TIMESTAMPTZ DEFAULT NOW(),
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_inventory_movements_business ON inventory_movements (business_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_item ON inventory_movements (item_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_reference ON inventory_movements (reference_type, reference_id);

ALTER TABLE inventory_movements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access" ON inventory_movements FOR ALL USING (true) WITH CHECK (true);


-- ============================================================================
-- 39. PURCHASE_ORDERS — Supplier purchase orders and payables
-- ============================================================================

CREATE TABLE IF NOT EXISTS purchase_orders (
  id                  UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id         BIGINT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  supplier_id         UUID NOT NULL REFERENCES suppliers(id) ON DELETE RESTRICT,
  po_number           TEXT NOT NULL DEFAULT 'PO-' || upper(substr(md5(random()::text), 1, 8)),
  status              TEXT DEFAULT 'ordered'
                        CHECK (status IN ('draft', 'ordered', 'partially_received', 'received', 'cancelled')),
  payment_status      TEXT DEFAULT 'pending'
                        CHECK (payment_status IN ('pending', 'partial', 'paid')),
  order_date          DATE DEFAULT CURRENT_DATE,
  expected_date       DATE,
  due_date            DATE,
  currency            TEXT DEFAULT 'MXN'
                        CHECK (currency IN ('MXN', 'USD', 'COP', 'PEN', 'ARS', 'CLP')),
  subtotal            DECIMAL(12, 2) DEFAULT 0 CHECK (subtotal >= 0),
  tax_amount          DECIMAL(12, 2) DEFAULT 0 CHECK (tax_amount >= 0),
  total_amount        DECIMAL(12, 2) DEFAULT 0 CHECK (total_amount >= 0),
  amount_paid         DECIMAL(12, 2) DEFAULT 0 CHECK (amount_paid >= 0),
  balance_due         DECIMAL(12, 2) DEFAULT 0 CHECK (balance_due >= 0),
  notes               TEXT,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  last_updated_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_purchase_orders_business ON purchase_orders (business_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_supplier ON purchase_orders (supplier_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_balance ON purchase_orders (business_id, balance_due) WHERE balance_due > 0;
CREATE UNIQUE INDEX IF NOT EXISTS idx_purchase_orders_number_unique ON purchase_orders (business_id, po_number);

ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access" ON purchase_orders FOR ALL USING (true) WITH CHECK (true);

CREATE TRIGGER purchase_orders_updated_at
  BEFORE UPDATE ON purchase_orders
  FOR EACH ROW EXECUTE FUNCTION update_last_updated_at();


-- ============================================================================
-- 40. PURCHASE_ORDER_ITEMS — Line items for a purchase order
-- ============================================================================

CREATE TABLE IF NOT EXISTS purchase_order_items (
  id                  UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  purchase_order_id   UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  business_id         BIGINT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  item_id             UUID NOT NULL REFERENCES inventory_items(id) ON DELETE RESTRICT,
  description         TEXT,
  quantity_ordered    DECIMAL(12, 3) NOT NULL CHECK (quantity_ordered > 0),
  quantity_received   DECIMAL(12, 3) DEFAULT 0 CHECK (quantity_received >= 0 AND quantity_received <= quantity_ordered),
  unit_cost           DECIMAL(12, 2) DEFAULT 0 CHECK (unit_cost >= 0),
  line_total          DECIMAL(12, 2) DEFAULT 0 CHECK (line_total >= 0),
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_purchase_order_items_order ON purchase_order_items (purchase_order_id);
CREATE INDEX IF NOT EXISTS idx_purchase_order_items_item ON purchase_order_items (item_id);
CREATE INDEX IF NOT EXISTS idx_purchase_order_items_business ON purchase_order_items (business_id);

ALTER TABLE purchase_order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access" ON purchase_order_items FOR ALL USING (true) WITH CHECK (true);


-- ============================================================================
-- 41. COMMERCE_CUSTOMERS — Buyers who purchase from the business
-- ============================================================================

CREATE TABLE IF NOT EXISTS commerce_customers (
  id                  UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id         BIGINT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name                TEXT NOT NULL,
  phone               TEXT,
  email               TEXT,
  address             TEXT,
  credit_terms_days   INTEGER DEFAULT 0 CHECK (credit_terms_days >= 0),
  notes               TEXT,
  is_active           BOOLEAN DEFAULT TRUE,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  last_updated_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_commerce_customers_business ON commerce_customers (business_id);
CREATE INDEX IF NOT EXISTS idx_commerce_customers_active ON commerce_customers (business_id, is_active) WHERE is_active = TRUE;
CREATE UNIQUE INDEX IF NOT EXISTS idx_commerce_customers_email_unique ON commerce_customers (business_id, email) WHERE email IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_commerce_customers_phone_unique ON commerce_customers (business_id, phone) WHERE phone IS NOT NULL;

ALTER TABLE commerce_customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access" ON commerce_customers FOR ALL USING (true) WITH CHECK (true);

CREATE TRIGGER commerce_customers_updated_at
  BEFORE UPDATE ON commerce_customers
  FOR EACH ROW EXECUTE FUNCTION update_last_updated_at();


-- ============================================================================
-- 42. SALES — POS and invoice sales with receivables
-- ============================================================================

CREATE TABLE IF NOT EXISTS sales (
  id                  UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id         BIGINT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  customer_id         UUID REFERENCES commerce_customers(id) ON DELETE SET NULL,
  sale_number         TEXT NOT NULL DEFAULT 'SALE-' || upper(substr(md5(random()::text), 1, 8)),
  status              TEXT DEFAULT 'completed'
                        CHECK (status IN ('completed', 'cancelled', 'refunded')),
  payment_status      TEXT DEFAULT 'pending'
                        CHECK (payment_status IN ('pending', 'partial', 'paid')),
  payment_method      TEXT
                        CHECK (payment_method IN ('cash', 'card', 'transfer', 'credit', 'mixed', 'other')),
  sale_channel        TEXT DEFAULT 'pos'
                        CHECK (sale_channel IN ('pos', 'manual', 'online')),
  currency            TEXT DEFAULT 'MXN'
                        CHECK (currency IN ('MXN', 'USD', 'COP', 'PEN', 'ARS', 'CLP')),
  subtotal            DECIMAL(12, 2) DEFAULT 0 CHECK (subtotal >= 0),
  discount_amount     DECIMAL(12, 2) DEFAULT 0 CHECK (discount_amount >= 0),
  tax_amount          DECIMAL(12, 2) DEFAULT 0 CHECK (tax_amount >= 0),
  total_amount        DECIMAL(12, 2) DEFAULT 0 CHECK (total_amount >= 0),
  amount_paid         DECIMAL(12, 2) DEFAULT 0 CHECK (amount_paid >= 0),
  balance_due         DECIMAL(12, 2) DEFAULT 0 CHECK (balance_due >= 0),
  due_date            DATE,
  notes               TEXT,
  sold_at             TIMESTAMPTZ DEFAULT NOW(),
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  last_updated_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sales_business ON sales (business_id, sold_at DESC);
CREATE INDEX IF NOT EXISTS idx_sales_customer ON sales (customer_id);
CREATE INDEX IF NOT EXISTS idx_sales_balance ON sales (business_id, balance_due) WHERE balance_due > 0;
CREATE UNIQUE INDEX IF NOT EXISTS idx_sales_number_unique ON sales (business_id, sale_number);

ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access" ON sales FOR ALL USING (true) WITH CHECK (true);

CREATE TRIGGER sales_updated_at
  BEFORE UPDATE ON sales
  FOR EACH ROW EXECUTE FUNCTION update_last_updated_at();


-- ============================================================================
-- 43. SALE_ITEMS — Line items sold through POS or invoices
-- ============================================================================

CREATE TABLE IF NOT EXISTS sale_items (
  id                  UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sale_id             UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  business_id         BIGINT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  item_id             UUID NOT NULL REFERENCES inventory_items(id) ON DELETE RESTRICT,
  description         TEXT,
  quantity            DECIMAL(12, 3) NOT NULL CHECK (quantity > 0),
  unit_price          DECIMAL(12, 2) DEFAULT 0 CHECK (unit_price >= 0),
  unit_cost           DECIMAL(12, 2) DEFAULT 0 CHECK (unit_cost >= 0),
  line_total          DECIMAL(12, 2) DEFAULT 0 CHECK (line_total >= 0),
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sale_items_sale ON sale_items (sale_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_item ON sale_items (item_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_business ON sale_items (business_id);

ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access" ON sale_items FOR ALL USING (true) WITH CHECK (true);


-- ============================================================================
-- 44. FINANCE_PAYMENTS — Cash in/out against sales or purchase orders
-- ============================================================================

CREATE TABLE IF NOT EXISTS finance_payments (
  id                  UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id         BIGINT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  direction           TEXT NOT NULL CHECK (direction IN ('incoming', 'outgoing')),
  reference_type      TEXT NOT NULL CHECK (reference_type IN ('sale', 'purchase_order', 'manual')),
  sale_id             UUID REFERENCES sales(id) ON DELETE SET NULL,
  purchase_order_id   UUID REFERENCES purchase_orders(id) ON DELETE SET NULL,
  customer_id         UUID REFERENCES commerce_customers(id) ON DELETE SET NULL,
  supplier_id         UUID REFERENCES suppliers(id) ON DELETE SET NULL,
  amount              DECIMAL(12, 2) NOT NULL CHECK (amount > 0),
  currency            TEXT DEFAULT 'MXN'
                        CHECK (currency IN ('MXN', 'USD', 'COP', 'PEN', 'ARS', 'CLP')),
  payment_method      TEXT
                        CHECK (payment_method IN ('cash', 'card', 'transfer', 'credit', 'other')),
  payment_date        DATE NOT NULL DEFAULT CURRENT_DATE,
  notes               TEXT,
  created_at          TIMESTAMPTZ DEFAULT NOW(),

  CHECK (
    (reference_type = 'sale' AND sale_id IS NOT NULL AND purchase_order_id IS NULL)
    OR (reference_type = 'purchase_order' AND purchase_order_id IS NOT NULL AND sale_id IS NULL)
    OR (reference_type = 'manual' AND sale_id IS NULL AND purchase_order_id IS NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_finance_payments_business ON finance_payments (business_id, payment_date DESC);
CREATE INDEX IF NOT EXISTS idx_finance_payments_sale ON finance_payments (sale_id);
CREATE INDEX IF NOT EXISTS idx_finance_payments_purchase_order ON finance_payments (purchase_order_id);
CREATE INDEX IF NOT EXISTS idx_finance_payments_direction ON finance_payments (business_id, direction);

ALTER TABLE finance_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access" ON finance_payments FOR ALL USING (true) WITH CHECK (true);
