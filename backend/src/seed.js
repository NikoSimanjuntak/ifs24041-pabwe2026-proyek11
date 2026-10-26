import bcrypt from 'bcryptjs';
import config from './config.js';
import { openDatabase } from './db.js';
import { recordEvent } from './services/applicationService.js';

/** Mengisi data contoh untuk demo. Idempotent: dilewati bila akun demo sudah ada. */
export function seed(db) {
  if (db.prepare('SELECT 1 FROM users WHERE email = ?').get('demo@interntrack.id')) return false;

  const day = (offset) => {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() + offset);
    return d.toISOString().slice(0, 10);
  };

  const { lastInsertRowid: userId } = db
    .prepare('INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)')
    .run('Mahasiswa Demo', 'demo@interntrack.id', bcrypt.hashSync('password123', 10));

  const insert = db.prepare(
    `INSERT INTO applications (user_id, company, position, location, work_type, status, source_url,
       allowance, deadline_date, applied_date, follow_up_date, contact_name, contact_email, notes)
     VALUES (@user_id, @company, @position, @location, @work_type, @status, @source_url,
       @allowance, @deadline_date, @applied_date, @follow_up_date, @contact_name, @contact_email, @notes)`,
  );

  const samples = [
    { company: 'Tokopedia', position: 'Frontend Engineer Intern', location: 'Jakarta', work_type: 'hybrid', status: 'interview', allowance: 4000000, applied_date: day(-20), follow_up_date: null, notes: 'Lolos tes teknis, tinggal wawancara user.' },
    { company: 'Gojek', position: 'Backend Engineer Intern', location: 'Jakarta', work_type: 'onsite', status: 'screening', allowance: 3500000, applied_date: day(-9), follow_up_date: day(-1), notes: 'Belum ada kabar, perlu tindak lanjut ke recruiter.' },
    { company: 'Telkom Indonesia', position: 'Data Analyst Intern', location: 'Bandung', work_type: 'onsite', status: 'applied', allowance: 2500000, applied_date: day(-4), follow_up_date: day(3) },
    { company: 'Bukalapak', position: 'QA Engineer Intern', location: 'Remote', work_type: 'remote', status: 'rejected', allowance: 3000000, applied_date: day(-35), notes: 'Ditolak setelah seleksi berkas.' },
    { company: 'Traveloka', position: 'UI/UX Design Intern', location: 'Jakarta', work_type: 'hybrid', status: 'saved', allowance: 3800000, deadline_date: day(6), source_url: 'https://careers.example.com/traveloka-uiux' },
    { company: 'Blibli', position: 'Mobile Developer Intern', location: 'Jakarta', work_type: 'hybrid', status: 'saved', deadline_date: day(12) },
    { company: 'Pertamina', position: 'IT Support Intern', location: 'Medan', work_type: 'onsite', status: 'offer', allowance: 2800000, applied_date: day(-28), notes: 'Penawaran berlaku sampai minggu depan.' },
  ];

  for (const s of samples) {
    const info = insert.run({
      user_id: userId, location: null, source_url: null, allowance: null, deadline_date: null,
      applied_date: null, follow_up_date: null, contact_name: null, contact_email: null, notes: null, ...s,
    });
    recordEvent(db, info.lastInsertRowid, null, 'saved', 'Lamaran dibuat');
    if (s.status !== 'saved') {
      const path = ['applied', 'screening', 'interview', 'offer'];
      const target = s.status === 'rejected' ? 'screening' : s.status;
      for (const step of path.slice(0, path.indexOf(target) + 1)) recordEvent(db, info.lastInsertRowid, null, step);
      if (s.status === 'rejected') recordEvent(db, info.lastInsertRowid, 'screening', 'rejected', 'Tidak lolos seleksi');
    }
  }

  const tokped = db.prepare("SELECT id FROM applications WHERE company = 'Tokopedia'").get();
  const addInterview = db.prepare(
    `INSERT INTO interviews (application_id, user_id, title, type, scheduled_at, location, interviewer, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  );
  addInterview.run(tokped.id, userId, 'Wawancara HR', 'online', `${day(-6)}T10:00`, 'https://meet.example.com/hr', 'Rina (HR)', 'done');
  addInterview.run(tokped.id, userId, 'Wawancara User', 'online', `${day(2)}T14:00`, 'https://meet.example.com/user', 'Andi (Engineering Manager)', 'scheduled');

  const pert = db.prepare("SELECT id FROM applications WHERE company = 'Pertamina'").get();
  addInterview.run(pert.id, userId, 'Wawancara Akhir', 'onsite', `${day(5)}T09:30`, 'Kantor Regional Medan', 'Pak Budi', 'scheduled');
  return true;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const db = openDatabase(config.dbPath);
  console.log(seed(db) ? 'Data contoh dibuat. Login: demo@interntrack.id / password123' : 'Data contoh sudah ada.');
  db.close();
}
