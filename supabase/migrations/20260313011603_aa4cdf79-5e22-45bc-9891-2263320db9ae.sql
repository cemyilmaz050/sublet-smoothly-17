
-- Background checks table for persisting check records
CREATE TABLE public.background_checks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  applicant_id UUID NOT NULL,
  reviewer_id UUID NOT NULL,
  identity_verified BOOLEAN DEFAULT false,
  rental_history_verified BOOLEAN DEFAULT false,
  employment_verified BOOLEAN DEFAULT false,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'in_progress',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(application_id)
);

-- Enable RLS
ALTER TABLE public.background_checks ENABLE ROW LEVEL SECURITY;

-- Managers can insert background checks for their listings' applications
CREATE POLICY "Managers can insert background checks"
  ON public.background_checks FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = reviewer_id AND
    EXISTS (
      SELECT 1 FROM applications a
      JOIN listings l ON l.id = a.listing_id
      WHERE a.id = background_checks.application_id
      AND (l.manager_id = auth.uid() OR l.tenant_id = auth.uid())
    )
  );

-- Managers can view background checks for their listings
CREATE POLICY "Managers can view background checks"
  ON public.background_checks FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM applications a
      JOIN listings l ON l.id = a.listing_id
      WHERE a.id = background_checks.application_id
      AND (l.manager_id = auth.uid() OR l.tenant_id = auth.uid())
    )
  );

-- Managers can update background checks they created
CREATE POLICY "Managers can update background checks"
  ON public.background_checks FOR UPDATE TO authenticated
  USING (auth.uid() = reviewer_id);

-- Trigger for updated_at
CREATE TRIGGER update_background_checks_updated_at
  BEFORE UPDATE ON public.background_checks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
