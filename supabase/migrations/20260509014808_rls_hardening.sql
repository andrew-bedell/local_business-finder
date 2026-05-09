-- ============================================================================
-- Migration 018: RLS hardening for customer and employee browser access
-- ============================================================================
-- Removes legacy open-access policies and replaces them with explicit
-- employee- and customer-scoped policies for the tables accessed directly
-- from browser clients.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.is_employee()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.employees
    WHERE auth_user_id = auth.uid()
      AND is_active = true
  );
$$;

CREATE OR REPLACE FUNCTION public.current_customer_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT customer_id
  FROM public.customer_users
  WHERE auth_user_id = auth.uid()
    AND COALESCE(is_active, true) = true
  ORDER BY created_at ASC
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.current_business_id()
RETURNS bigint
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT c.business_id
  FROM public.customers c
  JOIN public.customer_users cu
    ON cu.customer_id = c.id
  WHERE cu.auth_user_id = auth.uid()
    AND COALESCE(cu.is_active, true) = true
  ORDER BY cu.created_at ASC
  LIMIT 1;
$$;

DO $$
DECLARE
  policy_row record;
BEGIN
  FOR policy_row IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND policyname = 'Allow all access'
  LOOP
    EXECUTE format(
      'DROP POLICY IF EXISTS %I ON %I.%I',
      policy_row.policyname,
      policy_row.schemaname,
      policy_row.tablename
    );
  END LOOP;
END
$$;

DROP POLICY IF EXISTS "Customers read own data" ON public.customers;
DROP POLICY IF EXISTS "Customers read own subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Customers read own user record" ON public.customer_users;
DROP POLICY IF EXISTS "Customers read own team" ON public.customer_users;
DROP POLICY IF EXISTS "Customers read own edit requests" ON public.edit_requests;
DROP POLICY IF EXISTS "Customers insert edit requests" ON public.edit_requests;

DROP POLICY IF EXISTS "employee read own profile" ON public.employees;
DROP POLICY IF EXISTS "employee update own profile" ON public.employees;
CREATE POLICY "employee read own profile"
  ON public.employees
  FOR SELECT
  TO authenticated
  USING (
    auth_user_id = auth.uid()
    AND is_active = true
  );

CREATE POLICY "employee update own profile"
  ON public.employees
  FOR UPDATE
  TO authenticated
  USING (
    auth_user_id = auth.uid()
    AND is_active = true
  )
  WITH CHECK (
    auth_user_id = auth.uid()
  );

DO $$
DECLARE
  table_name text;
  employee_tables text[] := ARRAY[
    'businesses',
    'business_social_profiles',
    'business_photos',
    'business_reviews',
    'business_menus',
    'business_services',
    'generated_websites',
    'customers',
    'subscriptions',
    'products',
    'whatsapp_conversations',
    'whatsapp_messages',
    'whatsapp_templates',
    'whatsapp_campaign_messages',
    'email_conversations',
    'email_messages'
  ];
BEGIN
  FOREACH table_name IN ARRAY employee_tables
  LOOP
    EXECUTE format(
      'DROP POLICY IF EXISTS %I ON public.%I',
      'employee all access',
      table_name
    );
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR ALL TO authenticated USING (public.is_employee()) WITH CHECK (public.is_employee())',
      'employee all access',
      table_name
    );
  END LOOP;
END
$$;

DROP POLICY IF EXISTS "customer read own row" ON public.customer_users;
CREATE POLICY "customer read own row"
  ON public.customer_users
  FOR SELECT
  TO authenticated
  USING (
    auth_user_id = auth.uid()
    AND COALESCE(is_active, true) = true
  );

DROP POLICY IF EXISTS "customer read own customer" ON public.customers;
CREATE POLICY "customer read own customer"
  ON public.customers
  FOR SELECT
  TO authenticated
  USING (
    id = public.current_customer_id()
  );

DROP POLICY IF EXISTS "customer read own subscription" ON public.subscriptions;
CREATE POLICY "customer read own subscription"
  ON public.subscriptions
  FOR SELECT
  TO authenticated
  USING (
    customer_id = public.current_customer_id()
  );

DROP POLICY IF EXISTS "customer read own edit requests" ON public.edit_requests;
CREATE POLICY "customer read own edit requests"
  ON public.edit_requests
  FOR SELECT
  TO authenticated
  USING (
    customer_id = public.current_customer_id()
  );

DROP POLICY IF EXISTS "customer read own business" ON public.businesses;
DROP POLICY IF EXISTS "customer update own business" ON public.businesses;
CREATE POLICY "customer read own business"
  ON public.businesses
  FOR SELECT
  TO authenticated
  USING (
    id = public.current_business_id()
  );

CREATE POLICY "customer update own business"
  ON public.businesses
  FOR UPDATE
  TO authenticated
  USING (
    id = public.current_business_id()
  )
  WITH CHECK (
    id = public.current_business_id()
  );

DROP POLICY IF EXISTS "customer read own generated websites" ON public.generated_websites;
CREATE POLICY "customer read own generated websites"
  ON public.generated_websites
  FOR SELECT
  TO authenticated
  USING (
    business_id = public.current_business_id()
  );

DROP POLICY IF EXISTS "customer read own photos" ON public.business_photos;
CREATE POLICY "customer read own photos"
  ON public.business_photos
  FOR SELECT
  TO authenticated
  USING (
    business_id = public.current_business_id()
  );

DROP POLICY IF EXISTS "customer read own reviews" ON public.business_reviews;
DROP POLICY IF EXISTS "customer insert own reviews" ON public.business_reviews;
DROP POLICY IF EXISTS "customer delete own reviews" ON public.business_reviews;
CREATE POLICY "customer read own reviews"
  ON public.business_reviews
  FOR SELECT
  TO authenticated
  USING (
    business_id = public.current_business_id()
  );

CREATE POLICY "customer insert own reviews"
  ON public.business_reviews
  FOR INSERT
  TO authenticated
  WITH CHECK (
    business_id = public.current_business_id()
  );

CREATE POLICY "customer delete own reviews"
  ON public.business_reviews
  FOR DELETE
  TO authenticated
  USING (
    business_id = public.current_business_id()
  );

DROP POLICY IF EXISTS "customer read own services" ON public.business_services;
DROP POLICY IF EXISTS "customer insert own services" ON public.business_services;
DROP POLICY IF EXISTS "customer delete own services" ON public.business_services;
CREATE POLICY "customer read own services"
  ON public.business_services
  FOR SELECT
  TO authenticated
  USING (
    business_id = public.current_business_id()
  );

CREATE POLICY "customer insert own services"
  ON public.business_services
  FOR INSERT
  TO authenticated
  WITH CHECK (
    business_id = public.current_business_id()
  );

CREATE POLICY "customer delete own services"
  ON public.business_services
  FOR DELETE
  TO authenticated
  USING (
    business_id = public.current_business_id()
  );

DROP POLICY IF EXISTS "customer read own menu items" ON public.business_menus;
DROP POLICY IF EXISTS "customer insert own menu items" ON public.business_menus;
DROP POLICY IF EXISTS "customer delete own menu items" ON public.business_menus;
CREATE POLICY "customer read own menu items"
  ON public.business_menus
  FOR SELECT
  TO authenticated
  USING (
    business_id = public.current_business_id()
  );

CREATE POLICY "customer insert own menu items"
  ON public.business_menus
  FOR INSERT
  TO authenticated
  WITH CHECK (
    business_id = public.current_business_id()
  );

CREATE POLICY "customer delete own menu items"
  ON public.business_menus
  FOR DELETE
  TO authenticated
  USING (
    business_id = public.current_business_id()
  );
