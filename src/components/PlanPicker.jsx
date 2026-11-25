import { useEffect, useState } from 'react';
import { api } from '../api';

const todayLocal = () => new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD

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

  if (error && !plans) return <p role="alert">{error}</p>;
  if (!plans) return <p>Loading plans…</p>;

  return (
    <div>
      {Object.entries(plans).map(([goal, plan]) => (
        <div key={goal}>
          <h3>{plan.label}</h3>
          <p>
            {plan.calories} kcal · {plan.protein_g} g protein · {plan.carbohydrates_g} g carbs ·{' '}
            {plan.fat_g} g fat
          </p>
          <button onClick={() => applyPlan(goal)}>Use this plan</button>
        </div>
      ))}
      {message && <p>{message}</p>}
      {error && <p role="alert">{error}</p>}
    </div>
  );
}
