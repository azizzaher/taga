import { useEffect, useState } from 'react';
import { api } from './api';
import PlanPicker from './components/PlanPicker';

const ACTIVITY = [
  ['sedentary', 'Mostly sitting'],
  ['light', 'Lightly active'],
  ['moderate', 'Moderately active'],
  ['very_active', 'Very active'],
  ['extra_active', 'Extremely active'],
];

function ErrorBox({ error }) {
  if (!error) return null;
  return (
    <div role="alert" style={{ color: 'crimson' }}>
      <p>{error.message}</p>
      {error.details?.map((d) => (
        <p key={d.field}>
          {d.field}: {d.message}
        </p>
      ))}
    </div>
  );
}

function AuthForm({ onDone }) {
  const [mode, setMode] = useState('login');
  const [error, setError] = useState(null);
  const [form, setForm] = useState({
    email: '', password: '', full_name: '', date_of_birth: '',
    height_cm: '', weight_kg: '', gender: 'male', activity_level: 'moderate',
  });
  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setError(null);
    try {
      const body = mode === 'login' ? { email: form.email, password: form.password } : form;
      onDone(await api(`/auth/${mode}`, { method: 'POST', body }));
    } catch (err) {
      setError(err);
    }
  }

  return (
    <main style={{ maxWidth: 380, margin: '2rem auto', display: 'grid', gap: 8 }}>
      <h1>Taga</h1>
      <h2>{mode === 'login' ? 'Log in' : 'Create account'}</h2>
      <form onSubmit={submit} style={{ display: 'grid', gap: 8 }}>
        <input placeholder="Email" type="email" value={form.email} onChange={set('email')} />
        <input placeholder="Password" type="password" value={form.password} onChange={set('password')} />
        {mode === 'register' && (
          <>
            <input placeholder="Full name" value={form.full_name} onChange={set('full_name')} />
            <label>
              Date of birth
              <input type="date" value={form.date_of_birth} onChange={set('date_of_birth')} />
            </label>
            <input placeholder="Height (cm)" type="number" value={form.height_cm} onChange={set('height_cm')} />
            <input placeholder="Weight (kg)" type="number" value={form.weight_kg} onChange={set('weight_kg')} />
            <select value={form.gender} onChange={set('gender')}>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
            <select value={form.activity_level} onChange={set('activity_level')}>
              {ACTIVITY.map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </>
        )}
        <ErrorBox error={error} />
        <button type="submit">{mode === 'login' ? 'Log in' : 'Register'}</button>
      </form>
      <button onClick={() => { setError(null); setMode(mode === 'login' ? 'register' : 'login'); }}>
        {mode === 'login' ? 'Need an account? Register' : 'Have an account? Log in'}
      </button>
    </main>
  );
}

export default function App() {
  const [session, setSession] = useState(undefined); // undefined = still loading

  useEffect(() => {
    api('/auth/me').then(setSession).catch(() => setSession(null));
  }, []);

  async function logout() {
    await api('/auth/logout', { method: 'POST' });
    setSession(null);
  }

  if (session === undefined) return <p>Loading…</p>;
  if (!session) return <AuthForm onDone={setSession} />;

  return (
    <main style={{ maxWidth: 600, margin: '2rem auto' }}>
      <h1>Hi, {session.profile?.full_name ?? session.user.email}</h1>
      <button onClick={logout}>Log out</button>
      <h2>Choose your plan</h2>
      <PlanPicker />
    </main>
  );
}