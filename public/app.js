const state = { habits: [], selectedColor: 'teal' };
const $ = (selector) => document.querySelector(selector);

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

const today = () => new Date().toISOString().slice(0, 10);
const shiftDate = (date, amount) => {
  const result = new Date(`${date}T00:00:00Z`);
  result.setUTCDate(result.getUTCDate() + amount);
  return result.toISOString().slice(0, 10);
};
const showError = (error) => { $('#notice').textContent = error.message; window.setTimeout(() => { $('#notice').textContent = ''; }, 4500); };
const prettyDate = (date) => new Date(`${date}T00:00:00Z`).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

async function load() {
  try {
    state.habits = Store.getHabits().map(h => ({
      ...h,
      archived: Boolean(h.archived),
      checkins: h.checkins || [],
      streak: calculateStreak(h.checkins, h.weekly_target)
    }));

    renderHabits();
    renderHistory();
    renderHeatmap();
    renderStats();
  } catch (error) { showError(error); }
}

function renderHabits() {
  const list = $('#habit-list'); list.innerHTML = '';
  let done = 0;
  state.habits.forEach((habit) => {
    const checked = habit.checkins.includes(today()); if (checked) done += 1;
    const row = document.createElement('article');
    row.className = 'habit-row';
    row.innerHTML = `<span class="habit-color ${habit.color}"></span><div><div class="habit-name">${escapeHtml(habit.name)}</div><div class="habit-meta">${habit.category || 'Personal'} · ${habit.weekly_target === 7 ? 'Every day' : `${habit.weekly_target} days / week`}</div><div class="row-actions"><button data-edit="${habit.id}" type="button">Edit</button><button data-archive="${habit.id}" type="button">Archive</button><button data-delete="${habit.id}" type="button">Delete</button></div></div><div class="habit-streak"><strong>${habit.streak.current} day${habit.streak.current === 1 ? '' : 's'}</strong>current streak</div><button class="check-toggle ${checked ? 'checked' : ''}" data-toggle="${habit.id}" aria-label="${checked ? 'Uncheck' : 'Check'} ${escapeHtml(habit.name)} for today" type="button"></button>`;
    list.appendChild(row);
  });
  $('#today-count').textContent = `${done} / ${state.habits.length} complete`;

  const filter = $('#heatmap-filter'); const current = filter.value;
  filter.innerHTML = `<option value="">All habits</option>${state.habits.map((habit) => `<option value="${habit.id}">${escapeHtml(habit.name)}</option>`).join('')}`;
  filter.value = state.habits.some((habit) => String(habit.id) === current) ? current : '';

  $('#empty-state').hidden = state.habits.length > 0;
  $('#list-add').hidden = state.habits.length === 0;
  list.hidden = state.habits.length === 0;

  list.querySelectorAll('[data-toggle]').forEach((button) => button.addEventListener('click', () => toggle(Number(button.dataset.toggle), today())));
  list.querySelectorAll('[data-edit]').forEach((button) => button.addEventListener('click', () => openDialog(state.habits.find((habit) => habit.id === Number(button.dataset.edit)))));
  list.querySelectorAll('[data-archive]').forEach((button) => button.addEventListener('click', () => archive(Number(button.dataset.archive))));
  list.querySelectorAll('[data-delete]').forEach((button) => button.addEventListener('click', () => removeHabit(Number(button.dataset.delete))));
}

function renderHistory() {
  const history = $('#history'); history.innerHTML = '';
  for (let offset = 14; offset >= 0; offset -= 1) {
    const date = shiftDate(today(), -offset); const count = state.habits.filter((habit) => habit.checkins.includes(date)).length;
    const day = document.createElement('button');
    day.type = 'button';
    day.className = `history-day ${date === today() ? 'active' : ''}`;
    day.innerHTML = `<small>${new Date(`${date}T00:00:00Z`).toLocaleDateString(undefined, { weekday: 'short' })}</small><b>${new Date(`${date}T00:00:00Z`).getUTCDate()}</b><small>${count}/${state.habits.length}</small>`;
    day.title = `Toggle all habits for ${prettyDate(date)}`;
    day.addEventListener('click', () => toggleAll(date));
    history.appendChild(day);
  }
}

async function toggle(habitId, date) {
  const habitIndex = state.habits.findIndex(h => h.id === habitId);
  const habit = state.habits[habitIndex];
  if (!habit) return;

  try {
    const todayStr = today();
    const limitDate = shiftDate(todayStr, -30);
    if (date > todayStr || date < limitDate) {
      throw new Error('Check-ins can only be recorded today or up to 30 days back');
    }

    if (habit.checkins.includes(date)) {
      Store.removeCheckin(habit.id, date);
      habit.checkins = habit.checkins.filter(d => d !== date);
    } else {
      Store.addCheckin(habit.id, date);
      habit.checkins.push(date);
      habit.checkins.sort();
      habit.streak = calculateStreak(habit.checkins, habit.weekly_target);
    }

    Store.saveHabits(state.habits);
    renderHabits();
    renderHistory();
    renderHeatmap();
    renderStats();
  } catch (error) { showError(error); }
}

