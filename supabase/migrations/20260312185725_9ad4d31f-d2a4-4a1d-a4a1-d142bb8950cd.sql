
-- Add onboarding fields to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS onboarding_complete boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS documents_status text NOT NULL DEFAULT 'not_started';

-- Create tenant_documents table
CREATE TABLE public.tenant_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  document_type text NOT NULL,
  file_url text NOT NULL,
  file_name text NOT NULL,
  file_size bigint,
  status text NOT NULL DEFAULT 'pending',
  review_comment text,
  uploaded_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.tenant_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenants can insert own documents" ON public.tenant_documents
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = tenant_id);

CREATE POLICY "Tenants can view own documents" ON public.tenant_documents
  FOR SELECT TO authenticated USING (auth.uid() = tenant_id);

CREATE POLICY "Tenants can update own documents" ON public.tenant_documents
  FOR UPDATE TO authenticated USING (auth.uid() = tenant_id);

CREATE POLICY "Tenants can delete own documents" ON public.tenant_documents
  FOR DELETE TO authenticated USING (auth.uid() = tenant_id);

-- Managers can view tenant documents (via sublet_requests relationship)
CREATE POLICY "Managers can view tenant documents" ON public.tenant_documents
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.sublet_requests sr
      WHERE sr.tenant_id = tenant_documents.tenant_id AND sr.manager_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'manager'
    )
  );

CREATE POLICY "Managers can update tenant documents" ON public.tenant_documents
  FOR UPDATE TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'manager'
    )
  );

-- Create cosigners table
CREATE TABLE public.cosigners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  relationship text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  address text,
  employment_status text,
  monthly_income numeric,
  document_url text,
  confirmation_status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.cosigners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenants can insert own cosigners" ON public.cosigners
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = tenant_id);

CREATE POLICY "Tenants can view own cosigners" ON public.cosigners
  FOR SELECT TO authenticated USING (auth.uid() = tenant_id);

CREATE POLICY "Managers can view cosigners" ON public.cosigners
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'manager'
    )
  );

CREATE POLICY "Managers can update cosigners" ON public.cosigners
  FOR UPDATE TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'manager'
    )
  );

-- Create storage bucket for tenant documents
INSERT INTO storage.buckets (id, name, public) VALUES ('tenant-documents', 'tenant-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for tenant-documents bucket
CREATE POLICY "Tenants can upload own documents" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (
    bucket_id = 'tenant-documents' AND 
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Tenants can view own documents storage" ON storage.objects
  FOR SELECT TO authenticated USING (
    bucket_id = 'tenant-documents' AND 
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Tenants can delete own documents storage" ON storage.objects
  FOR DELETE TO authenticated USING (
    bucket_id = 'tenant-documents' AND 
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Managers can view tenant documents storage" ON storage.objects
  FOR SELECT TO authenticated USING (
    bucket_id = 'tenant-documents' AND
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'manager'
    )
  );
