-- Phase 8: source-schema parity corrections from the supplied public-schema.sql.
-- Additive and safe for a fresh D1 database after migrations 0001-0004.
-- Do not run this against production until a separate D1 dry-run has passed.

-- Source membership_plans uses months/price/description/is_active.
-- Phase 7's amount/duration_months fields are retained for compatibility.
ALTER TABLE membership_plans ADD COLUMN months INTEGER;
ALTER TABLE membership_plans ADD COLUMN price REAL NOT NULL DEFAULT 0;
ALTER TABLE membership_plans ADD COLUMN description TEXT;
ALTER TABLE membership_plans ADD COLUMN is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0,1));

-- gyms.created_at and updated_at already exist in Phase 1; no duplicate columns needed.

-- Enforce source CHECK constraints in SQLite (cannot add table CHECK constraints
-- without rebuilding tables; triggers preserve existing data and indexes).
CREATE TRIGGER IF NOT EXISTS trg_trainers_tier_insert
BEFORE INSERT ON trainers
WHEN NEW.tier IS NOT NULL AND NEW.tier NOT IN ('Silver','Gold','Platinum')
BEGIN SELECT RAISE(ABORT, 'trainers.tier must be Silver, Gold, or Platinum'); END;
CREATE TRIGGER IF NOT EXISTS trg_trainers_tier_update
BEFORE UPDATE OF tier ON trainers
WHEN NEW.tier IS NOT NULL AND NEW.tier NOT IN ('Silver','Gold','Platinum')
BEGIN SELECT RAISE(ABORT, 'trainers.tier must be Silver, Gold, or Platinum'); END;

CREATE TRIGGER IF NOT EXISTS trg_feedbacks_priority_insert
BEFORE INSERT ON feedbacks
WHEN NEW.priority IS NOT NULL AND NEW.priority NOT IN ('low','medium','high')
BEGIN SELECT RAISE(ABORT, 'feedbacks.priority must be low, medium, or high'); END;
CREATE TRIGGER IF NOT EXISTS trg_feedbacks_priority_update
BEFORE UPDATE OF priority ON feedbacks
WHEN NEW.priority IS NOT NULL AND NEW.priority NOT IN ('low','medium','high')
BEGIN SELECT RAISE(ABORT, 'feedbacks.priority must be low, medium, or high'); END;
CREATE TRIGGER IF NOT EXISTS trg_feedbacks_status_insert
BEFORE INSERT ON feedbacks
WHEN NEW.status IS NOT NULL AND NEW.status NOT IN ('Open','In progress','Resolved')
BEGIN SELECT RAISE(ABORT, 'feedbacks.status is invalid'); END;
CREATE TRIGGER IF NOT EXISTS trg_feedbacks_status_update
BEFORE UPDATE OF status ON feedbacks
WHEN NEW.status IS NOT NULL AND NEW.status NOT IN ('Open','In progress','Resolved')
BEGIN SELECT RAISE(ABORT, 'feedbacks.status is invalid'); END;

CREATE INDEX IF NOT EXISTS idx_member_portal_attempts_lock
ON member_portal_login_attempts(gym_id, locked_until);

UPDATE relational_schema_manifest
SET migration_version='0005', notes='Source schema checked against public-schema.sql; additive membership-plan parity columns and CHECK-equivalent triggers added.'
WHERE table_name='membership_plans';
