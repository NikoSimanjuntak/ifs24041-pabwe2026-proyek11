import { fireEvent, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '../test-utils';
import NavbarComponent from './NavbarComponent';
import SidebarComponent, { MENU, isActive } from './SidebarComponent';

describe('SidebarComponent', () => {
  it('menandai menu aktif sesuai rute', () => {
    renderWithProviders(<SidebarComponent open onClose={() => {}} />, { route: '/applications/3' });
    expect(screen.getByRole('link', { name: /Lamaran/ })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: /Dashboard/ })).not.toHaveAttribute('aria-current');
    expect(MENU).toHaveLength(4);
    expect(isActive('dashboard', { pathname: '/' })).toBe(true);
    expect(isActive('dashboard', { pathname: '/profile' })).toBe(false);
  });

  it('menutup lewat backdrop, tombol, dan klik menu', async () => {
    const onClose = vi.fn();
    renderWithProviders(<SidebarComponent open onClose={onClose} />);
    await userEvent.click(screen.getByTestId('sidebar-backdrop'));
    await userEvent.click(screen.getByLabelText('Tutup menu'));
    await userEvent.click(screen.getByRole('link', { name: /Profil saya/ }));
    expect(onClose).toHaveBeenCalledTimes(3);
  });

  it('tanpa backdrop saat tertutup', () => {
    renderWithProviders(<SidebarComponent open={false} onClose={() => {}} />);
    expect(screen.queryByTestId('sidebar-backdrop')).not.toBeInTheDocument();
  });
});

describe('NavbarComponent', () => {
  it('menampilkan nama, membuka menu profil, dan keluar', async () => {
    const onLogout = vi.fn();
    const onToggle = vi.fn();
    renderWithProviders(<NavbarComponent profile={{ name: 'Budi' }} onToggleSidebar={onToggle} onLogout={onLogout} />);
    expect(screen.getByText('Budi')).toBeInTheDocument();
    await userEvent.click(screen.getByLabelText('Buka menu'));
    expect(onToggle).toHaveBeenCalled();

    await userEvent.click(screen.getByLabelText('Menu profil'));
    expect(screen.getByRole('menu')).toBeInTheDocument();
    fireEvent.mouseDown(document.body);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();

    await userEvent.click(screen.getByLabelText('Menu profil'));
    await userEvent.click(screen.getByRole('menuitem', { name: /Profil saya/ }));
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();

    await userEvent.click(screen.getByLabelText('Menu profil'));
    await userEvent.click(screen.getByRole('menuitem', { name: /Keluar/ }));
    expect(onLogout).toHaveBeenCalled();
  });

  it('klik di dalam menu tidak menutupnya & profil kosong memakai placeholder', async () => {
    renderWithProviders(<NavbarComponent profile={null} onToggleSidebar={() => {}} onLogout={() => {}} />);
    expect(screen.getByText('…')).toBeInTheDocument();
    await userEvent.click(screen.getByLabelText('Menu profil'));
    fireEvent.mouseDown(screen.getByRole('menu'));
    expect(screen.getByRole('menu')).toBeInTheDocument();
  });
});
