import { screen } from '@testing-library/react';
import { Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { renderWithProviders } from '../../../test-utils';
import AuthLayout from './AuthLayout';

const tree = (
  <Routes>
    <Route path="/" element={<p>Dashboard</p>} />
    <Route path="/auth" element={<AuthLayout />}><Route path="login" element={<p>Form login</p>} /></Route>
  </Routes>
);

describe('AuthLayout', () => {
  it('menampilkan panel informasi dan formulir untuk tamu', () => {
    renderWithProviders(tree, { route: '/auth/login', preloadedState: { isAuthLogin: false } });
    expect(screen.getByText('Form login')).toBeInTheDocument();
    expect(screen.getByLabelText('Informasi InternTrack')).toBeInTheDocument();
  });
  it('mengalihkan pengguna yang sudah login ke dashboard', () => {
    renderWithProviders(tree, { route: '/auth/login', preloadedState: { isAuthLogin: true } });
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });
});
