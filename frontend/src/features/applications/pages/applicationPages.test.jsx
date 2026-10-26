import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { showConfirmDialog } from '../../../helpers/toolsHelper';
import { renderWithProviders } from '../../../test-utils';
import * as ivApi from '../../interviews/api/interviewApi';
import * as api from '../api/applicationApi';
import { toPayload, validateApplication, EMPTY_FORM } from '../modals/ApplicationModal';
import ApplicationDetailPage, { StageProgress } from './ApplicationDetailPage';
import ApplicationsPage from './ApplicationsPage';

vi.mock('../api/applicationApi');
vi.mock('../../interviews/api/interviewApi');
vi.mock('../../../helpers/toolsHelper', async (orig) => ({
  ...(await orig()),
  showSuccessDialog: vi.fn(), showErrorDialog: vi.fn(), showConfirmDialog: vi.fn(),
}));

const items = [
  { id: 1, company: 'Gojek', position: 'Backend Intern', location: 'Jakarta', work_type: 'hybrid', status: 'applied', applied_date: '2026-10-01', follow_up_date: '2000-01-01', next_interview_at: null, deadline_date: null },
  { id: 2, company: 'Tokopedia', position: 'Frontend Intern', location: null, work_type: 'remote', status: 'interview', applied_date: null, next_interview_at: '2099-01-01T09:00', deadline_date: null },
  { id: 3, company: 'Traveloka', position: 'UX Intern', location: 'Bandung', work_type: 'onsite', status: 'saved', deadline_date: '2000-01-01', applied_date: '2026-09-01' },
  { id: 4, company: 'Blibli', position: 'QA Intern', location: 'Medan', work_type: 'onsite', status: 'saved', deadline_date: '2099-12-31', applied_date: '2026-08-01' },
];

const detail = {
  ...items[0], allowance: 3500000, source_url: 'https://jobs.example.com/1', contact_name: 'Rina', contact_email: 'rina@gojek.com', notes: 'Siapkan portofolio',
  interviews: [
    { id: 7, title: 'HR', type: 'online', scheduled_at: '2099-02-01T10:00', status: 'scheduled', location: 'https://meet.example.com/x', interviewer: 'Rina', notes: 'Latihan' },
    { id: 8, title: 'User', type: 'onsite', scheduled_at: '2099-02-02T10:00', status: 'done', location: 'Kantor', interviewer: null, notes: null },
  ],
  events: [
    { id: 1, from_status: null, to_status: 'saved', note: 'Lamaran dibuat', created_at: '2026-10-01T03:00:00.000Z' },
    { id: 2, from_status: 'saved', to_status: 'applied', note: null, created_at: '2026-10-02T03:00:00.000Z' },
  ],
};

beforeEach(() => {
  api.getApplications.mockResolvedValue(items);
  api.getApplicationById.mockResolvedValue(detail);
  api.postApplication.mockResolvedValue(9);
  api.putApplication.mockResolvedValue({});
  api.patchApplicationStatus.mockResolvedValue({});
  api.deleteApplication.mockResolvedValue({});
  ivApi.deleteInterview.mockResolvedValue({});
  ivApi.postInterview.mockResolvedValue(5);
  ivApi.putInterview.mockResolvedValue({});
});

describe('validator & payload', () => {
  it('validateApplication', () => {
    expect(Object.keys(validateApplication({ ...EMPTY_FORM, source_url: 'ftp://x', allowance: '-1', contact_email: 'x' }))).toEqual(['company', 'position', 'source_url', 'allowance', 'contact_email']);
    expect(validateApplication({ ...EMPTY_FORM, company: 'A', position: 'B', source_url: 'tidak url' }).source_url).toBeTruthy();
    expect(validateApplication({ ...EMPTY_FORM, company: 'A', position: 'B', source_url: 'https://a.co', allowance: '1000' })).toEqual({});
  });
  it('toPayload membuang string kosong dan mengonversi uang saku', () => {
    expect(toPayload({ ...EMPTY_FORM, company: ' A ', position: 'B', allowance: '2500' })).toEqual({
      company: 'A', position: 'B', work_type: 'onsite', status: 'saved', allowance: 2500,
    });
  });
});

