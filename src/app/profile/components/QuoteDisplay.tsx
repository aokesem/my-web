"use client";

import React, { useState, useEffect } from 'react';
import useSWR from 'swr';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabaseClient';

interface QuoteItem {
    id: number;
    text: string;
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
        // [修改] 每次只抽取前10个格言
        return shuffled.slice(0, 10) as QuoteItem[];
    }
    return [{ id: 0, text: "No quotes found." }] as QuoteItem[];
};

export default function QuoteDisplay() {
    const { data: quotes = [{ id: 0, text: "Loading data..." }] } = useSWR('profile_quotes', fetchQuotes, {
        revalidateOnFocus: false,
    });
    const [quoteIndex, setQuoteIndex] = useState(0);

    const handleNextQuote = () => {
        if (quotes.length === 0) return;
        setQuoteIndex((prev) => (prev + 1) % quotes.length);
    };

    useEffect(() => {
        if (quotes.length <= 1) return;
        const timer = setTimeout(() => {
            setQuoteIndex((prev) => (prev + 1) % quotes.length);
        }, 5000);
        return () => clearTimeout(timer);
    }, [quoteIndex, quotes.length]);

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
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
                            <span className="text-[12px] font-mono text-slate-400 tracking-widest uppercase">Phrase Collection // 0{quoteIndex + 1}</span>
                        </div>
                        <div className="relative flex-1 flex flex-col justify-center">
                            <AnimatePresence mode="wait">
                                <motion.div key={quoteIndex} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }} className="w-full">
                                    <p className="text-[22px] leading-snug text-slate-600 font-serif italic">
                                        {quotes.length > 0 && quotes[quoteIndex] ? quotes[quoteIndex].text : "Loading..."}
                                    </p>
                                </motion.div>
                            </AnimatePresence>
                        </div>
                        <div className="flex gap-1 mt-4">
                            {quotes.map((_, i) => (
                                <div key={i} className={`h-1 rounded-full transition-all duration-300 ${i === quoteIndex ? 'w-6 bg-blue-500' : 'w-2 bg-slate-200'}`} />
                            ))}
                        </div>
                    </motion.div>
                    <div className="h-10 ml-37 w-px bg-linear-to-b from-slate-300 to-transparent mt-0 relative z-50 -translate-y-[20px] pointer-events-none" />
                </div>
            </motion.div>
        </div>
    );
}
