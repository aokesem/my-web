import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import { InfoSourceGroup, InfoCategory, InfoItem, InfoBookmark } from '../types';

export function useInfoSourceData(type: string) {
    const [isLoading, setIsLoading] = useState(true);
    const [mockGroups, setGroups] = useState<InfoSourceGroup[]>([]);
    const [mockCategories, setCategories] = useState<InfoCategory[]>([]);
    const [mockItems, setItems] = useState<InfoItem[]>([]);
    const [mockBookmarks, setBookmarks] = useState<InfoBookmark[]>([]);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [groupRes, catRes, itemsRes, bookmarksRes] = await Promise.all([
                supabase.from('info_source_groups').select('*').eq('category_type', type).order('sort_order', { ascending: true }),
                supabase.from('info_categories').select('*'),
                supabase.from('info_items')
                    .select('*, info_item_categories(category_id)')
                    .eq('category_type', type),
                supabase.from('info_bookmarks').select('*').eq('category_type', type).order('created_at', { ascending: false })
            ]);

            if (groupRes.data) {
                setGroups(groupRes.data);
            }
            if (catRes.data) setCategories(catRes.data);
            
            if (itemsRes.data) {
                const parsedItems: InfoItem[] = itemsRes.data.map(item => ({
                    ...item,
                    category_ids: item.info_item_categories 
                        ? item.info_item_categories.map((ic: any) => ic.category_id) 
                        : []
                }));
                setItems(parsedItems);
            }
            if (bookmarksRes.data) {
                setBookmarks(bookmarksRes.data);
            }
        } catch (error) {
            console.error("Failed to fetch data", error);
        } finally {
            setIsLoading(false);
        }
    }, [type]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const toggleStatus = async (e: React.MouseEvent | null, id: number, field: 'is_favorited' | 'is_queued') => {
        e?.stopPropagation();
        const item = mockItems.find(i => i.id === id);
        if (!item) return;
        
        const newValue = !item[field];
        setItems(prev => prev.map(i => i.id === id ? { ...i, [field]: newValue } : i));

        const { error } = await supabase.from('info_items').update({ [field]: newValue }).eq('id', id);
        if (error) {
            console.error(`Failed to update ${field}`, error);
            setItems(prev => prev.map(i => i.id === id ? { ...i, [field]: !newValue } : i));
        }
    };

    const toggleBookmarkStatus = async (e: React.MouseEvent | null, id: number, field: 'is_favorited' | 'is_queued' | 'is_read') => {
        e?.stopPropagation();
        const item = mockBookmarks.find(i => i.id === id);
        if (!item) return;
        
        const newValue = !item[field];
        setBookmarks(prev => prev.map(i => i.id === id ? { ...i, [field]: newValue } : i));
        
        const { error } = await supabase.from('info_bookmarks').update({ [field]: newValue }).eq('id', id);
        if (error) {
            console.error(`Failed to update ${field}`, error);
            setBookmarks(prev => prev.map(i => i.id === id ? { ...i, [field]: !newValue } : i));
            if (field === 'is_queued') {
                toast.error('待看状态保存失败，请检查网络或数据库权限');
            }
        }
    };

    const handleReorderGroups = async (newOrder: InfoSourceGroup[]) => {
        const updatedOrder = newOrder.map((group, index) => ({
            ...group,
            sort_order: index
        }));
        setGroups(updatedOrder);

        const updates = updatedOrder.map(group => ({
            id: group.id,
            category_type: group.category_type,
            name: group.name,
            sort_order: group.sort_order
        }));
        try {
            const { error } = await supabase.from('info_source_groups').upsert(updates);
            if (error) throw error;
        } catch (error) {
            console.error("Failed to update groups order:", error);
            toast.error("分组排序保存失败");
        }
    };

    return {
        isLoading,
        mockGroups,
        setGroups,
        mockCategories,
        mockItems,
        setItems,
        mockBookmarks,
        setBookmarks,
        fetchData,
        toggleStatus,
        toggleBookmarkStatus,
        handleReorderGroups
    };
}
