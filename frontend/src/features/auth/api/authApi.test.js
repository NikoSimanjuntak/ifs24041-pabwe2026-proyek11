import { describe, expect, it, vi } from 'vitest';
import { apiRequest } from '../../../helpers/apiHelper';
import { postLogin, postRegister } from './authApi';

vi.mock('../../../helpers/apiHelper', () => ({ apiRequest: vi.fn() }));

describe('authApi', () => {
  it('postLogin mengembalikan data (token) tanpa auth', async () => {
    apiRequest.mockResolvedValue({ data: { token: 't' } });
    expect(await postLogin({ email: 'a@b.co', password: 'rahasia' })).toEqual({ token: 't' });
    expect(apiRequest).toHaveBeenCalledWith('/auth/login', { method: 'POST', body: { email: 'a@b.co', password: 'rahasia' }, auth: false });
  });
  it('postRegister', async () => {
    apiRequest.mockResolvedValue({ status: 'success' });
    await postRegister({ name: 'Budi', email: 'a@b.co', password: 'rahasia' });
    expect(apiRequest).toHaveBeenCalledWith('/auth/register', { method: 'POST', body: { name: 'Budi', email: 'a@b.co', password: 'rahasia' }, auth: false });
  });
});
