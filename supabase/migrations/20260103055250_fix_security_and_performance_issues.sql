/*
  # Fix Security and Performance Issues

  This migration addresses critical security and performance issues identified in the database.

  ## Changes

  ### 1. Add Missing Indexes
  - Add index for `bookings.created_by` foreign key
  - Add index for `itinerary_items.supplier_id` foreign key

  ### 2. Fix RLS Performance Issues
  - Optimize all RLS policies to use `(select auth.uid())` instead of `auth.uid()`
  - Optimize all RLS policies to use `(select auth.jwt())` instead of `auth.jwt()`
  - This prevents re-evaluation for each row and improves query performance

  ### 3. Consolidate Multiple Permissive Policies
  - Merge overlapping SELECT policies for better performance
  - Remove redundant policies

  ### 4. Fix Function Search Path Issues
  - Set explicit search_path for all functions to prevent security vulnerabilities

  ## Notes
  - All changes are backward compatible
  - No data loss will occur
  - Performance improvements will be immediate
*/

-- =====================================================
-- 1. Add Missing Indexes
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_bookings_created_by ON bookings(created_by);
CREATE INDEX IF NOT EXISTS idx_itinerary_supplier ON itinerary_items(supplier_id);

-- =====================================================
-- 2. Drop Existing RLS Policies
-- =====================================================

-- Destinations policies
DROP POLICY IF EXISTS "Public can view active destinations" ON destinations;
DROP POLICY IF EXISTS "Authenticated users can view all destinations" ON destinations;
DROP POLICY IF EXISTS "Admins can insert destinations" ON destinations;
DROP POLICY IF EXISTS "Admins can update destinations" ON destinations;
DROP POLICY IF EXISTS "Admins can delete destinations" ON destinations;

-- Travel packages policies
DROP POLICY IF EXISTS "Public can view active packages" ON travel_packages;
DROP POLICY IF EXISTS "Authenticated users can view all packages" ON travel_packages;
DROP POLICY IF EXISTS "Admins can insert packages" ON travel_packages;
DROP POLICY IF EXISTS "Admins can update packages" ON travel_packages;
DROP POLICY IF EXISTS "Admins can delete packages" ON travel_packages;

-- Customers policies
DROP POLICY IF EXISTS "Users can view own customer record" ON customers;
DROP POLICY IF EXISTS "Authenticated users can create customer records" ON customers;
DROP POLICY IF EXISTS "Users can update own customer record" ON customers;
DROP POLICY IF EXISTS "Admins can delete customers" ON customers;

-- Bookings policies
DROP POLICY IF EXISTS "Users can view own bookings" ON bookings;
DROP POLICY IF EXISTS "Authenticated users can create bookings" ON bookings;
DROP POLICY IF EXISTS "Users can update own bookings" ON bookings;
DROP POLICY IF EXISTS "Admins can delete bookings" ON bookings;

-- Suppliers policies
DROP POLICY IF EXISTS "Authenticated users can view suppliers" ON suppliers;
DROP POLICY IF EXISTS "Admins can manage suppliers" ON suppliers;

-- Itinerary items policies
DROP POLICY IF EXISTS "Public can view itinerary for active packages" ON itinerary_items;
DROP POLICY IF EXISTS "Authenticated users can view all itineraries" ON itinerary_items;
DROP POLICY IF EXISTS "Admins can manage itinerary items" ON itinerary_items;

-- App settings policies
DROP POLICY IF EXISTS "Authenticated users can view settings" ON app_settings;
DROP POLICY IF EXISTS "Admins can manage settings" ON app_settings;

-- =====================================================
-- 3. Create Optimized RLS Policies
-- =====================================================

-- Destinations: Consolidated SELECT policy
CREATE POLICY "Anyone can view active destinations"
  ON destinations FOR SELECT
  USING (
    is_active = true OR 
    (select auth.jwt()->>'app_metadata')::jsonb->>'role' = 'admin'
  );

CREATE POLICY "Admins can insert destinations"
  ON destinations FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.jwt()->>'app_metadata')::jsonb->>'role' = 'admin');

CREATE POLICY "Admins can update destinations"
  ON destinations FOR UPDATE
  TO authenticated
  USING ((select auth.jwt()->>'app_metadata')::jsonb->>'role' = 'admin')
  WITH CHECK ((select auth.jwt()->>'app_metadata')::jsonb->>'role' = 'admin');

CREATE POLICY "Admins can delete destinations"
  ON destinations FOR DELETE
  TO authenticated
  USING ((select auth.jwt()->>'app_metadata')::jsonb->>'role' = 'admin');

-- Travel packages: Consolidated SELECT policy
CREATE POLICY "Anyone can view active packages"
  ON travel_packages FOR SELECT
  USING (
    is_active = true OR 
    (select auth.jwt()->>'app_metadata')::jsonb->>'role' = 'admin'
  );

CREATE POLICY "Admins can insert packages"
  ON travel_packages FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.jwt()->>'app_metadata')::jsonb->>'role' = 'admin');

