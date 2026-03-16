
-- Security definer function to check if user has a BBG email domain
CREATE OR REPLACE FUNCTION public.is_bbg_staff(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM auth.users u
    JOIN public.profiles p ON p.id = u.id
    WHERE u.id = _user_id
      AND p.role = 'manager'
      AND u.email ILIKE '%@bostonbrokerage.com'
  )
$$;
