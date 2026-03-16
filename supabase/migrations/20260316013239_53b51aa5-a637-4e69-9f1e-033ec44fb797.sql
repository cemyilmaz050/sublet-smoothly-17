
DROP POLICY IF EXISTS "Subtenants can update own bookings" ON public.bookings;
CREATE POLICY "Subtenants can update own bookings"
ON public.bookings
FOR UPDATE
TO authenticated
USING (subtenant_id = auth.uid())
WITH CHECK (
  subtenant_id = auth.uid()
  AND status IN ('pending', 'cancelled')
  AND total_paid = (SELECT b2.total_paid FROM public.bookings b2 WHERE b2.id = bookings.id)
  AND platform_fee = (SELECT b3.platform_fee FROM public.bookings b3 WHERE b3.id = bookings.id)
  AND deposit_amount = (SELECT b4.deposit_amount FROM public.bookings b4 WHERE b4.id = bookings.id)
  AND stripe_payment_intent_id IS NOT DISTINCT FROM (SELECT b5.stripe_payment_intent_id FROM public.bookings b5 WHERE b5.id = bookings.id)
  AND stripe_checkout_session_id IS NOT DISTINCT FROM (SELECT b6.stripe_checkout_session_id FROM public.bookings b6 WHERE b6.id = bookings.id)
);
