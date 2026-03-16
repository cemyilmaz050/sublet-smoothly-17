
DROP POLICY IF EXISTS "Users can insert conversations" ON public.conversations;
CREATE POLICY "Users can insert conversations"
ON public.conversations
FOR INSERT
TO authenticated
WITH CHECK (
  (auth.uid() = participant_1 OR auth.uid() = participant_2)
  AND (
    -- Knock relationship exists
    EXISTS (
      SELECT 1 FROM public.knocks k
      WHERE k.listing_id = conversations.listing_id
        AND (
          (k.knocker_id = participant_1 AND k.tenant_id = participant_2)
          OR (k.knocker_id = participant_2 AND k.tenant_id = participant_1)
        )
    )
    -- Or booking relationship exists
    OR EXISTS (
      SELECT 1 FROM public.bookings b
      WHERE b.listing_id = conversations.listing_id
        AND (
          (b.subtenant_id = participant_1 AND b.tenant_id = participant_2)
          OR (b.subtenant_id = participant_2 AND b.tenant_id = participant_1)
        )
    )
    -- Or application relationship exists
    OR EXISTS (
      SELECT 1 FROM public.applications a
      JOIN public.listings l ON l.id = a.listing_id
      WHERE a.listing_id = conversations.listing_id
        AND (
          (a.applicant_id = participant_1 AND l.tenant_id = participant_2)
          OR (a.applicant_id = participant_2 AND l.tenant_id = participant_1)
        )
    )
  )
);
