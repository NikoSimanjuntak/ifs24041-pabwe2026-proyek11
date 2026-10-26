import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '../../../test-utils';
import * as api from '../api/authApi';
import LoginPage, { validateLogin } from './LoginPage';
import RegisterPage, { validateRegister } from './RegisterPage';

vi.mock('../api/authApi');
vi.mock('../../../helpers/toolsHelper', () => ({ showSuccessDialog: vi.fn(), showErrorDialog: vi.fn() }));

const tree = (
  <Routes>
    <Route path="/" element={<p>Dashboard</p>} />
    <Route path="/auth/login" element={<LoginPage />} />
    <Route path="/auth/register" element={<RegisterPage />} />
  </Routes>
);

beforeEach(() => vi.clearAllMocks());

describe('validator', () => {
  it('validateLogin & validateRegister', () => {
    expect(validateLogin({ email: '', password: '' })).toEqual({ email: 'Email wajib diisi.', password: 'Kata sandi wajib diisi.' });
    expect(validateLogin({ email: 'a', password: '123' }).password).toMatch(/minimal 6/);
    expect(validateLogin({ email: 'a@b.co', password: '123456' })).toEqual({});
    expect(Object.keys(validateRegister({ name: 'B', email: 'x', password: '1', confirm: '2' }))).toEqual(['name', 'email', 'password', 'confirm']);
    expect(validateRegister({ name: 'Budi', email: 'b@b.co', password: '123456', confirm: '123456' })).toEqual({});
  });
});

describe('LoginPage', () => {
  it('menampilkan error validasi tanpa memanggil API', async () => {
    renderWithProviders(tree, { route: '/auth/login' });
    await userEvent.click(screen.getByRole('button', { name: 'Masuk' }));
    expect(screen.getByText('Email wajib diisi.')).toBeInTheDocument();
    expect(api.postLogin).not.toHaveBeenCalled();
  });

  it('login sukses menyimpan token dan menuju dashboard', async () => {
    api.postLogin.mockResolvedValue({ token: 'tok' });
    renderWithProviders(tree, { route: '/auth/login' });
    await userEvent.type(screen.getByLabelText('Email'), ' budi@del.ac.id ');
    await userEvent.type(screen.getByLabelText('Kata sandi'), 'rahasia123');
    await userEvent.click(screen.getByRole('button', { name: 'Masuk' }));
    expect(await screen.findByText('Dashboard')).toBeInTheDocument();
    expect(api.postLogin).toHaveBeenCalledWith({ email: 'budi@del.ac.id', password: 'rahasia123' });
    expect(localStorage.getItem('accessToken')).toBe('tok');
  });

  it('login gagal tetap di halaman login', async () => {
    api.postLogin.mockRejectedValue(new Error('salah'));
    renderWithProviders(tree, { route: '/auth/login' });
    await userEvent.type(screen.getByLabelText('Email'), 'a@b.co');
    await userEvent.type(screen.getByLabelText('Kata sandi'), 'rahasia123');
    await userEvent.click(screen.getByRole('button', { name: 'Masuk' }));
    await waitFor(() => expect(api.postLogin).toHaveBeenCalled());
    expect(screen.getByRole('heading', { name: 'Masuk ke akunmu' })).toBeInTheDocument();
  });

  it('tautan ke registrasi', async () => {
    renderWithProviders(tree, { route: '/auth/login' });
    await userEvent.click(screen.getByRole('link', { name: 'Daftar sekarang' }));
    expect(screen.getByRole('heading', { name: 'Buat akun baru' })).toBeInTheDocument();
  });
});

describe('RegisterPage', () => {
  it('validasi gagal', async () => {
    renderWithProviders(tree, { route: '/auth/register' });
    await userEvent.click(screen.getByRole('button', { name: 'Daftar' }));
    expect(screen.getByText('Nama minimal 2 karakter.')).toBeInTheDocument();
    expect(api.postRegister).not.toHaveBeenCalled();
  });

  it('registrasi sukses menuju login', async () => {
    api.postRegister.mockResolvedValue({});
    renderWithProviders(tree, { route: '/auth/register' });
    await userEvent.type(screen.getByLabelText('Nama lengkap'), 'Budi');
    await userEvent.type(screen.getByLabelText('Email'), 'b@del.ac.id');
    await userEvent.type(screen.getByLabelText('Kata sandi'), 'rahasia123');
    await userEvent.type(screen.getByLabelText('Konfirmasi kata sandi'), 'rahasia123');
    await userEvent.click(screen.getByRole('button', { name: 'Daftar' }));
    expect(await screen.findByRole('heading', { name: 'Masuk ke akunmu' })).toBeInTheDocument();
    expect(api.postRegister).toHaveBeenCalledWith({ name: 'Budi', email: 'b@del.ac.id', password: 'rahasia123' });
  });

  it('registrasi gagal tetap di halaman', async () => {
    api.postRegister.mockRejectedValue(new Error('dup'));
    renderWithProviders(tree, { route: '/auth/register' });
    await userEvent.type(screen.getByLabelText('Nama lengkap'), 'Budi');
    await userEvent.type(screen.getByLabelText('Email'), 'b@del.ac.id');
    await userEvent.type(screen.getByLabelText('Kata sandi'), 'rahasia123');
    await userEvent.type(screen.getByLabelText('Konfirmasi kata sandi'), 'rahasia123');
    await userEvent.click(screen.getByRole('button', { name: 'Daftar' }));
    await waitFor(() => expect(api.postRegister).toHaveBeenCalled());
    expect(screen.getByRole('heading', { name: 'Buat akun baru' })).toBeInTheDocument();
  });
});
