/** Tahapan seleksi (urut dari awal hingga akhir) beserta gaya tampilannya. */
export const STATUS_META = {
  saved: { label: 'Tersimpan', badge: 'bg-slate-100 text-slate-700', bar: 'bg-slate-400' },
  applied: { label: 'Dilamar', badge: 'bg-sky-100 text-sky-800', bar: 'bg-sky-500' },
  screening: { label: 'Seleksi berkas', badge: 'bg-violet-100 text-violet-800', bar: 'bg-violet-500' },
  interview: { label: 'Wawancara', badge: 'bg-amber-100 text-amber-800', bar: 'bg-amber-500' },
  offer: { label: 'Penawaran', badge: 'bg-teal-100 text-teal-800', bar: 'bg-teal-500' },
  accepted: { label: 'Diterima', badge: 'bg-green-100 text-green-800', bar: 'bg-green-600' },
  rejected: { label: 'Ditolak', badge: 'bg-rose-100 text-rose-800', bar: 'bg-rose-500' },
  withdrawn: { label: 'Dibatalkan', badge: 'bg-zinc-200 text-zinc-700', bar: 'bg-zinc-400' },
};
export const STATUS_ORDER = Object.keys(STATUS_META);

export const WORK_TYPES = { onsite: 'Onsite', remote: 'Remote', hybrid: 'Hybrid' };
export const INTERVIEW_TYPES = { online: 'Online', onsite: 'Tatap muka', phone: 'Telepon' };
export const INTERVIEW_STATUSES = { scheduled: 'Terjadwal', done: 'Selesai', cancelled: 'Dibatalkan' };
