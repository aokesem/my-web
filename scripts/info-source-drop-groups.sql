-- 信息溯源：弃用 info_source_groups，收藏夹改由 info_items 承担
-- 请在 Supabase SQL Editor 中执行；建议先备份

-- 1. 清空书签与主卡片上的旧 group 引用（parent_item_id 为新归属字段）
UPDATE info_bookmarks SET group_id = NULL WHERE group_id IS NOT NULL;
UPDATE info_items SET group_id = NULL WHERE group_id IS NOT NULL;

-- 2. 可选：删除分组表（确认应用已上线且无依赖后再执行）
DROP TABLE IF EXISTS info_source_groups CASCADE;

-- 3. 可选：移除列（确认无代码引用后再执行）
ALTER TABLE info_bookmarks DROP COLUMN IF EXISTS group_id;
ALTER TABLE info_items DROP COLUMN IF EXISTS group_id;
