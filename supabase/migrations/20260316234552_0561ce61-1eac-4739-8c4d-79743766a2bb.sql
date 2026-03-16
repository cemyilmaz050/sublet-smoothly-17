-- Fix: Revoke anonymous access to profiles_public view
REVOKE SELECT ON public.profiles_public FROM anon;