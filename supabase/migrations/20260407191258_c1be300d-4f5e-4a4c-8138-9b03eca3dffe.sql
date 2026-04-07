-- Validation trigger: force status back to draft if no photos when activating
CREATE OR REPLACE FUNCTION public.enforce_photos_on_active()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = 'public'
AS $$
BEGIN
  IF NEW.status = 'active' AND (NEW.photos IS NULL OR array_length(NEW.photos, 1) IS NULL OR array_length(NEW.photos, 1) = 0) THEN
    NEW.status := 'draft';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER enforce_listing_photos
BEFORE INSERT OR UPDATE ON public.listings
FOR EACH ROW
EXECUTE FUNCTION public.enforce_photos_on_active();