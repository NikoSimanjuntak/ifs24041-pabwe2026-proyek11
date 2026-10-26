import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiChevronDown, FiLogOut, FiMenu, FiUser } from 'react-icons/fi';
import Avatar from './Avatar';
import Logo from './Logo';

export default function NavbarComponent({ profile, onToggleSidebar, onLogout }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const close = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-line bg-white/95 px-4 backdrop-blur lg:px-8">
      <div className="flex items-center gap-3">
        <button type="button" onClick={onToggleSidebar} aria-label="Buka menu" className="btn btn-ghost !p-2 lg:hidden">
          <FiMenu className="h-5 w-5" />
        </button>
        <Link to="/" aria-label="Beranda"><Logo /></Link>
      </div>

      <div className="flex items-center gap-4">
        <p className="hidden items-center gap-2 text-sm text-ink-soft sm:flex">
          <span className="h-2 w-2 rounded-full bg-brand" aria-hidden="true" />
          Masuk sebagai <strong className="text-ink">{profile?.name ?? '…'}</strong>
        </p>

        <div className="relative" ref={ref}>
          <button type="button" onClick={() => setOpen((v) => !v)} aria-haspopup="menu" aria-expanded={open}
            aria-label="Menu profil" className="flex items-center gap-1.5 rounded-full p-1 hover:bg-paper">
            <Avatar name={profile?.name ?? ''} />
            <FiChevronDown className="h-4 w-4 text-ink-soft" />
          </button>
          {open && (
            <div role="menu" className="absolute right-0 mt-2 w-52 overflow-hidden rounded-xl border border-line bg-white py-1 shadow-lg">
              <Link role="menuitem" to="/profile" onClick={() => setOpen(false)}
                className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium hover:bg-paper">
                <FiUser /> Profil saya
              </Link>
              <button role="menuitem" type="button" onClick={() => { setOpen(false); onLogout(); }}
                className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm font-medium text-danger hover:bg-paper">
                <FiLogOut /> Keluar
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
