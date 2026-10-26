import { describe, expect, it, vi } from 'vitest';
import { getAccessToken } from '../../../helpers/apiHelper';
import { showErrorDialog, showSuccessDialog } from '../../../helpers/toolsHelper';
import { receiveProfileActionCreator } from '../../users/states/action';
import * as api from '../api/authApi';
import * as A from './action';

vi.mock('../api/authApi');
vi.mock('../../../helpers/toolsHelper');

const run = async (thunk) => {
  const dispatch = vi.fn();
  const result = await thunk(dispatch);
  return { dispatch, result };
};

describe('auth action creators', () => {
  it('membuat action flag', () => {
    expect(A.setIsAuthLoginActionCreator(true)).toEqual({ type: A.ActionType.SET_IS_AUTH_LOGIN, payload: { status: true } });
    expect(A.setIsAuthRegisterActionCreator(false).type).toBe(A.ActionType.SET_IS_AUTH_REGISTER);
    expect(A.setIsAuthLogoutActionCreator(true).type).toBe(A.ActionType.SET_IS_AUTH_LOGOUT);
  });
});

describe('auth thunks', () => {
  it('login sukses menyimpan token', async () => {
    api.postLogin.mockResolvedValue({ token: 'abc' });
    const { dispatch, result } = await run(A.asyncAuthLogin({ email: 'a', password: 'b' }));
    expect(result).toBe(true);
    expect(getAccessToken()).toBe('abc');
    expect(dispatch).toHaveBeenCalledWith(A.setIsAuthLoginActionCreator(true));
  });
  it('login gagal: token kosong atau error API', async () => {
    api.postLogin.mockResolvedValue({});
    expect((await run(A.asyncAuthLogin({}))).result).toBe(false);
    api.postLogin.mockRejectedValue(new Error('salah'));
    expect((await run(A.asyncAuthLogin({}))).result).toBe(false);
    expect(showErrorDialog).toHaveBeenLastCalledWith('salah', 'Gagal masuk');
  });
  it('register sukses dan gagal', async () => {
    api.postRegister.mockResolvedValue({});
    expect((await run(A.asyncAuthRegister({}))).result).toBe(true);
    expect(showSuccessDialog).toHaveBeenCalled();
    api.postRegister.mockRejectedValue(new Error('x'));
    const { dispatch, result } = await run(A.asyncAuthRegister({}));
    expect(result).toBe(false);
    expect(dispatch).toHaveBeenCalledWith(A.setIsAuthRegisterActionCreator(false));
  });
  it('logout menghapus token dan profil', async () => {
    localStorage.setItem('accessToken', 'abc');
    const { dispatch } = await run(A.asyncAuthLogout());
    expect(getAccessToken()).toBeNull();
    expect(dispatch).toHaveBeenCalledWith(receiveProfileActionCreator(null));
    expect(dispatch).toHaveBeenCalledWith(A.setIsAuthLogoutActionCreator(true));
  });
});
