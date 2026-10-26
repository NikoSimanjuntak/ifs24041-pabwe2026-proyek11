import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from './test-utils';
import App from './App';
import * as userApi from './features/users/api/userApi';
import * as dashApi from './features/dashboard/api/dashboardApi';

vi.mock('./features/users/api/userApi');
vi.mock('./features/dashboard/api/dashboardApi');
vi.mock('./helpers/toolsHelper', async (orig) => ({ ...(await orig()), showErrorDialog: vi.fn() }));

describe('App routing', () => {
  it('tamu diarahkan ke halaman login (juga untuk rute tak dikenal)', () => {
    renderWithProviders(<App />, { route: '/tidak-ada', preloadedState: { isAuthLogin: false } });
    expect(screen.getByRole('heading', { name: 'Masuk ke akunmu' })).toBeInTheDocument();
  });

  it('/auth mengarah ke login', () => {
    renderWithProviders(<App />, { route: '/auth' });
    expect(screen.getByRole('heading', { name: 'Masuk ke akunmu' })).toBeInTheDocument();
  });

  it('halaman registrasi tersedia', () => {
    renderWithProviders(<App />, { route: '/auth/register' });
    expect(screen.getByRole('heading', { name: 'Buat akun baru' })).toBeInTheDocument();
  });

  it('pengguna login melihat dashboard', async () => {
    localStorage.setItem('accessToken', 't');
    userApi.getProfile.mockResolvedValue({ id: 1, name: 'Budi' });
    dashApi.getDashboardSummary.mockResolvedValue(null);
    renderWithProviders(<App />, { route: '/', preloadedState: { isAuthLogin: true } });
    expect(await screen.findByRole('heading', { name: 'Dashboard' })).toBeInTheDocument();
  });
});
