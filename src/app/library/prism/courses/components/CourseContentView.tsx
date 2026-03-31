'use client';

import React, { useState, useRef } from 'react';
import { Pencil, Save, Loader2, Plus, BookOpen, Trash2, Sigma } from 'lucide-react';
import { BlockEditor } from '@/components/ui/block-editor';
import type { BlockEditorRef } from '@/components/ui/block-editor';
import type { CourseChapter, CourseFormula } from '../../types';
import { FormulaGallery } from './FormulaGallery';
import { CHAPTER_ID_FORMULA_OVERVIEW } from '../page';

interface CourseContentViewProps {
    chapter: CourseChapter | null;
    formulas: CourseFormula[];
    chapters: CourseChapter[];
    courseId: string;
    courseName: string;
    selectedChapterId: string | null;
    isLoadingChapter: boolean;
    onSaveNotes: (chapterId: string, notes: string) => Promise<void>;
    onUpdateChapterTitle: (chapterId: string, title: string) => Promise<void>;
    onDeleteChapter: (chapterId: string) => Promise<void>;
    onSaveFormula: (formula: Partial<CourseFormula>) => Promise<void>;
    onDeleteFormula: (formulaId: string) => Promise<void>;
    onUpdateFormula: (formulaId: string, updates: Partial<CourseFormula>) => Promise<void>;
    onCreateFirstChapter: () => void;
    editorRef: React.RefObject<BlockEditorRef | null>;
    hasChapters: boolean;
}