describe('ApplicationsPage', () => {
  it('menampilkan daftar, indikator tindak lanjut/tenggat/wawancara, dan hitungan filter', async () => {
    renderWithProviders(<ApplicationsPage />);
    expect(await screen.findByText('Gojek')).toBeInTheDocument();
    expect(screen.getByText(/Tindak lanjut: Terlambat/)).toBeInTheDocument();
    expect(screen.getByText('Pendaftaran ditutup')).toBeInTheDocument();
    expect(screen.getByText(/Tutup:/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Semua 4/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Tersimpan 2/ })).toBeInTheDocument();
  });

  it('filter tahap, pencarian, tipe kerja, dan urutan', async () => {
    renderWithProviders(<ApplicationsPage />);
    await screen.findByText('Gojek');
    const list = screen.getByRole('region', { name: 'Daftar lamaran' });

    await userEvent.click(screen.getByRole('button', { name: /Tersimpan/ }));
    expect(within(list).queryByText('Gojek')).not.toBeInTheDocument();
    expect(within(list).getByText('Blibli')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /Semua/ }));

    await userEvent.type(screen.getByLabelText('Cari lamaran'), 'bandung');
    expect(within(list).getByText('Traveloka')).toBeInTheDocument();
    expect(within(list).queryByText('Gojek')).not.toBeInTheDocument();
    await userEvent.clear(screen.getByLabelText('Cari lamaran'));

    await userEvent.selectOptions(screen.getByLabelText('Filter tipe kerja'), 'remote');
    expect(within(list).getAllByRole('article')).toHaveLength(1);
    await userEvent.selectOptions(screen.getByLabelText('Filter tipe kerja'), '');

    await userEvent.selectOptions(screen.getByLabelText('Urutkan'), 'company');
    expect(within(list).getAllByRole('heading', { level: 3 })[0]).toHaveTextContent('Blibli');
    await userEvent.selectOptions(screen.getByLabelText('Urutkan'), 'deadline');
    expect(within(list).getAllByRole('heading', { level: 3 })[0]).toHaveTextContent('Traveloka');
    await userEvent.selectOptions(screen.getByLabelText('Urutkan'), 'applied');
    expect(within(list).getAllByRole('heading', { level: 3 })[0]).toHaveTextContent('Gojek');

    await userEvent.type(screen.getByLabelText('Cari lamaran'), 'zzz');
    expect(screen.getByText('Tidak ada lamaran yang cocok')).toBeInTheDocument();
  });

  it('filter status dibaca dari URL', async () => {
    renderWithProviders(<ApplicationsPage />, { route: '/applications?status=interview' });
    expect(await screen.findByText('Tokopedia')).toBeInTheDocument();
    expect(screen.queryByText('Gojek')).not.toBeInTheDocument();
  });

  it('keadaan kosong ketika belum ada lamaran', async () => {
    api.getApplications.mockResolvedValue([]);
    renderWithProviders(<ApplicationsPage />);
    expect(await screen.findByText('Belum ada lamaran')).toBeInTheDocument();
  });

  it('mengubah tahap lewat dropdown kartu', async () => {
    renderWithProviders(<ApplicationsPage />);
    await screen.findByText('Gojek');
    await userEvent.selectOptions(screen.getByLabelText('Ubah tahap Gojek'), 'offer');
    await waitFor(() => expect(api.patchApplicationStatus).toHaveBeenCalledWith(1, { status: 'offer', note: undefined }));
    await waitFor(() => expect(api.getApplications).toHaveBeenCalledTimes(2));
    await userEvent.selectOptions(screen.getByLabelText('Ubah tahap Gojek'), 'applied');
    expect(api.patchApplicationStatus).toHaveBeenCalledTimes(1);
  });

  it('menghapus lamaran dengan konfirmasi', async () => {
    renderWithProviders(<ApplicationsPage />);
    await screen.findByText('Gojek');
    showConfirmDialog.mockResolvedValueOnce(false);
    await userEvent.click(screen.getByLabelText('Hapus Gojek'));
    expect(api.deleteApplication).not.toHaveBeenCalled();
    showConfirmDialog.mockResolvedValueOnce(true);
    await userEvent.click(screen.getByLabelText('Hapus Gojek'));
    await waitFor(() => expect(api.deleteApplication).toHaveBeenCalledWith(1));
  });

  it('menambah lamaran: validasi lalu simpan', async () => {
    renderWithProviders(<ApplicationsPage />);
    await screen.findByText('Gojek');
    await userEvent.click(screen.getByRole('button', { name: /Tambah lamaran/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Simpan lamaran' }));
    expect(screen.getByText('Nama perusahaan wajib diisi.')).toBeInTheDocument();
    expect(api.postApplication).not.toHaveBeenCalled();

    await userEvent.type(screen.getByLabelText('Perusahaan'), 'Shopee');
    await userEvent.type(screen.getByLabelText('Posisi'), 'Data Intern');
    await userEvent.selectOptions(screen.getByLabelText('Tipe kerja'), 'remote');
    await userEvent.click(screen.getByRole('button', { name: 'Simpan lamaran' }));
    await waitFor(() => expect(api.postApplication).toHaveBeenCalledWith(expect.objectContaining({ company: 'Shopee', position: 'Data Intern', work_type: 'remote' })));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('modal tambah terbuka otomatis dari ?tambah=1 dan tetap terbuka bila simpan gagal', async () => {
    api.postApplication.mockRejectedValue(new Error('gagal'));
    renderWithProviders(<ApplicationsPage />, { route: '/applications?tambah=1' });
    await userEvent.type(await screen.findByLabelText('Perusahaan'), 'X');
    await userEvent.type(screen.getByLabelText('Posisi'), 'Y');
    await userEvent.click(screen.getByRole('button', { name: 'Simpan lamaran' }));
    await waitFor(() => expect(api.postApplication).toHaveBeenCalled());
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Batal' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('mengubah lamaran lewat modal terisi data lama', async () => {
    renderWithProviders(<ApplicationsPage />);
    await screen.findByText('Gojek');
    await userEvent.click(screen.getByLabelText('Ubah Gojek'));
    expect(screen.getByLabelText('Perusahaan')).toHaveValue('Gojek');
    await userEvent.clear(screen.getByLabelText('Perusahaan'));
    await userEvent.type(screen.getByLabelText('Perusahaan'), 'Gojek Tech');
    await userEvent.click(screen.getByRole('button', { name: 'Simpan lamaran' }));
    await waitFor(() => expect(api.putApplication).toHaveBeenCalledWith(1, expect.objectContaining({ company: 'Gojek Tech' })));
  });
});

const renderDetail = () =>
  renderWithProviders(
    <Routes><Route path="/applications/:id" element={<ApplicationDetailPage />} /><Route path="/applications" element={<p>Daftar</p>} /></Routes>,
    { route: '/applications/1' },
  );

describe('StageProgress', () => {
  it('menunjukkan langkah aktif atau lencana tahap akhir negatif', () => {
    const { rerender } = renderWithProviders(<StageProgress status="screening" />);
    expect(screen.getByRole('list', { name: 'Kemajuan tahap seleksi' }).querySelector('[aria-current="step"]')).toHaveTextContent('Seleksi berkas');
    rerender(<StageProgress status="rejected" />);
    expect(screen.getByText('Ditolak')).toBeInTheDocument();
  });
});

describe('ApplicationDetailPage', () => {
  it('menampilkan informasi, wawancara, dan riwayat', async () => {
    renderDetail();
    expect(await screen.findByRole('heading', { name: 'Gojek' })).toBeInTheDocument();
    expect(screen.getByText(/3\.500\.000/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Buka lowongan/ })).toHaveAttribute('href', 'https://jobs.example.com/1');
    expect(screen.getByText('Siapkan portofolio')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'https://meet.example.com/x' })).toBeInTheDocument();
    expect(screen.getByText('Kantor')).toBeInTheDocument();
    expect(screen.getByText('Lamaran dibuat')).toBeInTheDocument();
    expect(screen.getByText('Tersimpan → Dilamar')).toBeInTheDocument();
  });

  it('memindahkan tahap dengan catatan', async () => {
    renderDetail();
    await screen.findByRole('heading', { name: 'Gojek' });
    expect(screen.getByRole('button', { name: 'Perbarui tahap' })).toBeDisabled();
    await userEvent.selectOptions(screen.getByLabelText('Pindahkan ke tahap'), 'screening');
    await userEvent.type(screen.getByLabelText('Catatan (opsional)'), ' Diundang tes ');
    await userEvent.click(screen.getByRole('button', { name: 'Perbarui tahap' }));
    await waitFor(() => expect(api.patchApplicationStatus).toHaveBeenCalledWith('1', { status: 'screening', note: 'Diundang tes' }));
  });

  it('menambah, mengubah, dan menghapus jadwal wawancara', async () => {
    renderDetail();
    await screen.findByRole('heading', { name: 'Gojek' });

    await userEvent.click(screen.getByRole('button', { name: /Tambah jadwal/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Simpan jadwal' }));
    expect(screen.getByText('Judul wawancara wajib diisi.')).toBeInTheDocument();
    await userEvent.type(screen.getByLabelText('Judul'), 'Teknis');
    await userEvent.type(screen.getByLabelText('Waktu'), '2099-03-01T10:00');
    await userEvent.click(screen.getByRole('button', { name: 'Simpan jadwal' }));
    await waitFor(() => expect(ivApi.postInterview).toHaveBeenCalledWith(1, expect.objectContaining({ title: 'Teknis', scheduled_at: '2099-03-01T10:00' })));

    await userEvent.click(await screen.findByLabelText('Ubah jadwal HR'));
    expect(screen.getByLabelText('Judul')).toHaveValue('HR');
    await userEvent.selectOptions(screen.getByLabelText('Status'), 'done');
    await userEvent.click(screen.getByRole('button', { name: 'Simpan jadwal' }));
    await waitFor(() => expect(ivApi.putInterview).toHaveBeenCalledWith(7, expect.objectContaining({ status: 'done' })));

    showConfirmDialog.mockResolvedValueOnce(true);
    await userEvent.click(await screen.findByLabelText('Hapus jadwal HR'));
    await waitFor(() => expect(ivApi.deleteInterview).toHaveBeenCalledWith(7));
  });

  it('mengubah data lamaran dari detail', async () => {
    renderDetail();
    await screen.findByRole('heading', { name: 'Gojek' });
    await userEvent.click(screen.getByRole('button', { name: /Ubah data/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Simpan lamaran' }));
    await waitFor(() => expect(api.putApplication).toHaveBeenCalledWith(1, expect.objectContaining({ company: 'Gojek' })));
  });

  it('menghapus lamaran lalu kembali ke daftar', async () => {
    renderDetail();
    await screen.findByRole('heading', { name: 'Gojek' });
    showConfirmDialog.mockResolvedValueOnce(true);
    await userEvent.click(screen.getByRole('button', { name: 'Hapus' }));
    expect(await screen.findByText('Daftar')).toBeInTheDocument();
  });

  it('lamaran tanpa data opsional & tahap akhir; tidak ditemukan', async () => {
    api.getApplicationById.mockResolvedValue({ ...items[1], status: 'rejected', interviews: [], events: [], notes: null, source_url: 'javascript:x' });
    renderDetail();
    expect(await screen.findByText('Belum ada jadwal wawancara.')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Buka lowongan/ })).not.toBeInTheDocument();
  });

  it('tidak ditemukan', async () => {
    api.getApplicationById.mockRejectedValue(new Error('404'));
    renderDetail();
    expect(await screen.findByText('Lamaran tidak ditemukan')).toBeInTheDocument();
  });
});
