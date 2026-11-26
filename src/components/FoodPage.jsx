import { useCallback, useEffect, useState } from 'react';
import { api } from '../api';

const todayLocal = () => new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD
const UNITS = ['g', 'ml', 'serving', 'piece', 'cup', 'tbsp', 'tsp', 'oz'];
const EMPTY = {
  food_name: '', quantity: '', unit: 'serving',
  calories: '', protein_g: '', carbohydrates_g: '', fat_g: '',
};

function Field({ id, label, full, children }) {
  return (
    <div className={full ? 'field full' : 'field'}>
      <label htmlFor={id}>{label}</label>
      {children}
    </div>
  );
}

function Stat({ label, value, unit, target, bar }) {
  const pct = target ? Math.min(100, Math.round((value / target) * 100)) : 0;
  return (
    <div className="card">
      <div className="stat-top">{label}</div>
      <div className="stat-value">
        {value} <span>{unit}</span>
      </div>
      <div className="macro-track">
        <span className={bar} style={{ width: pct + '%' }} />
      </div>
      <div className="stat-foot" style={{ marginTop: 8 }}>
        {target ? `of ${target} ${unit} target` : 'No target set yet'}
      </div>
    </div>
  );
}

export default function FoodPage() {
  const [date, setDate] = useState(todayLocal());
  const [data, setData] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const load = useCallback(() => {
    setLoadError('');
    return api(`/food?date=${date}`).then(setData).catch((e) => setLoadError(e.message));
  }, [date]);

  useEffect(() => {
    load();
  }, [load]);

  async function submit(e) {
    e.preventDefault();
    setError(null);
    setMessage('');
    setSaving(true);
    try {
      const body = { ...form, date };
      for (const key of ['protein_g', 'carbohydrates_g', 'fat_g']) {
        if (body[key] === '') delete body[key];
      }
      await api('/food', { method: 'POST', body });
      setMessage('Food added.');
      setForm(EMPTY);
      await load();
    } catch (err) {
      setError(err);
    } finally {
      setSaving(false);
    }
  }

  async function remove(id) {
    setError(null);
    setMessage('');
    try {
      await api(`/food/${id}`, { method: 'DELETE' });
      await load();
    } catch (err) {
      setError(err);
    }
  }

  const totals = data?.totals;
  const targets = data?.targets;

  return (
    <section>
      <div className="pagehead">
        <div>
          <p className="eyebrow">Food Tracker</p>
          <h1>Food Tracker</h1>
          <p className="sub">Log what you eat and compare it with your daily targets.</p>
        </div>
        <input
          className="date-input"
          type="date"
          value={date}
          onChange={(e) => e.target.value && setDate(e.target.value)}
          aria-label="Day"
        />
      </div>

      {loadError && <div className="notice error" role="alert">{loadError}</div>}

      {totals && (
        <div className="grid stats">
          <Stat label="Calories" value={totals.calories} unit="kcal" target={targets?.calories} bar="bluebar" />
          <Stat label="Protein" value={totals.protein_g} unit="g" target={targets?.protein_g} bar="bluebar" />
          <Stat label="Carbs" value={totals.carbohydrates_g} unit="g" target={targets?.carbohydrates_g} bar="greenbar" />
          <Stat label="Fat" value={totals.fat_g} unit="g" target={targets?.fat_g} bar="purplebar" />
        </div>
      )}
      {data && !targets && (
        <div className="notice">
          No targets for this day. Open <a href="#calculator" style={{ color: 'inherit' }}>Calculator</a> and
          tap "Use this plan" to set them.
        </div>
      )}

      <div className="card">
        <h3 style={{ margin: 0 }}>Add food</h3>
        <form onSubmit={submit}>
          <div className="form-grid">
            <Field id="f_name" label="Food" full>
              <input id="f_name" value={form.food_name} onChange={set('food_name')} placeholder="For example: Oatmeal with milk" />
            </Field>
            <Field id="f_qty" label="Quantity">
              <input id="f_qty" type="number" step="any" min="0" value={form.quantity} onChange={set('quantity')} />
            </Field>
            <Field id="f_unit" label="Unit">
              <select id="f_unit" value={form.unit} onChange={set('unit')}>
                {UNITS.map((u) => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </Field>
            <Field id="f_cal" label="Calories (kcal)">
              <input id="f_cal" type="number" step="any" min="0" value={form.calories} onChange={set('calories')} />
            </Field>
            <Field id="f_pro" label="Protein (g, optional)">
              <input id="f_pro" type="number" step="any" min="0" value={form.protein_g} onChange={set('protein_g')} />
            </Field>
            <Field id="f_carb" label="Carbs (g, optional)">
              <input id="f_carb" type="number" step="any" min="0" value={form.carbohydrates_g} onChange={set('carbohydrates_g')} />
            </Field>
            <Field id="f_fat" label="Fat (g, optional)">
              <input id="f_fat" type="number" step="any" min="0" value={form.fat_g} onChange={set('fat_g')} />
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
              {saving ? 'Saving...' : 'Add food'}
            </button>
          </div>
        </form>
      </div>

      <div className="card mt">
        <h3 style={{ margin: 0 }}>Eaten on {date}</h3>
        {!data && !loadError && <p className="empty">Loading...</p>}
        {data && data.entries.length === 0 && <p className="empty">Nothing logged for this day yet.</p>}
        {data && data.entries.length > 0 && (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Food</th>
                  <th>Kcal</th>
                  <th>Protein</th>
                  <th>Carbs</th>
                  <th>Fat</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {data.entries.map((x) => (
                  <tr key={x.id}>
                    <td>
                      {x.food_name}
                      <div className="stat-foot">
                        {x.quantity} {x.unit}
                      </div>
                    </td>
                    <td>{Math.round(x.calories)}</td>
                    <td>{x.protein_g ?? '-'}</td>
                    <td>{x.carbohydrates_g ?? '-'}</td>
                    <td>{x.fat_g ?? '-'}</td>
                    <td>
                      <button className="btn small danger" onClick={() => remove(x.id)}>
                        Delete
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
