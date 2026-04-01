import React from 'react';
import { motion } from 'framer-motion';
import { Star, Clock, ExternalLink, Bookmark, CheckCircle2, Trash2, Edit } from 'lucide-react';
import { InfoBookmark } from '../types';
import { SafeDeleteDialog } from '@/components/ui/safe-delete-dialog';

interface BookmarkCardProps {
    bookmark: InfoBookmark;
    theme: any;
    thumbnailUrl?: string; // Derived from parent_item or source
    thumbnailLabel?: string;
    categoryName?: string;
    onToggleFav: (id: number) => void;
    onToggleQueue: (id: number) => void;
    onToggleRead: (id: number) => void;
    onEdit: (bookmark: InfoBookmark) => void;
    onDeleteSuccess: () => void;
}

export function BookmarkCard({
    bookmark, theme, thumbnailUrl, thumbnailLabel, categoryName,
    onToggleFav, onToggleQueue, onToggleRead, onEdit, onDeleteSuccess
}: BookmarkCardProps) {
    return (
        <motion.div
            layout="position"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={`flex items-center gap-4 p-4 rounded-2xl border ${theme.border} ${theme.cardBg} ${theme.cardHover} transition-all duration-300 group hover:shadow-lg relative overflow-hidden`}
        >
            {/* Left Thumbnail Area */}
            {thumbnailUrl ? (
                <div className="w-16 h-16 rounded-xl shrink-0 overflow-hidden bg-black/5 flex-col items-center justify-center relative shadow-sm">
                    <img src={thumbnailUrl} alt="" className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" />
                    {thumbnailLabel && (
                        <div className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[10px] font-bold text-center py-0.5 truncate px-1">
                            {thumbnailLabel}
                        </div>
                    )}
                </div>
            ) : (
                <div className={`w-16 h-16 rounded-xl shrink-0 ${theme.primaryBg} flex items-center justify-center shadow-sm`}>
                    <Bookmark size={28} className={theme.primary} />
                </div>
            )}

            {/* Content Area */}
            <div className="flex-1 min-w-0 pr-24 flex flex-col md:flex-row md:items-center gap-4">

                {/* Column 1: Title (Enlarged) */}
                <div className="w-full md:w-1/3 shrink-0 flex flex-col justify-center">
                    <div className="flex items-center gap-2">
                        <h3 className={`font-bold text-2xl leading-tight truncate ${bookmark.is_read ? theme.textMuted + ' line-through opacity-70' : theme.textBase}`}>
                            {bookmark.title}
                        </h3>
                        {categoryName && (
                            <span className={`shrink-0 text-sm font-bold px-1.5 py-0.5 rounded-md ${theme.primaryBg} ${theme.primary}`}>
                                {categoryName}
                            </span>
                        )}
                        {bookmark.is_read && (
                            <span className="shrink-0 text-sm font-bold px-2.5 py-0.5 rounded-md bg-green-500/10 text-green-600 border border-green-500/20">
                                已阅
                            </span>
                        )}
                    </div>
                </div>

                {/* Column 2: External Link & Date */}
                <div className="w-36 shrink-0 flex flex-col justify-center gap-2">
                    {bookmark.url && (
                        <a
                            href={bookmark.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`inline-flex items-center gap-2 text-lg font-bold ${theme.primary} hover:underline decoration-2 underline-offset-4`}
                        >
                            <span>访问原链</span>
                            <ExternalLink size={18} />
                        </a>
                    )}

                    {bookmark.info_date && (
                        <div className={`flex items-center gap-1.5 text-base font-mono tracking-tight ${theme.textMuted}`}>
                            <Clock size={16} />
                            <span>{bookmark.info_date}</span>
                        </div>
                    )}
                </div>

                {/* Column 3: Description */}
                <div className="flex-1 min-w-0">
                    {bookmark.description && (
                        <p className={`text-lg ${theme.textMuted} line-clamp-2 leading-relaxed`}>
                            {bookmark.description}
                        </p>
                    )}
                </div>

            </div>

            {/* Actions (Hover Reveal) */}
            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col items-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <div className="flex items-center gap-2 bg-black/5 backdrop-blur-md p-1.5 rounded-full border border-black/5 shadow-sm">
                    <button
                        onClick={() => onToggleFav(bookmark.id)}
                        className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors hover:bg-yellow-400/20 ${bookmark.is_favorited ? 'text-yellow-500 bg-yellow-400/10' : theme.textMuted}`}
                        title={bookmark.is_favorited ? "取消收藏" : "加入收藏"}
                    >
                        <Star size={16} className={bookmark.is_favorited ? "fill-yellow-500" : ""} />
                    </button>
                    <button
                        onClick={() => onToggleQueue(bookmark.id)}
                        className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors hover:bg-blue-400/20 ${bookmark.is_queued ? 'text-blue-500 bg-blue-400/10' : theme.textMuted}`}
                        title={bookmark.is_queued ? "移出待看" : "加入待看"}
                    >
                        <Bookmark size={16} className={bookmark.is_queued ? "fill-blue-500" : ""} />
                    </button>
                    <button
                        onClick={() => onToggleRead(bookmark.id)}
                        className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors hover:bg-green-400/20 ${bookmark.is_read ? 'text-green-500 bg-green-400/10' : theme.textMuted}`}
                        title={bookmark.is_read ? "标为未读" : "标为已读"}
                    >
                        <CheckCircle2 size={16} />
                    </button>
                </div>

                <div className="flex items-center gap-2 mr-2">
                    <button
                        onClick={(e) => { e.stopPropagation(); onEdit(bookmark); }}
                        className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors hover:bg-black/10 ${theme.textMuted}`}
                        title="编辑"
                    >
                        <Edit size={15} />
                    </button>
                    <div onClick={(e) => e.stopPropagation()}>
                        <SafeDeleteDialog
                            table="info_bookmarks"
                            recordId={bookmark.id}
                            onSuccess={onDeleteSuccess}
                            title={`彻底删除记录 "${bookmark.title}"？`}
                        >
                            <button
                                title="永久删除"
                                className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${theme.textMuted} hover:text-red-500 hover:bg-red-500/10`}
                            >
                                <Trash2 size={15} />
                            </button>
                        </SafeDeleteDialog>
                    </div>
                </div>
            </div>

            {/* Mobile Actions (Always Visible) - optionally we can add this if needed, but hover logic works fine for desktop apps for now. */}
            {(bookmark.is_favorited || bookmark.is_queued) && (
                <div className="absolute top-0 right-0 p-2 flex gap-1.5 group-hover:opacity-0 transition-opacity pointer-events-none">
                    {bookmark.is_favorited && <Star size={18} className="text-yellow-500 fill-yellow-500" />}
                    {bookmark.is_queued && <Bookmark size={18} className="text-blue-500 fill-blue-500" />}
                </div>
            )}
        </motion.div>
    );
}
