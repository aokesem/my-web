"use client";

import React, { useMemo, useState } from 'react';
import { notFound, useParams } from 'next/navigation';
import { toast } from 'sonner';
import { InfoSidebar } from '../components/InfoSidebar';
import { InfoItemModal } from '../components/InfoItemModal';
import { BookmarkModal } from '../components/BookmarkModal';
import { InfoListHeader } from '../components/InfoListHeader';
import { InfoContentGrid } from '../components/InfoContentGrid';
import { FolderSettingsModal } from '../components/FolderSettingsModal';
import { InfoItem } from '../types';

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
        iconHoverBg: isStudy ? 'hover:bg-slate-700' : 'hover:bg-stone-100',
    }), [isStudy]);

    const data = useInfoSourceData(type);

    const filters = useInfoSourceFilters(
        type, data.mockCategories, data.mockItems, data.mockBookmarks, data.isLoading
    );

    const modals = useInfoSourceModals(
        type,
        filters.viewMode,
        filters.sidebarSelection,
        data.setItems,
        data.setBookmarks,
        data.mockItems
    );

    const [folderSettingsItem, setFolderSettingsItem] = useState<InfoItem | null>(null);
    const [isFolderSettingsOpen, setIsFolderSettingsOpen] = useState(false);
    const [isFolderSaving, setIsFolderSaving] = useState(false);

    const handleOpenFolderSettings = (item: InfoItem) => {
        setFolderSettingsItem(item);
        setIsFolderSettingsOpen(true);
    };

    const handleSaveFolderSettings = async (payload: {
        name: string;
        reminder_interval_days: number;
    }) => {
        if (!folderSettingsItem) return;
        setIsFolderSaving(true);
        try {
            await data.updateItemReminderSettings(folderSettingsItem.id, payload);
            setIsFolderSettingsOpen(false);
            setFolderSettingsItem(null);
            toast.success('收藏夹设置已保存');
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : '保存失败';
            toast.error(msg);
        } finally {
            setIsFolderSaving(false);
        }
    };

    return (
        <div className={`flex w-full h-screen overflow-hidden ${theme.bg} ${theme.textBase} transition-colors duration-500 font-sans`}>
            <InfoSidebar
                theme={theme}
                isStudy={isStudy}
                isLoading={data.isLoading}
                sidebarMode={filters.sidebarMode}
                setSidebarMode={filters.setSidebarMode}
                mockItems={data.mockItems}
                mockBookmarks={data.mockBookmarks}
                sidebarSelection={filters.sidebarSelection}
                onSelectAllHubs={filters.selectAllHubs}
                onSelectHub={filters.selectHub}
                onSelectUngrouped={filters.selectUngroupedEntries}
                handleReorderItems={data.handleReorderItems}
                onOpenFolderSettings={handleOpenFolderSettings}
                queuedBookmarks={filters.queuedBookmarks}
                scrollToCard={filters.scrollToCard}
            />

            <main className="flex-1 h-full flex flex-col relative z-0">
                <InfoListHeader
                    theme={theme}
                    isStudy={isStudy}
                    viewMode={filters.viewMode}
                    activeHubName={filters.activeHub?.name}
                    onShowAllHubs={filters.selectAllHubs}
                    onShowEntries={() => filters.setViewMode('entries')}
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
                    mockItems={data.mockItems}
                    currentCategories={filters.currentCategories}
                    highlightedCardId={filters.highlightedCardId}
                    toggleStatus={data.toggleStatus}
                    toggleBookmarkStatus={data.toggleBookmarkStatus}
                    handleEditItem={modals.handleEditItem}
                    handleEditBookmark={modals.handleEditBookmark}
                    fetchData={data.fetchData}
                    onSelectHub={filters.selectHub}
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
                mockItems={data.mockItems}
                currentCategories={filters.currentCategories}
            />

            <FolderSettingsModal
                isOpen={isFolderSettingsOpen}
                onClose={() => {
                    setIsFolderSettingsOpen(false);
                    setFolderSettingsItem(null);
                }}
                item={folderSettingsItem}
                isSaving={isFolderSaving}
                onSave={handleSaveFolderSettings}
            />
        </div>
    );
}
