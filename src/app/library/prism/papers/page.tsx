"use client";

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowLeft,
    FileText,
    Triangle,
    ChevronLeft,
    ChevronRight,
    ArrowUpDown,
    BookOpen,
    Eye,
    Star,
} from 'lucide-react';
import Link from 'next/link';

// ============================================================
// TYPES & DATA
// ============================================================

interface Paper {
    id: string;
    title: string;
    authors?: string;
    year?: number;
    url?: string;
    projects: string[];
    directions: string[];
    types: string[];
    summary?: string;
    notes?: string;
    rating?: number;
    read_depth: '精读' | '粗读';
    created_at: string;
}

// 静态示例数据
const EXAMPLE_PAPERS: Paper[] = [
    {
        id: '1',
        title: 'Attention Is All You Need',
        authors: 'Vaswani et al.',
        year: 2017,
        projects: ['对话系统'],
        directions: ['Transformer', '注意力机制'],
        types: ['算法'],
        summary: '提出了基于自注意力机制的 Transformer 架构，取代了传统的 RNN/CNN 序列建模方式。',
        rating: 9.5,
        read_depth: '精读',
        created_at: '2026-01-15',
    },
    {
        id: '2',
        title: 'Proximal Policy Optimization Algorithms',
        authors: 'Schulman et al.',
        year: 2017,
        projects: ['智能体训练'],
        directions: ['强化学习', '策略优化'],
        types: ['算法'],
        summary: '提出 PPO 算法，通过 clipped surrogate objective 实现稳定的策略梯度更新。',
        rating: 9.0,
        read_depth: '精读',
        created_at: '2026-01-20',
    },
    {
        id: '3',
        title: 'LoRA: Low-Rank Adaptation of Large Language Models',
        authors: 'Hu et al.',
        year: 2021,
        projects: ['对话系统'],
        directions: ['参数微调', 'LLM'],
        types: ['算法', '应用'],
        summary: '通过低秩矩阵分解实现大模型的高效微调，大幅降低训练成本。',
        rating: 8.5,
        read_depth: '精读',
        created_at: '2026-02-03',
    },
    {
        id: '4',
        title: 'A Survey of Reinforcement Learning from Human Feedback',
        authors: 'Kaufmann et al.',
        year: 2023,
        projects: [],
        directions: ['强化学习', 'RLHF'],
        types: ['综述'],
        summary: '系统梳理了 RLHF 的发展脉络、关键方法和主要挑战。',
        rating: 7.5,
        read_depth: '粗读',
        created_at: '2026-02-10',
    },
    {
        id: '5',
        title: 'Constitutional AI: Harmlessness from AI Feedback',
        authors: 'Bai et al.',
        year: 2022,
        projects: ['对话系统'],
        directions: ['AI安全', 'RLHF'],
        types: ['算法', '应用'],
        summary: '提出通过 AI 自身反馈来训练无害性，减少对人类标注的依赖。',
        read_depth: '粗读',
        created_at: '2026-02-18',
    },
    {
        id: '6',
        title: 'Deep Residual Learning for Image Recognition',
        authors: 'He et al.',
        year: 2015,
        projects: [],
        directions: ['计算机视觉'],
        types: ['算法'],
        summary: '提出残差连接解决深层网络退化问题，使得训练极深网络成为可能。',
        rating: 9.8,
        read_depth: '精读',
        created_at: '2026-02-25',
    },
    {
        id: '7',
        title: 'Scaling Laws for Neural Language Models',
        authors: 'Kaplan et al.',
        year: 2020,
        projects: ['对话系统'],
        directions: ['LLM', 'Scaling'],
        types: ['应用'],
        summary: '发现了模型规模、数据量和计算量之间的幂律关系。',
        rating: 8.0,
        read_depth: '粗读',
        created_at: '2026-03-01',
    },
    {
        id: '8',
        title: 'Decision Transformer: Reinforcement Learning via Sequence Modeling',
        authors: 'Chen et al.',
        year: 2021,
        projects: ['智能体训练'],
        directions: ['强化学习', 'Transformer'],
        types: ['算法'],
        summary: '将离线强化学习重新表述为序列建模问题，使用 Transformer 架构进行决策。',
        rating: 8.5,
        read_depth: '精读',
        created_at: '2026-03-05',
    },
    {
        id: '9',
        title: 'Tool Learning with Foundation Models',
        authors: 'Qin et al.',
        year: 2023,
        projects: ['智能体训练'],
        directions: ['LLM', 'Agent'],
        types: ['综述'],
        summary: '综述了基础模型使用外部工具的研究进展，涵盖了工具学习的范式和评估。',
        read_depth: '粗读',
        created_at: '2026-03-08',
    },
    {
        id: '10',
        title: 'FlashAttention: Fast and Memory-Efficient Exact Attention',
        authors: 'Dao et al.',
        year: 2022,
        projects: [],
        directions: ['Transformer', '系统优化'],
        types: ['算法', '工具'],
        summary: '通过 IO 感知的分块计算实现精确注意力的加速，无需近似。',
        rating: 9.0,
        read_depth: '精读',
        created_at: '2026-03-10',
    },
];

