
-- Fix: Subtenants should only be able to cancel their own bookings, not modify payment fields.
-- All other booking updates (confirming, refunding, etc.) happen server-side via edge functions with service role.

DROP POLICY IF EXISTS "Subtenants can update own bookings" ON public.bookings;
CREATE POLICY "Subtenants can update own bookings"
ON public.bookings
FOR UPDATE
TO authenticated
USING (subtenant_id = auth.uid())
WITH CHECK (
  subtenant_id = auth.uid()
  AND status IN ('pending', 'cancelled')
  AND total_paid = (SELECT total_paid FROM public.bookings WHERE id = bookings.id)
  AND platform_fee = (SELECT platform_fee FROM public.bookings WHERE id = bookings.id)
  AND deposit_amount = (SELECT deposit_amount FROM public.bookings WHERE id = bookings.id)
  AND stripe_payment_intent_id IS NOT DISTINCT FROM (SELECT stripe_payment_intent_id FROM public.bookings b2 WHERE b2.id = bookings.id)
  AND stripe_checkout_session_id IS NOT DISTINCT FROM (SELECT stripe_checkout_session_id FROM public.bookings b3 WHERE b3.id = bookings.id)
);
