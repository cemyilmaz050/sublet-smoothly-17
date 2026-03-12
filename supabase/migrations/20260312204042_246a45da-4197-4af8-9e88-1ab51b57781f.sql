
-- Add new columns to listings
ALTER TABLE public.listings 
  ADD COLUMN IF NOT EXISTS path text DEFAULT 'own',
  ADD COLUMN IF NOT EXISTS space_type text,
  ADD COLUMN IF NOT EXISTS management_group_id uuid,
  ADD COLUMN IF NOT EXISTS catalog_unit_id uuid;

-- Create property_managers table
CREATE TABLE public.property_managers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  logo_url text,
  city text,
  properties_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.property_managers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view managers" ON public.property_managers
  FOR SELECT TO authenticated USING (true);

-- Create catalog_properties table
CREATE TABLE public.catalog_properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  manager_id uuid REFERENCES public.property_managers(id) ON DELETE CASCADE NOT NULL,
  address text NOT NULL,
  name text,
  photo_url text,
  property_type text,
  units_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.catalog_properties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view catalog properties" ON public.catalog_properties
  FOR SELECT TO authenticated USING (true);

-- Create catalog_units table
CREATE TABLE public.catalog_units (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid REFERENCES public.catalog_properties(id) ON DELETE CASCADE NOT NULL,
  unit_number text NOT NULL,
  floor integer,
  bedrooms integer,
  bathrooms numeric,
  sqft integer,
  occupancy_status text DEFAULT 'available',
  photos text[] DEFAULT '{}',
  description text,
  amenities text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.catalog_units ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view catalog units" ON public.catalog_units
  FOR SELECT TO authenticated USING (true);

-- Add foreign keys to listings
ALTER TABLE public.listings
  ADD CONSTRAINT listings_management_group_id_fkey 
    FOREIGN KEY (management_group_id) REFERENCES public.property_managers(id),
  ADD CONSTRAINT listings_catalog_unit_id_fkey 
    FOREIGN KEY (catalog_unit_id) REFERENCES public.catalog_units(id);