async function toggleAll(date) {
  try {
    const incomplete = state.habits.filter(h => !h.checkins.includes(date));
    const todayStr = today();
    const limitDate = shiftDate(todayStr, -30);
    if (date > todayStr || date < limitDate) {
      throw new Error('Cannot toggle dates outside the 30-day range');
    }

    for (const habit of incomplete) {
      Store.addCheckin(habit.id, date);
      habit.checkins.push(date);
    }

    Store.saveHabits(state.habits);
    state.habits.forEach((habit) => {
      habit.streak = calculateStreak(habit.checkins, habit.weekly_target);
    });
    renderHabits();
    renderHistory();
    renderHeatmap();
    renderStats();
  } catch (error) { showError(error); }
}

async function archive(id) {
  try {
    const habitIndex = state.habits.findIndex(h => h.id === id);
    if (habitIndex === -1) return;

    state.habits[habitIndex].archived = true;
    Store.saveHabits(state.habits);
    await load();
  } catch (error) { showError(error); }
}

async function removeHabit(id) {
  if (!window.confirm('Delete this habit and its check-ins?')) return;

  try {
    state.habits = state.habits.filter(h => h.id !== id);
    Store.saveHabits(state.habits);
    await load();
  } catch (error) { showError(error); }
}

function renderHeatmap() {
  const map = $('#heatmap'); map.innerHTML = ''; const selected = Number($('#heatmap-filter').value); const habits = selected ? state.habits.filter((habit) => habit.id === selected) : state.habits;
  const counts = new Map();
  habits.forEach((habit) => habit.checkins.forEach((date) => counts.set(date, (counts.get(date) || 0) + 1)));
  const end = today(); const start = shiftDate(end, -364); const first = new Date(`${start}T00:00:00Z`);
  first.setUTCDate(first.getUTCDate() - (first.getUTCDay() || 7) + 1);
  for (let index = 0; index < 371; index += 1) { const date = shiftDate(first.toISOString().slice(0, 10), index);
    const cell = document.createElement('span');
    const count = counts.get(date) || 0;
    cell.className = `heat-cell ${date < start || date > end ? 'future' : `level-${Math.min(4, count)}`}`;
    cell.title = `${prettyDate(date)} · ${count} check-in${count === 1 ? '' : 's'}`;
    cell.setAttribute('aria-label', cell.title);
    map.appendChild(cell);
  }
}

async function renderStats() {
  try {
    const todayStr = today(); const end = todayStr; const endDate = Store.getDate(end);
    const monday = shiftDate(end, -(endDate.getUTCDay() === 0 ? 6 : endDate.getUTCDay() - 1));
    const previousMonday = shiftDate(monday, -7);
    const previousSunday = shiftDate(monday, -1);

    const activeHabits = state.habits.filter(h => !h.archived);
    const activeCount = (from, to) => {
      let completed = 0;
      activeHabits.forEach(habit => {
        habit.checkins.forEach(date => {
          if (date >= from && date <= to) completed++;
        });
      });
      return completed;
    };

    const thisCount = activeCount(monday, end);
    const lastCount = activeCount(previousMonday, previousSunday);
    const possible = activeHabits.length * 7;
    const completionRate = (count) => possible === 0 ? 0 : Math.round((count / possible) * 100);

    const dayCounts = new Array(7).fill(0);
    activeHabits.forEach(habit => {
      habit.checkins.forEach(date => {
        if (date >= monday && date <= end) {
          const dateObj = Store.getDate(date);
          const dayIndex = dateObj.getUTCDay();
          dayCounts[dayIndex]++;
        }
      });
    });

    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const bestDayIndex = dayCounts.indexOf(Math.max(...dayCounts));
    const bestDay = dayCounts[bestDayIndex] > 0 ? {
      name: dayNames[bestDayIndex],
      count: dayCounts[bestDayIndex]
    } : null;

    const habitCounts = new Map();
    activeHabits.forEach(habit => {
      let count = 0;
      habit.checkins.forEach(date => {
        if (date >= monday && date <= end) count++;
      });
      habitCounts.set(habit.id, count);
    });

    const topHabitId = [...habitCounts.entries()].sort((a, b) => b[1] - a[1])[0];
    const topHabit = topHabitId ? {
      name: state.habits.find(h => h.id === topHabitId[0])?.name,
      count: topHabitId[1]
    } : null;

    $('#this-rate').textContent = `${completionRate(thisCount)}%`;
    $('#this-detail').textContent = `${thisCount} completed`;
    $('#last-rate').textContent = `${completionRate(lastCount)}%`;
    $('#last-detail').textContent = `${lastCount} completed`;
    $('#best-day').textContent = bestDay?.name || '—';
    $('#best-detail').textContent = bestDay ? `${bestDay.count} check-ins` : 'keep showing up';
    $('#top-habit').textContent = topHabit?.name || '—';
    $('#top-detail').textContent = topHabit ? `${topHabit.count} check-ins` : 'check-ins this week';
  } catch (error) { showError(error); }
}

