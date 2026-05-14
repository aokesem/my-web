-- 议程三块拆表 + 启示标题/唯一 + 启示-调查方向 + 综合-启示引用
-- 请在 Supabase SQL Editor 执行或通过 supabase db push

-- ---------------------------------------------------------------------------
-- 1) 子表：驱动与边界 / 调查方向 / 综合（每条一行，含 created_at）
-- ---------------------------------------------------------------------------
create table if not exists public.prism_agenda_drive_items (
    id uuid primary key default gen_random_uuid(),
    agenda_version_id uuid not null references public.prism_project_agenda_versions (id) on delete cascade,
    title text not null default '',
    content text not null default '',
    sort_order int not null default 0,
    created_at timestamptz not null default now()
);

create table if not exists public.prism_agenda_survey_items (
    id uuid primary key default gen_random_uuid(),
    agenda_version_id uuid not null references public.prism_project_agenda_versions (id) on delete cascade,
    title text not null default '',
    content text not null default '',
    sort_order int not null default 0,
    created_at timestamptz not null default now()
);

create table if not exists public.prism_agenda_synthesis_items (
    id uuid primary key default gen_random_uuid(),
    agenda_version_id uuid not null references public.prism_project_agenda_versions (id) on delete cascade,
    content text not null default '',
    sort_order int not null default 0,
    created_at timestamptz not null default now()
);

create index if not exists idx_agenda_drive_version on public.prism_agenda_drive_items (agenda_version_id, sort_order);
create index if not exists idx_agenda_survey_version on public.prism_agenda_survey_items (agenda_version_id, sort_order);
create index if not exists idx_agenda_synthesis_version on public.prism_agenda_synthesis_items (agenda_version_id, sort_order);

-- ---------------------------------------------------------------------------
-- 2) 启示：标题 + 项目内唯一
-- ---------------------------------------------------------------------------
alter table public.prism_project_insights
    add column if not exists title text;

update public.prism_project_insights
set title = '启示-' || replace(id::text, '-', '')
where title is null or trim(title) = '';

alter table public.prism_project_insights
    alter column title set not null;

create unique index if not exists uq_prism_insights_project_title
    on public.prism_project_insights (project_id, title);

-- ---------------------------------------------------------------------------
-- 3) Junction：启示 <-> 调查方向条目；综合 <-> 启示
-- ---------------------------------------------------------------------------
create table if not exists public.prism_insight_survey_items (
    insight_id uuid not null references public.prism_project_insights (id) on delete cascade,
    survey_item_id uuid not null references public.prism_agenda_survey_items (id) on delete restrict,
    primary key (insight_id, survey_item_id)
);

create table if not exists public.prism_synthesis_insight_refs (
    synthesis_item_id uuid not null references public.prism_agenda_synthesis_items (id) on delete cascade,
    insight_id uuid not null references public.prism_project_insights (id) on delete cascade,
    primary key (synthesis_item_id, insight_id)
);

create index if not exists idx_insight_survey_survey on public.prism_insight_survey_items (survey_item_id);

-- ---------------------------------------------------------------------------
-- 4) 旧议程三列文本 -> 各插入一条迁移行（非空时）
-- ---------------------------------------------------------------------------
insert into public.prism_agenda_drive_items (agenda_version_id, title, content, sort_order, created_at)
select id, '自旧版迁移', trim(drive_text), 0, created_at
from public.prism_project_agenda_versions
where drive_text is not null and trim(drive_text) <> '';

insert into public.prism_agenda_survey_items (agenda_version_id, title, content, sort_order, created_at)
select id, '自旧版迁移', trim(survey_text), 0, created_at
from public.prism_project_agenda_versions
where survey_text is not null and trim(survey_text) <> '';

insert into public.prism_agenda_synthesis_items (agenda_version_id, content, sort_order, created_at)
select id, trim(synthesis_text), 0, created_at
from public.prism_project_agenda_versions
where synthesis_text is not null and trim(synthesis_text) <> '';

alter table public.prism_project_agenda_versions
    drop column if exists drive_text,
    drop column if exists survey_text,
    drop column if exists synthesis_text;

-- ---------------------------------------------------------------------------
-- 5) RLS（与 prism_project_agenda_versions 一致）
-- ---------------------------------------------------------------------------
alter table public.prism_agenda_drive_items enable row level security;
alter table public.prism_agenda_survey_items enable row level security;
alter table public.prism_agenda_synthesis_items enable row level security;
alter table public.prism_insight_survey_items enable row level security;
alter table public.prism_synthesis_insight_refs enable row level security;

create policy agenda_drive_select on public.prism_agenda_drive_items for select using (true);
create policy agenda_drive_mutate on public.prism_agenda_drive_items for all using (auth.uid() is not null) with check (auth.uid() is not null);

create policy agenda_survey_select on public.prism_agenda_survey_items for select using (true);
create policy agenda_survey_mutate on public.prism_agenda_survey_items for all using (auth.uid() is not null) with check (auth.uid() is not null);

create policy agenda_synth_select on public.prism_agenda_synthesis_items for select using (true);
create policy agenda_synth_mutate on public.prism_agenda_synthesis_items for all using (auth.uid() is not null) with check (auth.uid() is not null);

create policy insight_survey_select on public.prism_insight_survey_items for select using (true);
create policy insight_survey_mutate on public.prism_insight_survey_items for all using (auth.uid() is not null) with check (auth.uid() is not null);

create policy synth_ref_select on public.prism_synthesis_insight_refs for select using (true);
create policy synth_ref_mutate on public.prism_synthesis_insight_refs for all using (auth.uid() is not null) with check (auth.uid() is not null);
