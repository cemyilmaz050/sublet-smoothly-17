
CREATE TABLE public.manager_invitations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  company_name TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  property_address TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.manager_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenants can insert own invitations"
  ON public.manager_invitations
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = tenant_id);

CREATE POLICY "Tenants can view own invitations"
  ON public.manager_invitations
  FOR SELECT
  TO authenticated
  USING (auth.uid() = tenant_id);
