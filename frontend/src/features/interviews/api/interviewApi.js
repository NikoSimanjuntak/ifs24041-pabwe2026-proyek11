import { apiRequest } from '../../../helpers/apiHelper';
import { nowLocal } from '../../../helpers/toolsHelper';

/** GET /interviews?scope=upcoming|past|all */
export const getInterviews = async (scope = 'all') =>
  (await apiRequest('/interviews', { params: { scope, now: nowLocal() } })).data.interviews;

/** POST /applications/:applicationId/interviews → id wawancara */
export const postInterview = async (applicationId, payload) =>
  (await apiRequest(`/applications/${applicationId}/interviews`, { method: 'POST', body: payload })).data.interview_id;

/** PUT /interviews/:id */
export const putInterview = async (id, payload) =>
  apiRequest(`/interviews/${id}`, { method: 'PUT', body: payload });

/** DELETE /interviews/:id */
export const deleteInterview = async (id) =>
  apiRequest(`/interviews/${id}`, { method: 'DELETE' });
