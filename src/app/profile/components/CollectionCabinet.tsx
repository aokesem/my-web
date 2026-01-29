"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Clock,
    Check,
    Play,
    Square,
    Footprints,
    Coffee,
    Citrus,
    Dumbbell,
    BookOpen,
    Film
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';

// === 类型定义 ===
interface RoutineItem {
    id: number;
    key: string; // 数据库中的 key，用于匹配图标
    label: string; // 数据库中的 label
    isCompleted: boolean; // 根据日志计算得出
}

// === 图标映射表 ===
// 这里的 key 必须与数据库 profile_habits 表中的 key 字段对应
const ICON_MAP: Record<string, { icon: any, color: string, bg: string }> = {
    walking: { icon: Footprints, color: 'text-emerald-500', bg: 'bg-emerald-50/50' },
    drink: { icon: Coffee, color: 'text-amber-600', bg: 'bg-amber-50/50' },
    fruit: { icon: Citrus, color: 'text-yellow-500', bg: 'bg-yellow-50/50' },
    sports: { icon: Dumbbell, color: 'text-rose-500', bg: 'bg-rose-50/50' },
    reading: { icon: BookOpen, color: 'text-blue-500', bg: 'bg-blue-50/50' },
    media: { icon: Film, color: 'text-purple-500', bg: 'bg-purple-50/50' },
    // 默认兜底配置，防止数据库加了新key但前端没配图标
    default: { icon: Clock, color: 'text-slate-500', bg: 'bg-slate-50/50' }
};

interface CollectionCabinetProps {
    isActive: boolean;
    onToggle: () => void;
    isAdmin: boolean;
}

// === 子组件：翻页数字 (保持不变) ===
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
                <div className="absolute w-full h-px bg-slate-200/50 top-1/2 z-20" />
            </div>
            <span className={`font-mono text-slate-400 uppercase tracking-widest font-black ${large ? 'text-[11px]' : 'text-[9px]'}`}>{label}</span>
        </div>
    );
};

