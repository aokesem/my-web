"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ChevronUp, ChevronDown, Star } from 'lucide-react';
import Link from 'next/link';

// --- 1. 数据结构 ---
interface CinemaItem {
    id: number;
    title: string;
    year: string;
    director: string;
    poster: string;
    still: string;
    score: number;
    comment: string;
}

const CINEMA_DATA: CinemaItem[] = [
    {
        id: 1,
        title: "银翼杀手 2049",
        year: "2017",
        director: "Denis Villeneuve",
        poster: "https://images.unsplash.com/photo-1626814026160-2237a95fc5a0?q=80&w=800",
        still: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=1200",
        score: 9.2,
        comment: "极致的视听盛宴，罗杰·狄金斯的摄影将赛博朋克的废土美学推向了神坛。这不仅是续作，更是对存在主义的深度探讨。"
    },
    {
        id: 2,
        title: "十二怒汉",
        year: "1957",
        director: "Sidney Lumet",
        poster: "https://images.unsplash.com/photo-1485846234645-a62644f84728?q=80&w=800",
        still: "https://images.unsplash.com/photo-1440404653325-ab127d49abc1?q=80&w=1200",
        score: 9.6,
        comment: "封闭空间内单纯靠台词推动的极致张力。它不仅仅关于正义，更关于偏见、理性和每一个生命不应被草率对待的尊严。"
    },
    {
        id: 3,
        title: "降临",
        year: "2016",
        director: "Denis Villeneuve",
        poster: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=800",
        still: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1200",
        score: 8.8,
        comment: "非线性叙事的杰作。如果预知了生命的终点，你是否还有勇气拥抱开始？语言学与科幻的浪漫结合。"
    }
];

