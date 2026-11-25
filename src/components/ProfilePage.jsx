import { useState } from 'react';
import { api } from '../api';

const ACTIVITY = [
  ['sedentary', 'Mostly sitting'],
  ['light', 'Lightly active'],
  ['moderate', 'Moderately active'],
  ['very_active', 'Very active'],
  ['extra_active', 'Extremely active'],
];
const GOALS = [
  ['', 'Not chosen yet'],
  ['lose_fat', 'Lose fat'],
  ['maintain_weight', 'Maintain weight'],
  ['build_muscle', 'Build muscle'],
];

function Field({ id, label, full, children }) {
  return (
    <div className={full ? 'field full' : 'field'}>
      <label htmlFor={id}>{label}</label>
      {children}
    </div>
  );
}

export default function ProfilePage({ profile, email, onSaved }) {
  const p = profile || {};
  const [form, setForm] = useState({
    full_name: p.full_name ?? '',
    date_of_birth: p.date_of_birth ?? '',
    height_cm: p.height_cm ?? '',
    weight_kg: p.weight_kg ?? '',
    gender: p.gender ?? 'male',
    activity_level: p.activity_level ?? 'moderate',
    fitness_goal: p.fitness_goal ?? '',
  });
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setError(null);
    setMessage('');
    setSaving(true);
    try {
      const body = { ...form, fitness_goal: form.fitness_goal || null };
      const data = await api('/profile', { method: 'PATCH', body });
      onSaved(data.profile);
      setMessage('Profile saved. Your plans now use these numbers.');
    } catch (err) {
      setError(err);
    } finally {
      setSaving(false);
    }
  }

  const name = form.full_name || email || '?';

  return (
    <section>
      <div className="pagehead">
        <div>
          <p className="eyebrow">Profile</p>
          <h1>Your profile</h1>
          <p className="sub">Keep these up to date so your calorie plans stay accurate.</p>
        </div>
      </div>
      <div className="card">
        <div className="profile-head">
          <div className="big-avatar">{name.trim().charAt(0).toUpperCase()}</div>
          <div>
            <h2>{p.full_name || 'Your name'}</h2>
            <p>{email}</p>
          </div>
        </div>
        <form onSubmit={submit}>
          <div className="form-grid">
            <Field id="p_name" label="Full name" full>
              <input id="p_name" value={form.full_name} onChange={set('full_name')} />
            </Field>
            <Field id="p_dob" label="Date of birth">
              <input id="p_dob" type="date" value={form.date_of_birth} onChange={set('date_of_birth')} />
            </Field>
            <Field id="p_gender" label="Gender">
              <select id="p_gender" value={form.gender} onChange={set('gender')}>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </Field>
            <Field id="p_height" label="Height (cm)">
              <input id="p_height" type="number" value={form.height_cm} onChange={set('height_cm')} />
            </Field>
            <Field id="p_weight" label="Weight (kg)">
              <input id="p_weight" type="number" step="0.1" value={form.weight_kg} onChange={set('weight_kg')} />
            </Field>
            <Field id="p_activity" label="Activity level">
              <select id="p_activity" value={form.activity_level} onChange={set('activity_level')}>
                {ACTIVITY.map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </Field>
            <Field id="p_goal" label="Goal">
              <select id="p_goal" value={form.fitness_goal} onChange={set('fitness_goal')}>
                {GOALS.map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </Field>
          </div>
          {message && <div className="notice ok">{message}</div>}
          {error && (
            <div className="notice error" role="alert">
              <div>{error.message}</div>
              {error.details?.map((d) => (
                <div key={d.field}>
                  {d.field}: {d.message}
                </div>
              ))}
            </div>
          )}
          <div className="actions">
            <button className="btn primary" type="submit" disabled={saving}>
              {saving ? 'Saving...' : 'Save changes'}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
