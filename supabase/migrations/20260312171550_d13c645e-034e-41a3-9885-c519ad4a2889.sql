
-- Create manager_integrations table
CREATE TABLE public.manager_integrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  manager_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  appfolio_url text NOT NULL,
  last_synced_at timestamptz,
  status text NOT NULL DEFAULT 'never_synced',
  sync_error text,
  synced_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(manager_id)
);

ALTER TABLE public.manager_integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Managers can read own integrations"
  ON public.manager_integrations FOR SELECT TO authenticated
  USING (auth.uid() = manager_id);

CREATE POLICY "Managers can insert own integrations"
  ON public.manager_integrations FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = manager_id);

CREATE POLICY "Managers can update own integrations"
  ON public.manager_integrations FOR UPDATE TO authenticated
  USING (auth.uid() = manager_id)
  WITH CHECK (auth.uid() = manager_id);

-- Add source and manager_id columns to listings table
ALTER TABLE public.listings 
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS manager_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- Allow managers to read listings they synced
CREATE POLICY "Managers can read synced listings"
  ON public.listings FOR SELECT TO authenticated
  USING (manager_id = auth.uid());

-- Create trigger for manager_integrations updated_at
CREATE TRIGGER manager_integrations_updated_at
  BEFORE UPDATE ON public.manager_integrations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Enable pg_cron and pg_net for scheduled sync
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;
