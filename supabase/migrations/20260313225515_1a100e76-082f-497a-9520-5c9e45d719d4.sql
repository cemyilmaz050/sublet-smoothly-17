
-- Allow authenticated users to read any profile row (the view restricts columns)
CREATE POLICY "Authenticated can read profiles for view"
ON public.profiles FOR SELECT
TO authenticated
USING (true);
