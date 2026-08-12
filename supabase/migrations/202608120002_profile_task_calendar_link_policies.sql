-- The profile is publicly readable, while calendar link management is only
-- available to the site's authenticated owner.

alter table public.profile_task_deadline_categories enable row level security;
alter table public.profile_task_deadline_items enable row level security;

grant select on table public.profile_task_deadline_categories to anon, authenticated;
grant insert, delete on table public.profile_task_deadline_categories to authenticated;

grant select on table public.profile_task_deadline_items to anon, authenticated;
grant insert, delete on table public.profile_task_deadline_items to authenticated;

grant usage, select on sequence public.profile_task_deadline_categories_id_seq to authenticated;
grant usage, select on sequence public.profile_task_deadline_items_id_seq to authenticated;

drop policy if exists "Public can read task category links"
    on public.profile_task_deadline_categories;
create policy "Public can read task category links"
    on public.profile_task_deadline_categories
    for select
    to anon, authenticated
    using (true);

drop policy if exists "Authenticated users can insert task category links"
    on public.profile_task_deadline_categories;
create policy "Authenticated users can insert task category links"
    on public.profile_task_deadline_categories
    for insert
    to authenticated
    with check (true);

drop policy if exists "Authenticated users can delete task category links"
    on public.profile_task_deadline_categories;
create policy "Authenticated users can delete task category links"
    on public.profile_task_deadline_categories
    for delete
    to authenticated
    using (true);

drop policy if exists "Public can read task item links"
    on public.profile_task_deadline_items;
create policy "Public can read task item links"
    on public.profile_task_deadline_items
    for select
    to anon, authenticated
    using (true);

drop policy if exists "Authenticated users can insert task item links"
    on public.profile_task_deadline_items;
create policy "Authenticated users can insert task item links"
    on public.profile_task_deadline_items
    for insert
    to authenticated
    with check (true);

drop policy if exists "Authenticated users can delete task item links"
    on public.profile_task_deadline_items;
create policy "Authenticated users can delete task item links"
    on public.profile_task_deadline_items
    for delete
    to authenticated
    using (true);
