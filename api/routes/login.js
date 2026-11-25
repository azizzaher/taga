import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { pool, getProfileForUser } from '../db.js';
import { validateLogin } from '../validators.js';
import { signToken, setAuthCookie } from '../token.js';
import { BCRYPT_ROUNDS } from '../constants.js';

const router = Router();

// Compared when the email is unknown, so timing doesn't reveal which emails exist.
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', BCRYPT_ROUNDS);

router.post('/login', async (req, res, next) => {
  try {
    const { errors, value } = validateLogin(req.body);
    if (errors.length) {
      return res.status(400).json({ error: 'Please fix the problems below.', details: errors });
    }

    const { rows } = await pool.query(
      'SELECT id, email, role, password_hash FROM public.users WHERE LOWER(email) = $1',
      [value.email]
    );
    const row = rows[0];

    const passwordOk = await bcrypt.compare(value.password, row ? row.password_hash : DUMMY_HASH);
    if (!row || !passwordOk) {
      return res.status(401).json({ error: 'Incorrect email or password.' });
    }

    const profile = await getProfileForUser(row.id);
    setAuthCookie(res, signToken(row.id));
    res.json({ user: { id: row.id, email: row.email, role: row.role }, profile });
  } catch (err) {
    next(err);
  }
});

export default router;
