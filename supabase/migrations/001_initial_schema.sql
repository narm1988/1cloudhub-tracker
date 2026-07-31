-- ============================================
-- 1CloudHub Tracker — Database Schema
-- Run this in Supabase SQL Editor
-- ============================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================
-- PROFILES (linked to Supabase Auth users)
-- ============================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  full_name text not null,
  avatar_url text,
  role text not null default 'member' check (role in ('admin', 'member')),
  created_at timestamptz default now()
);

-- Auto-create profile on auth signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    'member'
  );
  return new;
end;
$$ language plpgsql security definer;

-- Trigger on new auth user
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================
-- PROJECTS
-- ============================================
create table if not exists public.projects (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  key text unique not null,
  description text,
  created_by uuid references public.profiles(id),
  created_at timestamptz default now()
);

-- ============================================
-- PROJECT MEMBERS (many-to-many)
-- ============================================
create table if not exists public.project_members (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  added_at timestamptz default now(),
  unique(project_id, user_id)
);

-- ============================================
-- EPICS
-- ============================================
create table if not exists public.epics (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid references public.projects(id) on delete set null,
  title text not null,
  description text,
  owner_id uuid references public.profiles(id),
  status text not null default 'Created' check (status in ('Created', 'Draft', 'Submitted', 'In Review', 'Resolved')),
  created_at timestamptz default now()
);

-- ============================================
-- STORIES / TASKS
-- ============================================
create table if not exists public.stories (
  id uuid primary key default uuid_generate_v4(),
  epic_id uuid references public.epics(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  display_id text unique,
  title text not null,
  description text,
  type text not null default 'Story' check (type in ('Epic', 'Story', 'Task', 'Bug')),
  status text not null default 'Created' check (status in ('Created', 'Draft', 'Submitted', 'In Review', 'Resolved')),
  priority text not null default 'Medium' check (priority in ('Critical', 'High', 'Medium', 'Low')),
  assignee_id uuid references public.profiles(id),
  reporter_id uuid references public.profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Auto-update updated_at
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger stories_updated_at
  before update on public.stories
  for each row execute procedure update_updated_at();

-- ============================================
-- COMMENTS
-- ============================================
create table if not exists public.comments (
  id uuid primary key default uuid_generate_v4(),
  story_id uuid not null references public.stories(id) on delete cascade,
  author_id uuid not null references public.profiles(id),
  content text not null,
  created_at timestamptz default now()
);

-- ============================================
-- ATTACHMENTS
-- ============================================
create table if not exists public.attachments (
  id uuid primary key default uuid_generate_v4(),
  story_id uuid not null references public.stories(id) on delete cascade,
  file_name text not null,
  file_url text not null,
  file_size bigint default 0,
  uploaded_by uuid references public.profiles(id),
  created_at timestamptz default now()
);

-- ============================================
-- INVITES
-- ============================================
create table if not exists public.invites (
  id uuid primary key default uuid_generate_v4(),
  email text not null,
  role text not null default 'member',
  invited_by uuid references public.profiles(id),
  accepted boolean default false,
  created_at timestamptz default now()
);

-- ============================================
-- NOTIFICATIONS
-- ============================================
create table if not exists public.notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  message text not null,
  link text,
  read boolean default false,
  created_at timestamptz default now()
);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================
alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.project_members enable row level security;
alter table public.epics enable row level security;
alter table public.stories enable row level security;
alter table public.comments enable row level security;
alter table public.attachments enable row level security;
alter table public.invites enable row level security;
alter table public.notifications enable row level security;

-- Profiles: everyone can read, users can update own
create policy "Profiles are viewable by authenticated users" on public.profiles
  for select using (auth.role() = 'authenticated');

create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

-- Epics: authenticated users can CRUD
create policy "Epics viewable by authenticated" on public.epics
  for select using (auth.role() = 'authenticated');

create policy "Epics insertable by authenticated" on public.epics
  for insert with check (auth.role() = 'authenticated');

create policy "Epics updatable by authenticated" on public.epics
  for update using (auth.role() = 'authenticated');

create policy "Epics deletable by owner or admin" on public.epics
  for delete using (owner_id = auth.uid() or exists(select 1 from public.profiles where id = auth.uid() and role = 'admin'));

-- Stories: authenticated users can CRUD
create policy "Stories viewable by authenticated" on public.stories
  for select using (auth.role() = 'authenticated');

create policy "Stories insertable by authenticated" on public.stories
  for insert with check (auth.role() = 'authenticated');

create policy "Stories updatable by authenticated" on public.stories
  for update using (auth.role() = 'authenticated');

create policy "Stories deletable by reporter or admin" on public.stories
  for delete using (reporter_id = auth.uid() or exists(select 1 from public.profiles where id = auth.uid() and role = 'admin'));

-- Comments
create policy "Comments viewable by authenticated" on public.comments
  for select using (auth.role() = 'authenticated');

create policy "Comments insertable by authenticated" on public.comments
  for insert with check (auth.role() = 'authenticated');

create policy "Comments deletable by author" on public.comments
  for delete using (author_id = auth.uid());

-- Attachments
create policy "Attachments viewable by authenticated" on public.attachments
  for select using (auth.role() = 'authenticated');

create policy "Attachments insertable by authenticated" on public.attachments
  for insert with check (auth.role() = 'authenticated');

create policy "Attachments deletable by uploader" on public.attachments
  for delete using (uploaded_by = auth.uid());

-- Projects
create policy "Projects viewable by authenticated" on public.projects
  for select using (auth.role() = 'authenticated');

create policy "Projects insertable by authenticated" on public.projects
  for insert with check (auth.role() = 'authenticated');

-- Project members
create policy "Project members viewable by authenticated" on public.project_members
  for select using (auth.role() = 'authenticated');

-- Invites: admin can see all, users can see own
create policy "Invites viewable by admin" on public.invites
  for select using (exists(select 1 from public.profiles where id = auth.uid() and role = 'admin'));

create policy "Invites insertable by admin" on public.invites
  for insert with check (exists(select 1 from public.profiles where id = auth.uid() and role = 'admin'));

-- Notifications
create policy "Notifications viewable by owner" on public.notifications
  for select using (user_id = auth.uid());

create policy "Notifications updatable by owner" on public.notifications
  for update using (user_id = auth.uid());

-- ============================================
-- STORAGE BUCKET
-- ============================================
-- Run this manually in Supabase Dashboard > Storage:
-- Create bucket "tracker-files" with public access enabled

-- ============================================
-- INDEXES
-- ============================================
create index if not exists idx_stories_epic on public.stories(epic_id);
create index if not exists idx_stories_assignee on public.stories(assignee_id);
create index if not exists idx_stories_status on public.stories(status);
create index if not exists idx_comments_story on public.comments(story_id);
create index if not exists idx_attachments_story on public.attachments(story_id);
create index if not exists idx_notifications_user on public.notifications(user_id);
