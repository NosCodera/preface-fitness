-- Import tracking and useful indexes for the generic transition store.
-- This migration does not alter or delete any business data.
CREATE INDEX IF NOT EXISTS idx_records_gym_table ON records(gym_id, table_name);
CREATE INDEX IF NOT EXISTS idx_records_table_gym ON records(table_name, gym_id);
CREATE TABLE IF NOT EXISTS migration_imports (
  id TEXT PRIMARY KEY,
  gym_id TEXT NOT NULL,
  source_format TEXT NOT NULL,
  source_created_at TEXT,
  started_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at TEXT,
  status TEXT NOT NULL DEFAULT 'prepared',
  manifest_json TEXT NOT NULL DEFAULT '{}'
);
