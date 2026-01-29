"use client";

import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Link from 'next/link';
import { Origami } from 'lucide-react';
import WindowView from './components/WindowView';
import HobbySystem from './components/HobbySystem';
import TimelineWidget from './components/TimelineWidget';
import DailyProtocol from './components/DailyProtocol';
import ToolboxWidget from './components/ToolboxWidget';
import CollectionCabinet from './components/CollectionCabinet'; // [新增] 引入柜子组件

// === 格言数据 ===
const QUOTES = [
    { text: "种一棵树最好的时间是十年前，其次是现在" },
    { text: "Less is more" },
    { text: "Calm-Think-Improve" },
    { text: "专注胜于一切" },
];

export default function ProfilePage() {
    const [isWindowOpen, setIsWindowOpen] = useState(false);
    // 状态：'idle' | 'hobby' | 'timeline' | 'protocol' | 'toolbox' | 'cabinet'
    const [activeModule, setActiveModule] = useState<'idle' | 'hobby' | 'timeline' | 'protocol' | 'toolbox' | 'cabinet'>('idle');
    const [quoteIndex, setQuoteIndex] = useState(0);
    const [backBtnHover, setBackBtnHover] = useState(false);

    const handleNextQuote = () => {
        setQuoteIndex((prev) => (prev + 1) % QUOTES.length);
    };

    // --- 自动切换格言逻辑 ---
    useEffect(() => {
        // 使用 setTimeout 并监听 quoteIndex，实现“手动切换后重新计秒”的效果
        const timer = setTimeout(() => {
            setQuoteIndex((prev) => (prev + 1) % QUOTES.length);
        }, 5000);
        return () => clearTimeout(timer);
    }, [quoteIndex]);

    // const [isMounted, setIsMounted] = useState(false);
    // useEffect(() => { setIsMounted(true); }, []);
    // if (!isMounted) return null;

    return (
        <div className="relative w-screen h-screen overflow-hidden bg-[#f8fafc] flex items-center justify-center text-slate-800 selection:bg-blue-200/50">
            {/* 环境光 / 背景渐变 - 明亮洁净 */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,#ffffff_0%,#f1f5f9_70%)] opacity-100 pointer-events-none" />

            {/* 浅色网格背景 - 增加实验室感 */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-size-[40px_40px] opacity-40 pointer-events-none" />

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
                className="absolute top-[8%] z-40 flex flex-col items-center gap-6"
            >
                <div className="relative flex items-center justify-center min-w-[300px] md:min-w-[600px]">
                    {/* 返回按钮 - 绝对定位，不影响标题居中 */}
                    <Link
                        href="/"
                        onMouseEnter={() => setBackBtnHover(true)}
                        onMouseLeave={() => setBackBtnHover(false)}
                        className="absolute right-[calc(50%+13rem)] hidden md:flex items-center gap-4 px-5 py-2.5 rounded-2xl transition-all duration-500 group translate-y-8 overflow-hidden backdrop-blur-xl"
                        style={{
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 10px 15px -3px rgba(0, 0, 0, 0.1), inset 0 1px 1px rgba(255,255,255,0.8)'
                        }}
                    >
                        {/* 物理模块背景 - 带厚度感 */}
                        <motion.div
                            className="absolute inset-0 bg-linear-to-b from-white/90 to-slate-50/80 rounded-2xl border-t border-l border-white border-b border-r transition-all duration-500"
                            animate={{
                                backgroundColor: backBtnHover ? 'rgba(239, 246, 255, 0.95)' : 'rgba(255, 255, 255, 0.9)',
                                boxShadow: backBtnHover ? '0 20px 25px -5px rgba(0, 0, 0, 0.1)' : '0 10px 15px -3px rgba(0, 0, 0, 0.05)'
                            }}
                        />

                        {/* 蓝光漫反射 - 现作为内部底层光泽 */}
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(59,130,246,0.05),transparent_70%)]" />

                        {/* 反光光效 (Shimmer Effect) - 使用蓝光且受状态控制 */}
                        <motion.div
                            className="absolute inset-0 z-20 pointer-events-none"
                            initial={{ x: '-150%', skewX: -25 }}
                            animate={{ x: backBtnHover ? '150%' : '-150%' }}
                            transition={{ duration: 0.8, ease: "easeInOut" }}
                            style={{
                                background: 'linear-gradient(90deg, transparent, rgba(59, 130, 246, 0.3), transparent)',
                            }}
                        />

                        <div className="flex flex-col items-end relative z-10">
                            <span className="text-[9px] font-mono text-slate-400 leading-none tracking-[0.2em] mb-1">SYSTEM_BACK</span>
                            <span className="text-[13px] font-bold text-slate-700 tracking-tighter uppercase whitespace-nowrap">
                                [ <span className="text-blue-600/60 uppercase group-hover:text-blue-600 transition-colors">Lab_Archive</span> ]
                            </span>
                        </div>
                        <div className="relative z-10 text-slate-700/80 group-hover:text-slate-900 transition-colors">
                            <Origami size={28} className="stroke-[1.5] group-hover:rotate-12 transition-transform" />
                            {/* 图标处的额外呼吸点燃效果 */}
                            <motion.div
                                className="absolute -inset-1 bg-blue-400/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                animate={{ scale: [1, 1.2, 1] }}
                                transition={{ repeat: Infinity, duration: 2 }}
                            />
                        </div>
                    </Link>

                    <h1 className="text-3xl md:text-5xl font-bold tracking-tighter text-slate-800 font-sans uppercase drop-shadow-sm px-10">
                        CYZ's <span className="font-mono text-blue-600">Room</span>
                    </h1>
                </div>

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
            <div className="absolute left-10 md:left-25 top-[2%] z-30 flex flex-col items-center">
                <motion.div
                    className="relative w-32 h-32 md:w-65 md:h-45 cursor-pointer group"
                    whileHover={{ scale: 1.05 }}
                    transition={{ duration: 0.4 }}
                >
                    {/* 边框发光 (浅蓝) */}
                    <div className="absolute -inset-0.5 bg-linear-to-tr from-blue-200 to-purple-200 rounded-xl blur-sm opacity-0 group-hover:opacity-100 transition-all duration-500" />

                    {/* 金属外框 (银白) */}
                    <div className="absolute inset-0 bg-white rounded-xl border border-slate-200 shadow-xl overflow-hidden ring-1 ring-slate-100">

                        {/* --- A. 头像层 --- */}
                        <div className="relative w-full h-full bg-slate-100">
                            {/* 这里请替换为您真实的头像路径 */}
                            <img
                                src="images/浅井惠.png"
                                alt="Avatar"
                                className="w-full h-full object-cover transition-all duration-700 filter grayscale contrast-125 group-hover:grayscale-0 group-hover:contrast-100"
                            />
                            {/* 蓝色电子滤镜遮罩 (悬停时消失) */}
                            <div className="absolute inset-0 bg-blue-500/10 mix-blend-overlay transition-opacity duration-700 group-hover:opacity-0" />
                        </div>

                        {/* --- B. 扫描线与纹理 --- */}
                        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_50%,rgba(0,0,0,0.05)_50%)] bg-size-[100%_4px] pointer-events-none z-20 opacity-50" />

                        {/* 角落装饰 */}
                        <div className="absolute top-2 left-2 w-1 h-1 bg-white rounded-full z-40 shadow-sm" />
                        <div className="absolute top-2 right-2 w-1 h-1 bg-white rounded-full z-40 shadow-sm" />
                    </div>

                    {/* --- 新增：侧边暗纹文字 (出处提示) --- */}
                    <div className="absolute left-[105%] top-2 flex flex-col gap-3 pointer-events-none whitespace-nowrap">
                        <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400/40 group-hover:text-slate-800 transition-colors duration-500">
                            <div className="w-1 h-3 bg-blue-500/20" />
                            <span className="tracking-[0.3em] uppercase">From</span>
                        </div>
                        <div className="flex flex-col text-[14px] font-medium text-slate-400/30 group-hover:text-blue-800 transition-colors duration-700 leading-relaxed">
                            <span className="tracking-widest [writing-mode:vertical-lr]">重启咲良田</span>
                            <div className="h-4 w-px bg-slate-200 my-1 ml-1.5" />
                            <span className="tracking-widest [writing-mode:vertical-lr]">浅井惠</span>
                        </div>
                    </div>
                </motion.div>

                {/* 悬浮连接线装饰 */}
                <div className="h-10 w-px bg-linear-to-b from-slate-300 to-transparent mt-4" />
            </div>

            {/* =========================================
          2.5 悬浮：HUD 科技标注 (DATA_ANNOTATION) -> 交互式格言卡片
         ========================================= */}
            <div className="absolute left-10 md:left-12 top-[15.5%] z-20 select-none">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 1 }}
                    className="relative flex items-start"
                >
                    {/* 1. HUD 引线系统 */}
                    <svg width="40" height="120" className="opacity-35 overflow-visible pointer-events-none">
                        <line x1="52" y1="-70" x2="1" y2="-30" stroke="#3b82f6" strokeWidth="1" />
                        <line x1="1" y1="-30" x2="1" y2="80" stroke="#3b82f6" strokeWidth="1" />
                        <line x1="1" y1="80" x2="30" y2="110" stroke="#3b82f6" strokeWidth="1" />
                        <motion.circle
                            key={quoteIndex}
                            r="2"
                            fill="#3b82f6"
                            animate={{
                                cx: [52, 1, 1, 30],
                                cy: [-70, -30, 80, 110],
                                opacity: [0, 1, 1, 0]
                            }}
                            transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
                        />
                    </svg>

                    {/* 2. 数据展示块 (固定高度，防止跳动) */}
                    <div className="mt-20 -ml-2 pointer-events-auto cursor-pointer" onClick={handleNextQuote}>
                        <motion.div
                            initial={{ x: -10, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: 0.5 }}
                            className="bg-white/20 backdrop-blur-xs p-5 border-l-2 border-blue-400 group hover:bg-white/10 transition-colors rounded-r-lg shadow-sm h-[140px] w-[320px] flex flex-col justify-between"
                        >
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
                                <span className="text-[12px] font-mono text-slate-400 tracking-widest uppercase">Phrase Collection // 0{quoteIndex + 1}</span>
                            </div>

                            <div className="relative flex-1 flex flex-col justify-center">
                                <AnimatePresence mode="wait">
                                    <motion.div
                                        key={quoteIndex}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        transition={{ duration: 0.3 }}
                                        className="w-full"
                                    >
                                        <p className="text-[22px] leading-snug text-slate-600 font-serif italic">
                                            {QUOTES[quoteIndex].text}
                                        </p>
                                    </motion.div>
                                </AnimatePresence>
                            </div>

                            {/* --- 新增：格言进度指示器 (显示跟着数据走) --- */}
                            <div className="flex gap-1 mt-4">
                                {QUOTES.map((_, i) => (
                                    <div
                                        key={i}
                                        className={`h-1 rounded-full transition-all duration-300 ${i === quoteIndex ? 'w-6 bg-blue-500' : 'w-2 bg-slate-200'
                                            }`}
                                    />
                                ))}
                            </div>
                        </motion.div>

                        <div className="h-10 ml-37 w-px bg-linear-to-b from-slate-300 to-transparent mt-0 relative z-50 -translate-y-[20px] pointer-events-none" />
                    </div>
                </motion.div>
            </div>

            {/* =========================================
          Right Column 1: 时间线 (Timeline Widget)
         ========================================= */}
            <TimelineWidget
                isActive={activeModule === 'timeline'}
                onToggle={() => setActiveModule(prev => prev === 'timeline' ? 'idle' : 'timeline')}
            />

            {/* =========================================
          Right Column 2: 每日计划 (Daily Protocol)
         ========================================= */}
            <DailyProtocol
                isActive={activeModule === 'protocol'}
                onToggle={() => setActiveModule(prev => prev === 'protocol' ? 'idle' : 'protocol')}
            />

            {/* =========================================
          Right Column 3: 工具箱 (Toolbox)
         ========================================= */}
            {/* [新增] 工具箱模块 */}
            <ToolboxWidget
                isActive={activeModule === 'toolbox'}
                onToggle={() => setActiveModule(prev => prev === 'toolbox' ? 'idle' : 'toolbox')}
            />

            {/* =========================================
          Right Column 4: 收藏柜 (Collection Cabinet)
         ========================================= */}
            {/* [新增] 收藏柜模块 */}
            <CollectionCabinet
                isActive={activeModule === 'cabinet'}
                onToggle={() => setActiveModule(prev => prev === 'cabinet' ? 'idle' : 'cabinet')}
            />

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