export default function CinemaArchive() {
    const [mounted, setMounted] = useState(false);
    const [selectedIdx, setSelectedIdx] = useState(0);

    const current = CINEMA_DATA[selectedIdx];

    useEffect(() => { setMounted(true); }, []);
    if (!mounted) return null;

    const nextMovie = () => setSelectedIdx((prev) => (prev + 1) % CINEMA_DATA.length);
    const prevMovie = () => setSelectedIdx((prev) => (prev - 1 + CINEMA_DATA.length) % CINEMA_DATA.length);

    return (
        <div className="h-screen w-full bg-[#020202] text-white flex overflow-hidden font-sans selection:bg-blue-500/30">

            {/* --- 左侧：物理胶片卷轴区 (25%) --- */}
            <aside className="w-1/4 h-full bg-[#050505] border-r border-white/5 relative flex flex-col items-center shrink-0">

                {/* 返回按钮 - 修正路径 */}
                <Link href="/" className="absolute top-8 left-8 z-50 group p-2 hover:bg-white/5 rounded-full transition-all">
                    <ArrowLeft size={24} className="text-gray-500 group-hover:text-white transition-colors" />
                </Link>

                <button onClick={prevMovie} className="mt-24 mb-4 text-gray-600 hover:text-blue-500 transition-colors z-20"><ChevronUp size={32} /></button>

                {/* 胶片主体 */}
                <div className="flex-1 w-full relative overflow-hidden flex flex-col items-center">

                    {/* 胶片底色带 (Celluloid Base) */}
                    <div className="absolute inset-y-0 w-52 bg-[#080808] border-x border-white/5 shadow-2xl" />

                    {/* 动态滚动胶片条 */}
                    <motion.div
                        animate={{ y: -(selectedIdx * 380) + 120 }}
                        transition={{ type: "spring", stiffness: 70, damping: 20 }}
                        className="flex flex-col items-center relative z-10"
                    >
                        {CINEMA_DATA.map((item, idx) => (
                            <div key={item.id} className="relative py-10 flex flex-col items-center group">

                                {/* 侧边齿孔 (真实圆角矩形) */}
                                <div className="absolute left-[-24px] top-0 bottom-0 w-4 flex flex-col justify-around py-4">
                                    {Array.from({ length: 8 }).map((_, i) => (
                                        <div key={i} className="h-5 w-3.5 border border-white/10 rounded-[3px] bg-black/40 shadow-inner" />
                                    ))}
                                </div>
                                <div className="absolute right-[-24px] top-0 bottom-0 w-4 flex flex-col justify-around py-4">
                                    {Array.from({ length: 8 }).map((_, i) => (
                                        <div key={i} className="h-5 w-3.5 border border-white/10 rounded-[3px] bg-black/40 shadow-inner" />
                                    ))}
                                </div>

                                {/* 边缘信息码 (Edge Codes) */}
                                <div className="absolute left-[-45px] top-1/2 -translate-y-1/2 writing-vertical-rl text-[8px] font-mono text-orange-500/30 tracking-widest uppercase">
                                    KODAK 5219  {2048 + idx * 12}  {item.year}
                                </div>

                                {/* 海报本体 */}
                                <motion.div
                                    onClick={() => setSelectedIdx(idx)}
                                    animate={{
                                        scale: idx === selectedIdx ? 1 : 0.85,
                                        filter: idx === selectedIdx ? "grayscale(0%) brightness(1.1)" : "grayscale(80%) brightness(0.5)"
                                    }}
                                    className={`relative w-44 aspect-[2/3] cursor-pointer rounded-[2px] overflow-hidden transition-all duration-700 ${idx === selectedIdx ? 'shadow-[0_0_50px_rgba(59,130,246,0.15)] ring-1 ring-white/20' : ''
                                        }`}
                                >
                                    <img src={item.poster} className="w-full h-full object-cover" alt={item.title} />
                                </motion.div>
                            </div>
                        ))}
                    </motion.div>
                </div>

                <button onClick={nextMovie} className="mb-12 mt-4 text-gray-600 hover:text-blue-500 transition-colors z-20"><ChevronDown size={32} /></button>
            </aside>

            {/* --- 右侧：内容详情区 (75%) --- */}
            <main className="flex-1 h-full flex flex-col bg-[#020202]">

                {/* 上半部分：精美剧照展示 */}
                <section className="h-[50%] w-full p-10 pb-0 shrink-0">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={current.still}
                            initial={{ opacity: 0, filter: 'blur(10px)' }}
                            animate={{ opacity: 1, filter: 'blur(0px)' }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.8 }}
                            className="w-full h-full rounded-[2.5rem] overflow-hidden border border-white/5 relative group"
                        >
                            <img src={current.still} className="w-full h-full object-cover opacity-70 group-hover:scale-105 transition-transform duration-[2s]" alt="Film Still" />
                            <div className="absolute inset-0 bg-linear-to-t from-[#020202] via-transparent to-transparent" />
                            <div className="absolute top-6 right-8 text-[10px] font-mono text-white/20 tracking-[0.4em]">SOURCE: 35MM_SCAN</div>
                        </motion.div>
                    </AnimatePresence>
                </section>

                {/* 下半部分：详情与影评 (Letterboxd Logic) */}
                <section className="flex-1 px-16 flex flex-col justify-center">
                    <motion.div
                        key={current.id}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="grid grid-cols-12 gap-12"
                    >
                        {/* 核心文本区 */}
                        <div className="col-span-8 space-y-8">
                            <div>
                                <p className="text-3xl font-mono text-gray-500 tracking-tight uppercase mb-4">
                                    Directed by <span className="text-white font-bold ml-2 underline underline-offset-8 decoration-blue-500/50">{current.director}</span>
                                </p>
                                <h2 className="text-7xl font-black italic tracking-tighter uppercase leading-none mb-6">
                                    {current.title}
                                    <span className="text-3xl font-light opacity-30 ml-6 not-italic">{current.year}</span>
                                </h2>
                            </div>

                            <div className="pt-8 border-t border-white/5 max-w-2xl">
                                <div className="flex items-center gap-3 mb-6 opacity-40">
                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                    <span className="text-[10px] font-mono tracking-[0.5em] uppercase">Observation_Log</span>
                                </div>
                                <p className="text-xl font-light text-gray-300 italic leading-relaxed">
                                    “{current.comment}”
                                </p>
                            </div>
                        </div>

                        {/* 数字化评分区 */}
                        <div className="col-span-4 flex flex-col items-end justify-start pt-4 gap-12">
                            <div className="text-right">
                                <p className="text-[10px] font-mono text-gray-600 uppercase tracking-[0.4em] mb-4 text-right">User_Rating</p>
                                <div className="flex items-center gap-6 justify-end">
                                    <div className="flex gap-1.5">
                                        {[1, 2, 3, 4, 5].map(s => (
                                            <Star key={s} size={16} fill={s <= Math.round(current.score / 2) ? "#3b82f6" : "transparent"}
                                                className={s <= Math.round(current.score / 2) ? "text-blue-500 drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]" : "text-white/5"} />
                                        ))}
                                    </div>
                                    <span className="text-6xl font-bold italic font-mono tracking-tighter">
                                        {current.score}
                                        <span className="text-xs not-italic opacity-20 ml-2 font-sans tracking-widest">/ 10</span>
                                    </span>
                                </div>
                            </div>

                            {/* 装饰性状态位 */}
                            <div className="grid grid-cols-2 gap-4 w-full">
                                <div className="p-3 border border-white/5 bg-white/[0.02] rounded-sm">
                                    <p className="text-[8px] font-mono text-gray-600 uppercase mb-1">Status</p>
                                    <p className="text-[10px] font-mono text-blue-500 uppercase tracking-tighter">Archived</p>
                                </div>
                                <div className="p-3 border border-white/5 bg-white/[0.02] rounded-sm">
                                    <p className="text-[8px] font-mono text-gray-600 uppercase mb-1">Format</p>
                                    <p className="text-[10px] font-mono text-blue-500 uppercase tracking-tighter">35mm / 4K</p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </section>
            </main>

            <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 0px; }
        .writing-vertical-rl { writing-mode: vertical-rl; }
      `}</style>
        </div>
    );
}