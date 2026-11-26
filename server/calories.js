// Rough calorie estimate: MET x body weight (kg) x hours.
// MET values are approximate averages for walking and running at a given speed.

const WALK_TABLE = [
  [3.2, 2.8],
  [4.0, 3.0],
  [4.8, 3.5],
  [5.6, 4.3],
  [6.4, 5.0],
  [7.2, 7.0],
]; // [speed km/h, MET]

function interpolate(table, x) {
  if (x <= table[0][0]) return table[0][1];
  for (let i = 1; i < table.length; i++) {
    const [x1, y1] = table[i];
    const [x0, y0] = table[i - 1];
    if (x <= x1) return y0 + ((y1 - y0) * (x - x0)) / (x1 - x0);
  }
  return table[table.length - 1][1];
}

export function speedKmh(distanceKm, minutes) {
  return distanceKm / (minutes / 60);
}

export function metFor(type, speed) {
  if (type === 'walking') return speed == null ? 3.5 : interpolate(WALK_TABLE, speed);
  // Running: roughly the speed in km/h, kept in a sensible range.
  return speed == null ? 9.0 : Math.min(18, Math.max(6, speed));
}

export function caloriesBurned(type, weightKg, minutes, distanceKm) {
  const speed = distanceKm ? speedKmh(distanceKm, minutes) : null;
  return Math.round(metFor(type, speed) * weightKg * (minutes / 60));
}
