"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Clock,
    Star,
    Coffee,
    Pizza,
    Heart,
    Check,
    Box,
    Plus,
    Play,
    Square
} from 'lucide-react';

// === 类型定义 ===
type ItemType = 'star' | 'tea' | 'banana' | 'trophy' | 'heart';

interface CollectionItem {
    id: string;
    type: ItemType;
    desc: string;
    date: string;
}

const ITEM_CONFIG: Record<ItemType, { icon: any, color: string, label: string }> = {
    star: { icon: Star, color: 'text-amber-400', label: '星星' },
    tea: { icon: Coffee, color: 'text-emerald-500', label: '茶' },
    banana: { icon: Pizza, color: 'text-yellow-400', label: '香蕉' },
    trophy: { icon: Check, color: 'text-blue-500', label: '奖杯' },
    heart: { icon: Heart, color: 'text-rose-400', label: '爱心' },
};

interface CollectionCabinetProps {
    isActive: boolean;
    onToggle: () => void;
}

// === 子组件：翻页数字 (可调尺寸) ===
const FlipUnit = ({ value, label, large = false }: { value: number, label: string, large?: boolean }) => {
    return (
        <div className="flex flex-col items-center gap-1.5">
            <div className={`
                relative bg-white rounded-xl overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.08)] border border-slate-100 flex items-center justify-center
                ${large ? 'w-16 h-24 md:w-20 md:h-28' : 'w-12 h-16'}
            `}>
                <div className="absolute inset-0 flex flex-col">
                    <div className="h-1/2 bg-slate-50/50 border-b border-slate-100" />
                    <div className="h-1/2 bg-white" />
                </div>
                <span className={`relative z-10 font-mono font-bold text-slate-700 tabular-nums ${large ? 'text-4xl md:text-5xl' : 'text-3xl'}`}>
                    {value.toString().padStart(2, '0')}
                </span>
                {/* 装饰横线 */}
                <div className="absolute w-full h-px bg-slate-200/50 top-1/2 z-20" />
            </div>
            <span className={`font-mono text-slate-400 uppercase tracking-widest font-black ${large ? 'text-[11px]' : 'text-[9px]'}`}>{label}</span>
        </div>
    );
};

