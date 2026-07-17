'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Pencil, Save, Loader2, Plus, BookOpen, Trash2, Sigma, Search } from 'lucide-react';
import { BlockEditor } from '@/components/ui/block-editor';
import type { BlockEditorRef } from '@/components/ui/block-editor';
import type { CourseChapter, CourseFormula } from '../../types';
import { FormulaGallery } from './FormulaGallery';
import { CHAPTER_ID_FORMULA_OVERVIEW } from '../page';

const SEARCH_CONTEXT_RADIUS = 65;
const MAX_BODY_RESULTS_PER_CHAPTER = 5;
const INITIAL_VISIBLE_RESULTS = 20;
const RESULTS_PAGE_SIZE = 10;

type TiptapNode = {
    type?: string;
    text?: string;
    content?: TiptapNode[];
};

type BodySearchResult = {
    id: string;
    chapterId: string;
    chapterTitle: string;
    excerpt: string;
    matchIndex: number;
};

type FormulaSearchResult = {
    id: string;
    name: string;
    latex: string;
    description: string | undefined;
    chapterTitle: string;
    matchedFields: string[];
};

type ExcerptWindow = {
    excerpt: string;
    start: number;
    end: number;
};

const BLOCK_TYPES = new Set([
    'paragraph',
    'heading',
    'listItem',
    'bulletList',
    'orderedList',
    'blockquote',
    'codeBlock',
]);

const BOUNDARY_CHARS = ['。', '！', '？', '；', '\n', '.', '!', '?', ';'];

function collectTiptapText(node: unknown, parts: string[]) {
    if (!node || typeof node !== 'object') return;

    const typedNode = node as TiptapNode;
    if (typeof typedNode.text === 'string') {
        parts.push(typedNode.text);
    }

    if (Array.isArray(typedNode.content)) {
        typedNode.content.forEach(child => collectTiptapText(child, parts));
    }

    if (typedNode.type && BLOCK_TYPES.has(typedNode.type)) {
        parts.push('\n');
    }
}

function notesToPlainText(notes?: string) {
    if (!notes) return '';

    const trimmed = notes.trim();
    if (!trimmed.startsWith('{')) {
        return trimmed.replace(/\s+/g, ' ').trim();
    }

    try {
        const parsed = JSON.parse(trimmed);
        const parts: string[] = [];
        collectTiptapText(parsed, parts);
        return parts.join('').replace(/\s+/g, ' ').trim();
    } catch {
        return trimmed.replace(/\s+/g, ' ').trim();
    }
}

function findBoundaryBefore(text: string, target: number, fallback: number) {
    let best = -1;
    BOUNDARY_CHARS.forEach(char => {
        const index = text.lastIndexOf(char, target);
        if (index >= fallback && index > best) best = index + 1;
    });
    return best >= 0 ? best : fallback;
}

function findBoundaryAfter(text: string, target: number, fallback: number) {
    let best = -1;
    BOUNDARY_CHARS.forEach(char => {
        const index = text.indexOf(char, target);
        if (index >= 0 && index <= fallback && (best === -1 || index < best)) best = index + 1;
    });
    return best >= 0 ? best : fallback;
}

function createExcerptWindow(text: string, matchIndex: number, queryLength: number): ExcerptWindow {
    const fallbackStart = Math.max(0, matchIndex - SEARCH_CONTEXT_RADIUS);
    const fallbackEnd = Math.min(text.length, matchIndex + queryLength + SEARCH_CONTEXT_RADIUS);
    const start = findBoundaryBefore(text, matchIndex, fallbackStart);
    const end = findBoundaryAfter(text, matchIndex + queryLength, fallbackEnd);
    const prefix = start > 0 ? '...' : '';
    const suffix = end < text.length ? '...' : '';

    return {
        excerpt: `${prefix}${text.slice(start, end).trim()}${suffix}`,
        start,
        end,
    };
}

function renderHighlightedExcerpt(excerpt: string, query: string) {
    const normalizedQuery = query.trim();
    if (!normalizedQuery) return excerpt;

    const lowerExcerpt = excerpt.toLowerCase();
    const lowerQuery = normalizedQuery.toLowerCase();
    const parts: React.ReactNode[] = [];
    let cursor = 0;
    let matchIndex = lowerExcerpt.indexOf(lowerQuery);

    while (matchIndex !== -1) {
        if (matchIndex > cursor) {
            parts.push(excerpt.slice(cursor, matchIndex));
        }

        const matchEnd = matchIndex + normalizedQuery.length;
        parts.push(
            <mark key={`${matchIndex}-${matchEnd}`} className="rounded-md bg-amber-100 px-1 py-0.5 text-amber-900">
                {excerpt.slice(matchIndex, matchEnd)}
            </mark>
        );

        cursor = matchEnd;
        matchIndex = lowerExcerpt.indexOf(lowerQuery, cursor);
    }

    if (cursor < excerpt.length) {
        parts.push(excerpt.slice(cursor));
    }

    return parts;
}

