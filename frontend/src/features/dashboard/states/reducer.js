import { ActionType } from './action';

export function dashboardReducer(state = null, action = {}) {
  return action.type === ActionType.RECEIVE_DASHBOARD ? action.payload.dashboard : state;
}
export function isDashboardReducer(state = false, action = {}) {
  return action.type === ActionType.SET_IS_DASHBOARD ? action.payload.status : state;
}
