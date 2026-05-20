-- 【已废弃】提醒字段应加在 info_items 上，请改执行 info-items-reminders.sql
-- 信息溯源收藏夹 · 周期回顾提醒（在 Supabase SQL Editor 中执行）

alter table public.info_source_groups
  add column if not exists reminder_interval_days integer not null default 0
    check (reminder_interval_days >= 0);

alter table public.info_source_groups
  add column if not exists last_reminder_cleared_at date;

comment on column public.info_source_groups.reminder_interval_days is
  '回顾周期（天），0 表示不提醒';

comment on column public.info_source_groups.last_reminder_cleared_at is
  '上次在信息清单中清除提醒的日期；未设置时以 created_at 为起点';
