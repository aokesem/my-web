"use client";

import React from 'react';
import { ArrowLeft, BookText, Construction } from 'lucide-react';
import Link from 'next/link';

export default function CoursesPage() {
    return (
        <div className="min-h-screen bg-[#faf9f7] text-slate-800 flex flex-col items-center justify-center">
            <header className="absolute top-0 left-0 w-full px-10 pt-8 z-20">
                <Link
                    href="/library/prism"
                    className="group inline-flex items-center gap-2.5 px-4 py-2 rounded-xl bg-white/70 border border-stone-200/60 hover:bg-white hover:shadow-sm hover:border-stone-300 transition-all duration-300 backdrop-blur-sm"
                >
                    <ArrowLeft size={16} className="text-stone-400 group-hover:text-stone-600 group-hover:-translate-x-0.5 transition-all" />
                    <span className="text-[11px] font-mono font-bold text-stone-500 group-hover:text-stone-700 uppercase tracking-widest transition-colors">
                        Prism
                    </span>
                </Link>
            </header>

            <div className="flex flex-col items-center gap-4 text-center">
                <div className="w-16 h-16 rounded-2xl bg-violet-50 border border-violet-200/60 flex items-center justify-center">
                    <BookText size={28} className="text-violet-400" strokeWidth={1.5} />
                </div>
                <h1 className="text-2xl font-serif font-bold text-stone-800">
                    课程笔记
                </h1>
                <div className="flex items-center gap-2 text-stone-400">
                    <Construction size={16} />
                    <span className="text-sm font-mono">模块建设中...</span>
                </div>
                <p className="text-sm text-stone-400 max-w-md mt-2">
                    课程笔记功能正在开发中，敬请期待。
                </p>
            </div>
        </div>
    );
}
