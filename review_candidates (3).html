-- AllottedLand.com v0.30 migration
-- Run in Cloudflare D1 Console after v0.30 deploy.

CREATE TABLE IF NOT EXISTS pending_testimonials (
  id TEXT PRIMARY KEY,
  display_name TEXT,
  tribe TEXT,
  story TEXT NOT NULL,
  publication_choice TEXT,
  contact TEXT,
  consent_json TEXT NOT NULL,
  title TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS approved_testimonials (
  id TEXT PRIMARY KEY,
  title TEXT,
  display_name TEXT,
  tribe TEXT,
  story TEXT NOT NULL,
  publication_choice TEXT,
  approved_at TEXT NOT NULL,
  record_json TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS pending_evidence (
  id TEXT PRIMARY KEY,
  family_name TEXT,
  tribe TEXT,
  county TEXT,
  decade TEXT,
  loss_method TEXT,
  source_type TEXT,
  summary TEXT NOT NULL,
  source_note TEXT,
  contact TEXT,
  consent_json TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS approved_evidence (
  id TEXT PRIMARY KEY,
  family_name TEXT,
  tribe TEXT,
  county TEXT,
  decade TEXT,
  loss_method TEXT,
  source_type TEXT,
  summary TEXT NOT NULL,
  source_note TEXT,
  approved_at TEXT NOT NULL,
  record_json TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_pending_testimonials_created ON pending_testimonials(created_at);
CREATE INDEX IF NOT EXISTS idx_approved_testimonials_approved ON approved_testimonials(approved_at);
CREATE INDEX IF NOT EXISTS idx_pending_evidence_created ON pending_evidence(created_at);
CREATE INDEX IF NOT EXISTS idx_approved_evidence_loss ON approved_evidence(loss_method, decade, county);
