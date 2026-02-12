"use client";

import React from 'react';
import { motion } from 'framer-motion';
import {
    ArrowLeft,
    BookOpen,
    Code,
    Palette,
    Sprout,
    Leaf,
    ArrowRight
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const BOARDS = [
    {
        id: 'learning',
        title: '学习笔记',
        enTitle: 'Learning Notes',
        description: '个人AI学习过程中的记录与思考',
        icon: BookOpen,
        color: 'text-teal-500',
        bg: 'bg-teal-50/50',
        specimens: 3,
    },
    {
        id: 'programming',
        title: 'AI与编程',
        enTitle: 'AI & Programming',
        description: 'AI如何改变编程实践的观察与实验',
        icon: Code,
        color: 'text-emerald-500',
        bg: 'bg-emerald-50/50',
        specimens: 2,
    },
    {
        id: 'creative',
        title: 'AI与创作',
        enTitle: 'AI & Creativity',
        description: 'AI在艺术、音乐、写作等领域的探索',
        icon: Palette,
        color: 'text-cyan-500',
        bg: 'bg-cyan-50/50',
        specimens: 1,
    },
];

export default function GardenHubPage() {
    const router = useRouter();

    return (
        <div className="relative min-h-screen bg-[#f8fbf9] text-slate-800 font-sans selection:bg-teal-100 overflow-x-hidden">
            {/* --- Background Layers --- */}
            <div className="fixed inset-0 z-0 opacity-30 pointer-events-none mix-blend-multiply"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.5'/%3E%3C/svg%3E")`,
                }}
            />
            <div className="fixed inset-0 z-0 opacity-[0.06] pointer-events-none"
                style={{
                    backgroundImage: `radial-gradient(#2dd4bf 0.5px, transparent 0.5px)`,
                    backgroundSize: '28px 28px'
                }}
            />
            <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_50%,transparent_0%,rgba(230,245,240,0.5)_100%)] z-0 pointer-events-none" />

            {/* --- Header --- */}
            <header className="relative z-20 max-w-7xl mx-auto px-8 py-12 flex justify-between items-end">
                <div className="space-y-4">
                    <Link
                        href="/library"
                        className="group inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/60 border border-teal-100/50 hover:bg-white hover:shadow-sm transition-all"
                    >
                        <ArrowLeft size={14} className="text-stone-400 group-hover:text-teal-600" />
                        <span className="text-[10px] font-mono font-bold text-stone-500 uppercase tracking-widest">Back to Library</span>
                    </Link>
                    <div className="space-y-1">
                        <h1 className="text-5xl font-serif font-bold tracking-tight text-stone-800">
                            Digital <span className="text-teal-600">Garden</span>
                        </h1>
                        <p className="text-sm font-mono text-stone-400 uppercase tracking-[0.2em]">
                            Syntropic_Growth // Observation_Log_v1.0
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3 text-stone-300">
                    <Sprout size={18} className="text-teal-400" />
                    <span className="text-[10px] font-mono font-bold text-stone-400 uppercase tracking-widest">
                        {BOARDS.length} Active Specimens
                    </span>
                </div>
            </header>

            {/* --- Board Grid --- */}
            <main className="relative z-10 max-w-7xl mx-auto px-8 pb-32">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {BOARDS.map((board, idx) => (
                        <motion.div
                            key={board.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.08 }}
                            whileHover={{ y: -4 }}
                            onClick={() => router.push(`/library/garden/${board.id}`)}
                            className="group relative bg-white/60 backdrop-blur-md border border-stone-200/60 rounded-2xl overflow-hidden cursor-pointer hover:bg-white hover:shadow-xl hover:shadow-teal-900/5 hover:border-teal-200/50 transition-all duration-300"
                        >
                            {/* Top accent line */}
                            <div className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-teal-300/40 to-transparent" />

                            {/* Specimen index marker */}
                            <div className="absolute top-0 right-0 px-3 py-1 bg-teal-50/80 rounded-bl-xl border-l border-b border-teal-100/40">
                                <span className="text-[9px] font-mono text-teal-400 font-bold uppercase tracking-tighter">SPE_0{idx + 1}</span>
                            </div>

                            <div className="p-8 h-full flex flex-col">
                                <div className="flex items-start justify-between mb-8">
                                    <div className={`p-4 rounded-2xl ${board.bg} ${board.color} group-hover:scale-110 transition-transform duration-500`}>
                                        <board.icon size={28} strokeWidth={1.5} />
                                    </div>
                                    <div className="text-right">
                                        <div className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] mb-1 text-teal-500">
                                            <span className="inline-block w-1.5 h-1.5 rounded-full bg-teal-400 mr-1 animate-pulse" />
                                            Growing
                                        </div>
                                        <span className="text-[8px] font-mono text-stone-300 uppercase">{board.specimens} entries</span>
                                    </div>
                                </div>

                                <div className="space-y-4 flex-1">
                                    <div>
                                        <h2 className="text-2xl font-serif font-bold text-stone-800 group-hover:text-teal-600 transition-colors">
                                            {board.title}
                                        </h2>
                                        <p className="text-[10px] font-mono text-stone-400 uppercase tracking-widest mt-1">
                                            {board.enTitle}
                                        </p>
                                    </div>

                                    <div className="h-px w-full bg-stone-100" />

                                    <p className="text-sm text-stone-500 leading-relaxed font-medium">
                                        {board.description}
                                    </p>
                                </div>

                                <div className="mt-8 flex items-center justify-between">
                                    <div className="flex gap-1.5">
                                        {[1, 2, 3].map(i => (
                                            <Leaf key={i} size={10} className="text-teal-200 group-hover:text-teal-400 transition-colors" style={{ transitionDelay: `${i * 50}ms` }} />
                                        ))}
                                    </div>
                                    <div className="flex items-center gap-2 text-xs font-mono font-bold text-stone-300 group-hover:text-teal-500 transition-colors">
                                        OBSERVE
                                        <span className="w-5 h-5 rounded-full border border-stone-200 flex items-center justify-center group-hover:border-teal-500 group-hover:translate-x-1 transition-all">
                                            <ArrowRight size={10} />
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </main>

            {/* --- Bottom Tech Label --- */}
            <div className="fixed right-6 bottom-6 z-20 flex flex-col items-end gap-2 text-[10px] font-mono text-teal-300/60 select-none">
                <span>HUMIDITY: 82%</span>
                <span>LIGHT: 640 lux</span>
                <span className="text-teal-400/80 font-bold mt-2 tracking-[0.3em]">GARDEN_SYS // LIVE_MONITOR</span>
            </div>
        </div>
    );
}