interface CourseContentViewProps {
    chapter: CourseChapter | null;
    formulas: CourseFormula[];
    chapters: CourseChapter[];
    searchChapters: CourseChapter[];
    courseId: string;
    courseName: string;
    selectedChapterId: string | null;
    isLoadingChapter: boolean;
    isLoadingCourseSearch: boolean;
    onSaveNotes: (chapterId: string, notes: string) => Promise<void>;
    onUpdateChapterTitle: (chapterId: string, title: string) => Promise<void>;
    onDeleteChapter: (chapterId: string) => Promise<void>;
    onSaveFormula: (formula: Partial<CourseFormula>) => Promise<void>;
    onDeleteFormula: (formulaId: string) => Promise<void>;
    onUpdateFormula: (formulaId: string, updates: Partial<CourseFormula>) => Promise<void>;
    onCreateFirstChapter: () => void;
    editorRef: React.RefObject<BlockEditorRef | null>;
    hasChapters: boolean;
    courseSearchQuery?: string;
}

export function CourseContentView({
    chapter,
    formulas,
    chapters,
    searchChapters,
    courseId,
    courseName,
    selectedChapterId,
    isLoadingChapter,
    isLoadingCourseSearch,
    onSaveNotes,
    onUpdateChapterTitle,
    onDeleteChapter,
    onSaveFormula,
    onDeleteFormula,
    onUpdateFormula,
    onCreateFirstChapter,
    editorRef,
    hasChapters,
    courseSearchQuery = '',
}: CourseContentViewProps) {
    const [editingNotes, setEditingNotes] = useState(false);
    const [editingTitle, setEditingTitle] = useState(false);
    const [tempNotes, setTempNotes] = useState('');
    const [tempTitle, setTempTitle] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [visibleFormulaResults, setVisibleFormulaResults] = useState(INITIAL_VISIBLE_RESULTS);
    const [visibleBodyResults, setVisibleBodyResults] = useState(INITIAL_VISIBLE_RESULTS);

    const chapterTitleById = useMemo(() => {
        return new Map(chapters.map(chapterItem => [chapterItem.id, chapterItem.title]));
    }, [chapters]);

    const allFormulaSearchResults = useMemo<FormulaSearchResult[]>(() => {
        const query = courseSearchQuery.trim();
        if (!query) return [];

        const lowerQuery = query.toLowerCase();

        return formulas
            .map(formula => {
                const fields = [
                    { label: '公式名', value: formula.name },
                    { label: '说明', value: formula.description || '' },
                    { label: 'LaTeX', value: formula.latex },
                ];
                const matchedFields = fields
                    .filter(field => field.value.toLowerCase().includes(lowerQuery))
                    .map(field => field.label);

                if (matchedFields.length === 0) return null;

                return {
                    id: formula.id,
                    name: formula.name,
                    latex: formula.latex,
                    description: formula.description,
                    chapterTitle: formula.chapter_id ? (chapterTitleById.get(formula.chapter_id) || '未知章节') : '全课通用公式',
                    matchedFields,
                };
            })
            .filter((result): result is FormulaSearchResult => result !== null);
    }, [chapterTitleById, courseSearchQuery, formulas]);

    const allBodySearchResults = useMemo<BodySearchResult[]>(() => {
        const query = courseSearchQuery.trim();
        if (!query) return [];

        const lowerQuery = query.toLowerCase();
        const results: BodySearchResult[] = [];

        searchChapters.forEach(chapterItem => {
            const plainText = notesToPlainText(chapterItem.notes);
            if (!plainText) return;

            const lowerText = plainText.toLowerCase();
            const chapterResults: BodySearchResult[] = [];
            let searchFrom = 0;
            let lastWindowEnd = -1;

            while (chapterResults.length < MAX_BODY_RESULTS_PER_CHAPTER) {
                const matchIndex = lowerText.indexOf(lowerQuery, searchFrom);
                if (matchIndex === -1) break;

                const window = createExcerptWindow(plainText, matchIndex, query.length);
                searchFrom = matchIndex + query.length;

                if (window.start <= lastWindowEnd + 20) {
                    continue;
                }

                chapterResults.push({
                    id: `${chapterItem.id}-${matchIndex}`,
                    chapterId: chapterItem.id,
                    chapterTitle: chapterItem.title,
                    excerpt: window.excerpt,
                    matchIndex,
                });
                lastWindowEnd = window.end;
            }

            results.push(...chapterResults);
        });

        return results;
    }, [courseSearchQuery, searchChapters]);

    const formulaSearchResults = allFormulaSearchResults.slice(0, visibleFormulaResults);
    const bodySearchResults = allBodySearchResults.slice(0, visibleBodyResults);

    useEffect(() => {
        setVisibleFormulaResults(INITIAL_VISIBLE_RESULTS);
        setVisibleBodyResults(INITIAL_VISIBLE_RESULTS);
    }, [courseSearchQuery]);

    const handleSaveNotes = async () => {
        if (!chapter) return;

        // Read content directly from the editor instance at save time.
        // This avoids relying on tempNotes, which is updated via onUpdate and
        // can be corrupted if ReactNodeViewRenderer-based nodes (e.g. CodeBlockView)
        // haven't fully mounted when onUpdate fires during initialization.
        // At save time, the editor is guaranteed to be fully initialized.
        const editorInstance = editorRef.current?.editor;
        const notes = editorInstance
            ? JSON.stringify(editorInstance.getJSON())
            : tempNotes;

        setIsSaving(true);
        try {
            await onSaveNotes(chapter.id, notes);
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
            <div className="flex-1 bg-[#faf9f7] overflow-hidden">
                <div className="h-full px-8 md:px-12 py-8">
                    <div className="h-full rounded-[28px] border border-stone-200/70 bg-stone-100/45 shadow-inner shadow-stone-200/50 overflow-hidden">
                        {courseSearchQuery ? (
                            <div className="h-full flex flex-col">
                                <div className="shrink-0 border-b border-stone-200/70 bg-white/35 px-7 py-5">
                                    <div className="flex items-center gap-2 text-[11px] font-mono font-bold uppercase tracking-[0.22em] text-violet-400">
                                        <Search size={13} />
                                        Course Search
                                    </div>
                                    <h2 className="mt-2 text-xl font-serif font-bold text-stone-800">
                                        {courseSearchQuery}
                                    </h2>
                                    <p className="mt-1 text-xs text-stone-400">
                                        公式结果会优先显示，正文结果会展示命中处附近的原文窗口。
                                    </p>
                                </div>

                                <div className="flex-1 overflow-y-auto custom-scrollbar px-7 py-6">
                                    {isLoadingCourseSearch ? (
                                        <div className="h-full flex items-center justify-center">
                                            <Loader2 size={22} className="animate-spin text-stone-300" />
                                        </div>
                                    ) : allFormulaSearchResults.length > 0 || allBodySearchResults.length > 0 ? (
                                        <div className="space-y-7">
                                            {allFormulaSearchResults.length > 0 && (
                                                <section className="space-y-4">
                                                    <div className="flex items-center justify-between">
                                                        <div>
                                                            <p className="text-[11px] font-mono font-bold uppercase tracking-[0.2em] text-violet-400">
                                                                Formula Matches
                                                            </p>
                                                            <h3 className="mt-1 text-lg font-serif font-bold text-stone-800">
                                                                公式结果
                                                            </h3>
                                                        </div>
                                                        <span className="rounded-full border border-violet-100 bg-violet-50/70 px-3 py-1 text-[11px] font-mono text-violet-400">
                                                            {formulaSearchResults.length} / {allFormulaSearchResults.length}
                                                        </span>
                                                    </div>

                                                    {formulaSearchResults.map((result, index) => (
                                                        <article
                                                            key={result.id}
                                                            className="rounded-3xl border border-violet-100/90 bg-white/75 p-5 shadow-sm shadow-violet-100/50 transition-colors hover:border-violet-200 hover:bg-white"
                                                        >
                                                            <div className="mb-4 flex items-start justify-between gap-4">
                                                                <div className="min-w-0">
                                                                    <div className="mb-2 flex items-center gap-2">
                                                                        <span className="inline-flex h-7 w-7 items-center justify-center rounded-xl bg-violet-50 text-violet-500">
                                                                            <Sigma size={15} />
                                                                        </span>
                                                                        <span className="truncate text-base font-bold text-stone-800">
                                                                            {renderHighlightedExcerpt(result.name, courseSearchQuery)}
                                                                        </span>
                                                                    </div>
                                                                    <p className="text-[11px] font-mono text-stone-400">
                                                                        {result.chapterTitle} / 命中：{result.matchedFields.join('、')}
                                                                    </p>
                                                                </div>
                                                                <span className="shrink-0 rounded-full bg-violet-50 px-2.5 py-1 text-[11px] font-mono text-violet-400">
                                                                    F{index + 1}
                                                                </span>
                                                            </div>

                                                            {result.description && (
                                                                <p className="mb-3 text-sm leading-7 text-stone-600">
                                                                    {renderHighlightedExcerpt(result.description, courseSearchQuery)}
                                                                </p>
                                                            )}

                                                            <p className="truncate rounded-2xl border border-stone-200/70 bg-stone-50/80 px-3 py-2 font-mono text-xs text-stone-500">
                                                                {renderHighlightedExcerpt(result.latex, courseSearchQuery)}
                                                            </p>
                                                        </article>
                                                    ))}

                                                    {allFormulaSearchResults.length > formulaSearchResults.length && (
                                                        <div className="pt-1 text-center">
                                                            <button
                                                                type="button"
                                                                onClick={() => setVisibleFormulaResults(count => count + RESULTS_PAGE_SIZE)}
                                                                className="rounded-full border border-violet-100 bg-white/70 px-4 py-2 text-xs font-bold text-violet-500 hover:border-violet-200 hover:bg-violet-50 transition-colors"
                                                            >
                                                                显示更多公式结果
                                                            </button>
                                                        </div>
                                                    )}
                                                </section>
                                            )}

                                            {allBodySearchResults.length > 0 && (
                                                <section className="space-y-4">
                                                    <div className="flex items-center justify-between">
                                                        <div>
                                                            <p className="text-[11px] font-mono font-bold uppercase tracking-[0.2em] text-stone-400">
                                                                Text Matches
                                                            </p>
                                                            <h3 className="mt-1 text-lg font-serif font-bold text-stone-800">
                                                                正文结果
                                                            </h3>
                                                        </div>
                                                        <span className="rounded-full border border-stone-200 bg-white/60 px-3 py-1 text-[11px] font-mono text-stone-400">
                                                            {bodySearchResults.length} / {allBodySearchResults.length}
                                                        </span>
                                                    </div>

                                                    {bodySearchResults.map((result, index) => (
                                                        <article
                                                            key={result.id}
                                                            className="group rounded-3xl border border-stone-200/80 bg-white/70 p-5 shadow-sm shadow-stone-200/50 transition-colors hover:border-violet-200 hover:bg-white"
                                                        >
                                                            <div className="mb-3 flex items-center justify-between gap-3">
                                                                <div className="min-w-0">
                                                                    <p className="text-[11px] font-mono font-bold uppercase tracking-[0.18em] text-violet-400">
                                                                        Chapter
                                                                    </p>
                                                                    <h4 className="mt-1 truncate text-base font-bold text-stone-700">
                                                                        {result.chapterTitle}
                                                                    </h4>
                                                                </div>
                                                                <span className="shrink-0 rounded-full bg-stone-100 px-2.5 py-1 text-[11px] font-mono text-stone-400">
                                                                    #{index + 1}
                                                                </span>
                                                            </div>
                                                            <p className="text-sm leading-7 text-stone-600">
                                                                {renderHighlightedExcerpt(result.excerpt, courseSearchQuery)}
                                                            </p>
                                                        </article>
                                                    ))}

                                                    {allBodySearchResults.length > bodySearchResults.length && (
                                                        <div className="pt-2 text-center">
                                                            <button
                                                                type="button"
                                                                onClick={() => setVisibleBodyResults(count => count + RESULTS_PAGE_SIZE)}
                                                                className="rounded-full border border-stone-200 bg-white/70 px-4 py-2 text-xs font-bold text-stone-500 hover:border-violet-200 hover:bg-white transition-colors"
                                                            >
                                                                显示更多正文结果
                                                            </button>
                                                        </div>
                                                    )}
                                                </section>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="rounded-3xl border border-dashed border-stone-300/80 bg-white/45 p-8 text-center">
                                            <div className="mx-auto mb-3 w-12 h-12 rounded-2xl bg-violet-50 border border-violet-100 flex items-center justify-center">
                                                <Search size={22} className="text-violet-400" strokeWidth={1.7} />
                                            </div>
                                            <p className="text-sm font-bold text-stone-600">没有找到匹配内容</p>
                                            <p className="mt-2 text-xs leading-6 text-stone-400">
                                                当前按完整字符串搜索正文与公式，不搜索章节标题；可以换一个更短的关键词试试。
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center gap-3 text-stone-400">
                                <BookOpen size={24} className="opacity-30" />
                                <p className="text-sm font-mono">请从左侧选择一个章节</p>
                                <p className="text-xs text-stone-400/80">也可以在上方搜索当前课程的正文与公式</p>
                            </div>
                        )}
                    </div>
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
                                            key={`view-${chapter!.id}-${chapter!.notes?.length}`}
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
