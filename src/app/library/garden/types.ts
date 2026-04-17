// ============================================================
// GARDEN MODULE - TYPE DEFINITIONS
// ============================================================

/**
 * 分类（Board）— 笔记的顶层分组
 * 对应 Supabase 表: garden_categories
 */
export interface GardenCategory {
    id: string;
    title: string;
    icon: string;
    sort_order?: number;
}

/**
 * 笔记（Post）— 一个独立的笔记条目
 * 对应 Supabase 表: garden_posts
 * 注意: content 字段已废弃（迁移至 garden_chapters），此处不再包含
 */
export interface GardenPost {
    id: string;
    slug: string;
    title: string;
    tags: string[];
    category: string;
    status: 'Draft' | 'Published';
    created_at: string;
    published_at: string | null;
}

/**
 * 章节（Chapter）— 笔记内的子单元，每个章节为一"页"
 * 对应 Supabase 表: garden_chapters
 */
export interface GardenChapter {
    id: string;
    post_id: string;
    title: string;
    notes?: string;       // Tiptap JSON 字符串
    sort_order: number;
    created_at: string;
}
