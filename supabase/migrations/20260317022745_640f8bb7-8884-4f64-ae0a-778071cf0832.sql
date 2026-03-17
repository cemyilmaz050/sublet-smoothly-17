
-- Fix 1: Hardcode 'tenant' role in handle_new_user trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (id, first_name, last_name, phone, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    'tenant'
  );
  RETURN NEW;
END;
$$;

-- Fix 1b: Defense-in-depth - restrict INSERT on profiles to role='tenant'
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id AND role = 'tenant');

-- Fix 4: Replace overly broad anon SELECT policy on friend_sublet_invites
DROP POLICY IF EXISTS "Anyone can view invite by token" ON public.friend_sublet_invites;

-- Fix 4b: Create secure RPC to look up invite by token
CREATE OR REPLACE FUNCTION public.get_invite_by_token(p_token text)
RETURNS SETOF public.friend_sublet_invites
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM friend_sublet_invites WHERE token = p_token LIMIT 1;
$$;

-- Fix 5: Replace broad sublet-documents storage SELECT policy
DROP POLICY IF EXISTS "Authenticated users can view docs" ON storage.objects;

-- Tenants can read their own docs (path: {tenant_id}/...)
CREATE POLICY "Tenants can view own sublet docs" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'sublet-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Managers can read docs for their assigned requests
CREATE POLICY "Managers can view assigned sublet docs" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'sublet-documents'
    AND EXISTS (
      SELECT 1 FROM sublet_requests sr
      WHERE sr.manager_id = auth.uid()
        AND (storage.foldername(name))[1] = sr.tenant_id::text
    )
  );
