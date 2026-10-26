import { apiRequest } from '../../../helpers/apiHelper';

/** POST /auth/login → { token } */
export const postLogin = async ({ email, password }) => {
  const res = await apiRequest('/auth/login', { method: 'POST', body: { email, password }, auth: false });
  return res.data;
};

/** POST /auth/register */
export const postRegister = async ({ name, email, password }) =>
  apiRequest('/auth/register', { method: 'POST', body: { name, email, password }, auth: false });
