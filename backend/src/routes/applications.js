import { Router } from 'express';
import { STATUSES, WORK_TYPES } from '../db.js';
import {
  changeStatus,
  getOwnedApplication,
  recordEvent,
} from '../services/applicationService.js';
import { HttpError } from '../utils/httpError.js';
import { ok } from '../utils/response.js';
import { parseId, validate } from '../utils/validate.js';

const FIELD_RULES = {
  company: { label: 'Nama perusahaan', required: true, max: 120 },
  position: { label: 'Posisi', required: true, max: 120 },
  location: { label: 'Lokasi', max: 120 },
  work_type: { label: 'Tipe kerja', oneOf: WORK_TYPES, default: 'onsite' },
  status: { label: 'Status', oneOf: STATUSES },
  source_url: { label: 'Tautan lowongan', type: 'url', max: 500 },
  allowance: { label: 'Uang saku', type: 'int', min: 0 },
  deadline_date: { label: 'Batas pendaftaran', type: 'date' },
  applied_date: { label: 'Tanggal melamar', type: 'date' },
  follow_up_date: { label: 'Tanggal tindak lanjut', type: 'date' },
  contact_name: { label: 'Nama kontak', max: 120 },
  contact_email: { label: 'Email kontak', type: 'email', max: 150 },
  notes: { label: 'Catatan', max: 2000 },
};
const COLUMNS = Object.keys(FIELD_RULES).filter((c) => c !== 'status');

const SORTS = {
  recent: 'a.updated_at DESC, a.id DESC',
  newest: 'a.created_at DESC, a.id DESC',
  company: 'a.company COLLATE NOCASE ASC',
  deadline: 'a.deadline_date IS NULL, a.deadline_date ASC',
  applied: 'a.applied_date IS NULL, a.applied_date DESC',
};

const LIST_SQL = `
  SELECT a.*,
    (SELECT COUNT(*) FROM interviews i WHERE i.application_id = a.id) AS interview_count,
    (SELECT MIN(i.scheduled_at) FROM interviews i
       WHERE i.application_id = a.id AND i.status = 'scheduled'
         AND i.scheduled_at >= @now) AS next_interview_at
  FROM applications a`;

export default function applicationRoutes(db) {
  const router = Router();

  /** GET /applications?status=&q=&work_type=&sort= */
  router.get('/', (req, res) => {
    const { status, q, work_type, sort = 'recent', now } = req.query;
    const where = ['a.user_id = @userId'];
    const params = { userId: req.user.id, now: typeof now === 'string' ? now : new Date().toISOString().slice(0, 16) };

    if (status) {
      const list = String(status).split(',').filter((s) => STATUSES.includes(s));
      if (!list.length) throw new HttpError(422, 'Status filter tidak valid.');
      where.push(`a.status IN (${list.map((_, i) => `@s${i}`).join(', ')})`);
      list.forEach((s, i) => (params[`s${i}`] = s));
    }
    if (work_type) {
      if (!WORK_TYPES.includes(work_type)) throw new HttpError(422, 'Tipe kerja filter tidak valid.');
      where.push('a.work_type = @workType');
      params.workType = work_type;
    }
    if (q && String(q).trim()) {
      const like = (col) => `${col} LIKE @q ESCAPE '\\'`;
      where.push(`(${['a.company', 'a.position', 'a.location'].map(like).join(' OR ')})`);
      params.q = `%${String(q).trim().replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
    }
    if (!SORTS[sort]) throw new HttpError(422, 'Pengurutan tidak valid.');

    const rows = db.prepare(`${LIST_SQL} WHERE ${where.join(' AND ')} ORDER BY ${SORTS[sort]}`).all(params);
    ok(res, 'Daftar lamaran berhasil dimuat.', { applications: rows });
  });

  /** GET /applications/:id → lamaran + wawancara + riwayat tahapan */
  router.get('/:id', (req, res) => {
    const id = parseId(req.params.id);
    getOwnedApplication(db, req.user.id, id);
    const application = db.prepare(`${LIST_SQL} WHERE a.id = @id`).get({ id, now: new Date().toISOString().slice(0, 16) });
    application.interviews = db
      .prepare('SELECT * FROM interviews WHERE application_id = ? ORDER BY scheduled_at ASC')
      .all(id);
    application.events = db
      .prepare('SELECT * FROM application_events WHERE application_id = ? ORDER BY created_at ASC, id ASC')
      .all(id);
    ok(res, 'Detail lamaran berhasil dimuat.', { application });
  });

  /** POST /applications → application_id */
  router.post('/', (req, res) => {
    const data = validate(req.body, FIELD_RULES);
    const status = data.status ?? 'saved';
    const appliedDate = data.applied_date ?? (status !== 'saved' ? new Date().toISOString().slice(0, 10) : null);

    const insert = db.transaction(() => {
      const cols = COLUMNS.filter((c) => c !== 'applied_date');
      const info = db
        .prepare(
          `INSERT INTO applications (user_id, ${cols.join(', ')}, applied_date, status)
           VALUES (@user_id, ${cols.map((c) => `@${c}`).join(', ')}, @applied_date, @status)`,
        )
        .run({
          user_id: req.user.id,
          ...Object.fromEntries(cols.map((c) => [c, data[c] ?? null])),
          work_type: data.work_type,
          applied_date: appliedDate,
          status,
        });
      recordEvent(db, info.lastInsertRowid, null, status, 'Lamaran dibuat');
      return Number(info.lastInsertRowid);
    });

    ok(res, 'Lamaran berhasil ditambahkan.', { application_id: insert() }, 201);
  });

  /** PUT /applications/:id */
  router.put('/:id', (req, res) => {
    const id = parseId(req.params.id);
    const current = getOwnedApplication(db, req.user.id, id);
    const data = validate(req.body, FIELD_RULES);

    db.transaction(() => {
      db.prepare(
        `UPDATE applications SET ${COLUMNS.map((c) => `${c} = @${c}`).join(', ')},
                updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')
          WHERE id = @id AND user_id = @user_id`,
      ).run({
        id,
        user_id: req.user.id,
        ...Object.fromEntries(COLUMNS.map((c) => [c, data[c] ?? null])),
        work_type: data.work_type,
      });
      if (data.status) changeStatus(db, { ...current, applied_date: data.applied_date ?? current.applied_date }, data.status);
    })();

    ok(res, 'Lamaran berhasil diperbarui.');
  });

  /** PATCH /applications/:id/status */
  router.patch('/:id/status', (req, res) => {
    const id = parseId(req.params.id);
    const current = getOwnedApplication(db, req.user.id, id);
    const { status, note } = validate(req.body, {
      status: { label: 'Status', required: true, oneOf: STATUSES },
      note: { label: 'Catatan', max: 500 },
    });
    changeStatus(db, current, status, note);
    ok(res, 'Tahapan lamaran berhasil diperbarui.');
  });

  /** DELETE /applications/:id */
  router.delete('/:id', (req, res) => {
    const id = parseId(req.params.id);
    getOwnedApplication(db, req.user.id, id);
    db.prepare('DELETE FROM applications WHERE id = ?').run(id);
    ok(res, 'Lamaran berhasil dihapus.');
  });

  return router;
}
