"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { notFound, useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Library, Target, ListTodo, SlidersHorizontal, Star, Search, Clock, Plus, ExternalLink, Bookmark, Edit, Trash2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { mockCategories, mockItems, mockSources, InfoItem, CategoryType } from '../mockData';

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

    // === 状态管理 ===
    const [sidebarMode, setSidebarMode] = useState<'source' | 'queue'>('source');
    const [selectedSourceId, setSelectedSourceId] = useState<number | null>(null);
    const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
    const [sortBy, setSortBy] = useState<'info_date' | 'created_at'>('created_at');
    const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
    const [pinFavorites, setPinFavorites] = useState(true);

    const [highlightedCardId, setHighlightedCardId] = useState<number | null>(null);
    const [pendingScrollId, setPendingScrollId] = useState<number | null>(null);

    // Modal 状态
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
    const [editingItem, setEditingItem] = useState<InfoItem | null>(null);

    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [deletingItemId, setDeletingItemId] = useState<number | null>(null);

    // === 数据派生 ===
    const currentCategories = useMemo(() => mockCategories.filter(c => c.category_type === type), [type]);

    const allFilteredItems = useMemo(() => {
        let items = mockItems.filter(item => item.category_type === type);

        if (selectedSourceId !== null) {
            items = items.filter(item => item.source_id === selectedSourceId);
        }

        if (selectedCategoryId !== null) {
            items = items.filter(item => item.category_ids.includes(selectedCategoryId));
        }

        // 排序逻辑
        items.sort((a, b) => {
            // 收藏置顶
            if (pinFavorites) {
                if (a.is_favorited && !b.is_favorited) return -1;
                if (!a.is_favorited && b.is_favorited) return 1;
            }

            // sort_order 权重置顶 (假设大于0为置顶，越大越前)
            if (a.sort_order !== b.sort_order) {
                return b.sort_order - a.sort_order;
            }

            // 时间排序
            const timeA = new Date(a[sortBy] || a.created_at).getTime();
            const timeB = new Date(b[sortBy] || b.created_at).getTime();

            return sortOrder === 'desc' ? timeB - timeA : timeA - timeB;
        });

        return items;
    }, [type, selectedSourceId, selectedCategoryId, sortBy, sortOrder, pinFavorites]);

    const queuedItems = useMemo(() => mockItems.filter(i => i.category_type === type && i.is_queued), [type]);

    // 动作处理函数
    const scrollToCard = (id: number) => {
        const item = mockItems.find(i => i.id === id);
        if (!item) return;

        const el = document.getElementById(`info-card-${id}`);
        if (el) {
            // 如果已在 DOM 中，直接滚动
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            setHighlightedCardId(id);
            setTimeout(() => setHighlightedCardId(null), 1500);
        } else {
            // 如果不在 DOM 中（被过滤了），先切换滤镜
            // 默认切换到该条目所属的来源和它的第一个分类
            setSelectedSourceId(item.source_id || null);
            setSelectedCategoryId(item.category_ids[0] || null);
            setPendingScrollId(id);
        }
    };

    // 监听等待滚动的 ID
    useEffect(() => {
        if (pendingScrollId) {
            const el = document.getElementById(`info-card-${pendingScrollId}`);
            if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                setHighlightedCardId(pendingScrollId);
                setTimeout(() => setHighlightedCardId(null), 1500);
                setPendingScrollId(null); // 清除标记
            }
        }
    }, [pendingScrollId, allFilteredItems]); // 依赖项包含列表数据更新

    const handleCreate = () => {
        setFormMode('create');
        setEditingItem(null);
        setIsFormModalOpen(true);
    };

    const handleEdit = (e: React.MouseEvent, item: InfoItem) => {
        e.stopPropagation();
        setFormMode('edit');
        setEditingItem(item);
        setIsFormModalOpen(true);
    };

    const handleDelete = (e: React.MouseEvent, id: number) => {
        e.stopPropagation();
        setDeletingItemId(id);
        setIsDeleteModalOpen(true);
    };

    return (
        <div className={`flex w-full h-screen overflow-hidden ${theme.bg} ${theme.textBase} transition-colors duration-500 font-sans`}>

            {/* === 左侧边栏 === */}
            <aside className={`w-72 shrink-0 h-full flex flex-col border-r ${theme.border} ${theme.sidebarBg} relative z-10`}>
                {/* 顶部标题区 */}
                <div className="p-6 pb-4">
                    <Link
                        href="/library/info-source"
                        className={`inline-flex items-center gap-2 mb-6 text-[11px] font-mono tracking-widest uppercase transition-colors hover:${theme.primary} ${theme.textMuted}`}
                    >
                        <ArrowLeft size={14} /> Back to Hub
                    </Link>

                    <h1 className="text-2xl font-bold tracking-tight capitalize flex items-center gap-3">
                        {isStudy ? 'Study Nexus' : 'Life Archive'}
                    </h1>
                    <p className={`text-xs mt-2 ${theme.textMuted}`}>
                        {isStudy ? '学术与工具的沉淀之地' : '日常灵感的闪光记录'}
                    </p>
                </div>

                {/* Sidebar 模式切换 */}
                <div className="px-6 mb-4">
                    <div className={`flex p-1 rounded-xl ${isStudy ? 'bg-slate-800' : 'bg-stone-200'}`}>
                        <button
                            onClick={() => setSidebarMode('source')}
                            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${sidebarMode === 'source' ? `${theme.cardBg} shadow-sm ${theme.textBase}` : `${theme.textMuted} hover:text-opacity-80`
                                }`}
                        >
                            <Library size={14} /> 来源
                        </button>
                        <button
                            onClick={() => setSidebarMode('queue')}
                            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${sidebarMode === 'queue' ? `${theme.cardBg} shadow-sm ${theme.textBase}` : `${theme.textMuted} hover:text-opacity-80`
                                }`}
                        >
                            <ListTodo size={14} /> 待看
                            {queuedItems.length > 0 && (
                                <span className={`px-1.5 py-0.5 rounded-md text-[10px] ${sidebarMode === 'queue' ? theme.activePill : isStudy ? 'bg-slate-700 text-slate-300' : 'bg-stone-300 text-stone-600'}`}>
                                    {queuedItems.length}
                                </span>
                            )}
                        </button>
                    </div>
                </div>

                {/* Sidebar 列表内容 */}
                <div className="flex-1 overflow-y-auto px-4 pb-6 scrollbar-hide">
                    <AnimatePresence mode='wait'>
                        {sidebarMode === 'source' ? (
                            <motion.div
                                key="source"
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 10 }}
                                transition={{ duration: 0.2 }}
                                className="space-y-1 mt-2"
                            >
                                <button
                                    onClick={() => setSelectedSourceId(null)}
                                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${selectedSourceId === null ? theme.primaryBg + ' ' + theme.primary : `transparent hover:${theme.cardBg}`
                                        }`}
                                >
                                    <span className="text-sm font-bold">全部来源</span>
                                </button>
                                {mockSources.map(source => {
                                    const count = mockItems.filter(i => i.category_type === type && i.source_id === source.id).length;
                                    const isActive = selectedSourceId === source.id;
                                    return (
                                        <button
                                            key={source.id}
                                            onClick={() => setSelectedSourceId(source.id)}
                                            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all group ${isActive ? theme.primaryBg + ' ' + theme.primary : `transparent hover:${theme.cardBg}`
                                                }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                {source.image_url ? (
                                                    <img src={source.image_url} alt="" className={`w-5 h-5 rounded object-cover ${!isActive && 'grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100'}`} />
                                                ) : (
                                                    <div className={`w-5 h-5 rounded bg-gray-500/20`} />
                                                )}
                                                <span className={`text-sm ${isActive ? 'font-bold' : 'font-medium group-hover:font-semibold'}`}>{source.name}</span>
                                            </div>
                                            {count > 0 && (
                                                <span className={`text-xs font-mono px-2 py-0.5 rounded-md transition-colors ${isActive ? (isStudy ? 'bg-blue-500/20' : 'bg-amber-500/20') : (isStudy ? 'bg-slate-800' : 'bg-stone-200 group-hover:bg-stone-300')}`}>
                                                    {count}
                                                </span>
                                            )}
                                        </button>
                                    )
                                })}
                            </motion.div>
                        ) : (
                            <motion.div
                                key="queue"
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                transition={{ duration: 0.2 }}
                                className="space-y-2 mt-2"
                            >
                                {queuedItems.length === 0 ? (
                                    <div className={`text-center py-10 text-sm ${theme.textMuted}`}>
                                        当前没有待看任务
                                    </div>
                                ) : (
                                    queuedItems.map(item => (
                                        <div
                                            key={item.id}
                                            className={`w-full flex items-center gap-3 p-3 rounded-xl cursor-pointer ${theme.queueCardBg} border border-transparent hover:${theme.border} transition-all duration-300 group hover:scale-[1.02]`}
                                            onClick={() => scrollToCard(item.id)}
                                        >
                                            <div className="w-8 h-8 rounded shrink-0 overflow-hidden bg-black/10 flex items-center justify-center">
                                                {item.image_url ? (
                                                    <img src={item.image_url} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    <Target size={14} className={theme.textMuted} />
                                                )}
                                            </div>
                                            <div className="flex-1 overflow-hidden">
                                                <h4 className="text-[13px] font-medium truncate group-hover:text-clip">{item.name}</h4>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className={`text-[9px] font-mono uppercase ${theme.primary}`}>Queue</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </aside>

            {/* === 右侧主内容区 === */}
            <main className="flex-1 h-full flex flex-col relative z-0">
                {/* 顶部: 分类导航与控制栏 */}
                <header className={`shrink-0 w-full px-10 py-6 border-b ${theme.border} flex items-center justify-between z-10 backdrop-blur-md bg-opacity-80`}>

                    {/* 分类 Pilled Tabs */}
                    <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pr-4">
                        <button
                            onClick={() => setSelectedCategoryId(null)}
                            className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${selectedCategoryId === null ? theme.activePill : theme.inactivePill
                                }`}
                        >
                            全部
                        </button>
                        {currentCategories.map(cat => (
                            <button
                                key={cat.id}
                                onClick={() => setSelectedCategoryId(cat.id)}
                                className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${selectedCategoryId === cat.id ? theme.activePill : theme.inactivePill
                                    }`}
                            >
                                {cat.name}
                            </button>
                        ))}
                    </div>

                    {/* 控制栏: 排序 & 收藏置顶 & 创建按钮 */}
                    <div className="flex items-center gap-4 shrink-0 pl-4">
                        {/* 新建按钮 */}
                        <button
                            onClick={handleCreate}
                            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-bold shadow-sm transition-all hover:scale-105 active:scale-95 ${theme.activePill}`}
                        >
                            <Plus size={16} /> 录入信息
                        </button>

                        <div className={`h-4 w-px ${theme.border} mx-1`} />

                        <label className="flex items-center gap-2 cursor-pointer group">
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
                    <div className="max-w-7xl mx-auto pb-32">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {allFilteredItems.map((item) => {
                                    const sourceName = mockSources.find(s => s.id === item.source_id)?.name;
                                    const sourceImg = mockSources.find(s => s.id === item.source_id)?.image_url;
                                    const isHighlighted = highlightedCardId === item.id;

                                    return (
                                        <motion.div
                                            key={item.id}
                                            id={`info-card-${item.id}`}
                                            layout="position"
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{
                                                layout: { type: "tween", ease: "easeOut", duration: 0.2 },
                                                opacity: { duration: 0.15 }
                                            }}
                                            className={`flex flex-col rounded-2xl border ${theme.border} ${theme.cardBg} ${theme.cardHover} transition-all duration-500 overflow-hidden group relative shadow-sm hover:shadow-xl ${isHighlighted ? theme.highlightRing + ' scale-[1.02] z-10' : ''}`}
                                        >
                                            {/* 封面图片区 */}
                                            <div className={`w-full h-32 relative shrink-0 ${isStudy ? 'bg-slate-800' : 'bg-stone-100'} overflow-hidden`}>
                                                {item.image_url ? (
                                                    <img src={item.image_url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                                                ) : (
                                                    <div className="flex items-center justify-center w-full h-full opacity-20">
                                                        <Search size={40} className={theme.textMuted} />
                                                    </div>
                                                )}

                                                {/* 右上角多功能操作悬浮菜单 */}
                                                <div className="absolute top-2 right-2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-150">

                                                    {/* 行内动作：收藏 & 待看 */}
                                                    <div className="flex flex-col gap-1.5 bg-black/40 backdrop-blur-md p-1.5 rounded-full shadow-lg border border-white/10">
                                                        <button
                                                            className={`p-1.5 rounded-full hover:bg-white/20 transition-colors ${item.is_favorited ? 'text-yellow-400' : 'text-white'}`}
                                                            title="收藏"
                                                        >
                                                            <Star size={14} fill={item.is_favorited ? "currentColor" : "none"} />
                                                        </button>
                                                        <button
                                                            className={`p-1.5 rounded-full hover:bg-white/20 transition-colors ${item.is_queued ? 'text-green-400' : 'text-white'}`}
                                                            title={item.is_queued ? "移出待看" : "加入待看"}
                                                        >
                                                            <Bookmark size={14} fill={item.is_queued ? "currentColor" : "none"} />
                                                        </button>
                                                    </div>

                                                    {/* 行内动作：编辑 & 删除 */}
                                                    <div className="flex flex-col gap-1.5 bg-black/40 backdrop-blur-md p-1.5 rounded-full shadow-lg border border-white/10 mt-1">
                                                        <button
                                                            onClick={(e) => handleEdit(e, item)}
                                                            className="p-1.5 rounded-full text-white hover:bg-blue-500/50 transition-colors"
                                                            title="修改信息"
                                                        >
                                                            <Edit size={14} />
                                                        </button>
                                                        <button
                                                            onClick={(e) => handleDelete(e, item.id)}
                                                            className="p-1.5 rounded-full text-white hover:bg-red-500/50 transition-colors"
                                                            title="删除信息"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>

                                                </div>

                                                {/* 来源小拼贴 (左下角) */}
                                                {sourceName && (
                                                    <div className={`absolute bottom-2 left-2 flex items-center gap-1.5 px-2 py-1 rounded-md backdrop-blur-md bg-black/50 text-white`}>
                                                        {sourceImg && <img src={sourceImg} alt="" className="w-3 h-3 rounded" />}
                                                        <span className="text-[10px] font-medium leading-none">{sourceName}</span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* 文本内容区 */}
                                            <div className="p-5 flex flex-col flex-1">
                                                {/* 分类标签 */}
                                                <div className="flex flex-wrap gap-1.5 mb-3">
                                                    {item.category_ids.map(cid => {
                                                        const cName = mockCategories.find(c => c.id === cid)?.name;
                                                        return cName ? (
                                                            <span key={cid} className={`text-[10px] px-2 py-0.5 rounded-full border ${theme.border} ${theme.textMuted}`}>
                                                                {cName}
                                                            </span>
                                                        ) : null;
                                                    })}
                                                </div>

                                                <h3 className={`font-bold text-base leading-snug mb-2 line-clamp-2 ${theme.textBase}`}>
                                                    {item.name}
                                                </h3>

                                                {item.description && (
                                                    <p className={`text-xs line-clamp-2 mb-4 ${theme.textMuted}`}>
                                                        {item.description}
                                                    </p>
                                                )}

                                                {/* 底部信息与动作 */}
                                                <div className="mt-auto pt-4 flex items-center justify-between">
                                                    <div className={`flex items-center gap-1 text-[10px] font-mono ${theme.textMuted}`}>
                                                        <Clock size={12} />
                                                        {item.info_date || item.created_at.split('T')[0]}
                                                    </div>

                                                    {item.url && (
                                                        <a
                                                            href={item.url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className={`text-xs font-bold ${theme.primary} flex items-center gap-1 hover:underline cursor-pointer`}
                                                        >
                                                            前往 <ExternalLink size={12} />
                                                        </a>
                                                    )}
                                                </div>
                                            </div>

                                            {/* 如果有权重则发光底边或标识 */}
                                            {item.sort_order > 0 && (
                                                <div className={`absolute bottom-0 left-0 w-full h-1 ${isStudy ? 'bg-blue-500/50' : 'bg-amber-500/50'}`} />
                                            )}
                                        </motion.div>
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
                </div>
            </main>

            {/* ============================================================== */}
            {/* ======================= UI 弹窗层 (Mock) ====================== */}
            {/* ============================================================== */}
            <AnimatePresence>
                {/* 1. 录入/修改信息的弹窗 */}
                {isFormModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                            onClick={() => setIsFormModalOpen(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: -20 }}
                            className={`relative w-full max-w-lg p-8 rounded-3xl shadow-2xl ${theme.cardBg} border ${theme.border} z-10`}
                        >
                            <button onClick={() => setIsFormModalOpen(false)} className={`absolute top-6 right-6 p-2 rounded-full hover:bg-black/5 ${theme.textMuted}`}>
                                <X size={20} />
                            </button>
                            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                                {formMode === 'create' ? <Plus size={24} className={theme.primary} /> : <Edit size={24} className={theme.primary} />}
                                {formMode === 'create' ? '录入新信息' : '修改核心参数'}
                            </h2>
                            <div className="space-y-4">
                                <div>
                                    <label className={`block text-xs font-bold mb-1.5 ${theme.textMuted}`}>INFO_NAME / 标题标识*</label>
                                    <input type="text" defaultValue={editingItem?.name || ''} placeholder="例如: React最新架构解析" className={`w-full px-4 py-3 rounded-xl border ${theme.border} bg-transparent outline-none focus:${theme.primaryBorder} focus:ring-1 focus:ring-current text-sm`} />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className={`block text-xs font-bold mb-1.5 ${theme.textMuted}`}>SOURCE / 溯源基站</label>
                                        <select className={`w-full px-4 py-3 rounded-xl border ${theme.border} bg-transparent outline-none text-sm`}>
                                            <option value="">未分类来源</option>
                                            {mockSources.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className={`block text-xs font-bold mb-1.5 ${theme.textMuted}`}>CATEGORY / 从属矩阵</label>
                                        <select className={`w-full px-4 py-3 rounded-xl border ${theme.border} bg-transparent outline-none text-sm`}>
                                            <option value="">选择子类</option>
                                            {currentCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className={`block text-xs font-bold mb-1.5 ${theme.textMuted}`}>DATA_URL / 直接超链接</label>
                                    <input type="text" defaultValue={editingItem?.url || ''} placeholder="https://..." className={`w-full px-4 py-3 rounded-xl border ${theme.border} bg-transparent outline-none focus:${theme.primaryBorder} focus:ring-1 focus:ring-current text-sm`} />
                                </div>
                                <div>
                                    <label className={`block text-xs font-bold mb-1.5 ${theme.textMuted}`}>NOTE / 扩展描述</label>
                                    <textarea defaultValue={editingItem?.description || ''} placeholder="记录核心价值或重点摘要..." rows={3} className={`w-full px-4 py-3 rounded-xl border ${theme.border} bg-transparent outline-none focus:${theme.primaryBorder} focus:ring-1 focus:ring-current text-sm resize-none`} />
                                </div>
                                <div className="pt-4 flex justify-end gap-3">
                                    <button onClick={() => setIsFormModalOpen(false)} className={`px-6 py-2.5 rounded-xl text-sm font-bold border ${theme.border} ${theme.textMuted} hover:${theme.cardHover} transition-colors`}>取消</button>
                                    <button onClick={() => { alert('阶段四: 连接 Supabase 后将真正执行数据保存!'); setIsFormModalOpen(false); }} className={`px-6 py-2.5 rounded-xl text-sm font-bold shadow-md ${theme.activePill} hover:opacity-90 transition-opacity`}>确认上传</button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}

                {/* 2. 删除确认弹窗 */}
                {isDeleteModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                            onClick={() => setIsDeleteModalOpen(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className={`relative w-full max-w-sm p-8 rounded-3xl shadow-2xl ${theme.cardBg} border ${theme.border} z-10 flex flex-col items-center text-center`}
                        >
                            <div className="w-16 h-16 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center mb-6">
                                <Trash2 size={32} />
                            </div>
                            <h2 className="text-xl font-bold mb-2">破坏性确认</h2>
                            <p className={`text-sm mb-8 ${theme.textMuted}`}>此操作将永久抹除编号为 {deletingItemId} 的记录，它无法被恢复。你确定要执行清除指令吗？</p>
                            <div className="flex w-full gap-4">
                                <button onClick={() => setIsDeleteModalOpen(false)} className={`flex-1 py-3 rounded-xl text-sm font-bold border ${theme.border} ${theme.textMuted} hover:${theme.cardHover} transition-colors`}>撤回操作</button>
                                <button onClick={() => { alert('阶段四: 连接 Supabase 后将真正擦除该条目!'); setIsDeleteModalOpen(false); }} className={`flex-1 py-3 rounded-xl text-sm font-bold bg-red-500 text-white shadow-md hover:bg-red-600 transition-colors`}>确认擦除</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
