
-- Fix: explicitly set the view to SECURITY INVOKER
ALTER VIEW public.profiles_public SET (security_invoker = on);