// ============================================================
// CONSTANTS
// ============================================================

const TABS = [
    { id: 'projects', label: '项目', disabled: true },
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

function PaperCard({ paper, index }: { paper: Paper; index: number }) {
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

export default function PapersPage() {
    const [activeTab, setActiveTab] = useState('all');
    const [sortBy, setSortBy] = useState<SortKey>('created_at');
    const [sortDesc, setSortDesc] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);

    // Sorting
    const sortedPapers = useMemo(() => {
        const papers = [...EXAMPLE_PAPERS];
        papers.sort((a, b) => {
            let valA: number, valB: number;
            switch (sortBy) {
                case 'created_at':
                    valA = new Date(a.created_at).getTime();
                    valB = new Date(b.created_at).getTime();
                    break;
                case 'year':
                    valA = a.year ?? 0;
                    valB = b.year ?? 0;
                    break;
                case 'rating':
                    valA = a.rating ?? 0;
                    valB = b.rating ?? 0;
                    break;
                default:
                    return 0;
            }
            return sortDesc ? valB - valA : valA - valB;
        });
        return papers;
    }, [sortBy, sortDesc]);

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

    return (
        <div className="min-h-screen bg-[#faf9f7] text-slate-800 selection:bg-purple-200/40 flex flex-col">

            {/* ===== HEADER ===== */}
            <header className="w-full px-10 pt-8 pb-4 flex justify-between items-start z-20 shrink-0">
                <Link
                    href="/library/prism"
                    className="group flex items-center gap-2.5 px-4 py-2 rounded-xl bg-white/70 border border-stone-200/60 hover:bg-white hover:shadow-sm hover:border-stone-300 transition-all duration-300 backdrop-blur-sm"
                >
                    <ArrowLeft size={16} className="text-stone-400 group-hover:text-stone-600 group-hover:-translate-x-0.5 transition-all" />
                    <span className="text-[11px] font-mono font-bold text-stone-500 group-hover:text-stone-700 uppercase tracking-widest transition-colors">
                        Prism
                    </span>
                </Link>

                <div className="flex flex-col items-end">
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
            </header>

            {/* ===== TAB BAR ===== */}
            <div className="w-full px-10 pb-4 shrink-0">
                <div className="max-w-7xl mx-auto flex items-center gap-1 p-1 bg-stone-100/60 rounded-xl border border-stone-200/50 w-fit">
                    {TABS.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => !tab.disabled && setActiveTab(tab.id)}
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

            {/* ===== TOOLBAR ===== */}
            <div className="w-full px-10 pb-6 shrink-0">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <span className="text-sm text-stone-500">
                            共 <span className="font-bold text-stone-700">{sortedPapers.length}</span> 篇论文
                        </span>
                    </div>

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
                                <PaperCard key={paper.id} paper={paper} index={i} />
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

            {/* ===== FOOTER ===== */}
            <footer className="w-full px-10 py-4 flex justify-between items-center shrink-0">
                <span className="text-[9px] font-mono text-stone-300 uppercase tracking-[0.3em]">
                    Aokesem • Cognitive Prism
                </span>
                <span className="text-[9px] font-mono text-stone-300 uppercase tracking-[0.3em]">
                    Papers Module v0.1
                </span>
            </footer>
        </div>
    );
}
