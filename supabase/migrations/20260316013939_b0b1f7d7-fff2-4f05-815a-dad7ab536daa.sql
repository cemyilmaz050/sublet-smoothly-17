
CREATE OR REPLACE VIEW public.property_managers_public
WITH (security_invoker = on)
AS SELECT
  id, name, slug, city, state, country, description, logo_url, cover_photo_url,
  properties_count, verified, status, created_at, address, website
FROM public.property_managers;
