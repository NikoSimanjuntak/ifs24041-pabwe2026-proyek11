import { ActionType } from './action';

export function applicationsReducer(state = [], action = {}) {
  return action.type === ActionType.RECEIVE_APPLICATIONS ? action.payload.applications : state;
}
export function applicationReducer(state = null, action = {}) {
  return action.type === ActionType.RECEIVE_APPLICATION ? action.payload.application : state;
}

const flag = (type) => (state = false, action = {}) => (action.type === type ? action.payload.status : state);

export const isApplicationReducer = flag(ActionType.SET_IS_APPLICATION);
export const isApplicationSaveReducer = flag(ActionType.SET_IS_APPLICATION_SAVE);
