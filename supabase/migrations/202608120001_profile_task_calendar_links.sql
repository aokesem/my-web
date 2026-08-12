-- Allow profile plans to automatically include calendar activities by
-- deadline category or deadline item. Names stay in the source tables so
-- renaming a category or item is reflected without copying data.

create table if not exists public.profile_task_deadline_categories (
    id bigint generated always as identity primary key,
    task_id bigint not null references public.profile_tasks(id) on delete cascade,
    deadline_category_id bigint not null references public.deadline_categories(id) on delete cascade,
    created_at timestamp with time zone not null default now(),
    unique (task_id, deadline_category_id)
);

create table if not exists public.profile_task_deadline_items (
    id bigint generated always as identity primary key,
    task_id bigint not null references public.profile_tasks(id) on delete cascade,
    deadline_item_id bigint not null references public.deadline_items(id) on delete cascade,
    created_at timestamp with time zone not null default now(),
    unique (task_id, deadline_item_id)
);

create index if not exists idx_profile_task_deadline_categories_task_id
    on public.profile_task_deadline_categories(task_id);

create index if not exists idx_profile_task_deadline_categories_category_id
    on public.profile_task_deadline_categories(deadline_category_id);

create index if not exists idx_profile_task_deadline_items_task_id
    on public.profile_task_deadline_items(task_id);

create index if not exists idx_profile_task_deadline_items_item_id
    on public.profile_task_deadline_items(deadline_item_id);
