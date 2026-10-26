import { describe, expect, it, vi } from 'vitest';
import { apiRequest } from '../../../helpers/apiHelper';
import { getDashboardSummary } from './dashboardApi';

vi.mock('../../../helpers/apiHelper', () => ({ apiRequest: vi.fn() }));

describe('dashboardApi', () => {
  it('mengirim tanggal & waktu lokal sebagai acuan pengingat', async () => {
    apiRequest.mockResolvedValue({ data: { total: 3 } });
    expect(await getDashboardSummary()).toEqual({ total: 3 });
    const [path, opts] = apiRequest.mock.calls[0];
    expect(path).toBe('/dashboard/summary');
    expect(opts.params.today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(opts.params.now).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
  });
});
