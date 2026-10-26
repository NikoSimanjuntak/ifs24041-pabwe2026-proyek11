import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { FiEdit2, FiMapPin, FiPlus, FiTrash2, FiUser } from 'react-icons/fi';
import EmptyState from '../../../components/EmptyState';
import Segmented from '../../../components/Segmented';
import Spinner from '../../../components/Spinner';
import { INTERVIEW_STATUSES, INTERVIEW_TYPES } from '../../../helpers/constants';
import { formatDate, formatTime, relativeDays, showConfirmDialog } from '../../../helpers/toolsHelper';
import { asyncApplications } from '../../applications/states/action';
import InterviewModal from '../modals/InterviewModal';
import { asyncInterviewDelete, asyncInterviews } from '../states/action';

const SCOPES = [['upcoming', 'Mendatang'], ['past', 'Riwayat']];
const STATUS_TONE = {
  scheduled: 'bg-amber-100 text-amber-800',
  done: 'bg-green-100 text-green-800',
  cancelled: 'bg-zinc-200 text-zinc-700',
};
const isLink = (v) => /^https?:\/\//i.test(v ?? '');

function InterviewCard({ item, past, onEdit, onDelete }) {
  return (
    <article className="panel flex flex-wrap items-start justify-between gap-4 p-5">
      <div className="flex min-w-0 gap-4">
        <div className="grid h-16 w-16 shrink-0 place-items-center rounded-xl bg-ink text-center text-white">
          <span>
            <span className="block font-display text-xl font-extrabold leading-none">{item.scheduled_at.slice(8, 10)}</span>
            <span className="block text-[10px] uppercase tracking-wide opacity-80">
              {new Intl.DateTimeFormat('id-ID', { month: 'short' }).format(new Date(`${item.scheduled_at.slice(0, 10)}T00:00:00`))}
            </span>
          </span>
        </div>
        <div className="min-w-0">
          <h3 className="font-bold">{item.title}</h3>
          <p className="text-sm">
            <Link to={`/applications/${item.application_id}`} className="font-semibold text-brand hover:underline">{item.company}</Link>
            <span className="text-ink-soft"> · {item.position}</span>
          </p>
          <p className="mt-1 text-sm text-ink-soft">{formatDate(item.scheduled_at)}, {formatTime(item.scheduled_at)} · {INTERVIEW_TYPES[item.type]}</p>
          {item.location && (
            <p className="flex items-center gap-1.5 text-sm text-ink-soft">
              <FiMapPin aria-hidden="true" className="shrink-0" />
              {isLink(item.location) ? <a href={item.location} target="_blank" rel="noreferrer noopener" className="truncate text-brand underline underline-offset-4">{item.location}</a> : item.location}
            </p>
          )}
          {item.interviewer && <p className="flex items-center gap-1.5 text-sm text-ink-soft"><FiUser aria-hidden="true" /> {item.interviewer}</p>}
        </div>
      </div>
      <div className="flex flex-col items-end gap-3">
        <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${STATUS_TONE[item.status]}`}>
          {past || item.status !== 'scheduled' ? INTERVIEW_STATUSES[item.status] : relativeDays(item.scheduled_at)}
        </span>
        <div className="flex gap-2">
          <button type="button" aria-label={`Ubah ${item.title} ${item.company}`} onClick={() => onEdit(item)} className="btn btn-ghost !px-2.5 !py-1.5"><FiEdit2 /></button>
          <button type="button" aria-label={`Hapus ${item.title} ${item.company}`} onClick={() => onDelete(item)} className="btn btn-ghost !px-2.5 !py-1.5 text-danger"><FiTrash2 /></button>
        </div>
      </div>
    </article>
  );
}

export default function InterviewsPage() {
  const dispatch = useDispatch();
  const interviews = useSelector((s) => s.interviews);
  const isLoading = useSelector((s) => s.isInterview);
  const applications = useSelector((s) => s.applications);

  const [scope, setScope] = useState('upcoming');
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState(null);

  useEffect(() => {
    dispatch(asyncInterviews(scope));
  }, [dispatch, scope]);

  useEffect(() => {
    dispatch(asyncApplications());
  }, [dispatch]);

  const reload = () => dispatch(asyncInterviews(scope));

  const handleDelete = async (item) => {
    const ok = await showConfirmDialog(`Jadwal "${item.title}" di ${item.company} akan dihapus.`, { title: 'Hapus jadwal?', confirmText: 'Ya, hapus' });
    if (ok && (await dispatch(asyncInterviewDelete(item.id)))) reload();
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold">Jadwal wawancara</h1>
          <p className="mt-1 text-sm text-ink-soft">Siapkan diri sebelum setiap wawancara dimulai.</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={() => setShowAdd(true)}><FiPlus /> Tambah jadwal</button>
      </div>

      <Segmented label="Filter jadwal" options={SCOPES} value={scope} onChange={setScope} />

      <section aria-label="Daftar jadwal wawancara" className="space-y-4">
        {isLoading && !interviews.length ? <Spinner label="Memuat jadwal…" />
          : interviews.length === 0 ? (
            <EmptyState
              title={scope === 'upcoming' ? 'Tidak ada wawancara mendatang' : 'Belum ada riwayat wawancara'}
              description="Jadwal yang kamu tambahkan akan muncul di sini."
            />
          ) : interviews.map((item) => (
            <InterviewCard key={item.id} item={item} past={scope === 'past'} onEdit={setEditing} onDelete={handleDelete} />
          ))}
      </section>

      {showAdd && <InterviewModal applications={applications} onClose={() => setShowAdd(false)} onSaved={reload} />}
      {editing && <InterviewModal interview={editing} onClose={() => setEditing(null)} onSaved={reload} />}
    </div>
  );
}
