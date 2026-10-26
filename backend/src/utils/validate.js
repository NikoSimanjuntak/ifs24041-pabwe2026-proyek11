import { HttpError } from './httpError.js';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const DATETIME_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const isDate = (v) => {
  if (typeof v !== 'string' || !DATE_RE.test(v)) return false;
  const d = new Date(`${v}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === v;
};

export const isDateTime = (v) =>
  typeof v === 'string' && DATETIME_RE.test(v) && isDate(v.slice(0, 10)) &&
  Number(v.slice(11, 13)) < 24 && Number(v.slice(14, 16)) < 60;

export const isEmail = (v) => typeof v === 'string' && EMAIL_RE.test(v.trim());

export const isUrl = (v) => {
  try {
    const u = new URL(v);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
};

const blank = (v) => v === undefined || v === null || (typeof v === 'string' && v.trim() === '');

/**
 * Validasi sederhana berbasis aturan.
 * rules: { field: { label, required, type, min, max, oneOf } }
 * Mengembalikan nilai yang sudah dibersihkan atau melempar HttpError 422.
 */
export function validate(body = {}, rules) {
  const errors = {};
  const clean = {};

  for (const [field, rule] of Object.entries(rules)) {
    const label = rule.label ?? field;
    let value = body?.[field];
    const add = (msg) => {
      errors[field] = [msg];
    };

    if (blank(value)) {
      if (rule.required) add(`${label} wajib diisi.`);
      else if (rule.default !== undefined) clean[field] = rule.default;
      else if (body && field in body) clean[field] = null;
      continue;
    }

    if (typeof value === 'string') value = value.trim();

    switch (rule.type) {
      case 'email':
        if (!isEmail(value)) add(`Format ${label.toLowerCase()} tidak valid.`);
        else value = value.toLowerCase();
        break;
      case 'date':
        if (!isDate(value)) add(`${label} harus berformat YYYY-MM-DD.`);
        break;
      case 'datetime':
        if (!isDateTime(value)) add(`${label} harus berformat YYYY-MM-DDTHH:mm.`);
        break;
      case 'url':
        if (!isUrl(value)) add(`${label} harus berupa URL http(s) yang valid.`);
        break;
      case 'int':
        if (!Number.isInteger(Number(value)) || Number(value) < (rule.min ?? 0)) {
          add(`${label} harus berupa bilangan bulat ≥ ${rule.min ?? 0}.`);
        } else value = Number(value);
        break;
      default:
        if (typeof value !== 'string') add(`${label} harus berupa teks.`);
    }

    if (!errors[field] && rule.oneOf && !rule.oneOf.includes(value)) {
      add(`${label} harus salah satu dari: ${rule.oneOf.join(', ')}.`);
    }
    if (!errors[field] && typeof value === 'string') {
      if (rule.min && value.length < rule.min) add(`${label} minimal ${rule.min} karakter.`);
      if (rule.max && value.length > rule.max) add(`${label} maksimal ${rule.max} karakter.`);
    }
    if (!errors[field]) clean[field] = value;
  }

  if (Object.keys(errors).length) {
    const first = Object.values(errors)[0][0];
    throw new HttpError(422, first, errors);
  }
  return clean;
}

/** Mengubah id route menjadi integer positif atau 404. */
export const parseId = (value) => {
  const id = Number(value);
  if (!Number.isInteger(id) || id < 1) throw new HttpError(404, 'Data tidak ditemukan.');
  return id;
};
