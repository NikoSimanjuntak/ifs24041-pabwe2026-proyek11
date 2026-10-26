const ACCESS_TOKEN_KEY = 'accessToken';

/** Base URL REST API InternTrack (didefinisikan lewat `define` pada vite.config.js). */
export const BASE_URL =
  typeof API_BASEURL !== 'undefined' ? API_BASEURL : 'http://localhost:3000/api';

export class ApiError extends Error {
  constructor(message, status = 0, data = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

/* ------------------------------ Token storage ----------------------------- */
export const getAccessToken = () => localStorage.getItem(ACCESS_TOKEN_KEY);
export const putAccessToken = (token) => localStorage.setItem(ACCESS_TOKEN_KEY, token);
export const removeAccessToken = () => localStorage.removeItem(ACCESS_TOKEN_KEY);

/* --------------------------------- Helpers -------------------------------- */
/** Menyusun URL lengkap + query params (nilai kosong diabaikan). */
export const buildUrl = (path, params = {}) => {
  const url = new URL(`${BASE_URL}${path}`);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.append(key, value);
    }
  });
  return url.toString();
};

const firstValidationMessage = (data) => {
  if (!data || typeof data !== 'object') return null;
  const first = Object.values(data).find((v) => Array.isArray(v) && v.length);
  return first ? first[0] : null;
};

/**
 * Wrapper fetch ke API InternTrack.
 * - menambahkan header Authorization: Bearer <token> otomatis
 * - mendukung query params dan body JSON
 * - melempar ApiError berisi pesan yang siap ditampilkan ke pengguna
 */
export async function apiRequest(path, { method = 'GET', params, body, auth = true } = {}) {
  const headers = { Accept: 'application/json' };
  if (auth) {
    const token = getAccessToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }
  if (body) headers['Content-Type'] = 'application/json';

  let response;
  try {
    response = await fetch(buildUrl(path, params), {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError('Tidak dapat terhubung ke server. Periksa koneksi internet kamu.');
  }

  let json = null;
  try {
    json = await response.json();
  } catch {
    json = null;
  }

  if (!response.ok || (json && json.status && json.status !== 'success')) {
    const detail = firstValidationMessage(json?.data);
    const message = detail || json?.message || `Permintaan gagal (${response.status})`;
    throw new ApiError(message, response.status, json?.data ?? null);
  }

  return json ?? {};
}
