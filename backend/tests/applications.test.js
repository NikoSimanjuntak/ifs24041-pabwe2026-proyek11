import { describe, expect, it } from 'vitest';
import { login, sampleApplication, setup } from './helpers.js';

const create = async (api, auth, overrides) => {
  const res = await api.post('/api/applications').set(auth).send(sampleApplication(overrides));
  return res.body.data.application_id;
};

describe('Lamaran', () => {
  it('membuat lamaran dengan status awal "saved" dan mencatat riwayat', async () => {
    const { api } = setup();
    const auth = await login(api);
    const res = await api.post('/api/applications').set(auth).send(sampleApplication({ allowance: '3000000', deadline_date: '2026-11-30' }));
    expect(res.status).toBe(201);

    const detail = await api.get(`/api/applications/${res.body.data.application_id}`).set(auth);
    const app = detail.body.data.application;
    expect(app).toMatchObject({ company: 'Gojek', status: 'saved', allowance: 3000000, applied_date: null });
    expect(app.events).toHaveLength(1);
    expect(app.events[0]).toMatchObject({ from_status: null, to_status: 'saved' });
    expect(app.interviews).toEqual([]);
  });

  it('mengisi applied_date otomatis bila dibuat langsung dengan status "applied"', async () => {
    const { api } = setup();
    const auth = await login(api);
    const id = await create(api, auth, { status: 'applied' });
    const { application } = (await api.get(`/api/applications/${id}`).set(auth)).body.data;
    expect(application.applied_date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('memvalidasi input', async () => {
    const { api } = setup();
    const auth = await login(api);
    const res = await api.post('/api/applications').set(auth).send({
      position: 'Intern', work_type: 'kapal', source_url: 'ftp://x', deadline_date: '2026-02-31',
      allowance: -5, contact_email: 'salah', status: 'selesai',
    });
    expect(res.status).toBe(422);
    expect(Object.keys(res.body.data)).toEqual(
      expect.arrayContaining(['company', 'work_type', 'source_url', 'deadline_date', 'allowance', 'contact_email', 'status']),
    );
  });

  it('daftar lamaran mendukung filter status, pencarian, tipe kerja, dan urutan', async () => {
    const { api } = setup();
    const auth = await login(api);
    await create(api, auth, { company: 'Gojek', position: 'Backend', status: 'applied', work_type: 'onsite' });
    await create(api, auth, { company: 'Tokopedia', position: 'Frontend', status: 'interview', work_type: 'remote' });
    await create(api, auth, { company: 'Bukalapak 100%', position: 'QA', deadline_date: '2026-12-01' });

    const get = (qs) => api.get(`/api/applications${qs}`).set(auth);
    expect((await get('')).body.data.applications).toHaveLength(3);
    expect((await get('?status=applied,interview')).body.data.applications).toHaveLength(2);
    expect((await get('?q=front')).body.data.applications[0].company).toBe('Tokopedia');
    expect((await get('?q=100%25')).body.data.applications).toHaveLength(1);
    expect((await get('?q=%25')).body.data.applications).toHaveLength(1);
    expect((await get('?work_type=remote')).body.data.applications).toHaveLength(1);
    expect((await get('?sort=company')).body.data.applications[0].company).toBe('Bukalapak 100%');
    expect((await get('?sort=deadline')).body.data.applications[0].company).toBe('Bukalapak 100%');
    expect((await get('?sort=applied')).status).toBe(200);
    expect((await get('?sort=newest')).status).toBe(200);
    expect((await get('?status=ngawur')).status).toBe(422);
    expect((await get('?work_type=ngawur')).status).toBe(422);
    expect((await get('?sort=ngawur')).status).toBe(422);
  });

  it('memperbarui lamaran (PUT) termasuk perubahan status', async () => {
    const { api } = setup();
    const auth = await login(api);
    const id = await create(api, auth);

    const upd = await api.put(`/api/applications/${id}`).set(auth).send(sampleApplication({ company: 'Gojek Tech', status: 'applied', notes: 'Kirim CV' }));
    expect(upd.status).toBe(200);

    const { application } = (await api.get(`/api/applications/${id}`).set(auth)).body.data;
    expect(application).toMatchObject({ company: 'Gojek Tech', status: 'applied', notes: 'Kirim CV' });
    expect(application.applied_date).not.toBeNull();
    expect(application.events.map((e) => e.to_status)).toEqual(['saved', 'applied']);

    // tanpa status → status tidak berubah
    await api.put(`/api/applications/${id}`).set(auth).send(sampleApplication());
    const again = (await api.get(`/api/applications/${id}`).set(auth)).body.data.application;
    expect(again.status).toBe('applied');
    expect(again.events).toHaveLength(2);
  });

  it('PATCH status menyimpan catatan riwayat dan tidak menduplikasi status sama', async () => {
    const { api } = setup();
    const auth = await login(api);
    const id = await create(api, auth);
    const url = `/api/applications/${id}/status`;

    expect((await api.patch(url).set(auth).send({ status: 'screening', note: 'Seleksi berkas dimulai' })).status).toBe(200);
    await api.patch(url).set(auth).send({ status: 'screening' });
    expect((await api.patch(url).set(auth).send({ status: 'xx' })).status).toBe(422);

    const { application } = (await api.get(`/api/applications/${id}`).set(auth)).body.data;
    expect(application.events).toHaveLength(2);
    expect(application.events[1]).toMatchObject({ from_status: 'saved', to_status: 'screening', note: 'Seleksi berkas dimulai' });
  });

  it('menghapus lamaran beserta data turunannya', async () => {
    const { api, db } = setup();
    const auth = await login(api);
    const id = await create(api, auth);
    await api.post(`/api/applications/${id}/interviews`).set(auth).send({ title: 'HR', scheduled_at: '2026-12-01T10:00' });

    expect((await api.delete(`/api/applications/${id}`).set(auth)).status).toBe(200);
    expect((await api.get(`/api/applications/${id}`).set(auth)).status).toBe(404);
    expect(db.prepare('SELECT COUNT(*) n FROM interviews').get().n).toBe(0);
    expect(db.prepare('SELECT COUNT(*) n FROM application_events').get().n).toBe(0);
  });

  it('data antar pengguna terisolasi (404 untuk milik orang lain)', async () => {
    const { api } = setup();
    const budi = await login(api);
    const sari = await login(api, { name: 'Sari', email: 'sari@del.ac.id', password: 'rahasia123' });
    const id = await create(api, budi);

    expect((await api.get(`/api/applications/${id}`).set(sari)).status).toBe(404);
    expect((await api.put(`/api/applications/${id}`).set(sari).send(sampleApplication())).status).toBe(404);
    expect((await api.patch(`/api/applications/${id}/status`).set(sari).send({ status: 'applied' })).status).toBe(404);
    expect((await api.delete(`/api/applications/${id}`).set(sari)).status).toBe(404);
    expect((await api.get('/api/applications').set(sari)).body.data.applications).toEqual([]);
  });

  it('id tidak valid → 404', async () => {
    const { api } = setup();
    const auth = await login(api);
    expect((await api.get('/api/applications/abc').set(auth)).status).toBe(404);
    expect((await api.get('/api/applications/0').set(auth)).status).toBe(404);
  });
});
