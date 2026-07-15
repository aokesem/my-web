export type HubCategoryType = 'study' | 'life';

export interface HubCapture {
    id: number;
    title: string;
    category_type: HubCategoryType;
    created_at: string;
}

export interface HubFolderReminder {
    id: number;
    name: string;
    category_type: HubCategoryType;
    reminder_interval_days: number;
}

/** 归档时可选的收藏夹（info_items） */
export interface HubFolderOption {
    id: number;
    name: string;
    category_type: HubCategoryType;
}

export interface HubQueuedBookmark {
    id: number;
    title: string;
    category_type: HubCategoryType;
    created_at: string;
    parent_item_id?: number | null;
    hub_name?: string | null;
}

export type HubReminderAction = 'calendar' | 'protocol';
export type HubReminderTone = 'warn' | 'info';
export type HubRhythmCategory = 'study' | 'exercise' | 'arts';

export type HubReminderKind = 'default' | 'deadline' | 'friend_contact' | 'rhythm';

export interface HubReminder {
    id: string;
    message: string;
    action?: HubReminderAction;
    tone?: HubReminderTone;
    kind?: HubReminderKind;
    friendId?: number;
    friendScheduledDate?: string;
    deadlineTitle?: string;
    deadlineDate?: string;
    deadlineWhen?: string;
    rhythmCategory?: HubRhythmCategory;
    /** 仅 rhythm 类型：是否已到提醒期限 */
    isOverdue?: boolean;
    /** 仅 rhythm 类型（未到期）：距下次提醒的剩余天数 */
    rhythmDaysUntilNext?: number;
}

export interface HubLongTermTask {
    id: number;
    title: string;
    deadline: string;
    category: string;
    sortTime: number;
}
