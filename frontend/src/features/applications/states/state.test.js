import { describe, expect, it, vi } from 'vitest';
import { showErrorDialog, showSuccessDialog } from '../../../helpers/toolsHelper';
import * as api from '../api/applicationApi';
import * as A from './action';
import * as R from './reducer';

vi.mock('../api/applicationApi');
vi.mock('../../../helpers/toolsHelper');

const run = async (thunk) => {
  const dispatch = vi.fn();
  const result = await thunk(dispatch);
  return { dispatch, result };
};

describe('applications reducers', () => {
  it('data & flag', () => {
    expect(R.applicationsReducer(undefined, {})).toEqual([]);
    expect(R.applicationsReducer([], A.receiveApplicationsActionCreator([{ id: 1 }]))).toEqual([{ id: 1 }]);
    expect(R.applicationsReducer([1], { type: 'LAIN' })).toEqual([1]);
    expect(R.applicationReducer(undefined, {})).toBeNull();
    expect(R.applicationReducer(null, A.receiveApplicationActionCreator({ id: 2 }))).toEqual({ id: 2 });
    expect(R.isApplicationReducer(false, A.setIsApplicationActionCreator(true))).toBe(true);
    expect(R.isApplicationSaveReducer(undefined)).toBe(false);
    expect(R.isApplicationSaveReducer(false, A.setIsApplicationSaveActionCreator(true))).toBe(true);
  });
});

describe('applications thunks', () => {
  it('asyncApplications sukses & gagal', async () => {
    api.getApplications.mockResolvedValue([{ id: 1 }]);
    const { dispatch } = await run(A.asyncApplications({ status: 'applied' }));
    expect(api.getApplications).toHaveBeenCalledWith({ status: 'applied' });
    expect(dispatch).toHaveBeenCalledWith(A.receiveApplicationsActionCreator([{ id: 1 }]));
    expect(dispatch).toHaveBeenLastCalledWith(A.setIsApplicationActionCreator(false));
    api.getApplications.mockRejectedValue(new Error('x'));
    await run(A.asyncApplications());
    expect(showErrorDialog).toHaveBeenCalledWith('x', 'Gagal memuat lamaran');
  });

  it('asyncApplication mengosongkan state lama lalu memuat detail', async () => {
    api.getApplicationById.mockResolvedValue({ id: 7 });
    const { dispatch } = await run(A.asyncApplication(7));
    expect(dispatch.mock.calls[0][0]).toEqual(A.receiveApplicationActionCreator(null));
    expect(dispatch).toHaveBeenCalledWith(A.receiveApplicationActionCreator({ id: 7 }));
    api.getApplicationById.mockRejectedValue(new Error('x'));
    await run(A.asyncApplication(7));
    expect(showErrorDialog).toHaveBeenCalledWith('x', 'Gagal memuat detail lamaran');
  });

  it('asyncApplicationAdd mengembalikan id, atau false saat gagal', async () => {
    api.postApplication.mockResolvedValue(11);
    const ok = await run(A.asyncApplicationAdd({ company: 'X' }));
    expect(ok.result).toBe(11);
    expect(showSuccessDialog).toHaveBeenCalled();
    expect(ok.dispatch).toHaveBeenLastCalledWith(A.setIsApplicationSaveActionCreator(false));
    api.postApplication.mockRejectedValue(new Error('x'));
    expect((await run(A.asyncApplicationAdd({}))).result).toBe(false);
    expect(showErrorDialog).toHaveBeenLastCalledWith('x', 'Gagal menambah lamaran');
  });

  it('asyncApplicationChange / Status / Delete mengembalikan true atau false', async () => {
    api.putApplication.mockResolvedValue({});
    api.patchApplicationStatus.mockResolvedValue({});
    api.deleteApplication.mockResolvedValue({});
    expect((await run(A.asyncApplicationChange(1, {}))).result).toBe(true);
    expect((await run(A.asyncApplicationStatus(1, { status: 'offer' }))).result).toBe(true);
    expect((await run(A.asyncApplicationDelete(1))).result).toBe(true);
    expect(api.putApplication).toHaveBeenCalledWith(1, {});
    api.putApplication.mockRejectedValue(new Error('a'));
    api.patchApplicationStatus.mockRejectedValue(new Error('b'));
    api.deleteApplication.mockRejectedValue(new Error('c'));
    expect((await run(A.asyncApplicationChange(1, {}))).result).toBe(false);
    expect((await run(A.asyncApplicationStatus(1, {}))).result).toBe(false);
    expect((await run(A.asyncApplicationDelete(1))).result).toBe(false);
  });
});
