import { describe, expect, it } from 'vitest';
import * as A from './action';
import { isAuthLoginReducer, isAuthLogoutReducer, isAuthRegisterReducer } from './reducer';

describe('auth reducers', () => {
  it('isAuthLogin: default dari token, dan berubah oleh action', () => {
    expect(isAuthLoginReducer(undefined, {})).toBe(false);
    localStorage.setItem('accessToken', 't');
    expect(isAuthLoginReducer(undefined)).toBe(true);
    expect(isAuthLoginReducer(true, A.setIsAuthLoginActionCreator(false))).toBe(false);
    expect(isAuthLoginReducer(true, { type: 'LAIN' })).toBe(true);
  });
  it('isAuthRegister & isAuthLogout', () => {
    expect(isAuthRegisterReducer(undefined)).toBe(false);
    expect(isAuthRegisterReducer(false, A.setIsAuthRegisterActionCreator(true))).toBe(true);
    expect(isAuthLogoutReducer(undefined)).toBe(false);
    expect(isAuthLogoutReducer(false, A.setIsAuthLogoutActionCreator(true))).toBe(true);
  });
});
