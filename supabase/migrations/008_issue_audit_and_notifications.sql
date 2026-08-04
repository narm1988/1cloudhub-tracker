-- ============================================
-- 1CloudHub Tracker — Migration 008
-- Issues now have their own detail page (IssueDetailPage), so give them
-- the same audit-log + notification triggers stories got in migration 004.
-- Run this in Supabase SQL Editor AFTER 001-007
-- ============================================

-- ============================================
-- ISSUE FIELD CHANGE LOGGING (mirrors log_story_changes)
-- ============================================
create or replace function log_issue_changes()
returns trigger as $$
begin
  if TG_OP = 'INSERT' then
    insert into public.activity_log (parent_id, parent_type, user_id, action, field_name, old_value, new_value)
    values (new.id, 'issue', auth.uid(), 'created', null, null, new.title);
    return new;
  end if;

  if new.title is distinct from old.title then
    insert into public.activity_log (parent_id, parent_type, user_id, action, field_name, old_value, new_value)
    values (new.id, 'issue', auth.uid(), 'updated', 'title', old.title, new.title);
  end if;
  if new.description is distinct from old.description then
    insert into public.activity_log (parent_id, parent_type, user_id, action, field_name, old_value, new_value)
    values (new.id, 'issue', auth.uid(), 'updated', 'description', old.description, new.description);
  end if;
  if new.type is distinct from old.type then
    insert into public.activity_log (parent_id, parent_type, user_id, action, field_name, old_value, new_value)
    values (new.id, 'issue', auth.uid(), 'updated', 'type', old.type, new.type);
  end if;
  if new.status is distinct from old.status then
    insert into public.activity_log (parent_id, parent_type, user_id, action, field_name, old_value, new_value)
    values (new.id, 'issue', auth.uid(), 'updated', 'status', old.status, new.status);
  end if;
  if new.priority is distinct from old.priority then
    insert into public.activity_log (parent_id, parent_type, user_id, action, field_name, old_value, new_value)
    values (new.id, 'issue', auth.uid(), 'updated', 'priority', old.priority, new.priority);
  end if;
  if new.assignee_id is distinct from old.assignee_id then
    insert into public.activity_log (parent_id, parent_type, user_id, action, field_name, old_value, new_value)
    values (
      new.id, 'issue', auth.uid(), 'updated', 'assignee',
      (select full_name from public.profiles where id = old.assignee_id),
      (select full_name from public.profiles where id = new.assignee_id)
    );
  end if;
  if new.story_points is distinct from old.story_points then
    insert into public.activity_log (parent_id, parent_type, user_id, action, field_name, old_value, new_value)
    values (new.id, 'issue', auth.uid(), 'updated', 'story points', old.story_points::text, new.story_points::text);
  end if;
  if new.start_date is distinct from old.start_date then
    insert into public.activity_log (parent_id, parent_type, user_id, action, field_name, old_value, new_value)
    values (new.id, 'issue', auth.uid(), 'updated', 'start date', old.start_date::text, new.start_date::text);
  end if;
  if new.due_date is distinct from old.due_date then
    insert into public.activity_log (parent_id, parent_type, user_id, action, field_name, old_value, new_value)
    values (new.id, 'issue', auth.uid(), 'updated', 'due date', old.due_date::text, new.due_date::text);
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists issues_activity_log on public.issues;
create trigger issues_activity_log
  after insert or update on public.issues
  for each row execute procedure log_issue_changes();

-- ============================================
-- Broaden comment/attachment logging to also cover issue-parented rows
-- (migration 004 only logged parent_type = 'story')
-- ============================================
create or replace function log_comment_added()
returns trigger as $$
begin
  if new.parent_type in ('story', 'issue') then
    insert into public.activity_log (parent_id, parent_type, user_id, action, field_name, old_value, new_value)
    values (new.parent_id, new.parent_type, new.author_id, 'comment_added', null, null, left(new.content, 140));
  end if;
  return new;
end;
$$ language plpgsql security definer;

create or replace function log_attachment_added()
returns trigger as $$
begin
  if new.parent_type in ('story', 'issue') then
    insert into public.activity_log (parent_id, parent_type, user_id, action, field_name, old_value, new_value)
    values (new.parent_id, new.parent_type, new.uploaded_by, 'attachment_added', null, null, new.file_name);
  end if;
  return new;
end;
$$ language plpgsql security definer;

-- ============================================
-- ISSUE LABEL ATTACH LOGGING
-- ============================================
create or replace function log_issue_label_added()
returns trigger as $$
begin
  insert into public.activity_log (parent_id, parent_type, user_id, action, field_name, old_value, new_value)
  values (
    new.issue_id, 'issue', auth.uid(), 'label_added', null, null,
    (select name from public.labels where id = new.label_id)
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists issue_labels_activity_log on public.issue_labels;
create trigger issue_labels_activity_log
  after insert on public.issue_labels
  for each row execute procedure log_issue_label_added();

-- ============================================
-- NOTIFICATIONS — issue assignment & comments (mirrors story triggers)
-- ============================================
create or replace function notify_issue_assignee()
returns trigger as $$
begin
  if new.assignee_id is not null
     and new.assignee_id is distinct from old.assignee_id
     and new.assignee_id <> auth.uid() then
    insert into public.notifications (user_id, message, link)
    values (
      new.assignee_id,
      'You were assigned to ' || coalesce(new.display_id, 'an issue') || ': ' || new.title,
      '/issues/' || new.id
    );
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists issues_notify_assignee on public.issues;
create trigger issues_notify_assignee
  after update on public.issues
  for each row execute procedure notify_issue_assignee();

create or replace function notify_issue_comment()
returns trigger as $$
declare
  i record;
begin
  if new.parent_type = 'issue' then
    select * into i from public.issues where id = new.parent_id;
    if i.id is not null then
      if i.assignee_id is not null and i.assignee_id <> new.author_id then
        insert into public.notifications (user_id, message, link)
        values (i.assignee_id, 'New comment on ' || coalesce(i.display_id, 'an issue'), '/issues/' || i.id);
      end if;
      if i.reporter_id is not null and i.reporter_id <> new.author_id and i.reporter_id is distinct from i.assignee_id then
        insert into public.notifications (user_id, message, link)
        values (i.reporter_id, 'New comment on ' || coalesce(i.display_id, 'an issue'), '/issues/' || i.id);
      end if;
    end if;
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists comments_notify_issue on public.comments;
create trigger comments_notify_issue
  after insert on public.comments
  for each row execute procedure notify_issue_comment();
