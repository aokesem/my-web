import { useState, useMemo, useEffect } from 'react';
import { InfoItem, InfoSource, InfoBookmark, InfoCategory } from '../types';

export function useInfoSourceFilters(
    type: string,
    mockCategories: InfoCategory[],
    mockItems: InfoItem[],
    mockBookmarks: InfoBookmark[],
    mockSources: InfoSource[],
    isLoading: boolean
) {
    const [viewMode, setViewMode] = useState<'hub' | 'bookmarks'>('hub');
    const [sidebarMode, setSidebarMode] = useState<'source' | 'queue'>('source');
    const [selectedParentItemId, setSelectedParentItemId] = useState<number | null>(null);
    const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
    const [selectedSourceId, setSelectedSourceId] = useState<number | null>(null);
    const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
    
    const [sortBy, setSortBy] = useState<'info_date' | 'created_at'>('created_at');
    const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
    const [pinFavorites, setPinFavorites] = useState(true);

    const [highlightedCardId, setHighlightedCardId] = useState<number | null>(null);
    const [pendingScrollId, setPendingScrollId] = useState<number | null>(null);

    const currentCategories = useMemo(() => mockCategories.filter(c => c.category_type === type), [mockCategories, type]);
    
    const allFilteredItems = useMemo(() => {
        let sorted = [...mockItems];
        
        if (selectedSourceId !== null) {
            sorted = sorted.filter(item => item.source_id === selectedSourceId);
        } else if (selectedGroupId !== null) {
            const groupSourceIds = mockSources.filter(s => s.group_id === selectedGroupId).map(s => s.id);
            sorted = sorted.filter(item => 
                (item.source_id && groupSourceIds.includes(item.source_id)) || 
                (item.group_id === selectedGroupId)
            );
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
    }, [mockItems, selectedSourceId, selectedGroupId, mockSources, selectedCategoryId, sortBy, sortOrder, pinFavorites]);

    const allFilteredBookmarks = useMemo(() => {
        let sorted = [...mockBookmarks];
        
        if (selectedParentItemId !== null) {
            sorted = sorted.filter(b => b.parent_item_id === selectedParentItemId);
        } else if (selectedSourceId !== null) {
            sorted = sorted.filter(b => b.source_id === selectedSourceId);
        } else if (selectedGroupId !== null) {
            const groupSourceIds = mockSources.filter(s => s.group_id === selectedGroupId).map(s => s.id);
            sorted = sorted.filter(b => 
                (b.source_id && groupSourceIds.includes(b.source_id)) || 
                (b.group_id === selectedGroupId) ||
                (b.parent_item_id && mockItems.some(i => i.id === b.parent_item_id && ((i.source_id && groupSourceIds.includes(i.source_id)) || i.group_id === selectedGroupId)))
            );
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
    }, [mockBookmarks, mockItems, selectedParentItemId, selectedSourceId, selectedGroupId, mockSources, selectedCategoryId, sortBy, sortOrder, pinFavorites]);

    const queuedItems = useMemo(() => mockItems.filter(i => i.is_queued), [mockItems]);
    const queuedBookmarks = useMemo(() => {
        return mockBookmarks.filter(b => b.is_queued).map(bookmark => {
            let thumb = '';
            if (bookmark.parent_item_id) {
                const pItem = mockItems.find(i => i.id === bookmark.parent_item_id);
                thumb = pItem?.image_url || mockSources.find(s => s.id === pItem?.source_id)?.image_url || '';
            } else if (bookmark.source_id) {
                const sItem = mockSources.find(s => s.id === bookmark.source_id);
                thumb = sItem?.image_url || '';
            }
            return {
                ...bookmark,
                image_url: thumb
            };
        });
    }, [mockBookmarks, mockItems, mockSources]);

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
        if (viewMode === 'bookmarks') {
            const bookmark = mockBookmarks.find(b => b.id === id);
            if (!bookmark) return;
            const el = document.getElementById(`bookmark-card-${id}`);
            if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            } else {
                setSelectedParentItemId(bookmark.parent_item_id || null);
                setSelectedSourceId(bookmark.source_id || null);
                setSelectedGroupId(bookmark.group_id || null);
                setSelectedCategoryId(bookmark.category_id || null);
            }
        } else {
            const item = mockItems.find(i => i.id === id);
            if (!item) return;

            const el = document.getElementById(`info-card-${id}`);
            if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                setHighlightedCardId(id);
                setTimeout(() => setHighlightedCardId(null), 1500);
            } else {
                setSelectedSourceId(item.source_id || null);
                setSelectedCategoryId(item.category_ids[0] || null);
                setPendingScrollId(id);
            }
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
        selectedSourceId,
        setSelectedSourceId,
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
