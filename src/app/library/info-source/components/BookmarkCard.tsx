import React from 'react';
import { motion } from 'framer-motion';
import { Star, Clock, ExternalLink, Bookmark, CheckCircle2, Trash2, Edit } from 'lucide-react';
import { InfoBookmark } from '../types';
import { formatEffectiveDateRange } from '../lib/formatEffectiveDateRange';
import { SafeDeleteDialog } from '@/components/ui/safe-delete-dialog';

interface BookmarkCardProps {
    bookmark: InfoBookmark;
    theme: any;
    thumbnailUrl?: string;
    thumbnailLabel?: string;
    categoryName?: string;
    onToggleFav: (id: number) => void;
    onToggleQueue: (id: number) => void;
    onToggleRead: (id: number) => void;
    onEdit: (bookmark: InfoBookmark) => void;
    onDeleteSuccess: () => void;
}

export function BookmarkCard({
    bookmark,
    theme,
    thumbnailUrl,
    categoryName,
    onToggleFav,
    onToggleQueue,
    onToggleRead,
    onEdit,
    onDeleteSuccess,
}: BookmarkCardProps) {
    const rangeLabel = formatEffectiveDateRange(
        bookmark.effective_date_start,
        bookmark.effective_date_end,
        bookmark.info_date
    );

    return (
        <motion.div
            id={`bookmark-card-${bookmark.id}`}
            layout="position"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={`flex items-center gap-5 py-5 pl-5 pr-5 rounded-2xl border ${theme.border} ${theme.cardBg} ${theme.cardHover} transition-all duration-300 group hover:shadow-lg relative overflow-hidden min-h-[7.25rem] w-full`}
        >
            {thumbnailUrl ? (
                <div className="w-[8.75rem] h-[6.75rem] rounded-xl shrink-0 overflow-hidden bg-black/10 shadow-sm">
                    <img
                        src={thumbnailUrl}
                        alt=""
                        className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
                    />
                </div>
            ) : (
                <div
                    className={`w-[8.75rem] h-[6.75rem] rounded-xl shrink-0 ${theme.primaryBg} flex items-center justify-center shadow-sm`}
                >
                    <Bookmark size={28} className={theme.primary} />
                </div>
            )}

            <div className="flex-1 min-w-0 flex flex-col justify-center gap-2.5">
                <div className="flex items-center gap-2 min-w-0">
                    <h3
                        className={`font-bold text-lg leading-snug truncate ${bookmark.is_read ? theme.textMuted + ' line-through opacity-70' : theme.textBase}`}
                    >
                        {bookmark.title}
                    </h3>
                    {categoryName && (
                        <span
                            className={`shrink-0 text-[11px] font-bold px-1.5 py-0.5 rounded-md ${theme.primaryBg} ${theme.primary}`}
                        >
                            {categoryName}
                        </span>
                    )}
                    {bookmark.is_read && (
                        <span className="shrink-0 text-[11px] font-bold px-2 py-0.5 rounded-md bg-green-500/10 text-green-600 border border-green-500/20">
                            已阅
                        </span>
                    )}
                </div>

                {rangeLabel && (
                    <div
                        className={`flex items-center gap-1.5 text-sm font-mono tracking-tight ${theme.textMuted}`}
                    >
                        <Clock size={14} className="shrink-0 opacity-80" />
                        <span>{rangeLabel}</span>
                    </div>
                )}

                {bookmark.description && (
                    <p className={`text-sm ${theme.textMuted} line-clamp-2 leading-relaxed`}>
                        {bookmark.description}
                    </p>
                )}
            </div>

            <div className="flex items-center gap-3 shrink-0 self-center">
                {bookmark.url && (
                    <a
                        href={bookmark.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`inline-flex items-center gap-1.5 text-sm font-bold whitespace-nowrap ${theme.primary} hover:underline underline-offset-2`}
                    >
                        <span>访问原链</span>
                        <ExternalLink size={14} />
                    </a>
                )}

                <div className="flex items-center gap-1 bg-black/5 dark:bg-white/5 backdrop-blur-md p-1 rounded-full border border-black/5 dark:border-white/10 shadow-sm">
                    <button
                        type="button"
                        onClick={() => onToggleFav(bookmark.id)}
                        className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors hover:bg-yellow-400/20 ${bookmark.is_favorited ? 'text-yellow-500 bg-yellow-400/10' : theme.textMuted}`}
                        title={bookmark.is_favorited ? '取消收藏' : '加入收藏'}
                    >
                        <Star size={15} className={bookmark.is_favorited ? 'fill-yellow-500' : ''} />
                    </button>
                    <button
                        type="button"
                        onClick={() => onToggleQueue(bookmark.id)}
                        className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors hover:bg-blue-400/20 ${bookmark.is_queued ? 'text-blue-500 bg-blue-400/10' : theme.textMuted}`}
                        title={bookmark.is_queued ? '移出待看' : '加入待看'}
                    >
                        <Bookmark size={15} className={bookmark.is_queued ? 'fill-blue-500' : ''} />
                    </button>
                    <button
                        type="button"
                        onClick={() => onToggleRead(bookmark.id)}
                        className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors hover:bg-green-400/20 ${bookmark.is_read ? 'text-green-500 bg-green-400/10' : theme.textMuted}`}
                        title={bookmark.is_read ? '标为未读' : '标为已读'}
                    >
                        <CheckCircle2 size={15} />
                    </button>
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            onEdit(bookmark);
                        }}
                        className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors hover:bg-black/10 ${theme.textMuted}`}
                        title="编辑"
                    >
                        <Edit size={14} />
                    </button>
                    <div onClick={(e) => e.stopPropagation()}>
                        <SafeDeleteDialog
                            table="info_bookmarks"
                            recordId={bookmark.id}
                            onSuccess={onDeleteSuccess}
                            title={`彻底删除记录 "${bookmark.title}"？`}
                        >
                            <button
                                type="button"
                                title="永久删除"
                                className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${theme.textMuted} hover:text-red-500 hover:bg-red-500/10`}
                            >
                                <Trash2 size={14} />
                            </button>
                        </SafeDeleteDialog>
                    </div>
                </div>
            </div>

            {(bookmark.is_favorited || bookmark.is_queued) && (
                <div className="absolute top-2.5 left-[10.25rem] flex gap-1.5 pointer-events-none">
                    {bookmark.is_favorited && (
                        <Star size={14} className="text-yellow-500 fill-yellow-500 drop-shadow-sm" />
                    )}
                    {bookmark.is_queued && (
                        <Bookmark size={14} className="text-blue-500 fill-blue-500 drop-shadow-sm" />
                    )}
                </div>
            )}
        </motion.div>
    );
}
