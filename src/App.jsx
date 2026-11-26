import { useEffect, useState } from 'react';
import { api } from './api';
import PlanPicker from './components/PlanPicker';
import ProfilePage from './components/ProfilePage';
import ActivityPage from './components/ActivityPage';
import FoodPage from './components/FoodPage';

const ACTIVITY = [
  ['sedentary', 'Mostly sitting'],
  ['light', 'Lightly active'],
  ['moderate', 'Moderately active'],
  ['very_active', 'Very active'],
  ['extra_active', 'Extremely active'],
];
const ACTIVITY_LABELS = Object.fromEntries(ACTIVITY);
const GOAL_LABELS = {
  lose_fat: 'Lose fat',
  maintain_weight: 'Maintain weight',
  build_muscle: 'Build muscle',
};

const PAGES = [
  { id: 'dashboard', label: 'Dashboard', icon: '\u25A6' },
  { id: 'calculator', label: 'Calculator', icon: '\u2317' },
  { id: 'tracker', label: 'Food Tracker', icon: '\u25C9' },
  { id: 'profile', label: 'Profile', icon: '\u25CE' },
  { id: 'activity', label: 'Walking & Running', icon: '\u2301' },
];

function usePage() {
  const read = () => {
    const id = window.location.hash.slice(1);
    return PAGES.some((p) => p.id === id) ? id : 'dashboard';
  };
  const [page, setPage] = useState(read);
  useEffect(() => {
    const onChange = () => setPage(read());
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return page;
}

function Brand() {
  return (
    <div className="brand">
      <span className="brandmark">T</span>
      <div>
        Taga<small>AI gym assistant</small>
      </div>
    </div>
  );
}

function ErrorBox({ error }) {
  if (!error) return null;
  return (
    <div className="notice error" role="alert">
      <div>{error.message}</div>
      {error.details?.map((d) => (
        <div key={d.field}>
          {d.field}: {d.message}
        </div>
      ))}
    </div>
  );
}

function Field({ id, label, full, children }) {
  return (
    <div className={full ? 'field full' : 'field'}>
      <label htmlFor={id}>{label}</label>
      {children}
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
  const isLogin = mode === 'login';

  async function submit(e) {
    e.preventDefault();
    setError(null);
    try {
      const body = isLogin ? { email: form.email, password: form.password } : form;
      onDone(await api(`/auth/${mode}`, { method: 'POST', body }));
    } catch (err) {
      setError(err);
    }
  }

  return (
    <div className="shell">
      <div className="topbar">
        <Brand />
      </div>
      <div className="authwrap">
        <div className="card">
          <p className="eyebrow">{isLogin ? 'Welcome back' : 'Get started'}</p>
          <h1 className="auth-title">{isLogin ? 'Log in' : 'Create your account'}</h1>
          <form onSubmit={submit}>
            <div className="form-grid">
              <Field id="email" label="Email" full>
                <input id="email" type="email" autoComplete="email" value={form.email} onChange={set('email')} />
              </Field>
              <Field id="password" label="Password" full>
                <input id="password" type="password" autoComplete={isLogin ? 'current-password' : 'new-password'} value={form.password} onChange={set('password')} />
              </Field>
              {!isLogin && (
                <>
                  <Field id="full_name" label="Full name" full>
                    <input id="full_name" value={form.full_name} onChange={set('full_name')} />
                  </Field>
                  <Field id="dob" label="Date of birth">
                    <input id="dob" type="date" value={form.date_of_birth} onChange={set('date_of_birth')} />
                  </Field>
                  <Field id="gender" label="Gender">
                    <select id="gender" value={form.gender} onChange={set('gender')}>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                    </select>
                  </Field>
                  <Field id="height" label="Height (cm)">
                    <input id="height" type="number" value={form.height_cm} onChange={set('height_cm')} />
                  </Field>
                  <Field id="weight" label="Weight (kg)">
                    <input id="weight" type="number" value={form.weight_kg} onChange={set('weight_kg')} />
                  </Field>
                  <Field id="activity" label="Activity level" full>
                    <select id="activity" value={form.activity_level} onChange={set('activity_level')}>
                      {ACTIVITY.map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                  </Field>
                </>
              )}
            </div>
            <ErrorBox error={error} />
            <div className="actions">
              <button className="btn primary" type="submit">{isLogin ? 'Log in' : 'Register'}</button>
              <button className="btn ghost" type="button" onClick={() => { setError(null); setMode(isLogin ? 'register' : 'login'); }}>
                {isLogin ? 'Need an account? Register' : 'Have an account? Log in'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function Dashboard({ session }) {
  const p = session.profile || {};
  const name = (p.full_name || session.user.email).split(' ')[0];
  const stats = [
    ['Weight', p.weight_kg ?? '-', 'kg', 'From your profile'],
    ['Height', p.height_cm ?? '-', 'cm', 'From your profile'],
    ['Goal', GOAL_LABELS[p.fitness_goal] ?? 'Not chosen yet', '', 'Pick one in the calculator'],
    ['Activity', ACTIVITY_LABELS[p.activity_level] ?? '-', '', 'From your profile'],
  ];
  return (
    <section>
      <div className="pagehead">
        <div>
          <p className="eyebrow">Dashboard</p>
          <h1>Hi, {name}</h1>
          <p className="sub">Your numbers at a glance. Pick a plan to set your daily targets.</p>
        </div>
        <div className="date-chip">{new Date().toLocaleDateString()}</div>
      </div>
      <div className="grid stats">
        {stats.map(([label, value, unit, foot]) => (
          <div className="card" key={label}>
            <div className="stat-top">{label}</div>
            <div className={unit ? 'stat-value' : 'stat-value text'}>
              {value} {unit && <span>{unit}</span>}
            </div>
            <div className="stat-foot">{foot}</div>
          </div>
        ))}
      </div>
      <div className="card">
        <h3 style={{ margin: 0 }}>Choose your plan</h3>
        <p className="sub">Lose fat, maintain weight or build muscle, worked out from your profile.</p>
        <div className="actions">
          <a className="btn primary" href="#calculator">Open calculator</a>
        </div>
      </div>
    </section>
  );
}

function Calculator() {
  return (
    <section>
      <div className="pagehead">
        <div>
          <p className="eyebrow">Calculator</p>
          <h1>Your daily plan</h1>
          <p className="sub">Estimated calories and macros for each goal. Tap one to save it as today's target.</p>
        </div>
      </div>
      <PlanPicker />
    </section>
  );
}

function Placeholder({ eyebrow, title, text }) {
  return (
    <section>
      <div className="pagehead">
        <div>
          <p className="eyebrow">{eyebrow}</p>
          <h1>{title}</h1>
          <p className="sub">{text}</p>
        </div>
      </div>
      <div className="card">
        <p className="empty">This page is not connected to the back end yet.</p>
      </div>
    </section>
  );
}

export default function App() {
  const [session, setSession] = useState(undefined); // undefined = still loading
  const page = usePage();

  useEffect(() => {
    api('/auth/me').then(setSession).catch(() => setSession(null));
  }, []);

  async function logout() {
    await api('/auth/logout', { method: 'POST' });
    setSession(null);
  }

  if (session === undefined) {
    return <div className="shell"><p className="empty">Loading...</p></div>;
  }
  if (!session) return <AuthForm onDone={setSession} />;

  const name = session.profile?.full_name || session.user.email;

  return (
    <div className="app">
      <div className="shell">
        <header className="topbar">
          <Brand />
          <div className="top-right">
            <div className="avatar" title={name}>{name.trim().charAt(0).toUpperCase()}</div>
            <button className="btn ghost" onClick={logout}>Log out</button>
          </div>
        </header>
        <main>
          {page === 'dashboard' && <Dashboard session={session} />}
          {page === 'calculator' && <Calculator />}
          {page === 'tracker' && <FoodPage />}
          {page === 'profile' && (
            <ProfilePage
              profile={session.profile}
              email={session.user.email}
              onSaved={(profile) => setSession({ ...session, profile })}
            />
          )}
          {page === 'activity' && <ActivityPage />}
        </main>
      </div>
      <aside className="sidebar">
        <nav className="nav" aria-label="Main navigation">
          {PAGES.map((p) => (
            <a key={p.id} href={'#' + p.id} className={page === p.id ? 'active' : ''} aria-current={page === p.id ? 'page' : undefined}>
              <span className="navicon">{p.icon}</span>
              <span>{p.label}</span>
            </a>
          ))}
        </nav>
      </aside>
    </div>
  );
}
