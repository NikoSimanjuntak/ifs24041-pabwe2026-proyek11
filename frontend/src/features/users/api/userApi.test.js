import { describe, expect, it, vi } from 'vitest';
import { apiRequest } from '../../../helpers/apiHelper';
import { getProfile, putProfile, putProfilePassword } from './userApi';

vi.mock('../../../helpers/apiHelper', () => ({ apiRequest: vi.fn() }));

describe('userApi', () => {
  it('getProfile', async () => {
    apiRequest.mockResolvedValue({ data: { user: { id: 1 } } });
    expect(await getProfile()).toEqual({ id: 1 });
    expect(apiRequest).toHaveBeenCalledWith('/users/me');
  });
  it('putProfile mengembalikan user terbaru', async () => {
    apiRequest.mockResolvedValue({ data: { user: { id: 1, name: 'B' } } });
    expect(await putProfile({ name: 'B', email: 'b@b.co' })).toEqual({ id: 1, name: 'B' });
    expect(apiRequest).toHaveBeenCalledWith('/users/me', { method: 'PUT', body: { name: 'B', email: 'b@b.co' } });
  });
  it('putProfilePassword', async () => {
    apiRequest.mockResolvedValue({});
    await putProfilePassword({ password: 'a', new_password: 'b', new_password_confirmation: 'b' });
    expect(apiRequest).toHaveBeenCalledWith('/users/me/password', { method: 'PUT', body: { password: 'a', new_password: 'b', new_password_confirmation: 'b' } });
  });
});
