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
    Database,
    Sprout,
    BrainCircuit,
    Sparkles,
    Triangle,
    Lightbulb,
    Lock
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
        id: 'garden',
        title: '数字花园',
        path: '/library/garden',
        description: '有机生长的思想与记录',
        type: 'garden'
    },
    {
        id: 'prism',
        title: '认知棱镜',
        path: '/library/prism',
        description: '思想迸发\n光芒始生',
        type: 'prism'
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
        // If there's only 1 module, don't show a second one. If 2, show the other.
        MODULES.length > 1 ? MODULES[(activeIndex + 1) % MODULES.length] : null
    ].filter((m): m is (typeof MODULES)[number] => !!m);

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
            <div className="relative z-20 flex flex-col items-center gap-4 mb-4 shrink-0">
                <div className="flex items-center gap-2 p-1.5 bg-stone-200/50 backdrop-blur-md rounded-full border border-stone-200 shadow-inner">
                    {MODULES.map((mod, idx) => (
                        <button
                            key={mod.id}
                            onClick={() => handleTabClick(idx)}
                            className={`
                                relative px-5 py-2 rounded-full text-sm font-bold font-mono uppercase tracking-wider transition-all duration-300
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

                {/* [New] 随附管理入口 */}
                <Link
                    href="/admin/library/prompts"
                    className="group/admin flex items-center gap-2.5 opacity-30 hover:opacity-100 transition-all duration-300 pointer-events-auto -mt-2 px-3 py-1.5 rounded-lg"
                >
                    <div className="w-1.5 h-4 bg-stone-300 group-hover/admin:bg-orange-400 transition-colors" />
                    <span className="text-[13px] font-mono text-stone-500 uppercase tracking-[0.2em] font-bold">
                        Admin_Root
                    </span>
                    <Lock size={12} className="text-stone-400 group-hover/admin:text-orange-500 transition-colors" />
                </Link>
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
                                {/* === PROMPT: Notebook Style (Enhanced) === */}
                                {module.type === 'notebook' && (
                                    <div className="relative group-hover:-translate-y-2 transition-transform duration-500 ease-out h-full">
                                        {/* Paper base with subtle texture */}
                                        <div className="absolute inset-0 bg-white rounded-tr-3xl rounded-bl-3xl rounded-tl-sm rounded-br-sm shadow-[0_2px_4px_rgba(0,0,0,0.05),0_10px_20px_rgba(0,0,0,0.05)] group-hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)] transition-all duration-500 border border-stone-100" />

                                        {/* Paper fiber texture */}
                                        <div className="absolute inset-0 rounded-tr-3xl rounded-bl-3xl rounded-tl-sm rounded-br-sm opacity-[0.06] pointer-events-none"
                                            style={{
                                                backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100' height='100' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`,
                                                backgroundSize: '150px 150px'
                                            }}
                                        />

                                        {/* Bookmark / Fold corner */}
                                        <div className="absolute top-0 right-8 w-8 h-10 z-30 overflow-hidden">
                                            <div className="w-full h-full bg-orange-400/80 group-hover:bg-orange-500 transition-colors duration-300"
                                                style={{ clipPath: 'polygon(0 0, 100% 0, 100% 70%, 50% 100%, 0 70%)' }} />
                                        </div>

                                        {/* Red binding line */}
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

                                            {/* Notebook ruled lines */}
                                            <div className="pl-4 flex-1 mt-8 relative">
                                                <div className="w-full h-px bg-stone-100 mb-4" />
                                                <div className="space-y-3 opacity-60">
                                                    <motion.div className="w-3/4 h-2 bg-stone-100 rounded-full"
                                                        initial={{ scaleX: 0, originX: 0 }} animate={{ scaleX: 1 }}
                                                        transition={{ duration: 0.8, ease: "easeOut" }}
                                                    />
                                                    <motion.div className="w-full h-2 bg-stone-100 rounded-full"
                                                        initial={{ scaleX: 0, originX: 0 }} animate={{ scaleX: 1 }}
                                                        transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
                                                    />
                                                    <motion.div className="w-5/6 h-2 bg-stone-100 rounded-full"
                                                        initial={{ scaleX: 0, originX: 0 }} animate={{ scaleX: 1 }}
                                                        transition={{ duration: 0.9, ease: "easeOut", delay: 0.4 }}
                                                    />
                                                </div>
                                                <div className="mt-10">
                                                    <p className="text-sm text-stone-500 font-medium leading-relaxed">
                                                        {module.description}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="pl-4 pt-6 flex items-center gap-3 text-xs font-mono text-stone-400 group-hover:text-stone-600 transition-colors">
                                                <span className="underline decoration-stone-200 underline-offset-4 group-hover:decoration-orange-300 transition-all">
                                                    OPEN NOTEBOOK
                                                </span>
                                                <span className="translate-x-0 group-hover:translate-x-1 transition-transform duration-300">
                                                    <ArrowRight size={12} />
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* === MINDMAP: Blueprint Style === */}
                                {module.type === 'projector' && (
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

                                {/* === OPTION A: Digital Garden (Refined: Structural Frame) === */}
                                {module.type === 'garden' && (
                                    <div className="relative group-hover:-translate-y-2 transition-transform duration-500 ease-out h-full overflow-hidden">
                                        {/* Base with increased border width for structure */}
                                        <div className="absolute inset-0 bg-[#F0FAF4] rounded-2xl border-2 border-[#E0F2E9] shadow-[0_4px_12px_rgba(20,100,60,0.03)] group-hover:shadow-[0_20px_40px_rgba(20,100,60,0.08)] group-hover:border-teal-100/80 transition-all duration-500" />

                                        {/* Structure: Corner Brackets (The "Frame") */}
                                        <div className="absolute top-3 left-3 w-8 h-8 border-t-2 border-l-2 border-teal-200/40 rounded-tl-lg" />
                                        <div className="absolute top-3 right-3 w-8 h-8 border-t-2 border-r-2 border-teal-200/40 rounded-tr-lg" />
                                        <div className="absolute bottom-3 left-3 w-8 h-8 border-b-2 border-l-2 border-teal-200/40 rounded-bl-lg" />
                                        <div className="absolute bottom-3 right-3 w-8 h-8 border-b-2 border-r-2 border-teal-200/40 rounded-br-lg" />

                                        {/* Organic Background Texture */}
                                        <div className="absolute inset-0 opacity-[0.3]"
                                            style={{
                                                backgroundImage: `radial-gradient(#10B981 0.5px, transparent 0.5px)`,
                                                backgroundSize: '30px 30px'
                                            }}
                                        />

                                        {/* Data Layer: Environmental Stats */}
                                        <div className="absolute top-6 right-6 flex flex-col items-end gap-1 z-10 pointer-events-none">
                                            <div className="flex items-center gap-2">
                                                <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-[pulse_4s_ease-in-out_infinite]"></span>
                                                <span className="text-[10px] font-mono text-teal-600/70 font-bold tracking-widest">LIVE_MONITOR</span>
                                            </div>
                                            <span className="text-[9px] font-mono text-teal-600/50">CYCLE: DAY 042</span>
                                        </div>

                                        <div className="absolute bottom-6 right-6 flex flex-col items-end gap-0.5 z-10 pointer-events-none text-[9px] font-mono text-teal-600/40">
                                            <span>HUMIDITY: 65%</span>
                                            <span>LIGHT: 1200lm</span>
                                            <span>CO2: 450ppm</span>
                                        </div>

                                        {/* Growing Vines Animation */}
                                        <div className="absolute inset-0 overflow-hidden pointer-events-none">
                                            <svg className="absolute bottom-0 left-0 w-full h-full text-teal-200/50" viewBox="0 0 400 300" preserveAspectRatio="none">
                                                <motion.path
                                                    d="M0,300 Q100,250 50,200 T150,100 T250,50"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    strokeWidth="2"
                                                    className="group-hover:text-teal-400/30 transition-colors duration-700"
                                                    initial={{ pathLength: 0 }}
                                                    animate={{ pathLength: 1 }}
                                                    transition={{ duration: 2.5, ease: "easeInOut" }}
                                                />
                                                <motion.path
                                                    d="M400,300 Q300,200 350,150 T200,100"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    strokeWidth="1.5"
                                                    className="group-hover:text-teal-300/30 transition-colors duration-700 delay-100"
                                                    initial={{ pathLength: 0 }}
                                                    animate={{ pathLength: 1 }}
                                                    transition={{ duration: 3, ease: "easeInOut", delay: 0.5 }}
                                                />
                                            </svg>
                                        </div>

                                        {/* Scan Line Animation */}
                                        <motion.div
                                            className="absolute left-0 w-full h-px bg-linear-to-r from-transparent via-teal-300/20 to-transparent z-10 pointer-events-none"
                                            animate={{ top: ['0%', '100%'] }}
                                            transition={{ repeat: Infinity, duration: 6, ease: "linear" }}
                                        />

                                        <div className="relative p-10 h-[360px] flex flex-col z-20">
                                            <div className="flex justify-between items-start">
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] font-mono font-bold text-teal-600/60 uppercase tracking-widest mb-2 flex items-center gap-1">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse"></span>
                                                        Syntropic Growth
                                                    </span>
                                                    <h2 className="text-3xl font-serif font-medium text-stone-800 group-hover:text-teal-700 transition-colors">
                                                        {module.title}
                                                    </h2>
                                                </div>
                                            </div>

                                            <div className="flex-1 flex items-center justify-center relative">
                                                {/* Centerpiece: Glowing Seed in Petri Dish */}
                                                <div className="relative w-32 h-32 flex items-center justify-center">
                                                    {/* Outer Glow */}
                                                    <div className="absolute inset-0 bg-teal-400/20 blur-3xl rounded-full group-hover:bg-teal-400/30 transition-all duration-700" />

                                                    {/* Subtle Breathing Ripple */}
                                                    <motion.div
                                                        className="absolute inset-0 rounded-full border border-teal-200/30"
                                                        animate={{ scale: [1, 1.15, 1], opacity: [0, 0.4, 0] }}
                                                        transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                                                    />

                                                    {/* Glass/Petri Dish Circle */}
                                                    <div className="absolute inset-2 rounded-full bg-linear-to-b from-white/40 to-white/10 border border-white/50 backdrop-blur-sm shadow-[0_8px_32px_rgba(20,184,166,0.15)] group-hover:border-teal-200/50 transition-all duration-500 flex items-center justify-center">
                                                        {/* Inner Ring */}
                                                        <div className="absolute inset-1 rounded-full border border-teal-100/30" />
                                                    </div>

                                                    <motion.div
                                                        animate={{ y: [0, -4, 0] }}
                                                        transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                                                        className="relative z-10"
                                                    >
                                                        <Sprout size={48} className="text-teal-600/80 fill-teal-50 group-hover:text-teal-600 group-hover:fill-teal-100 transition-colors duration-500 drop-shadow-sm" strokeWidth={1.5} />
                                                    </motion.div>
                                                </div>
                                            </div>

                                            <div className="pt-4 border-t border-teal-100/50">
                                                <p className="text-sm text-stone-500/80 font-medium leading-relaxed group-hover:text-stone-600 transition-colors">
                                                    {module.description}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* === PRISM: Cognitive Prism (Asymmetrical Cinematic Style) === */}
                                {module.type === 'prism' && (
                                    <div className="relative group hover:-translate-y-2 transition-transform duration-500 ease-out h-full overflow-hidden">
                                        {/* Base dark void background */}
                                        <div className="absolute inset-0 bg-[#0c0514] rounded-2xl border border-purple-900/30 shadow-[0_4px_20px_rgba(12,5,20,0.6)] group-hover:shadow-[0_20px_40px_rgba(168,85,247,0.15)] group-hover:border-purple-600/40 transition-all duration-700" />

                                        {/* Deep space grain/noise (optional, subtle) */}
                                        <div className="absolute inset-0 rounded-2xl opacity-[0.04] pointer-events-none mix-blend-screen"
                                            style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}
                                        />

                                        {/* Ambient Corner Glows - Entrance Animated */}
                                        <motion.div
                                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 2 }}
                                            className="absolute top-0 left-0 w-64 h-64 bg-fuchsia-600/10 rounded-full blur-[80px] pointer-events-none" />
                                        <motion.div
                                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 2, delay: 0.5 }}
                                            className="absolute bottom-0 right-0 w-64 h-64 bg-cyan-600/10 rounded-full blur-[80px] pointer-events-none" />

                                        {/* Animated Spectrum Light Beam */}
                                        <svg className="absolute inset-0 w-full h-full pointer-events-none z-10" viewBox="0 0 500 360" preserveAspectRatio="none">
                                            <defs>
                                                <linearGradient id="white-beam" x1="0%" y1="0%" x2="100%" y2="100%">
                                                    <stop offset="0%" stopColor="rgba(255,255,255,0)" />
                                                    <stop offset="50%" stopColor="rgba(255,255,255,0.2)" />
                                                    <stop offset="100%" stopColor="rgba(255,255,255,0.7)" />
                                                </linearGradient>
                                                <linearGradient id="spectrum-red" x1="0%" y1="0%" x2="100%" y2="50%">
                                                    <stop offset="0%" stopColor="rgba(239,68,68,0.7)" />
                                                    <stop offset="100%" stopColor="rgba(239,68,68,0)" />
                                                </linearGradient>
                                                <linearGradient id="spectrum-yellow" x1="0%" y1="0%" x2="100%" y2="50%">
                                                    <stop offset="0%" stopColor="rgba(234,179,8,0.7)" />
                                                    <stop offset="100%" stopColor="rgba(234,179,8,0)" />
                                                </linearGradient>
                                                <linearGradient id="spectrum-green" x1="0%" y1="0%" x2="100%" y2="50%">
                                                    <stop offset="0%" stopColor="rgba(34,197,94,0.7)" />
                                                    <stop offset="100%" stopColor="rgba(34,197,94,0)" />
                                                </linearGradient>
                                                <linearGradient id="spectrum-cyan" x1="0%" y1="0%" x2="100%" y2="50%">
                                                    <stop offset="0%" stopColor="rgba(6,182,212,0.7)" />
                                                    <stop offset="100%" stopColor="rgba(6,182,212,0)" />
                                                </linearGradient>
                                                <linearGradient id="spectrum-purple" x1="0%" y1="0%" x2="100%" y2="50%">
                                                    <stop offset="0%" stopColor="rgba(168,85,247,0.7)" />
                                                    <stop offset="100%" stopColor="rgba(168,85,247,0)" />
                                                </linearGradient>

                                                <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                                                    <feGaussianBlur stdDeviation="5" result="blur" />
                                                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                                                </filter>
                                                <clipPath id="beam-clip-in">
                                                    <motion.circle cx="-20" cy="-20" initial={{ r: 0 }} animate={{ r: 350 }} transition={{ duration: 1.0, delay: 0.8, ease: "easeInOut" }} />
                                                </clipPath>
                                                <clipPath id="beam-clip-out">
                                                    <motion.circle cx="105" cy="160" initial={{ r: 0 }} animate={{ r: 600 }} transition={{ duration: 1.5, delay: 1.6, ease: "easeOut" }} />
                                                </clipPath>
                                            </defs>

                                            {/* Incoming White Light - Top Left to Center-Left */}
                                            <motion.path
                                                d="M -20,-20 L 105,150 L 105,170 L -40,40 Z"
                                                fill="url(#white-beam)"
                                                filter="url(#glow)"
                                                clipPath="url(#beam-clip-in)"
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 0.7 }}
                                                transition={{ duration: 0.5, delay: 0.8 }}
                                            />

                                            {/* Outgoing Spectrum - Center-Left to Bottom Right */}
                                            <motion.g
                                                clipPath="url(#beam-clip-out)"
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                transition={{ duration: 0.5, delay: 1.6 }}
                                            >
                                                <path d="M 105,160 L 550,230 L 550,250 Z" fill="url(#spectrum-red)" filter="url(#glow)" className="mix-blend-screen" />
                                                <path d="M 105,160 L 550,250 L 550,280 Z" fill="url(#spectrum-yellow)" filter="url(#glow)" className="mix-blend-screen" />
                                                <path d="M 105,160 L 550,280 L 550,310 Z" fill="url(#spectrum-green)" filter="url(#glow)" className="mix-blend-screen" />
                                                <path d="M 105,160 L 550,310 L 550,350 Z" fill="url(#spectrum-cyan)" filter="url(#glow)" className="mix-blend-screen" />
                                                <path d="M 105,160 L 550,350 L 550,400 Z" fill="url(#spectrum-purple)" filter="url(#glow)" className="mix-blend-screen" />
                                            </motion.g>
                                        </svg>

                                        {/* Knowledge Nodes / Pages (Illuminated automatically with the spectrum) */}
                                        <motion.div
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ duration: 1.5, delay: 2.4, ease: "easeOut" }}
                                            className="absolute right-16 bottom-16 w-64 h-48 pointer-events-none flex flex-col gap-5 justify-end items-end z-0"
                                        >
                                            <div className="w-32 h-14 border border-white/10 rounded-lg backdrop-blur-md bg-white/5 transform -skew-x-12 -rotate-6 flex flex-col justify-center px-4 shadow-[0_0_20px_rgba(255,255,255,0.05)]">
                                                <div className="w-16 h-1 bg-white/20 rounded-full mb-2" />
                                                <div className="w-10 h-1 bg-white/10 rounded-full" />
                                            </div>
                                            <div className="w-44 h-16 border border-white/15 rounded-lg backdrop-blur-md bg-white/10 transform -skew-x-12 -rotate-6 flex flex-col justify-center px-4 -mr-4 shadow-[0_0_30px_rgba(34,197,94,0.1)] relative">
                                                <div className="w-20 h-1.5 bg-green-300/40 rounded-full mb-2" />
                                                <div className="w-14 h-1 bg-green-300/20 rounded-full mb-2" />
                                                <div className="w-8 h-1 bg-green-300/20 rounded-full" />
                                            </div>
                                            <div className="w-36 h-14 border border-purple-400/20 rounded-lg backdrop-blur-md bg-purple-500/10 transform -skew-x-12 -rotate-6 flex flex-col justify-center px-4 -mr-8 shadow-[0_0_30px_rgba(168,85,247,0.2)]">
                                                <div className="w-24 h-1.5 bg-purple-300/40 rounded-full mb-2" />
                                                <div className="w-16 h-1 bg-purple-300/30 rounded-full" />
                                            </div>
                                        </motion.div>

                                        {/* Animated Particle Dust */}
                                        <div className="absolute inset-0 z-10 pointer-events-none">
                                            {/* Incoming top-left particles */}
                                            <motion.div
                                                className="absolute left-[10%] top-[10%] w-1.5 h-1.5 bg-white/80 rounded-full blur-[1px]"
                                                animate={{ x: [0, 60], y: [0, 60], opacity: [0, 0.8, 0] }}
                                                transition={{ repeat: Infinity, duration: 3, delay: 1.0, ease: "linear" }}
                                            />
                                            <motion.div
                                                className="absolute left-[20%] top-[5%] w-1 h-1 bg-purple-200/80 rounded-full blur-[1px]"
                                                animate={{ x: [0, 50], y: [0, 50], opacity: [0, 0.6, 0] }}
                                                transition={{ repeat: Infinity, duration: 2.5, delay: 1.8, ease: "linear" }}
                                            />
                                            {/* Central particles (贯穿感) */}
                                            <motion.div
                                                className="absolute left-[35%] top-[40%] w-1 h-1 bg-white/60 rounded-full blur-[1px]"
                                                animate={{ x: [0, 60], y: [0, 40], opacity: [0, 0.9, 0] }}
                                                transition={{ repeat: Infinity, duration: 2.2, delay: 1.5, ease: "linear" }}
                                            />
                                            <motion.div
                                                className="absolute left-[45%] top-[55%] w-1 h-1 bg-cyan-200/70 rounded-full blur-[1px]"
                                                animate={{ x: [0, 50], y: [0, 30], opacity: [0, 0.7, 0] }}
                                                transition={{ repeat: Infinity, duration: 2.6, delay: 1.8, ease: "linear" }}
                                            />
                                            {/* Outgoing bottom-right particles */}
                                            <motion.div
                                                className="absolute left-[60%] top-[70%] w-1 h-1 bg-green-300 rounded-full blur-[1px]"
                                                animate={{ x: [0, 50], y: [0, 20], opacity: [0, 0.8, 0] }}
                                                transition={{ repeat: Infinity, duration: 2.5, delay: 2.0, ease: "linear" }}
                                            />
                                            <motion.div
                                                className="absolute left-[50%] top-[80%] w-1 h-1 bg-purple-300 rounded-full blur-[1px]"
                                                animate={{ x: [0, 40], y: [0, 30], opacity: [0, 0.9, 0] }}
                                                transition={{ repeat: Infinity, duration: 2.8, delay: 2.3, ease: "linear" }}
                                            />
                                        </div>

                                        {/* Main Content Layout */}
                                        <div className="relative p-10 h-[360px] flex z-20">

                                            {/* Prism and Data Label (Left Middle) */}
                                            <div className="flex flex-col">
                                                {/* 3D Glass Prism Representation */}
                                                <motion.div
                                                    className="relative w-28 h-40 flex items-center justify-center mt-6 cursor-pointer group/prism"
                                                    initial={{ opacity: 0, scale: 0.8 }}
                                                    animate={{ opacity: 1, scale: 1, y: [-4, 4, -4] }}
                                                    transition={{
                                                        opacity: { duration: 1, delay: 0 },
                                                        scale: { duration: 1, delay: 0 },
                                                        y: { repeat: Infinity, duration: 5, ease: "easeInOut" }
                                                    }}
                                                >
                                                    {/* Central Prism Base (Solid blur clip) */}
                                                    <motion.div
                                                        className="absolute inset-0 backdrop-blur-md shadow-[0_0_40px_rgba(255,255,255,0.05)] transition-all duration-700 group-hover/prism:bg-white/10 group-hover/prism:shadow-[0_0_60px_rgba(168,85,247,0.2)]"
                                                        style={{ clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' }}
                                                        initial={{ backgroundColor: "rgba(255,255,255,0)" }}
                                                        animate={{ backgroundColor: "rgba(255,255,255,0.03)" }}
                                                        transition={{ duration: 0.8, delay: 1.5 }}
                                                    />

                                                    {/* Sharp glass edges and inner facets via SVG */}
                                                    <svg className="absolute inset-0 w-full h-full pointer-events-none drop-shadow-lg" viewBox="0 0 112 160">
                                                        <defs>
                                                            <linearGradient id="prism-light-line" x1="0" y1="0" x2="0" y2="1">
                                                                <stop offset="0%" stopColor="rgba(255,255,255,0)" />
                                                                <stop offset="50%" stopColor="rgba(255,255,255,0.6)" />
                                                                <stop offset="100%" stopColor="rgba(255,255,255,0)" />
                                                            </linearGradient>
                                                        </defs>
                                                        {/* Outer rhombus stroke */}
                                                        <polygon points="56,2 110,80 56,158 2,80" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" />
                                                        {/* Inner reflection diamond */}
                                                        <polygon points="56,14 96,80 56,146 16,80" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
                                                        {/* Vertical center axis */}
                                                        <line x1="56" y1="14" x2="56" y2="146" stroke="url(#prism-light-line)" strokeWidth="1.5" />
                                                        {/* Horizontal axis (fainter) */}
                                                        <line x1="16" y1="80" x2="96" y2="80" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
                                                    </svg>

                                                    {/* Floating Triangle Core */}
                                                    <motion.div
                                                        initial={{ filter: "drop-shadow(0 0 0px rgba(255,255,255,0))", color: "rgba(255,255,255,0.2)" }}
                                                        animate={{ filter: "drop-shadow(0 0 15px rgba(255,255,255,0.6))", color: "rgba(255,255,255,0.8)" }}
                                                        transition={{ duration: 0.8, delay: 1.5 }}
                                                        className="z-10 text-white"
                                                    >
                                                        <Triangle size={24} strokeWidth={1.5} className="group-hover/prism:text-white transition-colors duration-500 scale-y-125" style={{ color: "currentColor" }} />
                                                    </motion.div>
                                                </motion.div>
                                            </div>

                                            {/* Floating Description at Bottom Left */}
                                            <motion.div
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ duration: 1.5, delay: 2.6 }}
                                                className="absolute bottom-13 left-14 text-[18px] leading-[1.8] font-serif text-white/50 tracking-[0.4em] pointer-events-none whitespace-pre-line"
                                            >
                                                {module.description}
                                            </motion.div>

                                            {/* Large Asymmetrical Title on the Far Right */}
                                            <motion.div
                                                initial={{ opacity: 0, x: 20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ duration: 1, delay: 1 }}
                                                className="absolute right-6 top-10 flex h-[280px] pointer-events-none"
                                            >
                                                <h2
                                                    className="text-4xl font-serif text-white tracking-[0.3em] font-light z-30 opacity-90"
                                                    style={{ writingMode: 'vertical-rl' }}
                                                >
                                                    {module.title}
                                                </h2>
                                                <div className="w-px h-full bg-linear-to-b from-purple-500/50 to-transparent ml-4" />
                                            </motion.div>
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            </main >

            <div className="relative bottom-6 left-0 w-full text-center shrink-0">
                <span className="text-[10px] font-mono text-stone-300 uppercase tracking-[0.3em]">
                    Aokesem • SYSTEM_CORE V.03
                </span>
            </div>
        </div>
    );
}
