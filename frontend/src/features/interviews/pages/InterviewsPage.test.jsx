import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { showConfirmDialog } from '../../../helpers/toolsHelper';
import { renderWithProviders } from '../../../test-utils';
import * as appApi from '../../applications/api/applicationApi';
import { validateInterview } from '../modals/InterviewModal';
import * as api from '../api/interviewApi';
import InterviewsPage from './InterviewsPage';

vi.mock('../api/interviewApi');
vi.mock('../../applications/api/applicationApi');
vi.mock('../../../helpers/toolsHelper', async (orig) => ({
  ...(await orig()),
  showSuccessDialog: vi.fn(), showErrorDialog: vi.fn(), showConfirmDialog: vi.fn(),
}));

const upcoming = [
  { id: 1, application_id: 5, company: 'Gojek', position: 'BE', title: 'HR', type: 'online', scheduled_at: '2099-05-04T10:00', status: 'scheduled', location: 'https://meet.example.com/a', interviewer: 'Rina' },
  { id: 2, application_id: 6, company: 'Tokopedia', position: 'FE', title: 'User', type: 'onsite', scheduled_at: '2099-05-05T13:00', status: 'scheduled', location: 'Kantor Jakarta', interviewer: null },
];
const past = [{ id: 3, application_id: 5, company: 'Gojek', position: 'BE', title: 'Screening', type: 'phone', scheduled_at: '2000-01-01T09:00', status: 'done', location: null, interviewer: null }];

beforeEach(() => {
  api.getInterviews.mockImplementation(async (scope) => (scope === 'past' ? past : upcoming));
  appApi.getApplications.mockResolvedValue([{ id: 5, company: 'Gojek', position: 'BE' }]);
  api.postInterview.mockResolvedValue(9);
  api.putInterview.mockResolvedValue({});
  api.deleteInterview.mockResolvedValue({});
});

describe('InterviewsPage', () => {
  it('validateInterview', () => {
    expect(Object.keys(validateInterview({ title: '', scheduled_at: '', application_id: '' }, true))).toEqual(['application_id', 'title', 'scheduled_at']);
    expect(validateInterview({ title: 'x', scheduled_at: 'y', application_id: '' }, false)).toEqual({});
  });

  it('menampilkan jadwal mendatang lalu riwayat', async () => {
    renderWithProviders(<InterviewsPage />);
    expect(await screen.findByText('HR')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'https://meet.example.com/a' })).toBeInTheDocument();
    expect(screen.getByText('Kantor Jakarta')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Riwayat' }));
    expect(await screen.findByText('Screening')).toBeInTheDocument();
    expect(screen.getByText('Selesai')).toBeInTheDocument();
  });

  it('keadaan kosong tiap tab', async () => {
    api.getInterviews.mockResolvedValue([]);
    renderWithProviders(<InterviewsPage />);
    expect(await screen.findByText('Tidak ada wawancara mendatang')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Riwayat' }));
    expect(await screen.findByText('Belum ada riwayat wawancara')).toBeInTheDocument();
  });

  it('menambah jadwal dengan memilih lamaran', async () => {
    renderWithProviders(<InterviewsPage />);
    await screen.findByText('HR');
    await userEvent.click(screen.getByRole('button', { name: /Tambah jadwal/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Simpan jadwal' }));
    expect(screen.getByText('Pilih lamaran terlebih dahulu.')).toBeInTheDocument();

    await userEvent.selectOptions(screen.getByLabelText('Lamaran'), '5');
    await userEvent.type(screen.getByLabelText('Judul'), 'Final');
    await userEvent.type(screen.getByLabelText('Waktu'), '2099-06-01T09:00');
    await userEvent.click(screen.getByRole('button', { name: 'Simpan jadwal' }));
    await waitFor(() => expect(api.postInterview).toHaveBeenCalledWith('5', expect.objectContaining({ title: 'Final' })));
  });

  it('mengubah dan menghapus jadwal', async () => {
    renderWithProviders(<InterviewsPage />);
    await screen.findByText('HR');
    await userEvent.click(screen.getByLabelText('Ubah HR Gojek'));
    await userEvent.clear(screen.getByLabelText('Judul'));
    await userEvent.type(screen.getByLabelText('Judul'), 'HR Final');
    await userEvent.click(screen.getByRole('button', { name: 'Simpan jadwal' }));
    await waitFor(() => expect(api.putInterview).toHaveBeenCalledWith(1, expect.objectContaining({ title: 'HR Final' })));

    showConfirmDialog.mockResolvedValueOnce(false);
    await userEvent.click(screen.getByLabelText('Hapus HR Gojek'));
    expect(api.deleteInterview).not.toHaveBeenCalled();
    showConfirmDialog.mockResolvedValueOnce(true);
    await userEvent.click(screen.getByLabelText('Hapus HR Gojek'));
    await waitFor(() => expect(api.deleteInterview).toHaveBeenCalledWith(1));
  });
});
