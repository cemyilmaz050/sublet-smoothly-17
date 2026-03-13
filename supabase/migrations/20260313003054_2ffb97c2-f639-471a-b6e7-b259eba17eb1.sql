-- Function to notify manager when a new application is submitted
CREATE OR REPLACE FUNCTION public.notify_manager_on_application()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_listing listings%ROWTYPE;
  v_applicant profiles%ROWTYPE;
  v_manager_id uuid;
BEGIN
  -- Get the listing
  SELECT * INTO v_listing FROM listings WHERE id = NEW.listing_id;
  IF NOT FOUND THEN RETURN NEW; END IF;

  -- Get the manager_id from the listing (could be null for tenant-only listings)
  v_manager_id := v_listing.manager_id;

  -- Get applicant profile
  SELECT * INTO v_applicant FROM profiles WHERE id = NEW.applicant_id;

  -- Notify the listing owner (tenant)
  INSERT INTO notifications (user_id, title, message, type, link)
  VALUES (
    v_listing.tenant_id,
    'New Application Received',
    COALESCE(v_applicant.first_name, '') || ' ' || COALESCE(v_applicant.last_name, 'Someone') || ' applied for ' || COALESCE(v_listing.headline, v_listing.address, 'your listing'),
    'application',
    '/dashboard/tenant'
  );

  -- Notify the property manager if one exists
  IF v_manager_id IS NOT NULL THEN
    INSERT INTO notifications (user_id, title, message, type, link)
    VALUES (
      v_manager_id,
      'New Application Received',
      COALESCE(v_applicant.first_name, '') || ' ' || COALESCE(v_applicant.last_name, 'Someone') || ' applied for ' || COALESCE(v_listing.headline, v_listing.address, 'a listing'),
      'application',
      '/dashboard/manager/applications'
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger
CREATE TRIGGER on_application_inserted
  AFTER INSERT ON applications
  FOR EACH ROW
  EXECUTE FUNCTION notify_manager_on_application();

-- Enable realtime on notifications table
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Allow managers to view applications for their listings
CREATE POLICY "Managers can view applications for their listings"
  ON applications FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM listings l
    WHERE l.id = applications.listing_id AND l.manager_id = auth.uid()
  ));

-- Allow managers to update applications for their listings
CREATE POLICY "Managers can update applications for their listings"
  ON applications FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM listings l
    WHERE l.id = applications.listing_id AND l.manager_id = auth.uid()
  ));