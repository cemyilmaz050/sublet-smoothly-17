
-- Renter applications table (Step 2 of verification)
CREATE TABLE public.renter_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  renter_id uuid NOT NULL,
  full_name text NOT NULL,
  current_address text NOT NULL,
  university_or_employer text NOT NULL,
  reason_for_subletting text NOT NULL,
  intended_start_date date NOT NULL,
  intended_end_date date NOT NULL,
  income_or_funding text NOT NULL,
  emergency_contact_name text NOT NULL,
  emergency_contact_phone text NOT NULL,
  has_pets boolean NOT NULL DEFAULT false,
  pet_details text,
  prior_evictions boolean NOT NULL DEFAULT false,
  eviction_details text,
  status text NOT NULL DEFAULT 'submitted',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (renter_id)
);

ALTER TABLE public.renter_applications ENABLE ROW LEVEL SECURITY;

-- Renters can insert their own application
CREATE POLICY "Renters can insert own application"
ON public.renter_applications FOR INSERT TO authenticated
WITH CHECK (auth.uid() = renter_id);

-- Renters can view their own application
CREATE POLICY "Renters can view own application"
ON public.renter_applications FOR SELECT TO authenticated
USING (auth.uid() = renter_id);

-- Renters can update their own application
CREATE POLICY "Renters can update own application"
ON public.renter_applications FOR UPDATE TO authenticated
USING (auth.uid() = renter_id);

-- Listing owners and managers can view renter applications for applicants on their listings
CREATE POLICY "Listing owners can view renter applications"
ON public.renter_applications FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.applications a
    JOIN public.listings l ON l.id = a.listing_id
    WHERE a.applicant_id = renter_applications.renter_id
      AND (l.tenant_id = auth.uid() OR l.manager_id = auth.uid())
  )
);

-- Managers can also view via knocks
CREATE POLICY "Hosts can view renter apps via knocks"
ON public.renter_applications FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.knocks k
    JOIN public.listings l ON l.id = k.listing_id
    WHERE k.knocker_id = renter_applications.renter_id
      AND (l.tenant_id = auth.uid() OR l.manager_id = auth.uid())
  )
);

-- Add renter_verified flag to profiles for quick lookups
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS renter_verified boolean NOT NULL DEFAULT false;

-- Add application_complete flag
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS application_complete boolean NOT NULL DEFAULT false;

-- Add cosigner_confirmed flag  
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS cosigner_confirmed boolean NOT NULL DEFAULT false;

-- Trigger to auto-update updated_at
CREATE TRIGGER update_renter_applications_updated_at
  BEFORE UPDATE ON public.renter_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();
