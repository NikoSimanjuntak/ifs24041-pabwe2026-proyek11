import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import ModalShell from '../../../components/ModalShell';
import { INTERVIEW_STATUSES, INTERVIEW_TYPES } from '../../../helpers/constants';
import { asyncInterviewAdd, asyncInterviewChange } from '../states/action';

export const validateInterview = ({ title, scheduled_at, application_id }, needsApplication) => {
  const errors = {};
  if (needsApplication && !application_id) errors.application_id = 'Pilih lamaran terlebih dahulu.';
  if (!title.trim()) errors.title = 'Judul wawancara wajib diisi.';
  if (!scheduled_at) errors.scheduled_at = 'Waktu wawancara wajib diisi.';
  return errors;
};

const toForm = (i) => ({
  title: i?.title ?? '',
  type: i?.type ?? 'online',
  scheduled_at: i?.scheduled_at?.slice(0, 16) ?? '',
  location: i?.location ?? '',
  interviewer: i?.interviewer ?? '',
  notes: i?.notes ?? '',
  status: i?.status ?? 'scheduled',
  application_id: '',
});

/**
 * Modal tambah / ubah jadwal wawancara.
 * - `interview` terisi → mode ubah
 * - `applicationId` terisi → tambah untuk lamaran tertentu
 * - `applications` terisi → tambah dengan memilih lamaran
 */
export default function InterviewModal({ interview = null, applicationId = null, applications = [], onClose, onSaved }) {
  const dispatch = useDispatch();
  const saving = useSelector((state) => state.isInterviewSave);
  const [values, setValues] = useState(toForm(interview));
  const [errors, setErrors] = useState({});
  const needsApplication = !interview && !applicationId;

  const bind = (name) => ({
    id: `iv-${name}`,
    value: values[name],
    onChange: (e) => setValues((prev) => ({ ...prev, [name]: e.target.value })),
    'aria-invalid': Boolean(errors[name]),
  });

  const handleSubmit = async (event) => {
    event.preventDefault();
    const found = validateInterview(values, needsApplication);
    setErrors(found);
    if (Object.keys(found).length) return;

    const { application_id, ...rest } = values;
    const payload = Object.fromEntries(
      Object.entries(rest).filter(([, v]) => (typeof v === 'string' ? v.trim() !== '' : true)),
    );

    const result = interview
      ? await dispatch(asyncInterviewChange(interview.id, payload))
      : await dispatch(asyncInterviewAdd(applicationId ?? application_id, payload));
    if (result) {
      onSaved?.(result);
      onClose();
    }
  };

  return (
    <ModalShell title={interview ? 'Ubah jadwal wawancara' : 'Tambah jadwal wawancara'} onClose={onClose}>
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {needsApplication && (
          <div>
            <label htmlFor="iv-application_id" className="label">Lamaran</label>
            <select className="field" {...bind('application_id')}>
              <option value="">— Pilih lamaran —</option>
              {applications.map((a) => <option key={a.id} value={a.id}>{a.company} · {a.position}</option>)}
            </select>
            {errors.application_id && <p className="field-error">{errors.application_id}</p>}
          </div>
        )}
        <div>
          <label htmlFor="iv-title" className="label">Judul</label>
          <input className="field" placeholder="Contoh: Wawancara HR" {...bind('title')} />
          {errors.title && <p className="field-error">{errors.title}</p>}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="iv-scheduled_at" className="label">Waktu</label>
            <input type="datetime-local" className="field" {...bind('scheduled_at')} />
            {errors.scheduled_at && <p className="field-error">{errors.scheduled_at}</p>}
          </div>
          <div>
            <label htmlFor="iv-type" className="label">Jenis</label>
            <select className="field" {...bind('type')}>
              {Object.entries(INTERVIEW_TYPES).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="iv-location" className="label">Lokasi / tautan</label>
            <input className="field" placeholder="Alamat atau link meeting" {...bind('location')} />
          </div>
          <div>
            <label htmlFor="iv-interviewer" className="label">Pewawancara</label>
            <input className="field" placeholder="Opsional" {...bind('interviewer')} />
          </div>
          {interview && (
            <div>
              <label htmlFor="iv-status" className="label">Status</label>
              <select className="field" {...bind('status')}>
                {Object.entries(INTERVIEW_STATUSES).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
          )}
        </div>
        <div>
          <label htmlFor="iv-notes" className="label">Catatan persiapan</label>
          <textarea rows={3} className="field" placeholder="Materi yang perlu dipelajari, pertanyaan untuk pewawancara…" {...bind('notes')} />
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <button type="button" className="btn btn-ghost" onClick={onClose}>Batal</button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Menyimpan…' : 'Simpan jadwal'}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}
