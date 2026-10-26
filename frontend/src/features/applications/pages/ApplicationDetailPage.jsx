import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { FiArrowLeft, FiCalendar, FiEdit2, FiExternalLink, FiPlus, FiTrash2 } from 'react-icons/fi';
import Spinner from '../../../components/Spinner';
import StatusBadge from '../../../components/StatusBadge';
import { INTERVIEW_STATUSES, INTERVIEW_TYPES, STATUS_META, STATUS_ORDER, WORK_TYPES } from '../../../helpers/constants';
import { formatCurrency, formatDate, formatDateTime, relativeDays, showConfirmDialog } from '../../../helpers/toolsHelper';
import InterviewModal from '../../interviews/modals/InterviewModal';
import { asyncInterviewDelete } from '../../interviews/states/action';
import ApplicationModal from '../modals/ApplicationModal';
import { asyncApplication, asyncApplicationDelete, asyncApplicationStatus } from '../states/action';

const MAIN_PATH = ['saved', 'applied', 'screening', 'interview', 'offer', 'accepted'];

/** Indikator kemajuan tahap. Tahap akhir negatif (ditolak/dibatalkan) ditampilkan sebagai lencana. */
export function StageProgress({ status }) {
  const current = MAIN_PATH.indexOf(status);
  if (current === -1) {
    return <p className="text-sm text-ink-soft">Proses berakhir dengan status <StatusBadge status={status} />.</p>;
  }
  return (
    <ol className="flex items-center" aria-label="Kemajuan tahap seleksi">
      {MAIN_PATH.map((s, i) => (
        <li key={s} className="flex flex-1 items-center last:flex-none" aria-current={i === current ? 'step' : undefined}>
          <span className="flex flex-col items-center gap-1.5">
            <span className={`grid h-7 w-7 place-items-center rounded-full text-xs font-bold ${i <= current ? 'bg-brand text-white' : 'bg-paper text-ink-soft'} ${i === current ? 'ring-4 ring-brand-soft' : ''}`}>{i + 1}</span>
            <span className={`hidden text-[11px] sm:block ${i === current ? 'font-bold text-ink' : 'text-ink-soft'}`}>{STATUS_META[s].label}</span>
          </span>
          {i < MAIN_PATH.length - 1 && <span className={`mx-1 mb-5 h-0.5 flex-1 sm:mb-5 ${i < current ? 'bg-brand' : 'bg-line'}`} />}
        </li>
      ))}
    </ol>
  );
}

const Info = ({ label, children }) => (
  <div>
    <dt className="text-xs font-semibold uppercase tracking-wide text-ink-soft">{label}</dt>
    <dd className="mt-0.5 text-sm font-medium">{children || '-'}</dd>
  </div>
);

const isLink = (v) => /^https?:\/\//i.test(v ?? '');

