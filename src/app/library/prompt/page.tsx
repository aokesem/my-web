"use client";

import React from 'react';
import { motion } from 'framer-motion';
import {
    ArrowLeft,
    Search,
    LayoutGrid,
    MessageSquare,
    SearchCode,
    Terminal,
    Sparkles,
    Cpu,
    Archive
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const CATEGORIES = [
    {
        id: 'search',
        title: '信息搜索',
        enTitle: 'Information Search',
        icon: SearchCode,
        description: '用于深度搜索、信息提取及结构化分析的精准指令。',
        color: 'text-blue-500',
        bg: 'bg-blue-50/50',
        status: 'Operational'
    },
    {
        id: 'chat',
        title: '对话助手',
        enTitle: 'Chat Assistant',
        icon: MessageSquare,
        description: '优化日常交流细节，提升语言多样性与逻辑严密感。',
        color: 'text-emerald-500',
        bg: 'bg-emerald-50/50',
        status: 'Operational'
    },
    {
        id: 'coding',
        title: '编程助手',
        enTitle: 'Programming Guide',
        icon: Terminal,
        description: '涵盖重构、调试、架构设计及自动化脚本生成指令。',
        color: 'text-orange-500',
        bg: 'bg-orange-50/50',
        status: 'Operational'
    },
    {
        id: 'creative',
        title: '创意写作',
        enTitle: 'Creative Writing',
        icon: Sparkles,
        description: '激发文学创作、脚本构思及艺术描述的非线性提示词。',
        color: 'text-purple-500',
        bg: 'bg-purple-50/50',
        status: 'Development'
    },
    {
        id: 'productivity',
        title: '效率工具',
        enTitle: 'Productivity Tool',
        icon: Cpu,
        description: '表格处理、邮件撰写、日程规划等日常办公自动化指令。',
        color: 'text-slate-500',
        bg: 'bg-slate-50/50',
        status: 'Operational'
    },
    {
        id: 'archive',
        title: '历史存档',
        enTitle: 'Legacy Archive',
        icon: Archive,
        description: '归档已退役或特定场景下的提示词，仅作研究参考使用。',
        color: 'text-stone-400',
        bg: 'bg-stone-50/50',
        status: 'Archived'
    }
];

export default function PromptWarehousePage() {
    const router = useRouter();

    return (
        <div className="relative min-h-screen bg-[#fdfbf7] text-slate-800 font-sans selection:bg-orange-100 overflow-x-hidden">
            {/* --- White Canvas Background (Shared Logic) --- */}
            <div className="fixed inset-0 z-0 opacity-40 pointer-events-none mix-blend-multiply"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.5'/%3E%3C/svg%3E")`,
                }}
            />
            <div className="fixed inset-0 z-0 opacity-[0.08] pointer-events-none"
                style={{
                    backgroundImage: `radial-gradient(#4a4a4a 1px, transparent 1px)`,
                    backgroundSize: '24px 24px'
                }}
            />
            <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_50%,transparent_0%,rgba(240,230,220,0.4)_100%)] z-0 pointer-events-none" />

            {/* --- Header --- */}
            <header className="relative z-20 max-w-7xl mx-auto px-8 py-12 flex justify-between items-end">
                <div className="space-y-4">
                    <Link
                        href="/library"
                        className="group inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/60 border border-stone-200/50 hover:bg-white hover:shadow-sm transition-all"
                    >
                        <ArrowLeft size={14} className="text-stone-400 group-hover:text-stone-600" />
                        <span className="text-[10px] font-mono font-bold text-stone-500 uppercase tracking-widest">Back to Library</span>
                    </Link>
                    <div className="space-y-1">
                        <h1 className="text-5xl font-serif font-bold tracking-tight text-stone-800">
                            Prompt <span className="text-orange-600">Warehouse</span>
                        </h1>
                        <p className="text-sm font-mono text-stone-400 uppercase tracking-[0.2em]">
                            System_Control // Logic_Matrix_v2.0
                        </p>
                    </div>
                </div>

                <div className="flex flex-col items-end gap-6 h-full justify-between">
                    <div className="flex items-center gap-4 bg-stone-100/50 p-1.5 rounded-xl border border-stone-200/40 backdrop-blur-sm">
                        <div className="px-3 py-1 bg-white rounded-lg shadow-sm border border-stone-200/60">
                            <span className="text-[10px] font-mono font-bold text-orange-600 uppercase tracking-widest items-center flex gap-1.5">
                                <LayoutGrid size={10} /> Matrix_Mode
                            </span>
                        </div>
                        <div className="px-3 py-1 flex items-center gap-2 text-stone-400 opacity-50 hover:opacity-100 transition-opacity cursor-pointer">
                            <Search size={14} />
                            <span className="text-[10px] font-mono font-bold uppercase tracking-widest">Global_Search</span>
                        </div>
                    </div>
                </div>
            </header>

            {/* --- Category Matrix (Task Manager Style) --- */}
            <main className="relative z-10 max-w-7xl mx-auto px-8 pb-32">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {CATEGORIES.map((cat, idx) => (
                        <motion.div
                            key={cat.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            whileHover={{ y: -4 }}
                            onClick={() => router.push(`/library/prompt/${cat.id}`)}
                            className="group relative bg-white/60 backdrop-blur-md border border-stone-200/60 rounded-2xl overflow-hidden cursor-pointer hover:bg-white hover:shadow-xl hover:shadow-orange-900/5 hover:border-orange-200/50 transition-all duration-300"
                        >
                            {/* Blueprint ID Marker */}
                            <div className="absolute top-0 right-0 px-3 py-1 bg-stone-100 rounded-bl-xl border-l border-b border-stone-200/40">
                                <span className="text-[9px] font-mono text-stone-400 font-bold uppercase tracking-tighter">IDX_0{idx + 1}</span>
                            </div>

                            <div className="p-8 h-full flex flex-col">
                                <div className="flex items-start justify-between mb-8">
                                    <div className={`p-4 rounded-2xl ${cat.bg} ${cat.color} group-hover:scale-110 transition-transform duration-500`}>
                                        <cat.icon size={28} strokeWidth={1.5} />
                                    </div>
                                    <div className="text-right">
                                        <div className={`text-[10px] font-mono font-bold uppercase tracking-[0.2em] mb-1 ${cat.status === 'Operational' ? 'text-emerald-500' : 'text-stone-400'}`}>
                                            ● {cat.status}
                                        </div>
                                        <span className="text-[8px] font-mono text-stone-300 uppercase">Latency: 24ms</span>
                                    </div>
                                </div>

                                <div className="space-y-4 flex-1">
                                    <div>
                                        <h2 className="text-2xl font-serif font-bold text-stone-800 group-hover:text-orange-600 transition-colors">
                                            {cat.title}
                                        </h2>
                                        <p className="text-[10px] font-mono text-stone-400 uppercase tracking-widest mt-1">
                                            {cat.enTitle}
                                        </p>
                                    </div>

                                    <div className="h-px w-full bg-stone-100" />

                                    <p className="text-sm text-stone-500 leading-relaxed font-medium">
                                        {cat.description}
                                    </p>
                                </div>

                                <div className="mt-8 flex items-center justify-between">
                                    <div className="flex gap-1">
                                        {[1, 2, 3].map(i => (
                                            <div key={i} className="w-6 h-1 rounded-full bg-stone-100 group-hover:bg-orange-100 transition-colors" />
                                        ))}
                                    </div>
                                    <div className="flex items-center gap-2 text-xs font-mono font-bold text-stone-300 group-hover:text-orange-500 transition-colors">
                                        ENTER_MODULE
                                        <div className="w-5 h-5 rounded-full border border-stone-200 flex items-center justify-center group-hover:border-orange-500 group-hover:translate-x-1 transition-all">
                                            <ArrowLeft size={10} className="rotate-180" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </main>

            {/* --- Technical Sidebar Detail --- */}
            <div className="fixed right-6 bottom-6 z-20 flex flex-col items-end gap-2 text-[10px] font-mono text-stone-300 select-none">
                <span>COORD_X: 1024.00</span>
                <span>COORD_Y: 768.42</span>
                <span className="text-stone-400 font-bold mt-2 tracking-[0.3em]">SCHEME_B // MATRIX_CANVAS</span>
            </div>
        </div>
    );
}
