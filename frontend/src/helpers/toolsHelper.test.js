import Swal from 'sweetalert2';
import { describe, expect, it, vi } from 'vitest';
import {
  daysFromToday, formatCurrency, formatDate, formatDateTime, formatTime, nowLocal, parseDate,
  relativeDays, showConfirmDialog, showErrorDialog, showSuccessDialog, todayLocal,
} from './toolsHelper';

vi.mock('sweetalert2', () => ({ default: { fire: vi.fn().mockResolvedValue({ isConfirmed: true }) } }));

describe('dialog helpers', () => {
  it('menampilkan dialog sukses & error', () => {
    showSuccessDialog('ok');
    expect(Swal.fire).toHaveBeenLastCalledWith(expect.objectContaining({ icon: 'success', text: 'ok', title: 'Berhasil' }));
    showErrorDialog('gagal', 'Judul');
    expect(Swal.fire).toHaveBeenLastCalledWith(expect.objectContaining({ icon: 'error', title: 'Judul' }));
  });

  it('showConfirmDialog mengembalikan boolean', async () => {
    expect(await showConfirmDialog('Yakin?')).toBe(true);
    Swal.fire.mockResolvedValueOnce({ isConfirmed: false });
    expect(await showConfirmDialog('Yakin?', { title: 'T', confirmText: 'Ya', cancelText: 'Tidak' })).toBe(false);
    expect(Swal.fire).toHaveBeenLastCalledWith(expect.objectContaining({ showCancelButton: true, confirmButtonText: 'Ya' }));
  });
});

describe('tanggal & waktu', () => {
  it('parseDate memperlakukan YYYY-MM-DD sebagai tanggal lokal', () => {
    const d = parseDate('2026-10-24');
    expect([d.getFullYear(), d.getMonth(), d.getDate()]).toEqual([2026, 9, 24]);
    expect(parseDate('')).toBeNull();
    expect(parseDate('bukan-tanggal')).toBeNull();
    expect(parseDate('2026-10-24T10:30').getHours()).toBe(10);
  });

  it('formatDate / formatDateTime / formatTime', () => {
    expect(formatDate('2026-10-24')).toBe('24 Oktober 2026');
    expect(formatDate(null)).toBe('-');
    expect(formatDateTime('2026-10-24T14:49')).toMatch(/24 Oktober 2026/);
    expect(formatDateTime('2026-10-24T14:49')).toMatch(/14[.:]49/);
    expect(formatTime('2026-10-24T09:05')).toMatch(/09[.:]05/);
    expect(formatTime('x')).toBe('-');
  });

  it('formatCurrency', () => {
    expect(formatCurrency(3500000)).toMatch(/Rp\s?3\.500\.000/);
    expect(formatCurrency(null)).toBe('-');
    expect(formatCurrency('')).toBe('-');
  });

  it('todayLocal & nowLocal memakai zona waktu lokal', () => {
    const d = new Date(2026, 0, 5, 7, 8);
    expect(todayLocal(d)).toBe('2026-01-05');
    expect(nowLocal(d)).toBe('2026-01-05T07:08');
    expect(todayLocal()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('daysFromToday & relativeDays', () => {
    expect(daysFromToday('2026-10-27', '2026-10-24')).toBe(3);
    expect(daysFromToday('2026-10-21', '2026-10-24')).toBe(-3);
    expect(daysFromToday('2026-10-27T23:59', '2026-10-24')).toBe(3);
    expect(daysFromToday('xx', '2026-10-24')).toBeNull();
    expect(relativeDays('2026-10-24', '2026-10-24')).toBe('Hari ini');
    expect(relativeDays('2026-10-25', '2026-10-24')).toBe('Besok');
    expect(relativeDays('2026-10-29', '2026-10-24')).toBe('5 hari lagi');
    expect(relativeDays('2026-10-22', '2026-10-24')).toBe('Terlambat 2 hari');
    expect(relativeDays('xx', '2026-10-24')).toBe('');
  });
});
