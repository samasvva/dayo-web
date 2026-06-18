# Dayo — Habit & Task Tracker

A minimal, calm habit and task tracker for two people, built with React + Tailwind CSS + Supabase.

## Setup

### 1. Clone & install

```bash
git clone <your-repo>
cd dayo
npm install
```

### 2. Add Supabase credentials

Copy the example env file and fill in your credentials:

```bash
cp .env.example .env
```

Edit `.env`:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 3. Run the Supabase schema

In your [Supabase SQL Editor](https://supabase.com/dashboard/project/_/sql), paste and run the contents of `schema.sql`.

### 4. Run locally

```bash
npm run dev
```

Open http://localhost:5173

## Deploy to Vercel

```bash
npx vercel --prod
```

Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in your Vercel project environment variables.

## Features

- **Home** — Side-by-side overview for Person A and Person B with donut charts, streak, and today's task progress
- **Habits** — Monthly grid tracker with real checkboxes, per-row %, per-day %, and month navigator
- **Tasks** — Weekly view with inline task entry, completion tracking, and a summary bar chart
- **Analytics** — Donut chart, per-habit horizontal bars, daily progress line chart, and weekly task bar chart

## Data export

On the Analytics page, use the **Export JSON** button to download all habits, logs, and tasks for the current month as a `.json` file.
