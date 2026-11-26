import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth.js';
import { pool, PROFILE_FIELDS } from '../db.js';
import { validateProfileUpdate, EDITABLE_FIELDS } from '../profileValidator.js';

const router = Router();

// Update any of your own profile fields. Send only the ones you want to change.
router.patch('/', requireAuth, async (req, res, next) => {
  try {
    const { errors, changes } = validateProfileUpdate(req.body);
    if (errors.length) {
      return res.status(400).json({ error: 'Please fix the problems below.', details: errors });
    }

    const columns = Object.keys(changes).filter((c) => EDITABLE_FIELDS.includes(c));
    const setClause = columns.map((c, i) => `${c} = $${i + 1}`).join(', ');
    const values = columns.map((c) => changes[c]);

    const { rows } = await pool.query(
      `UPDATE public.profiles SET ${setClause}
       WHERE auth_user_id = $${columns.length + 1}
       RETURNING ${PROFILE_FIELDS}`,
      [...values, req.user.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'No profile found for this account.' });

    res.json({ profile: rows[0] });
  } catch (err) {
    next(err);
  }
});

export default router;
