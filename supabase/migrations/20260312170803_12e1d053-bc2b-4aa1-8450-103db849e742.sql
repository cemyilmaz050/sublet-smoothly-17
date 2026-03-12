
-- Create listing status enum
CREATE TYPE public.listing_status AS ENUM ('draft', 'pending', 'active', 'expired', 'rejected');

-- Create guest policy enum
CREATE TYPE public.guest_policy AS ENUM ('no_guests', 'occasional_guests', 'guests_allowed');

-- Create property type enum
CREATE TYPE public.property_type AS ENUM ('apartment', 'condo', 'studio', 'house');

-- Create listings table
CREATE TABLE public.listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  address text,
  unit_number text,
  property_type public.property_type,
  bedrooms integer,
  bathrooms integer,
  sqft integer,
  headline text,
  description text,
  monthly_rent numeric,
  security_deposit numeric,
  available_from date,
  available_until date,
  min_duration integer,
  amenities text[] DEFAULT '{}',
  house_rules text,
  guest_policy public.guest_policy,
  photos text[] DEFAULT '{}',
  status public.listing_status NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;

-- Tenants can CRUD their own listings
CREATE POLICY "Tenants can read own listings"
  ON public.listings FOR SELECT TO authenticated
  USING (auth.uid() = tenant_id);

CREATE POLICY "Tenants can insert own listings"
  ON public.listings FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = tenant_id);

CREATE POLICY "Tenants can update own listings"
  ON public.listings FOR UPDATE TO authenticated
  USING (auth.uid() = tenant_id)
  WITH CHECK (auth.uid() = tenant_id);

CREATE POLICY "Tenants can delete own listings"
  ON public.listings FOR DELETE TO authenticated
  USING (auth.uid() = tenant_id);

-- Anyone authenticated can view active listings (for browsing)
CREATE POLICY "Anyone can view active listings"
  ON public.listings FOR SELECT TO authenticated
  USING (status = 'active');

-- Create notifications table
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL DEFAULT 'info',
  read boolean NOT NULL DEFAULT false,
  link text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own notifications"
  ON public.notifications FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

-- Allow authenticated users to insert notifications (for cross-user notifications)
CREATE POLICY "Authenticated users can insert notifications"
  ON public.notifications FOR INSERT TO authenticated
  WITH CHECK (true);

-- Create storage bucket for listing photos
INSERT INTO storage.buckets (id, name, public) VALUES ('listing-photos', 'listing-photos', true);

-- Storage policies for listing photos
CREATE POLICY "Authenticated users can upload listing photos"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'listing-photos');

CREATE POLICY "Anyone can view listing photos"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'listing-photos');

CREATE POLICY "Users can delete own listing photos"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'listing-photos');

-- Add updated_at trigger for listings
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER listings_updated_at
  BEFORE UPDATE ON public.listings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
