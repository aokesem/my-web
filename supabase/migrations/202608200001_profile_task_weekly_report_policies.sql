-- Weekly reports are publicly readable with the rest of the profile, while
-- changes are restricted to the site's authenticated owner.

alter table public.profile_task_weekly_reports enable row level security;

grant select on table public.profile_task_weekly_reports to anon, authenticated;
grant insert, update, delete on table public.profile_task_weekly_reports to authenticated;
grant usage, select on sequence public.profile_task_weekly_reports_id_seq to authenticated;

drop policy if exists "Public can read task weekly reports"
    on public.profile_task_weekly_reports;
create policy "Public can read task weekly reports"
    on public.profile_task_weekly_reports
    for select
    to anon, authenticated
    using (true);

drop policy if exists "Authenticated users can insert task weekly reports"
    on public.profile_task_weekly_reports;
create policy "Authenticated users can insert task weekly reports"
    on public.profile_task_weekly_reports
    for insert
    to authenticated
    with check (true);

drop policy if exists "Authenticated users can update task weekly reports"
    on public.profile_task_weekly_reports;
create policy "Authenticated users can update task weekly reports"
    on public.profile_task_weekly_reports
    for update
    to authenticated
    using (true)
    with check (true);

drop policy if exists "Authenticated users can delete task weekly reports"
    on public.profile_task_weekly_reports;
create policy "Authenticated users can delete task weekly reports"
    on public.profile_task_weekly_reports
    for delete
    to authenticated
    using (true);
