import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { FiCalendar, FiEdit2, FiMapPin, FiPlus, FiSearch, FiTrash2 } from 'react-icons/fi';
import EmptyState from '../../../components/EmptyState';
import Spinner from '../../../components/Spinner';
import StatusBadge from '../../../components/StatusBadge';
import { STATUS_META, STATUS_ORDER, WORK_TYPES } from '../../../helpers/constants';
import { daysFromToday, formatDate, formatDateTime, relativeDays, showConfirmDialog } from '../../../helpers/toolsHelper';
import useInput from '../../../hooks/useInput';
import ApplicationModal from '../modals/ApplicationModal';
import { asyncApplicationDelete, asyncApplicationStatus, asyncApplications } from '../states/action';

const SORTERS = {
  recent: ['Terbaru diperbarui', () => 0], // urutan bawaan API (updated_at desc)
  company: ['Nama perusahaan (A–Z)', (a, b) => a.company.localeCompare(b.company, 'id')],
  deadline: ['Batas pendaftaran', (a, b) => (a.deadline_date ?? '9999').localeCompare(b.deadline_date ?? '9999')],
  applied: ['Tanggal melamar', (a, b) => (b.applied_date ?? '').localeCompare(a.applied_date ?? '')],
};

function Chip({ children, tone = 'bg-paper text-ink-soft' }) {
  return <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${tone}`}>{children}</span>;
}

function ApplicationCard({ item, onStatus, onEdit, onDelete }) {
  const followUpDays = ['applied', 'screening'].includes(item.status) && item.follow_up_date ? daysFromToday(item.follow_up_date) : null;
  const deadlineDays = item.status === 'saved' && item.deadline_date ? daysFromToday(item.deadline_date) : null;

  return (
    <article className="panel flex flex-col p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-lg font-bold leading-snug">
            <Link to={`/applications/${item.id}`} className="hover:underline">{item.company}</Link>
          </h3>
          <p className="truncate text-sm text-ink-soft">{item.position}</p>
        </div>
        <StatusBadge status={item.status} />
      </div>

      <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-soft">
        {item.location && <span className="inline-flex items-center gap-1"><FiMapPin aria-hidden="true" /> {item.location}</span>}
        <span>{WORK_TYPES[item.work_type] ?? item.work_type}</span>
        {item.applied_date && <span>Dilamar {formatDate(item.applied_date)}</span>}
      </p>

      <div className="mb-4 mt-3 flex flex-wrap gap-2">
        {item.next_interview_at && (
          <Chip tone="bg-amber-100 text-amber-800"><FiCalendar aria-hidden="true" className="mr-1 inline" />{formatDateTime(item.next_interview_at)}</Chip>
        )}
        {followUpDays !== null && (
          <Chip tone={followUpDays < 0 ? 'bg-danger-soft text-danger' : 'bg-sky-100 text-sky-800'}>Tindak lanjut: {relativeDays(item.follow_up_date)}</Chip>
        )}
        {deadlineDays !== null && (
          <Chip tone={deadlineDays < 0 ? 'bg-danger-soft text-danger' : 'bg-slate-100 text-slate-700'}>
            {deadlineDays < 0 ? 'Pendaftaran ditutup' : `Tutup: ${relativeDays(item.deadline_date)}`}
          </Chip>
        )}
      </div>

      <div className="mt-auto flex items-center gap-2 border-t border-line pt-4">
        <label className="sr-only" htmlFor={`status-${item.id}`}>Ubah tahap {item.company}</label>
        <select id={`status-${item.id}`} value={item.status} onChange={(e) => onStatus(item, e.target.value)} className="field !py-1.5 !text-xs">
          {STATUS_ORDER.map((s) => <option key={s} value={s}>{STATUS_META[s].label}</option>)}
        </select>
        <button type="button" aria-label={`Ubah ${item.company}`} onClick={() => onEdit(item)} className="btn btn-ghost !px-2.5 !py-1.5"><FiEdit2 /></button>
        <button type="button" aria-label={`Hapus ${item.company}`} onClick={() => onDelete(item)} className="btn btn-ghost !px-2.5 !py-1.5 text-danger"><FiTrash2 /></button>
      </div>
    </article>
  );
}

export default function ApplicationsPage() {
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const applications = useSelector((s) => s.applications);
  const isLoading = useSelector((s) => s.isApplication);

  const status = searchParams.get('status') ?? '';
  const [keyword, onKeywordChange] = useInput('');
  const [workType, setWorkType] = useState('');
  const [sort, setSort] = useState('recent');
  const [showAdd, setShowAdd] = useState(searchParams.get('tambah') === '1');
  const [editing, setEditing] = useState(null);

  const reload = () => dispatch(asyncApplications());

  useEffect(() => {
    dispatch(asyncApplications());
  }, [dispatch]);

  const setStatusFilter = (value) => {
    const next = new URLSearchParams(searchParams);
    next.delete('tambah');
    if (value) next.set('status', value);
    else next.delete('status');
    setSearchParams(next, { replace: true });
  };

  const counts = useMemo(() => {
    const result = { '': applications.length };
    applications.forEach((a) => { result[a.status] = (result[a.status] ?? 0) + 1; });
    return result;
  }, [applications]);

  const visible = useMemo(() => {
    const q = keyword.trim().toLowerCase();
    return applications
      .filter((a) =>
        (!status || a.status === status) &&
        (!workType || a.work_type === workType) &&
        (!q || `${a.company} ${a.position} ${a.location ?? ''}`.toLowerCase().includes(q)))
      .sort(SORTERS[sort][1]);
  }, [applications, status, workType, keyword, sort]);

  const handleStatus = async (item, next) => {
    if (next === item.status) return;
    if (await dispatch(asyncApplicationStatus(item.id, { status: next }))) reload();
  };

  const handleDelete = async (item) => {
    const confirmed = await showConfirmDialog(`Lamaran ke "${item.company}" akan dihapus permanen beserta jadwal wawancaranya.`, {
      title: 'Hapus lamaran?', confirmText: 'Ya, hapus',
    });
    if (confirmed && (await dispatch(asyncApplicationDelete(item.id)))) reload();
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold">Lamaran magang</h1>
          <p className="mt-1 text-sm text-ink-soft">Semua lowongan yang kamu simpan dan lamar.</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={() => setShowAdd(true)}><FiPlus /> Tambah lamaran</button>
      </div>

      <div role="group" aria-label="Filter tahap" className="flex flex-wrap gap-2">
        {[['', 'Semua'], ...STATUS_ORDER.map((s) => [s, STATUS_META[s].label])].map(([val, label]) => (
          <button key={val} type="button" onClick={() => setStatusFilter(val)} aria-pressed={status === val}
            className={`rounded-full border px-3.5 py-1.5 text-sm font-semibold transition ${status === val ? 'border-ink bg-ink text-white' : 'border-line bg-white text-ink-soft hover:text-ink'}`}>
            {label} <span className="ml-1 opacity-70">{counts[val] ?? 0}</span>
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[14rem] flex-1">
          <FiSearch aria-hidden="true" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="search" aria-label="Cari lamaran" placeholder="Cari perusahaan, posisi, atau lokasi…" value={keyword}
            onChange={onKeywordChange} className="field !pl-10" />
        </div>
        <select aria-label="Filter tipe kerja" value={workType} onChange={(e) => setWorkType(e.target.value)} className="field !w-auto">
          <option value="">Semua tipe kerja</option>
          {Object.entries(WORK_TYPES).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <select aria-label="Urutkan" value={sort} onChange={(e) => setSort(e.target.value)} className="field !w-auto">
          {Object.entries(SORTERS).map(([v, [l]]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </div>

      <section aria-label="Daftar lamaran">
        {isLoading && !applications.length ? <Spinner label="Memuat lamaran…" />
          : visible.length === 0 ? (
            <EmptyState
              title={applications.length ? 'Tidak ada lamaran yang cocok' : 'Belum ada lamaran'}
              description={applications.length ? 'Ubah filter atau kata kunci pencarian.' : 'Simpan lowongan pertamamu dan mulai lacak prosesnya.'}
            />
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {visible.map((item) => (
                <ApplicationCard key={item.id} item={item} onStatus={handleStatus} onEdit={setEditing} onDelete={handleDelete} />
              ))}
            </div>
          )}
      </section>

      {showAdd && <ApplicationModal onClose={() => setShowAdd(false)} onSaved={reload} />}
      {editing && <ApplicationModal application={editing} onClose={() => setEditing(null)} onSaved={reload} />}
    </div>
  );
}
