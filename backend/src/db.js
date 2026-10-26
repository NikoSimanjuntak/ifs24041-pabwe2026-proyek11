import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';

export const STATUSES = [
  'saved',
  'applied',
  'screening',
  'interview',
  'offer',
  'accepted',
  'rejected',
  'withdrawn',
];
export const WORK_TYPES = ['onsite', 'remote', 'hybrid'];
export const INTERVIEW_TYPES = ['online', 'onsite', 'phone'];
export const INTERVIEW_STATUSES = ['scheduled', 'done', 'cancelled'];

const list = (items) => items.map((i) => `'${i}'`).join(', ');

const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  name          TEXT NOT NULL,
  email         TEXT NOT NULL UNIQUE COLLATE NOCASE,
  password_hash TEXT NOT NULL,
  created_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE TABLE IF NOT EXISTS applications (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id        INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  company        TEXT NOT NULL,
  position       TEXT NOT NULL,
  location       TEXT,
  work_type      TEXT NOT NULL DEFAULT 'onsite' CHECK (work_type IN (${list(WORK_TYPES)})),
  status         TEXT NOT NULL DEFAULT 'saved'  CHECK (status IN (${list(STATUSES)})),
  source_url     TEXT,
  allowance      INTEGER CHECK (allowance IS NULL OR allowance >= 0),
  deadline_date  TEXT,
  applied_date   TEXT,
  follow_up_date TEXT,
  contact_name   TEXT,
  contact_email  TEXT,
  notes          TEXT,
  created_at     TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at     TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX IF NOT EXISTS idx_applications_user ON applications(user_id, status);

CREATE TABLE IF NOT EXISTS application_events (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  application_id INTEGER NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  from_status    TEXT,
  to_status      TEXT NOT NULL,
  note           TEXT,
  created_at     TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX IF NOT EXISTS idx_events_application ON application_events(application_id);

CREATE TABLE IF NOT EXISTS interviews (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  application_id INTEGER NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  user_id        INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title          TEXT NOT NULL,
  type           TEXT NOT NULL DEFAULT 'online'    CHECK (type IN (${list(INTERVIEW_TYPES)})),
  scheduled_at   TEXT NOT NULL,
  location       TEXT,
  interviewer    TEXT,
  notes          TEXT,
  status         TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN (${list(INTERVIEW_STATUSES)})),
  created_at     TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at     TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX IF NOT EXISTS idx_interviews_user ON interviews(user_id, scheduled_at);
`;

/** Membuka (dan menyiapkan) database SQLite. Gunakan ':memory:' untuk pengujian. */
export function openDatabase(dbPath = ':memory:') {
  if (dbPath !== ':memory:') {
    fs.mkdirSync(path.dirname(path.resolve(dbPath)), { recursive: true });
  }
  const db = new Database(dbPath);
  if (dbPath !== ':memory:') db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  db.exec(SCHEMA);
  return db;
}
