CREATE POLICY "Managers can update managed listings"
ON public.listings
FOR UPDATE
TO authenticated
USING (manager_id = auth.uid())
WITH CHECK (manager_id = auth.uid());