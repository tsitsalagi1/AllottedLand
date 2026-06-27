-- AllottedLand.com v0.26 Cloudflare D1 schema
-- Binding name expected by Pages Functions: DB

CREATE TABLE IF NOT EXISTS approved_records (
  id TEXT PRIMARY KEY,
  submission_id TEXT,
  verified_name TEXT NOT NULL,
  first_name TEXT,
  middle_name TEXT,
  last_name TEXT,
  tribe TEXT,
  map_number TEXT,
  number_shown_on_map TEXT,
  number_type TEXT,
  roll_number TEXT,
  enrollment_number TEXT,
  census_card_number TEXT,
  allotment_number TEXT,
  status_restriction_notation TEXT,
  loc_page INTEGER,
  township_range TEXT,
  township TEXT,
  range TEXT,
  section TEXT,
  county TEXT,
  state TEXT,
  legal_description TEXT,
  source_link TEXT,
  confidence TEXT,
  needs_human_review TEXT,
  notes TEXT,
  record_json TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS pending_records (
  id TEXT PRIMARY KEY,
  submission_id TEXT,
  verified_name TEXT NOT NULL,
  first_name TEXT,
  middle_name TEXT,
  last_name TEXT,
  tribe TEXT,
  map_number TEXT,
  number_shown_on_map TEXT,
  number_type TEXT,
  roll_number TEXT,
  enrollment_number TEXT,
  census_card_number TEXT,
  allotment_number TEXT,
  status_restriction_notation TEXT,
  loc_page INTEGER,
  township_range TEXT,
  township TEXT,
  range TEXT,
  section TEXT,
  county TEXT,
  state TEXT,
  legal_description TEXT,
  source_link TEXT,
  confidence TEXT,
  needs_human_review TEXT,
  notes TEXT,
  record_json TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS section_status (
  id TEXT PRIMARY KEY,
  township_range TEXT NOT NULL,
  loc_page INTEGER,
  section TEXT NOT NULL,
  status TEXT NOT NULL,
  rows_count INTEGER DEFAULT 0,
  reviewer_contact TEXT,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS grid_calibrations (
  id TEXT PRIMARY KEY,
  township_range TEXT NOT NULL,
  loc_page INTEGER,
  grid_json TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS submission_log (
  id TEXT PRIMARY KEY,
  township_range TEXT,
  loc_page INTEGER,
  reviewer_contact TEXT,
  record_count INTEGER,
  status TEXT,
  payload_json TEXT,
  created_at TEXT NOT NULL,
  user_agent TEXT
);

CREATE INDEX IF NOT EXISTS idx_approved_name ON approved_records(last_name, first_name);
CREATE INDEX IF NOT EXISTS idx_approved_trs ON approved_records(township_range, section);
CREATE INDEX IF NOT EXISTS idx_pending_trs ON pending_records(township_range, section);
CREATE INDEX IF NOT EXISTS idx_section_status_tr ON section_status(township_range, section);
