import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth.js';
import { withTransaction, getProfileForUser } from '../db.js';
import { GOALS, GENDERS, ACTIVITY_MULTIPLIERS } from '../constants.js';
import { buildPlan } from '../planCalculator.js';
import { validateApply } from '../validators.js';

const router = Router();
router.use(requireAuth);

function readGoal(req, res) {
  const goal = req.params.goal;
  if (!Object.hasOwn(GOALS, goal)) {
    res.status(400).json({
      error: `Unknown plan "${String(goal).slice(0, 40)}". Choose one of: ${Object.keys(GOALS).join(', ')}.`,
    });
    return null;
  }
  return goal;
}

async function loadProfile(userId, res) {
  const profile = await getProfileForUser(userId);
  if (!profile) {
    res.status(404).json({ error: 'No profile found for this account.' });
    return null;
  }
  const missing = ['date_of_birth', 'height_cm', 'weight_kg', 'gender', 'activity_level'].filter(
    (f) => profile[f] == null
  );
  if (missing.length) {
    res.status(422).json({ error: `Your profile is missing: ${missing.join(', ')}. Complete your profile first.`, missing });
    return null;
  }
  if (!GENDERS.includes(String(profile.gender).toLowerCase()) || !ACTIVITY_MULTIPLIERS[profile.activity_level]) {
    res.status(422).json({ error: 'Your profile has an unrecognised gender or activity level. Update your profile first.' });
    return null;
  }
  return profile;
}

// All three plans (for the dashboard)
router.get('/', async (req, res, next) => {
  try {
    const profile = await loadProfile(req.user.id, res);
    if (!profile) return;
    const plans = {};
    for (const goal of Object.keys(GOALS)) plans[goal] = buildPlan(profile, goal);
    res.json({ plans });
  } catch (err) {
    next(err);
  }
});

// One plan
router.get('/:goal', async (req, res, next) => {
  try {
    const goal = readGoal(req, res);
    if (!goal) return;
    const profile = await loadProfile(req.user.id, res);
    if (!profile) return;
    res.json({ plan: buildPlan(profile, goal) });
  } catch (err) {
    next(err);
  }
});

// Save a plan as your daily targets and your fitness goal
router.post('/:goal/apply', async (req, res, next) => {
  try {
    const goal = readGoal(req, res);
    if (!goal) return;
    const { errors, goalDate } = validateApply(req.body);
    if (errors.length) return res.status(400).json({ error: 'Please fix the problems below.', details: errors });

    const profile = await loadProfile(req.user.id, res);
    if (!profile) return;
    const plan = buildPlan(profile, goal);

    const saved = await withTransaction(async (client) => {
      const result = await client.query(
        `INSERT INTO public.daily_goals
           (user_id, goal_date, calorie_target, protein_target_g, carbohydrates_target_g, fat_target_g)
         VALUES ($1, COALESCE($2::date, CURRENT_DATE), $3, $4, $5, $6)
         ON CONFLICT (user_id, goal_date) DO UPDATE SET
           calorie_target = EXCLUDED.calorie_target,
           protein_target_g = EXCLUDED.protein_target_g,
           carbohydrates_target_g = EXCLUDED.carbohydrates_target_g,
           fat_target_g = EXCLUDED.fat_target_g
         RETURNING TO_CHAR(goal_date, 'YYYY-MM-DD') AS goal_date`,
        [profile.id, goalDate, plan.calories, plan.protein_g, plan.carbohydrates_g, plan.fat_g]
      );
      await client.query('UPDATE public.profiles SET fitness_goal = $1 WHERE id = $2', [goal, profile.id]);
      return result.rows[0];
    });

    res.json({ message: `${plan.label} plan saved for ${saved.goal_date}.`, goal_date: saved.goal_date, plan });
  } catch (err) {
    next(err);
  }
});

export default router;
