-- Add columns to support claiming, retry and DLQ for EventLog
ALTER TABLE "EventLog"
  ADD COLUMN IF NOT EXISTS processed BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS processed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS processing BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS processing_by TEXT,
  ADD COLUMN IF NOT EXISTS processing_started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS retry_count INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_error TEXT,
  ADD COLUMN IF NOT EXISTS failed BOOLEAN DEFAULT FALSE;

-- Indexes to speed up queries for unprocessed/unfailed events
CREATE INDEX IF NOT EXISTS idx_eventlog_unprocessed ON "EventLog" (failed, processed, processing, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_eventlog_table_created_at ON "EventLog" (table_name, created_at DESC);
