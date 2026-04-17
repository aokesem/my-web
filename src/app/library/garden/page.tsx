"use client";

import React, { useState, useEffect, useCallback } from 'react';
import {
    ArrowLeft,
    Sprout,
    ChevronLeft,
    ChevronRight,
    Loader2,
    FolderOpen,
} from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';

// Garden Components
import { GardenSidebar } from './components/GardenSidebar';
import { GardenContentView } from './components/GardenContentView';
import { GardenTOC } from './components/GardenTOC';

// Data Hooks
import {
    useGardenCategories,
    useGardenPosts,
    useGardenChapters,
    useChapterContent,
} from './hooks/useGardenData';

// ============================================================
// COMPONENT
// ============================================================

export default function GardenPage() {
    // --- Auth ---
    const [isAdmin, setIsAdmin] = useState(false);
    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setIsAdmin(!!session);
        });
    }, []);

    // --- Navigation State ---
    const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
    const [selectedChapterId, setSelectedChapterId] = useState<string | null>(null);
    const [isEditing, setIsEditing] = useState(false);

    // --- Data ---
    const { categories, isLoading: isLoadingCategories } = useGardenCategories();
    const { posts, isLoading: isLoadingPosts, mutate: mutatePosts } = useGardenPosts(isAdmin);
    const { chapters, isLoading: isLoadingChapters, mutate: mutateChapters } = useGardenChapters(selectedPostId);
    const { chapter, isLoading: isLoadingChapter, mutate: mutateChapter } = useChapterContent(selectedChapterId);

    // --- Derived ---
    const selectedPost = posts.find(p => p.id === selectedPostId);
    const currentChapterIndex = chapters.findIndex(ch => ch.id === selectedChapterId);
    const totalChapters = chapters.length;

    // --- Auto-select first chapter when post changes ---
    useEffect(() => {
        if (chapters.length > 0 && selectedPostId) {
            // 如果当前选中的章节不属于该笔记，或没有选中章节，则选中第一个
            const belongsToPost = chapters.some(ch => ch.id === selectedChapterId);
            if (!belongsToPost) {
                setSelectedChapterId(chapters[0].id);
            }
        } else if (chapters.length === 0 && !isLoadingChapters) {
            setSelectedChapterId(null);
        }
    }, [chapters, selectedPostId, isLoadingChapters]);

    // ============================================================
    // CHAPTER NAVIGATION
    // ============================================================

    const canGoPrev = currentChapterIndex > 0;
    const canGoNext = currentChapterIndex >= 0 && currentChapterIndex < totalChapters - 1;

    const goToPrevChapter = useCallback(() => {
        if (!canGoPrev) return;
        if (isEditing) {
            if (!confirm('编辑中的内容尚未保存，确定离开？')) return;
            setIsEditing(false);
        }
        setSelectedChapterId(chapters[currentChapterIndex - 1].id);
    }, [canGoPrev, isEditing, chapters, currentChapterIndex]);

    const goToNextChapter = useCallback(() => {
        if (!canGoNext) return;
        if (isEditing) {
            if (!confirm('编辑中的内容尚未保存，确定离开？')) return;
            setIsEditing(false);
        }
        setSelectedChapterId(chapters[currentChapterIndex + 1].id);
    }, [canGoNext, isEditing, chapters, currentChapterIndex]);

    // 键盘导航
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLInputElement) return;
            // 编辑模式下不拦截方向键
            if (isEditing) return;
            if (e.key === 'ArrowRight') goToNextChapter();
            if (e.key === 'ArrowLeft') goToPrevChapter();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [goToNextChapter, goToPrevChapter, isEditing]);

    // 翻页后滚动到顶部
    useEffect(() => {
        const el = document.getElementById('garden-content-scroll');
        if (el) el.scrollTop = 0;
    }, [selectedChapterId]);

    // ============================================================
    // POST CRUD HANDLERS
    // ============================================================

    const handleSelectPost = useCallback((postId: string) => {
        if (isEditing) {
            if (!confirm('编辑中的内容尚未保存，确定切换？')) return;
            setIsEditing(false);
        }
        setSelectedPostId(postId);
        setSelectedChapterId(null); // 会由 useEffect 自动选中第一个章节
    }, [isEditing]);

    const handleSelectChapter = useCallback((chapterId: string) => {
        if (isEditing) {
            if (!confirm('编辑中的内容尚未保存，确定切换？')) return;
            setIsEditing(false);
        }
        setSelectedChapterId(chapterId);
    }, [isEditing]);

    const handleCreatePost = useCallback(async (categoryId: string) => {
        const title = prompt('请输入笔记标题：');
        if (!title?.trim()) return;

        const slug = title.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^\w\u4e00-\u9fa5-]/g, '') || 'untitled-' + Date.now();

        try {
            const { data, error } = await supabase.from('garden_posts').insert({
                title: title.trim(),
                slug,
                category: categoryId,
                tags: [],
                status: 'Draft',
                content: '', // 保留旧字段兼容
            }).select('id').single();
            if (error) throw error;
            toast.success('笔记已创建');
            await mutatePosts();
            if (data) setSelectedPostId(data.id);
        } catch (e: any) {
            toast.error('创建失败: ' + e.message);
        }
    }, [mutatePosts]);

    const handleRenamePost = useCallback(async (postId: string, currentTitle: string) => {
        const newTitle = prompt('请输入新的笔记标题：', currentTitle);
        if (!newTitle?.trim() || newTitle.trim() === currentTitle) return;
        try {
            const { error } = await supabase.from('garden_posts').update({ title: newTitle.trim() }).eq('id', postId);
            if (error) throw error;
            toast.success('笔记已重命名');
            mutatePosts();
        } catch (e: any) {
            toast.error('重命名失败: ' + e.message);
        }
    }, [mutatePosts]);

    const handleDeletePost = useCallback(async (postId: string) => {
        if (!confirm('确定删除此笔记？其下所有章节将一并删除。')) return;
        try {
            const { error } = await supabase.from('garden_posts').delete().eq('id', postId);
            if (error) throw error;
            toast.success('笔记已删除');
            if (selectedPostId === postId) {
                setSelectedPostId(null);
                setSelectedChapterId(null);
            }
            mutatePosts();
        } catch (e: any) {
            toast.error('删除失败: ' + e.message);
        }
    }, [selectedPostId, mutatePosts]);

    // ============================================================
    // CHAPTER CRUD HANDLERS
    // ============================================================

    const handleCreateChapter = useCallback(async () => {
        if (!selectedPostId) return;
        const title = prompt('请输入章节标题：');
        if (!title?.trim()) return;

        try {
            const { data, error } = await supabase.from('garden_chapters').insert({
                post_id: selectedPostId,
                title: title.trim(),
                sort_order: chapters.length,
            }).select('id').single();
            if (error) throw error;
            toast.success('章节已创建');
            await mutateChapters();
            if (data) setSelectedChapterId(data.id);
        } catch (e: any) {
            toast.error('创建失败: ' + e.message);
        }
    }, [selectedPostId, chapters.length, mutateChapters]);

    const handleRenameChapter = useCallback(async (chapterId: string, currentTitle: string) => {
        const newTitle = prompt('请输入新的章节标题：', currentTitle);
        if (!newTitle?.trim() || newTitle.trim() === currentTitle) return;
        try {
            const { error } = await supabase.from('garden_chapters').update({ title: newTitle.trim() }).eq('id', chapterId);
            if (error) throw error;
            toast.success('章节已重命名');
            mutateChapters();
            if (chapterId === selectedChapterId) mutateChapter();
        } catch (e: any) {
            toast.error('重命名失败: ' + e.message);
        }
    }, [selectedChapterId, mutateChapters, mutateChapter]);

    const handleDeleteChapter = useCallback(async (chapterId: string) => {
        if (!confirm('确定删除此章节？')) return;
        try {
            const { error } = await supabase.from('garden_chapters').delete().eq('id', chapterId);
            if (error) throw error;
            toast.success('章节已删除');
            if (selectedChapterId === chapterId) {
                setSelectedChapterId(null);
            }
            mutateChapters();
        } catch (e: any) {
            toast.error('删除失败: ' + e.message);
        }
    }, [selectedChapterId, mutateChapters]);

    const handleSaveNotes = useCallback(async (chapterId: string, notes: string) => {
        try {
            // 乐观更新，立即反映到 UI
            if (chapter && chapter.id === chapterId) {
                mutateChapter({ ...chapter, notes }, false);
            }
            const { error } = await supabase.from('garden_chapters').update({ notes }).eq('id', chapterId);
            if (error) throw error;
            toast.success('笔记已保存');
            mutateChapter();
        } catch (e: any) {
            toast.error('保存失败: ' + e.message);
        }
    }, [chapter, mutateChapter]);

    // ============================================================
    // LOADING STATE
    // ============================================================

    if (isLoadingCategories && isLoadingPosts) {
        return (
            <div className="h-screen flex items-center justify-center bg-[#eef3f0] text-slate-800">
                <Loader2 size={32} className="animate-spin text-teal-600" />
            </div>
        );
    }

    // ============================================================
    // RENDER
    // ============================================================

    return (
        <div className="h-screen flex flex-col bg-[#eef3f0] text-slate-800 font-sans selection:bg-teal-200/40 overflow-hidden">

            {/* ===== TOP BAR ===== */}
            <header className="flex-none flex items-center justify-between px-5 h-11 bg-[#2d3d35] text-white/80 z-30 select-none">
                <div className="flex items-center gap-4">
                    <Link href="/library" className="group flex items-center gap-1.5 hover:text-white transition-colors">
                        <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
                        <span className="text-[10px] font-mono font-bold uppercase tracking-widest">Library</span>
                    </Link>
                    <div className="w-px h-4 bg-white/15" />
                    <Sprout size={16} className="text-teal-400" />
                    <span className="text-sm font-serif tracking-wide">Digital <span className="text-teal-400">Garden</span></span>
                </div>

                <div className="flex items-center gap-4">
                    {/* Admin Link */}
                    {isAdmin && (
                        <Link
                            href="/admin/library/garden"
                            className="h-7 flex items-center text-[12px] bg-white/5 hover:bg-white/10 text-white/70 border border-white/10 hover:border-white/30 gap-1.5 px-3 rounded-md transition-all"
                        >
                            <FolderOpen size={13} /> Admin
                        </Link>
                    )}

                    {/* Chapter Navigation */}
                    {totalChapters > 0 && (
                        <>
                            <div className="w-px h-4 bg-white/15" />
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={goToPrevChapter}
                                    disabled={!canGoPrev}
                                    className="p-1 hover:text-white disabled:opacity-25 transition-colors"
                                >
                                    <ChevronLeft size={16} />
                                </button>
                                <span className="text-sm font-mono tracking-wider text-white/50">
                                    {currentChapterIndex >= 0 ? currentChapterIndex + 1 : '-'} / {totalChapters}
                                </span>
                                <button
                                    onClick={goToNextChapter}
                                    disabled={!canGoNext}
                                    className="p-1 hover:text-white disabled:opacity-25 transition-colors"
                                >
                                    <ChevronRight size={16} />
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </header>

            {/* ===== MAIN BODY ===== */}
            <div className="flex-1 flex min-h-0">

                {/* Left Sidebar */}
                <GardenSidebar
                    categories={categories}
                    posts={posts}
                    chapters={chapters}
                    selectedPostId={selectedPostId}
                    selectedChapterId={selectedChapterId}
                    isAdmin={isAdmin}
                    isLoadingPosts={isLoadingPosts}
                    isLoadingChapters={isLoadingChapters}
                    onSelectPost={handleSelectPost}
                    onSelectChapter={handleSelectChapter}
                    onCreatePost={handleCreatePost}
                    onCreateChapter={handleCreateChapter}
                    onRenamePost={handleRenamePost}
                    onDeletePost={handleDeletePost}
                    onRenameChapter={handleRenameChapter}
                    onDeleteChapter={handleDeleteChapter}
                />

                {/* Main Content */}
                {/* TOC moved to the left of the main content */}
                {chapter && !isEditing && (
                    <GardenTOC notes={chapter.notes} />
                )}

                <GardenContentView
                    chapter={chapter}
                    selectedPostTitle={selectedPost?.title || null}
                    selectedChapterId={selectedChapterId}
                    isLoadingChapter={isLoadingChapter}
                    isAdmin={isAdmin}
                    hasChapters={chapters.length > 0}
                    hasPost={!!selectedPostId}
                    isEditing={isEditing}
                    onSetEditing={setIsEditing}
                    onSaveNotes={handleSaveNotes}
                    onCreateFirstChapter={handleCreateChapter}
                />
            </div>

            {/* ===== BOTTOM BAR ===== */}
            <footer className="flex-none flex items-center justify-between px-6 py-2 border-t border-[#d5ddd8] bg-[#eef3f0]/80">
                <div className="flex items-center gap-3">
                    <button
                        onClick={goToPrevChapter}
                        disabled={!canGoPrev}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-mono text-[#6b8a7a] hover:bg-[#dae6df] disabled:opacity-25 transition-colors"
                    >
                        <ChevronLeft size={16} /> Prev
                    </button>
                </div>
                <div className="text-[9px] font-mono text-[#8aaa9a] tracking-[0.2em]">GARDEN_SYS // READER</div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={goToNextChapter}
                        disabled={!canGoNext}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-mono text-[#6b8a7a] hover:bg-[#dae6df] disabled:opacity-25 transition-colors"
                    >
                        Next <ChevronRight size={16} />
                    </button>
                </div>
            </footer>
        </div>
    );
}
