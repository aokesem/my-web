import React from 'react';
import { Plus, SlidersHorizontal } from 'lucide-react';
import { InfoCategory } from '../types';

interface InfoListHeaderProps {
    theme: any;
    isStudy: boolean;
    viewMode: 'hub' | 'bookmarks';
    setViewMode: (mode: 'hub' | 'bookmarks') => void;
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
        <header className={`shrink-0 w-full px-10 py-6 border-b ${theme.border} flex items-center justify-between z-10 backdrop-blur-md bg-opacity-80`}>
            {/* View Mode Switcher */}
            <div className="flex items-center bg-black/5 dark:bg-white/5 p-1 rounded-full mr-4 shrink-0">
                <button 
                    onClick={() => { setViewMode('hub'); setSelectedParentItemId(null); }}
                    className={`px-4 py-1.5 rounded-full text-sm font-bold transition-all ${viewMode === 'hub' ? theme.activePill + ' shadow-md' : 'text-stone-500 hover:bg-black/5 dark:hover:bg-white/5'}`}
                >
                    源站导航
                </button>
                <button 
                    onClick={() => setViewMode('bookmarks')}
                    className={`px-4 py-1.5 rounded-full text-sm font-bold transition-all ${viewMode === 'bookmarks' ? theme.activePill + ' shadow-md' : 'text-stone-500 hover:bg-black/5 dark:hover:bg-white/5'}`}
                >
                    具体收藏
                </button>
            </div>

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
    );
}
