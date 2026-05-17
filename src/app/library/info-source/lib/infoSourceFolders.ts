import { InfoItem, InfoBookmark, INFO_UNGROUPED_FOLDER_ID } from '../types';

export function resolveItemFolderId(item: InfoItem): number {
    if (item.group_id != null && item.group_id > 0) return item.group_id;
    return INFO_UNGROUPED_FOLDER_ID;
}

export function itemBelongsToFolder(item: InfoItem, folderId: number): boolean {
    return resolveItemFolderId(item) === folderId;
}

export function bookmarkBelongsToFolder(
    b: InfoBookmark,
    folderId: number,
    items: InfoItem[]
): boolean {
    if (b.group_id != null && b.group_id > 0) {
        if (folderId === INFO_UNGROUPED_FOLDER_ID) return false;
        return b.group_id === folderId;
    }
    if (b.parent_item_id) {
        const p = items.find(i => i.id === b.parent_item_id);
        if (p) return itemBelongsToFolder(p, folderId);
    }
    return folderId === INFO_UNGROUPED_FOLDER_ID;
}

export function resolveBookmarkFolderId(b: InfoBookmark, items: InfoItem[]): number {
    if (b.group_id != null && b.group_id > 0) return b.group_id;
    if (b.parent_item_id) {
        const p = items.find(i => i.id === b.parent_item_id);
        if (p) return resolveItemFolderId(p);
    }
    return INFO_UNGROUPED_FOLDER_ID;
}
