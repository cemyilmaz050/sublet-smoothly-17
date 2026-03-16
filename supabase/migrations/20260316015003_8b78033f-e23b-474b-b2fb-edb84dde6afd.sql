
-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Anyone can view managers" ON public.property_managers;

-- Allow authenticated users to see only non-contact fields via the public view,
-- but restrict base table access to users with an active sublet_request relationship
CREATE POLICY "Managers can view own record"
ON public.property_managers
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.sublet_requests sr
    WHERE sr.manager_id = property_managers.id
      AND sr.tenant_id = auth.uid()
  )
);
