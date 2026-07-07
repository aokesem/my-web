-- Add category support for Cognitive Prism datasets and metrics.
-- Items with null category_id are displayed as "未分类" by the client.

create table if not exists public.prism_data_categories (
    id uuid primary key default gen_random_uuid(),
    kind text not null check (kind in ('datasets', 'metrics')),
    name text not null,
    sort_order integer not null default 0,
    created_at timestamp with time zone not null default now(),
    unique (kind, name)
);

alter table public.prism_datasets
    add column if not exists category_id uuid references public.prism_data_categories(id) on delete set null;

alter table public.prism_metrics
    add column if not exists category_id uuid references public.prism_data_categories(id) on delete set null;

create index if not exists idx_prism_data_categories_kind_sort
    on public.prism_data_categories(kind, sort_order, created_at);

create index if not exists idx_prism_datasets_category_id
    on public.prism_datasets(category_id);

create index if not exists idx_prism_metrics_category_id
    on public.prism_metrics(category_id);
