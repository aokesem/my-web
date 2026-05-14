import React from 'react';
import { Plus, SlidersHorizontal } from 'lucide-react';
import { InfoCategory, InfoSourceViewMode } from '../types';

interface InfoListHeaderProps {
    theme: any;
    isStudy: boolean;
    viewMode: InfoSourceViewMode;
    setViewMode: (mode: InfoSourceViewMode) => void;
    setSelectedParentItemId: (id: number | null) => void;
    currentCategories: InfoCategory[];
    selectedCategoryId: number | null;
    setSelectedCategoryId: (id: number | null) => void;
    handleCreate: () => void;
    pinFavorites: boolean;
    setPinFavorites: (pin: boolean) => void;
    sortBy: 'info_date' | 'created_at';
    setSortBy: (by: 'info_date' | 'created_at') => void;
    sortOrder: 'desc' | 'asc';
    setSortOrder: (order: 'desc' | 'asc') => void;
}

export function InfoListHeader({
    theme,
    isStudy,
    viewMode,
    setViewMode,
    setSelectedParentItemId,
    currentCategories,
    selectedCategoryId,
    setSelectedCategoryId,
    handleCreate,
    pinFavorites,
    setPinFavorites,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder
}: InfoListHeaderProps) {
    return (
        <header className={`shrink-0 w-full px-10 py-5 border-b ${theme.border} flex flex-col gap-3 z-10 backdrop-blur-md bg-opacity-80`}>
            {/* 第一行：视图切换 + 操作区，分类不再挤在中间 */}
            <div className="flex items-center justify-between gap-4 min-w-0 w-full">
                <div className="flex items-center bg-black/5 dark:bg-white/5 p-1 rounded-full shrink-0">
                    <button
                        type="button"
                        onClick={() => { setViewMode('folders'); setSelectedParentItemId(null); }}
                        className={`px-4 py-1.5 rounded-full text-sm font-bold transition-all ${viewMode === 'folders' ? theme.activePill + ' shadow-md' : 'text-stone-500 hover:bg-black/5 dark:hover:bg-white/5'}`}
                    >
                        收藏夹 <span className="font-mono text-[11px] font-normal opacity-80">Folders</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setViewMode('entries')}
                        className={`px-4 py-1.5 rounded-full text-sm font-bold transition-all ${viewMode === 'entries' ? theme.activePill + ' shadow-md' : 'text-stone-500 hover:bg-black/5 dark:hover:bg-white/5'}`}
                    >
                        信息条目 <span className="font-mono text-[11px] font-normal opacity-80">Entries</span>
                    </button>
                </div>

                <div className="flex items-center gap-3 sm:gap-4 shrink-0 min-w-0">
                    <button
                        type="button"
                        onClick={handleCreate}
                        className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-bold shadow-sm transition-all hover:scale-105 active:scale-95 shrink-0 ${theme.activePill}`}
                    >
                        <Plus size={16} /> 录入 <span className="font-mono text-[10px] font-normal opacity-90">Add</span>
                    </button>

                    <div className={`h-4 w-px shrink-0 ${theme.border}`} />

                    <label className="flex items-center gap-2 cursor-pointer group shrink-0" onClick={() => setPinFavorites(!pinFavorites)}>
                        <div className={`relative w-8 h-5 rounded-full transition-colors ${pinFavorites ? theme.activePill : (isStudy ? 'bg-slate-700' : 'bg-stone-300')}`}>
                            <div className={`absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-transform ${pinFavorites ? 'translate-x-3' : ''}`} />
                        </div>
                        <span className={`text-xs font-bold transition-colors whitespace-nowrap ${pinFavorites ? theme.primary : theme.textMuted} group-hover:${theme.textBase}`}>
                            收藏置顶 <span className="font-mono text-[9px] font-normal opacity-80">Pin ★</span>
                        </span>
                    </label>

                    <div className={`h-4 w-px shrink-0 ${theme.border}`} />

                    <div className="flex items-center gap-2 min-w-0 max-w-[min(100%,12rem)] sm:max-w-[18rem] md:max-w-none">
                        <SlidersHorizontal size={14} className={`shrink-0 ${theme.textMuted}`} />
                        <select
                            className={`bg-transparent text-xs sm:text-sm font-bold outline-none cursor-pointer min-w-0 ${theme.textBase}`}
                            value={`${sortBy}-${sortOrder}`}
                            onChange={(e) => {
                                const [by, order] = e.target.value.split('-');
                                setSortBy(by as 'info_date' | 'created_at');
                                setSortOrder(order as 'desc' | 'asc');
                            }}
                        >
                            <option value="info_date-desc">作用时间 (最新) · info_date ↓</option>
                            <option value="info_date-asc">作用时间 (最早) · info_date ↑</option>
                            <option value="created_at-desc">捕获时间 (最新) · created ↓</option>
                            <option value="created_at-asc">捕获时间 (最早) · created ↑</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* 第二行：功能专栏筛选，独占一行可横向滚动 */}
            <div className={`w-full min-w-0 pt-2 border-t border-black/5 dark:border-white/10`}>
                <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-0.5 -mx-1 px-1">
                    <button
                        type="button"
                        onClick={() => setSelectedCategoryId(null)}
                        className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                            selectedCategoryId === null ? theme.activePill : theme.inactivePill
                        }`}
                    >
                        全部 <span className="font-mono text-[10px] opacity-70">All</span>
                    </button>
                    {currentCategories.map(cat => (
                        <button
                            type="button"
                            key={cat.id}
                            onClick={() => setSelectedCategoryId(cat.id)}
                            className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                                selectedCategoryId === cat.id ? theme.activePill : theme.inactivePill
                            }`}
                        >
                            {cat.name}
                        </button>
                    ))}
                </div>
            </div>
        </header>
    );
}
