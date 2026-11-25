import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth.js';
import { getProfileForUser } from '../db.js';
import { clearAuthCookie } from '../token.js';

const router = Router();

router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const profile = await getProfileForUser(req.user.id);
    res.json({ user: req.user, profile });
  } catch (err) {
    next(err);
  }
});

router.post('/logout', (req, res) => {
  clearAuthCookie(res);
  res.json({ message: 'You are logged out.' });
});

export default router;
