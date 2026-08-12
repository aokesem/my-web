"use client";

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Archive } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Task, CATEGORY_CONFIG } from './types';

interface HorizonViewProps {
    tasks: Task[]; // Usually just a single task now
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

    // 任务截止日期或 milestone 任一存在时，都可以形成有效时间轴。
    const horizonTasks = useMemo(
        () => tasks.filter(task => task.deadline || (task.milestones?.length || 0) > 0),
        [tasks]
    );

    const TOTAL_BLOCKS = 14;

    const fmt = (d: string) => d.replace(/-/g, '.');

    // todayStr 用本地日期字符串
    const todayStr = (() => {
        const d = new Date();
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
    })();

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col w-full"
        >
            <div className="w-full space-y-4">
                {horizonTasks.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-6 text-slate-300">
                        <Archive size={24} className="opacity-20 mb-2" />
                        <p className="text-[10px] font-mono tracking-widest uppercase text-center">
                            No Timeline Set
                        </p>
                    </div>
                )}

                {horizonTasks.map(task => {
                    // === 计算当前阶段逻辑 ===
                    const milestones = [...(task.milestones || [])].sort((a, b) => {
                        const aEnd = new Date(a.end_date || a.date).getTime();
                        const bEnd = new Date(b.end_date || b.date).getTime();
                        return aEnd - bEnd;
                    });
                    let activeTitle = "Overall Progress";
                    let activeStart = task.startDate;
                    let activeEnd = task.deadline || task.startDate;

                    if (milestones.length > 0) {
                        const todayTime = new Date(todayStr).getTime();

                        // 1. 当前进行中的 milestone；重叠时优先选择截止更近的。
                        const currentMs = milestones.find(m => {
                            const s = new Date(m.date).getTime();
                            const e = new Date(m.end_date || m.date).getTime();
                            return todayTime >= s && todayTime <= e;
                        });

                        // 2. 没有进行中项时，选择截止日期最近的未来 milestone。
                        const upcomingMs = milestones.find(m =>
                            new Date(m.date).getTime() > todayTime
                        );

                        // 3. 全部结束后，回退到最近结束的一项。
                        const latestPastMs = [...milestones].reverse().find(m =>
                            new Date(m.end_date || m.date).getTime() < todayTime
                        );

                        const activeMilestone = currentMs || upcomingMs || latestPastMs;
                        if (activeMilestone) {
                            activeTitle = activeMilestone.title;
                            activeStart = activeMilestone.date;
                            activeEnd = activeMilestone.end_date || activeMilestone.date;
                        }
                    }

                    const progress = calculateProgress(activeStart, activeEnd);
                    const config = CATEGORY_CONFIG[task.category];
                    
                    // 计算需要点亮的小方块数量
                    const filledCount = Math.round((progress / 100) * TOTAL_BLOCKS);

                    return (
                        <div key={task.id} className="flex flex-col w-full">
                            {/* 居中标题与右上角进度 */}
                            <div className="flex items-end justify-between mb-4">
                                <div className="w-16 shrink-0"></div> {/* 占位以保持标题居中平衡，加大占位防止挤压标题 */}
                                <span className="text-base md:text-lg font-black text-slate-700 tracking-wide text-center flex-1 truncate px-2">
                                    {activeTitle}
                                </span>
                                <span className="text-sm md:text-base font-mono font-black tracking-wider w-16 text-right shrink-0 whitespace-nowrap">
                                    <span className="text-amber-500">{filledCount}</span> 
                                    <span className="text-slate-300 mx-1">/</span> 
                                    <span className="text-blue-500">{TOTAL_BLOCKS}</span>
                                </span>
                            </div>

                            {/* 胶囊进度条 */}
                            <div className="flex gap-1 items-center w-full">
                                {Array.from({ length: TOTAL_BLOCKS }).map((_, i) => {
                                    const isFilled = i < filledCount;
                                    return (
                                        <div 
                                            key={i}
                                            className={cn(
                                                "h-2.5 flex-1 rounded-full transition-colors duration-500",
                                                isFilled ? config.indicator : "bg-slate-200/50"
                                            )}
                                        />
                                    );
                                })}
                            </div>

                            {/* 固定的时间标签 (左、中、右)，拉开间距并加大字体 */}
                            <div className="flex justify-between items-center px-1 mt-6 text-sm font-mono font-bold uppercase tracking-widest">
                                <span className="text-blue-500">{fmt(activeStart)}</span>
                                <span className="text-amber-500">{fmt(todayStr)}</span>
                                <span className="text-rose-500">{fmt(activeEnd)}</span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </motion.div>
    );
}
