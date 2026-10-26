import { describe, expect, it, vi } from 'vitest';
import { showErrorDialog } from '../../../helpers/toolsHelper';
import * as api from '../api/interviewApi';
import * as A from './action';
import * as R from './reducer';

vi.mock('../api/interviewApi');
vi.mock('../../../helpers/toolsHelper');

const run = async (thunk) => {
  const dispatch = vi.fn();
  const result = await thunk(dispatch);
  return { dispatch, result };
};

describe('interviews state', () => {
  it('reducers', () => {
    expect(R.interviewsReducer(undefined, {})).toEqual([]);
    expect(R.interviewsReducer([], A.receiveInterviewsActionCreator([{ id: 1 }]))).toEqual([{ id: 1 }]);
    expect(R.interviewsReducer([1], { type: 'LAIN' })).toEqual([1]);
    expect(R.isInterviewReducer(false, A.setIsInterviewActionCreator(true))).toBe(true);
    expect(R.isInterviewSaveReducer(undefined)).toBe(false);
    expect(R.isInterviewSaveReducer(false, A.setIsInterviewSaveActionCreator(true))).toBe(true);
  });

  it('asyncInterviews sukses & gagal (scope bawaan "all")', async () => {
    api.getInterviews.mockResolvedValue([{ id: 1 }]);
    const { dispatch } = await run(A.asyncInterviews());
    expect(api.getInterviews).toHaveBeenCalledWith('all');
    expect(dispatch).toHaveBeenCalledWith(A.receiveInterviewsActionCreator([{ id: 1 }]));
    api.getInterviews.mockRejectedValue(new Error('x'));
    await run(A.asyncInterviews('past'));
    expect(showErrorDialog).toHaveBeenCalledWith('x', 'Gagal memuat jadwal');
  });

  it('tambah / ubah / hapus', async () => {
    api.postInterview.mockResolvedValue(8);
    api.putInterview.mockResolvedValue({});
    api.deleteInterview.mockResolvedValue({});
    expect((await run(A.asyncInterviewAdd(1, { title: 'HR' }))).result).toBe(8);
    expect((await run(A.asyncInterviewChange(8, {}))).result).toBe(true);
    expect((await run(A.asyncInterviewDelete(8))).result).toBe(true);
    api.postInterview.mockRejectedValue(new Error('a'));
    api.putInterview.mockRejectedValue(new Error('b'));
    api.deleteInterview.mockRejectedValue(new Error('c'));
    expect((await run(A.asyncInterviewAdd(1, {}))).result).toBe(false);
    expect((await run(A.asyncInterviewChange(8, {}))).result).toBe(false);
    expect((await run(A.asyncInterviewDelete(8))).result).toBe(false);
  });
});
