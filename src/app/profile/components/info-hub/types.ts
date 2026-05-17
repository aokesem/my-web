export type HubCategoryType = 'study' | 'life';

export interface HubCapture {
    id: number;
    title: string;
    category_type: HubCategoryType;
    created_at: string;
}

export interface HubQueuedBookmark {
    id: number;
    title: string;
    category_type: HubCategoryType;
    created_at: string;
}

export type HubReminderAction = 'calendar' | 'protocol';
export type HubReminderTone = 'warn' | 'info';

export interface HubReminder {
    id: string;
    message: string;
    action?: HubReminderAction;
    tone?: HubReminderTone;
}

export interface HubLongTermTask {
    id: number;
    title: string;
    deadline: string;
    category: string;
    sortTime: number;
}
