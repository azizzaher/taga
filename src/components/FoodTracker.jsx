import { useCallback, useEffect, useState } from 'react';
import { api } from '../api';

const todayLocal = () => {
  const date = new Date();
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
};

const EMPTY_FORM = {
  food_name: '',
  meal_type: 'breakfast',
  serving: '1 serving',
  calories: '',
  protein_g: '',
  carbohydrates_g: '',
  fat_g: '',
};

const NUTRIENTS = [
  ['calories', 'Calories', 'kcal'],
  ['protein_g', 'Protein', 'g'],
  ['carbohydrates_g', 'Carbs', 'g'],
  ['fat_g', 'Fat', 'g'],
];

function Field({ id, label, children }) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {children}
    </div>
  );
}

function showAmount(value) {
  return Number(value).toLocaleString(undefined, { maximumFractionDigits: 1 });
}

export default function FoodTracker() {
  const [date, setDate] = useState(todayLocal);
  const [data, setData] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const load = useCallback(async () => {
    setLoadError('');
    setData(null);
    try {
      setData(await api(`/food?date=${encodeURIComponent(date)}`));
    } catch (err) {
      setLoadError(err.message);
    }
  }, [date]);

  useEffect(() => {
    load();
  }, [load]);

  const set = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.value }));

  async function submit(event) {
    event.preventDefault();
    setError(null);
    setMessage('');
    setSaving(true);
    try {
      await api('/food', {
        method: 'POST',
        body: { ...form, food_date: date },
      });
      setForm(EMPTY_FORM);
      setMessage('Food logged.');
      await load();
    } catch (err) {
      setError(err);
    } finally {
      setSaving(false);
    }
  }

  async function removeEntry(id) {
    setError(null);
    setMessage('');
    setDeletingId(id);
    try {
      await api(`/food/${id}`, { method: 'DELETE' });
      setMessage('Food entry removed.');
      await load();
    } catch (err) {
      setError(err);
    } finally {
      setDeletingId(null);
    }
  }

  const target = data?.target;
  const totalValues = data?.totals;
  const targetValues = [
    target?.calorie_target,
    target?.protein_target_g,
    target?.carbohydrates_target_g,
    target?.fat_target_g,
  ];
  const totalKeys = ['calories', 'protein_g', 'carbohydrates_g', 'fat_g'];

  return (
    <section>
      <div className="pagehead">
        <div>
          <p className="eyebrow">Food Tracker</p>
          <h1>Your daily nutrition</h1>
          <p className="sub">Log what you ate and track calories and macros for the day.</p>
        </div>
        <Field id="food-date" label="Log date">
          <input id="food-date" type="date" value={date} onChange={(event) => setDate(event.target.value)} />
        </Field>
      </div>

      {loadError && <div className="notice error" role="alert">{loadError}</div>}

      {data && (
        <div className="grid stats">
          {NUTRIENTS.map(([key, label, unit], index) => {
            const total = totalValues[totalKeys[index]];
            const dailyTarget = targetValues[index];
            const hasTarget = dailyTarget != null && Number(dailyTarget) > 0;
            const progress = hasTarget
              ? Math.min(100, (Number(total) / Number(dailyTarget)) * 100)
              : 0;
            return (
              <div className="card" key={key}>
                <div className="stat-top">{label}</div>
                <div className="stat-value">
                  {showAmount(total)}
                  <span>{unit}{hasTarget ? ` / ${showAmount(dailyTarget)} ${unit}` : ''}</span>
                </div>
                {hasTarget ? (
                  <div className="food-progress" aria-label={`${label}: ${Math.round(progress)}% of target`}>
                    <span style={{ width: `${progress}%` }} />
                  </div>
                ) : (
                  <div className="stat-foot">No daily target set</div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="card">
        <h3 style={{ margin: 0 }}>Log food</h3>
        <p className="sub">Enter nutrition for the serving you ate.</p>
        <form onSubmit={submit}>
          <div className="form-grid">
            <Field id="food-meal" label="Meal">
              <select id="food-meal" value={form.meal_type} onChange={set('meal_type')}>
                <option value="breakfast">Breakfast</option>
                <option value="lunch">Lunch</option>
                <option value="dinner">Dinner</option>
                <option value="snack">Snack</option>
              </select>
            </Field>
            <Field id="food-name" label="Food">
              <input id="food-name" maxLength="120" required value={form.food_name} onChange={set('food_name')} placeholder="e.g. Greek yogurt" />
            </Field>
            <Field id="food-serving" label="Serving">
              <input id="food-serving" maxLength="100" value={form.serving} onChange={set('serving')} placeholder="e.g. 170 g" />
            </Field>
            {NUTRIENTS.map(([key, label, unit]) => (
              <Field id={`food-${key}`} label={`${label} (${unit})`} key={key}>
                <input
                  id={`food-${key}`}
                  type="number"
                  min="0"
                  max={key === 'calories' ? '10000' : '1000'}
                  step="0.1"
                  required
                  value={form[key]}
                  onChange={set(key)}
                />
              </Field>
            ))}
          </div>
          {message && <div className="notice ok" role="status">{message}</div>}
          {error && (
            <div className="notice error" role="alert">
              <div>{error.message}</div>
              {error.details?.map((detail) => (
                <div key={detail.field}>{detail.field}: {detail.message}</div>
              ))}
            </div>
          )}
          <div className="actions">
            <button className="btn primary" type="submit" disabled={saving}>
              {saving ? 'Saving...' : 'Add food'}
            </button>
          </div>
        </form>
      </div>

      <div className="card mt">
        <h3 style={{ margin: 0 }}>Food logged</h3>
        {!data && !loadError && <p className="empty">Loading food entries...</p>}
        {data && data.entries.length === 0 && (
          <p className="empty">Nothing logged for this day yet. Add your first food above.</p>
        )}
        {data && data.entries.length > 0 && (
          <div className="table-wrap">
            <table className="table food-table">
              <thead>
                <tr>
                  <th>Food</th>
                  <th>Meal</th>
                  <th>Calories</th>
                  <th>Protein</th>
                  <th>Carbs</th>
                  <th>Fat</th>
                  <th><span className="visually-hidden">Actions</span></th>
                </tr>
              </thead>
              <tbody>
                {data.entries.map((entry) => (
                  <tr key={entry.id}>
                    <td>
                      <strong>{entry.food_name}</strong>
                      <div className="stat-foot">{entry.serving}</div>
                    </td>
                    <td className="food-meal">{entry.meal_type}</td>
                    <td>{showAmount(entry.calories)} kcal</td>
                    <td>{showAmount(entry.protein_g)} g</td>
                    <td>{showAmount(entry.carbohydrates_g)} g</td>
                    <td>{showAmount(entry.fat_g)} g</td>
                    <td>
                      <button
                        className="btn ghost food-remove"
                        type="button"
                        disabled={deletingId === entry.id}
                        onClick={() => removeEntry(entry.id)}
                        aria-label={`Remove ${entry.food_name}`}
                      >
                        {deletingId === entry.id ? 'Removing...' : 'Remove'}
                      </button>
                    </td>
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
