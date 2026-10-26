import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '../../../test-utils';
import * as api from '../api/userApi';
import ProfilePage, { validatePassword, validateProfile } from './ProfilePage';

vi.mock('../api/userApi');
vi.mock('../../../helpers/toolsHelper', async (orig) => ({
  ...(await orig()), showSuccessDialog: vi.fn(), showErrorDialog: vi.fn(),
}));

const profile = { id: 1, name: 'Budi', email: 'budi@del.ac.id', created_at: '2026-01-05T00:00:00.000Z' };
const renderPage = () => renderWithProviders(<ProfilePage />, { preloadedState: { profile } });

beforeEach(() => {
  api.putProfile.mockResolvedValue({ ...profile, name: 'Budi S' });
  api.putProfilePassword.mockResolvedValue({});
});

describe('ProfilePage', () => {
  it('validator', () => {
    expect(Object.keys(validateProfile({ name: 'B', email: 'x' }))).toEqual(['name', 'email']);
    expect(Object.keys(validatePassword({ password: '', newPassword: '1', confirm: '2' }))).toEqual(['password', 'newPassword', 'confirm']);
    expect(validatePassword({ password: 'a', newPassword: '123456', confirm: '123456' })).toEqual({});
  });

  it('menampilkan data akun dan menyimpan perubahan profil', async () => {
    renderPage();
    expect(screen.getByLabelText('Nama')).toHaveValue('Budi');
    await userEvent.clear(screen.getByLabelText('Nama'));
    await userEvent.type(screen.getByLabelText('Nama'), 'Budi S');
    await userEvent.click(screen.getByRole('button', { name: 'Simpan profil' }));
    await waitFor(() => expect(api.putProfile).toHaveBeenCalledWith({ name: 'Budi S', email: 'budi@del.ac.id' }));
    await waitFor(() => expect(screen.getByLabelText('Nama')).toHaveValue('Budi S'));
  });

  it('validasi profil menghentikan pengiriman', async () => {
    renderPage();
    await userEvent.clear(screen.getByLabelText('Email'));
    await userEvent.click(screen.getByRole('button', { name: 'Simpan profil' }));
    expect(screen.getByText('Format email tidak valid.')).toBeInTheDocument();
    expect(api.putProfile).not.toHaveBeenCalled();
  });

  it('mengubah kata sandi lalu mengosongkan form', async () => {
    renderPage();
    await userEvent.type(screen.getByLabelText('Kata sandi lama'), 'rahasia123');
    await userEvent.type(screen.getByLabelText('Kata sandi baru'), 'baru-12345');
    await userEvent.type(screen.getByLabelText('Konfirmasi kata sandi baru'), 'baru-12345');
    await userEvent.click(screen.getByRole('button', { name: 'Ubah kata sandi' }));
    await waitFor(() => expect(api.putProfilePassword).toHaveBeenCalledWith({ password: 'rahasia123', new_password: 'baru-12345', new_password_confirmation: 'baru-12345' }));
    await waitFor(() => expect(screen.getByLabelText('Kata sandi lama')).toHaveValue(''));
  });

  it('kata sandi: validasi dan kegagalan API mempertahankan isian', async () => {
    renderPage();
    await userEvent.click(screen.getByRole('button', { name: 'Ubah kata sandi' }));
    expect(screen.getByText('Kata sandi lama wajib diisi.')).toBeInTheDocument();

    api.putProfilePassword.mockRejectedValue(new Error('salah'));
    await userEvent.type(screen.getByLabelText('Kata sandi lama'), 'x');
    await userEvent.type(screen.getByLabelText('Kata sandi baru'), 'baru-12345');
    await userEvent.type(screen.getByLabelText('Konfirmasi kata sandi baru'), 'baru-12345');
    await userEvent.click(screen.getByRole('button', { name: 'Ubah kata sandi' }));
    await waitFor(() => expect(api.putProfilePassword).toHaveBeenCalled());
    expect(screen.getByLabelText('Kata sandi lama')).toHaveValue('x');
  });
});
