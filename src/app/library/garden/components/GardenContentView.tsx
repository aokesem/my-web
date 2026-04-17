'use client';

import React, { useState, useRef, useCallback } from 'react';
import { Pencil, Save, Loader2, Plus, BookOpen, X } from 'lucide-react';
import { BlockEditor } from '@/components/ui/block-editor';
import type { BlockEditorRef } from '@/components/ui/block-editor';
import type { GardenChapter } from '../types';

// ============================================================
// TYPES
// ============================================================

interface GardenContentViewProps {
    chapter: GardenChapter | null;
    selectedPostTitle: string | null;
    selectedChapterId: string | null;
    isLoadingChapter: boolean;
    isAdmin: boolean;
    hasChapters: boolean;
    hasPost: boolean;
    // 编辑状态由父组件管控，以便翻页时处理未保存提醒
    isEditing: boolean;
    onSetEditing: (editing: boolean) => void;
    onSaveNotes: (chapterId: string, notes: string) => Promise<void>;
    onCreateFirstChapter: () => void;
}

// ============================================================
// COMPONENT
// ============================================================

export function GardenContentView({
    chapter,
    selectedPostTitle,
    selectedChapterId,
    isLoadingChapter,
    isAdmin,
    hasChapters,
    hasPost,
    isEditing,
    onSetEditing,
    onSaveNotes,
    onCreateFirstChapter,
}: GardenContentViewProps) {
    const editorRef = useRef<BlockEditorRef>(null);
    const [tempNotes, setTempNotes] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    // ============================================================
    // HANDLERS
    // ============================================================

    const enterEditMode = useCallback(() => {
        if (!isAdmin || !chapter) return;
        setTempNotes(chapter.notes || '');
        onSetEditing(true);
    }, [isAdmin, chapter, onSetEditing]);

    const cancelEdit = useCallback(() => {
        onSetEditing(false);
        setTempNotes('');
    }, [onSetEditing]);

    const handleSave = useCallback(async () => {
        if (!chapter) return;
        setIsSaving(true);
        try {
            await onSaveNotes(chapter.id, tempNotes);
            onSetEditing(false);
        } finally {
            setIsSaving(false);
        }
    }, [chapter, tempNotes, onSaveNotes, onSetEditing]);

    // ============================================================
    // EMPTY STATES
    // ============================================================

    // 无笔记选中
    if (!hasPost) {
        return (
            <div className="flex-1 flex items-center justify-center bg-[#eef3f0]">
                <div className="flex flex-col items-center gap-4 text-center max-w-sm">
                    <div className="w-16 h-16 rounded-2xl bg-teal-50 border border-teal-200/60 flex items-center justify-center">
                        <BookOpen size={28} className="text-teal-400" strokeWidth={1.5} />
                    </div>
                    <h2 className="text-xl font-serif font-bold text-stone-700">选择一篇笔记</h2>
                    <p className="text-sm text-stone-400">从左侧栏选择笔记开始阅读</p>
                </div>
            </div>
        );
    }

    // 笔记已选中但无章节
    if (!hasChapters && !isLoadingChapter) {
        return (
            <div className="flex-1 flex items-center justify-center bg-[#eef3f0]">
                <div className="flex flex-col items-center gap-4 text-center max-w-sm">
                    <div className="w-16 h-16 rounded-2xl bg-stone-100 border border-stone-200/60 flex items-center justify-center">
                        <Plus size={28} className="text-stone-400" strokeWidth={1.5} />
                    </div>
                    <h2 className="text-xl font-serif font-bold text-stone-700">开始记录</h2>
                    <p className="text-sm text-stone-400 mb-2">
                        为「{selectedPostTitle}」创建第一个章节
                    </p>
                    {isAdmin && (
                        <button
                            onClick={onCreateFirstChapter}
                            className="px-6 py-2.5 bg-[#2d3d35] text-white rounded-xl text-sm font-bold hover:bg-[#1a2b23] transition-colors shadow-sm"
                        >
                            + 创建第一个章节
                        </button>
                    )}
                </div>
            </div>
        );
    }

    // 章节未选中（但章节存在）
    if (!chapter && !isLoadingChapter) {
        return (
            <div className="flex-1 flex items-center justify-center bg-[#eef3f0]">
                <div className="flex flex-col items-center gap-3 text-stone-400">
                    <BookOpen size={24} className="opacity-30" />
                    <p className="text-sm font-mono">请选择一个章节</p>
                </div>
            </div>
        );
    }

    // 加载中
    if (isLoadingChapter) {
        return (
            <div className="flex-1 flex items-center justify-center bg-[#eef3f0]">
                <Loader2 size={24} className="animate-spin text-[#8aaa9a]" />
            </div>
        );
    }

    // ============================================================
    // MAIN RENDER
    // ============================================================

    return (
        <div className="flex-1 bg-[#eef3f0] overflow-y-auto custom-scrollbar" id="garden-content-scroll">
            <div className="max-w-3xl mx-auto px-10 md:px-14 py-10 pb-24">

                {/* Chapter Title */}
                <div className="mb-8">
                    <h1 className="text-3xl font-serif font-bold text-stone-800">
                        {chapter!.title}
                    </h1>
                </div>

                {/* Divider */}
                <div className="h-px w-full bg-linear-to-r from-[#b8c9bf] via-[#ccd8d0] to-transparent mb-8" />

                {/* Content Area */}
                <div className="group/notes relative">
                    {/* Edit / Save Toolbar */}
                    {isAdmin && (
                        <div className="flex items-center justify-end mb-4 min-h-[28px]">
                            {isEditing ? (
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={cancelEdit}
                                        className="text-[11px] font-mono flex items-center gap-1 text-stone-400 hover:text-stone-600 transition-all px-3 py-1.5 rounded-lg hover:bg-white/50"
                                    >
                                        <X size={12} />
                                        取消
                                    </button>
                                    <button
                                        onClick={handleSave}
                                        disabled={isSaving}
                                        className="flex items-center gap-1.5 px-4 py-1.5 bg-[#2d3d35] text-white rounded-lg text-xs font-bold hover:bg-[#1a2b23] transition-colors shadow-sm disabled:opacity-50"
                                    >
                                        {isSaving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                                        保存 (Ctrl+S)
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={enterEditMode}
                                    className="opacity-0 group-hover/notes:opacity-100 text-[11px] font-mono flex items-center gap-1 text-[#8aaa9a] hover:text-[#4a6b5a] transition-all px-3 py-1.5 rounded-lg hover:bg-white/50"
                                >
                                    <Pencil size={10} />
                                    编辑
                                </button>
                            )}
                        </div>
                    )}

                    {/* BlockEditor */}
                    {isEditing ? (
                        <div className="bg-white border border-[#ccd8d0] rounded-2xl p-8 min-h-[500px] shadow-sm">
                            <BlockEditor
                                ref={editorRef}
                                key={`edit-${chapter!.id}`}
                                value={tempNotes}
                                onChange={(json) => setTempNotes(JSON.stringify(json))}
                                onSave={handleSave}
                                editable={true}
                                placeholder="按下 / 调出菜单..."
                            />
                        </div>
                    ) : (
                        chapter!.notes ? (
                            <div
                                onDoubleClick={isAdmin ? enterEditMode : undefined}
                                className={`bg-white/30 border border-transparent rounded-2xl p-6 min-h-[200px] ${isAdmin ? 'cursor-text' : ''}`}
                            >
                                <BlockEditor
                                    ref={editorRef}
                                    key={`view-${chapter!.id}`}
                                    value={chapter!.notes!}
                                    editable={false}
                                />
                            </div>
                        ) : (
                            <div
                                onClick={isAdmin ? enterEditMode : undefined}
                                className={`py-16 border-2 border-dashed border-[#ccd8d0] rounded-3xl flex flex-col items-center justify-center text-[#8aaa9a] gap-3 ${isAdmin ? 'cursor-pointer hover:border-teal-400 hover:bg-[#e4ece7]/50' : ''} transition-all`}
                            >
                                <Pencil size={24} className="opacity-20" />
                                <p className="text-sm font-mono tracking-tight">
                                    {isAdmin ? '双击或点击此处开始编辑' : '暂无内容'}
                                </p>
                            </div>
                        )
                    )}
                </div>
            </div>
        </div>
    );
}
