-- Phase 6: explicit staff permissions. Existing accounts default to no table write access.
ALTER TABLE users ADD COLUMN permissions_json TEXT NOT NULL DEFAULT '{}';
CREATE INDEX IF NOT EXISTS idx_users_gym_email ON users(gym_id,email);
