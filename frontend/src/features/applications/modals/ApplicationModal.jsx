import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import ModalShell from '../../../components/ModalShell';
import { STATUS_META, STATUS_ORDER, WORK_TYPES } from '../../../helpers/constants';
import { asyncApplicationAdd, asyncApplicationChange } from '../states/action';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const EMPTY_FORM = {
  company: '', position: '', location: '', work_type: 'onsite', status: 'saved',
  source_url: '', allowance: '', deadline_date: '', applied_date: '', follow_up_date: '',
  contact_name: '', contact_email: '', notes: '',
};

export const validateApplication = (values) => {
  const errors = {};
  if (!values.company.trim()) errors.company = 'Nama perusahaan wajib diisi.';
  if (!values.position.trim()) errors.position = 'Posisi wajib diisi.';
  if (values.source_url.trim()) {
    try {
      if (!/^https?:$/.test(new URL(values.source_url.trim()).protocol)) throw new Error();
    } catch {
      errors.source_url = 'Tautan harus diawali http:// atau https://.';
    }
  }
  if (values.allowance !== '' && !(Number(values.allowance) >= 0)) errors.allowance = 'Uang saku harus berupa angka ≥ 0.';
  if (values.contact_email.trim() && !EMAIL_REGEX.test(values.contact_email.trim())) errors.contact_email = 'Format email tidak valid.';
  return errors;
};

/** Mengubah nilai form menjadi payload API (string kosong → dihilangkan). */
export const toPayload = (values) => {
  const payload = {};
  Object.entries(values).forEach(([key, value]) => {
    const text = typeof value === 'string' ? value.trim() : value;
    if (text === '') return;
    payload[key] = key === 'allowance' ? Number(text) : text;
  });
  return payload;
};

const fromApplication = (a) =>
  Object.fromEntries(Object.keys(EMPTY_FORM).map((k) => [k, a[k] ?? EMPTY_FORM[k]]));

/** Modal tambah / ubah lamaran. `application` kosong = mode tambah. */
export default function ApplicationModal({ application = null, onClose, onSaved }) {
  const dispatch = useDispatch();
  const saving = useSelector((state) => state.isApplicationSave);
  const [values, setValues] = useState(application ? fromApplication(application) : EMPTY_FORM);
  const [errors, setErrors] = useState({});

  const bind = (name) => ({
    id: `app-${name}`,
    value: values[name],
    onChange: (e) => setValues((prev) => ({ ...prev, [name]: e.target.value })),
    'aria-invalid': Boolean(errors[name]),
  });
  const err = (name) => (errors[name] ? <p className="field-error">{errors[name]}</p> : null);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const found = validateApplication(values);
    setErrors(found);
    if (Object.keys(found).length) return;

    const payload = toPayload(values);
    const result = application
      ? await dispatch(asyncApplicationChange(application.id, payload))
      : await dispatch(asyncApplicationAdd(payload));
    if (result) {
      onSaved?.(result);
      onClose();
    }
  };

  return (
    <ModalShell title={application ? 'Ubah lamaran' : 'Tambah lamaran'} onClose={onClose}>
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="app-company" className="label">Perusahaan</label>
            <input className="field" placeholder="Contoh: Gojek" {...bind('company')} />
            {err('company')}
          </div>
          <div>
            <label htmlFor="app-position" className="label">Posisi</label>
            <input className="field" placeholder="Contoh: Backend Intern" {...bind('position')} />
            {err('position')}
          </div>
          <div>
            <label htmlFor="app-location" className="label">Lokasi</label>
            <input className="field" placeholder="Contoh: Jakarta" {...bind('location')} />
          </div>
          <div>
            <label htmlFor="app-work_type" className="label">Tipe kerja</label>
            <select className="field" {...bind('work_type')}>
              {Object.entries(WORK_TYPES).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="app-status" className="label">Tahap seleksi</label>
            <select className="field" {...bind('status')}>
              {STATUS_ORDER.map((s) => <option key={s} value={s}>{STATUS_META[s].label}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="app-allowance" className="label">Uang saku / bulan (Rp)</label>
            <input type="number" min="0" className="field" placeholder="Opsional" {...bind('allowance')} />
            {err('allowance')}
          </div>
          <div>
            <label htmlFor="app-deadline_date" className="label">Batas pendaftaran</label>
            <input type="date" className="field" {...bind('deadline_date')} />
          </div>
          <div>
            <label htmlFor="app-applied_date" className="label">Tanggal melamar</label>
            <input type="date" className="field" {...bind('applied_date')} />
          </div>
          <div>
            <label htmlFor="app-follow_up_date" className="label">Tindak lanjut pada</label>
            <input type="date" className="field" {...bind('follow_up_date')} />
          </div>
          <div>
            <label htmlFor="app-source_url" className="label">Tautan lowongan</label>
            <input type="url" className="field" placeholder="https://…" {...bind('source_url')} />
            {err('source_url')}
          </div>
          <div>
            <label htmlFor="app-contact_name" className="label">Nama kontak (HR)</label>
            <input className="field" placeholder="Opsional" {...bind('contact_name')} />
          </div>
          <div>
            <label htmlFor="app-contact_email" className="label">Email kontak</label>
            <input type="email" className="field" placeholder="Opsional" {...bind('contact_email')} />
            {err('contact_email')}
          </div>
        </div>
        <div>
          <label htmlFor="app-notes" className="label">Catatan</label>
          <textarea rows={3} className="field" placeholder="Persyaratan, hasil tes, hal yang perlu diingat…" {...bind('notes')} />
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <button type="button" className="btn btn-ghost" onClick={onClose}>Batal</button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Menyimpan…' : 'Simpan lamaran'}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}
