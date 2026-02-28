"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowLeft,
    ChevronLeft,
    ChevronRight,
    Lock
} from 'lucide-react';
import {
    IoLibrary
} from "react-icons/io5";

import Link from 'next/link';
import { useRouter } from 'next/navigation';

// Import new components
import NotebookCard from './components/NotebookCard';
import ProjectorCard from './components/ProjectorCard';
import GardenCard from './components/GardenCard';
import PrismCard from './components/PrismCard';
import BentoCard from './components/BentoCard';
import PressCard from './components/PressCard';

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
    },
    {
        id: 'diet',
        title: '饮食手记',
        path: '/library/diet',
        description: '关于食物的收集、制作与品鉴',
        type: 'bento'
    },
    {
        id: 'info-source',
        title: '信息溯源',
        path: '/library/info-source',
        description: '系统的私人信息获取阵地',
        type: 'press'
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
                                className="relative group cursor-pointer perspective-1000 h-full"
                                onClick={() => router.push(module.path)}
                            >
                                {module.type === 'notebook' && <NotebookCard module={module} />}
                                {module.type === 'projector' && <ProjectorCard module={module} />}
                                {module.type === 'garden' && <GardenCard module={module} />}
                                {module.type === 'prism' && <PrismCard module={module} />}
                                {module.type === 'bento' && <BentoCard module={module} />}
                                {module.type === 'press' && <PressCard module={module} />}
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            </main>

            <div className="relative bottom-6 left-0 w-full text-center shrink-0">
                <span className="text-[10px] font-mono text-stone-300 uppercase tracking-[0.3em]">
                    Aokesem • SYSTEM_CORE V.03
                </span>
            </div>
        </div>
    );
}
