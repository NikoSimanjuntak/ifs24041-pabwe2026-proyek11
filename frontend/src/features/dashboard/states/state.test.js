import { describe, expect, it, vi } from 'vitest';
import { showErrorDialog } from '../../../helpers/toolsHelper';
import * as api from '../api/dashboardApi';
import * as A from './action';
import { dashboardReducer, isDashboardReducer } from './reducer';

vi.mock('../api/dashboardApi');
vi.mock('../../../helpers/toolsHelper');

describe('dashboard state', () => {
  it('reducer', () => {
    expect(dashboardReducer(undefined, {})).toBeNull();
    expect(dashboardReducer(null, A.receiveDashboardActionCreator({ total: 1 }))).toEqual({ total: 1 });
    expect(dashboardReducer({ total: 1 }, { type: 'LAIN' })).toEqual({ total: 1 });
    expect(isDashboardReducer(undefined)).toBe(false);
    expect(isDashboardReducer(false, A.setIsDashboardActionCreator(true))).toBe(true);
  });

  it('asyncDashboard sukses dan gagal', async () => {
    const dispatch = vi.fn();
    api.getDashboardSummary.mockResolvedValue({ total: 2 });
    await A.asyncDashboard()(dispatch);
    expect(dispatch).toHaveBeenCalledWith(A.receiveDashboardActionCreator({ total: 2 }));
    expect(dispatch).toHaveBeenLastCalledWith(A.setIsDashboardActionCreator(false));

    api.getDashboardSummary.mockRejectedValue(new Error('x'));
    await A.asyncDashboard()(dispatch);
    expect(showErrorDialog).toHaveBeenCalledWith('x', 'Gagal memuat dashboard');
  });
});
