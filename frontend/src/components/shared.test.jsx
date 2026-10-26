import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import Avatar from './Avatar';
import EmptyState from './EmptyState';
import Logo from './Logo';
import ModalShell from './ModalShell';
import Segmented from './Segmented';
import Spinner from './Spinner';
import StatusBadge from './StatusBadge';

describe('shared components', () => {
  it('Avatar menampilkan inisial', () => {
    const { rerender } = render(<Avatar name="Budi Santoso Tambunan" />);
    expect(screen.getByLabelText('Budi Santoso Tambunan')).toHaveTextContent('BS');
    rerender(<Avatar name="" />);
    expect(screen.getByLabelText('')).toHaveTextContent('?');
    rerender(<Avatar />);
    expect(screen.getByText('?')).toBeInTheDocument();
  });

  it('Spinner & Logo', () => {
    render(<><Spinner label="Tunggu" /><Logo light /></>);
    expect(screen.getByRole('status')).toHaveTextContent('Tunggu');
    expect(screen.getByText(/Intern/)).toBeInTheDocument();
    render(<Logo />);
  });

  it('StatusBadge untuk status dikenal dan tak dikenal', () => {
    const { rerender } = render(<StatusBadge status="interview" />);
    expect(screen.getByText('Wawancara')).toBeInTheDocument();
    rerender(<StatusBadge status="lain" />);
    expect(screen.getByText('lain')).toBeInTheDocument();
  });

  it('EmptyState dengan dan tanpa deskripsi/anak', () => {
    const { rerender } = render(<EmptyState title="Kosong" />);
    expect(screen.getByText('Kosong')).toBeInTheDocument();
    rerender(<EmptyState title="Kosong" description="Desk"><button>Aksi</button></EmptyState>);
    expect(screen.getByText('Desk')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Aksi' })).toBeInTheDocument();
  });

  it('Segmented memanggil onChange dan menandai pilihan aktif', async () => {
    const onChange = vi.fn();
    render(<Segmented label="Pilih" options={[['a', 'A'], ['b', 'B']]} value="a" onChange={onChange} />);
    expect(screen.getByText('A')).toHaveAttribute('aria-pressed', 'true');
    await userEvent.click(screen.getByText('B'));
    expect(onChange).toHaveBeenCalledWith('b');
  });

  it('ModalShell menutup lewat ESC, tombol, dan klik latar', async () => {
    const onClose = vi.fn();
    render(<ModalShell title="Dialog" onClose={onClose}><p>isi</p></ModalShell>);
    expect(screen.getByRole('dialog', { name: 'Dialog' })).toBeInTheDocument();
    fireEvent.keyDown(document, { key: 'Enter' });
    expect(onClose).not.toHaveBeenCalled();
    fireEvent.keyDown(document, { key: 'Escape' });
    await userEvent.click(screen.getByLabelText('Tutup'));
    fireEvent.mouseDown(screen.getByRole('dialog').parentElement);
    fireEvent.mouseDown(screen.getByRole('dialog'));
    expect(onClose).toHaveBeenCalledTimes(3);
  });
});
