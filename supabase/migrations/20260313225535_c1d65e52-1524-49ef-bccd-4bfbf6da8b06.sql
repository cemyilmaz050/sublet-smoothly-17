
-- Remove the broad policy we just added
DROP POLICY IF EXISTS "Authenticated can read profiles for view" ON public.profiles;

-- Drop and recreate the view WITHOUT security_invoker (defaults to security_definer behavior)
-- This means the view runs as the owner, bypassing RLS, but only exposes safe columns
DROP VIEW IF EXISTS public.profiles_public;

CREATE VIEW public.profiles_public AS
SELECT id, first_name, last_name, avatar_url, bio, role, active_mode, created_at
FROM public.profiles;

-- Grant access to the view
GRANT SELECT ON public.profiles_public TO authenticated;
GRANT SELECT ON public.profiles_public TO anon;