function escapeHtml(value) { return value.replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[character])); }

function openDialog(habit = null) {
  $('#habit-id').value = habit?.id || '';
  $('#dialog-title').textContent = habit ? 'Edit habit' : 'Add a habit';
  $('#habit-name').value = habit?.name || '';
  $('#habit-category').value = habit?.category || '';
  $('#habit-target').value = habit?.weekly_target || 7;
  state.selectedColor = habit?.color || 'teal';
  document.querySelectorAll('.color-option').forEach((item) => item.classList.toggle('selected', item.dataset.color === state.selectedColor));
  $('#habit-dialog').showModal();
  $('#habit-name').focus();
}

function setupDialog() {
  const colors = ['teal', 'blue', 'amber', 'coral', 'violet', 'green'];
  $('#color-options').innerHTML = colors.map((color) =>
    `<button type="button" class="color-option ${color}" data-color="${color}" aria-label="${color}"></button>`
  ).join('');

  document.querySelectorAll('.color-option').forEach((item) => {
    item.addEventListener('click', () => {
      state.selectedColor = item.dataset.color;
      document.querySelectorAll('.color-option').forEach((option) =>
        option.classList.toggle('selected', option === item)
      );
    });
  });

  $('#habit-form').addEventListener('submit', async (event) => {
    if (event.submitter?.value === 'cancel') return;
    event.preventDefault();

    const name = $('#habit-name').value.trim();
    if (!name) {
      $('#habit-name').focus();
      showError(new Error('Please enter a habit name before saving.'));
      return;
    }

    const id = $('#habit-id').value;
    const payload = {
      name,
      category: $('#habit-category').value || null,
      weekly_target: Number($('#habit-target').value),
      color: state.selectedColor
    };

    try {
      if (id) {
        const habitIndex = state.habits.findIndex(h => h.id === Number(id));
        if (habitIndex === -1) throw new Error('Habit not found');
        state.habits[habitIndex] = {
          ...state.habits[habitIndex],
          ...payload
        };
      } else {
        state.habits.push({
          id: Date.now(),
          ...payload,
          archived: false,
          checkins: []
        });
      }

      Store.saveHabits(state.habits);
      $('#habit-dialog').close();
      await load();
    } catch (error) {
      showError(error);
    }
  });
}

$('#today-label').textContent = new Date().toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' }).toUpperCase();

$('#open-add').addEventListener('click', () => openDialog());
$('#empty-add').addEventListener('click', () => openDialog());
$('#list-add').addEventListener('click', () => openDialog());

$('#heatmap-filter').addEventListener('change', renderHeatmap);

// Export CSV
$('#export-csv').addEventListener('click', (event) => {
  event.preventDefault();

  try {
    const rows = state.habits.flatMap(habit =>
      habit.checkins.map(date => ({
        date,
        habit: habit.name,
        category: habit.category,
        color: habit.color
      }))
    ).sort((a, b) => b.date.localeCompare(a.date) || a.habit.localeCompare(b.habit));

    const escape = (value) => `"${String(value ?? '').replaceAll('"', '""')}"`;
    const csv = ['date,habit,category,color', ...rows.map(row =>
      [row.date, row.habit, row.category, row.color].map(escape).join(',')
    )].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `habit-checkins-${today()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  } catch (error) {
    showError(error);
  }
});

// Download backup
$('#download-backup').addEventListener('click', (event) => {
  event.preventDefault();

  try {
    const backupData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      habits: Store.getHabits()
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `ritual-backup-${today()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  } catch (error) {
    showError(error);
  }
});

// Import backup
$('#import-backup').addEventListener('click', (event) => {
  event.preventDefault();

  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  input.onchange = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const backupData = JSON.parse(event.target.result);

        if (!backupData.habits || !Array.isArray(backupData.habits)) {
          throw new Error('Invalid backup format');
        }

        if (!window.confirm(`Import ${backupData.habits.length} habits? This will overwrite existing data.`)) {
          return;
        }

        Store.saveHabits(backupData.habits);
        state.habits = backupData.habits;
        load();
        showError(new Error('Backup imported successfully!'));
      } catch (error) {
        showError(new Error('Failed to import backup: ' + error.message));
      }
    };
    reader.readAsText(file);
  };
  input.click();
});

setupDialog();
Store.init();
load();