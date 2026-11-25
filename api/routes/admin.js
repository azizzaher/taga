import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/requireAuth.js';
import { pool } from '../db.js';

const router = Router();

router.get('/user-count', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const { rows } = await pool.query('SELECT COUNT(*)::int AS users FROM public.users');
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

export default router;
