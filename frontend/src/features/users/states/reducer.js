import { ActionType } from './action';

export function profileReducer(state = null, action = {}) {
  return action.type === ActionType.RECEIVE_PROFILE ? action.payload.profile : state;
}

const flag = (type) => (state = false, action = {}) => (action.type === type ? action.payload.status : state);

export const isProfileReducer = flag(ActionType.SET_IS_PROFILE);
export const isChangeProfileReducer = flag(ActionType.SET_IS_CHANGE_PROFILE);
export const isChangeProfilePasswordReducer = flag(ActionType.SET_IS_CHANGE_PROFILE_PASSWORD);
