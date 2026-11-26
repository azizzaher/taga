import test from 'node:test';
import assert from 'node:assert/strict';
import { validateFoodEntry } from './foodValidator.js';

test('validates and normalizes a manually entered food log', () => {
  const result = validateFoodEntry({
    food_name: '  Greek yogurt ',
    meal_type: 'Breakfast',
    serving: ' 170 g ',
    food_date: '2026-11-25',
    calories: '142.567',
    protein_g: '18',
    carbohydrates_g: '9.5',
    fat_g: 3.8,
  });

  assert.deepEqual(result.errors, []);
  assert.deepEqual(result.value, {
    food_name: 'Greek yogurt',
    meal_type: 'breakfast',
    serving: '170 g',
    food_date: '2026-11-25',
    calories: 142.57,
    protein_g: 18,
    carbohydrates_g: 9.5,
    fat_g: 3.8,
  });
});

test('rejects invalid dates, meal types, and negative nutrition values', () => {
  const result = validateFoodEntry({
    food_name: 'Oats',
    meal_type: 'midnight',
    food_date: '2026-02-30',
    calories: -1,
    protein_g: 4,
    carbohydrates_g: 20,
    fat_g: 3,
  });

  assert.deepEqual(
    result.errors.map((error) => error.field),
    ['meal_type', 'calories', 'food_date']
  );
});

test('rejects a non-text serving description', () => {
  const result = validateFoodEntry({
    food_name: 'Oats',
    meal_type: 'breakfast',
    serving: { amount: 1 },
    calories: 150,
    protein_g: 5,
    carbohydrates_g: 27,
    fat_g: 3,
  });

  assert.deepEqual(result.errors.map((error) => error.field), ['serving']);
});
