-- 个人习惯清单表 (Profile Status Habits)
create table if not exists public.profile_status_habits (
  id bigint generated always as identity primary key,
  domain text not null check (domain in ('learning', 'body', 'mind')),
  content text not null,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 索引：加速按分类和创建时间查询
create index if not exists idx_profile_status_habits_domain
  on public.profile_status_habits (domain);

create index if not exists idx_profile_status_habits_created_at
  on public.profile_status_habits (created_at);

create index if not exists idx_profile_status_habits_domain_created_at
  on public.profile_status_habits (domain, created_at);

-- 可选 RLS 策略（如开启了 RLS，允许公开读取，允许已认证用户读写）：
-- alter table public.profile_status_habits enable row level security;
-- create policy "Allow public read profile_status_habits" on public.profile_status_habits for select using (true);
-- create policy "Allow authenticated modify profile_status_habits" on public.profile_status_habits for all to authenticated using (true) with check (true);