export function CourseContentView({
    chapter,
    formulas,
    chapters,
    courseId,
    courseName,
    selectedChapterId,
    isLoadingChapter,
    onSaveNotes,
    onUpdateChapterTitle,
    onDeleteChapter,
    onSaveFormula,
    onDeleteFormula,
    onUpdateFormula,
    onCreateFirstChapter,
    editorRef,
    hasChapters,
}: CourseContentViewProps) {
    const [editingNotes, setEditingNotes] = useState(false);
    const [editingTitle, setEditingTitle] = useState(false);
    const [tempNotes, setTempNotes] = useState('');
    const [tempTitle, setTempTitle] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const handleSaveNotes = async () => {
        if (!chapter) return;
        setIsSaving(true);
        try {
            await onSaveNotes(chapter.id, tempNotes);
            setEditingNotes(false);
        } finally {
            setIsSaving(false);
        }
    };

    const handleSaveTitle = async () => {
        if (!chapter || !tempTitle.trim()) return;
        setIsSaving(true);
        try {
            await onUpdateChapterTitle(chapter.id, tempTitle.trim());
            setEditingTitle(false);
        } finally {
            setIsSaving(false);
        }
    };

    // No course selected — welcome state
    if (!courseId) {
        return (
            <div className="flex-1 flex items-center justify-center bg-[#faf9f7]">
                <div className="flex flex-col items-center gap-4 text-center max-w-sm">
                    <div className="w-16 h-16 rounded-2xl bg-violet-50 border border-violet-200/60 flex items-center justify-center">
                        <BookOpen size={28} className="text-violet-400" strokeWidth={1.5} />
                    </div>
                    <h2 className="text-xl font-serif font-bold text-stone-700">选择一门课程</h2>
                    <p className="text-sm text-stone-400">从左侧栏选择课程开始学习笔记之旅</p>
                </div>
            </div>
        );
    }

    // Course selected but no chapters yet
    if (!hasChapters && !isLoadingChapter) {
        return (
            <div className="flex-1 flex items-center justify-center bg-[#faf9f7]">
                <div className="flex flex-col items-center gap-4 text-center max-w-sm">
                    <div className="w-16 h-16 rounded-2xl bg-stone-50 border border-stone-200/60 flex items-center justify-center">
                        <Plus size={28} className="text-stone-400" strokeWidth={1.5} />
                    </div>
                    <h2 className="text-xl font-serif font-bold text-stone-700">开始记录</h2>
                    <p className="text-sm text-stone-400 mb-2">为 {courseName} 创建第一个章节</p>
                    <button
                        onClick={onCreateFirstChapter}
                        className="px-6 py-2.5 bg-stone-800 text-white rounded-xl text-sm font-bold hover:bg-stone-900 transition-colors shadow-sm"
                    >
                        + 创建第一个章节
                    </button>
                </div>
            </div>
        );
    }

    // No chapter selected yet (but chapters exist)
    if (!chapter && !isLoadingChapter && selectedChapterId !== CHAPTER_ID_FORMULA_OVERVIEW) {
        return (
            <div className="flex-1 flex items-center justify-center bg-[#faf9f7]">
                <div className="flex flex-col items-center gap-3 text-stone-400">
                    <BookOpen size={24} className="opacity-30" />
                    <p className="text-sm font-mono">请从左侧选择一个章节</p>
                </div>
            </div>
        );
    }

    // Loading
    if (isLoadingChapter) {
        return (
            <div className="flex-1 flex items-center justify-center bg-[#faf9f7]">
                <Loader2 size={24} className="animate-spin text-stone-300" />
            </div>
        );
    }

    return (
        <div className="flex-1 bg-[#faf9f7] overflow-y-auto custom-scrollbar">
            <div className="max-w-3xl mx-auto px-10 md:px-14 py-10 pb-24">

                {/* Chapter Title / Overview Header */}
                <div className="mb-8 group/title">
                    {selectedChapterId === CHAPTER_ID_FORMULA_OVERVIEW ? (
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-violet-600 flex items-center justify-center text-white shadow-lg shadow-violet-200">
                                <Sigma size={24} />
                            </div>
                            <div>
                                <h1 className="text-2xl font-serif font-bold text-stone-800">公式总览</h1>
                                <p className="text-[11px] font-mono font-bold text-stone-400 uppercase tracking-widest mt-1">Formula Control Center</p>
                            </div>
                        </div>
                    ) : editingTitle ? (
                        <div className="flex items-center gap-3">
                            <input
                                value={tempTitle}
                                onChange={e => setTempTitle(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter') handleSaveTitle(); if (e.key === 'Escape') setEditingTitle(false); }}
                                autoFocus
                                className="flex-1 text-2xl font-serif font-bold text-stone-800 bg-transparent border-b-2 border-stone-300 focus:outline-none focus:border-stone-500 pb-1"
                            />
                            <button onClick={handleSaveTitle} disabled={isSaving} className="p-2 text-stone-400 hover:text-stone-600">
                                {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                            </button>
                        </div>
                    ) : (
                        <div className="flex items-center gap-3">
                            <h1
                                className="text-3xl font-serif font-bold text-stone-800 cursor-pointer hover:text-stone-600 transition-colors"
                                onDoubleClick={() => { setTempTitle(chapter!.title); setEditingTitle(true); }}
                            >
                                {chapter!.title}
                            </h1>
                            <button
                                onClick={() => { setTempTitle(chapter!.title); setEditingTitle(true); }}
                                className="opacity-0 group-hover/title:opacity-100 p-1.5 text-stone-300 hover:text-stone-600 transition-all"
                            >
                                <Pencil size={12} />
                            </button>
                            <button
                                onClick={() => { if (confirm('确定删除此章节？')) onDeleteChapter(chapter!.id); }}
                                className="opacity-0 group-hover/title:opacity-100 p-1.5 text-stone-300 hover:text-red-500 transition-all ml-auto"
                            >
                                <Trash2 size={12} />
                            </button>
                        </div>
                    )}
                </div>

                {/* Formula Gallery */}
                <FormulaGallery
                    formulas={formulas}
                    chapters={chapters}
                    courseId={courseId}
                    currentChapterId={chapter?.id || undefined}
                    overviewMode={selectedChapterId === CHAPTER_ID_FORMULA_OVERVIEW}
                    onSaveFormula={onSaveFormula}
                    onDeleteFormula={onDeleteFormula}
                    onUpdateFormula={onUpdateFormula}
                />

                {/* Notes Section - only for regular chapters */}
                {selectedChapterId !== CHAPTER_ID_FORMULA_OVERVIEW && (
                    <>
                        {/* Divider */}
                        <div className="h-px w-full bg-linear-to-r from-stone-200 via-stone-200 to-transparent mb-8" />

                        {/* Notes Editor */}
                        <div className="group/notes relative">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-[21px] font-bold tracking-wide text-stone-800">
                                    笔记正文
                                </h3>
                                <button
                                    onClick={() => {
                                        setTempNotes(chapter!.notes || '');
                                        setEditingNotes(!editingNotes);
                                    }}
                                    className="opacity-0 group-hover/notes:opacity-100 text-[11px] font-mono flex items-center gap-1 text-stone-400 hover:text-stone-600 transition-all"
                                >
                                    <Pencil size={10} />
                                    {editingNotes ? '返回预览' : '直接编辑'}
                                </button>
                            </div>

                            {editingNotes ? (
                                <div className="space-y-4">
                                    <div className="bg-white border border-stone-200 rounded-2xl p-8 min-h-[500px] shadow-sm">
                                        <BlockEditor
                                            ref={editorRef}
                                            key={`edit-${chapter!.id}`}
                                            value={tempNotes}
                                            onChange={(json) => setTempNotes(JSON.stringify(json))}
                                            onSave={handleSaveNotes}
                                            editable={true}
                                            imageBucket="course_images"
                                            imageFolder={`notes/${courseId}/${chapter!.id}`}
                                        />
                                    </div>
                                    <div className="flex justify-end gap-2">
                                        <button
                                            onClick={handleSaveNotes}
                                            disabled={isSaving}
                                            className="flex items-center gap-1.5 px-4 py-2 bg-stone-800 text-white rounded-xl text-xs font-bold hover:bg-stone-900 transition-colors shadow-sm disabled:opacity-50"
                                        >
                                            {isSaving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                                            保存笔记
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                chapter!.notes ? (
                                    <div
                                        onDoubleClick={() => { setTempNotes(chapter!.notes || ''); setEditingNotes(true); }}
                                        className="bg-white/50 border border-transparent rounded-2xl p-6 min-h-[200px] cursor-text"
                                    >
                                        <BlockEditor
                                            ref={editorRef}
                                            key={`view-${chapter!.id}`}
                                            value={chapter!.notes!}
                                            editable={false}
                                            imageBucket="course_images"
                                            imageFolder={`notes/${courseId}/${chapter!.id}`}
                                        />
                                    </div>
                                ) : (
                                    <div
                                        onClick={() => { setTempNotes(''); setEditingNotes(true); }}
                                        className="py-16 border-2 border-dashed border-stone-200 rounded-3xl flex flex-col items-center justify-center text-stone-400 gap-3 cursor-pointer hover:border-stone-300 hover:bg-stone-50/50 transition-all"
                                    >
                                        <Pencil size={24} className="opacity-20" />
                                        <p className="text-sm font-mono tracking-tight">双击或点击此处开始记录笔记</p>
                                    </div>
                                )
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
