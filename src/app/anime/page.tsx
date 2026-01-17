"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Database, Monitor, Play } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';

// --- 1. 数据结构 ---
interface AnimeItem {
    id: number;
    title: string;
    titleEn: string;
    cover: string;
    rating: number;
    year: string;
    tags: string[];
    comment: string;
    status: 'Watched' | 'Watching' | 'Dropped';
}

// --- 2. 模拟数据 (后续可在此扩展) ---
const MOCK_DATA: AnimeItem[] = [];

export default function AnimeArchive() {
    const [mounted, setMounted] = useState(false);
    const [viewMode, setViewMode] = useState<'archive' | 'theater'>('archive');
    const [animes, setAnimes] = useState<AnimeItem[]>([]);
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);

    // Fetch data from Supabase
    useEffect(() => {
        setMounted(true);
        const fetchAnimes = async () => {
            const { data, error } = await supabase
                .from('animes')
                .select('*')
                .order('id', { ascending: false });

            if (data) {
                const mappedAnimes: AnimeItem[] = data.map((item: any) => ({
                    id: item.id,
                    title: item.title,
                    titleEn: item.title_en || '',
                    cover: item.cover_url || '',
                    rating: item.rating || 0,
                    year: item.year || '',
                    // --- 修改点 1：增强的标签清洗逻辑 ---
                    // 这里会同时按“英文逗号”和“中文逗号”进行拆分，并去除多余空格
                    tags: Array.isArray(item.tags)
                        ? item.tags.flatMap((t: string) => t.split(/[,，]/).map(s => s.trim()).filter(Boolean))
                        : [],
                    comment: item.comment || '',
                    status: item.status || 'Watched'
                }));
                setAnimes(mappedAnimes);
                if (mappedAnimes.length > 0) {
                    setSelectedId(mappedAnimes[0].id);
                }
            }
        };
        fetchAnimes();
    }, []);

    // 预留的视频数据数组
    const VIDEO_DATA = [
        {
            bvid: "BV13x4y1y7Bq",
            title: "重启咲良田-神圣的重生",
            desc: "Visual Log // 2026 Season Opener",
            cover: "/images/mad_cover/神圣的重生.png",
        },
        {
            bvid: "BV16f4y1M7mB",
            title: "敬请期待",
            desc: "Visual Log // Mid Summer",
            cover: "https://images.unsplash.com/photo-1578632288102-45e0586e9690?q=80&w=1200",
        },
    ];

    const handleNext = () => {
        setIsPlaying(false);
        setCurrentVideoIndex((prev) => (prev + 1) % VIDEO_DATA.length);
    };

    const handlePrev = () => {
        setIsPlaying(false);
        setCurrentVideoIndex((prev) => (prev - 1 + VIDEO_DATA.length) % VIDEO_DATA.length);
    };

    const selectedAnime = animes.find(a => a.id === selectedId);

    if (!mounted) return null;

    return (
        <div className="h-screen w-full bg-[#020202] text-white overflow-hidden selection:bg-blue-500/30 font-sans">

            <AnimatePresence mode="wait">
                {viewMode === 'archive' ? (
                    /* ==========================================================
                       ARCHIVE 模式：Master-Detail 布局 (左 75% | 右 25% 全高)
                       ========================================================== */
                    <motion.div
                        key="archive-view"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="flex h-full w-full"
                    >
                        {/* --- 左侧容器 (75%) --- */}
                        <div className="w-3/4 flex flex-col border-r-2 border-white/20 shadow-[4px_0_24px_rgba(0,0,0,0.4)]">

                            {/* 顶部导航 */}
                            <header className="pt-10 px-10 shrink-0">
                                <div className="flex items-center gap-10 mb-4">
                                    <Link href="/" className="group p-2 -ml-2 hover:bg-white/5 rounded-full transition-all">
                                        <ArrowLeft size={24} className="text-gray-500 group-hover:text-white transition-colors" />
                                    </Link>

                                    <div className="flex flex-col">
                                        <h1 className="text-[10px] font-mono tracking-[0.5em] uppercase text-blue-500/80 mb-2">
                                            System Active
                                        </h1>
                                        <div className="flex items-center gap-6">
                                            <span className="text-4xl font-bold italic tracking-tighter uppercase">
                                                Anime<span className="text-gray-600">_Archive</span>
                                            </span>

                                            <div className="h-6 w-px bg-white/10 mx-2" />

                                            {/* 视图切换 */}
                                            <nav className="flex gap-8 text-sm font-mono tracking-widest uppercase">
                                                <button
                                                    onClick={() => setViewMode('archive')}
                                                    className="flex items-center gap-2 transition-all duration-500 text-white"
                                                >
                                                    <Database size={22} className="text-blue-500" /> Archive
                                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 ml-1 shadow-[0_0_8px_#3b82f6]" />
                                                </button>
                                                <button
                                                    onClick={() => setViewMode('theater')}
                                                    className="flex items-center gap-2 transition-all duration-500 text-gray-600 hover:text-gray-400"
                                                >
                                                    <Monitor size={22} className="text-gray-400" /> Theater
                                                </button>
                                            </nav>
                                        </div>
                                    </div>
                                </div>

                                {/* 分割线 */}
                                <div className="relative w-full h-[2px]">
                                    <div className="absolute inset-0 bg-linear-to-r from-white/40 via-white/20 to-transparent" />
                                </div>
                            </header>

                            {/* 列表滚动区 */}
                            <div className="flex-1 overflow-y-auto custom-scrollbar p-10 pr-14">
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8">
                                    {animes.map((item) => (
                                        <motion.div
                                            key={item.id}
                                            whileHover={{ scale: 1.03 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={() => setSelectedId(item.id)}
                                            className={`relative aspect-2/3 cursor-pointer rounded-3xl overflow-hidden border transition-all duration-700 ${selectedId === item.id
                                                ? 'border-blue-500 shadow-[0_0_30px_rgba(59,130,246,0.2)] ring-1 ring-blue-500/50'
                                                : 'border-white/5 opacity-50 hover:opacity-100 grayscale hover:grayscale-0'
                                                }`}
                                        >
                                            <img src={item.cover} alt={item.title} className="w-full h-full object-cover" />
                                            <div className="absolute inset-0 bg-linear-to-t from-black/90 via-transparent to-transparent opacity-80" />
                                            <div className="absolute bottom-5 left-5 right-5">
                                                <p className="text-[11px] font-bold tracking-widest uppercase truncate">{item.title}</p>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* --- 右侧详情栏 (25%)：贯穿全高度 --- */}
                        <aside className="w-1/4 h-full bg-[#050505] p-12 flex flex-col pt-24 overflow-y-auto relative z-20 shadow-[-20px_0_50px_rgba(0,0,0,0.5)]">
                            {selectedAnime ? (
                                <motion.div
                                    key={selectedAnime.id}
                                    initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.7, ease: "easeOut" }}
                                    className="space-y-12"
                                >
                                    <div>
                                        {/* 标题展示 */}
                                        <h2 className="text-5xl font-extrabold italic tracking-tighter leading-none mb-3 uppercase text-white/95">
                                            {selectedAnime.title}
                                        </h2>
                                        {selectedAnime.titleEn && (
                                            <p className="text-lg font-serif italic text-gray-500 tracking-wider mb-4 leading-snug">
                                                {selectedAnime.titleEn}
                                            </p>
                                        )}

                                        <div className="flex items-center gap-4 mt-2">
                                            <span className="text-[10px] font-mono text-blue-500 tracking-[0.4em] uppercase">Archive_0{selectedAnime.id}</span>
                                            <div className="h-px w-10 bg-white/10" />
                                            <span className="text-[10px] font-mono text-gray-500 uppercase">{selectedAnime.year}</span>
                                        </div>
                                    </div>

                                    <div className="space-y-5">
                                        <div className="flex justify-between items-end mb-1">
                                            <span className="text-[9px] font-mono text-gray-500 uppercase tracking-[0.5em]">Sync_Efficiency</span>
                                            <span className="text-4xl font-bold italic text-white">{selectedAnime.rating}<span className="text-base not-italic ml-1 opacity-30">%</span></span>
                                        </div>
                                        <div className="h-[2px] w-full bg-white/5 relative overflow-hidden">
                                            <motion.div
                                                initial={{ x: "-100%" }} animate={{ x: `${selectedAnime.rating - 100}%` }}
                                                transition={{ duration: 1.8, ease: "circOut" }}
                                                className="absolute inset-0 bg-blue-500 shadow-[0_0_15px_#3b82f6]"
                                            />
                                        </div>
                                    </div>

                                    {/* --- 修改点 2：标签展示 (大字体 + 斜杠分割 + 无边框) --- */}
                                    <div className="font-mono tracking-wider leading-relaxed">
                                        <div className="mb-3 text-blue-500/60 uppercase text-[10px] tracking-[0.3em]">Data_Tags //</div>
                                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                                            {selectedAnime.tags.map((tag, i) => (
                                                <React.Fragment key={`${tag}-${i}`}>
                                                    <span className="text-base md:text-lg text-gray-200 hover:text-blue-400 transition-colors cursor-default whitespace-nowrap font-medium">
                                                        #{tag}
                                                    </span>
                                                    {i < selectedAnime.tags.length - 1 && (
                                                        <span className="text-base md:text-lg text-gray-700 select-none">/</span>
                                                    )}
                                                </React.Fragment>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="pt-12 border-t border-white/5">
                                        <p className="text-[10px] font-mono text-gray-600 mb-8 tracking-[0.6em] uppercase">Observation_Log</p>
                                        <p className="text-base text-gray-400 font-light leading-relaxed italic">
                                            “{selectedAnime.comment}”
                                        </p>
                                    </div>
                                </motion.div>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-gray-800 font-mono text-[10px] tracking-[0.5em]">
                                    <div className="animate-pulse italic uppercase">Awaiting_Signal_Input</div>
                                </div>
                            )}
                        </aside>
                    </motion.div>
                ) : (
                    /* ==========================================================
                       THEATER 模式 (保持不变)
                       ========================================================== */
                    <motion.div
                        key="theater-view"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="h-full w-full flex flex-col"
                    >
                        {/* Header 部分 */}
                        <header className="pt-10 px-10 shrink-0">
                            <div className="flex items-center gap-10 mb-4">
                                <Link href="/" className="p-2 -ml-2 hover:bg-white/5 rounded-full transition-all group">
                                    <ArrowLeft size={24} className="text-gray-500 group-hover:text-white transition-colors" />
                                </Link>
                                <div className="flex flex-col">
                                    <h1 className="text-[10px] font-mono tracking-[0.5em] uppercase text-blue-500/80 mb-2">System Active</h1>
                                    <div className="flex items-center gap-6">
                                        <span className="text-4xl font-bold italic tracking-tighter uppercase">
                                            Anime<span className="text-gray-600">_Archive</span>
                                        </span>
                                        <div className="h-6 w-px bg-white/10 mx-2" />
                                        <nav className="flex gap-8 text-sm font-mono tracking-widest uppercase">
                                            <button
                                                onClick={() => setViewMode('archive')}
                                                className="text-gray-600 hover:text-white transition-all flex items-center gap-2"
                                            >
                                                <Database size={22} /> Archive
                                            </button>
                                            <button className="text-white flex items-center gap-2">
                                                <Monitor size={22} className="text-blue-500" /> Theater
                                                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 ml-1 shadow-[0_0_8px_#3b82f6]" />
                                            </button>
                                        </nav>
                                    </div>
                                </div>
                            </div>
                            <div className="h-[2px] w-full bg-linear-to-r from-white/40 via-white/20 to-transparent" />
                        </header>

                        <main className="flex-1 flex items-center justify-center p-12 relative">
                            {/* 左切换按钮 */}
                            <button
                                onClick={handlePrev}
                                className="absolute left-10 p-4 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 hover:border-blue-500/50 transition-all z-30 group"
                            >
                                <div className="text-gray-500 group-hover:text-blue-500 transition-colors">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6" /></svg>
                                </div>
                            </button>

                            {/* 视频核心容器 */}
                            <div className="w-full max-w-6xl aspect-video bg-black rounded-[3rem] border border-white/5 relative overflow-hidden shadow-2xl group">
                                <AnimatePresence mode="wait">
                                    {!isPlaying ? (
                                        <motion.div
                                            key="cover"
                                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                            className="absolute inset-0 z-20 cursor-pointer"
                                            onClick={() => setIsPlaying(true)}
                                        >
                                            <img
                                                src={VIDEO_DATA[currentVideoIndex].cover}
                                                className="w-full h-full object-cover opacity-60 group-hover:opacity-40 transition-opacity duration-700"
                                                alt="Video Cover"
                                            />
                                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-6">
                                                <div className="p-10 rounded-full bg-white/5 border border-white/10 backdrop-blur-xl group-hover:scale-110 group-hover:border-blue-500/50 transition-all duration-500 shadow-2xl">
                                                    <Play fill="white" size={48} className="ml-1" />
                                                </div>
                                                <div className="text-center">
                                                    <h3 className="text-3xl font-bold tracking-[0.4em] italic uppercase mb-4">
                                                        {VIDEO_DATA[currentVideoIndex].title}
                                                    </h3>
                                                    <p className="text-[11px] font-mono text-blue-500/60 uppercase tracking-[0.6em]">
                                                        {VIDEO_DATA[currentVideoIndex].desc}
                                                    </p>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ) : (
                                        <motion.div
                                            key="player"
                                            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                            className="absolute inset-0"
                                        >
                                            <iframe
                                                src={`//player.bilibili.com/player.html?bvid=${VIDEO_DATA[currentVideoIndex].bvid}&page=1&high_quality=1&danmaku=0&autoplay=1`}
                                                allowFullScreen={true}
                                                width="100%"
                                                height="100%"
                                                className="w-full h-full border-0"
                                                sandbox="allow-top-navigation allow-same-origin allow-forms allow-scripts"
                                            ></iframe>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                                <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)] bg-size-[60px_60px] z-10"></div>
                            </div>

                            {/* 右切换按钮 */}
                            <button
                                onClick={handleNext}
                                className="absolute right-10 p-4 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 hover:border-blue-500/50 transition-all z-30 group"
                            >
                                <div className="text-gray-500 group-hover:text-blue-500 transition-colors">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6" /></svg>
                                </div>
                            </button>
                        </main>
                    </motion.div>

                )}
            </AnimatePresence>

            <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #3b82f6;
          box-shadow: 0 0 10px #3b82f6;
        }
      `}</style>
        </div>
    );
}