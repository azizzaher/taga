import { pool } from '../db.js';
import { COOKIE_NAME, verifyToken } from '../token.js';

export async function requireAuth(req, res, next) {
  try {
    const token = req.cookies?.[COOKIE_NAME];
    if (!token) return res.status(401).json({ error: 'You are not logged in. Please log in first.' });

    let payload;
    try {
      payload = verifyToken(token);
    } catch {
      return res.status(401).json({ error: 'Your session has expired or is invalid. Please log in again.' });
    }

    const { rows } = await pool.query(
      'SELECT id, email, role FROM public.users WHERE id = $1',
      [payload.sub]
    );
    if (!rows[0]) return res.status(401).json({ error: 'This account no longer exists.' });

    req.user = rows[0];
    next();
  } catch (err) {
    next(err);
  }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'You do not have permission to do this.' });
    }
    next();
  };
}
