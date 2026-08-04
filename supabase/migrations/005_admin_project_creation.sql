-- ============================================
-- 1CloudHub Tracker — Migration 005
-- Restrict project creation to admins only (DB-level enforcement,
-- since RLS is the real gate — the UI check alone can be bypassed)
-- Run this in Supabase SQL Editor AFTER 001-004
-- ============================================

drop policy if exists "Projects insertable by authenticated" on public.projects;

create policy "Projects insertable by admin" on public.projects
  for insert with check (
    exists(select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );
