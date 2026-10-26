import { STATUSES } from '../db.js';
import { notFound } from '../utils/httpError.js';

const today = () => new Date().toISOString().slice(0, 10);

/** Mengambil lamaran milik pengguna (404 bila bukan miliknya). */
export function getOwnedApplication(db, userId, id) {
  const row = db.prepare('SELECT * FROM applications WHERE id = ? AND user_id = ?').get(id, userId);
  if (!row) throw notFound('Lamaran');
  return row;
}

export function recordEvent(db, applicationId, fromStatus, toStatus, note = null) {
  db.prepare(
    'INSERT INTO application_events (application_id, from_status, to_status, note) VALUES (?, ?, ?, ?)',
  ).run(applicationId, fromStatus, toStatus, note || null);
}

/**
 * Mengubah tahapan lamaran + mencatat riwayat.
 * - saat pertama kali berpindah dari "saved" ke tahap lain, applied_date terisi otomatis.
 * Mengembalikan true jika status benar-benar berubah.
 */
export function changeStatus(db, application, toStatus, note = null) {
  if (application.status === toStatus) return false;

  const fillAppliedDate = !application.applied_date && toStatus !== 'saved';
  db.prepare(
    `UPDATE applications
        SET status = ?, applied_date = COALESCE(applied_date, ?),
            updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')
      WHERE id = ?`,
  ).run(toStatus, fillAppliedDate ? today() : null, application.id);

  recordEvent(db, application.id, application.status, toStatus, note);
  return true;
}

/** Indeks tahap, dipakai untuk menentukan apakah wawancara perlu memajukan tahap. */
export const stageIndex = (status) => STATUSES.indexOf(status);
