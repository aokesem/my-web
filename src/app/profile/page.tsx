"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import WindowView from './components/WindowView';
import HobbySystem from './components/HobbySystem';

export default function ProfilePage() {
    const [isWindowOpen, setIsWindowOpen] = useState(false);

    // 状态：'idle' | 'hobby'
    const [activeModule, setActiveModule] = useState<'idle' | 'hobby'>('idle');

    const [isMounted, setIsMounted] = useState(false);
    useEffect(() => { setIsMounted(true); }, []);
    if (!isMounted) return null;

    return (
        <div className="relative w-screen h-screen overflow-hidden bg-[#eaf4ec] flex items-center justify-center">

            {/* =========================================
          1. 顶部区域：标题 & 状态 (可隐藏)
         ========================================= */}
            <motion.div
                // 当 activeModule 不为 idle 时，向上偏移并淡出
                animate={{
                    opacity: activeModule === 'idle' ? 1 : 0,
                    y: activeModule === 'idle' ? 0 : -50,
                    pointerEvents: activeModule === 'idle' ? 'auto' : 'none'
                }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
                className="absolute top-[6%] z-20 flex flex-col items-center gap-4"
            >
                <h1 className="text-3xl md:text-5xl font-bold text-[#3a5a40] tracking-widest drop-shadow-sm font-serif opacity-90">
                    欢迎来到CYZ的小屋
                </h1>
                {/* 状态栏 */}
                <div className="flex items-center gap-4 bg-white/60 backdrop-blur-sm px-6 py-2 rounded-full border border-white/40 shadow-sm">
                    <div className="flex gap-2">
                        <div className="w-3 h-3 rounded-full bg-[#ff5f57] border border-[#e0443e]" />
                        <div className="w-3 h-3 rounded-full bg-[#febc2e] border border-[#d89e24]" />
                        <div className="w-3 h-3 rounded-full bg-[#28c840] border border-[#1aab29] animate-pulse" />
                    </div>
                    <div className="w-px h-4 bg-zinc-400/30" />
                    <span className="text-sm font-serif italic text-[#3a5a40]/80 tracking-wide">
                        "今日心情：像窗外的云一样自由。"
                    </span>
                </div>
            </motion.div>

            {/* =========================================
          2. 固定陈设：左上角头像 (永远可见)
         ========================================= */}
            <div className="absolute left-0 top-[25%] z-30">
                <div className="w-48 h-4 bg-[#8b5a2b] rounded-r-lg shadow-[0_10px_20px_rgba(0,0,0,0.15)] relative">
                    <div className="absolute inset-0 bg-black/10 rounded-r-lg" style={{ backgroundImage: 'linear-gradient(90deg, transparent 50%, rgba(0,0,0,0.05) 50%)', backgroundSize: '4px 4px' }} />
                    <div className="absolute left-10 top-4 w-4 h-8 bg-[#6b4226] skew-x-12 opacity-80" />
                    <div className="absolute left-32 top-4 w-4 h-8 bg-[#6b4226] skew-x-12 opacity-80" />
                </div>

                <div className="absolute bottom-4 left-10 w-24 h-24 md:w-28 md:h-28 rounded-full border-[6px] border-white shadow-[0_10px_10px_rgba(0,0,0,0.2)] overflow-hidden bg-zinc-100 group hover:-translate-y-1 hover:scale-105 transition-all duration-300 origin-bottom cursor-pointer">
                    <div className="absolute inset-0 bg-linear-to-tr from-zinc-200 to-zinc-100 flex items-center justify-center text-zinc-400 font-bold text-2xl">
                        CYZ
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-tr from-white/40 via-transparent to-transparent pointer-events-none" />
                </div>
            </div>

            {/* =========================================
          3. 交互陈设：爱好架子 (Hobby Shelf)
         ========================================= */}

            <HobbySystem
                isActive={activeModule === 'hobby'}
                onToggle={() => setActiveModule(prev => prev === 'hobby' ? 'idle' : 'hobby')}
            />

            {/* =========================================
          4. 背景层 (Background)
         ========================================= */}

            {/* 窗户：只有它会变模糊 */}
            <div className={`transition-all duration-700 ${activeModule !== 'idle' ? 'pointer-events-none' : ''}`}>
                <WindowView
                    isOpen={isWindowOpen}
                    onToggle={() => setIsWindowOpen(!isWindowOpen)}
                    isBlurred={activeModule !== 'idle'}
                />
            </div>

            {/* 遮罩层：点击背景关闭放大状态 */}
            {activeModule !== 'idle' && (
                <div
                    className="absolute inset-0 z-40 bg-black/10"
                    onClick={() => setActiveModule('idle')}
                />
            )}

        </div>
    );
}