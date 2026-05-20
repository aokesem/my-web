import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import {
    InfoItem,
    InfoBookmark,
    InfoSourceViewMode,
    InfoSidebarSelection,
} from '../types';

function parseEffectiveDates(start: string, end: string): {
    effective_date_start: string | null;
    effective_date_end: string | null;
} | { error: string } {
    const s = start.trim() || null;
    const e = end.trim() || null;
    if (s && e && e < s) {
        return { error: '结束日期不能早于开始日期' };
    }
    return { effective_date_start: s, effective_date_end: e };
}

export function useInfoSourceModals(
    type: string,
    viewMode: InfoSourceViewMode,
    sidebarSelection: InfoSidebarSelection,
    setItems: React.Dispatch<React.SetStateAction<InfoItem[]>>,
    setBookmarks: React.Dispatch<React.SetStateAction<InfoBookmark[]>>,
    mockItems: InfoItem[]
) {
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
    const [editingItem, setEditingItem] = useState<InfoItem | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        source_id: '',
        category_id: '',
        description: '',
        image_url: '',
    });

    const [isBookmarkModalOpen, setIsBookmarkModalOpen] = useState(false);
    const [bookmarkFormMode, setBookmarkFormMode] = useState<'create' | 'edit'>('create');
    const [editingBookmark, setEditingBookmark] = useState<InfoBookmark | null>(null);
    const [bookmarkFormData, setBookmarkFormData] = useState({
        title: '',
        url: '',
        description: '',
        category_id: '',
        source_id: '',
        parent_item_id: '',
        effective_date_start: '',
        effective_date_end: '',
    });

    const defaultParentItemId = (): string => {
        if (typeof sidebarSelection === 'number') {
            return sidebarSelection.toString();
        }
        return '';
    };

    const handleCreate = () => {
        if (viewMode === 'entries') {
            setBookmarkFormMode('create');
            setEditingBookmark(null);
            setBookmarkFormData({
                title: '',
                url: '',
                description: '',
                category_id: '',
                source_id: '',
                parent_item_id: defaultParentItemId(),
                effective_date_start: '',
                effective_date_end: '',
            });
            setIsBookmarkModalOpen(true);
        } else {
            setFormMode('create');
            setEditingItem(null);
            setFormData({
                name: '',
                source_id: '',
                category_id: '',
                description: '',
                image_url: '',
            });
            setIsFormModalOpen(true);
        }
    };

    const handleEditItem = (item: InfoItem) => {
        setFormMode('edit');
        setEditingItem(item);
        setFormData({
            name: item.name,
            description: item.description || '',
            source_id: '',
            category_id: item.category_ids.length > 0 ? item.category_ids[0].toString() : '',
            image_url: item.image_url || '',
        });
        setIsFormModalOpen(true);
    };

    const handleEditBookmark = (bookmark: InfoBookmark) => {
        setBookmarkFormMode('edit');
        setEditingBookmark(bookmark);
        setBookmarkFormData({
            title: bookmark.title,
            url: bookmark.url || '',
            description: bookmark.description || '',
            category_id: bookmark.category_id ? bookmark.category_id.toString() : '',
            source_id: '',
            parent_item_id: bookmark.parent_item_id ? bookmark.parent_item_id.toString() : '',
            effective_date_start:
                bookmark.effective_date_start?.slice(0, 10) ||
                bookmark.info_date?.slice(0, 10) ||
                '',
            effective_date_end: bookmark.effective_date_end?.slice(0, 10) || '',
        });
        setIsBookmarkModalOpen(true);
    };

    const handleSaveBookmark = async () => {
        if (!bookmarkFormData.title.trim()) return alert('请填写标题');
        const dates = parseEffectiveDates(
            bookmarkFormData.effective_date_start,
            bookmarkFormData.effective_date_end
        );
        if ('error' in dates) return alert(dates.error);

        setIsSaving(true);
        try {
            const payload = {
                category_type: type,
                title: bookmarkFormData.title,
                url: bookmarkFormData.url || null,
                description: bookmarkFormData.description,
                category_id: bookmarkFormData.category_id
                    ? parseInt(bookmarkFormData.category_id, 10)
                    : null,
                source_id: null,
                parent_item_id: bookmarkFormData.parent_item_id
                    ? parseInt(bookmarkFormData.parent_item_id, 10)
                    : null,
                effective_date_start: dates.effective_date_start,
                effective_date_end: dates.effective_date_end,
                info_date: dates.effective_date_start,
            };

            if (bookmarkFormMode === 'create') {
                const { data, error } = await supabase
                    .from('info_bookmarks')
                    .insert(payload)
                    .select()
                    .single();
                if (error) throw error;
                setBookmarks((prev) => [data, ...prev]);
            } else if (bookmarkFormMode === 'edit' && editingBookmark) {
                const { data, error } = await supabase
                    .from('info_bookmarks')
                    .update(payload)
                    .eq('id', editingBookmark.id)
                    .select()
                    .single();
                if (error) throw error;
                setBookmarks((prev) => prev.map((b) => (b.id === editingBookmark.id ? data : b)));
            }
            setIsBookmarkModalOpen(false);
        } catch (error) {
            console.error('Save bookmark error:', error);
            alert('保存失败');
        } finally {
            setIsSaving(false);
        }
    };

    const handleSave = async () => {
        if (!formData.name.trim()) return alert('请填写标题');
        setIsSaving(true);

        try {
            const savePayload = {
                category_type: type,
                name: formData.name,
                source_id: null,
                url: null,
                description: formData.description,
                image_url: formData.image_url,
                info_date: null,
            };

            let savedItem: InfoItem | null = null;

            if (formMode === 'create') {
                const maxOrder = mockItems.reduce((m, i) => Math.max(m, i.sort_order), -1);
                const { data, error } = await supabase
                    .from('info_items')
                    .insert([{ ...savePayload, sort_order: maxOrder + 1 }])
                    .select()
                    .single();

                if (error) throw error;
                const created = data as InfoItem;

                if (formData.category_id) {
                    await supabase.from('info_item_categories').insert({
                        item_id: created.id,
                        category_id: parseInt(formData.category_id, 10),
                    });
                }

                const newItem: InfoItem = {
                    ...created,
                    category_ids: formData.category_id ? [parseInt(formData.category_id, 10)] : [],
                    is_favorited: created.is_favorited ?? false,
                    is_queued: created.is_queued ?? false,
                };
                setItems((prev) => [newItem, ...prev]);
            } else if (formMode === 'edit' && editingItem) {
                const { data, error } = await supabase
                    .from('info_items')
                    .update(savePayload)
                    .eq('id', editingItem.id)
                    .select()
                    .single();

                if (error) throw error;
                savedItem = data as InfoItem;

                await supabase.from('info_item_categories').delete().eq('item_id', editingItem.id);
                if (formData.category_id) {
                    await supabase.from('info_item_categories').insert({
                        item_id: editingItem.id,
                        category_id: parseInt(formData.category_id, 10),
                    });
                }

                setItems((prev) =>
                    prev.map((item) =>
                        item.id === editingItem.id
                            ? {
                                  ...savedItem!,
                                  category_ids: formData.category_id
                                      ? [parseInt(formData.category_id, 10)]
                                      : [],
                              }
                            : item
                    )
                );
            }

            setIsFormModalOpen(false);
        } catch (error) {
            console.error('Save error:', error);
            alert('保存失败，请检查控制台网络报错。');
        } finally {
            setIsSaving(false);
        }
    };

    return {
        isFormModalOpen,
        setIsFormModalOpen,
        formMode,
        formData,
        setFormData,
        isBookmarkModalOpen,
        setIsBookmarkModalOpen,
        bookmarkFormMode,
        bookmarkFormData,
        setBookmarkFormData,
        isSaving,
        handleCreate,
        handleEditItem,
        handleEditBookmark,
        handleSave,
        handleSaveBookmark,
    };
}
