import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { showConfirmDialog } from '../helpers/toolsHelper';
import { renderWithProviders } from '../test-utils';
import * as userApi from '../features/users/api/userApi';
import AppLayout from './AppLayout';

vi.mock('../features/users/api/userApi');
vi.mock('../helpers/toolsHelper', () => ({
  showSuccessDialog: vi.fn(), showErrorDialog: vi.fn(), showConfirmDialog: vi.fn(),
}));

const renderLayout = (preloadedState) =>
  renderWithProviders(
    <Routes>
      <Route path="/auth/login" element={<p>Halaman login</p>} />
      <Route path="/" element={<AppLayout />}><Route index element={<p>Isi halaman</p>} /></Route>
    </Routes>,
    { preloadedState },
  );

beforeEach(() => localStorage.setItem('accessToken', 'tok'));

describe('AppLayout', () => {
  it('mengalihkan ke login bila tidak ada token / belum login', () => {
    localStorage.clear();
    renderLayout({ isAuthLogin: false });
    expect(screen.getByText('Halaman login')).toBeInTheDocument();
  });

  it('memuat profil lalu menampilkan shell + konten', async () => {
    userApi.getProfile.mockResolvedValue({ id: 1, name: 'Budi' });
    renderLayout({ isAuthLogin: true });
    expect(screen.getByText('Menyiapkan sesi…')).toBeInTheDocument();
    expect(await screen.findByText('Isi halaman')).toBeInTheDocument();
    expect(screen.getByText('Budi')).toBeInTheDocument();
  });

  it('token ditolak (401) → sesi dikeluarkan menuju login', async () => {
    userApi.getProfile.mockRejectedValue(Object.assign(new Error('x'), { status: 401 }));
    renderLayout({ isAuthLogin: true });
    expect(await screen.findByText('Halaman login')).toBeInTheDocument();
    expect(localStorage.getItem('accessToken')).toBeNull();
  });

  it('gangguan jaringan → tombol "Coba lagi" mempertahankan sesi', async () => {
    userApi.getProfile.mockRejectedValueOnce(new Error('offline')).mockResolvedValue({ id: 1, name: 'Budi' });
    renderLayout({ isAuthLogin: true });
    expect(await screen.findByText('Sesi belum dapat dimuat')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Coba lagi' }));
    expect(await screen.findByText('Isi halaman')).toBeInTheDocument();
    expect(localStorage.getItem('accessToken')).toBe('tok');
  });

  it('toggle sidebar dan logout dengan konfirmasi', async () => {
    userApi.getProfile.mockResolvedValue({ id: 1, name: 'Budi' });
    renderLayout({ isAuthLogin: true });
    await screen.findByText('Isi halaman');

    await userEvent.click(screen.getByLabelText('Buka menu'));
    expect(screen.getByTestId('sidebar-backdrop')).toBeInTheDocument();
    await userEvent.click(screen.getByTestId('sidebar-backdrop'));
    expect(screen.queryByTestId('sidebar-backdrop')).not.toBeInTheDocument();

    showConfirmDialog.mockResolvedValueOnce(false);
    await userEvent.click(screen.getByLabelText('Menu profil'));
    await userEvent.click(screen.getByRole('menuitem', { name: /Keluar/ }));
    await waitFor(() => expect(showConfirmDialog).toHaveBeenCalledTimes(1));
    expect(screen.getByText('Isi halaman')).toBeInTheDocument();

    showConfirmDialog.mockResolvedValueOnce(true);
    await userEvent.click(screen.getByLabelText('Menu profil'));
    await userEvent.click(screen.getByRole('menuitem', { name: /Keluar/ }));
    expect(await screen.findByText('Halaman login')).toBeInTheDocument();
    expect(localStorage.getItem('accessToken')).toBeNull();
  });
});
