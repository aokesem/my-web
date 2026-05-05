-- 地点记录主表
create table if not exists public.profile_places (
  id bigint generated always as identity primary key,
  name text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_profile_places_sort_order
  on public.profile_places (sort_order);

-- 地点图片表（一个地点可多张图片，存项目内静态路径）
create table if not exists public.profile_place_images (
  id bigint generated always as identity primary key,
  place_id bigint not null references public.profile_places(id) on delete cascade,
  image_path text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_profile_place_images_place_id
  on public.profile_place_images (place_id);

create index if not exists idx_profile_place_images_sort_order
  on public.profile_place_images (sort_order);

-- 到访记录表（允许同地点同日多次）
create table if not exists public.profile_place_visits (
  id bigint generated always as identity primary key,
  place_id bigint not null references public.profile_places(id) on delete cascade,
  visit_date date not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_profile_place_visits_place_id
  on public.profile_place_visits (place_id);

create index if not exists idx_profile_place_visits_visit_date
  on public.profile_place_visits (visit_date desc);
