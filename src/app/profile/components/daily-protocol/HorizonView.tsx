"use client";

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Archive, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Task, CATEGORY_CONFIG } from './types';

interface HorizonViewProps {
    tasks: Task[];
}

export default function HorizonView({ tasks }: HorizonViewProps) {

    const calculateProgress = (start: string, end?: string) => {
        if (!end) return 0;
        const s = new Date(start).getTime();
        const e = new Date(end).getTime();
        const t = new Date().getTime();
        if (t <= s) return 0;
        if (t >= e) return 100;
        return ((t - s) / (e - s)) * 100;
    };

    const calculatePosition = (nodeDate: string, start: string, end?: string) => {
        if (!end) return 0;
        const s = new Date(start).getTime();
        const e = new Date(end).getTime();
        const n = new Date(nodeDate).getTime();
        if (n <= s) return 0;
        if (n >= e) return 100;
        return ((n - s) / (e - s)) * 100;
    };

    const fmt = (d: string) => d.replace(/-/g, '.');

    // todayStr 用本地日期字符串，与 milestone.date 格式一致
    const todayStr = (() => {
        const d = new Date();
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
    })();

    /** 与 Board 左侧「进行中 ▶」一致：仅展示 status === in_progress 且带 deadline 的任务 */
    const { horizonTasks, withDeadline } = useMemo(() => {
        const wd = tasks.filter(t => t.deadline);
        const ht = tasks.filter(t => t.deadline && t.status === 'in_progress');
        return { horizonTasks: ht, withDeadline: wd };
    }, [tasks]);

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="h-full flex flex-col p-8 overflow-y-auto subtle-scrollbar"
        >
            <div className="space-y-12 max-w-6xl mx-auto w-full">
                {horizonTasks.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-20 text-slate-300 px-4">
                        <Archive size={48} className="opacity-20 mb-4" />
                        {withDeadline.length === 0 ? (
                            <p className="text-sm font-mono tracking-widest uppercase text-center">
                                No Long-term Goals Set with Deadlines
                            </p>
                        ) : (
                            <>
                                <p className="text-sm font-bold text-slate-500 text-center tracking-tight">
                                    暂无进行中的长期任务
                                </p>
                                <p className="text-xs text-slate-400 mt-3 max-w-md text-center leading-relaxed">
                                    在 Board 中将带 Deadline 的任务切换为进行中（左侧 ▶）后，会在此显示 Horizon 时间轴。
                                </p>
                            </>
                        )}
                    </div>
                )}
                {horizonTasks.map(task => {
                    const progress = calculateProgress(task.startDate, task.deadline);
                    const config = CATEGORY_CONFIG[task.category];
                    const milestones = task.milestones ?? [];

                    return (
                        <div key={task.id} className="relative flex flex-col gap-4 group pb-8 border-b border-slate-100 last:border-0">
                            {/* 标题行 */}
                            <div className="flex items-center gap-3">
                                <div className={cn("w-2 h-2 rounded-full", config.indicator)} />
                                <h3 className="text-lg font-bold text-slate-700 tracking-tight">{task.title}</h3>
                                <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded uppercase tracking-widest">{task.task_type}</span>
                            </div>

                            {/* 时间轴主区域 */}
                            <div className="relative">

                                {/*
                                ── 间距调整说明 ──
                                · 名称离 pin 的距离  → 改 h-10（名称层高度，越大越远）
                                · pin 离轨道的距离   → 改 h-14（轨道层高度，越大 pin 越高）
                                · 日期离轨道的距离   → 改 h-5（日期层高度，越小越近）
                                */}

                                {/* ── 层 1：名称层 (h-10) ── */}
                                <div className="relative h-10 flex items-end">
                                    {milestones.map(ms => {
                                        // 与 TODAY 同一天则不显示名称（TODAY 覆盖）
                                        if (ms.date === todayStr) return null;
                                        const pos = calculatePosition(ms.date, task.startDate, task.deadline);
                                        return (
                                            <div
                                                key={ms.id}
                                                className="absolute bottom-0 -translate-x-1/2"
                                                style={{ left: `${pos}%` }}
                                            >
                                                <span className="text-xs font-bold text-slate-600 whitespace-nowrap leading-tight">
                                                    {ms.title}
                                                </span>
                                            </div>
                                        );
                                    })}
                                    {/* TODAY 标签 — z-10 覆盖 */}
                                    <div
                                        className="absolute bottom-0 -translate-x-1/2 z-10"
                                        style={{ left: `${progress}%` }}
                                    >
                                        <span className="text-xs font-black text-blue-500 whitespace-nowrap leading-tight">TODAY</span>
                                    </div>
                                </div>

                                {/* ── 层 2：轨道层 (h-14)，pin 底部触及轨道线 ── */}
                                <div className="relative h-14">
                                    {/* 背景轨道 */}
                                    <div className="absolute top-1/2 -translate-y-1/2 inset-x-0 h-2 bg-slate-100 rounded-full" />
                                    {/* 已过去进度（深色） */}
                                    <div
                                        className={cn("absolute top-1/2 -translate-y-1/2 h-2 rounded-full transition-all duration-1000 opacity-80", config.indicator)}
                                        style={{ width: `${progress}%`, left: 0 }}
                                    />

                                    {/* Milestone MapPin — 轮廓样式，底部触及轨道 */}
                                    {milestones.map(ms => {
                                        if (ms.date === todayStr) return null; // TODAY 覆盖同日 milestone
                                        const pos = calculatePosition(ms.date, task.startDate, task.deadline);
                                        return (
                                            <div
                                                key={ms.id}
                                                className="absolute"
                                                style={{
                                                    left: `${pos}%`,
                                                    top: '50%',
                                                    transform: 'translate(-50%, -100%)'
                                                }}
                                            >
                                                <MapPin
                                                    size={26}
                                                    className={cn("transition-transform hover:scale-110", config.color)}
                                                    fill="none"
                                                    strokeWidth={2}
                                                />
                                            </div>
                                        );
                                    })}

                                    {/* TODAY MapPin — 轮廓，z-10，底部触及轨道 */}
                                    <div
                                        className="absolute z-10"
                                        style={{
                                            left: `${progress}%`,
                                            top: '50%',
                                            transform: 'translate(-50%, -100%)'
                                        }}
                                    >
                                        <MapPin
                                            size={28}
                                            className="text-blue-500"
                                            fill="none"
                                            strokeWidth={2}
                                        />
                                    </div>
                                </div>

                                {/* ── 层 3：日期层 (h-5，靠近轨道) ── */}
                                <div className="relative h-5 flex items-start">
                                    {/* Milestone 日期 */}
                                    {milestones.map(ms => {
                                        const pos = calculatePosition(ms.date, task.startDate, task.deadline);
                                        return (
                                            <div
                                                key={ms.id}
                                                className="absolute top-0 -translate-x-1/2"
                                                style={{ left: `${pos}%` }}
                                            >
                                                <span className="text-xs font-mono text-slate-400 whitespace-nowrap">{fmt(ms.date)}</span>
                                            </div>
                                        );
                                    })}
                                    {/* TODAY 日期 — z-10 */}
                                    <div
                                        className="absolute top-0 -translate-x-1/2 z-10"
                                        style={{ left: `${progress}%` }}
                                    >
                                        <span className="text-xs font-mono text-blue-400 whitespace-nowrap">{fmt(todayStr)}</span>
                                    </div>
                                </div>

                                {/* ── 层 4：起止日期栏 ── */}
                                <div className="flex justify-between items-center mt-3 px-1 font-mono">
                                    <div className="flex flex-col">
                                        <span className="text-xs text-slate-400 uppercase tracking-widest font-bold opacity-70">Start</span>
                                        <span className="text-sm text-slate-500 font-bold">{fmt(task.startDate)}</span>
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <span className="text-xs text-rose-400 uppercase tracking-widest font-bold opacity-80">Deadline</span>
                                        <span className="text-base text-rose-500 font-black">{fmt(task.deadline!)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </motion.div>
    );
}
