
DROP POLICY IF EXISTS "Subtenants can update their agreements" ON public.sublet_agreements;
CREATE POLICY "Subtenants can update their agreements" ON public.sublet_agreements
FOR UPDATE TO authenticated
USING (subtenant_id = auth.uid())
WITH CHECK (
  subtenant_id = auth.uid()
  AND monthly_rent = (SELECT sa.monthly_rent FROM sublet_agreements sa WHERE sa.id = sublet_agreements.id)
  AND deposit_amount = (SELECT sa.deposit_amount FROM sublet_agreements sa WHERE sa.id = sublet_agreements.id)
  AND tenant_id = (SELECT sa.tenant_id FROM sublet_agreements sa WHERE sa.id = sublet_agreements.id)
  AND subtenant_id = (SELECT sa.subtenant_id FROM sublet_agreements sa WHERE sa.id = sublet_agreements.id)
  AND listing_id = (SELECT sa.listing_id FROM sublet_agreements sa WHERE sa.id = sublet_agreements.id)
  AND booking_id = (SELECT sa.booking_id FROM sublet_agreements sa WHERE sa.id = sublet_agreements.id)
  AND property_address = (SELECT sa.property_address FROM sublet_agreements sa WHERE sa.id = sublet_agreements.id)
  AND start_date = (SELECT sa.start_date FROM sublet_agreements sa WHERE sa.id = sublet_agreements.id)
  AND end_date = (SELECT sa.end_date FROM sublet_agreements sa WHERE sa.id = sublet_agreements.id)
);

DROP POLICY IF EXISTS "Tenants can update their agreements" ON public.sublet_agreements;
CREATE POLICY "Tenants can update their agreements" ON public.sublet_agreements
FOR UPDATE TO authenticated
USING (tenant_id = auth.uid())
WITH CHECK (
  tenant_id = auth.uid()
  AND monthly_rent = (SELECT sa.monthly_rent FROM sublet_agreements sa WHERE sa.id = sublet_agreements.id)
  AND deposit_amount = (SELECT sa.deposit_amount FROM sublet_agreements sa WHERE sa.id = sublet_agreements.id)
  AND tenant_id = (SELECT sa.tenant_id FROM sublet_agreements sa WHERE sa.id = sublet_agreements.id)
  AND subtenant_id = (SELECT sa.subtenant_id FROM sublet_agreements sa WHERE sa.id = sublet_agreements.id)
  AND listing_id = (SELECT sa.listing_id FROM sublet_agreements sa WHERE sa.id = sublet_agreements.id)
  AND booking_id = (SELECT sa.booking_id FROM sublet_agreements sa WHERE sa.id = sublet_agreements.id)
  AND property_address = (SELECT sa.property_address FROM sublet_agreements sa WHERE sa.id = sublet_agreements.id)
  AND start_date = (SELECT sa.start_date FROM sublet_agreements sa WHERE sa.id = sublet_agreements.id)
  AND end_date = (SELECT sa.end_date FROM sublet_agreements sa WHERE sa.id = sublet_agreements.id)
);
