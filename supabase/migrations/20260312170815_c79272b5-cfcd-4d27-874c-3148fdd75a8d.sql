
-- Fix function search path
ALTER FUNCTION public.update_updated_at() SET search_path = public;

-- Fix permissive notification insert policy - restrict to inserting for valid users
DROP POLICY "Authenticated users can insert notifications" ON public.notifications;
CREATE POLICY "Authenticated users can insert notifications"
  ON public.notifications FOR INSERT TO authenticated
  WITH CHECK (user_id IS NOT NULL);
