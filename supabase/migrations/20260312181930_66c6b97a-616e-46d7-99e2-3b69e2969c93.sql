
-- Create sublet_requests table
CREATE TABLE public.sublet_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  manager_id UUID NOT NULL,
  property_address TEXT NOT NULL,
  unit_number TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'more_info_needed')),
  rejection_reason TEXT,
  rejection_note TEXT,
  manager_message TEXT,
  max_sublet_duration INTEGER,
  additional_rules TEXT,
  co_approve_subtenant BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create request_documents table
CREATE TABLE public.request_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id UUID NOT NULL REFERENCES public.sublet_requests(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  review_comment TEXT,
  uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.sublet_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.request_documents ENABLE ROW LEVEL SECURITY;

-- RLS for sublet_requests
CREATE POLICY "Tenants can view own requests" ON public.sublet_requests
  FOR SELECT TO authenticated USING (auth.uid() = tenant_id);

CREATE POLICY "Tenants can insert own requests" ON public.sublet_requests
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = tenant_id);

CREATE POLICY "Tenants can update own requests" ON public.sublet_requests
  FOR UPDATE TO authenticated USING (auth.uid() = tenant_id);

CREATE POLICY "Managers can view assigned requests" ON public.sublet_requests
  FOR SELECT TO authenticated USING (auth.uid() = manager_id);

CREATE POLICY "Managers can update assigned requests" ON public.sublet_requests
  FOR UPDATE TO authenticated USING (auth.uid() = manager_id);

-- RLS for request_documents
CREATE POLICY "Tenants can view own docs" ON public.request_documents
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.sublet_requests sr WHERE sr.id = request_id AND sr.tenant_id = auth.uid())
  );

CREATE POLICY "Tenants can insert own docs" ON public.request_documents
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM public.sublet_requests sr WHERE sr.id = request_id AND sr.tenant_id = auth.uid())
  );

CREATE POLICY "Managers can view assigned docs" ON public.request_documents
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.sublet_requests sr WHERE sr.id = request_id AND sr.manager_id = auth.uid())
  );

CREATE POLICY "Managers can update assigned docs" ON public.request_documents
  FOR UPDATE TO authenticated USING (
    EXISTS (SELECT 1 FROM public.sublet_requests sr WHERE sr.id = request_id AND sr.manager_id = auth.uid())
  );

-- Updated_at trigger for sublet_requests
CREATE TRIGGER update_sublet_requests_updated_at
  BEFORE UPDATE ON public.sublet_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Storage bucket for sublet documents
INSERT INTO storage.buckets (id, name, public) VALUES ('sublet-documents', 'sublet-documents', false);

-- Storage RLS
CREATE POLICY "Tenants can upload docs" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'sublet-documents');

CREATE POLICY "Authenticated users can view docs" ON storage.objects
  FOR SELECT TO authenticated USING (bucket_id = 'sublet-documents');
