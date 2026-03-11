"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, BookText, FileText, ArrowUpRight, Triangle } from 'lucide-react';
import Link from 'next/link';

// ============================================================
// SECTIONS DATA
// ============================================================

const SECTIONS = [
    {
        id: 'courses',
        title: '课程笔记',
        subtitle: 'COURSES',
        description: '对有益课程性知识的系统整理，以课为单位记录内容与重点。',
        count: '6 Courses',
        href: '/library/prism/courses',
        icon: BookText,
        accentColor: 'violet',
    },
    {
        id: 'papers',
        title: '论文库',
        subtitle: 'PAPERS',
        description: '论文的多维分类与深度笔记，支持按项目、方向和性质三种视角审视。',
        count: '12 Papers',
        href: '/library/prism/papers',
        icon: FileText,
        accentColor: 'cyan',
    },
];

const ACCENT_STYLES: Record<string, {
    border: string;
    hoverBorder: string;
    iconBg: string;
    iconColor: string;
    tagBg: string;
    tagText: string;
    countColor: string;
    gradientFrom: string;
}> = {
    violet: {
        border: 'border-violet-200/60',
        hoverBorder: 'hover:border-violet-300',
        iconBg: 'bg-violet-50',
        iconColor: 'text-violet-500',
        tagBg: 'bg-violet-50',
        tagText: 'text-violet-600',
        countColor: 'text-violet-400',
        gradientFrom: 'from-violet-500/5',
    },
    cyan: {
        border: 'border-cyan-200/60',
        hoverBorder: 'hover:border-cyan-300',
        iconBg: 'bg-cyan-50',
        iconColor: 'text-cyan-500',
        tagBg: 'bg-cyan-50',
        tagText: 'text-cyan-600',
        countColor: 'text-cyan-400',
        gradientFrom: 'from-cyan-500/5',
    },
};

// ============================================================
// COMPONENT
// ============================================================

