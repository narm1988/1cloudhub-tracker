-- Profile-referencing foreign keys had no ON DELETE action, so deleting a
-- user (directly in the dashboard, or via the remove-person edge function)
-- failed with a foreign key violation as soon as they'd created/authored/
-- been assigned anything. Switch these to SET NULL so records survive and
-- the delete succeeds; comments.author_id has to become nullable first
-- since it was NOT NULL.

alter table public.comments alter column author_id drop not null;

alter table public.projects drop constraint if exists projects_created_by_fkey;
alter table public.projects add constraint projects_created_by_fkey
  foreign key (created_by) references public.profiles(id) on delete set null;

alter table public.epics drop constraint if exists epics_owner_id_fkey;
alter table public.epics add constraint epics_owner_id_fkey
  foreign key (owner_id) references public.profiles(id) on delete set null;

alter table public.stories drop constraint if exists stories_assignee_id_fkey;
alter table public.stories add constraint stories_assignee_id_fkey
  foreign key (assignee_id) references public.profiles(id) on delete set null;

alter table public.stories drop constraint if exists stories_reporter_id_fkey;
alter table public.stories add constraint stories_reporter_id_fkey
  foreign key (reporter_id) references public.profiles(id) on delete set null;

alter table public.comments drop constraint if exists comments_author_id_fkey;
alter table public.comments add constraint comments_author_id_fkey
  foreign key (author_id) references public.profiles(id) on delete set null;

alter table public.attachments drop constraint if exists attachments_uploaded_by_fkey;
alter table public.attachments add constraint attachments_uploaded_by_fkey
  foreign key (uploaded_by) references public.profiles(id) on delete set null;

alter table public.invites drop constraint if exists invites_invited_by_fkey;
alter table public.invites add constraint invites_invited_by_fkey
  foreign key (invited_by) references public.profiles(id) on delete set null;

alter table public.issues drop constraint if exists issues_assignee_id_fkey;
alter table public.issues add constraint issues_assignee_id_fkey
  foreign key (assignee_id) references public.profiles(id) on delete set null;

alter table public.issues drop constraint if exists issues_reporter_id_fkey;
alter table public.issues add constraint issues_reporter_id_fkey
  foreign key (reporter_id) references public.profiles(id) on delete set null;

alter table public.activity_log drop constraint if exists activity_log_user_id_fkey;
alter table public.activity_log add constraint activity_log_user_id_fkey
  foreign key (user_id) references public.profiles(id) on delete set null;
