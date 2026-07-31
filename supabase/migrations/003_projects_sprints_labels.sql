-- ============================================
-- 1CloudHub Tracker — Migration 003
-- Adds: Sprints, Labels, Activity Log, Due Dates, Story Points
-- Run AFTER 001 and 002
-- ============================================

-- ============================================
-- SPRINTS
-- ============================================
create table if not exists public.sprints (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid references public.projects(id) on delete cascade,
  name text not null,
  goal text,
  status text not null default 'planned' check (status in ('planned', 'active', 'completed')),
  start_date date,
  end_date date,
  created_at timestamptz default now()
);

-- Link stories to sprints
alter table public.stories
  add column if not exists sprint_id uuid references public.sprints(id) on delete set null;

-- ============================================
-- DUE DATES + STORY POINTS on stories and issues
-- ============================================
alter table public.stories
  add column if not exists start_date date,
  add column if not exists due_date date,
  add column if not exists story_points integer;

alter table public.issues
  add column if not exists start_date date,
  add column if not exists due_date date,
  add column if not exists story_points integer;

-- ============================================
-- LABELS
-- ============================================
create table if not exists public.labels (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid references public.projects(id) on delete cascade,
  name text not null,
  color text not null default '#6B7280',
  created_at timestamptz default now(),
  unique(project_id, name)
);

-- Many-to-many: stories <-> labels
create table if not exists public.story_labels (
  id uuid primary key default uuid_generate_v4(),
  story_id uuid not null references public.stories(id) on delete cascade,
  label_id uuid not null references public.labels(id) on delete cascade,
  unique(story_id, label_id)
);

-- Many-to-many: issues <-> labels
create table if not exists public.issue_labels (
  id uuid primary key default uuid_generate_v4(),
  issue_id uuid not null references public.issues(id) on delete cascade,
  label_id uuid not null references public.labels(id) on delete cascade,
  unique(issue_id, label_id)
);

-- ============================================
-- ACTIVITY LOG (audit trail)
-- ============================================
create table if not exists public.activity_log (
  id uuid primary key default uuid_generate_v4(),
  parent_id uuid not null,
  parent_type text not null check (parent_type in ('story', 'issue', 'epic')),
  user_id uuid references public.profiles(id),
  action text not null,
  field_name text,
  old_value text,
  new_value text,
  created_at timestamptz default now()
);

-- ============================================
-- RLS
-- ============================================
alter table public.sprints enable row level security;
alter table public.labels enable row level security;
alter table public.story_labels enable row level security;
alter table public.issue_labels enable row level security;
alter table public.activity_log enable row level security;

create policy "Sprints viewable by authenticated" on public.sprints
  for select using (auth.role() = 'authenticated');
create policy "Sprints insertable by authenticated" on public.sprints
  for insert with check (auth.role() = 'authenticated');
create policy "Sprints updatable by authenticated" on public.sprints
  for update using (auth.role() = 'authenticated');
create policy "Sprints deletable by authenticated" on public.sprints
  for delete using (auth.role() = 'authenticated');

create policy "Labels viewable by authenticated" on public.labels
  for select using (auth.role() = 'authenticated');
create policy "Labels insertable by authenticated" on public.labels
  for insert with check (auth.role() = 'authenticated');
create policy "Labels deletable by authenticated" on public.labels
  for delete using (auth.role() = 'authenticated');

create policy "Story labels viewable by authenticated" on public.story_labels
  for select using (auth.role() = 'authenticated');
create policy "Story labels insertable by authenticated" on public.story_labels
  for insert with check (auth.role() = 'authenticated');
create policy "Story labels deletable by authenticated" on public.story_labels
  for delete using (auth.role() = 'authenticated');

create policy "Issue labels viewable by authenticated" on public.issue_labels
  for select using (auth.role() = 'authenticated');
create policy "Issue labels insertable by authenticated" on public.issue_labels
  for insert with check (auth.role() = 'authenticated');
create policy "Issue labels deletable by authenticated" on public.issue_labels
  for delete using (auth.role() = 'authenticated');

create policy "Activity log viewable by authenticated" on public.activity_log
  for select using (auth.role() = 'authenticated');
create policy "Activity log insertable by authenticated" on public.activity_log
  for insert with check (auth.role() = 'authenticated');

-- ============================================
-- INDEXES
-- ============================================
create index if not exists idx_stories_sprint on public.stories(sprint_id);
create index if not exists idx_stories_due_date on public.stories(due_date);
create index if not exists idx_labels_project on public.labels(project_id);
create index if not exists idx_story_labels_story on public.story_labels(story_id);
create index if not exists idx_issue_labels_issue on public.issue_labels(issue_id);
create index if not exists idx_activity_parent on public.activity_log(parent_id);
create index if not exists idx_sprints_project on public.sprints(project_id);
create index if not exists idx_sprints_status on public.sprints(status);
