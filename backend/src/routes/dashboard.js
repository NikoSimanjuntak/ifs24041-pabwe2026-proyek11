import { Router } from 'express';
import { STATUSES } from '../db.js';
import { ok } from '../utils/response.js';
import { isDate, isDateTime } from '../utils/validate.js';

const ACTIVE = ['applied', 'screening', 'interview', 'offer'];
const RESPONDED = ['screening', 'interview', 'offer', 'accepted', 'rejected'];

/** Daftar `count` bulan terakhir (YYYY-MM), diakhiri bulan dari `today`. */
export const lastMonths = (today, count = 6) => {
  const [y, m] = today.split('-').map(Number);
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(Date.UTC(y, m - 1 - (count - 1 - i), 1));
    return d.toISOString().slice(0, 7);
  });
};

export default function dashboardRoutes(db) {
  const router = Router();

  /** GET /dashboard/summary?today=YYYY-MM-DD&now=YYYY-MM-DDTHH:mm */
  router.get('/summary', (req, res) => {
    const iso = new Date().toISOString();
    const today = isDate(req.query.today) ? req.query.today : iso.slice(0, 10);
    const now = isDateTime(req.query.now) ? req.query.now : iso.slice(0, 16);
    const userId = req.user.id;

    const by_status = Object.fromEntries(STATUSES.map((s) => [s, 0]));
    db.prepare('SELECT status, COUNT(*) AS n FROM applications WHERE user_id = ? GROUP BY status')
      .all(userId)
      .forEach((r) => (by_status[r.status] = r.n));

    const total = Object.values(by_status).reduce((a, b) => a + b, 0);
    const submitted = total - by_status.saved;
    const responded = RESPONDED.reduce((sum, s) => sum + by_status[s], 0);

    const upcoming_interviews = db
      .prepare(
        `SELECT i.*, a.company, a.position
           FROM interviews i JOIN applications a ON a.id = i.application_id
          WHERE i.user_id = ? AND i.status = 'scheduled' AND i.scheduled_at >= ?
          ORDER BY i.scheduled_at ASC LIMIT 5`,
      )
      .all(userId, now);

    const follow_ups = db
      .prepare(
        `SELECT id, company, position, status, follow_up_date
           FROM applications
          WHERE user_id = ? AND follow_up_date IS NOT NULL AND follow_up_date <= date(?, '+7 day')
            AND status IN ('applied', 'screening')
          ORDER BY follow_up_date ASC LIMIT 5`,
      )
      .all(userId, today)
      .map((r) => ({ ...r, overdue: r.follow_up_date < today }));

    const deadlines = db
      .prepare(
        `SELECT id, company, position, deadline_date
           FROM applications
          WHERE user_id = ? AND status = 'saved' AND deadline_date >= ?
          ORDER BY deadline_date ASC LIMIT 5`,
      )
      .all(userId, today);

    const months = lastMonths(today);
    const counts = Object.fromEntries(
      db
        .prepare(
          `SELECT substr(applied_date, 1, 7) AS month, COUNT(*) AS n
             FROM applications WHERE user_id = ? AND applied_date >= ? GROUP BY month`,
        )
        .all(userId, `${months[0]}-01`)
        .map((r) => [r.month, r.n]),
    );

    ok(res, 'Ringkasan dashboard berhasil dimuat.', {
      total,
      by_status,
      active: ACTIVE.reduce((sum, s) => sum + by_status[s], 0),
      response_rate: submitted ? Math.round((responded / submitted) * 100) : 0,
      upcoming_interviews,
      follow_ups,
      deadlines,
      monthly: months.map((month) => ({ month, total: counts[month] ?? 0 })),
    });
  });

  return router;
}
