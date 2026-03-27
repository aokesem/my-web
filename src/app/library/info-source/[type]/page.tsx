"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { notFound, useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, SlidersHorizontal, Search, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';

import { CategoryType, InfoSourceGroup, InfoSource, InfoCategory, InfoItem } from '../types';
import { InfoSidebar } from '../components/InfoSidebar';
import { InfoCard } from '../components/InfoCard';
import { InfoItemModal } from '../components/InfoItemModal';

export default function InfoSourceListPage() {
    const params = useParams();
    const router = useRouter();
    const type = params.type as string;

    if (type !== 'study' && type !== 'life') {
        notFound();
    }

    const isStudy = type === 'study';

    // === 主题设计 tokens ===
    const theme = {
        bg: isStudy ? 'bg-[#0f172a]' : 'bg-[#fdfbf7]',
        textBase: isStudy ? 'text-slate-300' : 'text-stone-700',
        textMuted: isStudy ? 'text-slate-500' : 'text-stone-500',
        border: isStudy ? 'border-slate-800' : 'border-stone-200',
        cardBg: isStudy ? 'bg-[#1e293b]' : 'bg-white',
        cardHover: isStudy ? 'hover:bg-[#334155]' : 'hover:bg-stone-50',
        primary: isStudy ? 'text-blue-500' : 'text-amber-600',
        primaryBg: isStudy ? 'bg-blue-500/10' : 'bg-amber-500/10',
        primaryBorder: isStudy ? 'border-blue-500/20' : 'border-amber-500/20',
        activePill: isStudy ? 'bg-blue-500 text-white' : 'bg-amber-500 text-white',
        inactivePill: isStudy ? 'bg-slate-800 text-slate-400 hover:bg-slate-700' : 'bg-stone-100 text-stone-500 hover:bg-stone-200',
        sidebarBg: isStudy ? 'bg-[#0b1121]' : 'bg-[#f8f5ee]',
        queueCardBg: isStudy ? 'bg-slate-800/50' : 'bg-white/50',
        highlightRing: isStudy ? 'ring-2 ring-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.3)]' : 'ring-2 ring-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.3)]',
    };

    // === 数据状态 ===
    const [isLoading, setIsLoading] = useState(true);
    const [mockGroups, setGroups] = useState<InfoSourceGroup[]>([]);
    const [mockSources, setSources] = useState<InfoSource[]>([]);
    const [mockCategories, setCategories] = useState<InfoCategory[]>([]);
    const [mockItems, setItems] = useState<InfoItem[]>([]);

    // === UI状态管理 ===
    const [sidebarMode, setSidebarMode] = useState<'source' | 'queue'>('source');
    const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
    const [selectedSourceId, setSelectedSourceId] = useState<number | null>(null);
    const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
    const [expandedGroups, setExpandedGroups] = useState<number[]>([]);
    const [sortBy, setSortBy] = useState<'info_date' | 'created_at'>('created_at');
    const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
    const [pinFavorites, setPinFavorites] = useState(true);

    const [highlightedCardId, setHighlightedCardId] = useState<number | null>(null);
    const [pendingScrollId, setPendingScrollId] = useState<number | null>(null);

    // Modal 状态
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
    const [editingItem, setEditingItem] = useState<InfoItem | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    // 表单状态绑定
    const [formData, setFormData] = useState({
        name: '',
        source_id: '',
        category_id: '',
        url: '',
        description: '',
        image_url: '',
        info_date: ''
    });

    // === Fetch Data ===
    const fetchData = async () => {
        setIsLoading(true);
        try {
            // 并行请求基础数据
            const [groupRes, sourceRes, catRes, itemsRes] = await Promise.all([
                supabase.from('info_source_groups').select('*').eq('category_type', type).order('sort_order', { ascending: true }),
                supabase.from('info_sources').select('*').order('sort_order', { ascending: true }),
                supabase.from('info_categories').select('*'),
                // 获取当前类别的 items，并级联查询多对多关联
                supabase.from('info_items')
                    .select('*, info_item_categories(category_id)')
                    .eq('category_type', type)
            ]);

            if (groupRes.data) {
                setGroups(groupRes.data);
                // 默认展开所有当前 type 的 groups
                setExpandedGroups(groupRes.data.map(g => g.id));
            }
            if (sourceRes.data) setSources(sourceRes.data);
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
        } catch (error) {
            console.error("Failed to fetch data", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [type]);

    // === 数据派生 ===
    const currentCategories = useMemo(() => mockCategories.filter(c => c.category_type === type), [mockCategories, type]);
    
    const allFilteredItems = useMemo(() => {
        let sorted = [...mockItems];
        
        if (selectedSourceId !== null) {
            sorted = sorted.filter(item => item.source_id === selectedSourceId);
        } else if (selectedGroupId !== null) {
            const groupSourceIds = mockSources.filter(s => s.group_id === selectedGroupId).map(s => s.id);
            sorted = sorted.filter(item => item.source_id && groupSourceIds.includes(item.source_id));
        }
        
        if (selectedCategoryId !== null) {
            sorted = sorted.filter(item => item.category_ids.includes(selectedCategoryId));
        }

        // 排序逻辑
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
    }, [mockItems, selectedSourceId, selectedCategoryId, sortBy, sortOrder, pinFavorites]);

    const queuedItems = useMemo(() => mockItems.filter(i => i.is_queued), [mockItems]);

    // 监听等待滚动的 ID
    useEffect(() => {
        if (pendingScrollId && !isLoading) {
            // 需要一点延迟等待 motion 渲染完再找 DOM
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

    // 动作处理函数
    const scrollToCard = (id: number) => {
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
    };

    // 快速状态切换 (Favorite and Queue)
    const toggleStatus = async (e: React.MouseEvent, id: number, field: 'is_favorited' | 'is_queued') => {
        e.stopPropagation();
        const item = mockItems.find(i => i.id === id);
        if (!item) return;
        
        const newValue = !item[field];

        // 乐观更新 UI
        setItems(prev => prev.map(i => i.id === id ? { ...i, [field]: newValue } : i));

        const { error } = await supabase
            .from('info_items')
            .update({ [field]: newValue })
            .eq('id', id);

        if (error) {
            console.error(`Failed to update ${field}`, error);
            // 回滚更新
            setItems(prev => prev.map(i => i.id === id ? { ...i, [field]: !newValue } : i));
        }
    };

    // 重新排序大分类并持久化
    const handleReorderGroups = async (newOrder: InfoSourceGroup[]) => {
        setGroups(newOrder);
        const updates = newOrder.map((group, index) => ({
            id: group.id,
            category_type: group.category_type,
            name: group.name,
            sort_order: index
        }));
        try {
            const { error } = await supabase.from('info_source_groups').upsert(updates);
            if (error) throw error;
        } catch (error) {
            console.error("Failed to update groups order:", error);
            toast.error("分组排序保存失败");
        }
    };

    // 重新排序子源并持久化
    const handleReorderSources = async (groupId: number | null, newOrder: InfoSource[]) => {
        // 更新本地状态：替换对应 groupId 的 sources，保留其他的
        setSources(prev => {
            const others = prev.filter(s => s.group_id !== groupId);
            return [...others, ...newOrder];
        });
        
        const updates = newOrder.map((source, index) => ({
            id: source.id,
            group_id: source.group_id,
            name: source.name,
            image_url: source.image_url,
            sort_order: index
        }));

        try {
            const { error } = await supabase.from('info_sources').upsert(updates);
            if (error) throw error;
        } catch (error) {
            console.error("Failed to update sources order:", error);
            toast.error("溯源排序保存失败");
        }
    };

    const toggleGroup = (id: number, e: React.MouseEvent) => {
        e.stopPropagation();
        setExpandedGroups(prev => prev.includes(id) ? prev.filter(gid => gid !== id) : [...prev, id]);
    };

    // Modal 表单动作
    const handleCreate = () => {
        setFormMode('create');
        setEditingItem(null);
        setFormData({
            name: '',
            source_id: '',
            category_id: '',
            url: '',
            description: '',
            image_url: '',
            info_date: ''
        });
        setIsFormModalOpen(true);
    };

    const handleEdit = (e: React.MouseEvent, item: InfoItem) => {
        e.stopPropagation();
        setFormMode('edit');
        setEditingItem(item);
        setFormData({
            name: item.name,
            source_id: item.source_id?.toString() || '',
            category_id: item.category_ids[0]?.toString() || '',
            url: item.url || '',
            description: item.description || '',
            image_url: item.image_url || '',
            info_date: item.info_date || ''
        });
        setIsFormModalOpen(true);
    };

    const handleSave = async () => {
        if (!formData.name.trim()) return alert("请填写标题");
        setIsSaving(true);

        try {
            const savePayload = {
                category_type: type,
                name: formData.name,
                source_id: formData.source_id ? parseInt(formData.source_id) : null,
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

                // 统一只处理一个分类
                if (formData.category_id) {
                    await supabase.from('info_item_categories').insert({
                        item_id: savedItem.id,
                        category_id: parseInt(formData.category_id)
                    });
                }

                // 更新前端缓存
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

                // 先清空该项的所有分类，再重新写入单个分类以实现更新 (简化版处理)
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

    const handleEditItem = (item: InfoItem) => {
        setFormMode('edit');
        setEditingItem(item);
        setFormData({
            name: item.name,
            description: item.description || '',
            url: item.url || '',
            source_id: item.source_id ? item.source_id.toString() : '',
            category_id: item.category_ids.length > 0 ? item.category_ids[0].toString() : '',
            image_url: item.image_url || '',
            info_date: item.info_date || ''
        });
        setIsFormModalOpen(true);
    };

    return (
        <div className={`flex w-full h-screen overflow-hidden ${theme.bg} ${theme.textBase} transition-colors duration-500 font-sans`}>
            
            <InfoSidebar 
                theme={theme}
                isStudy={isStudy}
                isLoading={isLoading}
                sidebarMode={sidebarMode}
                setSidebarMode={setSidebarMode}
                mockGroups={mockGroups}
                mockSources={mockSources}
                mockItems={mockItems}
                selectedGroupId={selectedGroupId}
                setSelectedGroupId={setSelectedGroupId}
                selectedSourceId={selectedSourceId}
                setSelectedSourceId={setSelectedSourceId}
                expandedGroups={expandedGroups}
                toggleGroup={toggleGroup}
                handleReorderGroups={handleReorderGroups}
                handleReorderSources={handleReorderSources}
                queuedItems={queuedItems}
                scrollToCard={scrollToCard}
            />

            {/* === 右侧主内容区 === */}
            <main className="flex-1 h-full flex flex-col relative z-0">
                {/* 顶部: 分类导航与控制栏 */}
                <header className={`shrink-0 w-full px-10 py-6 border-b ${theme.border} flex items-center justify-between z-10 backdrop-blur-md bg-opacity-80`}>
                    
                    {/* 分类 Pilled Tabs */}
                    <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pr-4">
                        <button
                            onClick={() => setSelectedCategoryId(null)}
                            className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                                selectedCategoryId === null ? theme.activePill : theme.inactivePill
                            }`}
                        >
                            全部
                        </button>
                        {currentCategories.map(cat => (
                            <button
                                key={cat.id}
                                onClick={() => setSelectedCategoryId(cat.id)}
                                className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                                    selectedCategoryId === cat.id ? theme.activePill : theme.inactivePill
                                }`}
                            >
                                {cat.name}
                            </button>
                        ))}
                    </div>

                    {/* 控制栏: 排序 & 收藏置顶 & 创建按钮 */}
                    <div className="flex items-center gap-4 shrink-0 pl-4">
                        <button 
                            onClick={handleCreate}
                            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-bold shadow-sm transition-all hover:scale-105 active:scale-95 ${theme.activePill}`}
                        >
                            <Plus size={16} /> 录入信息
                        </button>

                        <div className={`h-4 w-px ${theme.border} mx-1`} />

                        <label className="flex items-center gap-2 cursor-pointer group" onClick={() => setPinFavorites(!pinFavorites)}>
                            <div className={`relative w-8 h-5 rounded-full transition-colors ${pinFavorites ? theme.activePill : (isStudy ? 'bg-slate-700' : 'bg-stone-300')}`}>
                                <div className={`absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-transform ${pinFavorites ? 'translate-x-3' : ''}`} />
                            </div>
                            <span className={`text-xs font-bold transition-colors ${pinFavorites ? theme.primary : theme.textMuted} group-hover:${theme.textBase}`}>
                                收藏置顶
                            </span>
                        </label>
                        
                        <div className={`h-4 w-px ${theme.border}`} />

                        <div className="flex items-center gap-2">
                            <SlidersHorizontal size={14} className={theme.textMuted} />
                            <select 
                                className={`bg-transparent text-sm font-bold outline-none cursor-pointer ${theme.textBase}`}
                                value={`${sortBy}-${sortOrder}`}
                                onChange={(e) => {
                                    const [by, order] = e.target.value.split('-');
                                    setSortBy(by as any);
                                    setSortOrder(order as any);
                                }}
                            >
                                <option value="info_date-desc">作用时间 (最新)</option>
                                <option value="info_date-asc">作用时间 (最早)</option>
                                <option value="created_at-desc">捕获时间 (最新)</option>
                                <option value="created_at-asc">捕获时间 (最早)</option>
                            </select>
                        </div>
                    </div>
                </header>

                {/* 内容网格 */}
                <div className="flex-1 overflow-y-auto px-10 py-8 relative scroll-smooth">
                    {isLoading ? (
                        <div className="w-full h-64 flex flex-col items-center justify-center opacity-50">
                            <Loader2 className={`animate-spin mb-4 ${theme.textMuted}`} size={40} />
                            <p className={`text-sm ${theme.textMuted}`}>正在接入信号网络 / SYNCING ...</p>
                        </div>
                    ) : (
                        <div className="max-w-7xl mx-auto pb-32">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                    {allFilteredItems.map((item) => {
                                        const sourceName = mockSources.find(s => s.id === item.source_id)?.name;
                                        const sourceImg = mockSources.find(s => s.id === item.source_id)?.image_url;
                                        const isHighlighted = highlightedCardId === item.id;
                                        
                                        const displayImage = item.image_url || sourceImg || undefined;

                                        return (
                                            <InfoCard
                                                key={item.id}
                                                item={item}
                                                theme={theme}
                                                isStudy={isStudy}
                                                displayImage={displayImage}
                                                isHighlighted={isHighlighted}
                                                onToggleFav={(i: InfoItem) => toggleStatus(null as any, i.id, 'is_favorited')}
                                                onToggleQueue={(i: InfoItem) => toggleStatus(null as any, i.id, 'is_queued')}
                                                onEdit={handleEditItem}
                                                onDeleteSuccess={fetchData}
                                            />
                                        );
                                    })}
                            </div>
                            {allFilteredItems.length === 0 && (
                                <div className="w-full py-20 flex flex-col items-center justify-center opacity-50">
                                    <Search size={48} className={`mb-4 ${theme.textMuted}`} />
                                    <p className={`text-sm ${theme.textMuted}`}>没有找到对应的存档信息</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </main>

            <InfoItemModal 
                isOpen={isFormModalOpen}
                onClose={() => setIsFormModalOpen(false)}
                formMode={formMode}
                formData={formData}
                setFormData={setFormData}
                isSaving={isSaving}
                handleSave={handleSave}
                theme={theme}
                mockSources={mockSources}
                currentCategories={mockCategories}
                type={type}
            />
        </div>
    );
}
