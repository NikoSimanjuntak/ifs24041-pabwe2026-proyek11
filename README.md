# InternTrack — Pelacak Lamaran Magang

Aplikasi web untuk membantu mahasiswa mengelola **lowongan magang**, mencatat **lamaran**, memantau **tahapan seleksi**, dan mengatur **jadwal wawancara** dalam satu dashboard.

> Proyek 1 — Mata Kuliah Pengembangan Aplikasi Berbasis Web (PABWE) · Front-end: **ReactJS** · Back-end: **Express.js + SQLite**

**Masalah yang diselesaikan:** mahasiswa sering lupa tempat yang sudah dilamar, kapan harus menindaklanjuti, dan bagaimana status tiap lamaran.

## Fitur
| Fitur | Keterangan |
|---|---|
| Autentikasi | Registrasi, login (JWT), ubah profil & kata sandi |
| Lamaran | CRUD lamaran: perusahaan, posisi, lokasi, tipe kerja, uang saku, tautan lowongan, kontak HR, catatan |
| Tahapan seleksi | Tersimpan → Dilamar → Seleksi berkas → Wawancara → Penawaran → Diterima / Ditolak / Dibatalkan, lengkap dengan **riwayat tahapan** (timeline) |
| Jadwal wawancara | Tambah/ubah/hapus jadwal (online / tatap muka / telepon); menambah jadwal otomatis memajukan lamaran ke tahap *Wawancara* |
| Pengingat | Tindak lanjut yang jatuh tempo/terlambat dan batas pendaftaran lowongan terdekat |
| Dashboard | Statistik, pipeline per tahap, tingkat respons, wawancara terdekat, grafik lamaran 6 bulan |
| Pencarian & filter | Live search, filter tahap & tipe kerja, pengurutan |

## Arsitektur & Teknologi
```
interntrack/
├─ backend/    Express 5 · SQLite (better-sqlite3) · JWT · bcryptjs · helmet · Vitest + Supertest
├─ frontend/   React 19 · Vite · Tailwind CSS v4 · Redux Toolkit · React Router · Vitest + Testing Library
├─ docker-compose.yml   Menjalankan back-end + front-end
└─ Jenkinsfile          CI/CD: lint → test → build → deploy → smoke test
```
Front-end mengikuti struktur modul praktikum 4 (ReactJS): `features/<fitur>/{api,states,pages,modals}`, state dengan *action creator + thunk + reducer*, helper, hook `useInput`.

### Skema database
```
users 1──* applications 1──* interviews
                  └──* application_events   (riwayat perubahan tahap)
```

## Menjalankan di komputer lokal (mulai dari clone)
Prasyarat: **Node.js ≥ 20** dan Git.

```bash
# 1) Clone
git clone <URL-REPOSITORY-GITHUB> interntrack
cd interntrack

# 2) Back-end (http://localhost:3000)
cd backend
npm install
cp .env.example .env        # (Windows: copy .env.example .env)
npm run seed                # opsional: data contoh (demo@interntrack.id / password123)
npm run dev

# 3) Front-end — terminal baru (http://localhost:5173)
cd frontend
npm install
cp .env.example .env        # API_BASEURL=http://localhost:3000/api
npm run dev
```
Buka <http://localhost:5173>, daftar akun baru **atau** login dengan akun demo `demo@interntrack.id` / `password123`.

## Pengujian
```bash
cd backend  && npm test        # 36 tes API (Vitest + Supertest, DB SQLite in-memory)
cd frontend && npm test        # 120 tes UI/state/helper (Vitest + Testing Library)
npm run coverage               # laporan coverage (ada threshold minimum)
npm run lint                   # oxlint
```
Hasil terakhir: back-end 36/36 lulus (coverage ±99%), front-end 120/120 lulus (coverage 100% statements).

## Referensi API (`/api`)
Format respons: `{ "status": "success|fail|error", "message": "...", "data": ... }`. Semua endpoint selain `/auth/*` dan `/health` membutuhkan header `Authorization: Bearer <token>`.

| Method | Endpoint | Keterangan |
|---|---|---|
| GET | `/health` | Cek status server |
| POST | `/auth/register` | Daftar `{name, email, password}` |
| POST | `/auth/login` | Login → `{token}` |
| GET / PUT | `/users/me` | Lihat / ubah profil |
| PUT | `/users/me/password` | Ubah kata sandi |
| GET | `/applications?status=&q=&work_type=&sort=` | Daftar lamaran (`sort`: recent, newest, company, deadline, applied) |
| POST | `/applications` | Tambah lamaran |
| GET | `/applications/:id` | Detail + `interviews` + `events` |
| PUT | `/applications/:id` | Ubah lamaran |
| PATCH | `/applications/:id/status` | Ubah tahap `{status, note?}` |
| DELETE | `/applications/:id` | Hapus lamaran |
| GET | `/interviews?scope=upcoming\|past\|all&now=` | Daftar jadwal wawancara |
| POST | `/applications/:id/interviews` | Tambah jadwal |
| GET / PUT / DELETE | `/interviews/:id` | Detail / ubah / hapus jadwal |
| GET | `/dashboard/summary?today=&now=` | Ringkasan dashboard |

Kode status: `200/201` sukses · `401` belum login/token salah · `404` tidak ditemukan (termasuk data milik pengguna lain) · `409` duplikat email · `422` validasi gagal.

## Deployment
### Docker Compose
```bash
cp .env.example .env     # isi JWT_SECRET (≥ 32 karakter) dan URL publik
docker compose up -d --build
# Front-end: http://localhost:8080   ·   API: http://localhost:3000/api/health
```
`API_BASEURL` ditanam saat *build* front-end; ubah ke URL publik back-end saat deploy ke server/domain.

### Jenkins
1. Plugin: *Pipeline*, *Docker Pipeline*, *JUnit*. Agent Jenkins harus dapat menjalankan Docker.
2. Buat credential **Secret text** ber-ID `interntrack-jwt-secret` (string acak ≥ 32 karakter).
3. Buat job **Pipeline from SCM** → arahkan ke repository GitHub ini (`Jenkinsfile` di root).
4. Pada job, set environment `API_BASEURL` dan `CORS_ORIGIN` ke URL publik aplikasi.
5. Tahapan: Checkout → Back-end lint & test → Front-end lint, test & build → Deploy (`docker compose`) → Smoke test (`/api/health`). Laporan JUnit tampil pada halaman build (**Test Result**) — ini bukti pengujian untuk dikumpulkan.

### Alternatif hosting
Front-end dapat di-deploy ke Netlify (`frontend/netlify.toml`, set variabel `API_BASEURL`); back-end ke VPS/Render/Railway dengan *persistent disk* untuk berkas SQLite (`DB_PATH`).

## Keamanan
Kata sandi di-hash (bcrypt) · JWT berkedaluwarsa · `helmet` · CORS dibatasi · rate-limit pada `/auth` · query SQL berparameter · validasi input di server · setiap data dibatasi per pengguna (pengguna lain mendapat 404).

## Lisensi
Dibuat untuk keperluan akademik.
