
-- Drop the broken DELETE policies
DROP POLICY IF EXISTS "Managers can delete own catalog units" ON public.catalog_units;
DROP POLICY IF EXISTS "Managers can delete own catalog properties" ON public.catalog_properties;

-- Fix: Allow BBG staff to delete catalog properties they manage
CREATE POLICY "BBG staff can delete catalog properties"
ON public.catalog_properties
FOR DELETE
TO authenticated
USING (public.is_bbg_staff(auth.uid()) AND manager_id = 'd39b883c-0941-4620-96d6-ea588231b58e');

-- Fix: Allow BBG staff to delete catalog units for BBG properties
CREATE POLICY "BBG staff can delete catalog units"
ON public.catalog_units
FOR DELETE
TO authenticated
USING (
  public.is_bbg_staff(auth.uid()) AND
  EXISTS (
    SELECT 1 FROM catalog_properties cp
    WHERE cp.id = catalog_units.property_id
    AND cp.manager_id = 'd39b883c-0941-4620-96d6-ea588231b58e'
  )
);

-- Allow BBG staff to INSERT catalog properties
CREATE POLICY "BBG staff can insert catalog properties"
ON public.catalog_properties
FOR INSERT
TO authenticated
WITH CHECK (public.is_bbg_staff(auth.uid()) AND manager_id = 'd39b883c-0941-4620-96d6-ea588231b58e');

-- Fix UPDATE policy for catalog_properties to use is_bbg_staff
DROP POLICY IF EXISTS "Managers can update own catalog properties" ON public.catalog_properties;
CREATE POLICY "BBG staff can update catalog properties"
ON public.catalog_properties
FOR UPDATE
TO authenticated
USING (public.is_bbg_staff(auth.uid()) AND manager_id = 'd39b883c-0941-4620-96d6-ea588231b58e');

-- Fix INSERT policy for catalog_units
DROP POLICY IF EXISTS "Managers can insert own catalog units" ON public.catalog_units;
CREATE POLICY "BBG staff can insert catalog units"
ON public.catalog_units
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_bbg_staff(auth.uid()) AND
  EXISTS (
    SELECT 1 FROM catalog_properties cp
    WHERE cp.id = catalog_units.property_id
    AND cp.manager_id = 'd39b883c-0941-4620-96d6-ea588231b58e'
  )
);

-- Fix UPDATE policy for catalog_units
DROP POLICY IF EXISTS "Managers can update own catalog units" ON public.catalog_units;
CREATE POLICY "BBG staff can update catalog units"
ON public.catalog_units
FOR UPDATE
TO authenticated
USING (
  public.is_bbg_staff(auth.uid()) AND
  EXISTS (
    SELECT 1 FROM catalog_properties cp
    WHERE cp.id = catalog_units.property_id
    AND cp.manager_id = 'd39b883c-0941-4620-96d6-ea588231b58e'
  )
);

-- Allow managers to DELETE listings they manage (for hard delete)
CREATE POLICY "Managers can delete managed listings"
ON public.listings
FOR DELETE
TO authenticated
USING (manager_id = auth.uid());
