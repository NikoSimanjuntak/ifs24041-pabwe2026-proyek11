import { ActionType } from './action';
import { getAccessToken } from '../../../helpers/apiHelper';

export function isAuthLoginReducer(state = Boolean(getAccessToken()), action = {}) {
  return action.type === ActionType.SET_IS_AUTH_LOGIN ? action.payload.status : state;
}
export function isAuthRegisterReducer(state = false, action = {}) {
  return action.type === ActionType.SET_IS_AUTH_REGISTER ? action.payload.status : state;
}
export function isAuthLogoutReducer(state = false, action = {}) {
  return action.type === ActionType.SET_IS_AUTH_LOGOUT ? action.payload.status : state;
}
