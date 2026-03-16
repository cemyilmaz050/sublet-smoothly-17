
-- Add extended fields to catalog_units for property manager editing
ALTER TABLE public.catalog_units
  ADD COLUMN IF NOT EXISTS space_type text DEFAULT 'entire_place',
  ADD COLUMN IF NOT EXISTS base_rent numeric,
  ADD COLUMN IF NOT EXISTS security_deposit numeric,
  ADD COLUMN IF NOT EXISTS utilities_included boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS included_utilities text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS available_from date,
  ADD COLUMN IF NOT EXISTS available_until date,
  ADD COLUMN IF NOT EXISTS no_smoking boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS pets_allowed boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS no_parties boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS quiet_hours boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS custom_rules text,
  ADD COLUMN IF NOT EXISTS nearby_landmarks text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Add extended fields to catalog_properties
ALTER TABLE public.catalog_properties
  ADD COLUMN IF NOT EXISTS building_amenities text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Allow managers to update their own catalog properties and units
CREATE POLICY "Managers can update own catalog properties"
  ON public.catalog_properties FOR UPDATE
  TO authenticated
  USING (manager_id IN (
    SELECT cp.manager_id FROM catalog_properties cp
    WHERE cp.manager_id = (SELECT pm.id FROM property_managers pm WHERE pm.id = catalog_properties.manager_id)
  ))
  WITH CHECK (true);

CREATE POLICY "Managers can update catalog units"
  ON public.catalog_units FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Allow managers to insert catalog units
CREATE POLICY "Managers can insert catalog units"
  ON public.catalog_units FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow public (anon) to view catalog properties too
CREATE POLICY "Public can view catalog properties"
  ON public.catalog_properties FOR SELECT
  TO anon
  USING (true);
