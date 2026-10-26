import { showErrorDialog } from '../../../helpers/toolsHelper';
import { getDashboardSummary } from '../api/dashboardApi';

export const ActionType = {
  RECEIVE_DASHBOARD: 'dashboard/RECEIVE_DASHBOARD',
  SET_IS_DASHBOARD: 'dashboard/SET_IS_DASHBOARD',
};

export const receiveDashboardActionCreator = (dashboard) => ({ type: ActionType.RECEIVE_DASHBOARD, payload: { dashboard } });
export const setIsDashboardActionCreator = (status) => ({ type: ActionType.SET_IS_DASHBOARD, payload: { status } });

export function asyncDashboard() {
  return async (dispatch) => {
    dispatch(setIsDashboardActionCreator(true));
    try {
      dispatch(receiveDashboardActionCreator(await getDashboardSummary()));
    } catch (error) {
      showErrorDialog(error.message, 'Gagal memuat dashboard');
    } finally {
      dispatch(setIsDashboardActionCreator(false));
    }
  };
}
