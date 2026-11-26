import { parseDate } from './validators.js';

export const FOOD_UNITS = ['g', 'ml', 'serving', 'piece', 'cup', 'tbsp', 'tsp', 'oz'];

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const isUuid = (v) => typeof v === 'string' && UUID_RE.test(v);

function toNumber(value) {
  if (typeof value === 'number') return value;
  if (typeof value === 'string' && value.trim() !== '') return Number(value);
  return NaN;
}

const isBlank = (v) => v === undefined || v === null || v === '';
const round2 = (n) => Math.round(n * 100) / 100;

export function validateFoodEntry(body) {
  const b = body && typeof body === 'object' ? body : {};
  const errors = [];
  const fail = (field, message) => errors.push({ field, message });

  const name = typeof b.food_name === 'string' ? b.food_name.trim() : '';
  if (!name) fail('food_name', 'Food name is required.');
  else if (name.length > 120) fail('food_name', 'Food name must be 120 characters or fewer.');

  let quantity = null;
  const q = toNumber(b.quantity);
  if (!Number.isFinite(q)) fail('quantity', 'Quantity is required and must be a number.');
  else if (q <= 0 || q > 100000) fail('quantity', 'Quantity must be more than 0 and at most 100000.');
  else quantity = round2(q);

  const unit = typeof b.unit === 'string' ? b.unit.trim().toLowerCase() : '';
  if (!FOOD_UNITS.includes(unit)) fail('unit', `Unit must be one of: ${FOOD_UNITS.join(', ')}.`);

  let calories = null;
  const c = toNumber(b.calories);
  if (!Number.isFinite(c)) fail('calories', 'Calories are required and must be a number.');
  else if (c < 0 || c > 10000) fail('calories', 'Calories must be between 0 and 10000.');
  else calories = round2(c);

  const macros = {};
  for (const [field, label] of [['protein_g', 'Protein'], ['carbohydrates_g', 'Carbs'], ['fat_g', 'Fat']]) {
    macros[field] = null;
    if (isBlank(b[field])) continue;
    const n = toNumber(b[field]);
    if (!Number.isFinite(n)) fail(field, `${label} must be a number.`);
    else if (n < 0 || n > 2000) fail(field, `${label} must be between 0 and 2000 g.`);
    else macros[field] = round2(n);
  }

  let date = null;
  if (!isBlank(b.date)) {
    const parsed = parseDate(b.date);
    if (!parsed) {
      fail('date', 'Date must look like YYYY-MM-DD, for example 2026-11-25.');
    } else {
      const days = (parsed.getTime() - Date.now()) / 86400000;
      if (days > 1) fail('date', 'The date cannot be in the future.');
      else if (days < -365) fail('date', 'The date cannot be more than a year ago.');
      else date = b.date;
    }
  }

  return {
    errors,
    value: { food_name: name, quantity, unit, calories, ...macros, date },
  };
}
