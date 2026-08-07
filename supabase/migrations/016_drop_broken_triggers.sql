-- ============================================
-- 1CloudHub Tracker — Migration 016
-- Drop all triggers that use auth.uid() — they return NULL when the API
-- uses the service_role key. Activity log + notifications are now created
-- directly by the Python API routes with proper user attribution.
-- ============================================

-- Story triggers (from migration 004)
DROP TRIGGER IF EXISTS stories_activity_log ON public.stories;
DROP TRIGGER IF EXISTS stories_notify_assignee ON public.stories;
DROP TRIGGER IF EXISTS comments_activity_log ON public.comments;
DROP TRIGGER IF EXISTS attachments_activity_log ON public.attachments;
DROP TRIGGER IF EXISTS story_labels_activity_log ON public.story_labels;
DROP TRIGGER IF EXISTS comments_notify ON public.comments;

-- Issue triggers (from migration 008)
DROP TRIGGER IF EXISTS issues_activity_log ON public.issues;
DROP TRIGGER IF EXISTS issues_notify_assignee ON public.issues;
DROP TRIGGER IF EXISTS issue_labels_activity_log ON public.issue_labels;
DROP TRIGGER IF EXISTS comments_notify_issue ON public.comments;

-- Drop the now-unused trigger functions
DROP FUNCTION IF EXISTS log_story_changes();
DROP FUNCTION IF EXISTS log_issue_changes();
DROP FUNCTION IF EXISTS log_comment_added();
DROP FUNCTION IF EXISTS log_attachment_added();
DROP FUNCTION IF EXISTS log_story_label_added();
DROP FUNCTION IF EXISTS log_issue_label_added();
DROP FUNCTION IF EXISTS notify_story_assignee();
DROP FUNCTION IF EXISTS notify_issue_assignee();
DROP FUNCTION IF EXISTS notify_story_comment();
DROP FUNCTION IF EXISTS notify_issue_comment();

-- Remove the dead project_members table (never used by API or frontend)
DROP TABLE IF EXISTS public.project_members;
