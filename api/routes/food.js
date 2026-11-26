import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth.js';
import { pool, getProfileForUser } from '../db.js';
import { parseDate } from '../validators.js';
import { validateFoodEntry, isUuid } from '../foodValidator.js';

const router = Router();
router.use(requireAuth);

const ENTRY_FIELDS = `
  id, food_name,
  quantity::float8 AS quantity, unit,
  calories::float8 AS calories,
  protein_g::float8 AS protein_g,
  carbohydrates_g::float8 AS carbohydrates_g,
  fat_g::float8 AS fat_g,
  TO_CHAR(consumed_at AT TIME ZONE 'UTC', 'YYYY-MM-DD') AS date`;

const sum = (rows, key) => Math.round(rows.reduce((t, r) => t + (r[key] ?? 0), 0) * 10) / 10;

// Add a food entry
router.post('/', async (req, res, next) => {
  try {
    const { errors, value } = validateFoodEntry(req.body);
    if (errors.length) {
      return res.status(400).json({ error: 'Please fix the problems below.', details: errors });
    }
    const profile = await getProfileForUser(req.user.id);
    if (!profile) return res.status(404).json({ error: 'No profile found for this account.' });

    const { rows } = await pool.query(
      `INSERT INTO public.food_entries
         (user_id, food_name, quantity, unit, calories, protein_g, carbohydrates_g, fat_g,
          values_confirmed, consumed_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, TRUE,
               (COALESCE($9::date, CURRENT_DATE) + TIME '12:00') AT TIME ZONE 'UTC')
       RETURNING ${ENTRY_FIELDS}`,
      [profile.id, value.food_name, value.quantity, value.unit, value.calories,
       value.protein_g, value.carbohydrates_g, value.fat_g, value.date]
    );
    res.status(201).json({ entry: rows[0] });
  } catch (err) {
    next(err);
  }
});

// One day's entries, totals, and that day's targets
router.get('/', async (req, res, next) => {
  try {
    const raw = req.query.date;
    if (raw !== undefined && !parseDate(raw)) {
      return res.status(400).json({ error: 'date must look like YYYY-MM-DD, for example 2026-11-25.' });
    }
    const date = raw ?? new Date().toISOString().slice(0, 10);

    const profile = await getProfileForUser(req.user.id);
    if (!profile) return res.status(404).json({ error: 'No profile found for this account.' });

    const list = await pool.query(
      `SELECT ${ENTRY_FIELDS}
       FROM public.food_entries
       WHERE user_id = $1
         AND consumed_at >= ($2::date)::timestamp AT TIME ZONE 'UTC'
         AND consumed_at <  (($2::date + 1)::timestamp AT TIME ZONE 'UTC')
       ORDER BY consumed_at, created_at
       LIMIT 200`,
      [profile.id, date]
    );
    const goals = await pool.query(
      `SELECT calorie_target::float8 AS calories,
              protein_target_g::float8 AS protein_g,
              carbohydrates_target_g::float8 AS carbohydrates_g,
              fat_target_g::float8 AS fat_g
       FROM public.daily_goals
       WHERE user_id = $1 AND goal_date = $2::date`,
      [profile.id, date]
    );

    const entries = list.rows;
    res.json({
      date,
      entries,
      totals: {
        calories: sum(entries, 'calories'),
        protein_g: sum(entries, 'protein_g'),
        carbohydrates_g: sum(entries, 'carbohydrates_g'),
        fat_g: sum(entries, 'fat_g'),
      },
      targets: goals.rows[0] ?? null,
    });
  } catch (err) {
    next(err);
  }
});

// Delete one of your own entries
router.delete('/:id', async (req, res, next) => {
  try {
    if (!isUuid(req.params.id)) {
      return res.status(400).json({ error: 'That is not a valid entry id.' });
    }
    const profile = await getProfileForUser(req.user.id);
    if (!profile) return res.status(404).json({ error: 'No profile found for this account.' });

    const { rows } = await pool.query(
      'DELETE FROM public.food_entries WHERE id = $1 AND user_id = $2 RETURNING id',
      [req.params.id, profile.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Entry not found.' });
    res.json({ message: 'Entry deleted.' });
  } catch (err) {
    next(err);
  }
});

export default router;
