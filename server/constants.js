export const BCRYPT_ROUNDS = 10;

export const GENDERS = ['male', 'female'];

export const ACTIVITY_MULTIPLIERS = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  very_active: 1.725,
  extra_active: 1.9,
};
export const ACTIVITY_LEVELS = Object.keys(ACTIVITY_MULTIPLIERS);

export const GOALS = {
  lose_fat: { label: 'Lose fat', calorieAdjustment: -500, proteinPerKg: 2.0 },
  maintain_weight: { label: 'Maintain weight', calorieAdjustment: 0, proteinPerKg: 1.6 },
  build_muscle: { label: 'Build muscle', calorieAdjustment: 300, proteinPerKg: 1.8 },
};

export const LIMITS = {
  passwordMin: 8,
  ageMin: 18,
  ageMax: 100,
  heightMin: 100,
  heightMax: 250,
  weightMin: 30,
  weightMax: 300,
};
