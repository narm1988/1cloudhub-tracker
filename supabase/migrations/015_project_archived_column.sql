-- Add archived flag to projects table
ALTER TABLE projects ADD COLUMN IF NOT EXISTS archived boolean DEFAULT false;
CREATE INDEX IF NOT EXISTS idx_projects_archived ON projects (archived);
