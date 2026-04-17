'use client';

import React, { useState, useMemo } from 'react';
import {
    ChevronRight,
    Plus,
    Pencil,
    Trash2,
    Loader2,
    FolderOpen,
} from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import type { GardenCategory, GardenPost, GardenChapter } from '../types';

// ============================================================
// TYPES
// ============================================================

interface GardenSidebarProps {
    categories: GardenCategory[];
    posts: GardenPost[];
    chapters: GardenChapter[];
    selectedPostId: string | null;
    selectedChapterId: string | null;
    isAdmin: boolean;
    isLoadingPosts: boolean;
    isLoadingChapters: boolean;
    onSelectPost: (postId: string) => void;
    onSelectChapter: (chapterId: string) => void;
    onCreatePost: (categoryId: string) => void;
    onCreateChapter: () => void;
    onRenamePost: (postId: string, currentTitle: string) => void;
    onDeletePost: (postId: string) => void;
    onRenameChapter: (chapterId: string, currentTitle: string) => void;
    onDeleteChapter: (chapterId: string) => void;
}

// ============================================================
// HELPERS
// ============================================================

const getIconComponent = (name: string) => {
    return (LucideIcons as any)[name] || FolderOpen;
};

// ============================================================
// COMPONENT
// ============================================================

export function GardenSidebar({
    categories,
    posts,
    chapters,
    selectedPostId,
    selectedChapterId,
    isAdmin,
    isLoadingPosts,
    isLoadingChapters,
    onSelectPost,
    onSelectChapter,
    onCreatePost,
    onCreateChapter,
    onRenamePost,
    onDeletePost,
    onRenameChapter,
    onDeleteChapter,
}: GardenSidebarProps) {

    // 记录哪些笔记的章节列表被展开
    const [expandedPosts, setExpandedPosts] = useState<Set<string>>(new Set());

    // 按分类分组笔记
    const postsByCategory = useMemo(() => {
        const map: Record<string, GardenPost[]> = {};
        categories.forEach(c => { map[c.id] = []; });
        posts.forEach(p => {
            if (map[p.category]) {
                map[p.category].push(p);
            } else {
                // 如果分类不存在，放入第一个分类
                const fallback = categories[0]?.id;
                if (fallback && map[fallback]) {
                    map[fallback].push(p);
                }
            }
        });
        return map;
    }, [categories, posts]);

    // 当选中的笔记变化时，自动展开它
    React.useEffect(() => {
        if (selectedPostId) {
            setExpandedPosts(prev => {
                const next = new Set(prev);
                next.add(selectedPostId);
                return next;
            });
        }
    }, [selectedPostId]);

    const toggleExpand = (postId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setExpandedPosts(prev => {
            const next = new Set(prev);
            if (next.has(postId)) {
                next.delete(postId);
            } else {
                next.add(postId);
            }
            return next;
        });
    };

    return (
        <aside className="flex-none w-56 bg-[#e4ece7] border-r border-[#ccd8d0] flex flex-col overflow-hidden select-none">
            {/* Header */}
            <div className="px-4 py-3 border-b border-[#ccd8d0] flex items-center justify-between">
                <span className="text-[12px] font-mono font-bold uppercase tracking-[0.2em] text-[#6b8a7a]">
                    目录
                </span>
                {isLoadingPosts && (
                    <Loader2 size={12} className="animate-spin text-[#8aaa9a]" />
                )}
            </div>

            {/* Navigation Tree */}
            <nav className="flex-1 overflow-y-auto py-1 custom-scrollbar">
                {categories.map(category => {
                    const categoryPosts = postsByCategory[category.id] || [];
                    const Icon = getIconComponent(category.icon);

                    return (
                        <div key={category.id} className="mb-1">
                            {/* Category Header */}
                            <div className="px-4 py-2 mt-2 flex items-center justify-between group/cat">
                                <div className="flex items-center gap-2">
                                    <Icon size={14} className="text-[#6b8a7a]" />
                                    <span className="text-[13px] font-extrabold text-[#4a6b5a] uppercase tracking-wider">
                                        {category.title}
                                    </span>
                                </div>
                                {isAdmin && (
                                    <button
                                        onClick={() => onCreatePost(category.id)}
                                        className="opacity-0 group-hover/cat:opacity-100 p-0.5 text-[#8aaa9a] hover:text-teal-600 transition-all"
                                        title="新建笔记"
                                    >
                                        <Plus size={13} />
                                    </button>
                                )}
                            </div>

                            {/* Posts List */}
                            {categoryPosts.length === 0 ? (
                                <div className="px-4 py-1 text-[10px] text-stone-400 italic pl-8">
                                    暂无笔记
                                </div>
                            ) : (
                                categoryPosts.map(post => {
                                    const isSelected = post.id === selectedPostId;
                                    const isExpanded = expandedPosts.has(post.id);
                                    const showChapters = isSelected && isExpanded;

                                    return (
                                        <div key={post.id}>
                                            {/* Post Item */}
                                            <div
                                                className={`
                                                    w-full flex items-center group/post transition-colors relative
                                                    ${isSelected
                                                        ? 'bg-[#d0ddd5] text-[#2d4a3a]'
                                                        : 'text-[#5a7a6a] hover:bg-[#dae6df] hover:text-[#3a5a4a]'
                                                    }
                                                `}
                                            >
                                                {/* Expand/Collapse Arrow */}
                                                <button
                                                    onClick={(e) => toggleExpand(post.id, e)}
                                                    className="pl-4 pr-1 py-2 text-[#8aaa9a] hover:text-[#4a6b5a] transition-colors shrink-0"
                                                >
                                                    <ChevronRight
                                                        size={12}
                                                        className={`transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}
                                                    />
                                                </button>

                                                {/* Post Title */}
                                                <button
                                                    onClick={() => onSelectPost(post.id)}
                                                    className="flex-1 text-left py-2 pr-2 text-[14px] leading-snug truncate"
                                                >
                                                    <span className={isSelected ? 'font-semibold' : ''}>
                                                        {post.title}
                                                    </span>
                                                </button>

                                                {/* Draft Indicator */}
                                                {post.status === 'Draft' && (
                                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0 mr-2" title="Draft" />
                                                )}

                                                {/* Admin Actions */}
                                                {isAdmin && (
                                                    <div className="flex gap-0.5 opacity-0 group-hover/post:opacity-100 transition-opacity pr-2 shrink-0">
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); onRenamePost(post.id, post.title); }}
                                                            className="p-1 text-[#8aaa9a] hover:text-[#4a6b5a] rounded"
                                                            title="重命名"
                                                        >
                                                            <Pencil size={10} />
                                                        </button>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); onDeletePost(post.id); }}
                                                            className="p-1 text-[#8aaa9a] hover:text-red-500 rounded"
                                                            title="删除"
                                                        >
                                                            <Trash2 size={10} />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Chapters List (Collapsible) */}
                                            {showChapters && (
                                                <div className="ml-5 border-l border-[#b8c9bf] pl-2">
                                                    {isLoadingChapters ? (
                                                        <div className="flex items-center gap-2 px-3 py-2">
                                                            <Loader2 size={10} className="animate-spin text-[#8aaa9a]" />
                                                            <span className="text-[10px] text-[#8aaa9a]">加载中...</span>
                                                        </div>
                                                    ) : chapters.length === 0 ? (
                                                        <div className="px-3 py-2 text-[10px] text-stone-400 italic">
                                                            暂无章节
                                                        </div>
                                                    ) : (
                                                        chapters.map((ch, idx) => {
                                                            const isChapterActive = ch.id === selectedChapterId;
                                                            return (
                                                                <div
                                                                    key={ch.id}
                                                                    className={`
                                                                        w-full flex items-center group/ch transition-colors rounded-md
                                                                        ${isChapterActive
                                                                            ? 'bg-[#c5d6cc] text-[#2d4a3a]'
                                                                            : 'text-[#6b8a7a] hover:bg-[#d5e2da] hover:text-[#3a5a4a]'
                                                                        }
                                                                    `}
                                                                >
                                                                    <button
                                                                        onClick={() => onSelectChapter(ch.id)}
                                                                        className="flex-1 text-left px-3 py-1.5 text-[13px] leading-snug truncate flex items-center gap-2"
                                                                    >
                                                                        <span className="text-[10px] font-mono text-[#8aaa9a] shrink-0">
                                                                            {String(idx + 1).padStart(2, '0')}
                                                                        </span>
                                                                        <span className={isChapterActive ? 'font-semibold' : ''}>
                                                                            {ch.title}
                                                                        </span>
                                                                    </button>

                                                                    {/* Chapter Admin Actions */}
                                                                    {isAdmin && (
                                                                        <div className="flex gap-0.5 opacity-0 group-hover/ch:opacity-100 transition-opacity pr-1.5 shrink-0">
                                                                            <button
                                                                                onClick={(e) => { e.stopPropagation(); onRenameChapter(ch.id, ch.title); }}
                                                                                className="p-0.5 text-[#8aaa9a] hover:text-[#4a6b5a] rounded"
                                                                                title="重命名"
                                                                            >
                                                                                <Pencil size={9} />
                                                                            </button>
                                                                            <button
                                                                                onClick={(e) => { e.stopPropagation(); onDeleteChapter(ch.id); }}
                                                                                className="p-0.5 text-[#8aaa9a] hover:text-red-500 rounded"
                                                                                title="删除"
                                                                            >
                                                                                <Trash2 size={9} />
                                                                            </button>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            );
                                                        })
                                                    )}

                                                    {/* Add Chapter Button */}
                                                    {isAdmin && (
                                                        <button
                                                            onClick={onCreateChapter}
                                                            className="w-full mt-1 mb-1 py-1.5 border border-dashed border-[#b8c9bf] rounded-md text-[#8aaa9a] hover:border-teal-400 hover:text-teal-600 hover:bg-[#dae6df]/50 transition-all text-[11px] font-mono flex items-center justify-center gap-1"
                                                        >
                                                            <Plus size={11} />
                                                            新章节
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    );
                })}
            </nav>
        </aside>
    );
}
