# InternTrack — Front-end (ReactJS)

React 19 + Vite + Tailwind CSS v4 + Redux Toolkit + React Router.

```bash
npm install
cp .env.example .env     # sesuaikan APP_PORT / API_BASEURL
npm run dev              # http://localhost:$APP_PORT
npm run build            # build produksi
npm test                 # Vitest (120 tes)
npm run coverage         # coverage + threshold
```

## Struktur
```
src/
├─ helpers/      apiHelper, toolsHelper (dialog, format tanggal), constants
├─ hooks/        useInput
├─ components/   Logo, Spinner, StatusBadge, Avatar, Segmented, ModalShell, Navbar, Sidebar, ...
├─ layouts/      AppLayout (route guard + shell dashboard)
├─ features/
│  ├─ auth/          api · states · layouts · pages (Login, Register)
│  ├─ users/         api · states · pages (Profile)
│  ├─ dashboard/     api · states · pages
│  ├─ applications/  api · states · modals · pages (daftar, detail)
│  └─ interviews/    api · states · modals · pages
└─ store.js · App.jsx · main.jsx
```

## Rute
| Rute | Halaman |
|---|---|
| `/auth/login`, `/auth/register` | Autentikasi |
| `/` | Dashboard |
| `/applications` · `/applications/:id` | Daftar · detail lamaran (`?status=` filter, `?tambah=1` buka form) |
| `/interviews` | Jadwal wawancara |
| `/profile` | Profil & kata sandi |
