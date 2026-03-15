
-- Create knocks table
CREATE TABLE public.knocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  knocker_id uuid NOT NULL,
  tenant_id uuid NOT NULL,
  conversation_id uuid REFERENCES public.conversations(id),
  responded boolean NOT NULL DEFAULT false,
  dismissed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(listing_id, knocker_id)
);

-- Add knock_count to listings
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS knock_count integer NOT NULL DEFAULT 0;

-- Enable RLS
ALTER TABLE public.knocks ENABLE ROW LEVEL SECURITY;

-- Knockers can insert their own knocks
CREATE POLICY "Users can insert own knocks" ON public.knocks
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = knocker_id);

-- Knockers can view their own knocks
CREATE POLICY "Users can view own knocks" ON public.knocks
  FOR SELECT TO authenticated
  USING (auth.uid() = knocker_id);

-- Listing owners can view knocks on their listings
CREATE POLICY "Tenants can view knocks on their listings" ON public.knocks
  FOR SELECT TO authenticated
  USING (auth.uid() = tenant_id);

-- Listing owners can update knocks (dismiss, mark responded)
CREATE POLICY "Tenants can update knocks on their listings" ON public.knocks
  FOR UPDATE TO authenticated
  USING (auth.uid() = tenant_id);

-- Trigger to increment knock_count
CREATE OR REPLACE FUNCTION public.increment_knock_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.listings SET knock_count = knock_count + 1 WHERE id = NEW.listing_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_knock_insert
  AFTER INSERT ON public.knocks
  FOR EACH ROW
  EXECUTE FUNCTION public.increment_knock_count();

-- Enable realtime for knocks
ALTER PUBLICATION supabase_realtime ADD TABLE public.knocks;
