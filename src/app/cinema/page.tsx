"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ChevronUp, ChevronDown, Star, Film } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';

// --- 1. 电影数据结构：支持多剧照 + Supabase ---
interface CinemaItem {
    id: number;
    title: string;
    titleEn: string;
    year: string;
    director: string;
    poster: string;
    stills: string[]; // 一个电影配置多个剧照
    score: number;
    comment: string;
}

export default function CinemaArchive() {
    const [mounted, setMounted] = useState(false);
    const [movies, setMovies] = useState<CinemaItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedIdx, setSelectedIdx] = useState(0);
    const [stillIdx, setStillIdx] = useState(0); // 剧照索引状态

    useEffect(() => {
        setMounted(true);
        fetchMovies();
    }, []);

    const fetchMovies = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('movies')
            .select('*')
            .order('id', { ascending: false });

        if (error) {
            console.error('Error fetching movies:', error);
            setLoading(false);
            return;
        }

        if (data) {
            const mappedMovies: CinemaItem[] = data.map((item: any) => ({
                id: item.id,
                title: item.title,
                titleEn: item.title_en || '',
                year: item.year || '',
                director: item.director || '',
                poster: item.cover_url || '',
                stills: item.stills && item.stills.length > 0 ? item.stills : [item.cover_url || ''],
                score: (item.rating || 0) / 10, // Convert 0-100 to 0-10
                comment: item.comment || ''
            }));
            setMovies(mappedMovies);
        }
        setLoading(false);
    };

    // 关键：切换电影时，重置剧照索引
    useEffect(() => {
        setStillIdx(0);
    }, [selectedIdx]);

    if (!mounted) return null;

    if (loading) {
        return (
            <div className="h-screen w-full bg-[#020202] flex items-center justify-center text-gray-500 font-mono tracking-widest uppercase animate-pulse">
                Loading_Cinema_Data...
            </div>
        );
    }

    if (movies.length === 0) {
        return (
            <div className="h-screen w-full bg-[#020202] flex flex-col items-center justify-center text-gray-400 font-mono">
                <p className="text-xl tracking-widest uppercase mb-4">No Movies Found</p>
                <p className="text-sm text-gray-600">请在后台添加电影数据</p>
                <Link href="/admin/movies" className="mt-6 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
                    前往后台管理
                </Link>
            </div>
        );
    }

    const current = movies[selectedIdx];

    const nextMovie = () => setSelectedIdx((prev) => (prev + 1) % movies.length);
    const prevMovie = () => setSelectedIdx((prev) => (prev - 1 + movies.length) % movies.length);

    // 切换当前电影的剧照
    const toggleStill = () => {
        setStillIdx((prev) => (prev + 1) % current.stills.length);
    };

    return (
        <div className="h-screen w-full bg-[#020202] text-white flex overflow-hidden font-sans selection:bg-blue-500/30">

            {/* --- 左侧：方案 A 物理胶片卷轴区 (25%) --- */}
            <aside className="w-1/4 h-full bg-[#050505] border-r border-white/5 relative flex flex-col items-center shrink-0 shadow-[20px_0_50px_rgba(0,0,0,0.5)] z-30">

                {/* 返回按钮 */}
                <Link href="/" className="absolute top-8 left-8 z-50 group p-2 hover:bg-white/5 rounded-full transition-all">
                    <ArrowLeft size={24} className="text-gray-500 group-hover:text-white transition-colors" />
                </Link>

                <button onClick={prevMovie} className="mt-24 mb-4 text-gray-600 hover:text-blue-500 transition-colors z-20 focus:outline-none">
                    <ChevronUp size={32} />
                </button>

                <div className="flex-1 w-full relative overflow-hidden flex flex-col items-center">
                    {/* 胶片底带 */}
                    <div className="absolute inset-y-0 w-52 bg-[#080808] border-x border-white/5 shadow-inner" />

                    {/* 动态滚动卷轴 */}
                    <motion.div
                        animate={{ y: -(selectedIdx * 380) + 120 }}
                        transition={{ type: "spring", stiffness: 70, damping: 20 }}
                        className="flex flex-col items-center relative z-10"
                    >
                        {movies.map((item, idx) => (
                            <div key={item.id} className="relative py-10 flex flex-col items-center group">

                                {/* 物理齿孔细节 */}
                                <div className="absolute left-[-28px] top-0 bottom-0 w-4 flex flex-col justify-around py-4 opacity-20">
                                    {Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-5 w-3.5 border border-white/30 rounded-[3px] bg-black/50" />)}
                                </div>
                                <div className="absolute right-[-28px] top-0 bottom-0 w-4 flex flex-col justify-around py-4 opacity-20">
                                    {Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-5 w-3.5 border border-white/30 rounded-[3px] bg-black/50" />)}
                                </div>

                                {/* 边缘数据码 */}
                                <div className="absolute left-[-50px] top-1/2 -translate-y-1/2 writing-vertical-rl text-[7px] font-mono text-white/10 tracking-[0.6em] uppercase">
                                    FILM_STOCK_ID_{item.id + 500} // {item.year}
                                </div>

                                {/* 海报卡片 */}
                                <motion.div
                                    onClick={() => setSelectedIdx(idx)}
                                    animate={{
                                        scale: idx === selectedIdx ? 1.05 : 0.85,
                                        filter: idx === selectedIdx ? "grayscale(0%) brightness(1.1)" : "grayscale(100%) brightness(0.3)"
                                    }}
                                    className={`relative w-44 aspect-2/3 cursor-pointer rounded-sm overflow-hidden transition-all duration-700 ${idx === selectedIdx ? 'shadow-[0_0_50px_rgba(59,130,246,0.1)] ring-1 ring-white/20' : ''
                                        }`}
                                >
                                    {item.poster ? (
                                        <img src={item.poster} className="w-full h-full object-cover" alt={item.title} />
                                    ) : (
                                        <div className="w-full h-full bg-zinc-800 flex items-center justify-center text-xs text-zinc-500">NO POSTER</div>
                                    )}
                                </motion.div>
                            </div>
                        ))}
                    </motion.div>
                </div>

                <button onClick={nextMovie} className="mb-12 mt-4 text-gray-600 hover:text-blue-500 transition-colors z-20 focus:outline-none">
                    <ChevronDown size={32} />
                </button>
            </aside>

            {/* --- 右侧：内容详情区 (75%) --- */}
            <main className="flex-1 h-full flex flex-col bg-[#020202]">

                {/* 上半部分：多剧照切换展示区 (50%) */}
                <section className="h-[52%] w-full p-10 pb-0 shrink-0">
                    <div
                        onClick={toggleStill}
                        className="w-full h-full rounded-[2.5rem] overflow-hidden border border-white/5 relative group bg-black cursor-pointer"
                    >
                        <AnimatePresence mode="wait">
                            <motion.img
                                key={current.stills[stillIdx]}
                                initial={{ opacity: 0, scale: 1.05 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.6 }}
                                src={current.stills[stillIdx]}
                                className="w-full h-full object-cover opacity-70 group-hover:opacity-80 transition-opacity duration-700"
                                alt="Cinema Still"
                            />
                        </AnimatePresence>

                        {/* 渐变遮罩 */}
                        <div className="absolute inset-0 bg-linear-to-t from-[#020202] via-transparent to-transparent pointer-events-none" />

                        {/* 剧照切换指示器 */}
                        <div className="absolute bottom-10 right-12 flex flex-col items-end gap-2">
                            <div className="flex gap-1.5 mb-2">
                                {current.stills.map((_, i) => (
                                    <div key={i} className={`h-1 rounded-full transition-all duration-500 ${i === stillIdx ? 'w-6 bg-blue-500' : 'w-1.5 bg-white/20'}`} />
                                ))}
                            </div>
                            <span className="text-[10px] font-mono text-blue-500/80 tracking-[0.4em] uppercase">
                                Frame_0{stillIdx + 1} / 0{current.stills.length}
                            </span>
                        </div>

                        {/* 提示点击切换 */}
                        <div className="absolute top-10 right-10 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                            <div className="px-3 py-1.5 rounded-full bg-white/5 backdrop-blur-md border border-white/10 flex items-center gap-2">
                                <Film size={12} className="text-blue-500" />
                                <span className="text-[9px] font-mono uppercase tracking-widest text-gray-300">Click to switch frame</span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* 下半部分：文字信息 (50%) */}
                <section className="flex-1 px-16 flex flex-col justify-center">
                    <motion.div
                        key={current.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="grid grid-cols-12 gap-12"
                    >
                        {/* 核心文本区 */}
                        <div className="col-span-8 space-y-8">
                            <div>
                                <p className="text-3xl font-mono text-gray-500 tracking-tight uppercase mb-4 leading-none">
                                    Directed by <span className="text-white font-bold ml-1 italic underline underline-offset-8 decoration-blue-500/30">
                                        {current.director}
                                    </span>
                                </p>
                                <h2 className="text-7xl font-black italic tracking-tighter uppercase leading-none mb-6">
                                    {current.title}
                                    <span className="text-3xl font-light opacity-30 ml-6 not-italic font-sans">({current.year})</span>
                                </h2>
                            </div>

                            <div className="pt-8 border-t border-white/5 max-w-2xl">
                                <p className="text-[10px] font-mono text-gray-600 mb-6 tracking-[0.6em] uppercase">Observation_Log</p>
                                <p className="text-xl font-light text-gray-400 italic leading-relaxed">
                                    "{current.comment}"
                                </p>
                            </div>
                        </div>

                        {/* 评分与其他元数据 */}
                        <div className="col-span-4 flex flex-col items-end justify-start pt-4 gap-12">
                            <div className="text-right">
                                <p className="text-[10px] font-mono text-gray-600 uppercase tracking-[0.4em] mb-4">Final_Sync_Efficiency</p>
                                <div className="flex items-center gap-6 justify-end">
                                    <div className="flex gap-1.5">
                                        {[1, 2, 3, 4, 5].map(s => (
                                            <Star key={s} size={16} fill={s <= Math.round(current.score / 2) ? "#3b82f6" : "transparent"}
                                                className={s <= Math.round(current.score / 2) ? "text-blue-500 drop-shadow-[0_0_8px_#3b82f6]" : "text-white/5"} />
                                        ))}
                                    </div>
                                    <span className="text-6xl font-bold italic font-mono tracking-tighter">
                                        {current.score.toFixed(1)}
                                        <span className="text-xs not-italic opacity-20 ml-2 font-sans tracking-widest">/ 10</span>
                                    </span>
                                </div>
                            </div>

                            <div className="flex flex-col gap-2 items-end">
                                <div className="px-4 py-1.5 bg-white/5 border border-white/10 text-[9px] font-mono text-gray-500 uppercase tracking-widest">Type: Master_Archive</div>
                                <div className="px-4 py-1.5 bg-white/5 border border-white/10 text-[9px] font-mono text-gray-500 uppercase tracking-widest">Format: 35mm_Negative</div>
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