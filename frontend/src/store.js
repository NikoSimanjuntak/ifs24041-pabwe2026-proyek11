import { configureStore } from '@reduxjs/toolkit';
import { isAuthLoginReducer, isAuthLogoutReducer, isAuthRegisterReducer } from './features/auth/states/reducer';
import {
  isChangeProfilePasswordReducer,
  isChangeProfileReducer,
  isProfileReducer,
  profileReducer,
} from './features/users/states/reducer';
import { dashboardReducer, isDashboardReducer } from './features/dashboard/states/reducer';
import {
  applicationReducer,
  applicationsReducer,
  isApplicationReducer,
  isApplicationSaveReducer,
} from './features/applications/states/reducer';
import { interviewsReducer, isInterviewReducer, isInterviewSaveReducer } from './features/interviews/states/reducer';

export const reducer = {
  // auth
  isAuthLogin: isAuthLoginReducer,
  isAuthRegister: isAuthRegisterReducer,
  isAuthLogout: isAuthLogoutReducer,
  // users
  profile: profileReducer,
  isProfile: isProfileReducer,
  isChangeProfile: isChangeProfileReducer,
  isChangeProfilePassword: isChangeProfilePasswordReducer,
  // dashboard
  dashboard: dashboardReducer,
  isDashboard: isDashboardReducer,
  // applications
  applications: applicationsReducer,
  application: applicationReducer,
  isApplication: isApplicationReducer,
  isApplicationSave: isApplicationSaveReducer,
  // interviews
  interviews: interviewsReducer,
  isInterview: isInterviewReducer,
  isInterviewSave: isInterviewSaveReducer,
};

const store = configureStore({ reducer });

export default store;
