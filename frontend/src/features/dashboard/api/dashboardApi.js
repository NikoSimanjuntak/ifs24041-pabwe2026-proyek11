import { apiRequest } from '../../../helpers/apiHelper';
import { nowLocal, todayLocal } from '../../../helpers/toolsHelper';

/** GET /dashboard/summary — waktu lokal dikirim agar pengingat sesuai zona waktu pengguna. */
export const getDashboardSummary = async () =>
  (await apiRequest('/dashboard/summary', { params: { today: todayLocal(), now: nowLocal() } })).data;
