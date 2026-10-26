import { putAccessToken, removeAccessToken } from '../../../helpers/apiHelper';
import { showErrorDialog, showSuccessDialog } from '../../../helpers/toolsHelper';
import { postLogin, postRegister } from '../api/authApi';
import { receiveProfileActionCreator } from '../../users/states/action';

export const ActionType = {
  SET_IS_AUTH_LOGIN: 'auth/SET_IS_AUTH_LOGIN',
  SET_IS_AUTH_REGISTER: 'auth/SET_IS_AUTH_REGISTER',
  SET_IS_AUTH_LOGOUT: 'auth/SET_IS_AUTH_LOGOUT',
};

export const setIsAuthLoginActionCreator = (status) => ({ type: ActionType.SET_IS_AUTH_LOGIN, payload: { status } });
export const setIsAuthRegisterActionCreator = (status) => ({ type: ActionType.SET_IS_AUTH_REGISTER, payload: { status } });
export const setIsAuthLogoutActionCreator = (status) => ({ type: ActionType.SET_IS_AUTH_LOGOUT, payload: { status } });

/** Mengembalikan true jika login berhasil. */
export function asyncAuthLogin({ email, password }) {
  return async (dispatch) => {
    try {
      const data = await postLogin({ email, password });
      if (!data?.token) throw new Error('Token tidak diterima dari server.');
      putAccessToken(data.token);
      dispatch(setIsAuthLoginActionCreator(true));
      dispatch(setIsAuthLogoutActionCreator(false));
      return true;
    } catch (error) {
      showErrorDialog(error.message, 'Gagal masuk');
      return false;
    }
  };
}

/** Mengembalikan true jika registrasi berhasil. */
export function asyncAuthRegister({ name, email, password }) {
  return async (dispatch) => {
    try {
      await postRegister({ name, email, password });
      dispatch(setIsAuthRegisterActionCreator(true));
      showSuccessDialog('Akun berhasil dibuat. Silakan masuk.');
      return true;
    } catch (error) {
      dispatch(setIsAuthRegisterActionCreator(false));
      showErrorDialog(error.message, 'Gagal mendaftar');
      return false;
    }
  };
}

export function asyncAuthLogout() {
  return async (dispatch) => {
    removeAccessToken();
    dispatch(receiveProfileActionCreator(null));
    dispatch(setIsAuthLoginActionCreator(false));
    dispatch(setIsAuthLogoutActionCreator(true));
  };
}
