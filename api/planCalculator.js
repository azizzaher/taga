import { ACTIVITY_MULTIPLIERS, GOALS } from './constants.js';
import { ageFromDob } from './validators.js';

const CALORIE_FLOOR = { male: 1500, female: 1200 };

export function buildPlan(profile, goalKey) {
  const goal = GOALS[goalKey];
  const gender = String(profile.gender).toLowerCase();
  const age = ageFromDob(profile.date_of_birth);

  // Mifflin-St Jeor estimate of resting calories, then scaled by activity.
  const bmr =
    10 * profile.weight_kg + 6.25 * profile.height_cm - 5 * age + (gender === 'male' ? 5 : -161);
  const maintenance = bmr * ACTIVITY_MULTIPLIERS[profile.activity_level];

  const floor = CALORIE_FLOOR[gender];
  const target = maintenance + goal.calorieAdjustment;
  const calories = Math.round(Math.max(target, floor));

  const protein_g = Math.round(Math.min(profile.weight_kg * goal.proteinPerKg, (calories * 0.35) / 4));
  const fat_g = Math.round((calories * 0.25) / 9);
  const carbohydrates_g = Math.round((calories - protein_g * 4 - fat_g * 9) / 4);

  return {
    goal: goalKey,
    label: goal.label,
    calories,
    protein_g,
    carbohydrates_g,
    fat_g,
    details: {
      age,
      bmr: Math.round(bmr),
      maintenance_calories: Math.round(maintenance),
      calorie_adjustment: goal.calorieAdjustment,
      floor_applied: target < floor,
    },
    note: 'These are general estimates, not medical advice. Check with a doctor or dietitian before big diet changes.',
  };
}
