import { describe, expect, it, vi } from 'vitest';
import { apiRequest } from '../../../helpers/apiHelper';
import {
  deleteApplication, getApplicationById, getApplications, patchApplicationStatus, postApplication, putApplication,
} from './applicationApi';

vi.mock('../../../helpers/apiHelper', () => ({ apiRequest: vi.fn() }));

describe('applicationApi', () => {
  it('getApplications menyertakan waktu lokal dan filter', async () => {
    apiRequest.mockResolvedValue({ data: { applications: [{ id: 1 }] } });
    expect(await getApplications({ status: 'applied' })).toEqual([{ id: 1 }]);
    const [path, opts] = apiRequest.mock.calls[0];
    expect(path).toBe('/applications');
    expect(opts.params).toMatchObject({ status: 'applied' });
    expect(opts.params.now).toBeTruthy();
    await getApplications();
    expect(apiRequest).toHaveBeenCalledTimes(2);
  });
  it('getApplicationById', async () => {
    apiRequest.mockResolvedValue({ data: { application: { id: 9 } } });
    expect(await getApplicationById(9)).toEqual({ id: 9 });
    expect(apiRequest).toHaveBeenCalledWith('/applications/9');
  });
  it('postApplication mengembalikan id', async () => {
    apiRequest.mockResolvedValue({ data: { application_id: 5 } });
    expect(await postApplication({ company: 'X' })).toBe(5);
    expect(apiRequest).toHaveBeenCalledWith('/applications', { method: 'POST', body: { company: 'X' } });
  });
  it('putApplication, patchApplicationStatus, deleteApplication', async () => {
    apiRequest.mockResolvedValue({});
    await putApplication(3, { company: 'Y' });
    expect(apiRequest).toHaveBeenLastCalledWith('/applications/3', { method: 'PUT', body: { company: 'Y' } });
    await patchApplicationStatus(3, { status: 'offer', note: 'n' });
    expect(apiRequest).toHaveBeenLastCalledWith('/applications/3/status', { method: 'PATCH', body: { status: 'offer', note: 'n' } });
    await deleteApplication(3);
    expect(apiRequest).toHaveBeenLastCalledWith('/applications/3', { method: 'DELETE' });
  });
});
