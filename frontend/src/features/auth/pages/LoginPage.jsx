import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import useInput from '../../../hooks/useInput';
import { asyncAuthLogin } from '../states/action';

export const validateLogin = ({ email, password }) => {
  const errors = {};
  if (!email.trim()) errors.email = 'Email wajib diisi.';
  if (!password) errors.password = 'Kata sandi wajib diisi.';
  else if (password.length < 6) errors.password = 'Kata sandi minimal 6 karakter.';
  return errors;
};

export default function LoginPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [email, onEmailChange] = useInput('');
  const [password, onPasswordChange] = useInput('');
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const found = validateLogin({ email, password });
    setErrors(found);
    if (Object.keys(found).length) return;

    setSubmitting(true);
    const ok = await dispatch(asyncAuthLogin({ email: email.trim(), password }));
    setSubmitting(false);
    if (ok) navigate('/', { replace: true });
  };

  return (
    <>
      <h1 className="text-3xl font-extrabold">Masuk ke akunmu</h1>
      <p className="mt-2 text-sm text-ink-soft">Lanjutkan untuk memantau lamaran magangmu.</p>

      <form onSubmit={handleSubmit} noValidate className="mt-8 space-y-5">
        <div>
          <label htmlFor="login-email-input" className="label">Email</label>
          <input id="login-email-input" type="email" autoComplete="username" className="field" placeholder="nama@email.com"
            value={email} onChange={onEmailChange} aria-invalid={Boolean(errors.email)} />
          {errors.email && <p className="field-error">{errors.email}</p>}
        </div>
        <div>
          <label htmlFor="login-password-input" className="label">Kata sandi</label>
          <input id="login-password-input" type="password" autoComplete="current-password" className="field" placeholder="Minimal 6 karakter"
            value={password} onChange={onPasswordChange} aria-invalid={Boolean(errors.password)} />
          {errors.password && <p className="field-error">{errors.password}</p>}
        </div>
        <button id="login-submit-button" type="submit" disabled={submitting} className="btn btn-primary w-full">
          {submitting ? 'Memproses…' : 'Masuk'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-soft">
        Belum punya akun?{' '}
        <Link to="/auth/register" className="font-bold text-ink underline underline-offset-4">Daftar sekarang</Link>
      </p>
    </>
  );
}
