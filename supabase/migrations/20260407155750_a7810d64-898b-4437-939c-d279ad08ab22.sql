
-- Add tracking columns to listings
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS offers_count integer NOT NULL DEFAULT 0;
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS last_offer_amount integer;

-- Create offer_notifications table
CREATE TABLE public.offer_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id uuid NOT NULL REFERENCES public.offers(id) ON DELETE CASCADE,
  recipient_id uuid NOT NULL,
  type text NOT NULL DEFAULT 'new_offer',
  read boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.offer_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own offer notifications"
  ON public.offer_notifications FOR SELECT
  TO authenticated
  USING (auth.uid() = recipient_id);

CREATE POLICY "Users can update own offer notifications"
  ON public.offer_notifications FOR UPDATE
  TO authenticated
  USING (auth.uid() = recipient_id);

CREATE POLICY "Authenticated can insert offer notifications"
  ON public.offer_notifications FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Trigger to auto-update listing offer stats on new offer
CREATE OR REPLACE FUNCTION public.update_listing_offer_stats()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.listings
  SET offers_count = offers_count + 1,
      last_offer_amount = NEW.offer_amount
  WHERE id = NEW.listing_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_new_offer_update_stats
  AFTER INSERT ON public.offers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_listing_offer_stats();
