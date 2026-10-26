import { describe, expect, it } from 'vitest';
import { login, sampleApplication, setup } from './helpers.js';

const setupApp = async () => {
  const ctx = setup();
  const auth = await login(ctx.api);
  const res = await ctx.api.post('/api/applications').set(auth).send(sampleApplication({ status: 'applied' }));
  return { ...ctx, auth, appId: res.body.data.application_id };
};

const payload = (o = {}) => ({ title: 'Wawancara HR', type: 'online', scheduled_at: '2026-11-10T10:00', location: 'https://meet.example.com/x', ...o });

describe('Jadwal wawancara', () => {
  it('menambah wawancara dan memajukan lamaran ke tahap "interview"', async () => {
    const { api, auth, appId } = await setupApp();
    const res = await api.post(`/api/applications/${appId}/interviews`).set(auth).send(payload());
    expect(res.status).toBe(201);

    const { application } = (await api.get(`/api/applications/${appId}`).set(auth)).body.data;
    expect(application.status).toBe('interview');
    expect(application.interviews).toHaveLength(1);
    expect(application.events.at(-1)).toMatchObject({ from_status: 'applied', to_status: 'interview' });

    // wawancara kedua tidak menduplikasi riwayat
    await api.post(`/api/applications/${appId}/interviews`).set(auth).send(payload({ title: 'User', scheduled_at: '2026-11-12T13:00:00' }));
    const after = (await api.get(`/api/applications/${appId}`).set(auth)).body.data.application;
    expect(after.events.filter((e) => e.to_status === 'interview')).toHaveLength(1);
  });

  it('tidak memundurkan tahap bila lamaran sudah di tahap lanjut', async () => {
    const { api, auth, appId } = await setupApp();
    await api.patch(`/api/applications/${appId}/status`).set(auth).send({ status: 'offer' });
    await api.post(`/api/applications/${appId}/interviews`).set(auth).send(payload());
    expect((await api.get(`/api/applications/${appId}`).set(auth)).body.data.application.status).toBe('offer');
  });

  it('memvalidasi input wawancara', async () => {
    const { api, auth, appId } = await setupApp();
    const res = await api.post(`/api/applications/${appId}/interviews`).set(auth).send({ type: 'telepati', scheduled_at: '2026-13-40T25:99' });
    expect(res.status).toBe(422);
    expect(Object.keys(res.body.data)).toEqual(expect.arrayContaining(['title', 'type', 'scheduled_at']));
    expect((await api.post('/api/applications/999/interviews').set(auth).send(payload())).status).toBe(404);
  });

  it('GET /interviews memfilter upcoming / past / all berdasarkan waktu acuan', async () => {
    const { api, auth, appId } = await setupApp();
    const add = (o) => api.post(`/api/applications/${appId}/interviews`).set(auth).send(payload(o));
    await add({ title: 'Lama', scheduled_at: '2026-10-01T09:00' });
    await add({ title: 'Akan datang', scheduled_at: '2026-11-20T09:00' });
    await add({ title: 'Dibatalkan', scheduled_at: '2026-11-25T09:00', status: 'cancelled' });

    const get = (qs) => api.get(`/api/interviews${qs}`).set(auth).then((r) => r.body.data.interviews.map((i) => i.title));
    const now = '?now=2026-10-24T08:00';
    expect(await get(`${now}&scope=upcoming`)).toEqual(['Akan datang']);
    expect(await get(`${now}&scope=past`)).toEqual(['Dibatalkan', 'Lama']);
    expect(await get(`${now}`)).toHaveLength(3);
    expect(await get('?scope=upcoming')).toBeInstanceOf(Array);
    expect((await api.get('/api/interviews?scope=x').set(auth)).status).toBe(422);
  });

  it('GET, PUT, DELETE satu wawancara', async () => {
    const { api, auth, appId } = await setupApp();
    const { interview_id } = (await api.post(`/api/applications/${appId}/interviews`).set(auth).send(payload())).body.data;

    const got = await api.get(`/api/interviews/${interview_id}`).set(auth);
    expect(got.body.data.interview).toMatchObject({ title: 'Wawancara HR', company: 'Gojek' });

    const put = await api.put(`/api/interviews/${interview_id}`).set(auth).send(payload({ title: 'HR Final', status: 'done', interviewer: 'Rina', notes: 'Lancar' }));
    expect(put.status).toBe(200);
    expect((await api.get(`/api/interviews/${interview_id}`).set(auth)).body.data.interview).toMatchObject({ title: 'HR Final', status: 'done', interviewer: 'Rina' });

    expect((await api.delete(`/api/interviews/${interview_id}`).set(auth)).status).toBe(200);
    expect((await api.get(`/api/interviews/${interview_id}`).set(auth)).status).toBe(404);
    expect((await api.put(`/api/interviews/${interview_id}`).set(auth).send(payload())).status).toBe(404);
  });

  it('wawancara milik pengguna lain tidak dapat diakses', async () => {
    const { api, auth, appId } = await setupApp();
    const { interview_id } = (await api.post(`/api/applications/${appId}/interviews`).set(auth).send(payload())).body.data;
    const sari = await login(api, { name: 'Sari', email: 'sari@del.ac.id', password: 'rahasia123' });

    expect((await api.get(`/api/interviews/${interview_id}`).set(sari)).status).toBe(404);
    expect((await api.delete(`/api/interviews/${interview_id}`).set(sari)).status).toBe(404);
    expect((await api.post(`/api/applications/${appId}/interviews`).set(sari).send(payload())).status).toBe(404);
    expect((await api.get('/api/interviews').set(sari)).body.data.interviews).toEqual([]);
  });
});
