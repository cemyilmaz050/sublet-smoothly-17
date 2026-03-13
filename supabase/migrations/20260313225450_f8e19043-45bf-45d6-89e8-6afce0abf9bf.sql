
-- 1. Create a public view with only non-sensitive fields
CREATE VIEW public.profiles_public
WITH (security_invoker = on) AS
SELECT id, first_name, last_name, avatar_url, bio, role, active_mode, created_at
FROM public.profiles;

-- 2. Drop overly permissive SELECT policies
DROP POLICY IF EXISTS "Anonymous can read basic profiles" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can read basic profiles" ON public.profiles;

-- 3. Keep the existing "Users can read own profile" policy (already scoped to auth.uid() = id)
-- It already exists, so no changes needed there.
