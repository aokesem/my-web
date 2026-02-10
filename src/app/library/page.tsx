"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowLeft,
    ArrowRight,
    ChevronLeft,
    ChevronRight,
    PenTool,
    BookOpen,
    Database
} from 'lucide-react';
import {
    IoLibrary
} from "react-icons/io5";

import Link from 'next/link';
import { useRouter } from 'next/navigation';

const MODULES = [
    {
        id: 'prompt',
        title: '提示词仓库',
        path: '/library/prompt',
        description: '对于实用提示词的存储和分类',
        type: 'notebook'
    },
    {
        id: 'mindmap',
        title: '思维导图',
        path: '/library/mindmap',
        description: '个人思维导图整理',
        type: 'projector'
    },
    {
        id: 'archive',
        title: 'Data Archive',
        path: '/library/archive',
        description: 'Long-term storage for project assets and knowledge.',
        type: 'box'
    }
];

export default function LibraryPage() {
    const router = useRouter();
    const [activeIndex, setActiveIndex] = useState(0);

    const handleNext = () => {
        setActiveIndex((prev) => (prev + 1) % MODULES.length);
    };

    const handlePrev = () => {
        setActiveIndex((prev) => (prev - 1 + MODULES.length) % MODULES.length);
    };

    const handleTabClick = (index: number) => {
        setActiveIndex(index);
    };

    const visibleModules = [
        MODULES[activeIndex],
        MODULES[(activeIndex + 1) % MODULES.length]
    ];

    return (
        <div className="relative w-full h-screen overflow-hidden bg-[#fdfbf7] text-slate-800 selection:bg-orange-200/50 flex flex-col">
            {/* --- White Canvas Background --- */}
            <div className="absolute inset-0 z-0 opacity-40 pointer-events-none mix-blend-multiply"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.5'/%3E%3C/svg%3E")`,
                }}
            />
            <div className="absolute inset-0 z-0 opacity-[0.08] pointer-events-none"
                style={{
                    backgroundImage: `radial-gradient(#4a4a4a 1px, transparent 1px)`,
                    backgroundSize: '24px 24px'
                }}
            />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,transparent_0%,rgba(240,230,220,0.8)_100%)] z-0 pointer-events-none" />

            {/* --- Header --- */}
            <header className="relative w-full p-8 flex justify-between items-start z-20 shrink-0">
                <Link
                    href="/profile"
                    className="group flex items-center gap-3 px-5 py-2.5 rounded-xl bg-white/60 border border-stone-200/50 hover:bg-white hover:shadow-sm hover:border-stone-300 transition-all duration-300 backdrop-blur-sm"
                >
                    <ArrowLeft size={18} className="text-stone-400 group-hover:text-stone-600 transition-colors" />
                    <span className="text-xs font-mono font-bold text-stone-500 group-hover:text-stone-700 uppercase tracking-widest transition-colors">
                        Back to Room
                    </span>
                </Link>

                <div className="flex flex-col items-end">
                    <h1 className="text-4xl font-serif font-bold tracking-tight text-stone-800 flex items-center gap-3">
                        <span className="w-8 h-8 flex items-center justify-center rounded-lg bg-orange-500 text-white shadow-sm">
                            <IoLibrary size={18} />
                        </span>
                        <span className="text-stone-500">Private</span> <span className="text-orange-600">Library</span>
                    </h1>
                    <div className="flex items-center gap-2 mt-2">
                        <span className="text-[10px] font-mono text-stone-400 uppercase tracking-widest">
                            Creative Workbench // Scheme B
                        </span>
                    </div>
                </div>
            </header>

            {/* --- Navigation Tabs (Center Top) --- */}
            <div className="relative z-20 flex justify-center mb-4 shrink-0">
                <div className="flex items-center gap-2 p-1.5 bg-stone-200/50 backdrop-blur-md rounded-full border border-stone-200 shadow-inner">
                    {MODULES.map((mod, idx) => (
                        <button
                            key={mod.id}
                            onClick={() => handleTabClick(idx)}
                            className={`
                                relative px-4 py-1.5 rounded-full text-xs font-bold font-mono uppercase tracking-wider transition-all duration-300
                                ${idx === activeIndex
                                    ? 'bg-white text-stone-800 shadow-sm'
                                    : 'text-stone-500 hover:text-stone-700 hover:bg-stone-200/50'}
                            `}
                        >
                            {mod.title}
                            {idx === activeIndex && (
                                <motion.div layoutId="activeTab" className="absolute inset-0 border border-stone-200 rounded-full" transition={{ type: "spring", bounce: 0.2, duration: 0.6 }} />
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* --- Main Content: Carousel --- */}
            <main className="relative z-10 flex-1 w-full flex items-center justify-center px-10 pb-20 -translate-y-8">
                <button
                    onClick={handlePrev}
                    className="absolute left-16 z-30 p-5 rounded-full bg-white/60 border border-stone-200 text-stone-400 hover:bg-white hover:text-orange-500 hover:border-orange-200 hover:shadow-md transition-all backdrop-blur-md group"
                >
                    <ChevronLeft size={28} className="group-hover:-translate-x-0.5 transition-transform" />
                </button>

                <button
                    onClick={handleNext}
                    className="absolute right-16 z-30 p-5 rounded-full bg-white/60 border border-stone-200 text-stone-400 hover:bg-white hover:text-orange-500 hover:border-orange-200 hover:shadow-md transition-all backdrop-blur-md group"
                >
                    <ChevronRight size={28} className="group-hover:translate-x-0.5 transition-transform" />
                </button>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-16 max-w-6xl w-full">
                    <AnimatePresence mode='popLayout' initial={false}>
                        {visibleModules.map((module, i) => (
                            <motion.div
                                key={module.id}
                                layout
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{
                                    opacity: { duration: 0.2 },
                                    x: { duration: 0.3, ease: "easeOut" },
                                    layout: { duration: 0.4, ease: "easeInOut" }
                                }}
                                className="relative group cursor-pointer perspective-1000"
                                onClick={() => router.push(module.path)}
                            >
                                {module.type === 'notebook' && (
                                    <div className="relative group-hover:-translate-y-2 transition-transform duration-500 ease-out h-full">
                                        <div className="absolute inset-0 bg-white rounded-tr-3xl rounded-bl-3xl rounded-tl-sm rounded-br-sm shadow-[0_2px_4px_rgba(0,0,0,0.05),0_10px_20px_rgba(0,0,0,0.05)] group-hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)] transition-all duration-500 border border-stone-100" />
                                        <div className="absolute top-0 bottom-0 left-6 w-[2px] bg-red-100/50 z-10" />

                                        <div className="relative p-10 h-[360px] flex flex-col justify-between overflow-hidden z-20">
                                            <div className="flex justify-between items-start pl-4">
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <PenTool size={16} className="text-orange-500" />
                                                        <span className="text-xs font-bold text-stone-400 uppercase tracking-wider">Note_01</span>
                                                    </div>
                                                    <h2 className="text-3xl font-serif font-medium text-stone-800 group-hover:text-orange-600 transition-colors">
                                                        {module.title}
                                                    </h2>
                                                </div>
                                                <div className="w-10 h-10 rounded-full bg-stone-50 flex items-center justify-center text-stone-300 group-hover:bg-orange-50 group-hover:text-orange-500 transition-colors">
                                                    <BookOpen size={20} />
                                                </div>
                                            </div>

                                            <div className="space-y-4 pl-4 flex-1 mt-8">
                                                <div className="w-full h-px bg-stone-100" />
                                                <div className="space-y-3 opacity-60">
                                                    <div className="w-3/4 h-2 bg-stone-100 rounded-full" />
                                                    <div className="w-full h-2 bg-stone-100 rounded-full" />
                                                    <div className="w-5/6 h-2 bg-stone-100 rounded-full" />
                                                </div>
                                                <div className="pt-6">
                                                    <p className="text-sm text-stone-500 font-medium leading-relaxed">
                                                        {module.description}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="pl-4 pt-6 flex items-center gap-3 text-xs font-mono text-stone-400 group-hover:text-stone-600 transition-colors">
                                                <span className="underline decoration-stone-200 underline-offset-4 group-hover:decoration-orange-300 transition-all">
                                                    OPEN NOTEBOOK
                                                </span>
                                                <ArrowRight size={12} />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {(module.type === 'projector' || module.type === 'box') && (
                                    <div className="relative group-hover:-translate-y-2 transition-transform duration-500 ease-out h-full">
                                        <div className="absolute inset-0 bg-stone-50/50 rounded-2xl border border-stone-200 shadow-[0_4px_12px_rgba(0,0,0,0.03)] group-hover:shadow-[0_20px_40px_rgba(0,0,0,0.06)] transition-all duration-500" />

                                        <div className="absolute inset-4 bg-white rounded-xl shadow-[inset_0_2px_8px_rgba(0,0,0,0.04)] overflow-hidden border border-stone-100/80">
                                            {/* Blueprint Grid Lines */}
                                            <div className="absolute inset-0 opacity-[0.05]"
                                                style={{
                                                    backgroundImage: `linear-gradient(#000 0.5px, transparent 0.5px), linear-gradient(90deg, #000 0.5px, transparent 0.5px)`,
                                                    backgroundSize: '40px 40px'
                                                }}
                                            />

                                            {/* Stylized L-Corners */}
                                            <div className="absolute top-4 left-4 w-4 h-4 border-t border-l border-stone-300" />
                                            <div className="absolute top-4 right-4 w-4 h-4 border-t border-r border-stone-300" />
                                            <div className="absolute bottom-4 left-4 w-4 h-4 border-b border-l border-stone-300" />
                                            <div className="absolute bottom-4 right-4 w-4 h-4 border-b border-r border-stone-300" />

                                            {/* Hand-drawn Scale Markers */}
                                            <div className="absolute top-0 left-1/2 -translate-x-1/2 flex gap-10">
                                                {[0, 1, 2].map(n => <div key={n} className="w-px h-1.5 bg-stone-200" />)}
                                            </div>

                                            {/* Technical Notation */}
                                            <div className="absolute top-6 left-10 flex flex-col gap-0.5 pointer-events-none">
                                                <span className="text-[7px] font-mono text-stone-300 leading-none">POS_X: 420.00</span>
                                                <span className="text-[7px] font-mono text-stone-300 leading-none">POS_Y: 185.24</span>
                                            </div>

                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <div className="relative w-32 h-32 flex items-center justify-center">
                                                    <div className="absolute inset-0 blur-2xl bg-orange-500/5 group-hover:bg-orange-500/10 transition-colors duration-700" />
                                                    <svg viewBox="0 0 100 100" className="w-32 h-32 relative z-10 overflow-visible">
                                                        {/* Connections */}
                                                        <motion.g
                                                            initial={{ opacity: 0 }}
                                                            animate={{ opacity: 1 }}
                                                            transition={{ delay: 0.2, duration: 0.5 }}
                                                            className="text-stone-300 group-hover:text-orange-300 transition-colors duration-500"
                                                            stroke="currentColor"
                                                            strokeWidth="2"
                                                            fill="none"
                                                        >
                                                            <path d="M50 42 L50 28" />
                                                            <path d="M30 52 L25 52" />
                                                            <path d="M70 52 L75 52" />
                                                        </motion.g>

                                                        {/* Center Node */}
                                                        <motion.rect
                                                            initial={{ scale: 0 }}
                                                            animate={{ scale: 1 }}
                                                            transition={{ type: "spring", stiffness: 200, damping: 20 }}
                                                            x="30" y="42" width="40" height="20" rx="4"
                                                            className="fill-white stroke-stone-400 group-hover:stroke-orange-500 transition-colors duration-500"
                                                            strokeWidth="2"
                                                        />

                                                        {/* Top Node */}
                                                        <motion.rect
                                                            initial={{ scale: 0, opacity: 0 }}
                                                            animate={{ scale: 1, opacity: 1 }}
                                                            transition={{ delay: 0.1, type: "spring" }}
                                                            x="37.5" y="12" width="25" height="16" rx="3"
                                                            className="fill-stone-50 stroke-stone-300 group-hover:stroke-orange-300 transition-colors duration-500"
                                                            strokeWidth="1.5"
                                                        />

                                                        {/* Left Node */}
                                                        <motion.rect
                                                            initial={{ scale: 0, opacity: 0 }}
                                                            animate={{ scale: 1, opacity: 1 }}
                                                            transition={{ delay: 0.2, type: "spring" }}
                                                            x="0" y="44" width="25" height="16" rx="3"
                                                            className="fill-stone-50 stroke-stone-300 group-hover:stroke-orange-300 transition-colors duration-500"
                                                            strokeWidth="1.5"
                                                        />

                                                        {/* Right Node */}
                                                        <motion.rect
                                                            initial={{ scale: 0, opacity: 0 }}
                                                            animate={{ scale: 1, opacity: 1 }}
                                                            transition={{ delay: 0.3, type: "spring" }}
                                                            x="75" y="44" width="25" height="16" rx="3"
                                                            className="fill-stone-50 stroke-stone-300 group-hover:stroke-orange-300 transition-colors duration-500"
                                                            strokeWidth="1.5"
                                                        />
                                                    </svg>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="absolute top-0 left-0 right-0 h-12 flex items-center justify-between px-8 z-20">
                                            <div className="flex gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-orange-400/20" />
                                                <div className="w-1.5 h-1.5 rounded-full bg-stone-300/30" />
                                            </div>
                                            <span className="text-[10px] font-mono font-bold text-stone-400 uppercase tracking-widest opacity-60">{module.id}_sys_v1</span>
                                        </div>

                                        <div className="absolute bottom-8 left-0 w-full text-center z-20 px-10">
                                            <h2 className="text-2xl font-serif font-medium text-stone-800 group-hover:text-orange-600 transition-colors">
                                                {module.title}
                                            </h2>
                                            <div className="mt-2 text-xs text-stone-400 font-mono tracking-tight leading-relaxed max-w-[80%] mx-auto opacity-80">
                                                {module.description}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            </main>

            <div className="relative bottom-6 left-0 w-full text-center shrink-0">
                <span className="text-[10px] font-mono text-stone-300 uppercase tracking-[0.3em]">
                    Design Scheme B // White Canvas
                </span>
            </div>
        </div>
    );
}
