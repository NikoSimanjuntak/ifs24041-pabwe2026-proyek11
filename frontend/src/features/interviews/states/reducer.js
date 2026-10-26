import { ActionType } from './action';

export function interviewsReducer(state = [], action = {}) {
  return action.type === ActionType.RECEIVE_INTERVIEWS ? action.payload.interviews : state;
}

const flag = (type) => (state = false, action = {}) => (action.type === type ? action.payload.status : state);

export const isInterviewReducer = flag(ActionType.SET_IS_INTERVIEW);
export const isInterviewSaveReducer = flag(ActionType.SET_IS_INTERVIEW_SAVE);
