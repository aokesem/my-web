import React from 'react';
import { Loader2, Search } from 'lucide-react';
import { InfoItem, InfoSource, InfoBookmark, InfoCategory } from '../types';
import { InfoCard } from './InfoCard';
import { BookmarkCard } from './BookmarkCard';

interface InfoContentGridProps {
    isLoading: boolean;
    theme: any;
    isStudy: boolean;
    viewMode: 'hub' | 'bookmarks';
    allFilteredItems: InfoItem[];
    allFilteredBookmarks: InfoBookmark[];
    mockSources: InfoSource[];
    mockItems: InfoItem[];
    currentCategories: InfoCategory[];
    highlightedCardId: number | null;
    toggleStatus: (e: React.MouseEvent | null, id: number, field: 'is_favorited' | 'is_queued') => void;
    toggleBookmarkStatus: (e: React.MouseEvent | null, id: number, field: 'is_favorited' | 'is_queued' | 'is_read') => void;
    handleEditItem: (item: InfoItem) => void;
    handleEditBookmark: (bookmark: InfoBookmark) => void;
    fetchData: () => void;
    setSelectedParentItemId: (id: number | null) => void;
    setViewMode: (mode: 'hub' | 'bookmarks') => void;
}

export function InfoContentGrid({
    isLoading,
    theme,
    isStudy,
    viewMode,
    allFilteredItems,
    allFilteredBookmarks,
    mockSources,
    mockItems,
    currentCategories,
    highlightedCardId,
    toggleStatus,
    toggleBookmarkStatus,
    handleEditItem,
    handleEditBookmark,
    fetchData,
    setSelectedParentItemId,
    setViewMode
}: InfoContentGridProps) {
    if (isLoading) {
        return (
            <div className="flex-1 overflow-y-auto px-10 py-8 relative scroll-smooth flex flex-col items-center justify-center opacity-50">
                <Loader2 className={`animate-spin mb-4 ${theme.textMuted}`} size={40} />
                <p className={`text-sm ${theme.textMuted}`}>正在接入信号网络 / SYNCING ...</p>
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-y-auto px-10 py-8 relative scroll-smooth">
            <div className="max-w-7xl mx-auto pb-32">
                {viewMode === 'hub' ? (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {allFilteredItems.map((item) => {
                                const sourceName = mockSources.find(s => s.id === item.source_id)?.name;
                                const sourceImg = mockSources.find(s => s.id === item.source_id)?.image_url;
                                const isHighlighted = highlightedCardId === item.id;
                                const displayImage = item.image_url || sourceImg || undefined;
                                const categoryName = item.category_ids.length > 0 ? currentCategories.find(c => c.id === item.category_ids[0])?.name : undefined;

                                return (
                                    <InfoCard
                                        key={item.id}
                                        item={item}
                                        theme={theme}
                                        isStudy={isStudy}
                                        displayImage={displayImage}
                                        sourceName={sourceName}
                                        sourceImg={sourceImg || undefined}
                                        categoryName={categoryName}
                                        isHighlighted={isHighlighted}
                                        onToggleFav={(i: InfoItem) => toggleStatus(null, i.id, 'is_favorited')}
                                        onToggleQueue={(i: InfoItem) => toggleStatus(null, i.id, 'is_queued')}
                                        onEdit={handleEditItem}
                                        onDeleteSuccess={fetchData}
                                        onClick={(item: InfoItem) => {
                                            setSelectedParentItemId(item.id);
                                            setViewMode('bookmarks');
                                        }}
                                    />
                                );
                            })}
                        </div>
                        {allFilteredItems.length === 0 && (
                            <div className="w-full py-20 flex flex-col items-center justify-center opacity-50">
                                <Search size={48} className={`mb-4 ${theme.textMuted}`} />
                                <p className={`text-sm ${theme.textMuted}`}>没有找到对应的溯源卡片</p>
                            </div>
                        )}
                    </>
                ) : (
                    <>
                        <div className="flex flex-col gap-3">
                            {allFilteredBookmarks.map((bookmark) => {
                                let thumb = '';
                                let label = '';
                                if (bookmark.parent_item_id) {
                                    const pItem = mockItems.find(i => i.id === bookmark.parent_item_id);
                                    thumb = pItem?.image_url || mockSources.find(s => s.id === pItem?.source_id)?.image_url || '';
                                    label = pItem?.name || '';
                                } else if (bookmark.source_id) {
                                    const sItem = mockSources.find(s => s.id === bookmark.source_id);
                                    thumb = sItem?.image_url || '';
                                    label = sItem?.name || '';
                                }
                                const categoryName = bookmark.category_id ? currentCategories.find(c => c.id === bookmark.category_id)?.name : undefined;
                                return (
                                    <BookmarkCard
                                        key={bookmark.id}
                                        bookmark={bookmark}
                                        theme={theme}
                                        thumbnailUrl={thumb}
                                        thumbnailLabel={label}
                                        categoryName={categoryName}
                                        onToggleFav={(id) => toggleBookmarkStatus(null, id, 'is_favorited')}
                                        onToggleQueue={(id) => toggleBookmarkStatus(null, id, 'is_queued')}
                                        onToggleRead={(id) => toggleBookmarkStatus(null, id, 'is_read')}
                                        onEdit={handleEditBookmark}
                                        onDeleteSuccess={fetchData}
                                    />
                                );
                            })}
                        </div>
                        {allFilteredBookmarks.length === 0 && (
                            <div className="w-full py-20 flex flex-col items-center justify-center opacity-50">
                                <Search size={48} className={`mb-4 ${theme.textMuted}`} />
                                <p className={`text-sm ${theme.textMuted}`}>该范围内暂无具体收藏文章</p>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
