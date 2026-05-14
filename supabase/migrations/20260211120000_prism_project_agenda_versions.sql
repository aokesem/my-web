-- 认知棱镜 · 项目 Tab 左栏「研究问题与背景」议程版本
-- 请在 Supabase SQL Editor 执行本文件，或通过 supabase db push 应用

create table if not exists public.prism_project_agenda_versions (
    id uuid primary key default gen_random_uuid(),
    project_id uuid not null references public.prism_projects (id) on delete cascade,
    label text,
    drive_text text default '',
    survey_text text default '',
    synthesis_text text default '',
    sort_order int not null default 0,
    created_at timestamptz not null default now()
);

create index if not exists idx_prism_agenda_versions_project
    on public.prism_project_agenda_versions (project_id, created_at desc);

comment on table public.prism_project_agenda_versions is '项目研究议程快照；created_at 参与项目时间线过滤';

alter table public.prism_project_agenda_versions enable row level security;

-- 与站内其它 prism 表一致：公开可读（图书馆展示），登录用户可写
create policy "prism_agenda_versions_select"
    on public.prism_project_agenda_versions for select
    using (true);

create policy "prism_agenda_versions_insert"
    on public.prism_project_agenda_versions for insert
    with check (auth.uid() is not null);

create policy "prism_agenda_versions_update"
    on public.prism_project_agenda_versions for update
    using (auth.uid() is not null);

create policy "prism_agenda_versions_delete"
    on public.prism_project_agenda_versions for delete
    using (auth.uid() is not null);
