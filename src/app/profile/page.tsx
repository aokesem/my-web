"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import WindowView from './components/WindowView';
import { X, Eraser } from 'lucide-react';

export default function ProfilePage() {
    const [isWindowOpen, setIsWindowOpen] = useState(false);
    const [activeModule, setActiveModule] = useState<'idle' | 'intro'>('idle');
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => { setIsMounted(true); }, []);
    if (!isMounted) return null;

    return (
        <div className="relative w-screen h-screen overflow-hidden bg-[#eaf4ec] flex items-center justify-center">

            {/* =========================================
          1. 顶部区域：标题 & 状态 (Top Section)
         ========================================= */}
            <motion.div
                animate={{ opacity: activeModule === 'idle' ? 1 : 0, y: activeModule === 'idle' ? 0 : -20 }}
                transition={{ duration: 0.5 }}
                className="absolute top-[6%] z-10 flex flex-col items-center gap-4 pointer-events-none"
            >
                {/* 标题 (上移) */}
                <h1 className="text-3xl md:text-5xl font-bold text-[#3a5a40] tracking-widest drop-shadow-sm font-serif opacity-90">
                    欢迎来到CYZ的小屋
                </h1>

                {/* 新的状态栏 (指示灯 + 心情文字) */}
                <div className="flex items-center gap-4 bg-white/60 backdrop-blur-sm px-6 py-2 rounded-full border border-white/40 shadow-sm">
                    {/* 左侧：红黄绿指示灯 */}
                    <div className="flex gap-2">
                        <div className="w-3 h-3 rounded-full bg-[#ff5f57] border border-[#e0443e] shadow-inner" /> {/* Red */}
                        <div className="w-3 h-3 rounded-full bg-[#febc2e] border border-[#d89e24] shadow-inner" /> {/* Yellow */}
                        <div className="w-3 h-3 rounded-full bg-[#28c840] border border-[#1aab29] shadow-[0_0_8px_rgba(40,200,64,0.6)] animate-pulse" /> {/* Green (Active) */}
                    </div>

                    {/* 分隔线 */}
                    <div className="w-px h-4 bg-zinc-400/30" />

                    {/* 右侧：心情文字 */}
                    <span className="text-sm font-serif italic text-[#3a5a40]/80 tracking-wide">
                        "今日心情：像窗外的云一样自由。"
                    </span>
                </div>
            </motion.div>


            {/* =========================================
          2. 左侧区域：置物架 & 头像 (Left Shelf)
         ========================================= */}

            {/* 木质置物架 (Shelf) */}
            <div className="absolute left-0 top-[25%] z-20">
                {/* 架子板面 */}
                <div className="w-48 h-4 bg-[#8b5a2b] rounded-r-lg shadow-[0_10px_20px_rgba(0,0,0,0.15)] relative">
                    {/* 木纹纹理 (Optional) */}
                    <div className="absolute inset-0 bg-black/10 rounded-r-lg" style={{ backgroundImage: 'linear-gradient(90deg, transparent 50%, rgba(0,0,0,0.05) 50%)', backgroundSize: '4px 4px' }} />
                    {/* 架子下方的支撑架 (Bracket) */}
                    <div className="absolute left-10 top-4 w-4 h-8 bg-[#6b4226] skew-x-12 opacity-80" />
                    <div className="absolute left-32 top-4 w-4 h-8 bg-[#6b4226] skew-x-12 opacity-80" />
                </div>

                {/* 头像相框 (立在架子上) */}
                <div
                    className="absolute bottom-4 left-10 w-24 h-24 md:w-28 md:h-28 rounded-full border-[6px] border-white shadow-[0_10px_10px_rgba(0,0,0,0.2)] overflow-hidden bg-zinc-100 group hover:-translate-y-1 hover:scale-105 transition-all duration-300 origin-bottom cursor-pointer"
                    onClick={() => setActiveModule('intro')} // 点击头像也可以打开介绍
                >
                    <div className="absolute inset-0 bg-linear-to-tr from-zinc-200 to-zinc-100 flex items-center justify-center text-zinc-400 font-bold text-2xl">
                        CYZ
                    </div>
                    {/* 玻璃反光 */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-white/40 via-transparent to-transparent pointer-events-none" />
                </div>
            </div>


            {/* 墙上的触发器：小黑板 (保持原位，或者你可以考虑也把它放到第二层架子上？目前先按你说的保持不动) */}
            <div
                className="absolute left-[10%] bottom-[20%] z-20 cursor-pointer group"
                onClick={() => setActiveModule('intro')}
            >
                <div className="w-32 h-24 bg-[#2e3b33] border-4 border-[#8b5a2b] rounded-sm shadow-xl flex items-center justify-center transform transition-transform group-hover:scale-105 group-hover:-rotate-2">
                    <span className="text-white/80 font-serif text-xs italic opacity-80">
                        About Me...
                    </span>
                    <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-1 h-12 bg-zinc-400/50" />
                    <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-zinc-500 shadow-sm" />
                </div>
            </div>


            {/* =========================================
          3. 舞台层 (Stage Layer)
         ========================================= */}

            {/* 背景：窗户 */}
            <div className={`transition-all duration-700 ${activeModule !== 'idle' ? 'pointer-events-none' : ''}`}>
                <WindowView
                    isOpen={isWindowOpen}
                    onToggle={() => setIsWindowOpen(!isWindowOpen)}
                    isBlurred={activeModule !== 'idle'}
                />
            </div>

            {/* 前景：大黑板 */}
            <AnimatePresence>
                {activeModule === 'intro' && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        transition={{ type: "spring", duration: 0.6, bounce: 0.3 }}
                        className="absolute inset-0 flex items-center justify-center z-50 pointer-events-auto p-4"
                    >
                        <div className="relative w-full max-w-4xl aspect-video bg-[#2e3b33] rounded-lg border-[16px] border-[#8b5a2b] shadow-2xl flex flex-col overflow-hidden">
                            <div className="h-12 border-b border-white/10 flex items-center justify-between px-6 bg-black/10">
                                <span className="font-serif text-white/50 italic text-sm">Classroom 101: Intro</span>
                                <button
                                    onClick={(e) => { e.stopPropagation(); setActiveModule('idle'); }}
                                    className="p-2 hover:bg-white/10 rounded-full text-white/70 hover:text-white transition-colors"
                                >
                                    <X size={24} />
                                </button>
                            </div>

                            <div className="flex-1 p-8 md:p-12 text-white/90 font-serif relative">
                                <h2 className="text-4xl md:text-5xl font-bold mb-8 border-b-2 border-dashed border-white/20 pb-4 inline-block">
                                    关于我 / About Me
                                </h2>
                                <div className="space-y-6 text-xl leading-relaxed opacity-90">
                                    <p>你好，我是 CYZ。</p>
                                    <p>欢迎来到这个由代码构建的数字房间。</p>
                                    <ul className="list-disc pl-6 space-y-2 opacity-80 text-lg">
                                        <li>全栈开发者 / 创造者</li>
                                        <li>热爱：动漫、电影、以及那些微小而美好的事物</li>
                                        <li>目前正在构建：Next.js 交互式个人主页</li>
                                    </ul>
                                </div>
                                <div className="absolute bottom-6 right-8 flex items-end gap-4 opacity-80">
                                    <div className="flex gap-1">
                                        <div className="w-2 h-12 bg-white rounded-sm rotate-12 shadow-sm" />
                                        <div className="w-2 h-10 bg-yellow-200 rounded-sm -rotate-6 shadow-sm" />
                                    </div>
                                    <div className="flex flex-col items-center gap-1 group cursor-pointer" onClick={() => setActiveModule('idle')}>
                                        <Eraser size={32} className="text-amber-200" />
                                        <span className="text-[10px] uppercase tracking-widest text-amber-200/50">Close</span>
                                    </div>
                                </div>
                                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 pointer-events-none mix-blend-overlay" />
                            </div>
                        </div>
                        <div className="absolute inset-0 -z-10" onClick={() => setActiveModule('idle')} />
                    </motion.div>
                )}
            </AnimatePresence>

        </div>
    );
}