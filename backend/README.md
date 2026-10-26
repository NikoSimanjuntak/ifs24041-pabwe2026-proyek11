# InternTrack — Back-end API

Express 5 + SQLite (better-sqlite3). Dokumentasi endpoint lengkap ada di [README root](../README.md#referensi-api-api).

```bash
npm install
cp .env.example .env
npm run seed   # data contoh (opsional)
npm run dev    # http://localhost:3000
npm test       # 36 tes · npm run coverage untuk coverage
```
Struktur: `src/{app,server,config,db,seed}.js`, `routes/` (auth, users, applications, interviews, dashboard), `services/`, `middleware/`, `utils/`; tes di `tests/`.
Berkas database dibuat otomatis di `DB_PATH` (bawaan `./data/interntrack.db`).