export default function CollectionCabinet({ isActive, onToggle, isAdmin }: CollectionCabinetProps) {
    // 状态：习惯列表
    const [routines, setRoutines] = useState<RoutineItem[]>([]);

    // 计时器状态 (保持本地)
    const [isTimerActive, setIsTimerActive] = useState(false);
    const [startTime, setStartTime] = useState<number | null>(null);
    const [elapsedSeconds, setElapsedSeconds] = useState(0);
    const [currentTask, setCurrentTask] = useState("");

    // 获取今天的日期字符串 (YYYY-MM-DD)，用于数据库查询
    // 使用 toLocaleDateString 避免时区问题导致“今天”变成“昨天”
    const getTodayStr = () => {
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    // [核心] 初始化数据
    useEffect(() => {
        const fetchRoutines = async () => {
            const today = getTodayStr();

            // 1. 获取所有习惯定义
            const { data: habits } = await supabase
                .from('profile_habits')
                .select('*')
                .order('sort_order', { ascending: true });

            if (!habits) return;

            // 2. 获取今天的打卡记录
            const { data: logs } = await supabase
                .from('profile_habit_logs')
                .select('habit_id')
                .eq('completed_at', today);

            // 创建一个 Set 方便快速查找哪些 ID 已经完成了
            const completedIds = new Set(logs?.map((log: any) => log.habit_id));

            // 3. 合并数据
            const mappedRoutines = habits.map((h: any) => ({
                id: h.id,
                key: h.key,
                label: h.label,
                isCompleted: completedIds.has(h.id)
            }));

            setRoutines(mappedRoutines);
        };
        fetchRoutines();
    }, []);

    // 计时器逻辑
    useEffect(() => {
        let timer: any;
        if (isTimerActive && startTime) {
            timer = setInterval(() => {
                setElapsedSeconds(Math.floor((Date.now() - startTime) / 1000));
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [isTimerActive, startTime]);

    const days = Math.floor(elapsedSeconds / (24 * 3600));
    const hours = Math.floor((elapsedSeconds % (24 * 3600)) / 3600);
    const minutes = Math.floor((elapsedSeconds % 3600) / 60);

    const handleStart = () => {
        if (!isAdmin) return toast.warning("只有本人才能修改状态");
        const taskName = prompt("请输入当前计时的任务：");
        if (!taskName || taskName.trim() === "") return;
        setCurrentTask(taskName);
        setStartTime(Date.now());
        setIsTimerActive(true);
    };

    const handleEnd = () => {
        if (!isAdmin) return toast.warning("只有本人才能修改状态");
        setIsTimerActive(false);
        setElapsedSeconds(0);
        setStartTime(null);
    };

    // [核心] 切换打卡状态
    const toggleRoutine = async (id: number, currentCompleted: boolean) => {
        if (!isAdmin) return toast.warning("只有本人才能修改状态");
        const today = getTodayStr();

        // 1. 乐观更新 UI
        setRoutines(prev => prev.map(r =>
            r.id === id ? { ...r, isCompleted: !currentCompleted } : r
        ));

        if (!currentCompleted) {
            // 动作：打卡 (Insert)
            const { error } = await supabase
                .from('profile_habit_logs')
                .insert({ habit_id: id, completed_at: today });

            if (error) console.error("Check-in failed:", error);
        } else {
            // 动作：取消打卡 (Delete)
            const { error } = await supabase
                .from('profile_habit_logs')
                .delete()
                .eq('habit_id', id)
                .eq('completed_at', today);

            if (error) console.error("Uncheck failed:", error);
        }
    };

    const completedCount = routines.filter(r => r.isCompleted).length;
    const totalCount = routines.length;

    return (
        <motion.div
            layout
            transition={{ type: "spring", stiffness: 100, damping: 22, mass: 1.2 }}
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
                    /* 1. 收起态：悬浮翻页时钟 */
                    <motion.div
                        key="clock-view-idle"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="absolute inset-0 flex flex-col items-center justify-center -mb-8 overflow-hidden"
                    >
                        <div className="mb-4 flex flex-col items-center gap-1 relative z-10">
                            <span className="text-[11px] font-bold text-slate-400 tracking-widest uppercase italic">
                                {isTimerActive ? `RUNNING: ${currentTask}` : "DAILY_ROUTINE"}
                            </span>
                        </div>

                        <div className="flex items-center gap-4 relative z-10">
                            <FlipUnit value={days} label="Days" large />
                            <div className="text-2xl font-black text-slate-200 -mt-6">:</div>
                            <FlipUnit value={hours} label="Hours" large />
                            <div className="text-2xl font-black text-slate-200 -mt-6">:</div>
                            <FlipUnit value={minutes} label="Mins" large />
                        </div>
                    </motion.div>
                ) : (
                    /* 2. 展开态：每日清单矩阵 */
                    <motion.div
                        key="shelf-view-active"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex flex-col h-full overflow-hidden relative"
                    >
                        <div className="absolute inset-0 opacity-[0.02] pointer-events-none bg-[repeating-linear-gradient(-45deg,#000,#000_2px,transparent_2px,transparent_15px)]" />

                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0 relative z-10 bg-white/40 backdrop-blur-sm">
                            <div className="flex items-center gap-3">
                                <Check size={20} className="text-emerald-500" />
                                <span className="font-mono font-bold text-slate-500 tracking-[0.2em] uppercase text-sm">
                                    日常清单 // DAILY_ROUTINE
                                </span>
                            </div>

                            <div className="flex items-center gap-2">
                                <AnimatePresence mode="wait">
                                    {!isTimerActive ? (
                                        <motion.button
                                            key="btn-start"
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.8 }}
                                            onClick={(e) => { e.stopPropagation(); handleStart(); }}
                                            className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold hover:bg-blue-100 transition-colors"
                                        >
                                            <Play size={14} fill="currentColor" />
                                            START TIMER
                                        </motion.button>
                                    ) : (
                                        <motion.button
                                            key="btn-end"
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.8 }}
                                            onClick={(e) => { e.stopPropagation(); handleEnd(); }}
                                            className="flex items-center gap-2 px-3 py-1.5 bg-rose-50 text-rose-500 rounded-lg text-xs font-bold hover:bg-rose-100 transition-colors"
                                        >
                                            <Square size={14} fill="currentColor" />
                                            STOP ({currentTask})
                                        </motion.button>
                                    )}
                                </AnimatePresence>
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
                                <div className="flex flex-col">
                                    <h2 className="text-2xl font-black text-slate-800 tracking-wider uppercase">Today's Check</h2>
                                    <p className="text-xs text-slate-400 font-medium mt-1">坚持完成每日小事，保持生活节奏</p>
                                </div>
                                <div className="flex flex-col items-end">
                                    <span className="font-mono text-emerald-500 text-lg font-black">{completedCount} / {totalCount}</span>
                                    <span className="font-mono text-[9px] text-slate-300 uppercase tracking-tighter">Status: {totalCount > 0 && completedCount === totalCount ? 'PERFECT' : 'IN_PROGRESS'}</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                                {routines.length > 0 ? (
                                    routines.map((routine) => {
                                        // 根据数据库的 key 查找图标配置，找不到就用默认的
                                        const config = ICON_MAP[routine.key] || ICON_MAP.default;
                                        const isDone = routine.isCompleted;
                                        const Icon = config.icon;

                                        return (
                                            <button
                                                key={routine.id}
                                                onClick={() => toggleRoutine(routine.id, isDone)}
                                                className={`
                                                    group relative flex items-center gap-4 p-5 rounded-3xl border-2 transition-all duration-300
                                                    ${isDone
                                                        ? 'bg-white border-emerald-500 shadow-lg shadow-emerald-500/10'
                                                        : 'bg-slate-50 border-slate-100 hover:border-slate-200 hover:bg-white'}
                                                `}
                                            >
                                                <div className={`
                                                    w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500
                                                    ${isDone ? config.bg : 'bg-white shadow-inner'}
                                                `}>
                                                    <Icon size={28} className={isDone ? config.color : 'text-slate-300'} />
                                                </div>

                                                <div className="flex flex-col items-start min-w-0">
                                                    <span className={`text-sm font-bold transition-colors ${isDone ? 'text-slate-800' : 'text-slate-400'}`}>
                                                        {routine.label}
                                                    </span>
                                                    <span className={`text-[10px] font-black uppercase tracking-widest mt-0.5 ${isDone ? 'text-emerald-500' : 'text-slate-300'}`}>
                                                        {isDone ? 'Completed' : 'Todo'}
                                                    </span>
                                                </div>

                                                {isDone && (
                                                    <div className="ml-auto">
                                                        <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center text-white">
                                                            <Check size={14} strokeWidth={4} />
                                                        </div>
                                                    </div>
                                                )}
                                            </button>
                                        );
                                    })
                                ) : (
                                    <div className="col-span-full py-10 text-center text-slate-400 font-mono text-sm">
                                        Loading Habits...
                                    </div>
                                )}
                            </div>

                            <div className="mt-12 p-6 bg-slate-50/50 rounded-2xl border border-slate-100 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm">
                                        <Clock size={16} className="text-blue-500" />
                                    </div>
                                    <p className="text-xs text-slate-500 font-medium italic">
                                        "完成比完美更重要。如果还没做，现在就开始吧。"
                                    </p>
                                </div>
                                <div className="flex gap-1">
                                    {/* 这里简单展示5个点，或者也可以根据 totalCount 动态生成 */}
                                    {Array.from({ length: totalCount > 0 ? totalCount : 5 }).slice(0, 5).map((_, i) => (
                                        <div key={i} className={`w-1.5 h-1.5 rounded-full ${i < completedCount ? 'bg-emerald-400' : 'bg-slate-200'}`} />
                                    ))}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}