import { describe, expect, it, vi } from 'vitest';
import { showErrorDialog, showSuccessDialog } from '../../../helpers/toolsHelper';
import * as api from '../api/userApi';
import * as A from './action';

vi.mock('../api/userApi');
vi.mock('../../../helpers/toolsHelper');

const run = async (thunk) => {
  const dispatch = vi.fn();
  const result = await thunk(dispatch);
  return { dispatch, result };
};

describe('users actions', () => {
  it('action creators', () => {
    expect(A.receiveProfileActionCreator({ id: 1 }).payload.profile).toEqual({ id: 1 });
    expect(A.setIsProfileActionCreator(true).type).toBe(A.ActionType.SET_IS_PROFILE);
    expect(A.setIsChangeProfileActionCreator(true).type).toBe(A.ActionType.SET_IS_CHANGE_PROFILE);
    expect(A.setIsChangeProfilePasswordActionCreator(true).type).toBe(A.ActionType.SET_IS_CHANGE_PROFILE_PASSWORD);
  });

  it('asyncProfile: sukses, 401, dan gagal lain', async () => {
    api.getProfile.mockResolvedValue({ id: 1 });
    const ok = await run(A.asyncProfile());
    expect(ok.result).toEqual({ id: 1 });
    expect(ok.dispatch).toHaveBeenLastCalledWith(A.setIsProfileActionCreator(false));

    api.getProfile.mockRejectedValue(Object.assign(new Error('x'), { status: 401 }));
    expect((await run(A.asyncProfile())).result).toBe('unauthorized');
    expect(showErrorDialog).not.toHaveBeenCalled();

    api.getProfile.mockRejectedValue(new Error('down'));
    expect((await run(A.asyncProfile())).result).toBeNull();
    expect(showErrorDialog).toHaveBeenCalledWith('down');
  });

  it('asyncChangeProfile sukses dan gagal', async () => {
    api.putProfile.mockResolvedValue({ id: 1, name: 'B' });
    const ok = await run(A.asyncChangeProfile({ name: 'B', email: 'b@b.co' }));
    expect(ok.result).toBe(true);
    expect(ok.dispatch).toHaveBeenCalledWith(A.receiveProfileActionCreator({ id: 1, name: 'B' }));
    expect(showSuccessDialog).toHaveBeenCalled();
    api.putProfile.mockRejectedValue(new Error('dup'));
    expect((await run(A.asyncChangeProfile({}))).result).toBe(false);
  });

  it('asyncChangeProfilePassword sukses dan gagal', async () => {
    api.putProfilePassword.mockResolvedValue({});
    expect((await run(A.asyncChangeProfilePassword({}))).result).toBe(true);
    api.putProfilePassword.mockRejectedValue(new Error('salah'));
    expect((await run(A.asyncChangeProfilePassword({}))).result).toBe(false);
    expect(showErrorDialog).toHaveBeenLastCalledWith('salah', 'Gagal mengubah kata sandi');
  });
});
