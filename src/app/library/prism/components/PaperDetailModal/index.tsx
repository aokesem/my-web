'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, X, FileText, List } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import type { PaperDetail } from '../../types';
import type { BlockEditorRef } from '@/components/ui/block-editor';

import { SidebarInfoPanel } from './SidebarInfoPanel';
import { SidebarTocPanel } from './SidebarTocPanel';
import { ContentRightPanel } from './ContentRightPanel';

export interface PaperDetailModalProps {
    paper: PaperDetail | null;
    open: boolean;
    onClose: () => void;
    onUpdate?: () => Promise<void>;
    hasPrev?: boolean;
    hasNext?: boolean;
    onPrev?: () => void;
    onNext?: () => void;
}

export default function PaperDetailModal({
    paper,
    open,
    onClose,
    onUpdate,
    hasPrev,
    hasNext,
    onPrev,
    onNext
}: PaperDetailModalProps) {
    const [leftPanel, setLeftPanel] = useState<'info' | 'toc'>('info');
    const editorRef = useRef<BlockEditorRef>(null);

    // Global keyboard navigation
    useEffect(() => {
        if (!open) return;
        const handleKeyDownNav = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();

            // Ignore arrow keys if user is typing in an input, textarea, or contenteditable (like Tiptap)
            const activeTag = document.activeElement?.tagName.toLowerCase();
            const isContentEditable = (document.activeElement as HTMLElement)?.isContentEditable;
            if (activeTag === 'input' || activeTag === 'textarea' || isContentEditable) {
                return;
            }

            if (e.key === 'ArrowLeft' && hasPrev && onPrev) onPrev();
            if (e.key === 'ArrowRight' && hasNext && onNext) onNext();
        };
        window.addEventListener('keydown', handleKeyDownNav);
        return () => window.removeEventListener('keydown', handleKeyDownNav);
    }, [open, onClose, hasPrev, hasNext, onPrev, onNext]);

    // DB Update Handler
    const handleUpdateField = async (field: keyof PaperDetail, value: any) => {
        if (!paper) return;
        try {
            if (field === 'figures') {
                // Figures are stored in a separate table, not in the main prism_papers table
                const { error: delErr } = await supabase.from('prism_paper_figures').delete().eq('paper_id', paper.id);
                if (delErr) throw delErr;

                const figInserts = (value as any[]).map((f, i) => ({
                    paper_id: paper.id,
                    url: f.url,
                    description: f.description,
                    sort_order: i
                }));

                if (figInserts.length > 0) {
                    const { error: insErr } = await supabase.from('prism_paper_figures').insert(figInserts);
                    if (insErr) throw insErr;
                }
            } else {
                const { error } = await supabase
                    .from('prism_papers')
                    .update({ [field]: value })
                    .eq('id', paper.id);

                if (error) throw error;
            }

            toast.success('更新成功');
            if (onUpdate) await onUpdate();
        } catch (error) {
            console.error('Update error:', error);
            toast.error('保存失败');
            throw error;
        }
    };

    if (!paper) return null;

    return (
        <AnimatePresence>
            {open && (
                <div className="fixed inset-0 z-100 flex items-center justify-center p-4 sm:p-6 md:p-8 print:relative print:p-0 print:block">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm print:hidden"
                    />

                    {/* Navigation Buttons (Outside Modal) */}
                    <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 justify-between pointer-events-none z-10 hidden md:flex print:hidden">
                        <motion.button
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: hasPrev ? 1 : 0, x: 0 }}
                            onClick={(e) => { e.stopPropagation(); onPrev?.(); }}
                            disabled={!hasPrev}
                            className={`p-3 rounded-full bg-white/10 text-white backdrop-blur-md border border-white/20 transition-all pointer-events-auto shadow-lg hover:bg-white/20 hover:scale-110 active:scale-95 ${!hasPrev && 'opacity-0 cursor-default pointer-events-none'}`}
                        >
                            <ChevronLeft size={24} />
                        </motion.button>
                        <motion.button
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: hasNext ? 1 : 0, x: 0 }}
                            onClick={(e) => { e.stopPropagation(); onNext?.(); }}
                            disabled={!hasNext}
                            className={`p-3 rounded-full bg-white/10 text-white backdrop-blur-md border border-white/20 transition-all pointer-events-auto shadow-lg hover:bg-white/20 hover:scale-110 active:scale-95 ${!hasNext && 'opacity-0 cursor-default pointer-events-none'}`}
                        >
                            <ChevronRight size={24} />
                        </motion.button>
                    </div>

                    {/* Modal Content */}
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.98 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="relative w-full max-w-[1200px] h-[90vh] bg-[#faf9f7] rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row border border-stone-200/50 print:h-auto print:shadow-none print:border-none print:overflow-visible print:bg-white"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Close Button */}
                        <button
                            onClick={onClose}
                            className="absolute top-6 right-6 z-20 p-2 rounded-full bg-stone-100 text-stone-400 hover:bg-stone-200 hover:text-stone-600 transition-colors print:hidden"
                        >
                            <X size={18} strokeWidth={2.5} />
                        </button>

                        {/* ===== LEFT SIDEBAR ===== */}
                        <div className="w-full md:w-1/3 min-w-[320px] max-w-[400px] bg-white border-r border-stone-200/70 flex flex-col shrink-0 z-10 print:hidden">

                            {/* Panel Switcher Tabs */}
                            <div className="shrink-0 flex border-b border-stone-200/70 bg-stone-50/50">
                                <button
                                    onClick={() => setLeftPanel('info')}
                                    className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-[12px] font-mono font-bold uppercase tracking-wider transition-all border-b-2 ${leftPanel === 'info'
                                        ? 'border-stone-800 text-stone-800 bg-white'
                                        : 'border-transparent text-stone-400 hover:text-stone-600'
                                        }`}
                                >
                                    <FileText size={13} />
                                    论文信息
                                </button>
                                <button
                                    onClick={() => setLeftPanel('toc')}
                                    className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-[12px] font-mono font-bold uppercase tracking-wider transition-all border-b-2 ${leftPanel === 'toc'
                                        ? 'border-stone-800 text-stone-800 bg-white'
                                        : 'border-transparent text-stone-400 hover:text-stone-600'
                                        }`}
                                >
                                    <List size={13} />
                                    目录
                                </button>
                            </div>

                            {/* Panel Content */}
                            <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
                                {leftPanel === 'info' ? (
                                    <SidebarInfoPanel
                                        paper={paper}
                                        editorRef={editorRef}
                                        onUpdate={handleUpdateField}
                                    />
                                ) : (
                                    <SidebarTocPanel
                                        notes={typeof paper.notes === 'string' ? paper.notes : JSON.stringify(paper.notes)}
                                        figures={paper.figures}
                                    />
                                )}
                            </div>
                        </div>

                        {/* ===== RIGHT CONTENT ===== */}
                        <ContentRightPanel
                            paper={paper}
                            editorRef={editorRef}
                            onUpdate={handleUpdateField}
                        />
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
