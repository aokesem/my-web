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
        <div className="relative w-screen h-screen overflow-hidden bg-[#f8fafc] flex items-center justify-center text-slate-800 selection:bg-blue-200/50">
            
            {/* 环境光 / 背景渐变 - 明亮洁净 */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,#ffffff_0%,#f1f5f9_70%)] opacity-100 pointer-events-none" />
            
            {/* 浅色网格背景 - 增加实验室感 */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:40px_40px] opacity-40 pointer-events-none" />

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
                className="absolute top-[8%] z-20 flex flex-col items-center gap-6"
            >
                <h1 className="text-3xl md:text-5xl font-bold tracking-tighter text-slate-800 font-sans uppercase drop-shadow-sm">
                    CYZ's <span className="font-mono text-blue-600">Room</span>
                </h1>
                {/* 状态栏 */}
                <div className="flex items-center gap-4 bg-white/70 backdrop-blur-md px-6 py-2 rounded-full border border-slate-200 shadow-lg shadow-slate-200/50">
                    <div className="flex gap-2">
                        <div className="w-2 h-2 rounded-full bg-slate-300" />
                        <div className="w-2 h-2 rounded-full bg-slate-300" />
                        <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)] animate-pulse" />
                    </div>
                    <div className="w-px h-3 bg-slate-300" />
                    <span className="text-xs font-mono text-slate-500 tracking-widest uppercase">
                        Status: <span className="text-blue-600 font-semibold">Daylight</span>
                    </span>
                </div>
            </motion.div>

            {/* =========================================
          2. 装饰陈设：左上角数字相框 (Digital Frame) - 银白风格
         ========================================= */}
            <div className="absolute left-10 md:left-20 top-[12%] z-30 flex flex-col items-center">
                <motion.div
                    className="relative w-32 h-32 md:w-40 md:h-40 cursor-pointer group"
                    whileHover={{ scale: 1.05 }}
                    transition={{ duration: 0.4 }}
                >
                    {/* 边框发光 (浅蓝) */}
                    <div className="absolute -inset-0.5 bg-linear-to-tr from-blue-200 to-purple-200 rounded-xl blur-sm opacity-0 group-hover:opacity-100 transition-all duration-500" />
                    
                    {/* 金属外框 (银白) */}
                    <div className="absolute inset-0 bg-white rounded-xl border border-slate-200 shadow-xl flex items-center justify-center overflow-hidden">
                        
                        {/* 扫描线效果 (浅灰) */}
                        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_50%,rgba(0,0,0,0.03)_50%)] bg-[length:100%_4px] pointer-events-none z-20" />
                        
                        {/* 内容区域 */}
                        <div className="relative z-10 flex flex-col items-center justify-center">
                            <span className="text-4xl md:text-5xl font-black tracking-tighter text-slate-800 group-hover:text-blue-600 transition-colors duration-500">
                                CYZ
                            </span>
                            <span className="text-[9px] font-mono text-slate-400 tracking-[0.3em] uppercase mt-1">
                                Profile_ID
                            </span>
                        </div>

                        {/* 角落装饰 */}
                        <div className="absolute top-2 left-2 w-1 h-1 bg-slate-300 rounded-full" />
                        <div className="absolute top-2 right-2 w-1 h-1 bg-slate-300 rounded-full" />
                        <div className="absolute bottom-2 left-2 w-1 h-1 bg-slate-300 rounded-full" />
                        <div className="absolute bottom-2 right-2 w-1 h-1 bg-blue-500 rounded-full" />
                    </div>
                </motion.div>
                
                {/* 悬浮连接线装饰 */}
                <div className="h-16 w-px bg-linear-to-b from-slate-300 to-transparent mt-4" />
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
            <div className={`transition-all duration-1000 ${activeModule !== 'idle' ? 'pointer-events-none' : ''}`}>
                <WindowView
                    isOpen={isWindowOpen}
                    onToggle={() => setIsWindowOpen(!isWindowOpen)}
                    isBlurred={activeModule !== 'idle'}
                />
            </div>

            {/* 遮罩层：点击背景关闭放大状态 */}
            {activeModule !== 'idle' && (
                <div
                    className="absolute inset-0 z-40 bg-white/40 backdrop-blur-sm transition-all duration-700"
                    onClick={() => setActiveModule('idle')}
                />
            )}

        </div>
    );
}