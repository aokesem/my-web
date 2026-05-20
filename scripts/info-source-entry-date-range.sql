-- 信息条目：作用时间范围（info_bookmarks）
-- 收藏夹（info_items）不再使用 url / info_date，列可保留，应用层不再读写

alter table public.info_bookmarks
  add column if not exists effective_date_start date;

alter table public.info_bookmarks
  add column if not exists effective_date_end date;

comment on column public.info_bookmarks.effective_date_start is '作用时间范围 · 起始（可选）';
comment on column public.info_bookmarks.effective_date_end is '作用时间范围 · 结束（可选，需不早于起始）';

-- 将旧单日期迁移到起始日
update public.info_bookmarks
set effective_date_start = info_date::date
where effective_date_start is null
  and info_date is not null
  and info_date::text <> '';
