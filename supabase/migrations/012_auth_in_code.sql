-- ============================================
-- 1CloudHub Tracker — Migration 012
-- Auth-in-code: authentication (password + Entra ID SSO) moves into the
-- FastAPI backend. Supabase Auth (GoTrue) is no longer used to create or
-- authenticate users — Supabase stays the Postgres database, and its RLS
-- policies keep working unmodified (they're all plain auth.uid()), because
-- the app now mints its own JWTs signed with a key registered as this
-- project's JWT Signing Key (Dashboard → Authentication → JWT Keys).
--
-- Run this in Supabase SQL Editor AFTER 001-011.
-- ============================================

-- profiles no longer depends on auth.users — FastAPI creates rows directly.
alter table public.profiles drop constraint if exists profiles_id_fkey;
alter table public.profiles alter column id set default uuid_generate_v4();

-- Password-based accounts store their hash here; Entra-only accounts leave
-- this null and can never pass the /login bcrypt check.
alter table public.profiles add column if not exists password_hash text;

-- The invites table used to just be a log — GoTrue's own invite email held
-- the actual token. Now this backend owns the whole invite lifecycle, so it
-- needs a real lookup token and an expiry. `accepted` (already existed) is
-- reused as the used/not-used flag instead of adding a new column.
alter table public.invites add column if not exists token text;
alter table public.invites add column if not exists expires_at timestamptz default (now() + interval '7 days');
create unique index if not exists invites_token_idx on public.invites (token) where token is not null;

-- Dead: only fired on auth.users inserts, which no longer happen.
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();

-- Dead: this was a GoTrue Auth Hook (migration 011). Entra sign-in no
-- longer issues a GoTrue token, so the hook never fires — the group→role
-- logic it contained now lives in api/routes/auth.py's Entra callback.
-- Also unset it as the Custom Access Token Hook in the Supabase Dashboard
-- (Authentication → Hooks) if it was ever enabled there.
drop function if exists public.sync_role_from_entra_groups(jsonb);

-- RLS policies are intentionally untouched — every one of them is a plain
-- auth.uid() check, which keeps working against JWTs this app signs itself.
