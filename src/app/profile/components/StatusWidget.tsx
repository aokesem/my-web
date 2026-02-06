"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Cpu, Wifi, X, Sun, Battery, ShieldCheck, ChevronLeft, ChevronRight, BookOpen, Heart, Brain } from 'lucide-react';

interface StatusWidgetProps {
    isActive: boolean;
    isIdle: boolean;
    onToggle: () => void;
}

type TabType = 'learning' | 'body' | 'mind';
const TAB_ORDER: TabType[] = ['learning', 'body', 'mind'];

export default function StatusWidget({ isActive, isIdle, onToggle }: StatusWidgetProps) {
    const [activeTab, setActiveTab] = useState<TabType>('learning');

    // 如果既不是 active 也不是 idle（即其他模块打开了），则隐藏
    if (!isActive && !isIdle) return null;

    const handlePrevTab = () => {
        const currentIndex = TAB_ORDER.indexOf(activeTab);
        const prevIndex = (currentIndex - 1 + TAB_ORDER.length) % TAB_ORDER.length;
        setActiveTab(TAB_ORDER[prevIndex]);
    };

    const handleNextTab = () => {
        const currentIndex = TAB_ORDER.indexOf(activeTab);
        const nextIndex = (currentIndex + 1) % TAB_ORDER.length;
        setActiveTab(TAB_ORDER[nextIndex]);
    };

    return (
        <>
            {/* 
                动画逻辑修改：
                为了实现“从正上方飞下来”的效果，我们需要断开 layoutId 连接。
                Idle 状态和 Expanded 状态不再共享 layoutId。
                Expanded 状态使用独立的 initial/animate/exit 定义。
            */}

            {/* 1. Idle Container */}
            {!isActive && isIdle && (
                <motion.div
                    onClick={onToggle}
                    layoutId="status-idle-pill" // 保留 Idle 内部的 layoutId 只是为了平滑 mounts? 其实不需要
                    className="relative z-40 cursor-pointer pointer-events-auto"
                >
                    <div className="flex items-center gap-4 bg-white/70 backdrop-blur-md px-6 py-2 rounded-full border border-slate-200 shadow-lg shadow-slate-200/50 hover:bg-white/90 transition-colors">
                        <div className="flex gap-2">
                            <div className="w-2 h-2 rounded-full bg-slate-300" />
                            <div className="w-2 h-2 rounded-full bg-slate-300" />
                            <div className={`w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)] animate-pulse`} />
                        </div>
                        <div className="w-px h-3 bg-slate-300" />
                        <span className="text-xs font-mono text-slate-500 tracking-widest uppercase whitespace-nowrap">
                            Status: <span className="text-blue-600 font-semibold">Daylight</span>
                        </span>
                    </div>
                </motion.div>
            )}

            {/* 2. Expanded Container (Portal-like root level) */}
            <AnimatePresence>
                {isActive && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
                        <motion.div
                            initial={{ y: -600, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: -600, opacity: 0 }}
                            transition={{
                                type: "spring",
                                stiffness: 80,
                                damping: 15,
                                mass: 1.1
                            }}
                            className="w-[90vw] md:w-[1000px] h-auto md:h-[800px] bg-white/90 backdrop-blur-xl rounded-3xl border border-white/60 shadow-2xl overflow-hidden pointer-events-auto flex flex-col relative"
                        >
                            {/* --- Header Area --- */}
                            <div className="flex items-center justify-between px-8 py-6 border-b border-slate-100/80 shrink-0">
                                <div className="flex items-center gap-3">
                                    <Activity size={20} className="text-blue-500" />
                                    <h3 className="font-mono font-bold text-slate-600 tracking-[0.2em] uppercase">System Status</h3>
                                </div>

                                {/* Center Tabs */}
                                <div className="absolute left-1/2 -translate-x-1/2 bg-slate-100/50 p-1 rounded-full flex gap-1 items-center">
                                    <button
                                        onClick={() => setActiveTab('learning')}
                                        className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-300 tracking-wider ${activeTab === 'learning' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                    >
                                        学习
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('body')}
                                        className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-300 tracking-wider ${activeTab === 'body' ? 'bg-white text-green-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                    >
                                        身体
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('mind')}
                                        className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-300 tracking-wider ${activeTab === 'mind' ? 'bg-white text-purple-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                    >
                                        心绪
                                    </button>
                                </div>

                                <button
                                    onClick={(e) => { e.stopPropagation(); onToggle(); }}
                                    className="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {/* --- Main Content Area --- */}
                            <div className="flex-1 relative flex">
                                {/* Left Nav Button */}
                                <button
                                    onClick={handlePrevTab}
                                    className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/50 border border-slate-100 shadow-sm text-slate-400 hover:text-blue-500 hover:scale-110 hover:bg-white transition-all z-20"
                                >
                                    <ChevronLeft size={24} />
                                </button>

                                {/* Right Nav Button */}
                                <button
                                    onClick={handleNextTab}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/50 border border-slate-100 shadow-sm text-slate-400 hover:text-blue-500 hover:scale-110 hover:bg-white transition-all z-20"
                                >
                                    <ChevronRight size={24} />
                                </button>

                                {/* Content Switcher */}
                                <div className="flex-1 p-8 md:p-12 overflow-y-auto">
                                    <AnimatePresence mode="wait">
                                        <motion.div
                                            key={activeTab}
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -20 }}
                                            transition={{ duration: 0.3 }}
                                            className="h-full flex flex-col"
                                        >
                                            {activeTab === 'learning' && (
                                                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                                                    <div className="bg-blue-50/50 rounded-2xl p-10 flex flex-col items-center justify-center text-center border border-blue-100/50 h-full">
                                                        <div className="relative mb-6">
                                                            <div className="absolute inset-0 bg-blue-400 blur-2xl opacity-20 rounded-full" />
                                                            <BookOpen size={80} className="text-blue-500 relative z-10" />
                                                        </div>
                                                        <h2 className="text-4xl font-black text-slate-800 tracking-tight mb-2">LEARNING</h2>
                                                        <p className="font-mono text-sm text-blue-400 uppercase tracking-widest">Knowledge Acquisition</p>
                                                    </div>
                                                    <div className="space-y-4">
                                                        <div className="p-6 rounded-2xl bg-white border border-slate-100 shadow-sm">
                                                            <div className="flex justify-between items-end mb-2">
                                                                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Current Focus</span>
                                                                <span className="text-2xl font-black text-blue-600">React</span>
                                                            </div>
                                                            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                                                <div className="h-full w-[75%] bg-blue-500 rounded-full" />
                                                            </div>
                                                        </div>
                                                        <div className="p-6 rounded-2xl bg-white border border-slate-100 shadow-sm">
                                                            <div className="flex justify-between items-end mb-2">
                                                                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Weekly Goals</span>
                                                                <span className="text-2xl font-black text-slate-700">12/15</span>
                                                            </div>
                                                            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                                                <div className="h-full w-[80%] bg-slate-400 rounded-full" />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {activeTab === 'body' && (
                                                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                                                    <div className="bg-green-50/50 rounded-2xl p-10 flex flex-col items-center justify-center text-center border border-green-100/50 h-full">
                                                        <div className="relative mb-6">
                                                            <div className="absolute inset-0 bg-green-400 blur-2xl opacity-20 rounded-full" />
                                                            <Activity size={80} className="text-green-500 relative z-10" />
                                                        </div>
                                                        <h2 className="text-4xl font-black text-slate-800 tracking-tight mb-2">BODY</h2>
                                                        <p className="font-mono text-sm text-green-500 uppercase tracking-widest">Physical Condition</p>
                                                    </div>
                                                    <div className="space-y-4">
                                                        <div className="p-6 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-center gap-4">
                                                            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                                                                <Battery size={24} />
                                                            </div>
                                                            <div>
                                                                <div className="text-xs text-slate-400 uppercase font-bold tracking-wider">Energy Level</div>
                                                                <div className="text-xl font-bold text-slate-700">High / 92%</div>
                                                            </div>
                                                        </div>
                                                        <div className="p-6 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-center gap-4">
                                                            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
                                                                <Activity size={24} />
                                                            </div>
                                                            <div>
                                                                <div className="text-xs text-slate-400 uppercase font-bold tracking-wider">Sleep Cycle</div>
                                                                <div className="text-xl font-bold text-slate-700">7h 30m</div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {activeTab === 'mind' && (
                                                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                                                    <div className="bg-purple-50/50 rounded-2xl p-10 flex flex-col items-center justify-center text-center border border-purple-100/50 h-full">
                                                        <div className="relative mb-6">
                                                            <div className="absolute inset-0 bg-purple-400 blur-2xl opacity-20 rounded-full" />
                                                            <Brain size={80} className="text-purple-500 relative z-10" />
                                                        </div>
                                                        <h2 className="text-4xl font-black text-slate-800 tracking-tight mb-2">MIND</h2>
                                                        <p className="font-mono text-sm text-purple-500 uppercase tracking-widest">Mental Clarity</p>
                                                    </div>
                                                    <div className="space-y-4">
                                                        <div className="p-6 rounded-2xl bg-white border border-slate-100 shadow-sm">
                                                            <div className="flex justify-between items-center mb-4">
                                                                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Stress Level</span>
                                                                <span className="px-2 py-1 bg-green-100 text-green-600 text-xs font-bold rounded-md">LOW</span>
                                                            </div>
                                                            <div className="flex gap-1 h-3">
                                                                {[...Array(10)].map((_, i) => (
                                                                    <div key={i} className={`flex-1 rounded-sm ${i < 2 ? 'bg-green-400' : 'bg-slate-100'}`} />
                                                                ))}
                                                            </div>
                                                        </div>
                                                        <div className="p-6 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-center gap-4">
                                                            <div className="w-12 h-12 rounded-full bg-pink-100 flex items-center justify-center text-pink-500">
                                                                <Heart size={24} />
                                                            </div>
                                                            <div>
                                                                <div className="text-xs text-slate-400 uppercase font-bold tracking-wider">Mood</div>
                                                                <div className="text-xl font-bold text-slate-700">Calm & Focused</div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </motion.div>
                                    </AnimatePresence>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="px-8 py-4 border-t border-slate-100/50 flex items-center justify-between text-[10px] font-mono text-slate-300 uppercase shrink-0">
                                <span>ID: 29FF-76F1-1096</span>
                                <span>Status: {activeTab.toUpperCase()}</span>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
}
