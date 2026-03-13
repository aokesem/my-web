"use client";

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowLeft,
    FileText,
    ChevronLeft,
    ChevronRight,
    ArrowUpDown,
    BookOpen,
    Eye,
    Star,
} from 'lucide-react';
import Link from 'next/link';
import PaperDetailModal from '../components/PaperDetailModal';
import ProjectView from '../components/ProjectView';
import { usePrismPapers, usePrismProjects } from '../hooks/usePrismData';
import { PaperDetail, ProjectData } from '../types';

// ============================================================
// TYPES & DATA
// ============================================================

// 引用 Modal 中的扩展数据类型
type Paper = PaperDetail;

// 静态示例数据已移除，转为由 Supabase 提供实时数据
// 静态项目示例数据已移除，转为由 Supabase 提供实时数据

// ============================================================
// CONSTANTS
// ============================================================

const TABS = [
    { id: 'projects', label: '项目', disabled: false },
    { id: 'directions', label: '方向', disabled: true },
    { id: 'types', label: '性质', disabled: true },
    { id: 'all', label: '全部论文', disabled: false },
];

const SORT_OPTIONS = [
    { id: 'created_at', label: '添加时间' },
    { id: 'year', label: '发表年份' },
    { id: 'rating', label: '评分' },
] as const;

type SortKey = typeof SORT_OPTIONS[number]['id'];

const ITEMS_PER_PAGE = 9;

// ============================================================
// TAG COLOR SYSTEM
// ============================================================

const TAG_STYLES = {
    project: {
        bg: 'bg-violet-50',
        text: 'text-violet-600',
        border: 'border-violet-200/60',
        dot: 'bg-violet-400',
    },
    direction: {
        bg: 'bg-cyan-50',
        text: 'text-cyan-600',
        border: 'border-cyan-200/60',
        dot: 'bg-cyan-400',
    },
    type: {
        bg: 'bg-amber-50',
        text: 'text-amber-600',
        border: 'border-amber-200/60',
        dot: 'bg-amber-400',
    },
};

// ============================================================
// PAPER CARD COMPONENT
// ============================================================

