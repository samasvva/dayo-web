-- Dayo: Habit & Task Tracker Schema

create table habits (
  id uuid primary key default gen_random_uuid(),
  person text not null, -- 'A' or 'B'
  name text not null,
  category text not null,
  created_at timestamp default now()
);

create table habit_logs (
  id uuid primary key default gen_random_uuid(),
  habit_id uuid references habits(id),
  person text not null,
  date date not null,
  done boolean default false,
  created_at timestamp default now(),
  unique(habit_id, date)
);

create table tasks (
  id uuid primary key default gen_random_uuid(),
  person text not null, -- 'A' or 'B'
  title text not null,
  date date not null,
  done boolean default false,
  created_at timestamp default now()
);
