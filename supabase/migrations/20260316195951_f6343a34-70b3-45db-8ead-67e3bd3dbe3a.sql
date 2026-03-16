
-- Allow managers to delete catalog units they manage
CREATE POLICY "Managers can delete own catalog units"
ON public.catalog_units
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM catalog_properties cp
    JOIN listings l ON l.manager_id = auth.uid()
    WHERE cp.id = catalog_units.property_id
  )
);

-- Allow managers to delete catalog properties they manage
CREATE POLICY "Managers can delete own catalog properties"
ON public.catalog_properties
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM listings l
    WHERE l.manager_id = auth.uid() AND l.management_group_id = catalog_properties.manager_id
  )
);
