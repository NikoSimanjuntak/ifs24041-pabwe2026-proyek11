import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { loadConfig } from '../src/config.js';
import { openDatabase } from '../src/db.js';
import { seed } from '../src/seed.js';
import { isDateTime, isUrl, parseId, validate } from '../src/utils/validate.js';
import { config, setup } from './helpers.js';
import request from 'supertest';

describe('Aplikasi umum', () => {
  it('health check & root', async () => {
    const { api } = setup();
    expect((await api.get('/api/health')).body.status).toBe('success');
    expect((await api.get('/')).body.data.name).toBe('InternTrack API');
  });

  it('endpoint tidak dikenal → 404 JSON', async () => {
    const { api } = setup();
    const res = await api.get('/api/tidak-ada');
    expect(res.status).toBe(404);
    expect(res.body.status).toBe('fail');
  });

  it('JSON rusak → 400, body terlalu besar → 413', async () => {
    const { api } = setup();
    const bad = await api.post('/api/auth/login').set('Content-Type', 'application/json').send('{rusak');
    expect(bad.status).toBe(400);
    const big = await api.post('/api/auth/login').send({ email: 'a@b.co', password: 'x'.repeat(200_000) });
    expect(big.status).toBe(413);
  });

  it('error tak terduga → 500 tanpa membocorkan detail', async () => {
    const db = openDatabase(':memory:');
    const app = createApp(db, config);
    db.close(); // memaksa error database
    const res = await request(app).post('/api/auth/register').send({ name: 'Budi', email: 'b@del.ac.id', password: 'rahasia123' });
    expect(res.status).toBe(500);
    expect(res.body.message).toBe('Terjadi kesalahan pada server.');
  });

  it('CORS: origin "*" dan daftar origin', async () => {
    const db = openDatabase(':memory:');
    const any = request(createApp(db, { ...config, corsOrigin: '*' }));
    expect((await any.get('/api/health').set('Origin', 'https://x.test')).headers['access-control-allow-origin']).toBe('*');
    const one = request(createApp(db, { ...config, corsOrigin: 'https://app.test, https://b.test' }));
    expect((await one.get('/api/health').set('Origin', 'https://app.test')).headers['access-control-allow-origin']).toBe('https://app.test');
  });
});

describe('Konfigurasi', () => {
  it('default dan produksi', () => {
    expect(loadConfig({ NODE_ENV: 'development' })).toMatchObject({ port: 3000, rateLimit: true });
    expect(loadConfig({ NODE_ENV: 'test' }).rateLimit).toBe(false);
    expect(() => loadConfig({ NODE_ENV: 'production' })).toThrow(/JWT_SECRET/);
    expect(() => loadConfig({ NODE_ENV: 'production', JWT_SECRET: 'pendek' })).toThrow();
    expect(loadConfig({ NODE_ENV: 'production', JWT_SECRET: 'x'.repeat(40), PORT: '8080' }).port).toBe(8080);
  });

  it('rate limiter aktif pada rute auth', async () => {
    const db = openDatabase(':memory:');
    const api = request(createApp(db, { ...config, rateLimit: true }));
    const res = await api.post('/api/auth/login').send({});
    expect(res.headers).toHaveProperty('ratelimit-limit');
  });
});

describe('Validator & seed', () => {
  it('helper validasi', () => {
    expect(isDateTime('2026-10-24T10:00')).toBe(true);
    expect(isDateTime('2026-10-24T24:00')).toBe(false);
    expect(isDateTime('2026-10-24')).toBe(false);
    expect(isUrl('https://a.co')).toBe(true);
    expect(isUrl('bukan url')).toBe(false);
    expect(() => parseId('-1')).toThrow();
  });

  it('validate: tipe teks, panjang, dan default', () => {
    expect(() => validate({ a: 12 }, { a: {} })).toThrow();
    expect(() => validate({ a: 'abcd' }, { a: { max: 3 } })).toThrow();
    expect(validate({}, { a: { default: 'x' } })).toEqual({ a: 'x' });
    expect(validate({ a: ' ' }, { a: {} })).toEqual({ a: null });
    expect(validate({}, { a: {} })).toEqual({});
    expect(validate({ a: '' }, { a: {} })).toEqual({ a: null });
    expect(validate({ e: 'A@B.CO' }, { e: { type: 'email' } }).e).toBe('a@b.co');
  });

  it('seed membuat data demo sekali saja', async () => {
    const { api, db } = setup();
    expect(seed(db)).toBe(true);
    expect(seed(db)).toBe(false);
    const login = await api.post('/api/auth/login').send({ email: 'demo@interntrack.id', password: 'password123' });
    const auth = { Authorization: `Bearer ${login.body.data.token}` };
    const sum = await api.get('/api/dashboard/summary').set(auth);
    expect(sum.body.data.total).toBe(7);
    expect(sum.body.data.upcoming_interviews.length).toBeGreaterThan(0);
  });
});
