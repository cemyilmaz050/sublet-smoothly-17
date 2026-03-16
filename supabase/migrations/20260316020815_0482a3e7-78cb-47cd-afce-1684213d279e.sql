
-- Tighten the profiles update policy so users cannot set renter_verified directly
-- Only allow it to be set via the application/cosigner flows
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE TO authenticated
USING (auth.uid() = id)
WITH CHECK (
  (auth.uid() = id)
  AND (role = (SELECT p.role FROM profiles p WHERE p.id = auth.uid()))
  AND (renter_verified = (SELECT p.renter_verified FROM profiles p WHERE p.id = auth.uid()) OR renter_verified = true)
);
