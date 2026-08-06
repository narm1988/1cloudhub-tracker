-- Add archived flag to epics table for soft-archive functionality
ALTER TABLE epics ADD COLUMN IF NOT EXISTS archived boolean DEFAULT false;

-- Index for filtering archived/active epics efficiently
CREATE INDEX IF NOT EXISTS idx_epics_archived ON epics (archived);
