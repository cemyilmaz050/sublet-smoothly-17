
-- Fix: Remove the OR (renter_verified = true) bypass from profiles UPDATE policy
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (
  (auth.uid() = id)
  AND (role = (SELECT p.role FROM profiles p WHERE p.id = auth.uid()))
  AND (renter_verified = (SELECT p.renter_verified FROM profiles p WHERE p.id = auth.uid()))
);
