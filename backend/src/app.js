import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { requireAuth } from './middleware/auth.js';
import { errorHandler, notFoundHandler } from './middleware/error.js';
import applicationRoutes from './routes/applications.js';
import authRoutes from './routes/auth.js';
import dashboardRoutes from './routes/dashboard.js';
import interviewRoutes from './routes/interviews.js';
import userRoutes from './routes/users.js';
import { ok } from './utils/response.js';

/** Membangun aplikasi Express (dipisahkan dari server.js agar mudah diuji). */
export function createApp(db, config) {
  const app = express();
  const auth = requireAuth(db, config);

  const origins = config.corsOrigin.split(',').map((o) => o.trim());
  app.disable('x-powered-by');
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.use(cors({ origin: origins.includes('*') ? '*' : origins }));
  app.use(express.json({ limit: '100kb' }));

  app.get('/', (_req, res) =>
    ok(res, 'InternTrack API berjalan.', { name: 'InternTrack API', version: '1.0.0', docs: '/api/health' }),
  );

  const api = express.Router();
  api.get('/health', (_req, res) => ok(res, 'OK', { uptime: process.uptime() }));
  api.use('/auth', authRoutes(db, config));
  api.use('/users', auth, userRoutes(db));
  api.use('/applications', auth, applicationRoutes(db));
  api.use('/dashboard', auth, dashboardRoutes(db));
  api.use('/', interviewRoutes(db, auth));
  app.use('/api', api);

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
