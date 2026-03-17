
-- Add a document notification trigger: when bbg_sublet_applications or bbg_guaranty_of_lease
-- status changes to 'completed', notify the BBG manager and update package status

CREATE OR REPLACE FUNCTION public.notify_bbg_on_document_complete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_bbg_user_id uuid := '370d6445-15bc-4802-8626-1507c38fbdd4';
  v_applicant_name text;
  v_property_address text;
  v_listing_id uuid;
  v_doc_type text;
BEGIN
  -- Only fire when status changes to completed
  IF NEW.status != 'completed' OR (OLD IS NOT NULL AND OLD.status = 'completed') THEN
    RETURN NEW;
  END IF;

  -- Determine doc type and listing_id
  IF TG_TABLE_NAME = 'bbg_sublet_applications' THEN
    v_doc_type := 'Sublet Application';
    v_listing_id := NEW.listing_id;
  ELSIF TG_TABLE_NAME = 'bbg_guaranty_of_lease' THEN
    v_doc_type := 'Guaranty of Lease';
    v_listing_id := NEW.listing_id;
  END IF;

  -- Get applicant name
  SELECT COALESCE(first_name, '') || ' ' || COALESCE(last_name, '')
  INTO v_applicant_name
  FROM profiles WHERE id = NEW.applicant_id;

  -- Get property address
  IF v_listing_id IS NOT NULL THEN
    SELECT COALESCE(address, 'Unknown property')
    INTO v_property_address
    FROM listings WHERE id = v_listing_id;
  ELSE
    v_property_address := 'Unknown property';
  END IF;

  -- Create notification for BBG manager
  INSERT INTO notifications (user_id, title, message, type, link)
  VALUES (
    v_bbg_user_id,
    'Document Completed',
    TRIM(v_applicant_name) || ' just completed their ' || v_doc_type || ' for ' || v_property_address || ' — view their documents now',
    'document',
    '/portal-mgmt-bbg/documents'
  );

  -- Auto-update package status
  IF TG_TABLE_NAME = 'bbg_sublet_applications' THEN
    UPDATE bbg_document_packages
    SET application_id = NEW.id,
        overall_status = CASE
          WHEN guaranty_id IS NOT NULL AND (SELECT status FROM bbg_guaranty_of_lease WHERE id = guaranty_id) = 'completed'
          THEN 'fully_complete'
          ELSE 'partially_complete'
        END,
        updated_at = now()
    WHERE applicant_id = NEW.applicant_id
      AND (listing_id = NEW.listing_id OR (listing_id IS NULL AND NEW.listing_id IS NULL));
  ELSIF TG_TABLE_NAME = 'bbg_guaranty_of_lease' THEN
    UPDATE bbg_document_packages
    SET guaranty_id = NEW.id,
        overall_status = CASE
          WHEN application_id IS NOT NULL AND (SELECT status FROM bbg_sublet_applications WHERE id = application_id) = 'completed'
          THEN 'fully_complete'
          ELSE 'partially_complete'
        END,
        updated_at = now()
    WHERE applicant_id = NEW.applicant_id
      AND (listing_id = NEW.listing_id OR (listing_id IS NULL AND NEW.listing_id IS NULL));
  END IF;

  RETURN NEW;
END;
$$;

-- Create triggers on both document tables
CREATE TRIGGER on_bbg_application_complete
  AFTER INSERT OR UPDATE ON public.bbg_sublet_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_bbg_on_document_complete();

CREATE TRIGGER on_bbg_guaranty_complete
  AFTER INSERT OR UPDATE ON public.bbg_guaranty_of_lease
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_bbg_on_document_complete();

-- Also auto-create a document package when a sub-lessee starts documents (if not exists)
CREATE OR REPLACE FUNCTION public.auto_create_bbg_package()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Create package if one doesn't exist for this applicant+listing
  INSERT INTO bbg_document_packages (applicant_id, listing_id, overall_status)
  VALUES (NEW.applicant_id, NEW.listing_id, 'in_progress')
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$;

-- Add unique constraint to prevent duplicate packages
ALTER TABLE public.bbg_document_packages
  ADD CONSTRAINT bbg_document_packages_applicant_listing_unique
  UNIQUE (applicant_id, listing_id);

CREATE TRIGGER auto_create_package_on_application
  AFTER INSERT ON public.bbg_sublet_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_create_bbg_package();

CREATE TRIGGER auto_create_package_on_guaranty
  AFTER INSERT ON public.bbg_guaranty_of_lease
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_create_bbg_package();
