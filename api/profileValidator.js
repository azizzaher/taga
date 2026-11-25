import { GENDERS, ACTIVITY_LEVELS, GOALS, LIMITS } from './constants.js';
import { parseDate, ageFromDob } from './validators.js';

function toNumber(value) {
  if (typeof value === 'number') return value;
  if (typeof value === 'string' && value.trim() !== '') return Number(value);
  return NaN;
}

// Only these fields can ever be changed through the profile route.
export const EDITABLE_FIELDS = [
  'full_name', 'date_of_birth', 'height_cm', 'weight_kg', 'gender', 'activity_level', 'fitness_goal',
];

export function validateProfileUpdate(body) {
  const b = body && typeof body === 'object' ? body : {};
  const errors = [];
  const changes = {};
  const fail = (field, message) => errors.push({ field, message });
  const has = (key) => Object.hasOwn(b, key);

  if (has('full_name')) {
    const v = typeof b.full_name === 'string' ? b.full_name.trim() : '';
    if (!v) fail('full_name', 'Full name cannot be empty.');
    else if (v.length > 100) fail('full_name', 'Full name must be 100 characters or fewer.');
    else changes.full_name = v;
  }

  if (has('date_of_birth')) {
    if (!parseDate(b.date_of_birth)) {
      fail('date_of_birth', 'Enter your date of birth as YYYY-MM-DD, for example 1995-06-15.');
    } else {
      const age = ageFromDob(b.date_of_birth);
      if (age < LIMITS.ageMin || age > LIMITS.ageMax)
        fail('date_of_birth', `Age must be between ${LIMITS.ageMin} and ${LIMITS.ageMax}. This date gives ${age}.`);
      else changes.date_of_birth = b.date_of_birth;
    }
  }

  const numeric = [
    ['height_cm', 'Height', LIMITS.heightMin, LIMITS.heightMax, 'cm'],
    ['weight_kg', 'Weight', LIMITS.weightMin, LIMITS.weightMax, 'kg'],
  ];
  for (const [field, label, min, max, unit] of numeric) {
    if (!has(field)) continue;
    const n = toNumber(b[field]);
    if (!Number.isFinite(n)) fail(field, `${label} must be a number.`);
    else if (n < min || n > max) fail(field, `${label} must be between ${min} and ${max} ${unit}.`);
    else changes[field] = Math.round(n * 100) / 100;
  }

  if (has('gender')) {
    const v = typeof b.gender === 'string' ? b.gender.trim().toLowerCase() : '';
    if (!GENDERS.includes(v)) fail('gender', `Gender must be one of: ${GENDERS.join(', ')}.`);
    else changes.gender = v;
  }

  if (has('activity_level')) {
    const v = typeof b.activity_level === 'string' ? b.activity_level.trim() : '';
    if (!ACTIVITY_LEVELS.includes(v))
      fail('activity_level', `Activity level must be one of: ${ACTIVITY_LEVELS.join(', ')}.`);
    else changes.activity_level = v;
  }

  if (has('fitness_goal')) {
    const v = b.fitness_goal;
    if (v === null || v === '') changes.fitness_goal = null;
    else if (typeof v === 'string' && Object.hasOwn(GOALS, v)) changes.fitness_goal = v;
    else fail('fitness_goal', `Fitness goal must be one of: ${Object.keys(GOALS).join(', ')}, or empty.`);
  }

  if (!errors.length && Object.keys(changes).length === 0) {
    fail('body', `Send at least one field to update: ${EDITABLE_FIELDS.join(', ')}.`);
  }

  return { errors, changes };
}
