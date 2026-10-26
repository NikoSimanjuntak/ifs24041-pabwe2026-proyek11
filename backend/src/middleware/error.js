import { HttpError } from '../utils/httpError.js';

export const notFoundHandler = (req, _res, next) =>
  next(new HttpError(404, `Endpoint ${req.method} ${req.path} tidak tersedia.`));

// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, _req, res, _next) => {
  if (err instanceof HttpError) {
    return res.status(err.status).json({ status: 'fail', message: err.message, data: err.data });
  }
  if (err?.type === 'entity.parse.failed') {
    return res.status(400).json({ status: 'fail', message: 'Body JSON tidak valid.', data: null });
  }
  if (err?.type === 'entity.too.large') {
    return res.status(413).json({ status: 'fail', message: 'Ukuran request terlalu besar.', data: null });
  }
  if (process.env.NODE_ENV !== 'test') console.error(err);
  return res
    .status(500)
    .json({ status: 'error', message: 'Terjadi kesalahan pada server.', data: null });
};
