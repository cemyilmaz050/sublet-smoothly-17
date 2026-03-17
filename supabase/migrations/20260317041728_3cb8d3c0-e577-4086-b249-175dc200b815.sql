
-- Add pending_email column to listings for pre-signup listing creation
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS pending_email text DEFAULT NULL;

-- Create index for fast lookup on pending_email
CREATE INDEX IF NOT EXISTS idx_listings_pending_email ON public.listings(pending_email) WHERE pending_email IS NOT NULL;

-- Update handle_new_user to auto-attach pending listings when a user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, first_name, last_name, phone, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    'tenant'
  );

  -- Auto-attach any pending listings created by admin for this email
  UPDATE public.listings
  SET tenant_id = NEW.id,
      pending_email = NULL,
      updated_at = now()
  WHERE pending_email = lower(NEW.email)
    AND pending_email IS NOT NULL;

  RETURN NEW;
END;
$function$;
