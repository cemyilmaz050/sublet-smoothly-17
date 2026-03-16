
-- 1. Fix privilege escalation: prevent users from changing their own role
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id AND role = (SELECT role FROM public.profiles WHERE id = auth.uid()));

-- 2. Scope cosigner policies to managers with a relationship via sublet_requests
DROP POLICY IF EXISTS "Managers can view cosigners" ON public.cosigners;
CREATE POLICY "Managers can view cosigners"
ON public.cosigners
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM sublet_requests sr
    WHERE sr.tenant_id = cosigners.tenant_id
      AND sr.manager_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Managers can update cosigners" ON public.cosigners;
CREATE POLICY "Managers can update cosigners"
ON public.cosigners
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM sublet_requests sr
    WHERE sr.tenant_id = cosigners.tenant_id
      AND sr.manager_id = auth.uid()
  )
);

-- 3. Recreate profiles_public view without SECURITY DEFINER
DROP VIEW IF EXISTS public.profiles_public;
CREATE VIEW public.profiles_public AS
SELECT
  id,
  first_name,
  last_name,
  avatar_url,
  bio,
  role,
  active_mode,
  documents_status,
  created_at
FROM public.profiles;
