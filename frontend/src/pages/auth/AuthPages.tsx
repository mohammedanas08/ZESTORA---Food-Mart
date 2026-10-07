import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { ErrorBox, Field } from '../../components/ui';
import { homeFor } from '../../lib/format';

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const from = (useLocation().state as { from?: string } | null)?.from;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<unknown>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const user = await login(email, password);
      navigate(from && user.role === 'CUSTOMER' ? from : homeFor(user.role), { replace: true });
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-sm">
      <h1 className="mb-4 text-2xl font-bold">Log in</h1>
      <form onSubmit={submit} className="card space-y-3">
        <Field label="Email"><input className="input" type="email" required autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
        <Field label="Password"><input className="input" type="password" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} /></Field>
        {error ? <ErrorBox error={error} /> : null}
        <button className="btn-primary w-full" disabled={busy}>{busy ? 'Signing in…' : 'Log in'}</button>
        <p className="text-center text-sm text-stone-500">New here? <Link className="text-brand underline" to="/register">Create an account</Link></p>
      </form>
    </div>
  );
}

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [error, setError] = useState<unknown>(null);
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: e.target.value });

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await register({ name: form.name, email: form.email, phone: form.phone || undefined, password: form.password });
      navigate('/', { replace: true });
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-sm">
      <h1 className="mb-4 text-2xl font-bold">Create your account</h1>
      <form onSubmit={submit} className="card space-y-3">
        <Field label="Full name"><input className="input" required value={form.name} onChange={set('name')} /></Field>
        <Field label="Email"><input className="input" type="email" required autoComplete="username" value={form.email} onChange={set('email')} /></Field>
        <Field label="Phone"><input className="input" type="tel" value={form.phone} onChange={set('phone')} placeholder="+91 98765 43210" /></Field>
        <Field label="Password (min 8 characters)"><input className="input" type="password" required minLength={8} autoComplete="new-password" value={form.password} onChange={set('password')} /></Field>
        {error ? <ErrorBox error={error} /> : null}
        <button className="btn-primary w-full" disabled={busy}>{busy ? 'Creating…' : 'Sign up'}</button>
        <p className="text-center text-sm text-stone-500">Already registered? <Link className="text-brand underline" to="/login">Log in</Link></p>
      </form>
    </div>
  );
}
