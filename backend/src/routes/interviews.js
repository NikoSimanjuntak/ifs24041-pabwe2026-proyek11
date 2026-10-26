import { Router } from 'express';
import { INTERVIEW_STATUSES, INTERVIEW_TYPES } from '../db.js';
import {
  changeStatus,
  getOwnedApplication,
  stageIndex,
} from '../services/applicationService.js';
import { HttpError, notFound } from '../utils/httpError.js';
import { ok } from '../utils/response.js';
import { isDateTime, parseId, validate } from '../utils/validate.js';

const RULES = {
  title: { label: 'Judul wawancara', required: true, max: 120 },
  type: { label: 'Jenis wawancara', oneOf: INTERVIEW_TYPES, default: 'online' },
  scheduled_at: { label: 'Waktu wawancara', required: true, type: 'datetime' },
  location: { label: 'Lokasi / tautan', max: 300 },
  interviewer: { label: 'Pewawancara', max: 120 },
  notes: { label: 'Catatan', max: 2000 },
  status: { label: 'Status', oneOf: INTERVIEW_STATUSES, default: 'scheduled' },
};

const SELECT = `
  SELECT i.*, a.company, a.position
    FROM interviews i JOIN applications a ON a.id = i.application_id`;

const nowLocal = () => new Date().toISOString().slice(0, 16);

export default function interviewRoutes(db, auth) {
  const router = Router();
  // Auth hanya untuk path milik router ini, agar endpoint tak dikenal tetap 404.
  router.use(['/interviews', '/applications/:applicationId/interviews'], auth);

  const getOwned = (userId, id) => {
    const row = db.prepare(`${SELECT} WHERE i.id = ? AND i.user_id = ?`).get(id, userId);
    if (!row) throw notFound('Jadwal wawancara');
    return row;
  };

  /** GET /interviews?scope=upcoming|past|all&now=YYYY-MM-DDTHH:mm */
  router.get('/interviews', (req, res) => {
    const { scope = 'all', now } = req.query;
    if (!['upcoming', 'past', 'all'].includes(scope)) throw new HttpError(422, 'Scope tidak valid.');
    const ref = isDateTime(now) ? now : nowLocal();

    let where = 'i.user_id = @userId';
    let order = 'i.scheduled_at ASC';
    if (scope === 'upcoming') where += " AND i.status = 'scheduled' AND i.scheduled_at >= @ref";
    if (scope === 'past') {
      where += " AND (i.status != 'scheduled' OR i.scheduled_at < @ref)";
      order = 'i.scheduled_at DESC';
    }

    const rows = db.prepare(`${SELECT} WHERE ${where} ORDER BY ${order}`).all({ userId: req.user.id, ref });
    ok(res, 'Jadwal wawancara berhasil dimuat.', { interviews: rows });
  });

  /** POST /applications/:applicationId/interviews → interview_id */
  router.post('/applications/:applicationId/interviews', (req, res) => {
    const applicationId = parseId(req.params.applicationId);
    const application = getOwnedApplication(db, req.user.id, applicationId);
    const data = validate(req.body, RULES);

    const id = db.transaction(() => {
      const info = db
        .prepare(
          `INSERT INTO interviews (application_id, user_id, title, type, scheduled_at, location, interviewer, notes, status)
           VALUES (@application_id, @user_id, @title, @type, @scheduled_at, @location, @interviewer, @notes, @status)`,
        )
        .run({
          application_id: applicationId,
          user_id: req.user.id,
          title: data.title,
          type: data.type,
          scheduled_at: data.scheduled_at,
          location: data.location ?? null,
          interviewer: data.interviewer ?? null,
          notes: data.notes ?? null,
          status: data.status,
        });
      // Menjadwalkan wawancara otomatis memajukan lamaran ke tahap "Wawancara".
      if (stageIndex(application.status) < stageIndex('interview')) {
        changeStatus(db, application, 'interview', 'Jadwal wawancara ditambahkan');
      }
      return Number(info.lastInsertRowid);
    })();

    ok(res, 'Jadwal wawancara berhasil ditambahkan.', { interview_id: id }, 201);
  });

  /** GET /interviews/:id */
  router.get('/interviews/:id', (req, res) => {
    ok(res, 'Detail wawancara berhasil dimuat.', { interview: getOwned(req.user.id, parseId(req.params.id)) });
  });

  /** PUT /interviews/:id */
  router.put('/interviews/:id', (req, res) => {
    const id = parseId(req.params.id);
    getOwned(req.user.id, id);
    const data = validate(req.body, RULES);

    db.prepare(
      `UPDATE interviews
          SET title = @title, type = @type, scheduled_at = @scheduled_at, location = @location,
              interviewer = @interviewer, notes = @notes, status = @status,
              updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')
        WHERE id = @id AND user_id = @user_id`,
    ).run({
      id,
      user_id: req.user.id,
      title: data.title,
      type: data.type,
      scheduled_at: data.scheduled_at,
      location: data.location ?? null,
      interviewer: data.interviewer ?? null,
      notes: data.notes ?? null,
      status: data.status,
    });

    ok(res, 'Jadwal wawancara berhasil diperbarui.');
  });

  /** DELETE /interviews/:id */
  router.delete('/interviews/:id', (req, res) => {
    const id = parseId(req.params.id);
    getOwned(req.user.id, id);
    db.prepare('DELETE FROM interviews WHERE id = ?').run(id);
    ok(res, 'Jadwal wawancara berhasil dihapus.');
  });

  return router;
}
