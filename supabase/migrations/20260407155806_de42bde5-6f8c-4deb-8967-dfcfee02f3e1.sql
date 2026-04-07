
DROP POLICY "Authenticated can insert offer notifications" ON public.offer_notifications;

CREATE POLICY "Offer participants can insert notifications"
  ON public.offer_notifications FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.offers o
      WHERE o.id = offer_notifications.offer_id
      AND (
        o.subtenant_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.listings l
          WHERE l.id = o.listing_id
          AND (l.tenant_id = auth.uid() OR l.manager_id = auth.uid())
        )
      )
    )
  );
