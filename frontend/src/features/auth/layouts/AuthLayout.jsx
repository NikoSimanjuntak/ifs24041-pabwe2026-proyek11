import { Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Logo from '../../../components/Logo';

export default function AuthLayout() {
  const isAuthLogin = useSelector((state) => state.isAuthLogin);

  // Jika pengguna sudah login, arahkan ke dashboard.
  if (isAuthLogin) return <Navigate to="/" replace />;

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      <aside
        className="relative hidden flex-col justify-between overflow-hidden bg-ink p-12 text-white lg:flex"
        aria-label="Informasi InternTrack"
      >
        <Logo light />

        <div className="max-w-md">
          <p className="font-display text-5xl font-extrabold leading-[1.05]">
            Semua lamaran magangmu, dalam satu dashboard.
          </p>
          <p className="mt-5 text-base leading-relaxed text-slate-300">
            Catat tempat yang sudah kamu lamar, pantau tahapan seleksi, dan jangan
            lewatkan jadwal wawancara maupun waktu tindak lanjut.
          </p>
        </div>

        <ul className="flex flex-wrap gap-3 text-sm font-semibold">
          <li className="rounded-full bg-sky-500 px-4 py-1.5">Dilamar</li>
          <li className="rounded-full bg-violet-500 px-4 py-1.5">Seleksi</li>
          <li className="rounded-full bg-accent px-4 py-1.5 text-ink">Wawancara</li>
          <li className="rounded-full bg-green-600 px-4 py-1.5">Diterima</li>
        </ul>

        <span
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full border-[28px] border-white/5"
        />
      </aside>

      <main className="flex items-center justify-center px-5 py-10" aria-label="Formulir autentikasi">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <Logo />
          </div>
          <Outlet />
        </div>
      </main>
    </div>
  );
}
