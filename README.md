# Ritual

Ritual is a personal habit and study tracker for turning repeatable practice into a visible record. It has a quiet, editorial dashboard for daily check-ins, streaks, a 12-month heatmap, and weekly review stats.

![Ritual dashboard screenshot placeholder](docs/screenshot-placeholder.png)

## Features

- Create, edit, archive, and delete habits with category, weekly target, and fixed color choices.
- Check habits off today or repair any day from the last 30 days.
- Daily streaks and weekly-target streaks with current and longest values.
- Combined or per-habit GitHub-style heatmap for the last 12 months.
- Weekly completion rate, best day, and most consistent habit.
- CSV export of all check-ins.
- Responsive, keyboard-friendly UI with reduced-motion support.

## Stack

- Plain HTML, CSS, and browser JavaScript
- Node.js and Express
- SQLite through `better-sqlite3`
- Node's built-in test runner

## Install and run

```bash
npm install
npm start
```

Open [http://localhost:3000](http://localhost:3000). The schema in `schema.sql` runs automatically on first start.

Environment variables:

- `PORT` — HTTP port (default `3000`)
- `DB_PATH` — SQLite file path (default `./tracker.db`)

## Tests

```bash
npm test
```

The streak tests cover daily gaps, weekly targets, month/year boundaries, and empty habits.

## API

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/habits` | List active habits (`?archived=true` includes archived) |
| POST | `/api/habits` | Create a habit |
| PATCH | `/api/habits/:id` | Edit or archive a habit |
| DELETE | `/api/habits/:id` | Permanently delete a habit |
| POST | `/api/habits/:id/checkins/:date` | Add a check-in |
| DELETE | `/api/habits/:id/checkins/:date` | Remove a check-in |
| GET | `/api/stats/weekly` | Current and previous week summary |
| GET | `/api/stats/heatmap` | 12-month counts (`?habit_id=1` filters) |
| GET | `/api/export.csv` | Download check-ins as CSV |

## Data model

`habits(id, name, category, weekly_target, color, archived, created_at)`  
`checkins(id, habit_id, date, created_at)` with a unique `(habit_id, date)` constraint  
`study_sessions(id, habit_id, date, minutes)` reserved for the optional timer

## What I'd build next

- Pomodoro study timer with logged minutes per habit.
- Import/export of the full SQLite data set.
- More detailed weekly review with target-aware completion rates.
