const KEYS = {
  HABITS: 'ritual_habits',
  SETTINGS: 'ritual_settings'
};

const Store = {
  init: () => {
    if (!localStorage.getItem(KEYS.HABITS)) {
      Store.set(KEYS.HABITS, '[]');
    }
  },

  getHabits: () => {
    const data = localStorage.getItem(KEYS.HABITS);
    if (!data) return [];
    const habits = JSON.parse(data);
    return Array.isArray(habits) ? habits : [];
  },

  saveHabits: (habits) => {
    localStorage.setItem(KEYS.HABITS, JSON.stringify(habits));
  },

  get: (key) => {
    return localStorage.getItem(key) || null;
  },

  set: (key, value) => {
    localStorage.setItem(key, String(value));
  },

  getDate: (dateStr) => {
    return new Date(`${dateStr}T00:00:00Z`);
  },

  addCheckin: (habitId, date) => {
    const habits = Store.getHabits();
    const habit = habits.find((item) => item.id === habitId);
    if (!habit) throw new Error('Habit not found');

    habit.checkins = Array.isArray(habit.checkins) ? habit.checkins : [];
    if (!habit.checkins.includes(date)) {
      habit.checkins.push(date);
      habit.checkins.sort();
      Store.saveHabits(habits);
    }
  },

  removeCheckin: (habitId, date) => {
    const habits = Store.getHabits();
    const habit = habits.find((item) => item.id === habitId);
    if (!habit) throw new Error('Habit not found');

    habit.checkins = (Array.isArray(habit.checkins) ? habit.checkins : [])
      .filter((item) => item !== date);
    Store.saveHabits(habits);
  }
};

window.Store = Store;