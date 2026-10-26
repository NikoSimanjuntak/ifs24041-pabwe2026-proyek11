import { STATUS_META } from '../helpers/constants';

/** Lencana tahap seleksi lamaran. */
export default function StatusBadge({ status }) {
  const meta = STATUS_META[status];
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${meta?.badge ?? 'bg-slate-100 text-slate-700'}`}>
      {meta?.label ?? status}
    </span>
  );
}
