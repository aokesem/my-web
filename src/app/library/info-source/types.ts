export type CategoryType = 'study' | 'life';

export interface InfoSourceGroup {
    id: number;
    category_type: CategoryType;
    name: string;
    sort_order: number;
    created_at?: string;
}

export interface InfoSource {
    id: number;
    group_id?: number | null;
    name: string;
    image_url?: string | null;
    sort_order: number;
    created_at?: string;
    info_source_groups?: { name: string } | null;
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