export default function PrismPage() {
    return (
        <div className="min-h-screen bg-[#faf9f7] text-slate-800 selection:bg-purple-200/40 flex flex-col">

            {/* ===== HEADER ===== */}
            <header className="w-full px-10 pt-8 pb-6 flex justify-between items-start z-20">
                <Link
                    href="/library"
                    className="group flex items-center gap-2.5 px-4 py-2 rounded-xl bg-white/70 border border-stone-200/60 hover:bg-white hover:shadow-sm hover:border-stone-300 transition-all duration-300 backdrop-blur-sm"
                >
                    <ArrowLeft size={16} className="text-stone-400 group-hover:text-stone-600 group-hover:-translate-x-0.5 transition-all" />
                    <span className="text-[11px] font-mono font-bold text-stone-500 group-hover:text-stone-700 uppercase tracking-widest transition-colors">
                        Library
                    </span>
                </Link>

                <div className="flex flex-col items-end">
                    <div className="flex items-center gap-3">
                        <Triangle size={20} className="text-purple-400" strokeWidth={1.5} />
                        <h1 className="text-3xl font-serif font-bold tracking-tight text-stone-800">
                            认知<span className="text-purple-500">棱镜</span>
                        </h1>
                    </div>
                    <span className="text-[10px] font-mono text-stone-400 uppercase tracking-[0.2em] mt-1.5">
                        Cognitive Prism
                    </span>
                </div>
            </header>

            {/* ===== MAIN CONTENT ===== */}
            <main className="flex-1 w-full max-w-7xl mx-auto px-10 pb-12 flex items-stretch gap-8">

                {/* Cards Area - 2/3 width, left-aligned */}
                <div className="flex gap-8 w-2/3">
                    {SECTIONS.map((section, i) => {
                        const Icon = section.icon;
                        const styles = ACCENT_STYLES[section.accentColor];

                        return (
                            <Link
                                key={section.id}
                                href={section.href}
                                className="flex-1 group"
                            >
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.6, delay: i * 0.15, ease: "easeOut" }}
                                    className={`
                                        relative h-full min-h-[65vh] rounded-2xl overflow-hidden
                                        bg-white border ${styles.border} ${styles.hoverBorder}
                                        shadow-[0_2px_12px_rgba(0,0,0,0.03)]
                                        hover:shadow-[0_12px_40px_rgba(0,0,0,0.08)]
                                        transition-all duration-500
                                        flex flex-col p-8
                                        group-hover:-translate-y-1
                                    `}
                                >
                                    {/* Subtle gradient background */}
                                    <div className={`absolute inset-0 bg-linear-to-b ${styles.gradientFrom} to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none`} />

                                    {/* Top section */}
                                    <div className="relative z-10">
                                        {/* Module tag */}
                                        <div className="flex items-center justify-between mb-6">
                                            <span className={`text-[10px] font-mono font-bold uppercase tracking-[0.2em] ${styles.tagText} ${styles.tagBg} px-2.5 py-1 rounded-md border border-current/10`}>
                                                {section.subtitle}
                                            </span>
                                            <span className={`text-[11px] font-mono ${styles.countColor}`}>
                                                {section.count}
                                            </span>
                                        </div>

                                        {/* Icon */}
                                        <div className={`w-12 h-12 rounded-xl ${styles.iconBg} border border-current/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500`}>
                                            <Icon size={22} className={styles.iconColor} strokeWidth={1.5} />
                                        </div>

                                        {/* Title */}
                                        <h2 className="text-2xl font-serif font-bold text-stone-800 group-hover:text-stone-900 transition-colors mb-3">
                                            {section.title}
                                        </h2>

                                        {/* Description */}
                                        <p className="text-sm text-stone-500 leading-relaxed group-hover:text-stone-600 transition-colors">
                                            {section.description}
                                        </p>
                                    </div>

                                    {/* Spacer */}
                                    <div className="flex-1" />

                                    {/* Bottom entry indicator */}
                                    <div className="relative z-10 flex items-center justify-between pt-6 border-t border-stone-100 group-hover:border-stone-200 transition-colors">
                                        <span className="text-[11px] font-mono text-stone-400 uppercase tracking-widest group-hover:text-stone-600 transition-colors">
                                            Enter Module
                                        </span>
                                        <div className="w-8 h-8 rounded-lg bg-stone-50 border border-stone-200 flex items-center justify-center group-hover:bg-stone-800 group-hover:border-stone-800 transition-all duration-300">
                                            <ArrowUpRight size={14} className="text-stone-400 group-hover:text-white transition-colors" />
                                        </div>
                                    </div>
                                </motion.div>
                            </Link>
                        );
                    })}
                </div>

                {/* Right whitespace area - 1/3 width with subtle decoration */}
                <div className="w-1/3 flex flex-col items-center justify-center pointer-events-none select-none">
                    {/* Minimal prism-themed decoration */}
                    <svg viewBox="0 0 120 200" className="w-20 opacity-[0.06]">
                        {/* Prism shape */}
                        <polygon
                            points="60,10 110,100 60,190 10,100"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            className="text-purple-900"
                        />
                        <line x1="60" y1="10" x2="60" y2="190" stroke="currentColor" strokeWidth="0.5" className="text-purple-900" />
                        <line x1="10" y1="100" x2="110" y2="100" stroke="currentColor" strokeWidth="0.5" className="text-purple-900" />
                    </svg>
                    <span className="text-[9px] font-mono text-stone-300 uppercase tracking-[0.3em] mt-4">
                        Prism_v0.1
                    </span>
                </div>
            </main>

            {/* ===== FOOTER ===== */}
            <footer className="w-full px-10 py-4 flex justify-between items-center">
                <span className="text-[9px] font-mono text-stone-300 uppercase tracking-[0.3em]">
                    Aokesem • Knowledge System
                </span>
                <span className="text-[9px] font-mono text-stone-300 uppercase tracking-[0.3em]">
                    Cognitive Prism Module
                </span>
            </footer>
        </div>
    );
}
