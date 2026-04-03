
-- Add urgent fields to listings table
ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS is_urgent boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS asking_price integer,
  ADD COLUMN IF NOT EXISTS minimum_price integer,
  ADD COLUMN IF NOT EXISTS urgency_deadline timestamp with time zone,
  ADD COLUMN IF NOT EXISTS urgency_reason text;

-- Create offers table
CREATE TABLE public.offers (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id uuid NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  subtenant_id uuid NOT NULL,
  offer_amount integer NOT NULL,
  asking_amount integer NOT NULL,
  message text,
  move_in_date date,
  duration_months integer NOT NULL DEFAULT 1,
  status text NOT NULL DEFAULT 'pending',
  round integer NOT NULL DEFAULT 1,
  expires_at timestamp with time zone NOT NULL DEFAULT (now() + interval '24 hours'),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;

-- Subtenants can create their own offers
CREATE POLICY "Subtenants can insert own offers" ON public.offers
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = subtenant_id);

-- Subtenants can view their own offers
CREATE POLICY "Subtenants can view own offers" ON public.offers
FOR SELECT TO authenticated
USING (auth.uid() = subtenant_id);

-- Subtenants can update own pending offers
CREATE POLICY "Subtenants can update own offers" ON public.offers
FOR UPDATE TO authenticated
USING (auth.uid() = subtenant_id AND status IN ('pending', 'countered'));

-- Listing owners can view offers on their listings
CREATE POLICY "Tenants can view offers on their listings" ON public.offers
FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.listings l
  WHERE l.id = offers.listing_id AND (l.tenant_id = auth.uid() OR l.manager_id = auth.uid())
));

-- Listing owners can update offers (accept/decline/counter)
CREATE POLICY "Tenants can update offers on their listings" ON public.offers
FOR UPDATE TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.listings l
  WHERE l.id = offers.listing_id AND (l.tenant_id = auth.uid() OR l.manager_id = auth.uid())
));

-- Create counter_offers table
CREATE TABLE public.counter_offers (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  offer_id uuid NOT NULL REFERENCES public.offers(id) ON DELETE CASCADE,
  made_by uuid NOT NULL,
  amount integer NOT NULL,
  message text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.counter_offers ENABLE ROW LEVEL SECURITY;

-- Participants can view counter-offers for their offers
CREATE POLICY "Offer participants can view counter offers" ON public.counter_offers
FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.offers o
  WHERE o.id = counter_offers.offer_id
    AND (o.subtenant_id = auth.uid() OR EXISTS (
      SELECT 1 FROM public.listings l WHERE l.id = o.listing_id AND (l.tenant_id = auth.uid() OR l.manager_id = auth.uid())
    ))
));

-- Participants can insert counter-offers
CREATE POLICY "Offer participants can insert counter offers" ON public.counter_offers
FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = made_by
  AND EXISTS (
    SELECT 1 FROM public.offers o
    WHERE o.id = counter_offers.offer_id
      AND (o.subtenant_id = auth.uid() OR EXISTS (
        SELECT 1 FROM public.listings l WHERE l.id = o.listing_id AND (l.tenant_id = auth.uid() OR l.manager_id = auth.uid())
      ))
  )
);

-- Create price_alerts table
CREATE TABLE public.price_alerts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  city text NOT NULL,
  max_budget integer NOT NULL,
  min_duration integer,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.price_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own price alerts" ON public.price_alerts
FOR ALL TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Add updated_at trigger for offers
CREATE TRIGGER update_offers_updated_at
BEFORE UPDATE ON public.offers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();

-- Enable realtime for offers so tenants see new offers instantly
ALTER PUBLICATION supabase_realtime ADD TABLE public.offers;
