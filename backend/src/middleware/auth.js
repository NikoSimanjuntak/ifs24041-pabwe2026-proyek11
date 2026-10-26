import jwt from 'jsonwebtoken';
import { HttpError } from '../utils/httpError.js';

export const signToken = (user, config) =>
  jwt.sign({ sub: user.id }, config.jwtSecret, { expiresIn: config.jwtExpiresIn });

/** Memverifikasi header Authorization: Bearer <token> dan memuat req.user. */
export const requireAuth = (db, config) => (req, _res, next) => {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) {
    throw new HttpError(401, 'Token autentikasi tidak ditemukan.');
  }

  let payload;
  try {
    payload = jwt.verify(token, config.jwtSecret);
  } catch {
    throw new HttpError(401, 'Token tidak valid atau sudah kedaluwarsa.');
  }

  const user = db
    .prepare('SELECT id, name, email, created_at, updated_at FROM users WHERE id = ?')
    .get(payload.sub);
  if (!user) throw new HttpError(401, 'Pengguna tidak ditemukan.');

  req.user = user;
  next();
};