export default function CollectionCabinet({ isActive, onToggle }: CollectionCabinetProps) {
    const [collections, setCollections] = useState<CollectionItem[]>([
        { id: '1', type: 'star', desc: '完成了网站的基础架构重构', date: '2026-01-26' },
        { id: '2', type: 'tea', desc: '下午专注阅读了 2 小时', date: '2026-01-27' },
    ]);

    const [isTimerActive, setIsTimerActive] = useState(false);
    const [startTime, setStartTime] = useState<number | null>(null);
    const [elapsedSeconds, setElapsedSeconds] = useState(0);
    const [currentTask, setCurrentTask] = useState("");
    const [showAddForm, setShowAddForm] = useState(false);

    const days = Math.floor(elapsedSeconds / (24 * 3600));
    const hours = Math.floor((elapsedSeconds % (24 * 3600)) / 3600);
    const minutes = Math.floor((elapsedSeconds % 3600) / 60);

    useEffect(() => {
        let timer: any;
        if (isTimerActive && startTime) {
            timer = setInterval(() => {
                setElapsedSeconds(Math.floor((Date.now() - startTime) / 1000));
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [isTimerActive, startTime]);

    const handleStart = () => {
        const taskName = prompt("请输入当前任务：") || "未命名任务";
        setCurrentTask(taskName);
        setStartTime(Date.now());
        setIsTimerActive(true);
    };

    const handleEnd = () => {
        setIsTimerActive(false);
        if (confirm("任务已结束，是否要添加一个收藏到柜子中？")) {
            setShowAddForm(true);
            if (!isActive) onToggle();
        }
        setElapsedSeconds(0);
        setStartTime(null);
    };

    const addCollection = (type: ItemType, desc: string) => {
        const newItem: CollectionItem = {
            id: Date.now().toString(),
            type,
            desc,
            date: new Date().toISOString().split('T')[0]
        };
        setCollections(prev => [...prev, newItem]);
        setShowAddForm(false);
    };

    const TopRightIcon = collections.length > 0
        ? ITEM_CONFIG[collections[collections.length - 1].type].icon
        : Star;

    return (
        <motion.div
            layout
            transition={{
                type: "spring",
                stiffness: 100,
                damping: 22,
                mass: 1.2
            }}
            onClick={!isActive ? onToggle : undefined}
            className={`
                fixed flex flex-col overflow-hidden
                ${isActive
                    ? 'z-50 inset-10 md:inset-x-[20%] md:inset-y-[15%] backdrop-blur-xl bg-white/80 border border-white/60 rounded-3xl shadow-lg ring-1 ring-slate-900/5'
                    : 'z-30 bottom-[6%] right-[2.5%] w-[360px] h-[200px] cursor-pointer bg-transparent border-none shadow-none ring-0'
                }
            `}
        >
            <AnimatePresence mode="wait">
                {!isActive ? (
                    /* 1. 收起态：对齐工具箱的悬浮时钟 */
                    <motion.div
                        key="clock-view-idle"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="absolute inset-0 flex flex-col items-center justify-center -mb-8"
                    >
                        {/* 顶部任务小字 */}
                        <div className="mb-4 flex flex-col items-center gap-1">
                            <span className="text-[11px] font-bold text-slate-400 tracking-widest uppercase italic">
                                {isTimerActive ? `TRACKING: ${currentTask}` : "暂无任务"}
                            </span>
                        </div>

                        <div className="flex items-center gap-4">
                            <FlipUnit value={days} label="Days" large />
                            <div className="text-2xl font-black text-slate-200 mt-8">:</div>
                            <FlipUnit value={hours} label="Hours" large />
                            <div className="text-2xl font-black text-slate-200 mt-8">:</div>
                            <FlipUnit value={minutes} label="Mins" large />
                        </div>
                    </motion.div>
                ) : (
                    /* 2. 展开态：包含控制按钮的柜子面版 */
                    <motion.div
                        key="shelf-view-active"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex flex-col h-full overflow-hidden"
                    >
                        {/* 顶部栏 */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
                            <div className="flex items-center gap-3">
                                <Clock size={20} className="text-slate-400" />
                                <span className="font-mono font-bold text-slate-500 tracking-[0.2em] uppercase text-sm">
                                    收藏柜 // CABINET
                                </span>
                            </div>

                            <div className="flex items-center gap-2">
                                {/* 计时控制器移至此处 */}
                                {!isTimerActive ? (
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleStart(); }}
                                        className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold hover:bg-blue-100 transition-colors"
                                    >
                                        <Play size={14} fill="currentColor" />
                                        START
                                    </button>
                                ) : (
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleEnd(); }}
                                        className="flex items-center gap-2 px-3 py-1.5 bg-rose-50 text-rose-500 rounded-lg text-xs font-bold hover:bg-rose-100 transition-colors"
                                    >
                                        <Square size={14} fill="currentColor" />
                                        END SESSION
                                    </button>
                                )}
                                <div className="w-px h-4 bg-slate-200 mx-2" />
                                <button
                                    onClick={(e) => { e.stopPropagation(); onToggle(); }}
                                    className="p-1 px-3 rounded-full bg-slate-100 text-[10px] font-black text-slate-400 hover:bg-slate-200 transition-colors uppercase tracking-widest"
                                >
                                    Minimize
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 p-8 overflow-y-auto custom-scrollbar">
                            <div className="flex items-baseline justify-between mb-8">
                                <h2 className="text-2xl font-black text-slate-800 tracking-wider">ACHIEVEMENT_SHELF</h2>
                                <span className="font-mono text-slate-400 text-xs font-bold">{collections.length} UNITS COLLECTED</span>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                {collections.map((item) => {
                                    const Config = ITEM_CONFIG[item.type];
                                    return (
                                        <div key={item.id} className="group/item bg-white border border-slate-100 rounded-2xl p-5 flex flex-col items-center gap-4 hover:shadow-xl hover:-translate-y-1 transition-all">
                                            <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center shadow-inner relative overflow-hidden">
                                                <div className="absolute inset-0 bg-linear-to-b from-white/50 to-transparent opacity-20" />
                                                <Config.icon size={32} className={Config.color} />
                                            </div>
                                            <div className="text-center">
                                                <p className="text-sm font-bold text-slate-700 leading-snug line-clamp-2">{item.desc}</p>
                                                <p className="text-[10px] font-mono text-slate-400 mt-2 uppercase tracking-tighter">{item.date}</p>
                                            </div>
                                        </div>
                                    );
                                })}

                                {showAddForm && (
                                    <div className="col-span-full bg-blue-50/50 border-2 border-dashed border-blue-200 rounded-3xl p-6 flex flex-col gap-4">
                                        <span className="text-xs font-black text-blue-600 uppercase tracking-[0.2em]">New Achievement Detected</span>
                                        <div className="flex gap-4">
                                            {(Object.keys(ITEM_CONFIG) as ItemType[]).map(type => (
                                                <button
                                                    key={type}
                                                    onClick={() => addCollection(type, prompt("描述一下这次收藏：") || "达成目标")}
                                                    className="w-12 h-12 flex items-center justify-center bg-white rounded-xl hover:bg-blue-600 hover:text-white transition-all text-slate-400 shadow-sm border border-slate-100"
                                                >
                                                    {React.createElement(ITEM_CONFIG[type].icon, { size: 20 })}
                                                </button>
                                            ))}
                                            <button onClick={() => setShowAddForm(false)} className="ml-auto px-4 py-2 text-xs font-bold text-slate-400 hover:text-slate-600 uppercase tracking-widest">Later</button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
