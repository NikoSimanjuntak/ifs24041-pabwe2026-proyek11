import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import useInput from '../../../hooks/useInput';
import { asyncAuthRegister } from '../states/action';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const validateRegister = ({ name, email, password, confirm }) => {
  const errors = {};
  if (name.trim().length < 2) errors.name = 'Nama minimal 2 karakter.';
  if (!EMAIL_REGEX.test(email.trim())) errors.email = 'Format email tidak valid.';
  if (password.length < 6) errors.password = 'Kata sandi minimal 6 karakter.';
  if (confirm !== password) errors.confirm = 'Konfirmasi kata sandi tidak cocok.';
  return errors;
};

export default function RegisterPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [name, onNameChange] = useInput('');
  const [email, onEmailChange] = useInput('');
  const [password, onPasswordChange] = useInput('');
  const [confirm, onConfirmChange] = useInput('');
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const found = validateRegister({ name, email, password, confirm });
    setErrors(found);
    if (Object.keys(found).length) return;

    setSubmitting(true);
    const ok = await dispatch(asyncAuthRegister({ name: name.trim(), email: email.trim(), password }));
    setSubmitting(false);
    if (ok) navigate('/auth/login', { replace: true });
  };

  const fields = [
    ['register-name-input', 'Nama lengkap', 'text', 'name', name, onNameChange, 'name', 'Nama kamu'],
    ['register-email-input', 'Email', 'email', 'email', email, onEmailChange, 'email', 'nama@email.com'],
    ['register-password-input', 'Kata sandi', 'password', 'password', password, onPasswordChange, 'new-password', 'Minimal 6 karakter'],
    ['register-confirm-input', 'Konfirmasi kata sandi', 'password', 'confirm', confirm, onConfirmChange, 'new-password', 'Ulangi kata sandi'],
  ];

  return (
    <>
      <h1 className="text-3xl font-extrabold">Buat akun baru</h1>
      <p className="mt-2 text-sm text-ink-soft">Mulai catat dan pantau lamaran magangmu.</p>

      <form onSubmit={handleSubmit} noValidate className="mt-8 space-y-5">
        {fields.map(([id, label, type, key, value, onChange, autoComplete, placeholder]) => (
          <div key={id}>
            <label htmlFor={id} className="label">{label}</label>
            <input id={id} type={type} autoComplete={autoComplete} className="field" placeholder={placeholder}
              value={value} onChange={onChange} aria-invalid={Boolean(errors[key])} />
            {errors[key] && <p className="field-error">{errors[key]}</p>}
          </div>
        ))}
        <button id="register-submit-button" type="submit" disabled={submitting} className="btn btn-primary w-full">
          {submitting ? 'Memproses…' : 'Daftar'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-soft">
        Sudah punya akun?{' '}
        <Link to="/auth/login" className="font-bold text-ink underline underline-offset-4">Masuk</Link>
      </p>
    </>
  );
}
