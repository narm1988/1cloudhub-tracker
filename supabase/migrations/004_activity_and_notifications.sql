-- ============================================
-- 1CloudHub Tracker — Migration 004
-- Auto audit-logging for stories (activity_log) and
-- auto-notifications on assignment / comments
-- Run this in Supabase SQL Editor AFTER 001, 002, 003
-- ============================================

-- ============================================
-- STORY FIELD CHANGE LOGGING
-- ============================================
create or replace function log_story_changes()
returns trigger as $$
begin
  if TG_OP = 'INSERT' then
    insert into public.activity_log (parent_id, parent_type, user_id, action, field_name, old_value, new_value)
    values (new.id, 'story', auth.uid(), 'created', null, null, new.title);
    return new;
  end if;

  if new.title is distinct from old.title then
    insert into public.activity_log (parent_id, parent_type, user_id, action, field_name, old_value, new_value)
    values (new.id, 'story', auth.uid(), 'updated', 'title', old.title, new.title);
  end if;
  if new.description is distinct from old.description then
    insert into public.activity_log (parent_id, parent_type, user_id, action, field_name, old_value, new_value)
    values (new.id, 'story', auth.uid(), 'updated', 'description', old.description, new.description);
  end if;
  if new.status is distinct from old.status then
    insert into public.activity_log (parent_id, parent_type, user_id, action, field_name, old_value, new_value)
    values (new.id, 'story', auth.uid(), 'updated', 'status', old.status, new.status);
  end if;
  if new.priority is distinct from old.priority then
    insert into public.activity_log (parent_id, parent_type, user_id, action, field_name, old_value, new_value)
    values (new.id, 'story', auth.uid(), 'updated', 'priority', old.priority, new.priority);
  end if;
  if new.assignee_id is distinct from old.assignee_id then
    insert into public.activity_log (parent_id, parent_type, user_id, action, field_name, old_value, new_value)
    values (
      new.id, 'story', auth.uid(), 'updated', 'assignee',
      (select full_name from public.profiles where id = old.assignee_id),
      (select full_name from public.profiles where id = new.assignee_id)
    );
  end if;
  if new.story_points is distinct from old.story_points then
    insert into public.activity_log (parent_id, parent_type, user_id, action, field_name, old_value, new_value)
    values (new.id, 'story', auth.uid(), 'updated', 'story points', old.story_points::text, new.story_points::text);
  end if;
  if new.start_date is distinct from old.start_date then
    insert into public.activity_log (parent_id, parent_type, user_id, action, field_name, old_value, new_value)
    values (new.id, 'story', auth.uid(), 'updated', 'start date', old.start_date::text, new.start_date::text);
  end if;
  if new.due_date is distinct from old.due_date then
    insert into public.activity_log (parent_id, parent_type, user_id, action, field_name, old_value, new_value)
    values (new.id, 'story', auth.uid(), 'updated', 'due date', old.due_date::text, new.due_date::text);
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists stories_activity_log on public.stories;
create trigger stories_activity_log
  after insert or update on public.stories
  for each row execute procedure log_story_changes();

-- ============================================
-- COMMENT / ATTACHMENT / LABEL ADD LOGGING (story-scoped)
-- ============================================
create or replace function log_comment_added()
returns trigger as $$
begin
  if new.parent_type = 'story' then
    insert into public.activity_log (parent_id, parent_type, user_id, action, field_name, old_value, new_value)
    values (new.parent_id, 'story', new.author_id, 'comment_added', null, null, left(new.content, 140));
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists comments_activity_log on public.comments;
create trigger comments_activity_log
  after insert on public.comments
  for each row execute procedure log_comment_added();

create or replace function log_attachment_added()
returns trigger as $$
begin
  if new.parent_type = 'story' then
    insert into public.activity_log (parent_id, parent_type, user_id, action, field_name, old_value, new_value)
    values (new.parent_id, 'story', new.uploaded_by, 'attachment_added', null, null, new.file_name);
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists attachments_activity_log on public.attachments;
create trigger attachments_activity_log
  after insert on public.attachments
  for each row execute procedure log_attachment_added();

create or replace function log_story_label_added()
returns trigger as $$
begin
  insert into public.activity_log (parent_id, parent_type, user_id, action, field_name, old_value, new_value)
  values (
    new.story_id, 'story', auth.uid(), 'label_added', null, null,
    (select name from public.labels where id = new.label_id)
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists story_labels_activity_log on public.story_labels;
create trigger story_labels_activity_log
  after insert on public.story_labels
  for each row execute procedure log_story_label_added();

-- ============================================
-- NOTIFICATIONS — auto-notify on assignment & comments
-- ============================================
create or replace function notify_story_assignee()
returns trigger as $$
begin
  if new.assignee_id is not null
     and new.assignee_id is distinct from old.assignee_id
     and new.assignee_id <> auth.uid() then
    insert into public.notifications (user_id, message, link)
    values (
      new.assignee_id,
      'You were assigned to ' || coalesce(new.display_id, 'a story') || ': ' || new.title,
      '/stories/' || new.id
    );
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists stories_notify_assignee on public.stories;
create trigger stories_notify_assignee
  after update on public.stories
  for each row execute procedure notify_story_assignee();

create or replace function notify_story_comment()
returns trigger as $$
declare
  s record;
begin
  if new.parent_type = 'story' then
    select * into s from public.stories where id = new.parent_id;
    if s.id is not null then
      if s.assignee_id is not null and s.assignee_id <> new.author_id then
        insert into public.notifications (user_id, message, link)
        values (s.assignee_id, 'New comment on ' || coalesce(s.display_id, 'a story'), '/stories/' || s.id);
      end if;
      if s.reporter_id is not null and s.reporter_id <> new.author_id and s.reporter_id is distinct from s.assignee_id then
        insert into public.notifications (user_id, message, link)
        values (s.reporter_id, 'New comment on ' || coalesce(s.display_id, 'a story'), '/stories/' || s.id);
      end if;
    end if;
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists comments_notify on public.comments;
create trigger comments_notify
  after insert on public.comments
  for each row execute procedure notify_story_comment();

-- ============================================
-- Make sure notifications stream over Realtime
-- ============================================
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'notifications'
  ) then
    alter publication supabase_realtime add table public.notifications;
  end if;
end $$;

-- ============================================
-- INDEXES
-- ============================================
create index if not exists idx_notifications_created on public.notifications(created_at desc);
create index if not exists idx_activity_created on public.activity_log(created_at desc);
