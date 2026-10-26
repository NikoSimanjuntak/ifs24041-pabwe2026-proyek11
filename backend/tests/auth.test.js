import { describe, expect, it } from 'vitest';
import { login, setup } from './helpers.js';

describe('Auth & pengguna', () => {
  it('registrasi berhasil lalu login mengembalikan token', async () => {
    const { api } = setup();
    const reg = await api.post('/api/auth/register').send({ name: 'Budi', email: 'Budi@Del.ac.id', password: 'rahasia123' });
    expect(reg.status).toBe(201);
    expect(reg.body.status).toBe('success');

    const res = await api.post('/api/auth/login').send({ email: 'budi@del.ac.id', password: 'rahasia123' });
    expect(res.status).toBe(200);
    expect(res.body.data.token).toEqual(expect.any(String));
  });

  it('menolak registrasi tidak valid (422) dan email ganda (409)', async () => {
    const { api } = setup();
    const bad = await api.post('/api/auth/register').send({ name: 'B', email: 'salah', password: '123' });
    expect(bad.status).toBe(422);
    expect(bad.body.data).toHaveProperty('name');
    expect(bad.body.data).toHaveProperty('email');
    expect(bad.body.data).toHaveProperty('password');

    await api.post('/api/auth/register').send({ name: 'Budi', email: 'b@del.ac.id', password: 'rahasia123' });
    const dup = await api.post('/api/auth/register').send({ name: 'Budi 2', email: 'B@del.ac.id', password: 'rahasia123' });
    expect(dup.status).toBe(409);
  });

  it('menolak login dengan kredensial salah', async () => {
    const { api } = setup();
    await api.post('/api/auth/register').send({ name: 'Budi', email: 'b@del.ac.id', password: 'rahasia123' });
    expect((await api.post('/api/auth/login').send({ email: 'b@del.ac.id', password: 'salah-sekali' })).status).toBe(401);
    expect((await api.post('/api/auth/login').send({ email: 'x@del.ac.id', password: 'rahasia123' })).status).toBe(401);
    expect((await api.post('/api/auth/login').send({})).status).toBe(422);
  });

  it('endpoint terproteksi menolak tanpa/dengan token salah', async () => {
    const { api } = setup();
    expect((await api.get('/api/users/me')).status).toBe(401);
    expect((await api.get('/api/users/me').set('Authorization', 'Bearer palsu')).status).toBe(401);
  });

  it('menolak token milik pengguna yang sudah tidak ada', async () => {
    const { api, db } = setup();
    const auth = await login(api);
    db.prepare('DELETE FROM users').run();
    expect((await api.get('/api/users/me').set(auth)).status).toBe(401);
  });

  it('GET & PUT /users/me', async () => {
    const { api } = setup();
    const auth = await login(api);
    const me = await api.get('/api/users/me').set(auth);
    expect(me.body.data.user).toMatchObject({ name: 'Budi', email: 'budi@del.ac.id' });
    expect(me.body.data.user).not.toHaveProperty('password_hash');

    const upd = await api.put('/api/users/me').set(auth).send({ name: 'Budi Santoso', email: 'budi.s@del.ac.id' });
    expect(upd.status).toBe(200);
    expect(upd.body.data.user.name).toBe('Budi Santoso');

    await login(api, { name: 'Sari', email: 'sari@del.ac.id', password: 'rahasia123' });
    const clash = await api.put('/api/users/me').set(auth).send({ name: 'Budi', email: 'sari@del.ac.id' });
    expect(clash.status).toBe(409);
  });

  it('PUT /users/me/password memvalidasi dan mengganti kata sandi', async () => {
    const { api } = setup();
    const auth = await login(api);
    const url = '/api/users/me/password';
    expect((await api.put(url).set(auth).send({ password: 'rahasia123', new_password: 'baru-12345', new_password_confirmation: 'beda' })).status).toBe(422);
    expect((await api.put(url).set(auth).send({ password: 'salah', new_password: 'baru-12345', new_password_confirmation: 'baru-12345' })).status).toBe(422);
    expect((await api.put(url).set(auth).send({ password: 'rahasia123', new_password: 'baru-12345', new_password_confirmation: 'baru-12345' })).status).toBe(200);
    expect((await api.post('/api/auth/login').send({ email: 'budi@del.ac.id', password: 'baru-12345' })).status).toBe(200);
  });
});
