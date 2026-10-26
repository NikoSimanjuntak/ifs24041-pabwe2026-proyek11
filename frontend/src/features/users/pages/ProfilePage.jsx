import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Avatar from '../../../components/Avatar';
import useInput from '../../../hooks/useInput';
import { formatDate } from '../../../helpers/toolsHelper';
import { asyncChangeProfile, asyncChangeProfilePassword } from '../states/action';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const validateProfile = ({ name, email }) => {
  const errors = {};
  if (name.trim().length < 2) errors.name = 'Nama minimal 2 karakter.';
  if (!EMAIL_REGEX.test(email.trim())) errors.email = 'Format email tidak valid.';
  return errors;
};

export const validatePassword = ({ password, newPassword, confirm }) => {
  const errors = {};
  if (!password) errors.password = 'Kata sandi lama wajib diisi.';
  if (newPassword.length < 6) errors.newPassword = 'Kata sandi baru minimal 6 karakter.';
  if (confirm !== newPassword) errors.confirm = 'Konfirmasi kata sandi tidak cocok.';
  return errors;
};

export default function ProfilePage() {
  const dispatch = useDispatch();
  const profile = useSelector((s) => s.profile);
  const saving = useSelector((s) => s.isChangeProfile);
  const savingPassword = useSelector((s) => s.isChangeProfilePassword);

  const [name, onName, setName] = useInput(profile?.name ?? '');
  const [email, onEmail, setEmail] = useInput(profile?.email ?? '');
  const [password, onPassword, setPassword] = useInput('');
  const [newPassword, onNewPassword, setNewPassword] = useInput('');
  const [confirm, onConfirm, setConfirm] = useInput('');
  const [profileErrors, setProfileErrors] = useState({});
  const [passwordErrors, setPasswordErrors] = useState({});

  useEffect(() => {
    setName(profile?.name ?? '');
    setEmail(profile?.email ?? '');
  }, [profile, setName, setEmail]);

  const submitProfile = (e) => {
    e.preventDefault();
    const found = validateProfile({ name, email });
    setProfileErrors(found);
    if (Object.keys(found).length) return;
    dispatch(asyncChangeProfile({ name: name.trim(), email: email.trim() }));
  };

  const submitPassword = async (e) => {
    e.preventDefault();
    const found = validatePassword({ password, newPassword, confirm });
    setPasswordErrors(found);
    if (Object.keys(found).length) return;
    const ok = await dispatch(asyncChangeProfilePassword({
      password, new_password: newPassword, new_password_confirmation: confirm,
    }));
    if (ok) {
      setPassword('');
      setNewPassword('');
      setConfirm('');
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-4">
        <Avatar name={profile?.name ?? ''} size="h-16 w-16" className="!text-xl" />
        <div>
          <h1 className="text-3xl font-extrabold">Profil saya</h1>
          <p className="text-sm text-ink-soft">Bergabung sejak {formatDate(profile?.created_at)}</p>
        </div>
      </div>

      <section className="panel p-6" aria-label="Data akun">
        <h2 className="mb-4 text-lg font-bold">Data akun</h2>
        <form onSubmit={submitProfile} noValidate className="space-y-4">
          <div>
            <label htmlFor="profile-name" className="label">Nama</label>
            <input id="profile-name" className="field" value={name} onChange={onName} aria-invalid={Boolean(profileErrors.name)} />
            {profileErrors.name && <p className="field-error">{profileErrors.name}</p>}
          </div>
          <div>
            <label htmlFor="profile-email" className="label">Email</label>
            <input id="profile-email" type="email" className="field" value={email} onChange={onEmail} aria-invalid={Boolean(profileErrors.email)} />
            {profileErrors.email && <p className="field-error">{profileErrors.email}</p>}
          </div>
          <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Menyimpan…' : 'Simpan profil'}</button>
        </form>
      </section>

      <section className="panel p-6" aria-label="Ubah kata sandi">
        <h2 className="mb-4 text-lg font-bold">Ubah kata sandi</h2>
        <form onSubmit={submitPassword} noValidate className="space-y-4">
          {[
            ['pw-current', 'Kata sandi lama', password, onPassword, 'password', 'current-password'],
            ['pw-new', 'Kata sandi baru', newPassword, onNewPassword, 'newPassword', 'new-password'],
            ['pw-confirm', 'Konfirmasi kata sandi baru', confirm, onConfirm, 'confirm', 'new-password'],
          ].map(([id, label, value, onChange, key, autoComplete]) => (
            <div key={id}>
              <label htmlFor={id} className="label">{label}</label>
              <input id={id} type="password" autoComplete={autoComplete} className="field" value={value} onChange={onChange} aria-invalid={Boolean(passwordErrors[key])} />
              {passwordErrors[key] && <p className="field-error">{passwordErrors[key]}</p>}
            </div>
          ))}
          <button type="submit" className="btn btn-primary" disabled={savingPassword}>{savingPassword ? 'Menyimpan…' : 'Ubah kata sandi'}</button>
        </form>
      </section>
    </div>
  );
}
