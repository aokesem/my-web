import { InfoItem, InfoSource, InfoBookmark, INFO_UNGROUPED_FOLDER_ID } from '../types';

export function resolveItemFolderId(item: InfoItem, sources: InfoSource[]): number {
    if (item.group_id != null && item.group_id > 0) return item.group_id;
    if (item.source_id) {
        const src = sources.find(s => s.id === item.source_id);
        if (src?.group_id != null) return src.group_id;
    }
    return INFO_UNGROUPED_FOLDER_ID;
}

export function itemBelongsToFolder(item: InfoItem, folderId: number, sources: InfoSource[]): boolean {
    return resolveItemFolderId(item, sources) === folderId;
}

export function bookmarkBelongsToFolder(
    b: InfoBookmark,
    folderId: number,
    sources: InfoSource[],
    items: InfoItem[]
): boolean {
    if (b.group_id != null && b.group_id > 0) {
        if (folderId === INFO_UNGROUPED_FOLDER_ID) return false;
        return b.group_id === folderId;
    }
    if (b.parent_item_id) {
        const p = items.find(i => i.id === b.parent_item_id);
        if (p) return itemBelongsToFolder(p, folderId, sources);
    }
    if (b.source_id) {
        const src = sources.find(s => s.id === b.source_id);
        if (folderId === INFO_UNGROUPED_FOLDER_ID) return !src?.group_id;
        return src?.group_id === folderId;
    }
    return folderId === INFO_UNGROUPED_FOLDER_ID;
}

export function resolveBookmarkFolderId(b: InfoBookmark, items: InfoItem[], sources: InfoSource[]): number {
    if (b.group_id != null && b.group_id > 0) return b.group_id;
    if (b.parent_item_id) {
        const p = items.find(i => i.id === b.parent_item_id);
        if (p) return resolveItemFolderId(p, sources);
    }
    if (b.source_id) {
        const src = sources.find(s => s.id === b.source_id);
        if (src?.group_id != null) return src.group_id;
    }
    return INFO_UNGROUPED_FOLDER_ID;
}
