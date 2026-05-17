import { useState, useMemo, useEffect } from 'react';
import {
    InfoItem,
    InfoBookmark,
    InfoCategory,
    InfoSourceViewMode,
    InfoSidebarNavMode,
} from '../types';
import { itemBelongsToFolder, bookmarkBelongsToFolder, resolveItemFolderId, resolveBookmarkFolderId } from '../lib/infoSourceFolders';

export function useInfoSourceFilters(
    type: string,
    mockCategories: InfoCategory[],
    mockItems: InfoItem[],
    mockBookmarks: InfoBookmark[],
    isLoading: boolean
) {
    const [viewMode, setViewMode] = useState<InfoSourceViewMode>('folders');
    const [sidebarMode, setSidebarMode] = useState<InfoSidebarNavMode>('folders');
    const [selectedParentItemId, setSelectedParentItemId] = useState<number | null>(null);
    const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
    const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);

    const [sortBy, setSortBy] = useState<'info_date' | 'created_at'>('created_at');
    const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
    const [pinFavorites, setPinFavorites] = useState(true);

    const [highlightedCardId, setHighlightedCardId] = useState<number | null>(null);
    const [pendingScrollId, setPendingScrollId] = useState<number | null>(null);

    const currentCategories = useMemo(() => mockCategories.filter(c => c.category_type === type), [mockCategories, type]);

    const allFilteredItems = useMemo(() => {
        let sorted = [...mockItems];

        if (selectedGroupId !== null) {
            sorted = sorted.filter(item => itemBelongsToFolder(item, selectedGroupId));
        }

        if (selectedCategoryId !== null) {
            sorted = sorted.filter(item => item.category_ids.includes(selectedCategoryId));
        }

        sorted.sort((a, b) => {
            if (pinFavorites) {
                if (a.is_favorited && !b.is_favorited) return -1;
                if (!a.is_favorited && b.is_favorited) return 1;
            }

            if (a.sort_order !== b.sort_order) {
                return b.sort_order - a.sort_order;
            }

            const timeA = new Date(a[sortBy] || a.created_at).getTime();
            const timeB = new Date(b[sortBy] || b.created_at).getTime();

            return sortOrder === 'desc' ? timeB - timeA : timeA - timeB;
        });

        return sorted;
    }, [mockItems, selectedGroupId, selectedCategoryId, sortBy, sortOrder, pinFavorites]);

    const allFilteredBookmarks = useMemo(() => {
        let sorted = [...mockBookmarks];

        if (selectedParentItemId !== null) {
            sorted = sorted.filter(b => b.parent_item_id === selectedParentItemId);
        } else if (selectedGroupId !== null) {
            sorted = sorted.filter(b => bookmarkBelongsToFolder(b, selectedGroupId, mockItems));
        }

        if (selectedCategoryId !== null) {
            sorted = sorted.filter(b => b.category_id === selectedCategoryId);
        }

        sorted.sort((a, b) => {
            if (pinFavorites) {
                if (a.is_favorited && !b.is_favorited) return -1;
                if (!a.is_favorited && b.is_favorited) return 1;
            }
            const timeA = new Date(a[sortBy] || a.created_at).getTime();
            const timeB = new Date(b[sortBy] || b.created_at).getTime();
            return sortOrder === 'desc' ? timeB - timeA : timeA - timeB;
        });

        return sorted;
    }, [mockBookmarks, mockItems, selectedParentItemId, selectedGroupId, selectedCategoryId, sortBy, sortOrder, pinFavorites]);

    const queuedItems = useMemo(() => mockItems.filter(i => i.is_queued), [mockItems]);
    const queuedBookmarks = useMemo(() => {
        return mockBookmarks.filter(b => b.is_queued).map(bookmark => {
            let thumb = '';
            if (bookmark.parent_item_id) {
                const pItem = mockItems.find(i => i.id === bookmark.parent_item_id);
                thumb = pItem?.image_url || '';
            }
            return {
                ...bookmark,
                image_url: thumb
            };
        });
    }, [mockBookmarks, mockItems]);

    useEffect(() => {
        if (pendingScrollId && !isLoading) {
            const timer = setTimeout(() => {
                const el = document.getElementById(`info-card-${pendingScrollId}`);
                if (el) {
                    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    setHighlightedCardId(pendingScrollId);
                    setTimeout(() => setHighlightedCardId(null), 1500);
                    setPendingScrollId(null);
                }
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [pendingScrollId, allFilteredItems, isLoading]);

    const scrollToCard = (id: number) => {
        const bookmark = mockBookmarks.find((b) => b.id === id);
        if (bookmark) {
            if (viewMode !== 'entries') {
                setViewMode('entries');
            }
            setSelectedParentItemId(bookmark.parent_item_id || null);
            setSelectedGroupId(resolveBookmarkFolderId(bookmark, mockItems));
            setSelectedCategoryId(bookmark.category_id || null);

            const tryScroll = () => {
                const el = document.getElementById(`bookmark-card-${id}`);
                if (el) {
                    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            };
            setTimeout(tryScroll, 150);
            return;
        }

        const item = mockItems.find((i) => i.id === id);
        if (!item) return;

        const el = document.getElementById(`info-card-${id}`);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            setHighlightedCardId(id);
            setTimeout(() => setHighlightedCardId(null), 1500);
        } else {
            setSelectedGroupId(resolveItemFolderId(item));
            setSelectedCategoryId(item.category_ids[0] || null);
            setPendingScrollId(id);
        }
    };

    return {
        viewMode,
        setViewMode,
        sidebarMode,
        setSidebarMode,
        selectedParentItemId,
        setSelectedParentItemId,
        selectedGroupId,
        setSelectedGroupId,
        selectedCategoryId,
        setSelectedCategoryId,
        sortBy,
        setSortBy,
        sortOrder,
        setSortOrder,
        pinFavorites,
        setPinFavorites,
        highlightedCardId,
        currentCategories,
        allFilteredItems,
        allFilteredBookmarks,
        queuedItems,
        queuedBookmarks,
        scrollToCard
    };
}
