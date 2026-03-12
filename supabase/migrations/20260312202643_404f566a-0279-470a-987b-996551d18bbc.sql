
-- Add new columns to listings
ALTER TABLE public.listings 
  ADD COLUMN IF NOT EXISTS published_at timestamptz,
  ADD COLUMN IF NOT EXISTS view_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS save_count integer NOT NULL DEFAULT 0;

-- Create listing_views table
CREATE TABLE public.listing_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  viewer_id uuid NOT NULL,
  viewed_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.listing_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert views" ON public.listing_views
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = viewer_id);

CREATE POLICY "Listing owners can read views" ON public.listing_views
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.listings l WHERE l.id = listing_id AND l.tenant_id = auth.uid()
  ));

-- Create saved_listings table
CREATE TABLE public.saved_listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  listing_id uuid NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  saved_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, listing_id)
);

ALTER TABLE public.saved_listings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own saves" ON public.saved_listings
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read own saves" ON public.saved_listings
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own saves" ON public.saved_listings
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Function to increment view count
CREATE OR REPLACE FUNCTION public.increment_view_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.listings SET view_count = view_count + 1 WHERE id = NEW.listing_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_listing_view_insert
  AFTER INSERT ON public.listing_views
  FOR EACH ROW EXECUTE FUNCTION public.increment_view_count();

-- Function to update save count
CREATE OR REPLACE FUNCTION public.update_save_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.listings SET save_count = save_count + 1 WHERE id = NEW.listing_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.listings SET save_count = save_count - 1 WHERE id = OLD.listing_id;
    RETURN OLD;
  END IF;
END;
$$;

CREATE TRIGGER on_saved_listing_change
  AFTER INSERT OR DELETE ON public.saved_listings
  FOR EACH ROW EXECUTE FUNCTION public.update_save_count();
