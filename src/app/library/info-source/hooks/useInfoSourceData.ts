import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import { clearedAtForImmediateReminder } from '@/lib/infoItemReminder';
import { InfoCategory, InfoItem, InfoBookmark } from '../types';
import type { FolderReminderSettingsPayload } from '../components/FolderSettingsModal';

export function useInfoSourceData(type: string, isAdmin: boolean) {
    const [isLoading, setIsLoading] = useState(true);
    const [mockCategories, setCategories] = useState<InfoCategory[]>([]);
    const [mockItems, setItems] = useState<InfoItem[]>([]);
    const [mockBookmarks, setBookmarks] = useState<InfoBookmark[]>([]);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [catRes, itemsRes, bookmarksRes] = await Promise.all([
                supabase.from('info_categories').select('*'),
                supabase
                    .from('info_items')
                    .select('*, info_item_categories(category_id)')
                    .eq('category_type', type)
                    .order('sort_order', { ascending: true }),
                supabase
                    .from('info_bookmarks')
                    .select('*')
                    .eq('category_type', type)
                    .order('created_at', { ascending: false }),
            ]);

            if (catRes.data) setCategories(catRes.data);
            if (itemsRes.error) {
                console.error('info_items fetch error:', itemsRes.error);
            } else if (itemsRes.data) {
                const parsedItems: InfoItem[] = itemsRes.data.map((item) => ({
                    ...item,
                    reminder_interval_days: item.reminder_interval_days ?? 0,
                    last_reminder_cleared_at: item.last_reminder_cleared_at ?? null,
                    category_ids: item.info_item_categories
                        ? item.info_item_categories.map((ic: { category_id: number }) => ic.category_id)
                        : [],
                }));
                setItems(parsedItems);
            }
            if (bookmarksRes.data) {
                setBookmarks(bookmarksRes.data);
            }
        } catch (error) {
            console.error('Failed to fetch data', error);
        } finally {
            setIsLoading(false);
        }
    }, [type]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const requireAdmin = useCallback(() => {
        if (!isAdmin) {
            toast.warning('只有本人才能修改信息溯源。');
            return false;
        }
        return true;
    }, [isAdmin]);

    const toggleStatus = async (
        e: React.MouseEvent | null,
        id: number,
        field: 'is_favorited' | 'is_queued'
    ) => {
        e?.stopPropagation();
        if (!requireAdmin()) return;
        const item = mockItems.find((i) => i.id === id);
        if (!item) return;

        const newValue = !item[field];
        setItems((prev) => prev.map((i) => (i.id === id ? { ...i, [field]: newValue } : i)));

        const { error } = await supabase.from('info_items').update({ [field]: newValue }).eq('id', id);
        if (error) {
            console.error(`Failed to update ${field}`, error);
            setItems((prev) => prev.map((i) => (i.id === id ? { ...i, [field]: !newValue } : i)));
        }
    };

    const toggleBookmarkStatus = async (
        e: React.MouseEvent | null,
        id: number,
        field: 'is_favorited' | 'is_queued' | 'is_read'
    ) => {
        e?.stopPropagation();
        if (!requireAdmin()) return;
        const item = mockBookmarks.find((i) => i.id === id);
        if (!item) return;

        const newValue = !item[field];
        setBookmarks((prev) => prev.map((i) => (i.id === id ? { ...i, [field]: newValue } : i)));

        const { error } = await supabase.from('info_bookmarks').update({ [field]: newValue }).eq('id', id);
        if (error) {
            console.error(`Failed to update ${field}`, error);
            setBookmarks((prev) => prev.map((i) => (i.id === id ? { ...i, [field]: !newValue } : i)));
            if (field === 'is_queued') {
                toast.error('待看状态保存失败，请检查网络或数据库权限');
            }
        }
    };

    const handleReorderItems = async (newOrder: InfoItem[]) => {
        if (!requireAdmin()) return;
        const updatedOrder = newOrder.map((item, index) => ({
            ...item,
            sort_order: index,
        }));
        setItems(updatedOrder);

        const updates = updatedOrder.map((item) => ({
            id: item.id,
            category_type: item.category_type,
            name: item.name,
            sort_order: item.sort_order,
        }));
        try {
            const { error } = await supabase.from('info_items').upsert(updates);
            if (error) throw error;
        } catch (error) {
            console.error('Failed to update items order:', error);
            toast.error('收藏夹排序保存失败');
        }
    };

    const updateItemReminderSettings = async (
        itemId: number,
        payload: FolderReminderSettingsPayload
    ) => {
        if (!requireAdmin()) throw new Error('只有本人才能修改信息溯源。');
        const existing = mockItems.find((i) => i.id === itemId);
        if (!existing) return;

        const updatePayload: Record<string, unknown> = {
            name: payload.name,
            reminder_interval_days: payload.reminder_interval_days,
        };
        const intervalChanged =
            (existing.reminder_interval_days ?? 0) !== payload.reminder_interval_days;
        if (intervalChanged && payload.reminder_interval_days > 0) {
            updatePayload.last_reminder_cleared_at = clearedAtForImmediateReminder(
                payload.reminder_interval_days
            );
        }

        const { data, error } = await supabase
            .from('info_items')
            .update(updatePayload)
            .eq('id', itemId)
            .select('*, info_item_categories(category_id)')
            .single();

        if (error) throw error;

        const parsed: InfoItem = {
            ...data,
            reminder_interval_days: data.reminder_interval_days ?? 0,
            last_reminder_cleared_at: data.last_reminder_cleared_at ?? null,
            category_ids: data.info_item_categories
                ? data.info_item_categories.map((ic: { category_id: number }) => ic.category_id)
                : existing.category_ids,
        };

        setItems((prev) => prev.map((i) => (i.id === itemId ? parsed : i)));
    };

    return {
        isLoading,
        mockCategories,
        mockItems,
        setItems,
        mockBookmarks,
        setBookmarks,
        fetchData,
        toggleStatus,
        toggleBookmarkStatus,
        handleReorderItems,
        updateItemReminderSettings,
    };
}
