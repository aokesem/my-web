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
          2. 装饰陈设：左上角艺术画框 (Art Gallery Frame)
         ========================================= */}
            <div className="absolute left-15 top-[10%] z-30 flex flex-col items-center">
                {/* 1. 挂钩/钉子 */}
                <div className="w-3 h-3 bg-zinc-600 rounded-full shadow-md z-10 relative">
                    <div className="absolute inset-1 bg-zinc-400 rounded-full" />
                </div>

                {/* 2. 挂绳 (V字型) */}
                <svg className="w-36 h-10 -mt-2.5 pointer-events-none" viewBox="0 0 100 40">
                    <path
                        d="M 50 5 L 15 38 M 50 5 L 85 38"
                        stroke="#5c3a21"
                        strokeWidth="1.5"
                        fill="none"
                        strokeLinecap="round"
                    />
                </svg>

                {/* 3. 画框本体 */}
                <motion.div
                    className="relative w-32 h-32 md:w-40 md:h-40 cursor-pointer group origin-top -mt-1"
                >
                    {/* 木质外框 (Walnut Wood) */}
                    <div className="absolute inset-0 bg-[#4a2e18] rounded-xs shadow-[0_15px_35px_rgba(0,0,0,0.3)] border-[5px] border-[#3a2514]">
                        {/* 木纹理叠加 */}
                        <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')]" />
                    </div>

                    {/* 金色内圈线 (Gold Detail) */}
                    <div className="absolute inset-[6px] border border-[#d4af37]/40 rounded-xs" />

                    {/* 画布区域 (Canvas) */}
                    <div className="absolute inset-[10px] bg-[#fdf6e3] rounded-xs overflow-hidden flex items-center justify-center p-4">
                        {/* 纸张纹理 */}
                        <div className="absolute inset-0 opacity-[0.15] bg-[url('https://www.transparenttextures.com/patterns/vignette.png')] pointer-events-none" />

                        {/* 名字/头像文字 */}
                        <span className="relative z-10 text-3xl md:text-4xl font-serif font-black tracking-tighter text-[#4a3b2a] opacity-90">
                            CYZ
                        </span>

                        {/* 内阴影，增加深邃感 */}
                        <div className="absolute inset-0 shadow-[inner_0_2px_10px_rgba(0,0,0,0.1)] pointer-events-none" />
                    </div>

                    {/* 整体玻璃高光感 */}
                    <div className="absolute inset-0 bg-linear-to-tr from-white/10 via-transparent to-transparent pointer-events-none rounded-xs" />
                </motion.div>
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