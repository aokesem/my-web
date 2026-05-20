import { InfoBookmark, INFO_UNGROUPED_FOLDER_ID } from '../types';

export function isUngroupedBookmark(b: InfoBookmark): boolean {
    return b.parent_item_id == null || b.parent_item_id <= 0;
}

export function bookmarkBelongsToHub(b: InfoBookmark, hubId: number): boolean {
    return b.parent_item_id === hubId;
}

export function countBookmarksInHub(bookmarks: InfoBookmark[], hubId: number): number {
    return bookmarks.filter((b) => bookmarkBelongsToHub(b, hubId)).length;
}

export function countUngroupedBookmarks(bookmarks: InfoBookmark[]): number {
    return bookmarks.filter(isUngroupedBookmark).length;
}

export { INFO_UNGROUPED_FOLDER_ID };
