-- ============================================
-- 1CloudHub Tracker — Migration 011
-- Custom Access Token Hook: sync admin/member role from
-- Entra ID (Azure AD) security group membership on sign-in.
-- Run this in Supabase SQL Editor AFTER 001-010.
--
-- Requires, outside this file:
--   1. Azure Portal — the app registration's Token configuration must
--      have a "groups" claim added to the ID token (Security groups),
--      otherwise auth.identities.identity_data never has a groups array
--      to read and this hook is a permanent no-op.
--   2. Fill in ADMIN_GROUP_OBJECT_ID below with the real Entra Object ID
--      (a GUID) of the admin security group — Entra ID → Groups →
--      <your admin group> → Overview.
--   3. After running this migration, enable the function below as the
--      Custom Access Token Hook: Supabase Dashboard → Authentication →
--      Hooks → Custom Access Token → select public.sync_role_from_entra_groups.
-- ============================================

create or replace function public.sync_role_from_entra_groups(event jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  target_user_id uuid := (event->>'user_id')::uuid;
  azure_groups jsonb;
  -- TODO: replace with the real Object ID (GUID) of the Entra admin
  -- security group before running this migration.
  admin_group_id text := 'REPLACE_WITH_ENTRA_ADMIN_GROUP_OBJECT_ID';
begin
  -- Raw ID-token claims land in identity_data (server-side only, never
  -- client-writable) — unlike raw_user_meta_data, which a signed-in user
  -- can edit via supabase.auth.updateUser() and must never drive role.
  select identity_data -> 'custom_claims' -> 'groups'
    into azure_groups
    from auth.identities
   where user_id = target_user_id
     and provider = 'azure'
   limit 1;

  -- No Azure identity means this is a password-based account — leave its
  -- role exactly as manually set via the People page.
  if azure_groups is not null then
    update public.profiles
       set role = case when azure_groups @> to_jsonb(array[admin_group_id])
                        then 'admin' else 'member' end
     where id = target_user_id;
  end if;

  return event;
end;
$$;

-- Hooks run as supabase_auth_admin and must not be callable by regular
-- clients — same pattern Supabase's docs require for all auth hooks.
grant execute on function public.sync_role_from_entra_groups to supabase_auth_admin;
revoke execute on function public.sync_role_from_entra_groups from authenticated, anon, public;
