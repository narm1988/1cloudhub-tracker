-- ============================================
-- 1CloudHub Tracker — Migration 007
-- Status pipeline update: fold 'Draft' into 'Created', and add
-- 'Closed' / 'Archived' as terminal states reachable from 'Done'.
-- Run this in Supabase SQL Editor AFTER 001-006
-- ============================================

update public.stories set status = 'Created' where status = 'Draft';
update public.issues set status = 'Created' where status = 'Draft';

alter table public.stories drop constraint if exists stories_status_check;
alter table public.stories add constraint stories_status_check
  check (status in ('Created', 'In Progress', 'In Review', 'Done', 'Closed', 'Archived'));

alter table public.issues drop constraint if exists issues_status_check;
alter table public.issues add constraint issues_status_check
  check (status in ('Created', 'In Progress', 'In Review', 'Done', 'Closed', 'Archived'));
