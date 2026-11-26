import { parseDate } from './validators.js';

export const ACTIVITY_TYPES = ['walking', 'running'];
const MAX_SPEED = { walking: 9, running: 25 }; // km/h
const MIN_RUNNING_SPEED = 4; // km/h

function toNumber(value) {
  if (typeof value === 'number') return value;
  if (typeof value === 'string' && value.trim() !== '') return Number(value);
  return NaN;
}

const isBlank = (v) => v === undefined || v === null || v === '';

export function validateActivity(body) {
  const b = body && typeof body === 'object' ? body : {};
  const errors = [];
  const fail = (field, message) => errors.push({ field, message });

  const type = typeof b.type === 'string' ? b.type.trim().toLowerCase() : '';
  if (!ACTIVITY_TYPES.includes(type)) fail('type', 'Type must be walking or running.');

  const minutes = toNumber(b.duration_minutes);
  if (!Number.isInteger(minutes)) fail('duration_minutes', 'Duration must be a whole number of minutes.');
  else if (minutes < 1 || minutes > 600) fail('duration_minutes', 'Duration must be between 1 and 600 minutes.');

  let distance = null;
  if (!isBlank(b.distance_km)) {
    const d = toNumber(b.distance_km);
    if (!Number.isFinite(d)) fail('distance_km', 'Distance must be a number.');
    else if (d < 0.1 || d > 200) fail('distance_km', 'Distance must be between 0.1 and 200 km.');
    else distance = Math.round(d * 100) / 100;
  }

  let date = null;
  if (!isBlank(b.exercise_date)) {
    const parsed = parseDate(b.exercise_date);
    if (!parsed) {
      fail('exercise_date', 'Date must look like YYYY-MM-DD, for example 2026-11-25.');
    } else {
      const days = (parsed.getTime() - Date.now()) / 86400000;
      if (days > 1) fail('exercise_date', 'The date cannot be in the future.');
      else if (days < -365) fail('exercise_date', 'The date cannot be more than a year ago.');
      else date = b.exercise_date;
    }
  }

  if (!errors.length && distance) {
    const speed = distance / (minutes / 60);
    if (speed > MAX_SPEED[type]) {
      fail('distance_km', `${distance} km in ${minutes} minutes is ${speed.toFixed(1)} km/h, which is too fast for ${type}. Check the distance and time.`);
    } else if (type === 'running' && speed < MIN_RUNNING_SPEED) {
      fail('distance_km', `That pace is ${speed.toFixed(1)} km/h, which is walking speed. Log it as walking.`);
    }
  }

  return { errors, value: { type, duration_minutes: minutes, distance_km: distance, exercise_date: date } };
}
