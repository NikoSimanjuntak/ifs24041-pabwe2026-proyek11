import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { rateLimit } from 'express-rate-limit';
import { signToken } from '../middleware/auth.js';
import { HttpError } from '../utils/httpError.js';
import { ok } from '../utils/response.js';
import { validate } from '../utils/validate.js';

export default function authRoutes(db, config) {
  const router = Router();

  if (config.rateLimit) {
    router.use(
      rateLimit({
        windowMs: 15 * 60 * 1000,
        limit: 50,
        standardHeaders: true,
        legacyHeaders: false,
        message: { status: 'fail', message: 'Terlalu banyak percobaan. Coba lagi nanti.', data: null },
      }),
    );
  }

  /** POST /auth/register */
  router.post('/register', (req, res) => {
    const { name, email, password } = validate(req.body, {
      name: { label: 'Nama', required: true, min: 2, max: 100 },
      email: { label: 'Email', required: true, type: 'email', max: 150 },
      password: { label: 'Kata sandi', required: true, min: 6, max: 72 },
    });

    if (db.prepare('SELECT 1 FROM users WHERE email = ?').get(email)) {
      throw new HttpError(409, 'Email sudah terdaftar.', { email: ['Email sudah terdaftar.'] });
    }

    const hash = bcrypt.hashSync(password, 10);
    const { lastInsertRowid } = db
      .prepare('INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)')
      .run(name, email, hash);

    ok(res, 'Akun berhasil dibuat.', { user_id: Number(lastInsertRowid) }, 201);
  });

  /** POST /auth/login → { token } */
  router.post('/login', (req, res) => {
    const { email, password } = validate(req.body, {
      email: { label: 'Email', required: true, type: 'email' },
      password: { label: 'Kata sandi', required: true },
    });

    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (!user || !bcrypt.compareSync(password, user.password_hash)) {
      throw new HttpError(401, 'Email atau kata sandi salah.');
    }

    ok(res, 'Berhasil masuk.', { token: signToken(user, config) });
  });

  return router;
}
