import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { InfoItem, InfoBookmark } from '../types';

export function useInfoSourceModals(
    type: string,
    viewMode: 'hub' | 'bookmarks',
    selectedGroupId: number | null,
    selectedSourceId: number | null,
    selectedParentItemId: number | null,
    setItems: React.Dispatch<React.SetStateAction<InfoItem[]>>,
    setBookmarks: React.Dispatch<React.SetStateAction<InfoBookmark[]>>
) {
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
    const [editingItem, setEditingItem] = useState<InfoItem | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    const [formData, setFormData] = useState({
        name: '', source_id: '', group_id: '', category_id: '', url: '', description: '', image_url: '', info_date: ''
    });

    const [isBookmarkModalOpen, setIsBookmarkModalOpen] = useState(false);
    const [bookmarkFormMode, setBookmarkFormMode] = useState<'create' | 'edit'>('create');
    const [editingBookmark, setEditingBookmark] = useState<InfoBookmark | null>(null);
    const [bookmarkFormData, setBookmarkFormData] = useState({
        title: '', url: '', description: '', category_id: '', group_id: '', source_id: '', parent_item_id: ''
    });

    const handleCreate = () => {
        if (viewMode === 'bookmarks') {
            setBookmarkFormMode('create');
            setEditingBookmark(null);
            setBookmarkFormData({ 
                title: '', url: '', description: '', category_id: '', 
                group_id: selectedGroupId?.toString() || '', 
                source_id: selectedSourceId?.toString() || '', 
                parent_item_id: selectedParentItemId?.toString() || '' 
            });
            setIsBookmarkModalOpen(true);
        } else {
            setFormMode('create');
            setEditingItem(null);
            setFormData({ 
                name: '', 
                source_id: selectedSourceId?.toString() || '', 
                group_id: selectedGroupId?.toString() || '', 
                category_id: '', url: '', description: '', image_url: '', info_date: '' 
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
            url: item.url || '',
            source_id: item.source_id ? item.source_id.toString() : '',
            group_id: item.group_id ? item.group_id.toString() : '',
            category_id: item.category_ids.length > 0 ? item.category_ids[0].toString() : '',
            image_url: item.image_url || '',
            info_date: item.info_date || ''
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
            group_id: bookmark.group_id ? bookmark.group_id.toString() : '',
            source_id: bookmark.source_id ? bookmark.source_id.toString() : '',
            parent_item_id: bookmark.parent_item_id ? bookmark.parent_item_id.toString() : ''
        });
        setIsBookmarkModalOpen(true);
    };

    const handleSaveBookmark = async () => {
        if (!bookmarkFormData.title.trim()) return alert("请填写收藏标题");
        setIsSaving(true);
        try {
            const payload = {
                category_type: type,
                title: bookmarkFormData.title,
                url: bookmarkFormData.url,
                description: bookmarkFormData.description,
                category_id: bookmarkFormData.category_id ? parseInt(bookmarkFormData.category_id) : null,
                group_id: bookmarkFormData.group_id ? parseInt(bookmarkFormData.group_id) : null,
                source_id: bookmarkFormData.source_id ? parseInt(bookmarkFormData.source_id) : null,
                parent_item_id: bookmarkFormData.parent_item_id ? parseInt(bookmarkFormData.parent_item_id) : null,
            };

            if (bookmarkFormMode === 'create') {
                const { data, error } = await supabase.from('info_bookmarks').insert(payload).select().single();
                if (error) throw error;
                setBookmarks(prev => [data, ...prev]);
            } else if (bookmarkFormMode === 'edit' && editingBookmark) {
                const { data, error } = await supabase.from('info_bookmarks').update(payload).eq('id', editingBookmark.id).select().single();
                if (error) throw error;
                setBookmarks(prev => prev.map(b => b.id === editingBookmark.id ? data : b));
            }
            setIsBookmarkModalOpen(false);
        } catch (error) {
            console.error("Save bookmark error:", error);
            alert("收藏保存失败");
        } finally {
            setIsSaving(false);
        }
    };

    const handleSave = async () => {
        if (!formData.name.trim()) return alert("请填写标题");
        setIsSaving(true);

        try {
            const savePayload = {
                category_type: type,
                name: formData.name,
                source_id: formData.source_id ? parseInt(formData.source_id) : null,
                group_id: (!formData.source_id && formData.group_id) ? parseInt(formData.group_id) : null,
                url: formData.url,
                description: formData.description,
                image_url: formData.image_url,
                info_date: formData.info_date || null
            };

            let savedItem: any = null;

            if (formMode === 'create') {
                const { data, error } = await supabase
                    .from('info_items')
                    .insert([savePayload])
                    .select()
                    .single();
                
                if (error) throw error;
                savedItem = data;

                if (formData.category_id) {
                    await supabase.from('info_item_categories').insert({
                        item_id: savedItem.id,
                        category_id: parseInt(formData.category_id)
                    });
                }

                setItems(prev => [{
                    ...savedItem, 
                    category_ids: formData.category_id ? [parseInt(formData.category_id)] : []
                }, ...prev]);

            } else if (formMode === 'edit' && editingItem) {
                const { data, error } = await supabase
                    .from('info_items')
                    .update(savePayload)
                    .eq('id', editingItem.id)
                    .select()
                    .single();
                
                if (error) throw error;
                savedItem = data;

                await supabase.from('info_item_categories').delete().eq('item_id', editingItem.id);
                if (formData.category_id) {
                    await supabase.from('info_item_categories').insert({
                        item_id: editingItem.id,
                        category_id: parseInt(formData.category_id)
                    });
                }

                setItems(prev => prev.map(item => item.id === editingItem.id ? {
                    ...savedItem,
                    category_ids: formData.category_id ? [parseInt(formData.category_id)] : []
                } : item));
            }

            setIsFormModalOpen(false);
        } catch (error) {
            console.error("Save error:", error);
            alert("保存失败，请检查控制台网络报错。");
        } finally {
            setIsSaving(false);
        }
    };

    return {
        isFormModalOpen, setIsFormModalOpen,
        formMode, formData, setFormData,
        isBookmarkModalOpen, setIsBookmarkModalOpen,
        bookmarkFormMode, bookmarkFormData, setBookmarkFormData,
        isSaving,
        handleCreate,
        handleEditItem,
        handleEditBookmark,
        handleSave,
        handleSaveBookmark
    };
}
