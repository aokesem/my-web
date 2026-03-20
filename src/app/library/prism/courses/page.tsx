"use client";

import React, { useState, useRef, useMemo, useCallback } from 'react';
import { ArrowLeft, BookText } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import { useCourses, useCourseChapters, useChapterContent, useCourseFormulas } from '../hooks/usePrismData';
import type { CourseFormula } from '../types';
import type { BlockEditorRef } from '@/components/ui/block-editor';

import { CourseSidebar } from './components/CourseSidebar';
import { CourseContentView } from './components/CourseContentView';

export default function CoursesPage() {
    // ============================================================
    // STATE
    // ============================================================
    const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
    const [selectedChapterId, setSelectedChapterId] = useState<string | null>(null);
    const editorRef = useRef<BlockEditorRef>(null);

    // ============================================================
    // DATA HOOKS
    // ============================================================
    const { courses, isLoading: isLoadingCourses, mutate: mutateCourses } = useCourses();
    const { chapters, isLoading: isLoadingChapters, mutate: mutateChapters } = useCourseChapters(selectedCourseId);
    const { chapter, isLoading: isLoadingChapter, mutate: mutateChapter } = useChapterContent(selectedChapterId);
    const { formulas, mutate: mutateFormulas } = useCourseFormulas(selectedCourseId);

    const selectedCourse = courses.find(c => c.id === selectedCourseId);

    // ============================================================
    // NOTE HEADINGS (for TOC - Level 3 sidebar)
    // ============================================================
    const noteHeadings = useMemo(() => {
        if (!chapter?.notes) return [];
        const headings: { level: number; text: string; id: string }[] = [];
        const notes = chapter.notes;

        let parsedJson: any = null;
        if (typeof notes === 'string' && notes.trim().startsWith('{')) {
            try { parsedJson = JSON.parse(notes); } catch (e) { }
        }

        if (parsedJson?.content) {
            const traverse = (node: any) => {
                if (node.type === 'heading') {
                    const level = node.attrs?.level || 1;
                    const text = node.content?.map((c: any) => c.text || '').join('') || '';
                    if (text) {
                        const id = 'heading-' + text.toLowerCase().replace(/[^\w\u4e00-\u9fff]+/g, '-').replace(/(^-|-$)/g, '');
                        headings.push({ level, text, id });
                    }
                }
                if (node.content && Array.isArray(node.content)) node.content.forEach(traverse);
            };
            traverse(parsedJson);
        }
        return headings;
    }, [chapter?.notes]);

    // ============================================================
    // HANDLERS
    // ============================================================

    const handleSelectCourse = useCallback((courseId: string) => {
        setSelectedCourseId(courseId);
        setSelectedChapterId(null);
    }, []);

    const handleDeselectCourse = useCallback(() => {
        setSelectedCourseId(null);
        setSelectedChapterId(null);
    }, []);

    const handleSelectChapter = useCallback((chapterId: string) => {
        if (chapterId === '') {
            // Going back to chapter list
            setSelectedChapterId(null);
        } else {
            setSelectedChapterId(chapterId);
        }
    }, []);

    const handleCreateChapter = useCallback(async () => {
        if (!selectedCourseId) return;
        const title = prompt('请输入章节标题：');
        if (!title?.trim()) return;

        try {
            const { error } = await supabase.from('prism_course_chapters').insert({
                course_id: selectedCourseId,
                title: title.trim(),
                sort_order: chapters.length,
            });
            if (error) throw error;
            toast.success('章节创建成功');
            mutateChapters();
        } catch (e) {
            toast.error('创建失败');
            console.error(e);
        }
    }, [selectedCourseId, chapters.length, mutateChapters]);

    const handleSaveNotes = useCallback(async (chapterId: string, notes: string) => {
        try {
            const { error } = await supabase
                .from('prism_course_chapters')
                .update({ notes })
                .eq('id', chapterId);
            if (error) throw error;
            toast.success('笔记已保存');
            mutateChapter();
        } catch (e) {
            toast.error('保存失败');
            console.error(e);
        }
    }, [mutateChapter]);

    const handleUpdateChapterTitle = useCallback(async (chapterId: string, title: string) => {
        try {
            const { error } = await supabase
                .from('prism_course_chapters')
                .update({ title })
                .eq('id', chapterId);
            if (error) throw error;
            toast.success('标题已更新');
            mutateChapters();
            mutateChapter();
        } catch (e) {
            toast.error('更新失败');
            console.error(e);
        }
    }, [mutateChapters, mutateChapter]);

    const handleDeleteChapter = useCallback(async (chapterId: string) => {
        try {
            const { error } = await supabase
                .from('prism_course_chapters')
                .delete()
                .eq('id', chapterId);
            if (error) throw error;
            toast.success('章节已删除');
            setSelectedChapterId(null);
            mutateChapters();
        } catch (e) {
            toast.error('删除失败');
            console.error(e);
        }
    }, [mutateChapters]);

    const handleRenameChapter = useCallback(async (chapterId: string, currentTitle: string) => {
        const newTitle = prompt('请输入新的章节标题：', currentTitle);
        if (!newTitle?.trim() || newTitle.trim() === currentTitle) return;
        try {
            const { error } = await supabase
                .from('prism_course_chapters')
                .update({ title: newTitle.trim() })
                .eq('id', chapterId);
            if (error) throw error;
            toast.success('章节已重命名');
            mutateChapters();
            mutateChapter();
        } catch (e) {
            toast.error('重命名失败');
            console.error(e);
        }
    }, [mutateChapters, mutateChapter]);

    const handleDeleteChapterFromSidebar = useCallback(async (chapterId: string) => {
        if (!confirm('确定删除此章节？')) return;
        await handleDeleteChapter(chapterId);
    }, [handleDeleteChapter]);

    // Formula handlers
    const handleSaveFormula = useCallback(async (formula: Partial<CourseFormula>) => {
        try {
            const { error } = await supabase.from('prism_course_formulas').insert(formula);
            if (error) throw error;
            toast.success('公式已添加');
            mutateFormulas();
        } catch (e) {
            toast.error('添加失败');
            console.error(e);
        }
    }, [mutateFormulas]);

    const handleDeleteFormula = useCallback(async (formulaId: string) => {
        if (!confirm('确定删除此公式？')) return;
        try {
            const { error } = await supabase.from('prism_course_formulas').delete().eq('id', formulaId);
            if (error) throw error;
            toast.success('公式已删除');
            mutateFormulas();
        } catch (e) {
            toast.error('删除失败');
            console.error(e);
        }
    }, [mutateFormulas]);

    const handleUpdateFormula = useCallback(async (formulaId: string, updates: Partial<CourseFormula>) => {
        try {
            const { error } = await supabase.from('prism_course_formulas').update(updates).eq('id', formulaId);
            if (error) throw error;
            toast.success('公式已更新');
            mutateFormulas();
        } catch (e) {
            toast.error('更新失败');
            console.error(e);
        }
    }, [mutateFormulas]);

    // ============================================================
    // RENDER
    // ============================================================

    return (
        <div className="h-screen bg-[#faf9f7] text-slate-800 flex overflow-hidden">
            {/* Sidebar spans full height */}
            <CourseSidebar
                courses={courses}
                chapters={chapters}
                formulas={formulas}
                selectedCourseId={selectedCourseId}
                selectedChapterId={selectedChapterId}
                noteHeadings={noteHeadings}
                isLoadingCourses={isLoadingCourses}
                isLoadingChapters={isLoadingChapters}
                onSelectCourse={handleSelectCourse}
                onSelectChapter={handleSelectChapter}
                onCreateChapter={handleCreateChapter}
                onDeselectCourse={handleDeselectCourse}
                onRenameChapter={handleRenameChapter}
                onDeleteChapter={handleDeleteChapterFromSidebar}
            />

            {/* Right side container */}
            <div className="flex-1 flex flex-col min-w-0 relative">
                {/* Header */}
                <header className="shrink-0 w-full px-6 py-4 flex justify-end items-center bg-white/80 backdrop-blur-sm z-20 border-b border-stone-200/70">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center border border-violet-100">
                            <BookText size={18} className="text-violet-500" strokeWidth={2} />
                        </div>
                        <h1 className="text-lg font-serif font-bold text-stone-700">
                            课程笔记
                        </h1>
                        {selectedCourse && (
                            <span className="text-[12px] font-mono text-stone-400 ml-2 before:content-['/'] before:mr-2 before:text-stone-300">
                                {selectedCourse.name}
                            </span>
                        )}
                    </div>
                </header>

                {/* Main Content */}
                <main className="flex-1 flex overflow-hidden">
                    <CourseContentView
                        chapter={chapter}
                        formulas={formulas}
                        courseId={selectedCourseId || ''}
                        courseName={selectedCourse?.name || ''}
                        isLoadingChapter={isLoadingChapter}
                        onSaveNotes={handleSaveNotes}
                        onUpdateChapterTitle={handleUpdateChapterTitle}
                        onDeleteChapter={handleDeleteChapter}
                        onSaveFormula={handleSaveFormula}
                        onDeleteFormula={handleDeleteFormula}
                        onUpdateFormula={handleUpdateFormula}
                        onCreateFirstChapter={handleCreateChapter}
                        editorRef={editorRef}
                        hasChapters={chapters.length > 0}
                    />
                </main>
            </div>
        </div>
    );
}