function PaperCard({ paper, index, onClick }: { paper: Paper; index: number; onClick: () => void }) {
    const allTags = [
        ...paper.projects.map(t => ({ label: t, kind: 'project' as const })),
        ...paper.directions.map(t => ({ label: t, kind: 'direction' as const })),
        ...paper.types.map(t => ({ label: t, kind: 'type' as const })),
    ];

    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: index * 0.04, ease: "easeOut" }}
            onClick={onClick}
            className="group relative bg-white rounded-2xl border border-stone-200/70 hover:border-stone-300 shadow-[0_1px_4px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] transition-all duration-300 flex flex-col p-5 cursor-pointer hover:-translate-y-0.5"
        >
            {/* Top bar: read_depth + year + rating */}
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center gap-1 text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${paper.read_depth === '精读'
                        ? 'bg-emerald-50 text-emerald-600 border border-emerald-200/60'
                        : 'bg-stone-50 text-stone-400 border border-stone-200/60'
                        }`}>
                        {paper.read_depth === '精读' ? <BookOpen size={10} /> : <Eye size={10} />}
                        {paper.read_depth}
                    </span>
                    {paper.year && (
                        <span className="text-[11px] font-mono text-stone-400">
                            {paper.year}
                        </span>
                    )}
                </div>
                {paper.rating !== undefined && (
                    <div className="flex items-center gap-1">
                        <Star size={12} className="text-amber-400 fill-amber-400" />
                        <span className="text-[12px] font-bold text-amber-500 font-mono">
                            {paper.rating.toFixed(1)}
                        </span>
                    </div>
                )}
            </div>

            {/* Title */}
            <h3 className="text-[15px] font-bold text-stone-800 leading-snug group-hover:text-stone-900 transition-colors line-clamp-2 mb-2">
                {paper.title}
            </h3>

            {/* Authors */}
            {paper.authors && (
                <p className="text-[11px] text-stone-400 font-mono mb-2 truncate">
                    {paper.authors}
                </p>
            )}

            {/* Summary */}
            {paper.summary && (
                <p className="text-[12px] text-stone-500 leading-relaxed line-clamp-2 mb-3">
                    {paper.summary}
                </p>
            )}

            {/* Spacer */}
            <div className="flex-1" />

            {/* Tags */}
            {allTags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                    {allTags.map((tag, i) => {
                        const s = TAG_STYLES[tag.kind];
                        return (
                            <span
                                key={`${tag.kind}-${i}`}
                                className={`inline-flex items-center gap-1 text-[10px] font-mono font-medium px-1.5 py-0.5 rounded ${s.bg} ${s.text} border ${s.border}`}
                            >
                                <span className={`w-1 h-1 rounded-full ${s.dot}`} />
                                {tag.label}
                            </span>
                        );
                    })}
                </div>
            )}

            {/* Footer: created_at */}
            <div className="pt-2.5 border-t border-stone-100">
                <span className="text-[10px] font-mono text-stone-300">
                    {paper.created_at} 添加
                </span>
            </div>
        </motion.div>
    );
}

// ============================================================
// MAIN PAGE
// ============================================================

export default function LibraryPapersPage() {
    // API Data Fetching
    const { papers: allPapers, isLoading: papersLoading, mutate } = usePrismPapers();
    const { projects: allProjects, isLoading: projectsLoading, mutate: mutateProjects } = usePrismProjects();

    const isLoading = papersLoading || projectsLoading;

    // View State
    const [activeTab, setActiveTab] = useState('projects');
    const [sortBy, setSortBy] = useState<SortKey>('created_at');
    const [sortDesc, setSortDesc] = useState(true);
    const [readDepthFilter, setReadDepthFilter] = useState<'all' | '精读' | '粗读'>('all');
    const [currentPage, setCurrentPage] = useState(1);

    // Modal State
    const [selectedPaperId, setSelectedPaperId] = useState<string | null>(null);

    // Derived Data
    const sortedPapers = useMemo(() => {
        let papers = [...allPapers];

        // Filter
        if (readDepthFilter !== 'all') {
            papers = papers.filter(p => p.read_depth === readDepthFilter);
        }

        // Sort
        papers.sort((a, b) => {
            let valA = a[sortBy] as any;
            let valB = b[sortBy] as any;

            if (sortBy === 'created_at') {
                valA = new Date(valA || 0).getTime();
                valB = new Date(valB || 0).getTime();
            } else if (sortBy === 'rating' || sortBy === 'year') {
                valA = valA || 0;
                valB = valB || 0;
            }

            if (valA < valB) return sortDesc ? 1 : -1;
            if (valA > valB) return sortDesc ? -1 : 1;
            return 0;
        });

        return papers;
    }, [allPapers, sortBy, sortDesc, readDepthFilter]);

    // Pagination
    const totalPages = Math.ceil(sortedPapers.length / ITEMS_PER_PAGE);
    const paginatedPapers = sortedPapers.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    const handleSortChange = (key: SortKey) => {
        if (sortBy === key) {
            setSortDesc(!sortDesc);
        } else {
            setSortBy(key);
            setSortDesc(true);
        }
        setCurrentPage(1);
    };

    const handleFilterChange = (val: 'all' | '精读' | '粗读') => {
        setReadDepthFilter(val);
        setCurrentPage(1);
    };

    // Modal navigation
    const selectedIndex = selectedPaperId ? sortedPapers.findIndex(p => p.id === selectedPaperId) : -1;
    const selectedPaper = selectedIndex !== -1 ? sortedPapers[selectedIndex] : null;

    const handleNext = () => {
        if (selectedIndex !== -1 && selectedIndex < sortedPapers.length - 1) {
            setSelectedPaperId(sortedPapers[selectedIndex + 1].id);
        }
    };

    const handlePrev = () => {
        if (selectedIndex > 0) {
            setSelectedPaperId(sortedPapers[selectedIndex - 1].id);
        }
    };

    const handleTabChange = (tabId: string) => {
        setActiveTab(tabId);
        setCurrentPage(1); // Reset pagination when tab changes
    };

    return (
        <div className="min-h-screen bg-[#faf9f7] text-slate-800 selection:bg-purple-200/40 flex flex-col">

            {/* ===== HEADER: Navigation & Title (Position Fixed/Absolute Row) ===== */}
            <div className="w-full px-10 pt-8 flex justify-between items-start z-20 shrink-0 pointer-events-none">
                <Link
                    href="/library/prism"
                    className="group flex items-center gap-2.5 px-4 py-2 rounded-xl bg-white/70 border border-stone-200/60 hover:bg-white hover:shadow-sm hover:border-stone-300 transition-all duration-300 backdrop-blur-sm pointer-events-auto"
                >
                    <ArrowLeft size={16} className="text-stone-400 group-hover:text-stone-600 group-hover:-translate-x-0.5 transition-all" />
                    <span className="text-[11px] font-mono font-bold text-stone-500 group-hover:text-stone-700 uppercase tracking-widest transition-colors">
                        Prism
                    </span>
                </Link>

                <div className="flex flex-col items-end pointer-events-auto">
                    <div className="flex items-center gap-3">
                        <FileText size={20} className="text-cyan-400" strokeWidth={1.5} />
                        <h1 className="text-2xl font-serif font-bold tracking-tight text-stone-800">
                            论文库
                        </h1>
                    </div>
                    <span className="text-[10px] font-mono text-stone-400 uppercase tracking-[0.2em] mt-1">
                        Papers Collection
                    </span>
                </div>
            </div>

            {/* ===== MAIN CONTENT AREA (Tabs & Content) ===== */}
            {/* 你可以通过调整这里的 -mt-4 等负边距来手动上移整个内容区，而不会影响顶部的返回按钮 */}
            <div className="w-full flex-1 flex flex-col -mt-10">
                {/* TAB BAR */}
                <div className="w-full px-10 pb-4 shrink-0">
                    <div className="max-w-7xl mx-auto flex items-center gap-1 p-1 bg-stone-100/60 rounded-xl border border-stone-200/50 w-fit">
                        {TABS.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => {
                                    if (!tab.disabled) setActiveTab(tab.id);
                                }}
                                disabled={tab.disabled}
                                className={`
                                relative px-5 py-2 rounded-lg text-[13px] font-bold font-mono uppercase tracking-wider transition-all duration-300
                                ${tab.id === activeTab
                                        ? 'bg-white text-stone-800 shadow-sm'
                                        : tab.disabled
                                            ? 'text-stone-300 cursor-not-allowed'
                                            : 'text-stone-500 hover:text-stone-700 hover:bg-white/50'
                                    }
                            `}
                            >
                                {tab.label}
                                {tab.disabled && (
                                    <span className="ml-1.5 text-[9px] text-stone-300 normal-case tracking-normal">soon</span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* ===== LOADING STATE ===== */}
            {isLoading && (
                <div className="w-full flex-1 flex flex-col items-center justify-center -mt-20">
                    <div className="w-8 h-8 rounded-full border-2 border-stone-200 border-t-violet-500 animate-spin mb-4" />
                    <span className="text-stone-400 font-mono text-sm tracking-wider uppercase">Loading Data...</span>
                </div>
            )}

            {/* 当处于不同TAB时的内容切换渲染 */}
            {!isLoading && activeTab === 'all' && (
                    <>
                        {/* ===== TOOLBAR ===== */}
                        <div className="w-full px-10 pb-6 shrink-0">
                            <div className="max-w-7xl mx-auto flex items-center justify-between">
                                <div className="flex items-center gap-6">
                                    <span className="text-sm text-stone-500">
                                        共 <span className="font-bold text-stone-700">{sortedPapers.length}</span> 篇论文
                                    </span>

                                    <div className="h-4 w-px bg-stone-300"></div>

                                    {/* Filter */}
                                    <div className="flex items-center gap-1 bg-stone-100 p-1 py-0.5 rounded-lg border border-stone-200/60">
                                        {(['all', '精读', '粗读'] as const).map(f => (
                                            <button
                                                key={f}
                                                onClick={() => handleFilterChange(f)}
                                                className={`
                                        px-3 py-1 rounded text-[11px] font-mono transition-all duration-200
                                        ${readDepthFilter === f
                                                        ? 'bg-white text-stone-700 shadow-[0_1px_2px_rgba(0,0,0,0.05)] font-bold'
                                                        : 'text-stone-400 hover:text-stone-600'
                                                    }
                                    `}
                                            >
                                                {f === 'all' ? '全部' : f}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Sort */}
                                <div className="flex items-center gap-1">
                                    <ArrowUpDown size={14} className="text-stone-400 mr-1" />
                                    {SORT_OPTIONS.map(opt => (
                                        <button
                                            key={opt.id}
                                            onClick={() => handleSortChange(opt.id)}
                                            className={`
                                    px-3 py-1.5 rounded-lg text-[12px] font-mono transition-all duration-200
                                    ${sortBy === opt.id
                                                    ? 'bg-stone-800 text-white shadow-sm'
                                                    : 'text-stone-400 hover:text-stone-600 hover:bg-stone-100'
                                                }
                                `}
                                        >
                                            {opt.label}
                                            {sortBy === opt.id && (
                                                <span className="ml-1 text-white/60">{sortDesc ? '↓' : '↑'}</span>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* ===== CARD GRID ===== */}
                        <main className="flex-1 w-full px-10 pb-6">
                            <div className="max-w-7xl mx-auto">
                                <AnimatePresence mode="wait">
                                    <motion.div
                                        key={`${sortBy}-${sortDesc}-${currentPage}`}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        transition={{ duration: 0.2 }}
                                        className="grid grid-cols-3 gap-5"
                                    >
                                        {paginatedPapers.map((paper, i) => (
                                            <PaperCard
                                                key={paper.id}
                                                paper={paper}
                                                index={i}
                                                onClick={() => setSelectedPaperId(paper.id)}
                                            />
                                        ))}
                                    </motion.div>
                                </AnimatePresence>
                            </div>
                        </main>

                        {/* ===== PAGINATION ===== */}
                        {totalPages > 1 && (
                            <div className="w-full px-10 pb-8 shrink-0">
                                <div className="max-w-7xl mx-auto flex items-center justify-center gap-2">
                                    <button
                                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                        disabled={currentPage === 1}
                                        className="p-2 rounded-lg text-stone-400 hover:text-stone-600 hover:bg-stone-100 disabled:opacity-25 disabled:cursor-not-allowed transition-all"
                                    >
                                        <ChevronLeft size={18} />
                                    </button>

                                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                        <button
                                            key={page}
                                            onClick={() => setCurrentPage(page)}
                                            className={`
                                    w-9 h-9 rounded-lg text-[13px] font-mono font-bold transition-all duration-200
                                    ${page === currentPage
                                                    ? 'bg-stone-800 text-white shadow-sm'
                                                    : 'text-stone-400 hover:text-stone-600 hover:bg-stone-100'
                                                }
                                `}
                                        >
                                            {page}
                                        </button>
                                    ))}

                                    <button
                                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                        disabled={currentPage === totalPages}
                                        className="p-2 rounded-lg text-stone-400 hover:text-stone-600 hover:bg-stone-100 disabled:opacity-25 disabled:cursor-not-allowed transition-all"
                                    >
                                        <ChevronRight size={18} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}

                {!isLoading && activeTab === 'projects' && (
                <ProjectView
                    projects={allProjects}
                    allPapers={allPapers}
                    onOpenPaper={(id) => setSelectedPaperId(id)}
                    onUpdateProjects={async () => { await mutateProjects(); }}
                />
            )}

            </div>

            {/* ===== FOOTER ===== */}
            <footer className="w-full px-10 py-4 flex justify-between items-center shrink-0">
                <span className="text-[9px] font-mono text-stone-300 uppercase tracking-[0.3em]">
                    Aokesem • Cognitive Prism
                </span>
                <span className="text-[9px] font-mono text-stone-300 uppercase tracking-[0.3em]">
                    Papers Module v0.1
                </span>
            </footer>

            {/* ===== MODAL ===== */}
            <PaperDetailModal
                paper={selectedPaper}
                open={selectedPaperId !== null}
                onClose={() => setSelectedPaperId(null)}
                onUpdate={async () => { await mutate(); }}
                onPrev={handlePrev}
                onNext={handleNext}
                hasPrev={selectedIndex > 0}
                hasNext={selectedIndex !== -1 && selectedIndex < sortedPapers.length - 1}
            />
        </div>
    );
}
