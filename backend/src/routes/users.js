import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { HttpError } from '../utils/httpError.js';
import { ok } from '../utils/response.js';
import { validate } from '../utils/validate.js';

export default function userRoutes(db) {
  const router = Router();

  /** GET /users/me */
  router.get('/me', (req, res) => ok(res, 'Profil berhasil dimuat.', { user: req.user }));

  /** PUT /users/me */
  router.put('/me', (req, res) => {
    const { name, email } = validate(req.body, {
      name: { label: 'Nama', required: true, min: 2, max: 100 },
      email: { label: 'Email', required: true, type: 'email', max: 150 },
    });

    const taken = db
      .prepare('SELECT 1 FROM users WHERE email = ? AND id != ?')
      .get(email, req.user.id);
    if (taken) throw new HttpError(409, 'Email sudah dipakai akun lain.', { email: ['Email sudah dipakai akun lain.'] });

    db.prepare(
      `UPDATE users SET name = ?, email = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = ?`,
    ).run(name, email, req.user.id);

    const user = db
      .prepare('SELECT id, name, email, created_at, updated_at FROM users WHERE id = ?')
      .get(req.user.id);
    ok(res, 'Profil berhasil diperbarui.', { user });
  });

  /** PUT /users/me/password */
  router.put('/me/password', (req, res) => {
    const { password, new_password, new_password_confirmation } = validate(req.body, {
      password: { label: 'Kata sandi lama', required: true },
      new_password: { label: 'Kata sandi baru', required: true, min: 6, max: 72 },
      new_password_confirmation: { label: 'Konfirmasi kata sandi', required: true },
    });

    if (new_password !== new_password_confirmation) {
      throw new HttpError(422, 'Konfirmasi kata sandi tidak cocok.', {
        new_password_confirmation: ['Konfirmasi kata sandi tidak cocok.'],
      });
    }

    const row = db.prepare('SELECT password_hash FROM users WHERE id = ?').get(req.user.id);
    if (!bcrypt.compareSync(password, row.password_hash)) {
      throw new HttpError(422, 'Kata sandi lama salah.', { password: ['Kata sandi lama salah.'] });
    }

    db.prepare(
      `UPDATE users SET password_hash = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = ?`,
    ).run(bcrypt.hashSync(new_password, 10), req.user.id);

    ok(res, 'Kata sandi berhasil diubah.');
  });

  return router;
}
