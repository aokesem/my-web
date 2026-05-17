-- Profile 信息清单 · 桥梁捕获表（在 Supabase SQL Editor 中执行）

create table if not exists public.info_hub_captures (
  id bigint generated always as identity primary key,
  title text not null,
  category_type text not null check (category_type in ('study', 'life')),
  created_at timestamptz not null default now()
);

create index if not exists idx_info_hub_captures_created
  on public.info_hub_captures (created_at desc);
