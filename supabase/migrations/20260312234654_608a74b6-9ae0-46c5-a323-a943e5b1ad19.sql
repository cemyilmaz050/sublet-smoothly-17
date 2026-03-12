-- Allow anonymous users to view active listings
CREATE POLICY "Anyone can view active listings publicly"
ON public.listings
FOR SELECT
TO anon
USING (status = 'active'::listing_status);

-- Allow anonymous users to view profiles (for tenant names in listings)
CREATE POLICY "Anonymous can read basic profiles"
ON public.profiles
FOR SELECT
TO anon
USING (true);
