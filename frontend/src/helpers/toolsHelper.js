import Swal from 'sweetalert2';

const base = {
  confirmButtonColor: '#0f766e',
  cancelButtonColor: '#64748b',
};

export const showSuccessDialog = (message, title = 'Berhasil') =>
  Swal.fire({ ...base, icon: 'success', title, text: message, timer: 2200, timerProgressBar: true });

export const showErrorDialog = (message, title = 'Terjadi kesalahan') =>
  Swal.fire({ ...base, icon: 'error', title, text: message });

/** Mengembalikan true bila pengguna menekan tombol konfirmasi. */
export const showConfirmDialog = async (
  message,
  { title = 'Apakah kamu yakin?', confirmText = 'Ya, lanjutkan', cancelText = 'Batal' } = {},
) => {
  const result = await Swal.fire({
    ...base,
    icon: 'warning',
    title,
    text: message,
    showCancelButton: true,
    confirmButtonText: confirmText,
    cancelButtonText: cancelText,
    reverseButtons: true,
  });
  return Boolean(result.isConfirmed);
};

/* ------------------------------- Tanggal & waktu --------------------------- */
const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/;
const pad = (n) => String(n).padStart(2, '0');

/** Parse "YYYY-MM-DD" sebagai tanggal lokal (menghindari pergeseran zona waktu). */
export const parseDate = (value) => {
  if (!value) return null;
  const m = DATE_ONLY.exec(value);
  const date = m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

/** Format tanggal Indonesia, mis. "28 Februari 2024" atau "28 Februari 2024, 14.49". */
export const formatDate = (value, { withTime = false } = {}) => {
  const date = parseDate(value);
  if (!date) return '-';
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}),
  }).format(date);
};

export const formatDateTime = (value) => formatDate(value, { withTime: true });

export const formatTime = (value) => {
  const date = parseDate(value);
  if (!date) return '-';
  return new Intl.DateTimeFormat('id-ID', { hour: '2-digit', minute: '2-digit' }).format(date);
};

export const formatCurrency = (value) =>
  value === null || value === undefined || value === ''
    ? '-'
    : new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value);

/** Tanggal & waktu lokal saat ini: "YYYY-MM-DD" dan "YYYY-MM-DDTHH:mm". */
export const todayLocal = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const nowLocal = (d = new Date()) => `${todayLocal(d)}T${pad(d.getHours())}:${pad(d.getMinutes())}`;

/** Selisih hari kalender dari hari ini (negatif = sudah lewat). */
export const daysFromToday = (value, today = todayLocal()) => {
  const target = parseDate(value);
  const base = parseDate(today);
  if (!target || !base) return null;
  const day = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  return Math.round((day(target) - day(base)) / 86_400_000);
};

/** Label relatif: "Hari ini", "Besok", "3 hari lagi", "Terlambat 2 hari". */
export const relativeDays = (value, today = todayLocal()) => {
  const diff = daysFromToday(value, today);
  if (diff === null) return '';
  if (diff === 0) return 'Hari ini';
  if (diff === 1) return 'Besok';
  if (diff > 1) return `${diff} hari lagi`;
  return `Terlambat ${Math.abs(diff)} hari`;
};
