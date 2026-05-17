-- 信息溯源：弃用 info_sources 前的数据迁移（在 Supabase SQL Editor 中执行）
-- 建议先备份，再按顺序执行。

-- 1. 从源站回填条目的收藏夹
UPDATE info_items i
SET group_id = s.group_id
FROM info_sources s
WHERE i.source_id = s.id
  AND (i.group_id IS NULL OR i.group_id = 0)
  AND s.group_id IS NOT NULL;

-- 2. 从源站回填书签的收藏夹
UPDATE info_bookmarks b
SET group_id = s.group_id
FROM info_sources s
WHERE b.source_id = s.id
  AND (b.group_id IS NULL OR b.group_id = 0)
  AND s.group_id IS NOT NULL;

-- 3. 从父条目回填书签的收藏夹
UPDATE info_bookmarks b
SET group_id = i.group_id
FROM info_items i
WHERE b.parent_item_id = i.id
  AND (b.group_id IS NULL OR b.group_id = 0)
  AND i.group_id IS NOT NULL;

-- 4. 清空外键引用
UPDATE info_items SET source_id = NULL WHERE source_id IS NOT NULL;
UPDATE info_bookmarks SET source_id = NULL WHERE source_id IS NOT NULL;

-- 5. 删除全部源站记录（表结构可保留，便于日后 DROP TABLE）
DELETE FROM info_sources;
