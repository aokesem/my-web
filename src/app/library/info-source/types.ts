export type CategoryType = 'study' | 'life';

/** 侧栏「未归入收藏夹」筛选用的哨兵 id（与真实 group id 不冲突） */
export const INFO_UNGROUPED_FOLDER_ID = -1;

/** 收藏夹主网格 vs 信息条目列表 */
export type InfoSourceViewMode = 'folders' | 'entries';

/** 侧栏：收藏夹导航 vs 待看队列 */
export type InfoSidebarNavMode = 'folders' | 'queue';

export interface InfoSourceGroup {
    id: number;
    category_type: CategoryType;
    name: string;
    sort_order: number;
    created_at?: string;
}

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
    url?: string;
    source_id?: number;
    group_id?: number;
    image_url?: string;
    info_date?: string;
    sort_order: number;
    is_favorited: boolean;
    is_queued: boolean;
    created_at: string;
    category_ids: number[];
}

export interface InfoBookmark {
    id: number;
    created_at: string;
    title: string;
    url?: string;
    description?: string;
    info_date?: string;
    category_type: string;
    is_favorited: boolean;
    is_queued: boolean;
    is_read: boolean;
    group_id?: number | null;
    source_id?: number | null;
    parent_item_id?: number | null;
    category_id?: number | null;
}
