import { screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '../../../test-utils';
import * as api from '../api/dashboardApi';
import DashboardPage, { MonthlyChart } from './DashboardPage';

vi.mock('../api/dashboardApi');
vi.mock('sweetalert2', () => ({ default: { fire: vi.fn() } }));

const summary = {
  total: 4,
  by_status: { saved: 1, applied: 1, screening: 1, interview: 1, offer: 0, accepted: 0, rejected: 0, withdrawn: 0 },
  active: 3,
  response_rate: 67,
  upcoming_interviews: [{ id: 1, application_id: 10, company: 'Gojek', title: 'HR', scheduled_at: '2099-01-02T10:00' }],
  follow_ups: [
    { id: 11, company: 'Tokopedia', position: 'FE', follow_up_date: '2000-01-01', overdue: true },
    { id: 12, company: 'Blibli', position: 'BE', follow_up_date: '2099-01-01', overdue: false },
  ],
  deadlines: [{ id: 13, company: 'Traveloka', position: 'UX', deadline_date: '2099-03-01' }],
  monthly: [{ month: '2026-09', total: 2 }, { month: '2026-10', total: 0 }],
};

const renderPage = () => renderWithProviders(<DashboardPage />, { preloadedState: { profile: { name: 'Budi Santoso' } } });

beforeEach(() => {
  api.getDashboardSummary.mockResolvedValue(summary);
});

describe('DashboardPage', () => {
  it('menampilkan sapaan, kartu statistik, dan pipeline', async () => {
    renderPage();
    expect(await screen.findByText(/Halo, Budi/)).toBeInTheDocument();
    const stats = screen.getByRole('region', { name: 'Ringkasan statistik' });
    expect(within(stats).getByText('Total lamaran').nextSibling).toHaveTextContent('4');
    expect(within(stats).getByText('Tingkat respons').nextSibling).toHaveTextContent('67%');
    expect(screen.getByRole('link', { name: /Wawancara/ })).toHaveAttribute('href', '/applications?status=interview');
  });

  it('menampilkan wawancara, pengingat (terlambat), tenggat, dan grafik', async () => {
    renderPage();
    expect(await screen.findByText('Gojek · HR')).toBeInTheDocument();
    expect(screen.getByText(/Terlambat/)).toBeInTheDocument();
    expect(screen.getByText('Tokopedia · FE')).toBeInTheDocument();
    expect(screen.getByText('Traveloka · UX')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Grafik lamaran per bulan' })).toBeInTheDocument();
  });

  it('keadaan kosong tiap bagian', async () => {
    api.getDashboardSummary.mockResolvedValue({
      ...summary, total: 0, active: 0, response_rate: 0, upcoming_interviews: [], follow_ups: [], deadlines: [], monthly: [],
      by_status: Object.fromEntries(Object.keys(summary.by_status).map((k) => [k, 0])),
    });
    renderWithProviders(<DashboardPage />);
    expect(await screen.findByText(/Belum ada lamaran/)).toBeInTheDocument();
    expect(screen.getByText('Tidak ada wawancara terjadwal.')).toBeInTheDocument();
    expect(screen.getByText(/Tidak ada tindak lanjut/)).toBeInTheDocument();
    expect(screen.getByText(/tenggat/)).toBeInTheDocument();
    expect(screen.getByText(/Halo, kamu/)).toBeInTheDocument();
  });

  it('pesan bila dashboard gagal dimuat', async () => {
    api.getDashboardSummary.mockRejectedValue(new Error('x'));
    renderPage();
    expect(await screen.findByText('Dashboard belum dapat dimuat.')).toBeInTheDocument();
  });

  it('MonthlyChart tanpa data tidak error', () => {
    renderWithProviders(<MonthlyChart />);
    expect(screen.getByRole('img')).toBeInTheDocument();
  });
});