export default function ApplicationDetailPage() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const application = useSelector((s) => s.application);
  const isLoading = useSelector((s) => s.isApplication);
  const saving = useSelector((s) => s.isApplicationSave);

  const [modal, setModal] = useState(null); // 'edit' | 'interview' | { interview }
  const [nextStatus, setNextStatus] = useState('');
  const [note, setNote] = useState('');

  useEffect(() => {
    dispatch(asyncApplication(id));
  }, [dispatch, id]);

  useEffect(() => {
    if (application) setNextStatus(application.status);
  }, [application]);

  const reload = () => dispatch(asyncApplication(id));

  const handleDelete = async () => {
    const ok = await showConfirmDialog('Lamaran ini beserta jadwal dan riwayatnya akan dihapus permanen.', {
      title: 'Hapus lamaran?', confirmText: 'Ya, hapus',
    });
    if (ok && (await dispatch(asyncApplicationDelete(id)))) navigate('/applications', { replace: true });
  };

  const handleStatus = async (event) => {
    event.preventDefault();
    if (await dispatch(asyncApplicationStatus(id, { status: nextStatus, note: note.trim() || undefined }))) {
      setNote('');
      reload();
    }
  };

  const handleDeleteInterview = async (interview) => {
    const ok = await showConfirmDialog(`Jadwal "${interview.title}" akan dihapus.`, { title: 'Hapus jadwal?', confirmText: 'Ya, hapus' });
    if (ok && (await dispatch(asyncInterviewDelete(interview.id)))) reload();
  };

  const back = (
    <Link to="/applications" className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-ink-soft hover:text-ink">
      <FiArrowLeft /> Kembali ke daftar
    </Link>
  );

  if (isLoading && !application) return <div className="mx-auto max-w-4xl">{back}<h1 className="sr-only">Detail lamaran</h1><Spinner label="Memuat detail…" /></div>;
  if (!application) {
    return (
      <div className="mx-auto max-w-4xl">
        {back}
        <div className="panel py-16 text-center">
          <h1 className="text-xl font-bold">Lamaran tidak ditemukan</h1>
          <p className="mt-1 text-sm text-ink-soft">Lamaran mungkin sudah dihapus atau tautannya keliru.</p>
        </div>
      </div>
    );
  }

  const a = application;
  const events = [...(a.events ?? [])].reverse();

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        {back}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <StatusBadge status={a.status} />
            <h1 className="mt-3 text-3xl font-extrabold">{a.company}</h1>
            <p className="text-ink-soft">{a.position}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn btn-ghost" onClick={() => setModal('edit')}><FiEdit2 /> Ubah data</button>
            <button type="button" className="btn btn-danger" onClick={handleDelete}><FiTrash2 /> Hapus</button>
          </div>
        </div>
      </div>

      <section className="panel p-6" aria-label="Kemajuan seleksi">
        <StageProgress status={a.status} />
        <form onSubmit={handleStatus} className="mt-6 flex flex-wrap items-end gap-3 border-t border-line pt-5">
          <div className="min-w-[10rem]">
            <label htmlFor="next-status" className="label">Pindahkan ke tahap</label>
            <select id="next-status" className="field" value={nextStatus} onChange={(e) => setNextStatus(e.target.value)}>
              {STATUS_ORDER.map((s) => <option key={s} value={s}>{STATUS_META[s].label}</option>)}
            </select>
          </div>
          <div className="min-w-[12rem] flex-1">
            <label htmlFor="status-note" className="label">Catatan (opsional)</label>
            <input id="status-note" className="field" maxLength={500} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Contoh: Menerima email undangan tes" />
          </div>
          <button type="submit" className="btn btn-primary" disabled={saving || nextStatus === a.status}>Perbarui tahap</button>
        </form>
      </section>

      <section className="panel p-6" aria-label="Informasi lamaran">
        <h2 className="mb-4 text-lg font-bold">Informasi</h2>
        <dl className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <Info label="Lokasi">{a.location}</Info>
          <Info label="Tipe kerja">{WORK_TYPES[a.work_type]}</Info>
          <Info label="Uang saku">{formatCurrency(a.allowance)}</Info>
          <Info label="Tanggal melamar">{a.applied_date && formatDate(a.applied_date)}</Info>
          <Info label="Batas pendaftaran">{a.deadline_date && `${formatDate(a.deadline_date)} (${relativeDays(a.deadline_date)})`}</Info>
          <Info label="Tindak lanjut">{a.follow_up_date && `${formatDate(a.follow_up_date)} (${relativeDays(a.follow_up_date)})`}</Info>
          <Info label="Kontak">{[a.contact_name, a.contact_email].filter(Boolean).join(' · ')}</Info>
          <Info label="Tautan lowongan">
            {isLink(a.source_url) && (
              <a href={a.source_url} target="_blank" rel="noreferrer noopener" className="inline-flex items-center gap-1 text-brand underline underline-offset-4">
                Buka lowongan <FiExternalLink aria-hidden="true" />
              </a>
            )}
          </Info>
        </dl>
        {a.notes && (
          <div className="mt-6 border-t border-line pt-5">
            <h3 className="text-sm font-bold">Catatan</h3>
            <p className="mt-1 whitespace-pre-line text-sm text-ink-soft">{a.notes}</p>
          </div>
        )}
      </section>

      <section className="panel p-6" aria-label="Jadwal wawancara">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 text-lg font-bold"><FiCalendar aria-hidden="true" className="text-brand" /> Jadwal wawancara</h2>
          <button type="button" className="btn btn-ghost !py-1.5" onClick={() => setModal('interview')}><FiPlus /> Tambah jadwal</button>
        </div>
        {a.interviews?.length ? (
          <ul className="divide-y divide-line">
            {a.interviews.map((i) => (
              <li key={i.id} className="flex flex-wrap items-start justify-between gap-3 py-4">
                <div className="min-w-0">
                  <p className="font-semibold">{i.title} <span className="ml-1 rounded-full bg-paper px-2 py-0.5 text-xs font-semibold text-ink-soft">{INTERVIEW_STATUSES[i.status]}</span></p>
                  <p className="text-sm text-ink-soft">{formatDateTime(i.scheduled_at)} · {INTERVIEW_TYPES[i.type]}</p>
                  {i.location && (isLink(i.location)
                    ? <a href={i.location} target="_blank" rel="noreferrer noopener" className="text-sm text-brand underline underline-offset-4">{i.location}</a>
                    : <p className="text-sm text-ink-soft">{i.location}</p>)}
                  {i.interviewer && <p className="text-sm text-ink-soft">Pewawancara: {i.interviewer}</p>}
                  {i.notes && <p className="mt-1 whitespace-pre-line text-sm text-ink-soft">{i.notes}</p>}
                </div>
                <div className="flex gap-2">
                  <button type="button" aria-label={`Ubah jadwal ${i.title}`} className="btn btn-ghost !px-2.5 !py-1.5" onClick={() => setModal({ interview: i })}><FiEdit2 /></button>
                  <button type="button" aria-label={`Hapus jadwal ${i.title}`} className="btn btn-ghost !px-2.5 !py-1.5 text-danger" onClick={() => handleDeleteInterview(i)}><FiTrash2 /></button>
                </div>
              </li>
            ))}
          </ul>
        ) : <p className="py-6 text-center text-sm text-ink-soft">Belum ada jadwal wawancara.</p>}
      </section>

      <section className="panel p-6" aria-label="Riwayat tahapan">
        <h2 className="mb-4 text-lg font-bold">Riwayat tahapan</h2>
        <ol className="space-y-4 border-l-2 border-line pl-5">
          {events.map((e) => (
            <li key={e.id} className="relative">
              <span aria-hidden="true" className={`absolute -left-[1.62rem] top-1.5 h-3 w-3 rounded-full ring-4 ring-white ${STATUS_META[e.to_status]?.bar ?? 'bg-slate-400'}`} />
              <p className="text-sm font-semibold">
                {e.from_status ? `${STATUS_META[e.from_status]?.label ?? e.from_status} → ` : ''}{STATUS_META[e.to_status]?.label ?? e.to_status}
              </p>
              <p className="text-xs text-ink-soft">{formatDateTime(e.created_at)}</p>
              {e.note && <p className="mt-0.5 text-sm text-ink-soft">{e.note}</p>}
            </li>
          ))}
        </ol>
      </section>

      {modal === 'edit' && <ApplicationModal application={a} onClose={() => setModal(null)} onSaved={reload} />}
      {modal === 'interview' && <InterviewModal applicationId={a.id} onClose={() => setModal(null)} onSaved={reload} />}
      {modal?.interview && <InterviewModal interview={modal.interview} onClose={() => setModal(null)} onSaved={reload} />}
    </div>
  );
}
