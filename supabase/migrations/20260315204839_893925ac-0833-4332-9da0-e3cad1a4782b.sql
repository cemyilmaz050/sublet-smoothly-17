ALTER TYPE public.listing_status ADD VALUE IF NOT EXISTS 'paused';
ALTER TYPE public.listing_status ADD VALUE IF NOT EXISTS 'deleted';