-- ============================================
-- 1CloudHub Tracker — Jira-style Hierarchy Update
-- Hierarchy: Epic → Story → Issue (Task/Bug/Sub-task)
-- Run this AFTER 001_initial_schema.sql
-- ============================================

-- ============================================
-- ISSUES TABLE (Tasks, Bugs, Sub-tasks under Stories)
-- ============================================
create table if not exists public.issues (
  id uuid primary key default uuid_generate_v4(),
  story_id uuid not null references public.stories(id) on delete cascade,
  display_id text unique,
  title text not null,
  description text,
  type text not null default 'Task' check (type in ('Task', 'Bug', 'Sub-task')),
  status text not null default 'Created' check (status in ('Created', 'Draft', 'In Progress', 'In Review', 'Done')),
  priority text not null default 'Medium' check (priority in ('Critical', 'High', 'Medium', 'Low')),
  assignee_id uuid references public.profiles(id),
  reporter_id uuid references public.profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Auto-update updated_at for issues
create trigger issues_updated_at
  before update on public.issues
  for each row execute procedure update_updated_at();

-- ============================================
-- ISSUE LINKS (dependencies between stories/issues)
-- ============================================
create table if not exists public.issue_links (
  id uuid primary key default uuid_generate_v4(),
  source_id uuid not null,
  source_type text not null check (source_type in ('story', 'issue')),
  target_id uuid not null,
  target_type text not null check (target_type in ('story', 'issue')),
  link_type text not null check (link_type in ('blocks', 'is blocked by', 'relates to', 'duplicates', 'is duplicated by')),
  created_at timestamptz default now()
);

-- ============================================
-- UPDATE STORIES — add priority, remove 'type' field
-- Stories are always type 'Story' now (issues handle Task/Bug)
-- ============================================
alter table public.stories 
  add column if not exists priority text default 'Medium' check (priority in ('Critical', 'High', 'Medium', 'Low'));

-- Update status options for stories
alter table public.stories drop constraint if exists stories_status_check;
alter table public.stories add constraint stories_status_check 
  check (status in ('Created', 'Draft', 'In Progress', 'In Review', 'Done'));

-- ============================================
-- UPDATE COMMENTS — make generic (story or issue)
-- ============================================
alter table public.comments 
  add column if not exists parent_type text default 'story' check (parent_type in ('story', 'issue'));

-- Rename story_id to parent_id for generic linking
alter table public.comments rename column story_id to parent_id;

-- ============================================
-- UPDATE ATTACHMENTS — make generic (story or issue)
-- ============================================
alter table public.attachments 
  add column if not exists parent_type text default 'story' check (parent_type in ('story', 'issue'));

alter table public.attachments rename column story_id to parent_id;

-- ============================================
-- RLS for new tables
-- ============================================
alter table public.issues enable row level security;
alter table public.issue_links enable row level security;

create policy "Issues viewable by authenticated" on public.issues
  for select using (auth.role() = 'authenticated');

create policy "Issues insertable by authenticated" on public.issues
  for insert with check (auth.role() = 'authenticated');

create policy "Issues updatable by authenticated" on public.issues
  for update using (auth.role() = 'authenticated');

create policy "Issues deletable by reporter or admin" on public.issues
  for delete using (reporter_id = auth.uid() or exists(select 1 from public.profiles where id = auth.uid() and role = 'admin'));

create policy "Issue links viewable by authenticated" on public.issue_links
  for select using (auth.role() = 'authenticated');

create policy "Issue links insertable by authenticated" on public.issue_links
  for insert with check (auth.role() = 'authenticated');

create policy "Issue links deletable by authenticated" on public.issue_links
  for delete using (auth.role() = 'authenticated');

-- ============================================
-- INDEXES
-- ============================================
create index if not exists idx_issues_story on public.issues(story_id);
create index if not exists idx_issues_assignee on public.issues(assignee_id);
create index if not exists idx_issues_status on public.issues(status);
create index if not exists idx_issue_links_source on public.issue_links(source_id);
create index if not exists idx_issue_links_target on public.issue_links(target_id);
