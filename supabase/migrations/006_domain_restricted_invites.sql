-- ============================================
-- 1CloudHub Tracker — Migration 006
-- Real invite emails (sent via the invite-user Edge Function),
-- restricted to the @1cloudhub.com domain
-- Run this in Supabase SQL Editor AFTER 001-005
-- ============================================

-- The invite-user Edge Function passes the chosen role in the new user's
-- metadata — teach the auto-profile trigger to respect it instead of
-- always defaulting new profiles to 'member'.
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data ->> 'role', 'member')
  );
  return new;
end;
$$ language plpgsql security definer;

-- Defense in depth: even though the Edge Function is the real gatekeeper,
-- reject any invite record for a non-1cloudhub.com address at the DB level too.
alter table public.invites drop constraint if exists invites_email_domain_check;
alter table public.invites
  add constraint invites_email_domain_check check (email ~* '^[A-Za-z0-9._%+-]+@1cloudhub\.com$');
