import { apiRequest } from '../../../helpers/apiHelper';

/** GET /users/me */
export const getProfile = async () => (await apiRequest('/users/me')).data.user;

/** PUT /users/me */
export const putProfile = async ({ name, email }) =>
  (await apiRequest('/users/me', { method: 'PUT', body: { name, email } })).data.user;

/** PUT /users/me/password */
export const putProfilePassword = async ({ password, new_password, new_password_confirmation }) =>
  apiRequest('/users/me/password', {
    method: 'PUT',
    body: { password, new_password, new_password_confirmation },
  });
