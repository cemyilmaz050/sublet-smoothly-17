CREATE POLICY "Authenticated users can read basic profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);