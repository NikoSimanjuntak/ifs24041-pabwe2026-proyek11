import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { FiAlertCircle, FiCalendar, FiClock, FiPlus } from 'react-icons/fi';
import Spinner from '../../../components/Spinner';
import { STATUS_META, STATUS_ORDER } from '../../../helpers/constants';
import { formatDate, formatTime, relativeDays } from '../../../helpers/toolsHelper';
import { asyncDashboard } from '../states/action';

function SummaryCard({ label, value, hint, tone }) {
  return (
    <div className={`panel border-t-4 p-5 ${tone}`}>
      <p className="text-sm font-semibold text-ink-soft">{label}</p>
      <p className="mt-1 font-display text-4xl font-extrabold">{value}</p>
      {hint && <p className="mt-1 text-xs text-ink-soft">{hint}</p>}
    </div>
  );
}

function Section({ title, icon: Icon, children, action }) {
  return (
    <section className="panel p-5" aria-label={title}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-lg font-bold">
          {Icon && <Icon aria-hidden="true" className="h-5 w-5 text-brand" />} {title}
        </h2>
        {action}
      </div>
      {children}
    </section>
  );
}

const Empty = ({ children }) => <p className="py-6 text-center text-sm text-ink-soft">{children}</p>;

const monthLabel = (month) => {
  const [y, m] = month.split('-').map(Number);
  return new Intl.DateTimeFormat('id-ID', { month: 'short' }).format(new Date(y, m - 1, 1));
};

/** Grafik batang jumlah lamaran per bulan. */
export function MonthlyChart({ monthly = [] }) {
  const max = Math.max(1, ...monthly.map((m) => m.total));
  return (
    <div className="flex h-44 items-end gap-3" role="img" aria-label="Grafik lamaran per bulan">
      {monthly.map(({ month, total }) => (
        <div key={month} className="flex flex-1 flex-col items-center gap-2">
          <span className="text-xs font-bold">{total}</span>
          <div className="flex h-28 w-full items-end">
            <span title={`${total} lamaran`} style={{ height: `${(total / max) * 100}%` }} className="min-h-[3px] w-full rounded-t bg-brand" />
          </div>
          <span className="text-[11px] text-ink-soft">{monthLabel(month)}</span>
        </div>
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const dispatch = useDispatch();
  const dashboard = useSelector((s) => s.dashboard);
  const isLoading = useSelector((s) => s.isDashboard);
  const profile = useSelector((s) => s.profile);

  useEffect(() => {
    dispatch(asyncDashboard());
  }, [dispatch]);

  if (!dashboard) {
    return (
      <div className="mx-auto max-w-6xl">
        <h1 className="text-3xl font-extrabold">Dashboard</h1>
        {isLoading ? <Spinner label="Memuat dashboard…" /> : (
          <p className="panel mt-6 py-12 text-center text-sm text-ink-soft">Dashboard belum dapat dimuat.</p>
        )}
      </div>
    );
  }

  const { total, by_status, active, response_rate, upcoming_interviews, follow_ups, deadlines, monthly } = dashboard;
  const firstName = profile?.name?.split(' ')[0];

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold">Halo, {firstName ?? 'kamu'} 👋</h1>
          <p className="mt-1 text-sm text-ink-soft">Ringkasan perjalanan magangmu hari ini.</p>
        </div>
        <Link to="/applications?tambah=1" className="btn btn-primary"><FiPlus /> Tambah lamaran</Link>
      </div>

      <section aria-label="Ringkasan statistik" className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <SummaryCard label="Total lamaran" value={total} tone="border-ink" />
        <SummaryCard label="Proses aktif" value={active} hint="Dilamar hingga penawaran" tone="border-sky-500" />
        <SummaryCard label="Wawancara mendatang" value={upcoming_interviews.length} tone="border-accent" />
        <SummaryCard label="Tingkat respons" value={`${response_rate}%`} hint="Dari lamaran yang dikirim" tone="border-brand" />
      </section>

      <Section title="Tahapan seleksi" action={<Link to="/applications" className="text-sm font-semibold text-brand underline underline-offset-4">Semua lamaran</Link>}>
        {total === 0 ? <Empty>Belum ada lamaran. Mulai dengan menambahkan lowongan yang kamu incar.</Empty> : (
          <ul className="space-y-3">
            {STATUS_ORDER.map((status) => (
              <li key={status}>
                <Link to={`/applications?status=${status}`} className="group grid grid-cols-[8.5rem_1fr_2rem] items-center gap-3 text-sm">
                  <span className="font-semibold group-hover:underline">{STATUS_META[status].label}</span>
                  <span className="h-2.5 overflow-hidden rounded-full bg-paper">
                    <span className={`block h-full rounded-full ${STATUS_META[status].bar}`} style={{ width: `${(by_status[status] / total) * 100}%` }} />
                  </span>
                  <span className="text-right font-bold">{by_status[status]}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <div className="grid gap-6 lg:grid-cols-2">
        <Section title="Wawancara mendatang" icon={FiCalendar} action={<Link to="/interviews" className="text-sm font-semibold text-brand underline underline-offset-4">Lihat jadwal</Link>}>
          {upcoming_interviews.length === 0 ? <Empty>Tidak ada wawancara terjadwal.</Empty> : (
            <ul className="divide-y divide-line">
              {upcoming_interviews.map((i) => (
                <li key={i.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <Link to={`/applications/${i.application_id}`} className="block truncate font-semibold hover:underline">{i.company} · {i.title}</Link>
                    <p className="text-xs text-ink-soft">{formatDate(i.scheduled_at)}, {formatTime(i.scheduled_at)}</p>
                  </div>
                  <span className="shrink-0 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-800">{relativeDays(i.scheduled_at)}</span>
                </li>
              ))}
            </ul>
          )}
        </Section>

        <Section title="Perlu tindak lanjut" icon={FiAlertCircle}>
          {follow_ups.length === 0 ? <Empty>Tidak ada tindak lanjut dalam 7 hari ke depan.</Empty> : (
            <ul className="divide-y divide-line">
              {follow_ups.map((f) => (
                <li key={f.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <Link to={`/applications/${f.id}`} className="block truncate font-semibold hover:underline">{f.company} · {f.position}</Link>
                    <p className="text-xs text-ink-soft">Tindak lanjut {formatDate(f.follow_up_date)}</p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${f.overdue ? 'bg-danger-soft text-danger' : 'bg-sky-100 text-sky-800'}`}>{relativeDays(f.follow_up_date)}</span>
                </li>
              ))}
            </ul>
          )}
        </Section>

        <Section title="Batas pendaftaran terdekat" icon={FiClock}>
          {deadlines.length === 0 ? <Empty>Tidak ada lowongan tersimpan dengan tenggat.</Empty> : (
            <ul className="divide-y divide-line">
              {deadlines.map((d) => (
                <li key={d.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <Link to={`/applications/${d.id}`} className="block truncate font-semibold hover:underline">{d.company} · {d.position}</Link>
                    <p className="text-xs text-ink-soft">Tutup {formatDate(d.deadline_date)}</p>
                  </div>
                  <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700">{relativeDays(d.deadline_date)}</span>
                </li>
              ))}
            </ul>
          )}
        </Section>

        <Section title="Lamaran 6 bulan terakhir">
          <MonthlyChart monthly={monthly} />
        </Section>
      </div>
    </div>
  );
}
