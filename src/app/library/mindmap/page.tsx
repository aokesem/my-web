"use client";

import React from 'react';
import { motion } from 'framer-motion';
import {
    ArrowLeft,
    Share2,
    Map as MapIcon,
    Compass,
    Zap,
    Coffee,
    Activity,
    Box,
    ChevronRight
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const MINDMAP_CATEGORIES = [
    {
        id: 'travel',
        title: '出行指南',
        enTitle: 'Travel Guide',
        icon: Compass,
        description: '结构化的地点导航、路线规划及旅行清单汇编。',
        color: 'text-sky-500',
        bg: 'bg-sky-50/50',
        nodes: 12,
        status: 'Active'
    },
    {
        id: 'planning',
        title: '任务规划',
        enTitle: 'Task Planning',
        icon: Zap,
        description: '高密度的项目拆解、优先级矩阵及逻辑流图设计。',
        color: 'text-amber-500',
        bg: 'bg-amber-50/50',
        nodes: 45,
        status: 'Operational'
    },
    {
        id: 'diet',
        title: '饮食参考',
        enTitle: 'Dietary Reference',
        icon: Coffee,
        description: '营养成分拆解、食谱关联及个人健康饮食逻辑图。',
        color: 'text-emerald-500',
        bg: 'bg-emerald-50/50',
        nodes: 8,
        status: 'Standby'
    },
    {
        id: 'infostream',
        title: '个人信息流汇报',
        enTitle: 'Info Stream Aggregate',
        icon: Activity,
        description: '多源信息连接、知识碎片整合及逻辑汇点分析。',
        color: 'text-indigo-500',
        bg: 'bg-indigo-50/50',
        nodes: 24,
        status: 'Syncing'
    }
];

export default function MindMapMatrixPage() {
    const router = useRouter();

    return (
        <div className="relative min-h-screen bg-[#fdfbf7] text-slate-800 font-sans selection:bg-orange-100 overflow-x-hidden">
            {/* --- Blueprint Background --- */}
            <div className="fixed inset-0 z-0 opacity-40 pointer-events-none mix-blend-multiply"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.5'/%3E%3C/svg%3E")`,
                }}
            />
            <div className="fixed inset-0 z-0 opacity-[0.08] pointer-events-none"
                style={{
                    backgroundImage: `radial-gradient(#4a4a4a 1.5px, transparent 1.5px)`,
                    backgroundSize: '32px 32px'
                }}
            />
            <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_100%,transparent_0%,rgba(200,220,240,0.2)_100%)] z-0 pointer-events-none" />

            {/* --- Header --- */}
            <header className="relative z-20 max-w-7xl mx-auto px-8 py-16 flex justify-between items-start">
                <div className="space-y-6">
                    <Link
                        href="/library"
                        className="group inline-flex items-center gap-2 px-4 py-1.5 rounded-xl bg-white/60 border border-stone-200/50 hover:bg-white hover:shadow-sm transition-all"
                    >
                        <ArrowLeft size={14} className="text-stone-400 group-hover:text-stone-600" />
                        <span className="text-[10px] font-mono font-bold text-stone-500 uppercase tracking-widest">Return to Room</span>
                    </Link>
                    <div className="space-y-2">
                        <h1 className="text-6xl font-serif font-bold tracking-tighter text-stone-800 leading-none">
                            Mind Map <span className="text-sky-600">Projector</span>
                        </h1>
                        <p className="text-xs font-mono text-stone-400 uppercase tracking-[0.4em] pl-1">
                            Spatial_Logic // Vector_System_v1.0
                        </p>
                    </div>
                </div>

                <div className="flex flex-col items-end gap-3">
                    <div className="px-4 py-2 bg-stone-100 rounded-lg border border-stone-200/60">
                        <span className="text-[10px] font-mono font-bold text-stone-500 uppercase tracking-widest flex items-center gap-2">
                            <Box size={12} /> Active_Canvases: {MINDMAP_CATEGORIES.length}
                        </span>
                    </div>
                </div>
            </header>

            {/* --- Matrix Grid --- */}
            <main className="relative z-10 max-w-7xl mx-auto px-8 pb-40">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {MINDMAP_CATEGORIES.map((cat, idx) => (
                        <motion.div
                            key={cat.id}
                            initial={{ opacity: 0, x: idx % 2 === 0 ? -20 : 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.1, type: "spring", stiffness: 100 }}
                            whileHover={{ scale: 1.01 }}
                            onClick={() => router.push(`/library/mindmap/${cat.id}`)}
                            className="group relative bg-white border border-stone-200/80 rounded-3xl p-10 cursor-pointer overflow-hidden hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] hover:border-sky-200 transition-all duration-500"
                        >
                            {/* Blueprint ID */}
                            <div className="absolute top-8 right-10 text-[10px] font-mono text-stone-200 font-bold tracking-widest uppercase">
                                MAP_UNIT_0{idx + 1}
                            </div>

                            {/* Node-like background decoration */}
                            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-sky-500/5 rounded-full blur-3xl group-hover:bg-sky-500/10 transition-colors" />

                            <div className="relative z-10 flex flex-col h-full gap-8">
                                <div className="flex items-center gap-6">
                                    <div className={`w-16 h-16 rounded-2xl ${cat.bg} ${cat.color} flex items-center justify-center group-hover:rotate-12 transition-transform duration-500`}>
                                        <cat.icon size={32} strokeWidth={1.5} />
                                    </div>
                                    <div>
                                        <h2 className="text-3xl font-serif font-bold text-stone-800 group-hover:text-sky-600 transition-colors">
                                            {cat.title}
                                        </h2>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-[10px] font-mono text-stone-400 uppercase tracking-widest">{cat.enTitle}</span>
                                            <div className="w-1 h-1 rounded-full bg-stone-200" />
                                            <span className="text-[10px] font-mono text-sky-500 font-bold uppercase tracking-widest">{cat.nodes} NODES</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center gap-4">
                                        <div className="h-px flex-1 bg-stone-100" />
                                        <span className="text-[9px] font-mono text-stone-300 uppercase tracking-[0.2em]">Logical_Protocol</span>
                                        <div className="h-px w-10 bg-stone-100" />
                                    </div>
                                    <p className="text-base text-stone-500 leading-relaxed max-w-md">
                                        {cat.description}
                                    </p>
                                </div>

                                <div className="mt-auto pt-6 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={`px-3 py-1 rounded-full border ${cat.status === 'Operational' ? 'border-emerald-100 bg-emerald-50 text-emerald-600' : 'border-stone-100 bg-stone-50 text-stone-400'} text-[9px] font-mono font-bold uppercase tracking-widest`}>
                                            {cat.status}
                                        </div>
                                        <div className="flex -space-x-1.5 opacity-40">
                                            {[1, 2, 3].map(i => (
                                                <div key={i} className="w-4 h-4 rounded-full border-2 border-white bg-stone-200" />
                                            ))}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 text-xs font-mono font-bold text-stone-300 group-hover:text-sky-500 transition-colors uppercase tracking-[0.2em]">
                                        Open_Canvas
                                        <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                                    </div>
                                </div>
                            </div>

                            {/* Stylized L-Corners */}
                            <div className="absolute top-4 left-4 w-4 h-4 border-t border-l border-stone-100 opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="absolute bottom-4 right-4 w-4 h-4 border-b border-r border-stone-100 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </motion.div>
                    ))}
                </div>
            </main>

            {/* Bottom Tech Overlay */}
            <div className="fixed bottom-10 left-10 z-20 hidden lg:flex flex-col gap-1">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-[2px] bg-sky-500" />
                    <span className="text-[10px] font-mono text-stone-400 font-bold uppercase tracking-[0.4em]">Rendering_Engine: GPU_ACCELERATED</span>
                </div>
                <div className="flex items-center gap-3">
                    <div className="w-6 h-[2px] bg-stone-200" />
                    <span className="text-[10px] font-mono text-stone-300 uppercase tracking-[0.4em]">Spatial_Grid_Sync: 12ms</span>
                </div>
            </div>
        </div>
    );
}
