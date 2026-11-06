const state = { habits: [], selectedColor: 'teal' };
const $ = (selector) => document.querySelector(selector);
const api = async (path, options = {}) => {
  const response = await fetch(`/api${path}`, { headers: { 'Content-Type': 'application/json' }, ...options });
  const data = response.status === 204 ? null : await response.json();
  if (!response.ok) throw new Error(data?.error || 'Something went wrong');
  return data;
};
const today = () => new Date().toISOString().slice(0, 10);
const shiftDate = (date, amount) => { const result = new Date(`${date}T00:00:00Z`); result.setUTCDate(result.getUTCDate() + amount); return result.toISOString().slice(0, 10); };
const showError = (error) => { $('#notice').textContent = error.message; window.setTimeout(() => { $('#notice').textContent = ''; }, 4500); };
const prettyDate = (date) => new Date(`${date}T00:00:00Z`).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

async function load() {
  try {
    state.habits = await api('/habits');
    renderHabits(); renderHistory(); renderHeatmap(); renderStats();
  } catch (error) { showError(error); }
}
function renderHabits() {
  const list = $('#habit-list'); list.innerHTML = '';
  let done = 0;
  state.habits.forEach((habit) => {
    const checked = habit.checkins.includes(today()); if (checked) done += 1;
    const row = document.createElement('article'); row.className = 'habit-row';
    row.innerHTML = `<span class="habit-color ${habit.color}"></span><div><div class="habit-name">${escapeHtml(habit.name)}</div><div class="habit-meta">${habit.category || 'Personal'} · ${habit.weekly_target === 7 ? 'Every day' : `${habit.weekly_target} days / week`}</div><div class="row-actions"><button data-edit="${habit.id}" type="button">Edit</button><button data-archive="${habit.id}" type="button">Archive</button><button data-delete="${habit.id}" type="button">Delete</button></div></div><div class="habit-streak"><strong>${habit.streak.current} day${habit.streak.current === 1 ? '' : 's'}</strong>current streak</div><button class="check-toggle ${checked ? 'checked' : ''}" data-toggle="${habit.id}" aria-label="${checked ? 'Uncheck' : 'Check'} ${escapeHtml(habit.name)} for today" type="button"></button>`;
    list.appendChild(row);
  });
  $('#today-count').textContent = `${done} / ${state.habits.length} complete`;
  const filter = $('#heatmap-filter'); const current = filter.value;
  filter.innerHTML = `<option value="">All habits</option>${state.habits.map((habit) => `<option value="${habit.id}">${escapeHtml(habit.name)}</option>`).join('')}`; filter.value = state.habits.some((habit) => String(habit.id) === current) ? current : '';
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
    const day = document.createElement('button'); day.type = 'button'; day.className = `history-day ${date === today() ? 'active' : ''}`; day.innerHTML = `<small>${new Date(`${date}T00:00:00Z`).toLocaleDateString(undefined, { weekday: 'short' })}</small><b>${new Date(`${date}T00:00:00Z`).getUTCDate()}</b><small>${count}/${state.habits.length}</small>`; day.title = `Toggle all habits for ${prettyDate(date)}`; day.addEventListener('click', () => toggleAll(date)); history.appendChild(day);
  }
}
async function toggle(habitId, date) {
  const habit = state.habits.find((item) => item.id === habitId); if (!habit) return;
  try { if (habit.checkins.includes(date)) { await api(`/habits/${habitId}/checkins/${date}`, { method: 'DELETE' }); habit.checkins = habit.checkins.filter((item) => item !== date); } else { await api(`/habits/${habitId}/checkins/${date}`, { method: 'POST' }); habit.checkins.push(date); } renderHabits(); renderHistory(); renderHeatmap(); renderStats(); } catch (error) { showError(error); }
}
async function toggleAll(date) { try { const incomplete = state.habits.filter((habit) => !habit.checkins.includes(date)); await Promise.all(incomplete.map((habit) => api(`/habits/${habit.id}/checkins/${date}`, { method: 'POST' }))); state.habits.forEach((habit) => { if (!habit.checkins.includes(date)) habit.checkins.push(date); }); renderHabits(); renderHistory(); renderHeatmap(); renderStats(); } catch (error) { showError(error); } }
async function archive(id) { try { await api(`/habits/${id}`, { method: 'PATCH', body: JSON.stringify({ archived: true }) }); await load(); } catch (error) { showError(error); } }
async function removeHabit(id) { if (!window.confirm('Delete this habit and its check-ins?')) return; try { await api(`/habits/${id}`, { method: 'DELETE' }); await load(); } catch (error) { showError(error); } }
function renderHeatmap() {
  const map = $('#heatmap'); map.innerHTML = ''; const selected = Number($('#heatmap-filter').value); const habits = selected ? state.habits.filter((habit) => habit.id === selected) : state.habits; const counts = new Map(); habits.forEach((habit) => habit.checkins.forEach((date) => counts.set(date, (counts.get(date) || 0) + 1)));
  const end = today(); const start = shiftDate(end, -364); const first = new Date(`${start}T00:00:00Z`); first.setUTCDate(first.getUTCDate() - (first.getUTCDay() || 7) + 1);
  for (let index = 0; index < 371; index += 1) { const date = shiftDate(first.toISOString().slice(0, 10), index); const cell = document.createElement('span'); const count = counts.get(date) || 0; cell.className = `heat-cell ${date < start || date > end ? 'future' : `level-${Math.min(4, count)}`}`; cell.title = `${prettyDate(date)} · ${count} check-in${count === 1 ? '' : 's'}`; cell.setAttribute('aria-label', cell.title); map.appendChild(cell); }
}
async function renderStats() { try { const stats = await api('/stats/weekly'); $('#this-rate').textContent = `${stats.thisWeek.rate}%`; $('#this-detail').textContent = `${stats.thisWeek.completed} completed`; $('#last-rate').textContent = `${stats.lastWeek.rate}%`; $('#last-detail').textContent = `${stats.lastWeek.completed} completed`; $('#best-day').textContent = stats.bestDay?.name || '—'; $('#best-detail').textContent = stats.bestDay ? `${stats.bestDay.count} check-ins` : 'keep showing up'; $('#top-habit').textContent = stats.topHabit?.name || '—'; $('#top-detail').textContent = stats.topHabit ? `${stats.topHabit.count} check-ins` : 'check-ins this week'; } catch (error) { showError(error); } }
function escapeHtml(value) { return value.replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[character])); }
function openDialog(habit = null) { $('#habit-id').value = habit?.id || ''; $('#dialog-title').textContent = habit ? 'Edit habit' : 'Add a habit'; $('#habit-name').value = habit?.name || ''; $('#habit-category').value = habit?.category || ''; $('#habit-target').value = habit?.weekly_target || 7; state.selectedColor = habit?.color || 'teal'; document.querySelectorAll('.color-option').forEach((item) => item.classList.toggle('selected', item.dataset.color === state.selectedColor)); $('#habit-dialog').showModal(); $('#habit-name').focus(); }
function setupDialog() { const colors = ['teal', 'blue', 'amber', 'coral', 'violet', 'green']; $('#color-options').innerHTML = colors.map((color) => `<button type="button" class="color-option ${color}" data-color="${color}" aria-label="${color}"></button>`).join(''); document.querySelectorAll('.color-option').forEach((item) => item.addEventListener('click', () => { state.selectedColor = item.dataset.color; document.querySelectorAll('.color-option').forEach((option) => option.classList.toggle('selected', option === item)); })); $('#habit-form').addEventListener('submit', async (event) => { if (event.submitter?.value === 'cancel') return; event.preventDefault(); const name = $('#habit-name').value.trim(); if (!name) { $('#habit-name').focus(); showError(new Error('Please enter a habit name before saving.')); return; } const id = $('#habit-id').value; const payload = { name, category: $('#habit-category').value || null, weekly_target: Number($('#habit-target').value), color: state.selectedColor }; try { await api(id ? `/habits/${id}` : '/habits', { method: id ? 'PATCH' : 'POST', body: JSON.stringify(payload) }); $('#habit-dialog').close(); await load(); } catch (error) { showError(error); } }); }
$('#today-label').textContent = new Date().toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' }).toUpperCase(); $('#open-add').addEventListener('click', () => openDialog()); $('#empty-add').addEventListener('click', () => openDialog()); $('#list-add').addEventListener('click', () => openDialog()); $('#heatmap-filter').addEventListener('change', renderHeatmap); setupDialog(); load();
