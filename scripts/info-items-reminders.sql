-- 收藏夹（info_items）周期回顾提醒
-- 若曾在 info_source_groups 上执行过 info-source-group-reminders.sql，请在 info_items 上单独执行本脚本

alter table public.info_items
  add column if not exists reminder_interval_days integer not null default 0
    check (reminder_interval_days >= 0);

alter table public.info_items
  add column if not exists last_reminder_cleared_at date;

comment on column public.info_items.reminder_interval_days is
  '回顾周期（天），0 表示不提醒';

comment on column public.info_items.last_reminder_cleared_at is
  '上次在信息清单中清除提醒的日期；未设置时以 created_at 为起点';
