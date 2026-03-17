
-- Friend sublet invites table
CREATE TABLE public.friend_sublet_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  inviter_id uuid NOT NULL,
  friend_email text NOT NULL,
  friend_name text,
  listing_id uuid REFERENCES public.listings(id) ON DELETE CASCADE,
  token text NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  status text NOT NULL DEFAULT 'pending',
  friend_user_id uuid,
  deposit_amount numeric,
  monthly_rent numeric,
  address text,
  available_from date,
  available_until date,
  photo_url text,
  accepted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(token)
);

-- Enable RLS
ALTER TABLE public.friend_sublet_invites ENABLE ROW LEVEL SECURITY;

-- Inviters can manage their own invites
CREATE POLICY "Inviters can view own invites"
  ON public.friend_sublet_invites FOR SELECT
  TO authenticated
  USING (inviter_id = auth.uid());

CREATE POLICY "Inviters can insert own invites"
  ON public.friend_sublet_invites FOR INSERT
  TO authenticated
  WITH CHECK (inviter_id = auth.uid());

CREATE POLICY "Inviters can update own invites"
  ON public.friend_sublet_invites FOR UPDATE
  TO authenticated
  USING (inviter_id = auth.uid());

-- Friends can view invites addressed to them
CREATE POLICY "Friends can view their invites"
  ON public.friend_sublet_invites FOR SELECT
  TO authenticated
  USING (friend_user_id = auth.uid());

-- Friends can update invites addressed to them (to accept)
CREATE POLICY "Friends can update their invites"
  ON public.friend_sublet_invites FOR UPDATE
  TO authenticated
  USING (friend_user_id = auth.uid());

-- Anonymous users can view invites by token (for landing page before auth)
CREATE POLICY "Anyone can view invite by token"
  ON public.friend_sublet_invites FOR SELECT
  TO anon
  USING (true);

-- Updated_at trigger
CREATE TRIGGER friend_sublet_invites_updated_at
  BEFORE UPDATE ON public.friend_sublet_invites
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
