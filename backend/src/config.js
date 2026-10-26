import 'dotenv/config';

const env = process.env.NODE_ENV || 'development';
const DEV_SECRET = 'dev-only-secret-jangan-dipakai-di-produksi';

/** Membaca konfigurasi dari environment variable (lihat .env.example). */
export const loadConfig = (source = process.env) => {
  const nodeEnv = source.NODE_ENV || env;
  const jwtSecret = source.JWT_SECRET || DEV_SECRET;

  if (nodeEnv === 'production' && (jwtSecret === DEV_SECRET || jwtSecret.length < 32)) {
    throw new Error('JWT_SECRET wajib diisi (minimal 32 karakter) pada mode production.');
  }

  return {
    env: nodeEnv,
    port: Number(source.PORT) || 3000,
    dbPath: source.DB_PATH || './data/interntrack.db',
    jwtSecret,
    jwtExpiresIn: source.JWT_EXPIRES_IN || '7d',
    corsOrigin: source.CORS_ORIGIN || 'http://localhost:5173',
    rateLimit: nodeEnv !== 'test',
  };
};

export default loadConfig();
