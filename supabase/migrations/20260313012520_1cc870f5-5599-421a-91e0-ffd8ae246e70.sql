
-- Auto-assign manager_id when management_group_id is set to Boston Brokerage Group
-- This uses the BBG demo user as the manager
CREATE OR REPLACE FUNCTION public.assign_manager_from_group()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_bbg_pm_id uuid := 'd39b883c-0941-4620-96d6-ea588231b58e';
  v_bbg_user_id uuid := '370d6445-15bc-4802-8626-1507c38fbdd4';
BEGIN
  -- If management_group_id is set to BBG, assign manager_id to BBG staff user
  IF NEW.management_group_id = v_bbg_pm_id AND (NEW.manager_id IS NULL OR NEW.manager_id != v_bbg_user_id) THEN
    NEW.manager_id := v_bbg_user_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER assign_manager_on_listing
  BEFORE INSERT OR UPDATE ON public.listings
  FOR EACH ROW
  EXECUTE FUNCTION public.assign_manager_from_group();
