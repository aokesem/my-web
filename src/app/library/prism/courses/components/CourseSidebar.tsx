'use client';

import React, { useState } from 'react';
import { ChevronLeft, ChevronDown, Plus, GripVertical, BookOpen, FileText, Hash, List, Loader2, BookText } from 'lucide-react';
import type { Course, CourseChapter } from '../../types';

// ============================================================
// TYPES
// ============================================================

type SidebarLevel = 'courses' | 'chapters' | 'outline';

interface CourseSidebarProps {
    courses: Course[];
    chapters: CourseChapter[];
    selectedCourseId: string | null;
    selectedChapterId: string | null;
    noteHeadings: { level: number; text: string; id: string }[];
    isLoadingCourses: boolean;
    isLoadingChapters: boolean;
    onSelectCourse: (courseId: string) => void;
    onSelectChapter: (chapterId: string) => void;
    onCreateChapter: () => void;
    onDeselectCourse: () => void;
}

// ============================================================
// ACCENT COLORS (maps to course.color field)
// ============================================================

const COLOR_MAP: Record<string, { bg: string; text: string; dot: string; border: string }> = {
    violet: { bg: 'bg-violet-50', text: 'text-violet-600', dot: 'bg-violet-400', border: 'border-violet-200/60' },
    cyan: { bg: 'bg-cyan-50', text: 'text-cyan-600', dot: 'bg-cyan-400', border: 'border-cyan-200/60' },
    rose: { bg: 'bg-rose-50', text: 'text-rose-600', dot: 'bg-rose-400', border: 'border-rose-200/60' },
    amber: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-400', border: 'border-amber-200/60' },
    emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', dot: 'bg-emerald-400', border: 'border-emerald-200/60' },
    indigo: { bg: 'bg-indigo-50', text: 'text-indigo-600', dot: 'bg-indigo-400', border: 'border-indigo-200/60' },
    stone: { bg: 'bg-stone-50', text: 'text-stone-600', dot: 'bg-stone-400', border: 'border-stone-200/60' },
};

// ============================================================
// COMPONENT
// ============================================================

