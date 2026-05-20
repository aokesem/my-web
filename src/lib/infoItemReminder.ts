import { addCalendarDays, getHubDayKey } from '@/app/profile/components/info-hub/hubDay';

export const FOLDER_REMINDER_PRESETS = [0, 7, 14, 30] as const;

export type FolderReminderItem = {
    id: number;
    name: string;
    category_type: string;
    reminder_interval_days: number;
    last_reminder_cleared_at: string | null;
    created_at?: string;
};

export function daysBetweenDateKeys(fromKey: string, toKey: string): number {
    const [fy, fm, fd] = fromKey.split('-').map(Number);
    const [ty, tm, td] = toKey.split('-').map(Number);
    const a = new Date(fy, fm - 1, fd).getTime();
    const b = new Date(ty, tm - 1, td).getTime();
    return Math.round((b - a) / (24 * 60 * 60 * 1000));
}

export function getFolderReminderAnchorDate(item: FolderReminderItem): string {
    if (item.last_reminder_cleared_at) {
        return item.last_reminder_cleared_at.slice(0, 10);
    }
    if (item.created_at) {
        return item.created_at.slice(0, 10);
    }
    return getHubDayKey();
}

export function isFolderReminderDue(
    item: FolderReminderItem,
    todayKey = getHubDayKey()
): boolean {
    const interval = item.reminder_interval_days ?? 0;
    if (interval <= 0) return false;
    const anchor = getFolderReminderAnchorDate(item);
    return daysBetweenDateKeys(anchor, todayKey) >= interval;
}

export function getDueFolderReminders(
    items: FolderReminderItem[],
    todayKey = getHubDayKey()
): FolderReminderItem[] {
    return items
        .filter((item) => isFolderReminderDue(item, todayKey))
        .sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'));
}

export function formatFolderReminderInterval(days: number): string {
    if (days <= 0) return '不提醒';
    return `每 ${days} 天`;
}

/** 将「上次清除日」设为 interval 天前，使保存后信息清单立即显示到期提醒 */
export function clearedAtForImmediateReminder(
    intervalDays: number,
    todayKey = getHubDayKey()
): string {
    return addCalendarDays(todayKey, -intervalDays);
}
