
-- Recreate view with documents_status included (not PII, just a status field)
DROP VIEW IF EXISTS public.profiles_public;

CREATE VIEW public.profiles_public AS
SELECT id, first_name, last_name, avatar_url, bio, role, active_mode, documents_status, created_at
FROM public.profiles;

GRANT SELECT ON public.profiles_public TO authenticated;
GRANT SELECT ON public.profiles_public TO anon;
