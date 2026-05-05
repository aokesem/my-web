-- Create daily routine logs table for profile calendar month view.
create table if not exists public.calendar_routine_logs (
  id bigint generated always as identity primary key,
  date date not null unique,
  wake_time time,
  sleep_time time,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_calendar_routine_logs_date
  on public.calendar_routine_logs (date);

-- Optional RLS policy examples (adjust to your auth model):
-- alter table public.calendar_routine_logs enable row level security;
