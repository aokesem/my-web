"use client";

import React, { useMemo } from 'react';
import { notFound, useParams } from 'next/navigation';
import { InfoSidebar } from '../components/InfoSidebar';
import { InfoItemModal } from '../components/InfoItemModal';
import { BookmarkModal } from '../components/BookmarkModal';
import { InfoListHeader } from '../components/InfoListHeader';
import { InfoContentGrid } from '../components/InfoContentGrid';

import { useInfoSourceData } from '../hooks/useInfoSourceData';
import { useInfoSourceFilters } from '../hooks/useInfoSourceFilters';
import { useInfoSourceModals } from '../hooks/useInfoSourceModals';

export default function InfoSourceListPage() {
    const params = useParams();
    const type = params.type as string;

    if (type !== 'study' && type !== 'life') {
        notFound();
    }

    const isStudy = type === 'study';

    // === 主题设计 tokens ===
    const theme = useMemo(() => ({
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
    }), [isStudy]);

    // 1. 数据获取与缓存层
    const data = useInfoSourceData(type);

    // 2. 本地过滤与派生层
    const filters = useInfoSourceFilters(
        type, data.mockCategories, data.mockItems, data.mockBookmarks, data.mockSources, data.isLoading
    );

    // 3. 弹窗表单状态层
    const modals = useInfoSourceModals(
        type, filters.viewMode, filters.selectedGroupId, filters.selectedSourceId, filters.selectedParentItemId,
        data.setItems, data.setBookmarks
    );

    return (
        <div className={`flex w-full h-screen overflow-hidden ${theme.bg} ${theme.textBase} transition-colors duration-500 font-sans`}>
            
            <InfoSidebar 
                theme={theme}
                isStudy={isStudy}
                isLoading={data.isLoading}
                sidebarMode={filters.sidebarMode}
                setSidebarMode={filters.setSidebarMode}
                mockGroups={data.mockGroups}
                mockSources={data.mockSources}
                mockItems={data.mockItems}
                selectedGroupId={filters.selectedGroupId}
                setSelectedGroupId={filters.setSelectedGroupId}
                selectedSourceId={filters.selectedSourceId}
                setSelectedSourceId={filters.setSelectedSourceId}
                expandedGroups={data.expandedGroups}
                toggleGroup={data.toggleGroup}
                handleReorderGroups={data.handleReorderGroups}
                handleReorderSources={data.handleReorderSources}
                queuedItems={filters.viewMode === 'hub' ? filters.queuedItems : (filters.queuedBookmarks as any)}
                scrollToCard={filters.scrollToCard}
            />

            {/* === 右侧主内容区 === */}
            <main className="flex-1 h-full flex flex-col relative z-0">
                <InfoListHeader 
                    theme={theme}
                    isStudy={isStudy}
                    viewMode={filters.viewMode}
                    setViewMode={filters.setViewMode}
                    setSelectedParentItemId={filters.setSelectedParentItemId}
                    currentCategories={filters.currentCategories}
                    selectedCategoryId={filters.selectedCategoryId}
                    setSelectedCategoryId={filters.setSelectedCategoryId}
                    handleCreate={modals.handleCreate}
                    pinFavorites={filters.pinFavorites}
                    setPinFavorites={filters.setPinFavorites}
                    sortBy={filters.sortBy}
                    setSortBy={filters.setSortBy}
                    sortOrder={filters.sortOrder}
                    setSortOrder={filters.setSortOrder}
                />

                <InfoContentGrid 
                    isLoading={data.isLoading}
                    theme={theme}
                    isStudy={isStudy}
                    viewMode={filters.viewMode}
                    allFilteredItems={filters.allFilteredItems}
                    allFilteredBookmarks={filters.allFilteredBookmarks}
                    mockSources={data.mockSources}
                    mockItems={data.mockItems}
                    currentCategories={filters.currentCategories}
                    highlightedCardId={filters.highlightedCardId}
                    toggleStatus={data.toggleStatus}
                    toggleBookmarkStatus={data.toggleBookmarkStatus}
                    handleEditItem={modals.handleEditItem}
                    handleEditBookmark={modals.handleEditBookmark}
                    fetchData={data.fetchData}
                    setSelectedParentItemId={filters.setSelectedParentItemId}
                    setViewMode={filters.setViewMode}
                />
            </main>

            <InfoItemModal 
                isOpen={modals.isFormModalOpen}
                onClose={() => modals.setIsFormModalOpen(false)}
                formMode={modals.formMode}
                formData={modals.formData}
                setFormData={modals.setFormData}
                isSaving={modals.isSaving}
                handleSave={modals.handleSave}
                theme={theme}
                mockSources={data.mockSources}
                mockGroups={data.mockGroups}
                currentCategories={filters.currentCategories}
                type={type}
            />

            <BookmarkModal
                isOpen={modals.isBookmarkModalOpen}
                onClose={() => modals.setIsBookmarkModalOpen(false)}
                formMode={modals.bookmarkFormMode}
                formData={modals.bookmarkFormData}
                setFormData={modals.setBookmarkFormData}
                isSaving={modals.isSaving}
                handleSave={modals.handleSaveBookmark}
                theme={theme}
                mockGroups={data.mockGroups}
                mockSources={data.mockSources}
                mockItems={data.mockItems}
                currentCategories={filters.currentCategories}
            />
        </div>
    );
}
