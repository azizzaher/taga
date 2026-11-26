import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { pool, getProfileForUser } from '../db.js';
import { validateLogin } from '../validators.js';
import { signToken, setAuthCookie } from '../token.js';
import { BCRYPT_ROUNDS } from '../constants.js';

const router = Router();

const MAX_FAILED_LOGINS = 5; // wrong passwords allowed in a row
const LOCK_MINUTES = 15; // how long the account stays locked afterwards

// Compared when the email is unknown, so timing doesn't reveal which emails exist.
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', BCRYPT_ROUNDS);

router.post('/login', async (req, res, next) => {
  try {
    const { errors, value } = validateLogin(req.body);
    if (errors.length) {
      return res.status(400).json({ error: 'Please fix the problems below.', details: errors });
    }

    const { rows } = await pool.query(
      `SELECT id, email, role, password_hash, failed_logins, locked_until
       FROM public.users WHERE LOWER(email) = $1`,
      [value.email]
    );
    const row = rows[0];

    // Locked accounts are refused even if the password is right.
    if (row?.locked_until && new Date(row.locked_until) > new Date()) {
      const minutes = Math.ceil((new Date(row.locked_until) - new Date()) / 60000);
      return res.status(429).json({
        error: `Too many wrong passwords. Try again in ${minutes} minute${minutes === 1 ? '' : 's'}.`,
      });
    }

    const passwordOk = await bcrypt.compare(value.password, row ? row.password_hash : DUMMY_HASH);
    if (!row || !passwordOk) {
      if (row) {
        await pool.query(
          `UPDATE public.users
           SET failed_logins = CASE WHEN failed_logins + 1 >= $2 THEN 0 ELSE failed_logins + 1 END,
               locked_until  = CASE WHEN failed_logins + 1 >= $2
                                    THEN NOW() + make_interval(mins => $3)
                                    ELSE locked_until END
           WHERE id = $1`,
          [row.id, MAX_FAILED_LOGINS, LOCK_MINUTES]
        );
      }
      return res.status(401).json({ error: 'Incorrect email or password.' });
    }

    if (row.failed_logins > 0 || row.locked_until) {
      await pool.query('UPDATE public.users SET failed_logins = 0, locked_until = NULL WHERE id = $1', [row.id]);
    }

    const profile = await getProfileForUser(row.id);
    setAuthCookie(res, signToken(row.id));
    res.json({ user: { id: row.id, email: row.email, role: row.role }, profile });
  } catch (err) {
    next(err);
  }
});

export default router;
