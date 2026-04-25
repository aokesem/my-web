"use client";

import React, { useState, useEffect } from 'react';
import useSWR from 'swr';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { Maximize2, X, Quote as QuoteIcon } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

interface QuoteItem {
    id: number;
    text: string;
    recorded_at?: string;
}

const fetchQuotes = async () => {
    const { data, error } = await supabase.from('profile_quotes').select('*');
    if (error) throw error;
    if (data && data.length > 0) {
        const shuffled = [...data];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled as QuoteItem[];
    }
    return [{ id: 0, text: "No quotes found." }] as QuoteItem[];
};

export default function QuoteDisplay() {
    const { data: quotes = [{ id: 0, text: "Loading data..." }] } = useSWR('profile_quotes', fetchQuotes, {
        revalidateOnFocus: false,
    });
    const [quoteIndex, setQuoteIndex] = useState(0);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => { setMounted(true); }, []);

    // 静态卡片只展示前10条
    const displayQuotes = quotes.slice(0, 10);

    const handleNextQuote = () => {
        if (displayQuotes.length === 0) return;
        setQuoteIndex((prev) => (prev + 1) % displayQuotes.length);
    };

    useEffect(() => {
        if (displayQuotes.length <= 1) return;
        const timer = setTimeout(() => {
            setQuoteIndex((prev) => (prev + 1) % displayQuotes.length);
        }, 5000);
        return () => clearTimeout(timer);
    }, [quoteIndex, displayQuotes.length]);

    return (
        <div className="absolute left-10 md:left-12 top-[15.5%] z-20 select-none">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1 }} className="relative flex items-start">
                <svg width="40" height="120" className="opacity-35 overflow-visible pointer-events-none">
                    <line x1="52" y1="-70" x2="1" y2="-30" stroke="#3b82f6" strokeWidth="1" />
                    <line x1="1" y1="-30" x2="1" y2="80" stroke="#3b82f6" strokeWidth="1" />
                    <line x1="1" y1="80" x2="30" y2="110" stroke="#3b82f6" strokeWidth="1" />
                    <motion.circle key={quoteIndex} r="2" fill="#3b82f6" animate={{ cx: [52, 1, 1, 30], cy: [-70, -30, 80, 110], opacity: [0, 1, 1, 0] }} transition={{ duration: 5, repeat: Infinity, ease: "linear" }} />
                </svg>
                <div className="mt-20 -ml-2 pointer-events-auto cursor-pointer" onClick={handleNextQuote}>
                    <motion.div initial={{ x: -10, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.5 }} className="bg-white/20 backdrop-blur-xs p-5 border-l-2 border-blue-400 group hover:bg-white/10 transition-colors rounded-r-lg shadow-sm h-[140px] w-[320px] flex flex-col justify-between">
                        <div className="flex items-center justify-between gap-2 mb-2">
                            <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
                                <span className="text-[12px] font-mono text-slate-400 tracking-widest uppercase">Phrase Collection // 0{quoteIndex + 1}</span>
                            </div>
                            <button
                                onClick={(e) => { e.stopPropagation(); setIsModalOpen(true); }}
                                className="p-1.5 rounded-md hover:bg-white/10 text-slate-400 hover:text-blue-400 transition-all opacity-0 group-hover:opacity-100"
                                title="查看全部"
                            >
                                <Maximize2 size={14} />
                            </button>
                        </div>
                        <div className="relative flex-1 flex flex-col justify-center">
                            <AnimatePresence mode="wait">
                                <motion.div key={quoteIndex} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }} className="w-full">
                                    <p className="text-[22px] leading-snug text-slate-600 font-serif italic">
                                        {displayQuotes.length > 0 && displayQuotes[quoteIndex] ? displayQuotes[quoteIndex].text : "Loading..."}
                                    </p>
                                </motion.div>
                            </AnimatePresence>
                        </div>
                        <div className="flex gap-1 mt-4">
                            {displayQuotes.map((_: any, i: number) => (
                                <div key={i} className={`h-1 rounded-full transition-all duration-300 ${i === quoteIndex ? 'w-6 bg-blue-500' : 'w-2 bg-slate-200'}`} />
                            ))}
                        </div>
                    </motion.div>
                    <div className="h-10 ml-37 w-px bg-linear-to-b from-slate-300 to-transparent mt-0 relative z-50 -translate-y-[20px] pointer-events-none" />
                </div>
            </motion.div>

            {/* 展开态：全览模态框 */}
            {mounted && createPortal(
                <AnimatePresence>
                    {isModalOpen && (
                        <div className="fixed inset-0 z-100 flex items-center justify-center pointer-events-auto">
                            {/* 背景遮罩 */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
                                onClick={() => setIsModalOpen(false)}
                            />

                            {/* 内容容器 */}
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                                className="relative w-[90vw] max-w-5xl h-[80vh] bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-white/50"
                                onClick={(e) => e.stopPropagation()}
                            >
                                {/* 顶部栏 */}
                                <div className="flex items-center justify-between px-8 py-6 border-b border-slate-100">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-blue-50 rounded-lg text-blue-500">
                                            <QuoteIcon size={20} />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-bold text-slate-800 tracking-tight">Phrase Archive</h2>
                                            <p className="text-xs font-mono text-slate-400 uppercase tracking-widest mt-0.5">Total {quotes.length} Quotes</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setIsModalOpen(false)}
                                        className="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-all hover:rotate-90"
                                    >
                                        <X size={24} />
                                    </button>
                                </div>

                                {/* 格言列表区 */}
                                <div className="flex-1 overflow-y-auto p-8 subtle-scrollbar">
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {quotes.map((q, idx) => (
                                            <motion.div
                                                key={q.id}
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: idx * 0.03 }}
                                                className="group relative bg-slate-50/50 hover:bg-white p-6 rounded-xl border border-slate-100 hover:border-blue-100 hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300 flex flex-col justify-between min-h-[160px]"
                                            >
                                                <div className="absolute top-4 left-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                                    <QuoteIcon size={32} />
                                                </div>
                                                <p className="relative z-10 text-lg leading-relaxed text-slate-600 font-serif italic">
                                                    {q.text}
                                                </p>
                                                <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
                                                    <span className="text-[10px] font-mono text-slate-300 group-hover:text-blue-400 transition-colors uppercase tracking-widest">
                                                        #{String(idx + 1).padStart(2, '0')}
                                                    </span>
                                                    {q.recorded_at && (
                                                        <span className="text-[10px] font-mono text-slate-400 opacity-60">
                                                            {q.recorded_at.replace(/-/g, '.')}
                                                        </span>
                                                    )}
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>,
                document.body
            )}
        </div>
    );
}
