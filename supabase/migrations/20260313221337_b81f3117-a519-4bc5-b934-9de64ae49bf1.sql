
-- Bookings table to track deposit payments
CREATE TABLE public.bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL,
  subtenant_id uuid NOT NULL,
  stripe_checkout_session_id text,
  stripe_payment_intent_id text,
  deposit_amount numeric NOT NULL,
  platform_fee numeric NOT NULL,
  total_paid numeric NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  refund_eligible_until timestamptz,
  refunded_at timestamptz,
  refund_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Both tenant and subtenant can view their bookings
CREATE POLICY "Tenants can view bookings for their listings" ON public.bookings
  FOR SELECT TO authenticated
  USING (tenant_id = auth.uid());

CREATE POLICY "Subtenants can view own bookings" ON public.bookings
  FOR SELECT TO authenticated
  USING (subtenant_id = auth.uid());

-- Only system (via edge functions) inserts bookings, but allow authenticated insert for checkout flow
CREATE POLICY "Authenticated users can create bookings" ON public.bookings
  FOR INSERT TO authenticated
  WITH CHECK (subtenant_id = auth.uid());

CREATE POLICY "Subtenants can update own bookings" ON public.bookings
  FOR UPDATE TO authenticated
  USING (subtenant_id = auth.uid());

-- Sublet agreements table
CREATE TABLE public.sublet_agreements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  listing_id uuid NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL,
  subtenant_id uuid NOT NULL,
  property_address text NOT NULL,
  unit_number text,
  start_date date NOT NULL,
  end_date date NOT NULL,
  monthly_rent numeric NOT NULL,
  deposit_amount numeric NOT NULL,
  tenant_name text NOT NULL,
  subtenant_name text NOT NULL,
  tenant_signed_at timestamptz,
  subtenant_signed_at timestamptz,
  status text NOT NULL DEFAULT 'pending_signatures',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.sublet_agreements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenants can view their agreements" ON public.sublet_agreements
  FOR SELECT TO authenticated
  USING (tenant_id = auth.uid());

CREATE POLICY "Subtenants can view their agreements" ON public.sublet_agreements
  FOR SELECT TO authenticated
  USING (subtenant_id = auth.uid());

CREATE POLICY "Tenants can update their agreements" ON public.sublet_agreements
  FOR UPDATE TO authenticated
  USING (tenant_id = auth.uid());

CREATE POLICY "Subtenants can update their agreements" ON public.sublet_agreements
  FOR UPDATE TO authenticated
  USING (subtenant_id = auth.uid());

-- Trigger to update updated_at
CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_agreements_updated_at
  BEFORE UPDATE ON public.sublet_agreements
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
