import { describe, expect, it, vi } from 'vitest';
import { apiRequest } from '../../../helpers/apiHelper';
import { deleteInterview, getInterviews, postInterview, putInterview } from './interviewApi';

vi.mock('../../../helpers/apiHelper', () => ({ apiRequest: vi.fn() }));

describe('interviewApi', () => {
  it('getInterviews mengirim scope dan waktu lokal', async () => {
    apiRequest.mockResolvedValue({ data: { interviews: [{ id: 1 }] } });
    expect(await getInterviews('upcoming')).toEqual([{ id: 1 }]);
    expect(apiRequest.mock.calls[0][1].params).toMatchObject({ scope: 'upcoming' });
    await getInterviews();
    expect(apiRequest.mock.calls[1][1].params.scope).toBe('all');
  });
  it('postInterview mengembalikan id', async () => {
    apiRequest.mockResolvedValue({ data: { interview_id: 4 } });
    expect(await postInterview(2, { title: 'HR' })).toBe(4);
    expect(apiRequest).toHaveBeenCalledWith('/applications/2/interviews', { method: 'POST', body: { title: 'HR' } });
  });
  it('putInterview & deleteInterview', async () => {
    apiRequest.mockResolvedValue({});
    await putInterview(4, { title: 'X' });
    expect(apiRequest).toHaveBeenLastCalledWith('/interviews/4', { method: 'PUT', body: { title: 'X' } });
    await deleteInterview(4);
    expect(apiRequest).toHaveBeenLastCalledWith('/interviews/4', { method: 'DELETE' });
  });
});
