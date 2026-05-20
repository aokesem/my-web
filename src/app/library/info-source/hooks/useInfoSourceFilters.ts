import { useState, useMemo, useEffect } from 'react';
import {
    InfoItem,
    InfoBookmark,
    InfoCategory,
    InfoSourceViewMode,
    InfoSidebarNavMode,
    InfoSidebarSelection,
    INFO_UNGROUPED_FOLDER_ID,
} from '../types';
import { isUngroupedBookmark, bookmarkBelongsToHub } from '../lib/infoSourceNav';
import { effectiveDateSortKey } from '../lib/formatEffectiveDateRange';

export function useInfoSourceFilters(
    type: string,
    mockCategories: InfoCategory[],
    mockItems: InfoItem[],
    mockBookmarks: InfoBookmark[],
    isLoading: boolean
) {
    const [viewMode, setViewMode] = useState<InfoSourceViewMode>('folders');
    const [sidebarMode, setSidebarMode] = useState<InfoSidebarNavMode>('folders');
    const [sidebarSelection, setSidebarSelection] = useState<InfoSidebarSelection>(null);
    const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);

    const [sortBy, setSortBy] = useState<'effective_date' | 'created_at'>('created_at');
    const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
    const [pinFavorites, setPinFavorites] = useState(true);

    const [highlightedCardId, setHighlightedCardId] = useState<number | null>(null);
    const [pendingScrollId, setPendingScrollId] = useState<number | null>(null);

    const currentCategories = useMemo(
        () => mockCategories.filter((c) => c.category_type === type),
        [mockCategories, type]
    );

    const selectAllHubs = () => {
        setSidebarSelection(null);
        setViewMode('folders');
    };

    const selectHub = (hubId: number) => {
        setSidebarSelection(hubId);
        setViewMode('entries');
    };

    const selectUngroupedEntries = () => {
        setSidebarSelection(INFO_UNGROUPED_FOLDER_ID);
        setViewMode('entries');
    };

    const allFilteredItems = useMemo(() => {
        let sorted = [...mockItems];

        if (selectedCategoryId !== null) {
            sorted = sorted.filter((item) => item.category_ids.includes(selectedCategoryId));
        }

        sorted.sort((a, b) => {
            if (pinFavorites) {
                if (a.is_favorited && !b.is_favorited) return -1;
                if (!a.is_favorited && b.is_favorited) return 1;
            }
            if (a.sort_order !== b.sort_order) {
                return b.sort_order - a.sort_order;
            }
            const timeA = new Date(a.created_at).getTime();
            const timeB = new Date(b.created_at).getTime();
            return sortOrder === 'desc' ? timeB - timeA : timeA - timeB;
        });

        return sorted;
    }, [mockItems, selectedCategoryId, sortOrder, pinFavorites]);

    const allFilteredBookmarks = useMemo(() => {
        if (viewMode !== 'entries') return [];

        let sorted = [...mockBookmarks];

        if (sidebarSelection === INFO_UNGROUPED_FOLDER_ID) {
            sorted = sorted.filter(isUngroupedBookmark);
        } else if (typeof sidebarSelection === 'number') {
            sorted = sorted.filter((b) => bookmarkBelongsToHub(b, sidebarSelection));
        }

        if (selectedCategoryId !== null) {
            sorted = sorted.filter((b) => b.category_id === selectedCategoryId);
        }

        sorted.sort((a, b) => {
            if (pinFavorites) {
                if (a.is_favorited && !b.is_favorited) return -1;
                if (!a.is_favorited && b.is_favorited) return 1;
            }
            const timeA =
                sortBy === 'effective_date'
                    ? effectiveDateSortKey(a)
                    : new Date(a.created_at).getTime();
            const timeB =
                sortBy === 'effective_date'
                    ? effectiveDateSortKey(b)
                    : new Date(b.created_at).getTime();
            return sortOrder === 'desc' ? timeB - timeA : timeA - timeB;
        });

        return sorted;
    }, [
        mockBookmarks,
        viewMode,
        sidebarSelection,
        selectedCategoryId,
        sortBy,
        sortOrder,
        pinFavorites,
    ]);

    const queuedBookmarks = useMemo(() => {
        return mockBookmarks
            .filter((b) => b.is_queued)
            .map((bookmark) => {
                let thumb = '';
                if (bookmark.parent_item_id) {
                    const pItem = mockItems.find((i) => i.id === bookmark.parent_item_id);
                    thumb = pItem?.image_url || '';
                }
                return { ...bookmark, image_url: thumb };
            });
    }, [mockBookmarks, mockItems]);

    const activeHub =
        typeof sidebarSelection === 'number'
            ? mockItems.find((i) => i.id === sidebarSelection) ?? null
            : null;

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
            if (isUngroupedBookmark(bookmark)) {
                selectUngroupedEntries();
            } else if (bookmark.parent_item_id) {
                selectHub(bookmark.parent_item_id);
            }
            setSelectedCategoryId(bookmark.category_id || null);

            const tryScroll = () => {
                const el = document.getElementById(`bookmark-card-${id}`);
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            };
            setTimeout(tryScroll, 150);
            return;
        }

        const item = mockItems.find((i) => i.id === id);
        if (!item) return;

        selectAllHubs();
        const el = document.getElementById(`info-card-${id}`);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            setHighlightedCardId(id);
            setTimeout(() => setHighlightedCardId(null), 1500);
        } else {
            setSelectedCategoryId(item.category_ids[0] || null);
            setPendingScrollId(id);
        }
    };

    return {
        viewMode,
        setViewMode,
        sidebarMode,
        setSidebarMode,
        sidebarSelection,
        setSidebarSelection,
        selectAllHubs,
        selectHub,
        selectUngroupedEntries,
        activeHub,
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
        queuedBookmarks,
        scrollToCard,
    };
}
