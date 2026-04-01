"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { 
    Library, 
    Plus, 
    Edit2, 
    Trash2, 
    Search, 
    Loader2, 
    Image as ImageIcon,
    ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { ImageUpload } from '@/components/ui/image-upload';
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle, 
    DialogFooter 
} from '@/components/ui/dialog';

// === Types ===
type CategoryType = 'study' | 'life';

interface InfoSourceGroup {
    id: number;
    category_type: CategoryType;
    name: string;
    sort_order: number;
    created_at?: string;
}

interface InfoSource {
    id: number;
    group_id?: number | null;
    name: string;
    image_url?: string | null;
    sort_order: number;
    created_at?: string;
    info_source_groups?: { name: string } | null;
}

interface InfoCategory {
    id: number;
    category_type: CategoryType;
    name: string;
    created_at?: string;
}

export default function InfoSourceAdminPage() {
    const [activeTab, setActiveTab] = useState<'groups' | 'sources' | 'categories' | 'items'>('sources');
    const [isLoading, setIsLoading] = useState(true);

    // Data lists
    const [groups, setGroups] = useState<InfoSourceGroup[]>([]);
    const [sources, setSources] = useState<InfoSource[]>([]);
    const [categories, setCategories] = useState<InfoCategory[]>([]);
    const [items, setItems] = useState<any[]>([]);
    
    // UI states
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryTypeFilter, setCategoryTypeFilter] = useState<'all' | CategoryType>('all');
    const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
    const [isSourceModalOpen, setIsSourceModalOpen] = useState(false);
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
    const [isItemModalOpen, setIsItemModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    
    const [editingGroup, setEditingGroup] = useState<InfoSourceGroup | null>(null);
    const [editingSource, setEditingSource] = useState<InfoSource | null>(null);
    const [editingCategory, setEditingCategory] = useState<InfoCategory | null>(null);
    const [editingItem, setEditingItem] = useState<any | null>(null);

    // Form states
    const [groupForm, setGroupForm] = useState({ name: '', category_type: 'study' as CategoryType });
    const [sourceForm, setSourceForm] = useState({ name: '', image_url: '', group_id: '' as string | null });
    const [categoryForm, setCategoryForm] = useState({ name: '', category_type: 'study' as CategoryType });
    const [itemForm, setItemForm] = useState({
        name: '',
        source_id: '',
        category_id: '',
        url: '',
        description: '',
        image_url: '',
        info_date: '',
        category_type: 'study' as CategoryType
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [grpRes, srcRes, catRes, itemsRes] = await Promise.all([
                supabase.from('info_source_groups').select('*').order('sort_order', { ascending: true }),
                supabase.from('info_sources').select('*, info_source_groups(name)').order('sort_order', { ascending: true }),
                supabase.from('info_categories').select('*'),
                supabase.from('info_items').select('*, info_sources(name), info_item_categories(category_id)')
            ]);

            if (grpRes.error) console.error("Groups error:", grpRes.error);
            if (srcRes.error) console.error("Sources error:", srcRes.error);
            if (catRes.error) console.error("Categories error:", catRes.error);
            if (itemsRes.error) console.error("Items error:", itemsRes.error);

            if (grpRes.data) setGroups(grpRes.data);
            if (srcRes.data) setSources(srcRes.data);
            if (catRes.data) setCategories(catRes.data);
            if (itemsRes.data) {
                const enrichedItems = itemsRes.data.map((item: any) => ({
                    ...item,
                    category_ids: item.info_item_categories?.map((ic: any) => ic.category_id) || []
                }));
                setItems(enrichedItems);
            }
        } catch (error: any) {
            toast.error("加载数据失败: " + error.message);
        } finally {
            setIsLoading(false);
        }
    };

    // === Group Actions ===
    const openGroupModal = (group: InfoSourceGroup | null = null) => {
        if (group) {
            setEditingGroup(group);
            setGroupForm({ name: group.name, category_type: group.category_type });
        } else {
            setEditingGroup(null);
            setGroupForm({ name: '', category_type: 'study' });
        }
        setIsGroupModalOpen(true);
    };

    const handleSaveGroup = async () => {
        if (!groupForm.name.trim()) return toast.error("请输入名称");
        setIsSaving(true);
        try {
            if (editingGroup) {
                const { error } = await supabase.from('info_source_groups').update({ name: groupForm.name, category_type: groupForm.category_type }).eq('id', editingGroup.id);
                if (error) throw error;
                toast.success("大标签已更新");
            } else {
                const { error } = await supabase.from('info_source_groups').insert([{ name: groupForm.name, category_type: groupForm.category_type }]);
                if (error) throw error;
                toast.success("大标签已创建");
            }
            setIsGroupModalOpen(false);
            fetchData();
        } catch (error: any) {
            toast.error("保存失败: " + error.message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteGroup = async (id: number) => {
        if (!confirm("确定删除此大标签吗？内部来源的关联将会被清空(设为空)。")) return;
        try {
            const { error } = await supabase.from('info_source_groups').delete().eq('id', id);
            if (error) throw error;
            toast.success("已删除大标签");
            fetchData();
        } catch (error: any) {
            toast.error("删除失败: " + error.message);
        }
    };

    // === Source Actions ===
    const openSourceModal = (source: InfoSource | null = null) => {
        if (source) {
            setEditingSource(source);
            setSourceForm({ name: source.name, image_url: source.image_url || '', group_id: source.group_id?.toString() || '' });
        } else {
            setEditingSource(null);
            setSourceForm({ name: '', image_url: '', group_id: '' });
        }
        setIsSourceModalOpen(true);
    };

    const handleSaveSource = async () => {
        if (!sourceForm.name.trim()) return toast.error("请输入名称");
        const parsedGroupId = sourceForm.group_id ? parseInt(sourceForm.group_id, 10) : null;
        setIsSaving(true);
        try {
            if (editingSource) {
                const { error } = await supabase
                    .from('info_sources')
                    .update({ name: sourceForm.name, image_url: sourceForm.image_url, group_id: parsedGroupId })
                    .eq('id', editingSource.id);
                if (error) throw error;
                toast.success("来源已更新");
            } else {
                const { error } = await supabase
                    .from('info_sources')
                    .insert([{ name: sourceForm.name, image_url: sourceForm.image_url, group_id: parsedGroupId }]);
                if (error) throw error;
                toast.success("来源已创建");
            }
            setIsSourceModalOpen(false);
            fetchData();
        } catch (error: any) {
            toast.error("保存失败: " + error.message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteSource = async (id: number) => {
        if (!confirm("确定删除此来源吗？这将导致关联条目失去来源引用。")) return;
        const sourceToDelete = sources.find(s => s.id === id);
        if (sourceToDelete?.image_url && sourceToDelete.image_url.includes('/info_images/')) {
            const urlParts = sourceToDelete.image_url.split('/info_images/');
            if (urlParts.length > 1) {
                const filePath = urlParts[1];
                await supabase.storage.from('info_images').remove([filePath]);
            }
        }
        try {
            const { error } = await supabase.from('info_sources').delete().eq('id', id);
            if (error) throw error;
            toast.success("已删除");
            fetchData();
        } catch (error: any) {
            toast.error("删除失败: " + error.message);
        }
    };

    // === Category Actions ===
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
        if (!categoryForm.name.trim()) return toast.error("请输入名称");
        setIsSaving(true);
        try {
            if (editingCategory) {
                const { error } = await supabase
                    .from('info_categories')
                    .update({ name: categoryForm.name, category_type: categoryForm.category_type })
                    .eq('id', editingCategory.id);
                if (error) throw error;
                toast.success("分类已更新");
            } else {
                const { error } = await supabase
                    .from('info_categories')
                    .insert([{ name: categoryForm.name, category_type: categoryForm.category_type }]);
                if (error) throw error;
                toast.success("分类已创建");
            }
            setIsCategoryModalOpen(false);
            fetchData();
        } catch (error: any) {
            toast.error("保存失败: " + error.message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteCategory = async (id: number) => {
        if (!confirm("确定删除此分类吗？")) return;
        try {
            const { error } = await supabase.from('info_categories').delete().eq('id', id);
            if (error) throw error;
            toast.success("已删除");
            fetchData();
        } catch (error: any) {
            toast.error("删除失败: " + error.message);
        }
    };

    // === Item Actions ===
    const openItemModal = (item: any) => {
        setEditingItem(item);
        setItemForm({
            name: item.name || '',
            source_id: item.source_id?.toString() || '',
            category_id: item.category_ids?.[0]?.toString() || '',
            url: item.url || '',
            description: item.description || '',
            image_url: item.image_url || '',
            info_date: item.info_date || '',
            category_type: item.category_type || 'study'
        });
        setIsItemModalOpen(true);
    };

    const handleSaveItem = async () => {
        if (!itemForm.name.trim()) return toast.error("请输入标题");
        setIsSaving(true);
        try {
            const { error } = await supabase
                .from('info_items')
                .update({
                    name: itemForm.name,
                    source_id: itemForm.source_id ? parseInt(itemForm.source_id) : null,
                    url: itemForm.url,
                    description: itemForm.description,
                    image_url: itemForm.image_url,
                    info_date: itemForm.info_date || null,
                    category_type: itemForm.category_type
                })
                .eq('id', editingItem.id);

            if (error) throw error;
            
            if (itemForm.category_id) {
                await supabase.from('info_item_categories').delete().eq('item_id', editingItem.id);
                await supabase.from('info_item_categories').insert([
                    { item_id: editingItem.id, category_id: parseInt(itemForm.category_id) }
                ]);
            }

            toast.success("条目已更新");
            setIsItemModalOpen(false);
            fetchData();
        } catch (error: any) {
            toast.error("更新失败: " + error.message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteItem = async (id: number) => {
        if (!confirm("确定删除此条目吗？")) return;
        const itemToDelete = items.find(i => i.id === id);
        if (itemToDelete?.image_url && itemToDelete.image_url.includes('/info_images/')) {
            const urlParts = itemToDelete.image_url.split('/info_images/');
            if (urlParts.length > 1) {
                const filePath = urlParts[1];
                await supabase.storage.from('info_images').remove([filePath]);
            }
        }
        try {
            const { error } = await supabase.from('info_items').delete().eq('id', id);
            if (error) throw error;
            toast.success("条目已删除");
            fetchData();
        } catch (error: any) {
            toast.error("删除失败: " + error.message);
        }
    };

    const filteredGroups = groups.filter(g => {
        const matchesSearch = g.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = categoryTypeFilter === 'all' || g.category_type === categoryTypeFilter;
        return matchesSearch && matchesFilter;
    });
    const filteredSources = sources.filter(s => {
        const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase());
        const groupType = groups.find(g => g.id === s.group_id)?.category_type;
        const matchesFilter = categoryTypeFilter === 'all' || (groupType === categoryTypeFilter) || (!s.group_id);
        return matchesSearch && matchesFilter; 
    });
    const filteredCategories = categories.filter(c => {
        const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = categoryTypeFilter === 'all' || c.category_type === categoryTypeFilter;
        return matchesSearch && matchesFilter;
    });
    const filteredItems = items.filter(i => {
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
                    <p className="text-sm text-zinc-500 mt-1">
                        配置 Study Nexus 和 Life Archive 的底层数据
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="p-1 bg-zinc-900 rounded-lg flex gap-1">
                        <button 
                            onClick={() => setActiveTab('groups')}
                            className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${activeTab === 'groups' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
                        >
                            大标签管理
                        </button>
                        <button 
                            onClick={() => setActiveTab('sources')}
                            className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${activeTab === 'sources' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
                        >
                            来源管理
                        </button>
                        <button 
                            onClick={() => setActiveTab('categories')}
                            className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${activeTab === 'categories' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
                        >
                            分类管理
                        </button>
                        <button 
                            onClick={() => setActiveTab('items')}
                            className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${activeTab === 'items' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
                        >
                            条目管理
                        </button>
                    </div>
                    
                    <div className="w-[100px] flex justify-end">
                        {activeTab !== 'items' ? (
                            <Button 
                                onClick={() => activeTab === 'groups' ? openGroupModal() : activeTab === 'sources' ? openSourceModal() : openCategoryModal()}
                                className="bg-blue-600 hover:bg-blue-500 text-white font-bold h-9 whitespace-nowrap"
                            >
                                <Plus size={16} className="mr-1" />
                                新增
                            </Button>
                        ) : (
                            <div className="h-9 invisible">
                                <Button className="h-9 whitespace-nowrap">占位</Button>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            {/* Search Bar & Filters */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                    <Input 
                        placeholder={`搜索${activeTab === 'groups' ? '大标签' : activeTab === 'sources' ? '来源' : activeTab === 'categories' ? '分类' : '条目'}名称...`}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 bg-zinc-900/50 border-zinc-800 text-zinc-200"
                    />
                </div>
                {activeTab !== 'items' && (
                    <div className="p-1 bg-zinc-900 rounded-lg flex gap-1 self-start">
                        {(['all', 'study', 'life'] as const).map(type => (
                            <button 
                                key={type}
                                onClick={() => setCategoryTypeFilter(type)}
                                className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all uppercase tracking-wider ${categoryTypeFilter === type ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
                            >
                                {type}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Content List */}
            <div className="bg-zinc-900/30 rounded-2xl border border-zinc-800 overflow-hidden">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 opacity-50">
                        <Loader2 className="animate-spin mb-4 text-blue-500" size={32} />
                        <p className="text-sm text-zinc-500">同步信标中...</p>
                    </div>
                ) : (
                    <table className="w-full text-left">
                        <thead className="bg-zinc-900/50 text-zinc-500 text-[10px] uppercase font-bold tracking-wider">
                            <tr>
                                <th className="px-6 py-4">图标 / 类型</th>
                                <th className="px-6 py-4">名称</th>
                                <th className="px-6 py-4 text-right">操作</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800/50">
                            {activeTab === 'groups' ? (
                                filteredGroups.map(group => (
                                    <tr key={group.id} className="group hover:bg-white/5 transition-colors">
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${group.category_type === 'study' ? 'bg-blue-900/30 text-blue-400 border border-blue-500/20' : 'bg-amber-900/30 text-amber-400 border border-amber-500/20'}`}>
                                                {group.category_type}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-zinc-200">{group.name}</div>
                                            <div className="text-[10px] text-zinc-600 mt-1 uppercase font-mono tracking-tighter">ID: {group.id}</div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    onClick={() => openGroupModal(group)}
                                                    className="h-8 w-8 text-zinc-400 hover:text-white hover:bg-zinc-800"
                                                >
                                                    <Edit2 size={14} />
                                                </Button>
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    onClick={() => handleDeleteGroup(group.id)}
                                                    className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-950/20"
                                                >
                                                    <Trash2 size={14} />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : activeTab === 'sources' ? (
                                filteredSources.map(source => (
                                    <tr key={source.id} className="group hover:bg-white/5 transition-colors">
                                        <td className="px-6 py-4">
                                            {source.image_url ? (
                                                <img src={source.image_url} alt="" className="w-8 h-8 rounded-md object-cover border border-zinc-800 shadow-sm" />
                                            ) : (
                                                <div className="w-8 h-8 rounded-md bg-zinc-800 flex items-center justify-center">
                                                    <ImageIcon size={14} className="text-zinc-600" />
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-zinc-200">{source.name}</div>
                                            <div className="text-[10px] text-zinc-600 mt-1 flex items-center gap-2">
                                                <span className="uppercase font-mono tracking-tighter">ID: {source.id}</span>
                                                {source.info_source_groups?.name && (
                                                    <>
                                                        <ArrowRight size={10} />
                                                        <span className="bg-zinc-800 px-1 rounded">{source.info_source_groups.name}</span>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    onClick={() => openSourceModal(source)}
                                                    className="h-8 w-8 text-zinc-400 hover:text-white hover:bg-zinc-800"
                                                >
                                                    <Edit2 size={14} />
                                                </Button>
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    onClick={() => handleDeleteSource(source.id)}
                                                    className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-950/20"
                                                >
                                                    <Trash2 size={14} />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : activeTab === 'categories' ? (
                                filteredCategories.map(cat => (
                                    <tr key={cat.id} className="group hover:bg-white/5 transition-colors">
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${cat.category_type === 'study' ? 'bg-blue-900/30 text-blue-400 border border-blue-500/20' : 'bg-amber-900/30 text-amber-400 border border-amber-500/20'}`}>
                                                {cat.category_type}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-zinc-200">{cat.name}</div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    onClick={() => openCategoryModal(cat)}
                                                    className="h-8 w-8 text-zinc-400 hover:text-white hover:bg-zinc-800"
                                                >
                                                    <Edit2 size={14} />
                                                </Button>
                                                <Button 
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
                                ))
                            ) : (
                                filteredItems.map(item => (
                                    <tr key={item.id} className="group hover:bg-white/5 transition-colors">
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${item.category_type === 'study' ? 'bg-blue-900/30 text-blue-400 border border-blue-500/20' : 'bg-amber-900/30 text-amber-400 border border-amber-500/20'}`}>
                                                {item.category_type}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-zinc-200 line-clamp-1">{item.name}</div>
                                            <div className="text-[10px] text-zinc-600 mt-1 flex items-center gap-2">
                                                <span className="bg-zinc-800 px-1 rounded">{item.info_sources?.name || '未知来源'}</span>
                                                <ArrowRight size={10} />
                                                <span className="hover:text-blue-400 cursor-default truncate max-w-[200px]">{item.url || 'No URL'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    onClick={() => openItemModal(item)}
                                                    className="h-8 w-8 text-zinc-400 hover:text-white hover:bg-zinc-800"
                                                >
                                                    <Edit2 size={14} />
                                                </Button>
                                                <Button 
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
                                ))
                            )}
                            
                            {((activeTab === 'groups' && filteredGroups.length === 0) || (activeTab === 'sources' && filteredSources.length === 0) || (activeTab === 'categories' && filteredCategories.length === 0) || (activeTab === 'items' && filteredItems.length === 0)) && !isLoading && (
                                <tr>
                                    <td colSpan={3} className="px-6 py-20 text-center">
                                        <p className="text-zinc-500 text-sm italic">信号丢失，目前没有任何记录条目</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>

            {/* === Group Modal === */}
            <Dialog open={isGroupModalOpen} onOpenChange={setIsGroupModalOpen}>
                <DialogContent className="bg-zinc-950 border-zinc-800 text-white sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold">{editingGroup ? '编辑大标签' : '创建新大标签'}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-6 py-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">标签名称</label>
                            <Input 
                                value={groupForm.name}
                                onChange={(e) => setGroupForm({ ...groupForm, name: e.target.value })}
                                placeholder="例如: 论坛社区, 视频库..."
                                className="bg-zinc-900 border-zinc-800 focus:ring-blue-500"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">所属类型</label>
                            <div className="grid grid-cols-2 gap-2">
                                <button 
                                    onClick={() => setGroupForm({ ...groupForm, category_type: 'study' })}
                                    className={`flex items-center justify-center py-3 rounded-xl border text-sm font-bold transition-all ${groupForm.category_type === 'study' ? 'bg-blue-600/20 border-blue-500 text-blue-400' : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:bg-zinc-800'}`}
                                >
                                    STUDY
                                </button>
                                <button 
                                    onClick={() => setGroupForm({ ...groupForm, category_type: 'life' })}
                                    className={`flex items-center justify-center py-3 rounded-xl border text-sm font-bold transition-all ${groupForm.category_type === 'life' ? 'bg-amber-600/20 border-amber-500 text-amber-400' : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:bg-zinc-800'}`}
                                >
                                    LIFE
                                </button>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsGroupModalOpen(false)} disabled={isSaving}>取消</Button>
                        <Button 
                            onClick={handleSaveGroup} 
                            disabled={isSaving}
                            className="bg-blue-600 hover:bg-blue-500 text-white px-8"
                        >
                            {isSaving ? <Loader2 className="animate-spin mr-2" size={14} /> : null}
                            {isSaving ? '同步中' : editingGroup ? '保存更新' : '立即创建'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* === Source Modal === */}
            <Dialog open={isSourceModalOpen} onOpenChange={setIsSourceModalOpen}>
                <DialogContent className="bg-zinc-950 border-zinc-800 text-white sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold">{editingSource ? '编辑来源' : '创建新来源'}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-6 py-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">来源名称</label>
                            <Input 
                                value={sourceForm.name}
                                onChange={(e) => setSourceForm({ ...sourceForm, name: e.target.value })}
                                placeholder="例如: GitHub, YouTube..."
                                className="bg-zinc-900 border-zinc-800 focus:ring-blue-500"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">所属大标签 (独立来源可留空)</label>
                            <select 
                                value={sourceForm.group_id || ''}
                                onChange={(e) => setSourceForm({ ...sourceForm, group_id: e.target.value })}
                                className="w-full h-10 px-3 rounded-md bg-zinc-900 border border-zinc-800 text-sm outline-none"
                            >
                                <option value="">无分组</option>
                                {groups.map(g => (
                                    <option key={g.id} value={g.id}>{g.name} ({g.category_type.toUpperCase()})</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">来源图标</label>
                            <ImageUpload 
                                bucket="info_images"
                                folder="sources"
                                value={sourceForm.image_url}
                                onChange={(url) => setSourceForm({ ...sourceForm, image_url: url })}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsSourceModalOpen(false)} disabled={isSaving}>取消</Button>
                        <Button 
                            onClick={handleSaveSource} 
                            disabled={isSaving}
                            className="bg-blue-600 hover:bg-blue-500 text-white px-8"
                        >
                            {isSaving ? <Loader2 className="animate-spin mr-2" size={14} /> : null}
                            {isSaving ? '同步中' : editingSource ? '保存更新' : '立即创建'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* === Category Modal === */}
            <Dialog open={isCategoryModalOpen} onOpenChange={setIsCategoryModalOpen}>
                <DialogContent className="bg-zinc-950 border-zinc-800 text-white sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold">{editingCategory ? '编辑分类' : '创建新分类'}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-6 py-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">分类名称</label>
                            <Input 
                                value={categoryForm.name}
                                onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                                placeholder="例如: 前端工程, 厨艺灵感..."
                                className="bg-zinc-900 border-zinc-800 focus:ring-blue-500"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">所属类型</label>
                            <div className="grid grid-cols-2 gap-2">
                                <button 
                                    onClick={() => setCategoryForm({ ...categoryForm, category_type: 'study' })}
                                    className={`flex items-center justify-center py-3 rounded-xl border text-sm font-bold transition-all ${categoryForm.category_type === 'study' ? 'bg-blue-600/20 border-blue-500 text-blue-400' : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:bg-zinc-800'}`}
                                >
                                    STUDY
                                </button>
                                <button 
                                    onClick={() => setCategoryForm({ ...categoryForm, category_type: 'life' })}
                                    className={`flex items-center justify-center py-3 rounded-xl border text-sm font-bold transition-all ${categoryForm.category_type === 'life' ? 'bg-amber-600/20 border-amber-500 text-amber-400' : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:bg-zinc-800'}`}
                                >
                                    LIFE
                                </button>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsCategoryModalOpen(false)} disabled={isSaving}>取消</Button>
                        <Button 
                            onClick={handleSaveCategory} 
                            disabled={isSaving}
                            className="bg-blue-600 hover:bg-blue-500 text-white px-8"
                        >
                            {isSaving ? <Loader2 className="animate-spin mr-2" size={14} /> : null}
                            {isSaving ? '同步中' : editingCategory ? '保存更新' : '立即创建'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* === Item Edit Modal === */}
            <Dialog open={isItemModalOpen} onOpenChange={setIsItemModalOpen}>
                <DialogContent className="bg-zinc-950 border-zinc-800 text-white sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold text-zinc-100">管理信息条目</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-6 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-zinc-500 uppercase">条目名称</label>
                                <Input 
                                    value={itemForm.name}
                                    onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
                                    className="bg-zinc-900 border-zinc-800"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-zinc-500 uppercase">所属类型</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {(['study', 'life'] as const).map(t => (
                                        <button 
                                            key={t}
                                            onClick={() => setItemForm({ ...itemForm, category_type: t })}
                                            className={`py-2 rounded-lg border text-[10px] font-bold transition-all ${itemForm.category_type === t ? 'bg-blue-600/20 border-blue-500 text-blue-400' : 'bg-zinc-900 border-zinc-800 text-zinc-600'}`}
                                        >
                                            {t.toUpperCase()}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-zinc-500 uppercase">源链接 URL</label>
                                <Input 
                                    value={itemForm.url}
                                    onChange={(e) => setItemForm({ ...itemForm, url: e.target.value })}
                                    className="bg-zinc-900 border-zinc-800"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-zinc-500 uppercase">作用日期</label>
                                <Input 
                                    type="date"
                                    value={itemForm.info_date}
                                    onChange={(e) => setItemForm({ ...itemForm, info_date: e.target.value })}
                                    className="bg-zinc-900 border-zinc-800"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-zinc-500 uppercase">所属来源 (Source)</label>
                                <select 
                                    value={itemForm.source_id}
                                    onChange={(e) => setItemForm({ ...itemForm, source_id: e.target.value })}
                                    className="w-full h-10 px-3 rounded-md bg-zinc-900 border border-zinc-800 text-sm outline-none"
                                >
                                    <option value="">未选择</option>
                                    {sources.filter(s => {
                                        if (!s.group_id) return true;
                                        const group = groups.find(g => g.id === s.group_id);
                                        return group?.category_type === itemForm.category_type;
                                    }).map(s => (
                                        <option key={s.id} value={s.id}>{s.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-zinc-500 uppercase">主要分类 (Category)</label>
                                <select 
                                    value={itemForm.category_id}
                                    onChange={(e) => setItemForm({ ...itemForm, category_id: e.target.value })}
                                    className="w-full h-10 px-3 rounded-md bg-zinc-900 border border-zinc-800 text-sm outline-none"
                                >
                                    <option value="">未选择</option>
                                    {categories.filter(c => c.category_type === itemForm.category_type).map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-zinc-500 uppercase">详细描述</label>
                            <textarea 
                                value={itemForm.description}
                                onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })}
                                className="w-full bg-zinc-900 border-zinc-800 rounded-lg p-3 text-sm focus:ring-1 focus:ring-blue-500 outline-none h-24"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-zinc-500 uppercase">封面图片</label>
                            <ImageUpload 
                                value={itemForm.image_url}
                                onChange={(url) => setItemForm({ ...itemForm, image_url: url })}
                                bucket="info_images"
                                folder={itemForm.category_type}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsItemModalOpen(false)} disabled={isSaving}>取消</Button>
                        <Button 
                            onClick={handleSaveItem} 
                            disabled={isSaving}
                            className="bg-blue-600 hover:bg-blue-500 text-white px-8"
                        >
                            {isSaving ? <Loader2 className="animate-spin mr-2" size={14} /> : null}
                            确认同步
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
