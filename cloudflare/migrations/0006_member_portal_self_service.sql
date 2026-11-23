-- Member portal self-service profile snapshots. Additive; preserves existing member and PT data.
CREATE TABLE IF NOT EXISTS member_portal_profile_history (
  id TEXT PRIMARY KEY,
  gym_id TEXT NOT NULL,
  member_id TEXT NOT NULL,
  changed_at TEXT NOT NULL,
  measurements_json TEXT NOT NULL DEFAULT '{}',
  medical_json TEXT NOT NULL DEFAULT '{}',
  FOREIGN KEY (gym_id) REFERENCES gyms(id) ON DELETE CASCADE,
  FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_member_portal_history_member_date ON member_portal_profile_history(gym_id, member_id, changed_at DESC);
