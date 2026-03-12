
-- Add missing columns to property_managers
ALTER TABLE public.property_managers
  ADD COLUMN IF NOT EXISTS slug text UNIQUE,
  ADD COLUMN IF NOT EXISTS state text,
  ADD COLUMN IF NOT EXISTS country text,
  ADD COLUMN IF NOT EXISTS address text,
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS website text,
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS cover_photo_url text,
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS verified boolean DEFAULT false;

-- Rename 'name' to match company_name concept but keep as 'name' for compatibility
-- (already exists as 'name')

-- Allow public (unauthenticated) to view managers for the profile page
CREATE POLICY "Anyone can view managers publicly" ON public.property_managers
  FOR SELECT TO anon USING (true);
