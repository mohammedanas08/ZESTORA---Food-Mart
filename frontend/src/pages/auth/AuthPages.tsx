import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { ErrorBox, Field } from '../../components/ui';
import { homeFor } from '../../lib/format';

function AuthShell({ title, blurb, children }: { title: string; blurb: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto grid max-w-4xl items-center gap-8 py-4 md:grid-cols-[1fr_380px] md:py-10">
      <div className="hidden md:block">
        <p className="font-display text-5xl font-semibold leading-[1.1] tracking-tight">{title}</p>
        <p className="mt-4 max-w-sm text-stone-600">{blurb}</p>
      </div>
      <div>
        {children}
      </div>
    </div>
  );
}

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
    <AuthShell title="Welcome back." blurb="Log in to order from local Bhatkal kitchens and follow your orders.">
      <form onSubmit={submit} className="card space-y-4">
        <h1 className="font-display text-3xl font-semibold tracking-tight">Log in</h1>
        <Field label="Email"><input className="input" type="email" required autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
        <Field label="Password"><input className="input" type="password" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} /></Field>
        {error ? <ErrorBox error={error} /> : null}
        <button className="btn-primary w-full" disabled={busy}>{busy ? 'Signing in…' : 'Log in'}</button>
        <p className="text-center text-sm text-stone-500">New here? <Link className="text-brand underline" to="/register">Create an account</Link></p>
      </form>
    </AuthShell>
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
    <AuthShell title="Join Zestora." blurb="Create an account to order food and groceries from local Bhatkal kitchens and stores.">
      <form onSubmit={submit} className="card space-y-4">
        <h1 className="font-display text-3xl font-semibold tracking-tight">Create your account</h1>
        <Field label="Full name"><input className="input" required value={form.name} onChange={set('name')} /></Field>
        <Field label="Email"><input className="input" type="email" required autoComplete="username" value={form.email} onChange={set('email')} /></Field>
        <Field label="Phone"><input className="input" type="tel" value={form.phone} onChange={set('phone')} placeholder="+91 98765 43210" /></Field>
        <Field label="Password (min 8 characters)"><input className="input" type="password" required minLength={8} autoComplete="new-password" value={form.password} onChange={set('password')} /></Field>
        {error ? <ErrorBox error={error} /> : null}
        <button className="btn-primary w-full" disabled={busy}>{busy ? 'Creating…' : 'Sign up'}</button>
        <p className="text-center text-sm text-stone-500">Already registered? <Link className="text-brand underline" to="/login">Log in</Link></p>
      </form>
    </AuthShell>
  );
}
