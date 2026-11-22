-- Phase 7: normalized D1 business tables.
-- Additive only: does not drop or rewrite the Phase 1-6 transition store,
-- existing auth tables, or any imported records.
PRAGMA foreign_keys = ON;

-- Extend the Phase 1-6 gyms table without changing existing columns.
ALTER TABLE gyms ADD COLUMN address TEXT;
ALTER TABLE gyms ADD COLUMN phone TEXT;
ALTER TABLE gyms ADD COLUMN email TEXT;
ALTER TABLE gyms ADD COLUMN gstin TEXT;
ALTER TABLE gyms ADD COLUMN invoice_prefix TEXT;
ALTER TABLE gyms ADD COLUMN latitude REAL;
ALTER TABLE gyms ADD COLUMN longitude REAL;
ALTER TABLE gyms ADD COLUMN attendance_radius_meters INTEGER;

CREATE TABLE IF NOT EXISTS gym_users (
  id TEXT PRIMARY KEY,
  gym_id TEXT NOT NULL,
  role TEXT NOT NULL,
  created_at TEXT,
  permissions_json TEXT NOT NULL DEFAULT '{}',
  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0,1)),
  FOREIGN KEY (id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (gym_id) REFERENCES gyms(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_gym_users_gym_role ON gym_users(gym_id, role);

CREATE TABLE IF NOT EXISTS app_settings (
  id TEXT PRIMARY KEY,
  gym_id TEXT,
  setting_key TEXT NOT NULL,
  setting_value_json TEXT NOT NULL DEFAULT 'null',
  created_at TEXT,
  updated_at TEXT,
  UNIQUE(gym_id, setting_key),
  FOREIGN KEY (gym_id) REFERENCES gyms(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_app_settings_gym ON app_settings(gym_id);

CREATE TABLE IF NOT EXISTS membership_plans (
  id TEXT PRIMARY KEY,
  gym_id TEXT NOT NULL,
  name TEXT NOT NULL,
  amount REAL,
  duration_months INTEGER,
  metadata_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT,
  updated_at TEXT,
  FOREIGN KEY (gym_id) REFERENCES gyms(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_membership_plans_gym ON membership_plans(gym_id);

CREATE TABLE IF NOT EXISTS members (
  id TEXT PRIMARY KEY,
  gym_id TEXT NOT NULL,
  member_code TEXT,
  attendance_number TEXT,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  date_of_birth TEXT,
  gender TEXT,
  address TEXT,
  emergency_contact TEXT,
  diet_preference TEXT,
  referred_by_member_id TEXT,
  plan_name TEXT,
  membership_plan_id TEXT,
  start_date TEXT,
  expiry_date TEXT,
  status TEXT,
  visits INTEGER DEFAULT 0,
  amount REAL,
  paid REAL,
  due REAL,
  photo_url TEXT,
  notes TEXT,
  metadata_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT,
  updated_at TEXT,
  body_fat TEXT,
  membership_amount REAL,
  paid_amount REAL,
  photo TEXT,
  referral_points INTEGER,
  dob TEXT,
  due_amount REAL,
  height TEXT,
  weight TEXT,
  trainer_name TEXT,
  referral_source TEXT,
  referred_clients INTEGER,
  legacy_id TEXT,
  FOREIGN KEY (gym_id) REFERENCES gyms(id) ON DELETE CASCADE,
  FOREIGN KEY (membership_plan_id) REFERENCES membership_plans(id) ON DELETE SET NULL,
  FOREIGN KEY (referred_by_member_id) REFERENCES members(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_members_gym_name ON members(gym_id, name);
CREATE INDEX IF NOT EXISTS idx_members_gym_phone ON members(gym_id, phone);
CREATE INDEX IF NOT EXISTS idx_members_gym_code ON members(gym_id, member_code);
CREATE INDEX IF NOT EXISTS idx_members_gym_expiry ON members(gym_id, expiry_date);

CREATE TABLE IF NOT EXISTS attendance (
  id TEXT PRIMARY KEY,
  gym_id TEXT NOT NULL,
  member_id TEXT,
  member_name TEXT,
  attendance_date TEXT,
  check_in_time TEXT,
  latitude REAL,
  longitude REAL,
  distance_meters REAL,
  source TEXT,
  metadata_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT,
  legacy_id TEXT,
  FOREIGN KEY (gym_id) REFERENCES gyms(id) ON DELETE CASCADE,
  FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_attendance_gym_date ON attendance(gym_id, attendance_date);
CREATE INDEX IF NOT EXISTS idx_attendance_member_date ON attendance(member_id, attendance_date);

CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY,
  gym_id TEXT NOT NULL,
  payment_code TEXT,
  member_id TEXT,
  member_name TEXT,
  amount REAL,
  type TEXT,
  mode TEXT,
  payment_date TEXT,
  invoice_number TEXT,
  notes TEXT,
  metadata_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT,
  legacy_id TEXT,
  payment_mode TEXT,
  payment_type TEXT,
  gst_applicable INTEGER,
  gst_rate REAL,
  taxable_amount REAL,
  cgst_amount REAL,
  sgst_amount REAL,
  invoice_amount REAL,
  paid_amount_at_invoice REAL,
  balance_at_invoice REAL,
  description TEXT,
  FOREIGN KEY (gym_id) REFERENCES gyms(id) ON DELETE CASCADE,
  FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_payments_gym_date ON payments(gym_id, payment_date);
CREATE INDEX IF NOT EXISTS idx_payments_member ON payments(member_id);
CREATE INDEX IF NOT EXISTS idx_payments_invoice ON payments(gym_id, invoice_number);

CREATE TABLE IF NOT EXISTS leads (
  id TEXT PRIMARY KEY,
  gym_id TEXT NOT NULL,
  lead_code TEXT,
  name TEXT,
  phone TEXT,
  email TEXT,
  source TEXT,
  stage TEXT,
  follow_up_date TEXT,
  notes TEXT,
  metadata_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT,
  updated_at TEXT,
  legacy_id TEXT,
  interested_plan TEXT,
  converted_member_code TEXT,
  converted_at TEXT,
  last_contact TEXT,
  FOREIGN KEY (gym_id) REFERENCES gyms(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_leads_gym_stage ON leads(gym_id, stage);
CREATE INDEX IF NOT EXISTS idx_leads_followup ON leads(gym_id, follow_up_date);

CREATE TABLE IF NOT EXISTS trainers (
  id TEXT PRIMARY KEY,
  gym_id TEXT NOT NULL,
  trainer_code TEXT,
  name TEXT NOT NULL,
  phone TEXT,
  specialization TEXT,
  experience REAL,
  status TEXT,
  monthly_salary REAL,
  notes TEXT,
  metadata_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT,
  updated_at TEXT,
  legacy_id TEXT,
  tier TEXT,
  pt_pricing_json TEXT NOT NULL DEFAULT '{}',
  FOREIGN KEY (gym_id) REFERENCES gyms(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_trainers_gym_status ON trainers(gym_id, status);

CREATE TABLE IF NOT EXISTS pt_sessions (
  id TEXT PRIMARY KEY,
  gym_id TEXT NOT NULL,
  member_id TEXT,
  trainer_id TEXT,
  member_name TEXT,
  trainer_name TEXT,
  session_date TEXT,
  session_time TEXT,
  status TEXT,
  amount REAL,
  notes TEXT,
  metadata_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT,
  updated_at TEXT,
  legacy_id TEXT,
  session_type TEXT,
  duration_minutes INTEGER,
  end_time TEXT,
  start_time TEXT,
  plan_name TEXT,
  sessions_total INTEGER,
  sessions_completed INTEGER,
  validity_days INTEGER,
  expiry_date TEXT,
  FOREIGN KEY (gym_id) REFERENCES gyms(id) ON DELETE CASCADE,
  FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE SET NULL,
  FOREIGN KEY (trainer_id) REFERENCES trainers(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_pt_sessions_gym_date ON pt_sessions(gym_id, session_date);
CREATE INDEX IF NOT EXISTS idx_pt_sessions_member ON pt_sessions(member_id);

CREATE TABLE IF NOT EXISTS progress_records (
  id TEXT PRIMARY KEY,
  gym_id TEXT NOT NULL,
  member_id TEXT NOT NULL,
  record_date TEXT,
  weight REAL,
  body_fat REAL,
  chest REAL,
  waist REAL,
  hips REAL,
  arms REAL,
  thighs REAL,
  notes TEXT,
  metadata_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT,
  legacy_id TEXT,
  neck REAL,
  photos_json TEXT NOT NULL DEFAULT '[]',
  FOREIGN KEY (gym_id) REFERENCES gyms(id) ON DELETE CASCADE,
  FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_progress_member_date ON progress_records(member_id, record_date);

CREATE TABLE IF NOT EXISTS workout_plans (
  id TEXT PRIMARY KEY,
  gym_id TEXT NOT NULL,
  name TEXT,
  goal TEXT,
  level TEXT,
  duration_weeks INTEGER,
  trainer TEXT,
  notes TEXT,
  assigned_member_ids_json TEXT NOT NULL DEFAULT '[]',
  exercises_json TEXT NOT NULL DEFAULT '[]',
  metadata_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT,
  updated_at TEXT,
  legacy_id TEXT,
  trainer_name TEXT,
  FOREIGN KEY (gym_id) REFERENCES gyms(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_workout_plans_gym ON workout_plans(gym_id);

CREATE TABLE IF NOT EXISTS diet_plans (
  id TEXT PRIMARY KEY,
  gym_id TEXT NOT NULL,
  name TEXT,
  goal TEXT,
  calories REAL,
  protein REAL,
  duration_weeks INTEGER,
  coach TEXT,
  notes TEXT,
  assigned_member_ids_json TEXT NOT NULL DEFAULT '[]',
  meals_json TEXT NOT NULL DEFAULT '[]',
  metadata_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT,
  updated_at TEXT,
  legacy_id TEXT,
  FOREIGN KEY (gym_id) REFERENCES gyms(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_diet_plans_gym ON diet_plans(gym_id);

CREATE TABLE IF NOT EXISTS communication_logs (
  id TEXT PRIMARY KEY,
  gym_id TEXT NOT NULL,
  member_id TEXT,
  member_name TEXT,
  channel TEXT,
  message TEXT,
  status TEXT,
  sent_at TEXT,
  metadata_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT,
  legacy_id TEXT,
  direction TEXT,
  template TEXT,
  subject TEXT,
  communication_date TEXT,
  communication_time TEXT,
  FOREIGN KEY (gym_id) REFERENCES gyms(id) ON DELETE CASCADE,
  FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_communication_gym_date ON communication_logs(gym_id, communication_date);

CREATE TABLE IF NOT EXISTS feedbacks (
  id TEXT PRIMARY KEY,
  gym_id TEXT NOT NULL,
  member_id TEXT,
  member_name TEXT,
  category TEXT,
  priority TEXT,
  feedback TEXT,
  status TEXT,
  feedback_date TEXT,
  notes TEXT,
  legacy_id TEXT,
  created_at TEXT,
  updated_at TEXT,
  FOREIGN KEY (gym_id) REFERENCES gyms(id) ON DELETE CASCADE,
  FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_feedbacks_gym_status ON feedbacks(gym_id, status);

CREATE TABLE IF NOT EXISTS member_portal_credentials (
  member_id TEXT PRIMARY KEY,
  gym_id TEXT NOT NULL,
  pin_hash TEXT NOT NULL,
  created_at TEXT,
  updated_at TEXT,
  FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE,
  FOREIGN KEY (gym_id) REFERENCES gyms(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS member_portal_login_attempts (
  gym_id TEXT NOT NULL,
  identifier_key TEXT NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  window_started_at TEXT,
  locked_until TEXT,
  updated_at TEXT,
  PRIMARY KEY (gym_id, identifier_key),
  FOREIGN KEY (gym_id) REFERENCES gyms(id) ON DELETE CASCADE
);

-- Keep a schema manifest to make later import parity checks explicit.
CREATE TABLE IF NOT EXISTS relational_schema_manifest (
  table_name TEXT PRIMARY KEY,
  source_table TEXT NOT NULL,
  migration_version TEXT NOT NULL,
  notes TEXT NOT NULL DEFAULT ''
);
INSERT OR IGNORE INTO relational_schema_manifest(table_name,source_table,migration_version,notes) VALUES
('gym_users','gym_users','0004','Maps source permissions JSON to permissions_json'),
('app_settings','app_settings','0004','setting_value JSONB stored as JSON text'),
('membership_plans','membership_plans','0004','Provisional columns; verify source table column export before import'),
('members','members','0004','Member photo/data fields preserved; JSON metadata stored as text'),
('attendance','attendance','0004',''),
('payments','payments','0004',''),
('leads','leads','0004',''),
('trainers','trainers','0004','PT pricing JSON stored as text'),
('pt_sessions','pt_sessions','0004',''),
('progress_records','progress_records','0004','Photos JSON stored as text'),
('workout_plans','workout_plans','0004','Assigned member IDs and exercises stored as JSON text'),
('diet_plans','diet_plans','0004','Assigned member IDs and meals stored as JSON text'),
('communication_logs','communication_logs','0004',''),
('feedbacks','feedbacks','0004',''),
('member_portal_credentials','member_portal_credentials','0004','PIN hashes only; never import raw PINs'),
('member_portal_login_attempts','member_portal_login_attempts','0004','');
