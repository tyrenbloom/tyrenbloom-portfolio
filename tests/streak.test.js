const test = require('node:test');
const assert = require('node:assert/strict');
const { calculateStreak } = require('../server/streak');

test('daily habit counts current and longest streaks around a gap', () => {
  const result = calculateStreak(['2026-01-01', '2026-01-02', '2026-01-04'], 7, '2026-01-04');
  assert.deepEqual(result, { current: 1, longest: 2 });
});

test('weekly target counts successful weeks and ignores rest days', () => {
  const result = calculateStreak([
    '2026-01-05', '2026-01-07', '2026-01-10',
    '2026-01-12', '2026-01-13', '2026-01-16'
  ], 3, '2026-01-16');
  assert.deepEqual(result, { current: 2, longest: 2 });
});

test('daily streak crosses month and year boundaries', () => {
  const result = calculateStreak(['2025-12-30', '2025-12-31', '2026-01-01'], 7, '2026-01-01');
  assert.deepEqual(result, { current: 3, longest: 3 });
});

test('habit with no check-ins has zero streaks', () => {
  assert.deepEqual(calculateStreak([], 3, '2026-01-01'), { current: 0, longest: 0 });
});