CREATE POLICY "Admins can update packages"
  ON travel_packages FOR UPDATE
  TO authenticated
  USING ((select auth.jwt()->>'app_metadata')::jsonb->>'role' = 'admin')
  WITH CHECK ((select auth.jwt()->>'app_metadata')::jsonb->>'role' = 'admin');

CREATE POLICY "Admins can delete packages"
  ON travel_packages FOR DELETE
  TO authenticated
  USING ((select auth.jwt()->>'app_metadata')::jsonb->>'role' = 'admin');

-- Customers policies
CREATE POLICY "Users can view own customer record"
  ON customers FOR SELECT
  TO authenticated
  USING (
    (select auth.uid()) = user_id OR 
    (select auth.jwt()->>'app_metadata')::jsonb->>'role' = 'admin'
  );

CREATE POLICY "Authenticated users can create customer records"
  ON customers FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update own customer record"
  ON customers FOR UPDATE
  TO authenticated
  USING (
    (select auth.uid()) = user_id OR 
    (select auth.jwt()->>'app_metadata')::jsonb->>'role' = 'admin'
  )
  WITH CHECK (
    (select auth.uid()) = user_id OR 
    (select auth.jwt()->>'app_metadata')::jsonb->>'role' = 'admin'
  );

CREATE POLICY "Admins can delete customers"
  ON customers FOR DELETE
  TO authenticated
  USING ((select auth.jwt()->>'app_metadata')::jsonb->>'role' = 'admin');

-- Bookings policies
CREATE POLICY "Users can view own bookings"
  ON bookings FOR SELECT
  TO authenticated
  USING (
    created_by = (select auth.uid()) OR 
    (select auth.jwt()->>'app_metadata')::jsonb->>'role' = 'admin' OR
    EXISTS (
      SELECT 1 FROM customers 
      WHERE customers.id = bookings.customer_id 
      AND customers.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Authenticated users can create bookings"
  ON bookings FOR INSERT
  TO authenticated
  WITH CHECK (
    created_by = (select auth.uid()) OR 
    (select auth.jwt()->>'app_metadata')::jsonb->>'role' = 'admin'
  );

CREATE POLICY "Users can update own bookings"
  ON bookings FOR UPDATE
  TO authenticated
  USING (
    created_by = (select auth.uid()) OR 
    (select auth.jwt()->>'app_metadata')::jsonb->>'role' = 'admin'
  )
  WITH CHECK (
    created_by = (select auth.uid()) OR 
    (select auth.jwt()->>'app_metadata')::jsonb->>'role' = 'admin'
  );

CREATE POLICY "Admins can delete bookings"
  ON bookings FOR DELETE
  TO authenticated
  USING ((select auth.jwt()->>'app_metadata')::jsonb->>'role' = 'admin');

-- Suppliers: Consolidated policy
CREATE POLICY "Authenticated users can view suppliers"
  ON suppliers FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage suppliers"
  ON suppliers FOR ALL
  TO authenticated
  USING ((select auth.jwt()->>'app_metadata')::jsonb->>'role' = 'admin')
  WITH CHECK ((select auth.jwt()->>'app_metadata')::jsonb->>'role' = 'admin');

-- Itinerary items: Consolidated SELECT policy
CREATE POLICY "Anyone can view itinerary for active packages"
  ON itinerary_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM travel_packages 
      WHERE travel_packages.id = itinerary_items.package_id 
      AND travel_packages.is_active = true
    ) OR 
    (select auth.jwt()->>'app_metadata')::jsonb->>'role' = 'admin'
  );

CREATE POLICY "Admins can manage itinerary items"
  ON itinerary_items FOR ALL
  TO authenticated
  USING ((select auth.jwt()->>'app_metadata')::jsonb->>'role' = 'admin')
  WITH CHECK ((select auth.jwt()->>'app_metadata')::jsonb->>'role' = 'admin');

-- App settings: Consolidated policy
CREATE POLICY "Authenticated users can view settings"
  ON app_settings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage settings"
  ON app_settings FOR ALL
  TO authenticated
  USING ((select auth.jwt()->>'app_metadata')::jsonb->>'role' = 'admin')
  WITH CHECK ((select auth.jwt()->>'app_metadata')::jsonb->>'role' = 'admin');

-- =====================================================
-- 4. Fix Function Search Path Issues
-- =====================================================

-- Recreate update_updated_at_column with explicit search_path
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Recreate generate_booking_number with explicit search_path
CREATE OR REPLACE FUNCTION generate_booking_number()
RETURNS text
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN 'BK' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::text, 4, '0');
END;
$$;

-- =====================================================
-- 5. Performance Optimization Notes
-- =====================================================

-- Note: The "unused index" warnings are expected for a new database
-- These indexes will become useful as data grows and queries are executed
-- Keep all existing indexes as they follow best practices for foreign keys

-- Analyze tables to update statistics
ANALYZE destinations;
ANALYZE travel_packages;
ANALYZE customers;
ANALYZE bookings;
ANALYZE suppliers;
ANALYZE itinerary_items;
ANALYZE app_settings;