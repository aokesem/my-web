import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X,
    ChevronLeft,
    ChevronRight,
    BookOpen,
    Eye,
    Star,
    ExternalLink,
    ListChecks,
    Image as ImageIcon
} from 'lucide-react';
import Link from 'next/link';

// ============================================================
// TYPES
// ============================================================
import { PaperDetail } from '../types';
export type { PaperDetail };

interface PaperDetailModalProps {
    paper: PaperDetail | null;
    open: boolean;
    onClose: () => void;
    onPrev?: () => void;
    onNext?: () => void;
    hasPrev?: boolean;
    hasNext?: boolean;
}

// ============================================================
// CONSTANTS & STYLES
// ============================================================

const TAG_STYLES = {
    project: { bg: 'bg-violet-50', text: 'text-violet-600', border: 'border-violet-200/60', dot: 'bg-violet-400' },
    direction: { bg: 'bg-cyan-50', text: 'text-cyan-600', border: 'border-cyan-200/60', dot: 'bg-cyan-400' },
    type: { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200/60', dot: 'bg-amber-400' },
};

// ============================================================
// COMPONENT
// ============================================================

export default function PaperDetailModal({
    paper,
    open,
    onClose,
    onPrev,
    onNext,
    hasPrev,
    hasNext
}: PaperDetailModalProps) {
    const modalRef = useRef<HTMLDivElement>(null);

    // Keyboard navigation
    useEffect(() => {
        if (!open) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
            if (e.key === 'ArrowLeft' && hasPrev && onPrev) onPrev();
            if (e.key === 'ArrowRight' && hasNext && onNext) onNext();
        };
        window.addEventListener('keydown', handleKeyDown);
        // Prevent body scroll when modal is open
        document.body.style.overflow = 'hidden';
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = '';
        };
    }, [open, onClose, onPrev, onNext, hasPrev, hasNext]);

    if (!paper) return null;

    const formatUrl = (url: string) => {
        if (!url) return "";
        // 处理 arXiv:2410.16322 格式
        const arxivRegex = /^arXiv:(\d+\.\d+.*)$/i;
        const match = url.match(arxivRegex);
        if (match) {
            return `https://arxiv.org/abs/${match[1]}`;
        }
        return url;
    };

    const allTags = [
        ...paper.projects.map(t => ({ label: t, kind: 'project' as const })),
        ...paper.directions.map(t => ({ label: t, kind: 'direction' as const })),
        ...paper.types.map(t => ({ label: t, kind: 'type' as const })),
    ];

    return (
        <AnimatePresence>
            {open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-6 sm:p-12">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm"
                        onClick={onClose}
                    />

                    {/* Navigation Buttons (Outside Modal) */}
                    <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 justify-between pointer-events-none z-10 hidden md:flex">
                        <motion.button
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: hasPrev ? 1 : 0, x: 0 }}
                            exit={{ opacity: 0 }}
                            onClick={(e) => { e.stopPropagation(); onPrev?.(); }}
                            disabled={!hasPrev}
                            className="pointer-events-auto p-3 rounded-full bg-white/90 shadow-lg text-stone-600 hover:text-stone-900 hover:bg-white transition-all disabled:opacity-0"
                        >
                            <ChevronLeft size={24} />
                        </motion.button>
                        <motion.button
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: hasNext ? 1 : 0, x: 0 }}
                            exit={{ opacity: 0 }}
                            onClick={(e) => { e.stopPropagation(); onNext?.(); }}
                            disabled={!hasNext}
                            className="pointer-events-auto p-3 rounded-full bg-white/90 shadow-lg text-stone-600 hover:text-stone-900 hover:bg-white transition-all disabled:opacity-0"
                        >
                            <ChevronRight size={24} />
                        </motion.button>
                    </div>

                    {/* Modal Container */}
                    <motion.div
                        ref={modalRef}
                        initial={{ opacity: 0, y: 30, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.98 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="relative w-full max-w-[1200px] h-[90vh] bg-[#faf9f7] rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row border border-stone-200/50"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Close Button */}
                        <button
                            onClick={onClose}
                            className="absolute top-6 right-6 z-20 p-2 rounded-full bg-stone-100 text-stone-400 hover:bg-stone-200 hover:text-stone-600 transition-colors"
                        >
                            <X size={18} strokeWidth={2.5} />
                        </button>

                        {/* ===== LEFT SIDEBAR: Structured Data ===== */}
                        <div className="w-full md:w-1/3 min-w-[320px] max-w-[400px] bg-white border-r border-stone-200/70 p-8 flex flex-col overflow-y-auto shrink-0 z-10 custom-scrollbar">

                            {/* Meta top bar */}
                            <div className="flex items-center justify-between gap-3 mb-6">
                                <div className="flex items-center gap-2">
                                    <span className={`inline-flex items-center gap-1.5 text-[11px] font-mono font-bold uppercase tracking-wider px-2.5 py-1 rounded-md ${paper.read_depth === '精读'
                                        ? 'bg-emerald-50 text-emerald-600 border border-emerald-200/60'
                                        : 'bg-stone-50 text-stone-500 border border-stone-200/60'
                                        }`}>
                                        {paper.read_depth === '精读' ? <BookOpen size={12} /> : <Eye size={12} />}
                                        {paper.read_depth}
                                    </span>
                                    {paper.year && (
                                        <span className="text-[14px] font-serif text-stone-400">
                                            {paper.year}
                                        </span>
                                    )}
                                </div>
                                {paper.rating !== undefined && (
                                    <div className="flex items-center gap-1.5 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200/50">
                                        <Star size={14} className="text-amber-400 fill-amber-400" />
                                        <span className="text-[13px] font-bold text-amber-600 font-mono">
                                            {paper.rating.toFixed(1)}
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Title & Authors */}
                            <h1 className="text-2xl font-serif font-bold text-stone-800 leading-tight mb-3">
                                {paper.title}
                            </h1>
                            {paper.nickname && (
                                <div className="mb-4 inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-stone-100 text-stone-500 text-[11px] font-mono border border-stone-200">
                                    <span className="opacity-60">Alias:</span>
                                    <span className="font-bold text-stone-700">{paper.nickname}</span>
                                </div>
                            )}
                            {paper.authors && (
                                <p className="text-sm text-stone-500 font-mono mb-6 leading-relaxed">
                                    {paper.authors}
                                </p>
                            )}

                            {/* Tags */}
                            <div className="flex flex-wrap gap-2 mb-8">
                                {allTags.map((tag, i) => {
                                    const s = TAG_STYLES[tag.kind];
                                    return (
                                        <span
                                            key={`${tag.kind}-${i}`}
                                            className={`inline-flex items-center gap-1.5 text-[11px] font-mono font-medium px-2 py-1 rounded-md ${s.bg} ${s.text} border ${s.border}`}
                                        >
                                            <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                                            {tag.label}
                                        </span>
                                    );
                                })}
                            </div>

                            {/* Divider */}
                            <div className="h-px w-full bg-linear-to-r from-stone-200 to-transparent my-2" />

                            {/* Key Contributions */}
                            {paper.key_contributions && paper.key_contributions.length > 0 && (
                                <div className="mt-6 mb-8">
                                    <div className="flex items-center gap-2 mb-4">
                                        <ListChecks size={16} className="text-stone-400" />
                                        <h3 className="text-[13px] font-mono font-bold uppercase tracking-widest text-stone-500">
                                            主要成果
                                        </h3>
                                    </div>
                                    <div className="bg-stone-50 rounded-xl border border-stone-200/60 p-5">
                                        <ul className="space-y-3">
                                            {paper.key_contributions.map((item, idx) => (
                                                <li key={idx} className="flex items-start gap-2.5 text-sm text-stone-700 leading-relaxed">
                                                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-stone-300 shrink-0" />
                                                    <span>{item}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            )}

                            <div className="flex-1" />

                            {/* Bottom Actions */}
                            <div className="pt-6 mt-6 border-t border-stone-100 flex flex-col gap-3">
                                {paper.url && (
                                    <Link
                                        href={formatUrl(paper.url)}
                                        target="_blank"
                                        className="w-full flex items-center gap-2 justify-center px-4 py-2.5 rounded-xl bg-stone-800 text-white hover:bg-stone-900 transition-colors shadow-sm"
                                    >
                                        <ExternalLink size={14} />
                                        <span className="text-[13px] font-bold uppercase tracking-wide">
                                            阅读原文 (Source)
                                        </span>
                                    </Link>
                                )}
                                <div className="text-center">
                                    <span className="text-[10px] font-mono text-stone-300">
                                        Added on {paper.created_at}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* ===== RIGHT CONTENT: Unstructured Notes & Figures ===== */}
                        <div className="flex-1 bg-[#faf9f7] overflow-y-auto p-10 md:p-14 custom-scrollbar">
                            <div className="max-w-3xl mx-auto pb-20">

                                {/* Summary */}
                                {paper.summary && (
                                    <div className="mb-12">
                                        <p className="text-xl font-serif text-stone-600 leading-relaxed max-w-2xl italic">
                                            "{paper.summary}"
                                        </p>
                                    </div>
                                )}

                                {/* Figures Module */}
                                {paper.figures && paper.figures.length > 0 && (
                                    <div className="mb-14">
                                        <div className="flex items-center gap-2 mb-6">
                                            <ImageIcon size={16} className="text-stone-400" />
                                            <h3 className="text-[13px] font-mono font-bold uppercase tracking-widest text-stone-500">
                                                论文图表 (Figures)
                                            </h3>
                                        </div>
                                        <div className="grid gap-8">
                                            {paper.figures.map((fig, idx) => (
                                                <div key={idx} className="flex flex-col gap-3">
                                                    <div className="w-full bg-white rounded-2xl border border-stone-200/70 p-2 shadow-sm overflow-hidden flex items-center justify-center min-h-[200px]">
                                                        {fig.url ? (
                                                            <img 
                                                                src={fig.url} 
                                                                alt={fig.description || "Figure"} 
                                                                className="max-w-full h-auto rounded-xl"
                                                            />
                                                        ) : (
                                                            <div className="w-full h-full bg-stone-50 rounded-xl border border-stone-100 flex items-center justify-center min-h-[300px]">
                                                                <span className="text-stone-300 font-mono text-sm">[ No Image ]</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="px-2">
                                                        <p className="text-sm text-stone-500 leading-relaxed border-l-2 border-stone-200 pl-3">
                                                            <span className="font-bold text-stone-700 font-mono mr-2">Fig {idx + 1}.</span>
                                                            {fig.description}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Divider */}
                                {(paper.figures && paper.figures.length > 0) && (
                                    <div className="flex items-center gap-4 my-12 opacity-30">
                                        <div className="h-px flex-1 bg-stone-300" />
                                        <div className="w-1.5 h-1.5 rounded-full bg-stone-300" />
                                        <div className="w-1.5 h-1.5 rounded-full bg-stone-300" />
                                        <div className="w-1.5 h-1.5 rounded-full bg-stone-300" />
                                        <div className="h-px flex-1 bg-stone-300" />
                                    </div>
                                )}

                                {paper.notes && (
                                    <div>
                                        <div className="flex items-center gap-2 mb-6">
                                            <BookOpen size={16} className="text-stone-400" />
                                            <h3 className="text-[13px] font-mono font-bold uppercase tracking-widest text-stone-500">
                                                详细笔记 (Notes)
                                            </h3>
                                        </div>
                                        <div 
                                            className="prose prose-stone prose-p:leading-loose prose-h3:font-serif max-w-none text-stone-700"
                                            dangerouslySetInnerHTML={{ __html: paper.notes }}
                                        />
                                    </div>
                                )}

                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}

// Add these custom utilities to your global css file later:
// .custom-scrollbar::-webkit-scrollbar { width: 6px; }
// .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
// .custom-scrollbar::-webkit-scrollbar-thumb { background: #e7e5e4; border-radius: 4px; }
// .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #d6d3d1; }
