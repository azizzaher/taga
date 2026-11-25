import { useCallback, useEffect, useState } from 'react';
import { api } from '../api';

const todayLocal = () => new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD

function Field({ id, label, full, hint, children }) {
  return (
    <div className={full ? 'field full' : 'field'}>
      <label htmlFor={id}>{label}</label>
      {children}
      {hint && <div className="stat-foot">{hint}</div>}
    </div>
  );
}

export default function ActivityPage() {
  const [data, setData] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [form, setForm] = useState({
    type: 'walking', duration_minutes: '', distance_km: '', exercise_date: todayLocal(),
  });
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const load = useCallback(
    () => api('/activity?days=30').then(setData).catch((e) => setLoadError(e.message)),
    []
  );
  useEffect(() => {
    load();
  }, [load]);

  async function submit(e) {
    e.preventDefault();
    setError(null);
    setMessage('');
    setSaving(true);
    try {
      const body = { ...form };
      if (body.distance_km === '') delete body.distance_km;
      const res = await api('/activity', { method: 'POST', body });
      setMessage(`Saved. About ${res.entry.calories_burned} kcal burned.`);
      setForm({ ...form, duration_minutes: '', distance_km: '' });
      await load();
    } catch (err) {
      setError(err);
    } finally {
      setSaving(false);
    }
  }

  const week = data?.week;
  const stats = week
    ? [
        ['Sessions', week.sessions, ''],
        ['Distance', Math.round(week.distance_km * 10) / 10, 'km'],
        ['Time', week.minutes, 'min'],
        ['Calories', Math.round(week.calories_burned), 'kcal'],
      ]
    : [];

  return (
    <section>
      <div className="pagehead">
        <div>
          <p className="eyebrow">Activity</p>
          <h1>Walking &amp; Running</h1>
          <p className="sub">Log a session and see your last 7 days. Calories are estimated from your weight.</p>
        </div>
      </div>

      {loadError && <div className="notice error" role="alert">{loadError}</div>}

      {week && (
        <div className="grid stats">
          {stats.map(([label, value, unit]) => (
            <div className="card" key={label}>
              <div className="stat-top">{label}</div>
              <div className="stat-value">
                {value} {unit && <span>{unit}</span>}
              </div>
              <div className="stat-foot">Last 7 days</div>
            </div>
          ))}
        </div>
      )}

      <div className="card">
        <h3 style={{ margin: 0 }}>Log a session</h3>
        <form onSubmit={submit}>
          <div className="form-grid">
            <Field id="a_type" label="Type">
              <select id="a_type" value={form.type} onChange={set('type')}>
                <option value="walking">Walking</option>
                <option value="running">Running</option>
              </select>
            </Field>
            <Field id="a_date" label="Date">
              <input id="a_date" type="date" value={form.exercise_date} onChange={set('exercise_date')} />
            </Field>
            <Field id="a_minutes" label="Duration (minutes)">
              <input id="a_minutes" type="number" min="1" value={form.duration_minutes} onChange={set('duration_minutes')} />
            </Field>
            <Field id="a_distance" label="Distance (km, optional)" hint="Adding distance makes the calorie estimate more accurate.">
              <input id="a_distance" type="number" step="0.1" min="0" value={form.distance_km} onChange={set('distance_km')} />
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
              {saving ? 'Saving...' : 'Save session'}
            </button>
          </div>
        </form>
      </div>

      <div className="card mt">
        <h3 style={{ margin: 0 }}>Recent sessions</h3>
        {!data && !loadError && <p className="empty">Loading...</p>}
        {data && data.entries.length === 0 && <p className="empty">No sessions yet. Log your first one above.</p>}
        {data && data.entries.length > 0 && (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Time</th>
                  <th>Distance</th>
                  <th>Calories</th>
                </tr>
              </thead>
              <tbody>
                {data.entries.map((x) => (
                  <tr key={x.id}>
                    <td>{x.exercise_date}</td>
                    <td>
                      <span className={x.type === 'running' ? 'tag run' : 'tag'}>{x.type}</span>
                    </td>
                    <td>{x.duration_minutes} min</td>
                    <td>{x.distance_km != null ? `${x.distance_km} km` : '-'}</td>
                    <td>{x.calories_burned != null ? `${Math.round(x.calories_burned)} kcal` : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
