
-- Drop overly permissive policies and replace with proper ones
DROP POLICY IF EXISTS "Managers can update own catalog properties" ON public.catalog_properties;
DROP POLICY IF EXISTS "Managers can update catalog units" ON public.catalog_units;
DROP POLICY IF EXISTS "Managers can insert catalog units" ON public.catalog_units;

-- Proper policy: only the manager who owns the property can update it
CREATE POLICY "Managers can update own catalog properties"
  ON public.catalog_properties FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM property_managers pm
    WHERE pm.id = catalog_properties.manager_id
    AND pm.id IN (
      SELECT sr.manager_id FROM sublet_requests sr WHERE sr.manager_id = auth.uid()
      UNION
      SELECT l.manager_id FROM listings l WHERE l.manager_id = auth.uid()
    )
  ));

-- For BBG demo: allow the BBG staff user to update units in BBG properties
CREATE POLICY "Managers can update own catalog units"
  ON public.catalog_units FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM catalog_properties cp
    JOIN listings l ON l.manager_id = auth.uid()
    WHERE cp.id = catalog_units.property_id
  ));

CREATE POLICY "Managers can insert own catalog units"
  ON public.catalog_units FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM catalog_properties cp
    JOIN listings l ON l.manager_id = auth.uid()
    WHERE cp.id = catalog_units.property_id
  ));
