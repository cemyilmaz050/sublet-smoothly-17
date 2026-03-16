
-- Remove sensitive fields from profiles_public view and keep only what's needed for public display
DROP VIEW IF EXISTS public.profiles_public;
CREATE VIEW public.profiles_public
WITH (security_invoker = on)
AS
SELECT
  id,
  first_name,
  last_name,
  avatar_url,
  bio,
  role,
  active_mode,
  created_at
FROM public.profiles;
