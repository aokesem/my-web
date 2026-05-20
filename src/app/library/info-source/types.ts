export type CategoryType = 'study' | 'life';

/** 侧栏「未归入收藏夹」：未挂 parent_item_id 的信息条目 */
export const INFO_UNGROUPED_FOLDER_ID = -1;

/** 收藏夹主网格 vs 信息条目列表 */
export type InfoSourceViewMode = 'folders' | 'entries';

/** 侧栏：收藏夹导航 vs 待看队列 */
export type InfoSidebarNavMode = 'folders' | 'queue';

/**
 * 侧栏选中态
 * - null：全部收藏夹（主区网格）
 * - INFO_UNGROUPED_FOLDER_ID：未归入任何收藏夹的条目
 * - number：某个主卡片（收藏夹）id，主区显示其下条目
 */
export type InfoSidebarSelection = null | typeof INFO_UNGROUPED_FOLDER_ID | number;

export interface InfoCategory {
    id: number;
    category_type: CategoryType;
    name: string;
    created_at?: string;
}

export interface InfoItem {
    id: number;
    category_type: CategoryType;
    name: string;
    description?: string;
    source_id?: number;
    image_url?: string;
    sort_order: number;
    is_favorited: boolean;
    is_queued: boolean;
    created_at: string;
    category_ids: number[];
    reminder_interval_days?: number;
    last_reminder_cleared_at?: string | null;
}

export interface InfoBookmark {
    id: number;
    created_at: string;
    title: string;
    url?: string;
    description?: string;
    /** 作用时间范围 · 起始 */
    effective_date_start?: string | null;
    /** 作用时间范围 · 结束 */
    effective_date_end?: string | null;
    /** @deprecated 迁移用，请用 effective_date_start */
    info_date?: string | null;
    category_type: string;
    is_favorited: boolean;
    is_queued: boolean;
    is_read: boolean;
    source_id?: number | null;
    parent_item_id?: number | null;
    category_id?: number | null;
    /** 待看队列侧栏展示用缩略图（由主卡片配图派生） */
    image_url?: string;
}
