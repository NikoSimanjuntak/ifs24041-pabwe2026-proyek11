import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  ApiError, BASE_URL, apiRequest, buildUrl, getAccessToken, putAccessToken, removeAccessToken,
} from './apiHelper';

const mockFetch = (response, ok = true, status = 200) => {
  const fn = vi.fn().mockResolvedValue({ ok, status, json: async () => response });
  vi.stubGlobal('fetch', fn);
  return fn;
};

afterEach(() => vi.unstubAllGlobals());

describe('apiHelper', () => {
  it('menyimpan, membaca, dan menghapus token', () => {
    putAccessToken('abc');
    expect(getAccessToken()).toBe('abc');
    removeAccessToken();
    expect(getAccessToken()).toBeNull();
  });

  it('buildUrl menyusun query dan mengabaikan nilai kosong', () => {
    const url = new URL(buildUrl('/applications', { status: 'applied', q: '', x: undefined, y: null, n: 0 }));
    expect(url.href.startsWith(BASE_URL)).toBe(true);
    expect(url.searchParams.get('status')).toBe('applied');
    expect(url.searchParams.has('q')).toBe(false);
    expect(url.searchParams.get('n')).toBe('0');
    expect(buildUrl('/x')).toBe(`${BASE_URL}/x`);
  });

  it('menambahkan Authorization & body JSON', async () => {
    putAccessToken('tok');
    const fetchMock = mockFetch({ status: 'success', data: { a: 1 } });
    const res = await apiRequest('/applications', { method: 'POST', body: { company: 'X' } });
    const [, opts] = fetchMock.mock.calls[0];
    expect(opts.headers.Authorization).toBe('Bearer tok');
    expect(opts.headers['Content-Type']).toBe('application/json');
    expect(opts.body).toBe('{"company":"X"}');
    expect(res.data).toEqual({ a: 1 });
  });

  it('tanpa token / auth:false tidak mengirim Authorization dan body', async () => {
    putAccessToken('tok');
    const fetchMock = mockFetch({ status: 'success' });
    await apiRequest('/auth/login', { auth: false });
    expect(fetchMock.mock.calls[0][1].headers.Authorization).toBeUndefined();
    expect(fetchMock.mock.calls[0][1].body).toBeUndefined();
    removeAccessToken();
    await apiRequest('/x');
    expect(fetchMock.mock.calls[1][1].headers.Authorization).toBeUndefined();
  });

  it('melempar ApiError dengan pesan validasi pertama', async () => {
    mockFetch({ status: 'fail', message: 'Gagal', data: { email: ['Email tidak valid.'] } }, false, 422);
    await expect(apiRequest('/x')).rejects.toMatchObject({ name: 'ApiError', message: 'Email tidak valid.', status: 422 });
  });

  it('memakai message bila tak ada detail, dan pesan bawaan bila tak ada JSON', async () => {
    mockFetch({ status: 'fail', message: 'Tidak ditemukan', data: null }, false, 404);
    await expect(apiRequest('/x')).rejects.toMatchObject({ message: 'Tidak ditemukan', status: 404 });

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 502, json: async () => { throw new Error('bukan json'); } }));
    await expect(apiRequest('/x')).rejects.toMatchObject({ message: 'Permintaan gagal (502)' });
  });

  it('menganggap status bukan "success" sebagai kegagalan walau HTTP 200', async () => {
    mockFetch({ status: 'error', message: 'Aneh' });
    await expect(apiRequest('/x')).rejects.toBeInstanceOf(ApiError);
  });

  it('respons sukses tanpa JSON mengembalikan objek kosong', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 204, json: async () => { throw new Error('kosong'); } }));
    expect(await apiRequest('/x')).toEqual({});
  });

  it('jaringan putus → ApiError ramah pengguna', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
    await expect(apiRequest('/x')).rejects.toThrow(/Tidak dapat terhubung/);
  });

  it('data validasi non-objek diabaikan', async () => {
    mockFetch({ status: 'fail', message: 'Ups', data: 'teks' }, false, 400);
    await expect(apiRequest('/x')).rejects.toMatchObject({ message: 'Ups' });
  });
});
