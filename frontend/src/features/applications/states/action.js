import { showErrorDialog, showSuccessDialog } from '../../../helpers/toolsHelper';
import {
  deleteApplication,
  getApplicationById,
  getApplications,
  patchApplicationStatus,
  postApplication,
  putApplication,
} from '../api/applicationApi';

export const ActionType = {
  RECEIVE_APPLICATIONS: 'applications/RECEIVE_APPLICATIONS',
  RECEIVE_APPLICATION: 'applications/RECEIVE_APPLICATION',
  SET_IS_APPLICATION: 'applications/SET_IS_APPLICATION',
  SET_IS_APPLICATION_SAVE: 'applications/SET_IS_APPLICATION_SAVE',
};

const flagCreator = (type) => (status) => ({ type, payload: { status } });

export const receiveApplicationsActionCreator = (applications) => ({ type: ActionType.RECEIVE_APPLICATIONS, payload: { applications } });
export const receiveApplicationActionCreator = (application) => ({ type: ActionType.RECEIVE_APPLICATION, payload: { application } });
export const setIsApplicationActionCreator = flagCreator(ActionType.SET_IS_APPLICATION);
export const setIsApplicationSaveActionCreator = flagCreator(ActionType.SET_IS_APPLICATION_SAVE);

export function asyncApplications(params = {}) {
  return async (dispatch) => {
    dispatch(setIsApplicationActionCreator(true));
    try {
      dispatch(receiveApplicationsActionCreator(await getApplications(params)));
    } catch (error) {
      showErrorDialog(error.message, 'Gagal memuat lamaran');
    } finally {
      dispatch(setIsApplicationActionCreator(false));
    }
  };
}

export function asyncApplication(id) {
  return async (dispatch) => {
    dispatch(receiveApplicationActionCreator(null));
    dispatch(setIsApplicationActionCreator(true));
    try {
      dispatch(receiveApplicationActionCreator(await getApplicationById(id)));
    } catch (error) {
      showErrorDialog(error.message, 'Gagal memuat detail lamaran');
    } finally {
      dispatch(setIsApplicationActionCreator(false));
    }
  };
}

/** Membungkus aksi tulis: flag simpan, dialog sukses/gagal, mengembalikan hasil atau false. */
const saveAction = (run, { success, failure }) => async (dispatch) => {
  dispatch(setIsApplicationSaveActionCreator(true));
  try {
    const result = await run();
    showSuccessDialog(success);
    return result ?? true;
  } catch (error) {
    showErrorDialog(error.message, failure);
    return false;
  } finally {
    dispatch(setIsApplicationSaveActionCreator(false));
  }
};

/** Mengembalikan id lamaran baru, atau false bila gagal. */
export const asyncApplicationAdd = (payload) =>
  saveAction(() => postApplication(payload), { success: 'Lamaran berhasil ditambahkan.', failure: 'Gagal menambah lamaran' });

export const asyncApplicationChange = (id, payload) =>
  saveAction(async () => { await putApplication(id, payload); }, { success: 'Lamaran berhasil diperbarui.', failure: 'Gagal memperbarui lamaran' });

export const asyncApplicationStatus = (id, payload) =>
  saveAction(async () => { await patchApplicationStatus(id, payload); }, { success: 'Tahap lamaran diperbarui.', failure: 'Gagal mengubah tahap' });

export const asyncApplicationDelete = (id) =>
  saveAction(async () => { await deleteApplication(id); }, { success: 'Lamaran berhasil dihapus.', failure: 'Gagal menghapus lamaran' });
