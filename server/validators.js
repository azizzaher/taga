import { GENDERS, ACTIVITY_LEVELS, GOALS, LIMITS } from './constants.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const asObject = (body) => (body && typeof body === 'object' ? body : {});

function toNumber(value) {
  if (typeof value === 'number') return value;
  if (typeof value === 'string' && value.trim() !== '') return Number(value);
  return NaN;
}

export function parseDate(text) {
  if (typeof text !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(text)) return null;
  const [y, m, d] = text.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  const ok =
    date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
  return ok ? date : null;
}

export function ageFromDob(text, now = new Date()) {
  const dob = parseDate(text);
  let age = now.getUTCFullYear() - dob.getUTCFullYear();
  const hadBirthday =
    now.getUTCMonth() > dob.getUTCMonth() ||
    (now.getUTCMonth() === dob.getUTCMonth() && now.getUTCDate() >= dob.getUTCDate());
  if (!hadBirthday) age -= 1;
  return age;
}

function checkNumber(b, field, label, min, max, unit, fail) {
  const n = toNumber(b[field]);
  if (!Number.isFinite(n)) {
    fail(field, `${label} is required and must be a number.`);
    return null;
  }
  if (n < min || n > max) {
    fail(field, `${label} must be between ${min} and ${max} ${unit}.`);
    return null;
  }
  return Math.round(n * 100) / 100;
}

export function validateRegister(body) {
  const b = asObject(body);
  const errors = [];
  const fail = (field, message) => errors.push({ field, message });

  const email = typeof b.email === 'string' ? b.email.trim().toLowerCase() : '';
  if (!email) fail('email', 'Email is required.');
  else if (email.length > 254 || !EMAIL_RE.test(email))
    fail('email', 'Enter a valid email address, like name@example.com.');

  const password = typeof b.password === 'string' ? b.password : '';
  if (!password) fail('password', 'Password is required.');
  else if (password.length < LIMITS.passwordMin)
    fail('password', `Password must be at least ${LIMITS.passwordMin} characters.`);
  else if (Buffer.byteLength(password) > 72)
    fail('password', 'Password is too long. Use 72 characters or fewer.');

  const fullName = typeof b.full_name === 'string' ? b.full_name.trim() : '';
  if (!fullName) fail('full_name', 'Full name is required.');
  else if (fullName.length > 100) fail('full_name', 'Full name must be 100 characters or fewer.');

  if (!parseDate(b.date_of_birth)) {
    fail('date_of_birth', 'Enter your date of birth as YYYY-MM-DD, for example 1995-06-15.');
  } else {
    const age = ageFromDob(b.date_of_birth);
    if (age < LIMITS.ageMin || age > LIMITS.ageMax)
      fail('date_of_birth', `Age must be between ${LIMITS.ageMin} and ${LIMITS.ageMax}. This date gives ${age}.`);
  }

  const height = checkNumber(b, 'height_cm', 'Height', LIMITS.heightMin, LIMITS.heightMax, 'cm', fail);
  const weight = checkNumber(b, 'weight_kg', 'Weight', LIMITS.weightMin, LIMITS.weightMax, 'kg', fail);

  const gender = typeof b.gender === 'string' ? b.gender.trim().toLowerCase() : '';
  if (!GENDERS.includes(gender)) fail('gender', `Gender must be one of: ${GENDERS.join(', ')}.`);

  const activity = typeof b.activity_level === 'string' ? b.activity_level.trim() : '';
  if (!ACTIVITY_LEVELS.includes(activity))
    fail('activity_level', `Activity level must be one of: ${ACTIVITY_LEVELS.join(', ')}.`);

  let goal = null;
  if (b.fitness_goal !== undefined && b.fitness_goal !== null && b.fitness_goal !== '') {
    if (typeof b.fitness_goal === 'string' && Object.hasOwn(GOALS, b.fitness_goal)) goal = b.fitness_goal;
    else fail('fitness_goal', `Fitness goal must be one of: ${Object.keys(GOALS).join(', ')}.`);
  }

  return {
    errors,
    value: {
      email, password, full_name: fullName, date_of_birth: b.date_of_birth,
      height_cm: height, weight_kg: weight, gender, activity_level: activity, fitness_goal: goal,
    },
  };
}

export function validateLogin(body) {
  const b = asObject(body);
  const errors = [];
  const email = typeof b.email === 'string' ? b.email.trim().toLowerCase() : '';
  const password = typeof b.password === 'string' ? b.password : '';
  if (!email) errors.push({ field: 'email', message: 'Email is required.' });
  if (!password) errors.push({ field: 'password', message: 'Password is required.' });
  else if (password.length > 128) errors.push({ field: 'password', message: 'Password is too long.' });
  return { errors, value: { email, password } };
}

export function validateApply(body) {
  const b = asObject(body);
  const errors = [];
  let goalDate = null;
  if (b.goal_date !== undefined && b.goal_date !== null) {
    if (parseDate(b.goal_date)) goalDate = b.goal_date;
    else errors.push({ field: 'goal_date', message: 'goal_date must look like YYYY-MM-DD, for example 2026-11-17.' });
  }
  return { errors, goalDate };
}
