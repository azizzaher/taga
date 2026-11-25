import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth.js';
import { pool, getProfileForUser } from '../db.js';
import { validateActivity } from '../activityValidator.js';
import { caloriesBurned } from '../calories.js';

const router = Router();
router.use(requireAuth);

const ENTRY_FIELDS = `
  id, exercise_type AS type, duration_minutes,
  distance_km::float8 AS distance_km,
  calories_burned::float8 AS calories_burned,
  TO_CHAR(exercise_date, 'YYYY-MM-DD') AS exercise_date`;

// Log a walk or a run
router.post('/', async (req, res, next) => {
  try {
    const { errors, value } = validateActivity(req.body);
    if (errors.length) {
      return res.status(400).json({ error: 'Please fix the problems below.', details: errors });
    }

    const profile = await getProfileForUser(req.user.id);
    if (!profile) return res.status(404).json({ error: 'No profile found for this account.' });
    if (profile.weight_kg == null) {
      return res.status(422).json({ error: 'Add your weight on the Profile page first, so calories can be estimated.' });
    }

    const calories = caloriesBurned(value.type, profile.weight_kg, value.duration_minutes, value.distance_km);
    const name = value.type === 'walking' ? 'Walking' : 'Running';

    const { rows } = await pool.query(
      `INSERT INTO public.exercise_logs
         (user_id, exercise_name, exercise_type, duration_minutes, distance_km, calories_burned, exercise_date)
       VALUES ($1, $2, $3, $4, $5, $6, COALESCE($7::date, CURRENT_DATE))
       RETURNING ${ENTRY_FIELDS}`,
      [profile.id, name, value.type, value.duration_minutes, value.distance_km, calories, value.exercise_date]
    );
    res.status(201).json({ entry: rows[0] });
  } catch (err) {
    next(err);
  }
});

// Recent walks and runs, plus totals for the last 7 days
router.get('/', async (req, res, next) => {
  try {
    const days = Number(req.query.days ?? 30);
    if (!Number.isInteger(days) || days < 1 || days > 365) {
      return res.status(400).json({ error: 'days must be a whole number from 1 to 365.' });
    }

    const profile = await getProfileForUser(req.user.id);
    if (!profile) return res.status(404).json({ error: 'No profile found for this account.' });

    const list = await pool.query(
      `SELECT ${ENTRY_FIELDS}
       FROM public.exercise_logs
       WHERE user_id = $1 AND exercise_type IN ('walking', 'running')
         AND exercise_date >= CURRENT_DATE - $2::int
       ORDER BY exercise_date DESC, created_at DESC
       LIMIT 200`,
      [profile.id, days]
    );
    const week = await pool.query(
      `SELECT COUNT(*)::int AS sessions,
              COALESCE(SUM(distance_km), 0)::float8 AS distance_km,
              COALESCE(SUM(duration_minutes), 0)::int AS minutes,
              COALESCE(SUM(calories_burned), 0)::float8 AS calories_burned
       FROM public.exercise_logs
       WHERE user_id = $1 AND exercise_type IN ('walking', 'running')
         AND exercise_date >= CURRENT_DATE - 6`,
      [profile.id]
    );

    res.json({ entries: list.rows, week: week.rows[0] });
  } catch (err) {
    next(err);
  }
});

export default router;
