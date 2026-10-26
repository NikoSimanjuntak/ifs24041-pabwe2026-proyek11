import { createApp } from './app.js';
import config from './config.js';
import { openDatabase } from './db.js';

const db = openDatabase(config.dbPath);
const app = createApp(db, config);

const server = app.listen(config.port, () => {
  console.log(`InternTrack API berjalan di http://localhost:${config.port} (${config.env})`);
});

const shutdown = () => {
  server.close(() => {
    db.close();
    process.exit(0);
  });
};
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
