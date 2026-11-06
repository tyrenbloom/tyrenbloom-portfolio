const express = require('express');
const db = require('../db');
const { calculateStreak } = require('../streak');

const router = express.Router();
const COLORS = ['teal', 'blue', 'amber', 'coral', 'violet', 'green'];
const CATEGORIES = ['Study', 'Health', 'Personal'];
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function validDate(value) {
  if (!DATE_PATTERN.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function todayUtc() {
  return new Date().toISOString().slice(0, 10);
}

function addDays(date, amount) {
  const result = new Date(`${date}T00:00:00Z`);
  result.setUTCDate(result.getUTCDate() + amount);
  return result.toISOString().slice(0, 10);
}

function getCheckinDates(habitId) {
  return db.prepare('SELECT date FROM checkins WHERE habit_id = ? ORDER BY date').all(habitId).map((row) => row.date);
}

function habitWithStats(habit) {
  const dates = getCheckinDates(habit.id);
  return {
    ...habit,
    archived: Boolean(habit.archived),
    checkins: dates,
    streak: calculateStreak(dates, habit.weekly_target)
  };
}

function validateHabit(body, partial = false) {
  const errors = [];
  if (!partial || body.name !== undefined) {
    if (typeof body.name !== 'string' || body.name.trim().length < 1 || body.name.trim().length > 100) {
      errors.push('name must be 1 to 100 characters');
    }
  }
  if (body.category !== undefined && body.category !== null && !CATEGORIES.includes(body.category)) {
    errors.push(`category must be one of: ${CATEGORIES.join(', ')}`);
  }
  if (body.weekly_target !== undefined && (!Number.isInteger(body.weekly_target) || body.weekly_target < 1 || body.weekly_target > 7)) {
    errors.push('weekly_target must be an integer from 1 to 7');
  }
  if (body.color !== undefined && !COLORS.includes(body.color)) {
    errors.push(`color must be one of: ${COLORS.join(', ')}`);
  }
  return errors;
}

router.get('/habits', (req, res) => {
  const includeArchived = req.query.archived === 'true';
  const rows = db.prepare(`SELECT * FROM habits ${includeArchived ? '' : 'WHERE archived = 0'} ORDER BY archived, created_at, id`).all();
  res.json(rows.map(habitWithStats));
});

router.post('/habits', (req, res) => {
  const errors = validateHabit(req.body || {});
  if (errors.length) return res.status(400).json({ error: errors.join('; ') });
  const body = req.body;
  const result = db.prepare(
    'INSERT INTO habits (name, category, weekly_target, color) VALUES (?, ?, ?, ?)'
  ).run(body.name.trim(), body.category || null, body.weekly_target || 7, body.color || 'teal');
  return res.status(201).json(habitWithStats(db.prepare('SELECT * FROM habits WHERE id = ?').get(result.lastInsertRowid)));
});

router.patch('/habits/:id', (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: 'invalid habit id' });
  const existing = db.prepare('SELECT * FROM habits WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'habit not found' });
  const errors = validateHabit(req.body || {}, true);
  if (errors.length) return res.status(400).json({ error: errors.join('; ') });
  const fields = [];
  const values = [];
  for (const key of ['name', 'category', 'weekly_target', 'color', 'archived']) {
    if (req.body[key] !== undefined) {
      if (key === 'archived' && typeof req.body[key] !== 'boolean') return res.status(400).json({ error: 'archived must be a boolean' });
      fields.push(`${key} = ?`);
      values.push(key === 'name' ? req.body[key].trim() : key === 'archived' ? (req.body[key] ? 1 : 0) : req.body[key]);
    }
  }
  if (!fields.length) return res.status(400).json({ error: 'no changes provided' });
  db.prepare(`UPDATE habits SET ${fields.join(', ')} WHERE id = ?`).run(...values, id);
  return res.json(habitWithStats(db.prepare('SELECT * FROM habits WHERE id = ?').get(id)));
});

router.delete('/habits/:id', (req, res) => {
  const result = db.prepare('DELETE FROM habits WHERE id = ?').run(Number(req.params.id));
  if (!result.changes) return res.status(404).json({ error: 'habit not found' });
  return res.status(204).end();
});

router.post('/habits/:id/checkins/:date', (req, res) => {
  const habitId = Number(req.params.id);
  const date = req.params.date;
  if (!Number.isInteger(habitId) || !validDate(date)) return res.status(400).json({ error: 'valid habit id and date are required' });
  if (date > todayUtc() || date < addDays(todayUtc(), -30)) return res.status(400).json({ error: 'check-ins can only be recorded today or up to 30 days back' });
  if (!db.prepare('SELECT id FROM habits WHERE id = ?').get(habitId)) return res.status(404).json({ error: 'habit not found' });
  db.prepare('INSERT OR IGNORE INTO checkins (habit_id, date) VALUES (?, ?)').run(habitId, date);
  return res.status(201).json({ checked: true, date });
});

router.delete('/habits/:id/checkins/:date', (req, res) => {
  const result = db.prepare('DELETE FROM checkins WHERE habit_id = ? AND date = ?').run(Number(req.params.id), req.params.date);
  if (!result.changes) return res.status(404).json({ error: 'check-in not found' });
  return res.status(204).end();
});

router.get('/stats/weekly', (req, res) => {
  const end = todayUtc();
  const endDate = new Date(`${end}T00:00:00Z`);
  const monday = addDays(end, -(endDate.getUTCDay() === 0 ? 6 : endDate.getUTCDay() - 1));
  const previousMonday = addDays(monday, -7);
  const previousSunday = addDays(monday, -1);
  const active = db.prepare('SELECT * FROM habits WHERE archived = 0').all();
  const count = (from, to) => db.prepare('SELECT COUNT(*) AS count FROM checkins c JOIN habits h ON h.id = c.habit_id WHERE h.archived = 0 AND c.date BETWEEN ? AND ?').get(from, to).count;
  const thisCount = count(monday, end);
  const lastCount = count(previousMonday, previousSunday);
  const possible = active.length * 7;
  const dayRows = db.prepare("SELECT strftime('%w', c.date) AS day, COUNT(*) AS count FROM checkins c JOIN habits h ON h.id = c.habit_id WHERE h.archived = 0 AND c.date BETWEEN ? AND ? GROUP BY day ORDER BY count DESC").all(monday, end);
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const topHabit = db.prepare('SELECT h.name, COUNT(*) AS count FROM checkins c JOIN habits h ON h.id = c.habit_id WHERE h.archived = 0 AND c.date BETWEEN ? AND ? GROUP BY h.id ORDER BY count DESC, h.name LIMIT 1').get(monday, end);
  return res.json({
    week: { start: monday, end },
    thisWeek: { completed: thisCount, rate: possible ? Math.round((thisCount / possible) * 100) : 0 },
    lastWeek: { completed: lastCount, rate: possible ? Math.round((lastCount / possible) * 100) : 0 },
    bestDay: dayRows[0] ? { name: dayNames[Number(dayRows[0].day)], count: dayRows[0].count } : null,
    topHabit: topHabit || null
  });
});

router.get('/stats/heatmap', (req, res) => {
  const habitId = req.query.habit_id ? Number(req.query.habit_id) : null;
  if (req.query.habit_id && !Number.isInteger(habitId)) return res.status(400).json({ error: 'invalid habit_id' });
  const from = addDays(todayUtc(), -364);
  const rows = db.prepare(`SELECT c.date, COUNT(*) AS count FROM checkins c JOIN habits h ON h.id = c.habit_id WHERE h.archived = 0 AND c.date BETWEEN ? AND ? ${habitId ? 'AND c.habit_id = ?' : ''} GROUP BY c.date ORDER BY c.date`).all(...(habitId ? [from, todayUtc(), habitId] : [from, todayUtc()]));
  return res.json({ from, to: todayUtc(), days: rows });
});

router.get('/export.csv', (req, res) => {
  const rows = db.prepare('SELECT c.date, h.name, h.category, h.color FROM checkins c JOIN habits h ON h.id = c.habit_id ORDER BY c.date DESC, h.name').all();
  const escape = (value) => `"${String(value ?? '').replaceAll('"', '""')}"`;
  const csv = ['date,habit,category,color', ...rows.map((row) => [row.date, row.name, row.category, row.color].map(escape).join(','))].join('\n');
  res.set('Content-Type', 'text/csv; charset=utf-8');
  res.set('Content-Disposition', 'attachment; filename="habit-checkins.csv"');
  return res.send(csv);
});

module.exports = router;
