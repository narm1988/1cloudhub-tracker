-- Add token column to invites table for the custom auth invite flow
ALTER TABLE public.invites ADD COLUMN IF NOT EXISTS token text UNIQUE;

-- Add expires_at for time-limited invites
ALTER TABLE public.invites ADD COLUMN IF NOT EXISTS expires_at timestamptz DEFAULT (now() + interval '7 days');

-- Set default for accepted column if not already
ALTER TABLE public.invites ALTER COLUMN accepted SET DEFAULT false;
