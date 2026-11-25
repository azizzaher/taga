import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { withTransaction, PROFILE_FIELDS } from '../db.js';
import { validateRegister } from '../validators.js';
import { signToken, setAuthCookie } from '../token.js';
import { BCRYPT_ROUNDS } from '../constants.js';

const router = Router();

router.post('/register', async (req, res, next) => {
  try {
    const { errors, value } = validateRegister(req.body);
    if (errors.length) {
      return res.status(400).json({ error: 'Please fix the problems below.', details: errors });
    }

    const passwordHash = await bcrypt.hash(value.password, BCRYPT_ROUNDS);

    const { user, profile } = await withTransaction(async (client) => {
      const userResult = await client.query(
        `INSERT INTO public.users (email, password_hash, role)
         VALUES ($1, $2, 'user')
         RETURNING id, email, role`,
        [value.email, passwordHash]
      );
      const user = userResult.rows[0];

      const profileResult = await client.query(
        `INSERT INTO public.profiles
           (auth_user_id, full_name, date_of_birth, height_cm, weight_kg, gender, activity_level, fitness_goal)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING ${PROFILE_FIELDS}`,
        [user.id, value.full_name, value.date_of_birth, value.height_cm, value.weight_kg,
         value.gender, value.activity_level, value.fitness_goal]
      );
      return { user, profile: profileResult.rows[0] };
    });

    setAuthCookie(res, signToken(user.id));
    res.status(201).json({ user, profile });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'An account with this email already exists. Try logging in instead.' });
    }
    next(err);
  }
});

export default router;
