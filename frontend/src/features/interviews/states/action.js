import { showErrorDialog, showSuccessDialog } from '../../../helpers/toolsHelper';
import { deleteInterview, getInterviews, postInterview, putInterview } from '../api/interviewApi';

export const ActionType = {
  RECEIVE_INTERVIEWS: 'interviews/RECEIVE_INTERVIEWS',
  SET_IS_INTERVIEW: 'interviews/SET_IS_INTERVIEW',
  SET_IS_INTERVIEW_SAVE: 'interviews/SET_IS_INTERVIEW_SAVE',
};

const flagCreator = (type) => (status) => ({ type, payload: { status } });

export const receiveInterviewsActionCreator = (interviews) => ({ type: ActionType.RECEIVE_INTERVIEWS, payload: { interviews } });
export const setIsInterviewActionCreator = flagCreator(ActionType.SET_IS_INTERVIEW);
export const setIsInterviewSaveActionCreator = flagCreator(ActionType.SET_IS_INTERVIEW_SAVE);

export function asyncInterviews(scope = 'all') {
  return async (dispatch) => {
    dispatch(setIsInterviewActionCreator(true));
    try {
      dispatch(receiveInterviewsActionCreator(await getInterviews(scope)));
    } catch (error) {
      showErrorDialog(error.message, 'Gagal memuat jadwal');
    } finally {
      dispatch(setIsInterviewActionCreator(false));
    }
  };
}

const saveAction = (run, { success, failure }) => async (dispatch) => {
  dispatch(setIsInterviewSaveActionCreator(true));
  try {
    const result = await run();
    showSuccessDialog(success);
    return result ?? true;
  } catch (error) {
    showErrorDialog(error.message, failure);
    return false;
  } finally {
    dispatch(setIsInterviewSaveActionCreator(false));
  }
};

export const asyncInterviewAdd = (applicationId, payload) =>
  saveAction(() => postInterview(applicationId, payload), { success: 'Jadwal wawancara ditambahkan.', failure: 'Gagal menambah jadwal' });

export const asyncInterviewChange = (id, payload) =>
  saveAction(async () => { await putInterview(id, payload); }, { success: 'Jadwal wawancara diperbarui.', failure: 'Gagal memperbarui jadwal' });

export const asyncInterviewDelete = (id) =>
  saveAction(async () => { await deleteInterview(id); }, { success: 'Jadwal wawancara dihapus.', failure: 'Gagal menghapus jadwal' });
