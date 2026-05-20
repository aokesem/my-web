"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Library, Plus, Edit2, Trash2, Search, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { ImageUpload } from '@/components/ui/image-upload';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';

type CategoryType = 'study' | 'life';
type AdminTab = 'items' | 'categories';

interface InfoCategory {
    id: number;
    category_type: CategoryType;
    name: string;
    created_at?: string;
}

interface AdminItem {
    id: number;
    category_type: CategoryType;
    name: string;
    description?: string;
    image_url?: string;
    sort_order: number;
    category_ids: number[];
}

function categoryLabels(item: AdminItem, allCategories: InfoCategory[]): string {
    const names = item.category_ids
        .map((id) => allCategories.find((c) => c.id === id)?.name)
        .filter((n): n is string => Boolean(n));
    return names.length > 0 ? names.join('、') : '—';
}

export default function InfoSourceAdminPage() {
    const [activeTab, setActiveTab] = useState<AdminTab>('items');
    const [isLoading, setIsLoading] = useState(true);

    const [categories, setCategories] = useState<InfoCategory[]>([]);
    const [items, setItems] = useState<AdminItem[]>([]);

    const [searchTerm, setSearchTerm] = useState('');
    const [categoryTypeFilter, setCategoryTypeFilter] = useState<'all' | CategoryType>('all');
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
    const [isItemModalOpen, setIsItemModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const [editingCategory, setEditingCategory] = useState<InfoCategory | null>(null);
    const [editingItem, setEditingItem] = useState<AdminItem | null>(null);

    const [categoryForm, setCategoryForm] = useState({ name: '', category_type: 'study' as CategoryType });
    const [itemForm, setItemForm] = useState({
        name: '',
        category_id: '',
        description: '',
        image_url: '',
        category_type: 'study' as CategoryType,
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [catRes, itemsRes] = await Promise.all([
                supabase.from('info_categories').select('*'),
                supabase
                    .from('info_items')
                    .select('*, info_item_categories(category_id)')
                    .order('sort_order', { ascending: true }),
            ]);

            if (catRes.error) console.error('Categories error:', catRes.error);
            if (itemsRes.error) console.error('Items error:', itemsRes.error);

            if (catRes.data) setCategories(catRes.data);
            if (itemsRes.data) {
                setItems(
                    itemsRes.data.map((item: Record<string, unknown>) => ({
                        ...item,
                        sort_order: typeof item.sort_order === 'number' ? item.sort_order : 0,
                        category_ids:
                            (item.info_item_categories as { category_id: number }[] | undefined)?.map(
                                (ic) => ic.category_id
                            ) || [],
                    })) as AdminItem[]
                );
            }
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : String(error);
            toast.error('加载数据失败: ' + message);
        } finally {
            setIsLoading(false);
        }
    };

    const openCategoryModal = (cat: InfoCategory | null = null) => {
        if (cat) {
            setEditingCategory(cat);
            setCategoryForm({ name: cat.name, category_type: cat.category_type });
        } else {
            setEditingCategory(null);
            setCategoryForm({ name: '', category_type: 'study' });
        }
        setIsCategoryModalOpen(true);
    };

    const handleSaveCategory = async () => {
        if (!categoryForm.name.trim()) return toast.error('请输入名称');
        setIsSaving(true);
        try {
            if (editingCategory) {
                const { error } = await supabase
                    .from('info_categories')
                    .update({ name: categoryForm.name, category_type: categoryForm.category_type })
                    .eq('id', editingCategory.id);
                if (error) throw error;
                toast.success('功能专栏已更新');
            } else {
                const { error } = await supabase
                    .from('info_categories')
                    .insert([{ name: categoryForm.name, category_type: categoryForm.category_type }]);
                if (error) throw error;
                toast.success('功能专栏已创建');
            }
            setIsCategoryModalOpen(false);
            fetchData();
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : String(error);
            toast.error('保存失败: ' + message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteCategory = async (id: number) => {
        if (!confirm('确定删除此功能专栏吗？')) return;
        try {
            const { error } = await supabase.from('info_categories').delete().eq('id', id);
            if (error) throw error;
            toast.success('已删除');
            fetchData();
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : String(error);
            toast.error('删除失败: ' + message);
        }
    };

    const openItemModal = (item: AdminItem | null = null) => {
        if (item) {
            setEditingItem(item);
            setItemForm({
                name: item.name || '',
                category_id: item.category_ids?.[0]?.toString() || '',
                description: item.description || '',
                image_url: item.image_url || '',
                category_type: item.category_type || 'study',
            });
        } else {
            setEditingItem(null);
            setItemForm({
                name: '',
                category_id: '',
                description: '',
                image_url: '',
                category_type: 'study',
            });
        }
        setIsItemModalOpen(true);
    };

    const syncItemCategories = async (itemId: number, categoryIdStr: string) => {
        const { error: delErr } = await supabase.from('info_item_categories').delete().eq('item_id', itemId);
        if (delErr) throw delErr;
        if (categoryIdStr) {
            const { error: insErr } = await supabase.from('info_item_categories').insert([
                { item_id: itemId, category_id: parseInt(categoryIdStr, 10) },
            ]);
            if (insErr) throw insErr;
        }
    };

    const handleSaveItem = async () => {
        if (!itemForm.name.trim()) return toast.error('请输入名称');
        setIsSaving(true);
        try {
            const payload = {
                name: itemForm.name,
                category_type: itemForm.category_type,
                source_id: null as number | null,
                url: null,
                description: itemForm.description,
                image_url: itemForm.image_url,
                info_date: null,
            };

            if (editingItem) {
                const { error } = await supabase.from('info_items').update(payload).eq('id', editingItem.id);
                if (error) throw error;
                await syncItemCategories(editingItem.id, itemForm.category_id);
                toast.success('收藏夹已更新');
            } else {
                const maxOrder = items.reduce((m, i) => Math.max(m, i.sort_order), -1);
                const { data, error } = await supabase
                    .from('info_items')
                    .insert([{ ...payload, sort_order: maxOrder + 1 }])
                    .select('id')
                    .single();
                if (error) throw error;
                if (data?.id != null) {
                    await syncItemCategories(data.id, itemForm.category_id);
                }
                toast.success('收藏夹已创建');
            }
            setIsItemModalOpen(false);
            fetchData();
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : String(error);
            toast.error('保存失败: ' + message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteItem = async (id: number) => {
        if (!confirm('确定删除此收藏夹吗？')) return;
        const itemToDelete = items.find((i) => i.id === id);
        if (itemToDelete?.image_url?.includes('/info_images/')) {
            const urlParts = itemToDelete.image_url.split('/info_images/');
            if (urlParts.length > 1) {
                await supabase.storage.from('info_images').remove([urlParts[1]]);
            }
        }
        try {
            const { error } = await supabase.from('info_items').delete().eq('id', id);
            if (error) throw error;
            toast.success('已删除');
            fetchData();
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : String(error);
            toast.error('删除失败: ' + message);
        }
    };

    const tabLabel = (tab: AdminTab) => (tab === 'items' ? '收藏夹' : '功能专栏');

    const filteredCategories = categories.filter((c) => {
        const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = categoryTypeFilter === 'all' || c.category_type === categoryTypeFilter;
        return matchesSearch && matchesFilter;
    });
    const filteredItems = items.filter((i) => {
        const matchesSearch = i.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = categoryTypeFilter === 'all' || i.category_type === categoryTypeFilter;
        return matchesSearch && matchesFilter;
    });

    return (
        <div className="space-y-6">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2 text-zinc-100">
                        <Library className="text-blue-500" />
                        信息溯源管理
                    </h1>
                    <p className="text-sm text-zinc-500 mt-1">收藏夹 · 功能专栏</p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="p-1 bg-zinc-900 rounded-lg flex gap-1">
                        {(['items', 'categories'] as const).map((tab) => (
                            <button
                                key={tab}
                                type="button"
                                onClick={() => setActiveTab(tab)}
                                className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${activeTab === tab ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
                            >
                                {tabLabel(tab)}
                                <span className="ml-1 font-mono text-[9px] font-normal opacity-70">
                                    {tab === 'items' ? 'Items' : 'Categories'}
                                </span>
                            </button>
                        ))}
                    </div>

                    <div className="w-[100px] flex justify-end">
                        <Button
                            type="button"
                            onClick={() =>
                                activeTab === 'items' ? openItemModal(null) : openCategoryModal()
                            }
                            className="bg-blue-600 hover:bg-blue-500 text-white font-bold h-9 whitespace-nowrap"
                        >
                            <Plus size={16} className="mr-1" />
                            新增
                        </Button>
                    </div>
                </div>
            </header>

            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                    <Input
                        placeholder={`搜索${tabLabel(activeTab)}名称...`}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 bg-zinc-900/50 border-zinc-800 text-zinc-200"
                    />
                </div>
                <div className="p-1 bg-zinc-900 rounded-lg flex gap-1 self-start">
                    {(['all', 'study', 'life'] as const).map((type) => (
                        <button
                            key={type}
                            type="button"
                            onClick={() => setCategoryTypeFilter(type)}
                            className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all uppercase tracking-wider ${categoryTypeFilter === type ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
                        >
                            {type}
                        </button>
                    ))}
                </div>
            </div>

            <div className="bg-zinc-900/30 rounded-2xl border border-zinc-800 overflow-hidden">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 opacity-50">
                        <Loader2 className="animate-spin mb-4 text-blue-500" size={32} />
                        <p className="text-sm text-zinc-500">同步中...</p>
                    </div>
                ) : (
                    <table className="w-full text-left">
                        <thead className="bg-zinc-900/50 text-zinc-500 text-[10px] uppercase font-bold tracking-wider">
                            <tr>
                                <th className="px-6 py-4">类型</th>
                                <th className="px-6 py-4">名称</th>
                                {activeTab === 'items' && <th className="px-6 py-4">功能专栏</th>}
                                <th className="px-6 py-4 text-right">操作</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800/50">
                            {activeTab === 'categories' &&
                                filteredCategories.map((cat) => (
                                    <tr key={cat.id} className="group hover:bg-white/5 transition-colors">
                                        <td className="px-6 py-4">
                                            <span
                                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${cat.category_type === 'study' ? 'bg-blue-900/30 text-blue-400 border border-blue-500/20' : 'bg-amber-900/30 text-amber-400 border border-amber-500/20'}`}
                                            >
                                                {cat.category_type}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-zinc-200">{cat.name}</div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => openCategoryModal(cat)}
                                                    className="h-8 w-8 text-zinc-400 hover:text-white hover:bg-zinc-800"
                                                >
                                                    <Edit2 size={14} />
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleDeleteCategory(cat.id)}
                                                    className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-950/20"
                                                >
                                                    <Trash2 size={14} />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}

                            {activeTab === 'items' &&
                                filteredItems.map((item) => (
                                    <tr key={item.id} className="group hover:bg-white/5 transition-colors">
                                        <td className="px-6 py-4">
                                            <span
                                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${item.category_type === 'study' ? 'bg-blue-900/30 text-blue-400 border border-blue-500/20' : 'bg-amber-900/30 text-amber-400 border border-amber-500/20'}`}
                                            >
                                                {item.category_type}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-zinc-200 line-clamp-1">{item.name}</div>
                                            {item.description && (
                                                <div className="text-[10px] text-zinc-600 mt-1 line-clamp-1 max-w-[320px]">
                                                    {item.description}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-zinc-400">
                                            {categoryLabels(item, categories)}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => openItemModal(item)}
                                                    className="h-8 w-8 text-zinc-400 hover:text-white hover:bg-zinc-800"
                                                >
                                                    <Edit2 size={14} />
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleDeleteItem(item.id)}
                                                    className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-950/20"
                                                >
                                                    <Trash2 size={14} />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}

                            {((activeTab === 'categories' && filteredCategories.length === 0) ||
                                (activeTab === 'items' && filteredItems.length === 0)) &&
                                !isLoading && (
                                    <tr>
                                        <td
                                            colSpan={activeTab === 'items' ? 4 : 3}
                                            className="px-6 py-20 text-center"
                                        >
                                            <p className="text-zinc-500 text-sm italic">暂无记录</p>
                                        </td>
                                    </tr>
                                )}
                        </tbody>
                    </table>
                )}
            </div>

            <Dialog open={isCategoryModalOpen} onOpenChange={setIsCategoryModalOpen}>
                <DialogContent className="bg-zinc-950 border-zinc-800 text-white sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold">
                            {editingCategory ? '编辑功能专栏' : '新建功能专栏'}{' '}
                            <span className="text-sm font-mono font-normal opacity-70">Category</span>
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-6 py-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">
                                名称
                            </label>
                            <Input
                                value={categoryForm.name}
                                onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                                placeholder="例如: AI工具, 技术资讯..."
                                className="bg-zinc-900 border-zinc-800 focus:ring-blue-500"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">
                                所属 Nexus
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                                {(['study', 'life'] as const).map((t) => (
                                    <button
                                        key={t}
                                        type="button"
                                        onClick={() => setCategoryForm({ ...categoryForm, category_type: t })}
                                        className={`flex items-center justify-center py-3 rounded-xl border text-sm font-bold transition-all ${categoryForm.category_type === t ? (t === 'study' ? 'bg-blue-600/20 border-blue-500 text-blue-400' : 'bg-amber-600/20 border-amber-500 text-amber-400') : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:bg-zinc-800'}`}
                                    >
                                        {t.toUpperCase()}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => setIsCategoryModalOpen(false)}
                            disabled={isSaving}
                        >
                            取消
                        </Button>
                        <Button
                            type="button"
                            onClick={handleSaveCategory}
                            disabled={isSaving}
                            className="bg-blue-600 hover:bg-blue-500 text-white px-8"
                        >
                            {isSaving ? <Loader2 className="animate-spin mr-2" size={14} /> : null}
                            {isSaving ? '同步中' : editingCategory ? '保存' : '创建'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isItemModalOpen} onOpenChange={setIsItemModalOpen}>
                <DialogContent className="bg-zinc-950 border-zinc-800 text-white sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold text-zinc-100">
                            {editingItem ? '编辑收藏夹' : '新建收藏夹'}{' '}
                            <span className="text-sm font-mono font-normal opacity-70">Item</span>
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-6 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-zinc-500 uppercase">名称</label>
                                <Input
                                    value={itemForm.name}
                                    onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
                                    className="bg-zinc-900 border-zinc-800"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-zinc-500 uppercase">Nexus</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {(['study', 'life'] as const).map((t) => (
                                        <button
                                            key={t}
                                            type="button"
                                            onClick={() =>
                                                setItemForm({
                                                    ...itemForm,
                                                    category_type: t,
                                                    category_id: '',
                                                })
                                            }
                                            className={`py-2 rounded-lg border text-[10px] font-bold transition-all ${itemForm.category_type === t ? 'bg-blue-600/20 border-blue-500 text-blue-400' : 'bg-zinc-900 border-zinc-800 text-zinc-600'}`}
                                        >
                                            {t.toUpperCase()}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-zinc-500 uppercase">功能专栏</label>
                            <select
                                value={itemForm.category_id}
                                onChange={(e) => setItemForm({ ...itemForm, category_id: e.target.value })}
                                className="w-full h-10 px-3 rounded-md bg-zinc-900 border border-zinc-800 text-sm outline-none"
                            >
                                <option value="">未选择</option>
                                {categories
                                    .filter((c) => c.category_type === itemForm.category_type)
                                    .map((c) => (
                                        <option key={c.id} value={c.id}>
                                            {c.name}
                                        </option>
                                    ))}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-zinc-500 uppercase">描述</label>
                            <textarea
                                value={itemForm.description}
                                onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })}
                                className="w-full bg-zinc-900 border-zinc-800 rounded-lg p-3 text-sm focus:ring-1 focus:ring-blue-500 outline-none h-24"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-zinc-500 uppercase">封面</label>
                            <ImageUpload
                                value={itemForm.image_url}
                                onChange={(url) => setItemForm({ ...itemForm, image_url: url })}
                                bucket="info_images"
                                folder={itemForm.category_type}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => setIsItemModalOpen(false)}
                            disabled={isSaving}
                        >
                            取消
                        </Button>
                        <Button
                            type="button"
                            onClick={handleSaveItem}
                            disabled={isSaving}
                            className="bg-blue-600 hover:bg-blue-500 text-white px-8"
                        >
                            {isSaving ? <Loader2 className="animate-spin mr-2" size={14} /> : null}
                            {isSaving ? '同步中' : editingItem ? '保存' : '创建'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
