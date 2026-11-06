function parseDate(date) {
  const [year, month, day] = date.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function formatDate(date) {
  return date.toISOString().slice(0, 10);
}

function startOfWeek(date) {
  const result = new Date(date);
  const day = result.getUTCDay();
  result.setUTCDate(result.getUTCDate() - (day === 0 ? 6 : day - 1));
  return result;
}

function weekKey(date) {
  return formatDate(startOfWeek(date));
}

function calculateStreak(checkinDates, weeklyTarget = 7, today = formatDate(new Date())) {
  const dates = [...new Set(checkinDates)].sort();
  if (dates.length === 0) return { current: 0, longest: 0 };

  if (weeklyTarget === 7) {
    const set = new Set(dates);
    let longest = 0;
    let run = 0;
    let previous;
    for (const value of dates) {
      const current = parseDate(value);
      if (previous && (current - previous) / 86400000 === 1) run += 1;
      else run = 1;
      longest = Math.max(longest, run);
      previous = current;
    }

    let current = 0;
    let cursor = parseDate(today);
    while (set.has(formatDate(cursor))) {
      current += 1;
      cursor.setUTCDate(cursor.getUTCDate() - 1);
    }
    return { current, longest };
  }

  const weeks = new Map();
  for (const value of dates) {
    const key = weekKey(parseDate(value));
    weeks.set(key, (weeks.get(key) || 0) + 1);
  }
  const successfulWeeks = [...weeks.entries()]
    .filter(([, count]) => count >= weeklyTarget)
    .map(([key]) => key)
    .sort();
  let longest = 0;
  let run = 0;
  let previousWeek;
  for (const key of successfulWeeks) {
    const currentWeek = parseDate(key);
    if (previousWeek && (currentWeek - previousWeek) / (86400000 * 7) === 1) run += 1;
    else run = 1;
    longest = Math.max(longest, run);
    previousWeek = currentWeek;
  }

  const currentWeek = weekKey(parseDate(today));
  let current = 0;
  let cursor = parseDate(currentWeek);
  while (weeks.get(formatDate(cursor)) >= weeklyTarget) {
    current += 1;
    cursor.setUTCDate(cursor.getUTCDate() - 7);
  }
  return { current, longest };
}

module.exports = { calculateStreak };
