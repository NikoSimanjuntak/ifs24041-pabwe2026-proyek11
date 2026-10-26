import request from 'supertest';
import { createApp } from '../src/app.js';
import { loadConfig } from '../src/config.js';
import { openDatabase } from '../src/db.js';

export const config = loadConfig({ NODE_ENV: 'test', JWT_SECRET: 'test-secret' });

export function setup() {
  const db = openDatabase(':memory:');
  const app = createApp(db, config);
  return { db, app, api: request(app) };
}

/** Mendaftarkan + login pengguna, mengembalikan header Authorization. */
export async function login(api, { name = 'Budi', email = 'budi@del.ac.id', password = 'rahasia123' } = {}) {
  await api.post('/api/auth/register').send({ name, email, password });
  const res = await api.post('/api/auth/login').send({ email, password });
  return { Authorization: `Bearer ${res.body.data.token}` };
}

export const sampleApplication = (overrides = {}) => ({
  company: 'Gojek',
  position: 'Backend Intern',
  location: 'Jakarta',
  work_type: 'hybrid',
  ...overrides,
});
