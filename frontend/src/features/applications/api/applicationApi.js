import { apiRequest } from '../../../helpers/apiHelper';
import { nowLocal } from '../../../helpers/toolsHelper';

/** GET /applications (filter opsional: status, q, work_type, sort) */
export const getApplications = async (params = {}) =>
  (await apiRequest('/applications', { params: { now: nowLocal(), ...params } })).data.applications;

/** GET /applications/:id → lamaran + interviews + events */
export const getApplicationById = async (id) =>
  (await apiRequest(`/applications/${id}`)).data.application;

/** POST /applications → id lamaran baru */
export const postApplication = async (payload) =>
  (await apiRequest('/applications', { method: 'POST', body: payload })).data.application_id;

/** PUT /applications/:id */
export const putApplication = async (id, payload) =>
  apiRequest(`/applications/${id}`, { method: 'PUT', body: payload });

/** PATCH /applications/:id/status */
export const patchApplicationStatus = async (id, { status, note }) =>
  apiRequest(`/applications/${id}/status`, { method: 'PATCH', body: { status, note } });

/** DELETE /applications/:id */
export const deleteApplication = async (id) =>
  apiRequest(`/applications/${id}`, { method: 'DELETE' });
