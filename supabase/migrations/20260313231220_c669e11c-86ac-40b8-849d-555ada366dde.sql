
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS stripe_verification_session_id text,
ADD COLUMN IF NOT EXISTS verification_attempts integer NOT NULL DEFAULT 0;
