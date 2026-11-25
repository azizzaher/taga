import { useEffect, useState } from 'react';
import { api } from '../api';

const todayLocal = () => new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD

function Macro({ label, grams, share, bar }) {
  return (
    <div className="macro-row">
      <div className="macro-label">{label}</div>
      <div className="macro-track">
        <span className={bar} style={{ width: share + '%' }} />
      </div>
      <div className="macro-amount">{grams} g</div>
    </div>
  );
}

export default function PlanPicker() {
  const [plans, setPlans] = useState(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    api('/plans')
      .then((data) => setPlans(data.plans))
      .catch((e) => setError(e.message));
  }, []);

  async function applyPlan(goal) {
    setError('');
    setMessage('');
    try {
      const data = await api(`/plans/${goal}/apply`, {
        method: 'POST',
        body: { goal_date: todayLocal() },
      });
      setMessage(data.message);
    } catch (e) {
      setError(e.message);
    }
  }

  if (error && !plans) return <div className="notice error" role="alert">{error}</div>;
  if (!plans) return <p className="empty">Loading plans...</p>;

  const share = (grams, perGram, calories) => Math.round((grams * perGram * 100) / calories);
  const firstPlan = Object.values(plans)[0];

  return (
    <div>
      {message && <div className="notice">{message}</div>}
      {error && <div className="notice error" role="alert">{error}</div>}
      <div className="grid plans">
        {Object.entries(plans).map(([goal, plan]) => (
          <div className="card plan" key={goal}>
            <h3>{plan.label}</h3>
            <div className="plan-kcal">
              {plan.calories} <span>kcal / day</span>
            </div>
            <Macro label="Protein" grams={plan.protein_g} share={share(plan.protein_g, 4, plan.calories)} bar="bluebar" />
            <Macro label="Carbs" grams={plan.carbohydrates_g} share={share(plan.carbohydrates_g, 4, plan.calories)} bar="greenbar" />
            <Macro label="Fat" grams={plan.fat_g} share={share(plan.fat_g, 9, plan.calories)} bar="purplebar" />
            <div className="actions">
              <button className="btn primary" onClick={() => applyPlan(goal)}>
                Use this plan
              </button>
            </div>
          </div>
        ))}
      </div>
      <p className="footer-note">{firstPlan.note}</p>
    </div>
  );
}
