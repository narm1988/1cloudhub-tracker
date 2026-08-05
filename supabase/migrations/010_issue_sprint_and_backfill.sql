-- 1) Stories were being created without project_id (only epic_id was ever
--    set), so any board/backlog/timeline query filtering on
--    stories.project_id silently excluded every story. Backfill existing
--    rows from their epic's project.
update public.stories s
set project_id = e.project_id
from public.epics e
where s.epic_id = e.id
  and s.project_id is distinct from e.project_id;

-- 2) Issues (Tasks/Bugs/Sub-tasks) had no sprint concept at all, so they
--    couldn't be "in a sprint" or "in backlog" independently of their
--    parent story. Add sprint_id so an epic-level "move to backlog" can
--    cascade all the way down to issues, not just stories.
alter table public.issues add column if not exists sprint_id uuid references public.sprints(id) on delete set null;
