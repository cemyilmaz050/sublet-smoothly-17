
-- Create a public view excluding contact fields
CREATE OR REPLACE VIEW public.property_managers_public
WITH (security_invoker = off)
AS SELECT
  id, name, slug, city, state, country, description, logo_url, cover_photo_url,
  properties_count, verified, status, created_at, address, website
FROM public.property_managers;

-- Grant access to the view
GRANT SELECT ON public.property_managers_public TO anon;
GRANT SELECT ON public.property_managers_public TO authenticated;

-- Remove anon access to the base table
DROP POLICY IF EXISTS "Anyone can view managers publicly" ON public.property_managers;
