
-- Table for BMG Sublet Application submissions
CREATE TABLE public.bbg_sublet_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid REFERENCES public.listings(id) ON DELETE SET NULL,
  applicant_id uuid NOT NULL,
  
  -- Personal Info
  full_name text,
  ssn_encrypted text,
  phone text,
  email text,
  current_address text,
  current_city text,
  current_state text,
  current_zip text,
  previous_address text,
  previous_city text,
  previous_state text,
  previous_zip text,
  
  -- Landlord Info
  current_landlord_name text,
  current_landlord_phone text,
  prior_landlord_name text,
  dates_of_occupancy text,
  
  -- Employment
  occupation text,
  employer text,
  employer_contact text,
  length_of_employment text,
  salary text,
  
  -- Co-signer
  cosigner_name text,
  cosigner_address text,
  cosigner_phone text,
  cosigner_email text,
  
  -- Sublet Details
  rental_address text,
  rental_unit text,
  rental_city text,
  term_months integer,
  move_in_date date,
  move_out_date date,
  total_tenants integer,
  number_of_pets integer DEFAULT 0,
  apartment_size text,
  co_tenant_names text,
  
  -- Criminal
  is_convicted_felon boolean DEFAULT false,
  felony_details text,
  
  -- Financial
  first_month_rent numeric,
  processing_fee numeric DEFAULT 65,
  last_month_rent numeric,
  security_deposit numeric,
  sublet_fee numeric,
  balance_due numeric,
  
  -- Signature
  signature_text text,
  signed_at timestamptz,
  
  -- Status
  status text NOT NULL DEFAULT 'not_started',
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.bbg_sublet_applications ENABLE ROW LEVEL SECURITY;

-- Table for BBG Guaranty of Lease submissions
CREATE TABLE public.bbg_guaranty_of_lease (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid REFERENCES public.listings(id) ON DELETE SET NULL,
  applicant_id uuid NOT NULL,
  
  -- Occupant/lessee info
  lessee_name text,
  
  -- Property (auto-filled)
  premises_address text,
  premises_unit text,
  premises_city text,
  
  -- Guarantor Info
  guarantor_name text,
  guarantor_dob date,
  guarantor_address text,
  guarantor_phone text,
  guarantor_email text,
  guarantor_ssn_encrypted text,
  guarantor_annual_income text,
  agent_name text DEFAULT 'Alp Kantar',
  
  -- Notary
  notary_state text,
  notary_county text,
  notary_date date,
  notary_person_name text,
  
  -- Signature
  guarantor_signature_text text,
  signed_at timestamptz,
  
  -- Status
  status text NOT NULL DEFAULT 'not_started',
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.bbg_guaranty_of_lease ENABLE ROW LEVEL SECURITY;

-- Document packages tracker (links applicant to listing for overall tracking)
CREATE TABLE public.bbg_document_packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid REFERENCES public.listings(id) ON DELETE SET NULL,
  applicant_id uuid NOT NULL,
  application_id uuid REFERENCES public.bbg_sublet_applications(id) ON DELETE SET NULL,
  guaranty_id uuid REFERENCES public.bbg_guaranty_of_lease(id) ON DELETE SET NULL,
  overall_status text NOT NULL DEFAULT 'not_sent',
  sent_at timestamptz,
  reminder_sent_at timestamptz,
  manager_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.bbg_document_packages ENABLE ROW LEVEL SECURITY;

-- Document access log for audit
CREATE TABLE public.bbg_document_access_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_type text NOT NULL,
  document_id uuid NOT NULL,
  accessed_by uuid NOT NULL,
  action text NOT NULL DEFAULT 'view',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.bbg_document_access_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies for bbg_sublet_applications
CREATE POLICY "Applicants can view own applications"
  ON public.bbg_sublet_applications FOR SELECT
  TO authenticated
  USING (auth.uid() = applicant_id);

CREATE POLICY "Applicants can insert own applications"
  ON public.bbg_sublet_applications FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = applicant_id);

CREATE POLICY "Applicants can update own applications"
  ON public.bbg_sublet_applications FOR UPDATE
  TO authenticated
  USING (auth.uid() = applicant_id);

CREATE POLICY "BBG staff can view all applications"
  ON public.bbg_sublet_applications FOR SELECT
  TO authenticated
  USING (is_bbg_staff(auth.uid()));

CREATE POLICY "BBG staff can update applications"
  ON public.bbg_sublet_applications FOR UPDATE
  TO authenticated
  USING (is_bbg_staff(auth.uid()));

-- RLS Policies for bbg_guaranty_of_lease
CREATE POLICY "Applicants can view own guaranty"
  ON public.bbg_guaranty_of_lease FOR SELECT
  TO authenticated
  USING (auth.uid() = applicant_id);

CREATE POLICY "Applicants can insert own guaranty"
  ON public.bbg_guaranty_of_lease FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = applicant_id);

CREATE POLICY "Applicants can update own guaranty"
  ON public.bbg_guaranty_of_lease FOR UPDATE
  TO authenticated
  USING (auth.uid() = applicant_id);

CREATE POLICY "BBG staff can view all guaranty"
  ON public.bbg_guaranty_of_lease FOR SELECT
  TO authenticated
  USING (is_bbg_staff(auth.uid()));

CREATE POLICY "BBG staff can update guaranty"
  ON public.bbg_guaranty_of_lease FOR UPDATE
  TO authenticated
  USING (is_bbg_staff(auth.uid()));

-- RLS Policies for bbg_document_packages
CREATE POLICY "Applicants can view own packages"
  ON public.bbg_document_packages FOR SELECT
  TO authenticated
  USING (auth.uid() = applicant_id);

CREATE POLICY "Applicants can update own packages"
  ON public.bbg_document_packages FOR UPDATE
  TO authenticated
  USING (auth.uid() = applicant_id);

CREATE POLICY "BBG staff can view all packages"
  ON public.bbg_document_packages FOR SELECT
  TO authenticated
  USING (is_bbg_staff(auth.uid()));

CREATE POLICY "BBG staff can insert packages"
  ON public.bbg_document_packages FOR INSERT
  TO authenticated
  WITH CHECK (is_bbg_staff(auth.uid()));

CREATE POLICY "BBG staff can update packages"
  ON public.bbg_document_packages FOR UPDATE
  TO authenticated
  USING (is_bbg_staff(auth.uid()));

-- RLS for access log (service/staff only)
CREATE POLICY "BBG staff can view access log"
  ON public.bbg_document_access_log FOR SELECT
  TO authenticated
  USING (is_bbg_staff(auth.uid()));

CREATE POLICY "Authenticated users can insert access log"
  ON public.bbg_document_access_log FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = accessed_by);

-- Triggers for updated_at
CREATE TRIGGER update_bbg_sublet_applications_updated_at
  BEFORE UPDATE ON public.bbg_sublet_applications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_bbg_guaranty_updated_at
  BEFORE UPDATE ON public.bbg_guaranty_of_lease
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_bbg_packages_updated_at
  BEFORE UPDATE ON public.bbg_document_packages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
