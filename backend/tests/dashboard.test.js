import { describe, expect, it } from 'vitest';
import { lastMonths } from '../src/routes/dashboard.js';
import { login, sampleApplication, setup } from './helpers.js';

describe('Dashboard', () => {
  it('lastMonths menghasilkan 6 bulan berurutan lintas tahun', () => {
    expect(lastMonths('2026-02-10')).toEqual(['2025-09', '2025-10', '2025-11', '2025-12', '2026-01', '2026-02']);
  });

  it('ringkasan kosong untuk pengguna baru', async () => {
    const { api } = setup();
    const auth = await login(api);
    const { data } = (await api.get('/api/dashboard/summary').set(auth)).body;
    expect(data).toMatchObject({ total: 0, active: 0, response_rate: 0, upcoming_interviews: [], follow_ups: [], deadlines: [] });
    expect(data.monthly).toHaveLength(6);
  });

  it('menghitung statistik, pengingat, tenggat, dan jadwal terdekat', async () => {
    const { api } = setup();
    const auth = await login(api);
    const add = async (o) => (await api.post('/api/applications').set(auth).send(sampleApplication(o))).body.data.application_id;

    await add({ company: 'A', status: 'applied', applied_date: '2026-10-05', follow_up_date: '2026-10-20' }); // terlambat
    await add({ company: 'B', status: 'screening', applied_date: '2026-09-15', follow_up_date: '2026-10-28' }); // dalam 7 hari
    await add({ company: 'C', status: 'applied', applied_date: '2026-09-20', follow_up_date: '2026-12-30' }); // masih jauh
    await add({ company: 'D', status: 'rejected', applied_date: '2026-08-01' });
    await add({ company: 'E', status: 'saved', deadline_date: '2026-10-30' });
    await add({ company: 'F', status: 'saved', deadline_date: '2026-10-01' }); // sudah lewat
    const g = await add({ company: 'G', status: 'offer', applied_date: '2026-10-02' });
    await api.post(`/api/applications/${g}/interviews`).set(auth).send({ title: 'Akhir', scheduled_at: '2026-10-26T09:00' });
    await api.post(`/api/applications/${g}/interviews`).set(auth).send({ title: 'Lama', scheduled_at: '2026-10-01T09:00' });

    const res = await api.get('/api/dashboard/summary?today=2026-10-24&now=2026-10-24T08:00').set(auth);
    const d = res.body.data;

    expect(d.total).toBe(7);
    expect(d.by_status).toMatchObject({ saved: 2, applied: 2, screening: 1, rejected: 1, offer: 1, interview: 0 });
    expect(d.active).toBe(4);
    // diajukan = 5; direspons = screening(1)+rejected(1)+offer(1) = 3 → 60%
    expect(d.response_rate).toBe(60);
    expect(d.upcoming_interviews.map((i) => i.title)).toEqual(['Akhir']);
    expect(d.follow_ups.map((f) => [f.company, f.overdue])).toEqual([['A', true], ['B', false]]);
    expect(d.deadlines.map((x) => x.company)).toEqual(['E']);
    expect(d.monthly.at(-1)).toEqual({ month: '2026-10', total: 2 });
    expect(d.monthly.find((m) => m.month === '2026-09').total).toBe(2);
  });

  it('abaikan parameter today/now yang tidak valid', async () => {
    const { api } = setup();
    const auth = await login(api);
    expect((await api.get('/api/dashboard/summary?today=besok&now=sekarang').set(auth)).status).toBe(200);
  });
});