export function CourseSidebar({
    courses,
    chapters,
    selectedCourseId,
    selectedChapterId,
    noteHeadings,
    isLoadingCourses,
    isLoadingChapters,
    onSelectCourse,
    onSelectChapter,
    onCreateChapter,
    onDeselectCourse,
}: CourseSidebarProps) {

    // Determine which level to show
    const level: SidebarLevel = !selectedCourseId ? 'courses'
        : !selectedChapterId ? 'chapters'
            : 'outline';

    const selectedCourse = courses.find(c => c.id === selectedCourseId);
    const selectedChapter = chapters.find(c => c.id === selectedChapterId);

    const scrollToElement = (id: string) => {
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    return (
        <div className="w-[260px] min-w-[260px] bg-white border-r border-stone-200/70 flex flex-col h-full shrink-0">

            {/* ===== HEADER ===== */}
            <div className="shrink-0 border-b border-stone-200/70 px-5 py-4">
                {level === 'courses' ? (
                    <div className="flex items-center gap-2">
                        <a 
                            href="/library/prism"
                            className="p-1.5 -ml-1.5 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-md transition-colors"
                            title="返回 Prism 主页"
                        >
                            <ChevronLeft size={16} />
                        </a>
                        <BookOpen size={16} className="text-violet-400" />
                        <h2 className="text-[13px] font-mono font-bold uppercase tracking-widest text-stone-600">
                            全部课程
                        </h2>
                    </div>
                ) : level === 'chapters' ? (
                    <div>
                        <button
                            onClick={onDeselectCourse}
                            className="flex items-center gap-1.5 text-[11px] font-mono text-stone-400 hover:text-stone-600 transition-colors mb-2"
                        >
                            <ChevronLeft size={12} />
                            全部课程
                        </button>
                        <div className="flex items-center gap-2">
                            {selectedCourse?.icon ? (
                                <span className="text-base">{selectedCourse.icon}</span>
                            ) : (
                                <BookText size={16} className="text-stone-400" />
                            )}
                            <h2 className="text-sm font-bold text-stone-700 truncate">
                                {selectedCourse?.name}
                            </h2>
                        </div>
                    </div>
                ) : (
                    <div>
                        <button
                            onClick={() => onSelectChapter('')}
                            className="flex items-center gap-1.5 text-[11px] font-mono text-stone-400 hover:text-stone-600 transition-colors mb-2"
                        >
                            <ChevronLeft size={12} />
                            章节列表
                        </button>
                        {/* Chapter quick switcher */}
                        <div className="relative">
                            <select
                                value={selectedChapterId || ''}
                                onChange={(e) => onSelectChapter(e.target.value)}
                                className="w-full text-sm font-bold text-stone-700 bg-stone-50 border border-stone-200 rounded-lg px-3 py-1.5 pr-8 appearance-none focus:outline-none focus:ring-1 focus:ring-stone-300 cursor-pointer"
                            >
                                {chapters.map(ch => (
                                    <option key={ch.id} value={ch.id}>{ch.title}</option>
                                ))}
                            </select>
                            <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
                        </div>
                    </div>
                )}
            </div>

            {/* ===== CONTENT ===== */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-3">

                {/* LEVEL 1: Course List */}
                {level === 'courses' && (
                    isLoadingCourses ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 size={20} className="animate-spin text-stone-300" />
                        </div>
                    ) : courses.length === 0 ? (
                        <div className="py-12 flex flex-col items-center text-stone-400 gap-2">
                            <BookOpen size={24} className="opacity-20" />
                            <p className="text-xs font-mono">暂无课程</p>
                            <p className="text-[10px] text-stone-300">在 Admin 后台添加课程</p>
                        </div>
                    ) : (
                        <div className="space-y-1.5">
                            {courses.map(course => {
                                const colors = COLOR_MAP[course.color || 'stone'] || COLOR_MAP.stone;
                                return (
                                    <button
                                        key={course.id}
                                        onClick={() => onSelectCourse(course.id)}
                                        className={`w-full text-left px-3 py-3 rounded-xl hover:bg-stone-50 transition-all group flex items-start gap-3 ${selectedCourseId === course.id ? 'bg-stone-50 ring-1 ring-stone-200' : ''
                                            }`}
                                    >
                                        <span className="text-lg mt-0.5 w-6 flex justify-center">
                                            {course.icon ? course.icon : <BookText size={18} className="text-stone-400" />}
                                        </span>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm font-bold text-stone-700 group-hover:text-stone-900 truncate">
                                                {course.name}
                                            </div>
                                            {course.name_en && (
                                                <div className="text-[10px] font-mono text-stone-400 mt-0.5 truncate">
                                                    {course.name_en}
                                                </div>
                                            )}
                                            {course.description && (
                                                <div className="text-[11px] text-stone-400 mt-1 line-clamp-2 leading-snug">
                                                    {course.description}
                                                </div>
                                            )}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )
                )}

                {/* LEVEL 2: Chapter List */}
                {level === 'chapters' && (
                    isLoadingChapters ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 size={20} className="animate-spin text-stone-300" />
                        </div>
                    ) : (
                        <div className="space-y-1">
                            {chapters.map((ch, idx) => (
                                <button
                                    key={ch.id}
                                    onClick={() => onSelectChapter(ch.id)}
                                    className={`w-full text-left px-3 py-2.5 rounded-lg transition-all flex items-center gap-2.5 group ${selectedChapterId === ch.id
                                        ? 'bg-stone-100 text-stone-800'
                                        : 'text-stone-600 hover:bg-stone-50 hover:text-stone-800'
                                        }`}
                                >
                                    <span className="text-[11px] font-mono font-bold text-stone-400 shrink-0 w-6">
                                        {String(idx + 1).padStart(2, '0')}
                                    </span>
                                    <span className="text-[13px] font-medium truncate">
                                        {ch.title}
                                    </span>
                                </button>
                            ))}

                            {/* Add Chapter Button */}
                            <button
                                onClick={onCreateChapter}
                                className="w-full mt-3 py-2.5 border-2 border-dashed border-stone-200 rounded-lg text-stone-400 hover:border-stone-300 hover:text-stone-600 hover:bg-stone-50 transition-all text-xs font-bold flex items-center justify-center gap-1.5"
                            >
                                <Plus size={14} />
                                新建章节
                            </button>
                        </div>
                    )
                )}

                {/* LEVEL 3: Outline */}
                {level === 'outline' && (
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Hash size={13} className="text-stone-400" />
                            <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-stone-500">
                                标题大纲
                            </span>
                        </div>

                        {noteHeadings.length > 0 ? (
                            <div className="space-y-0.5">
                                {noteHeadings.map((h, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => scrollToElement(h.id)}
                                        className="w-full text-left rounded-lg text-[13px] text-stone-600 hover:bg-stone-100 hover:text-stone-800 transition-colors py-1.5 px-3 leading-snug"
                                        style={{ paddingLeft: `${(h.level - 1) * 16 + 12}px` }}
                                    >
                                        <span className={`${h.level === 1 ? 'font-bold text-stone-700' :
                                            h.level === 2 ? 'font-medium text-stone-600' :
                                                'text-stone-500'
                                            }`}>
                                            {h.text}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <div className="py-8 flex flex-col items-center text-stone-400 gap-2">
                                <List size={20} className="opacity-20" />
                                <p className="text-xs font-mono">暂无标题大纲</p>
                                <p className="text-[10px] text-stone-300">在笔记中使用 # 标题</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
