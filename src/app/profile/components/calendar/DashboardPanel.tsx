"use client";

import React, { useMemo } from 'react';
import { Activity as ActivityIcon, CheckCircle2, Zap, Flame } from 'lucide-react';
import { DayData, Deadline, formatDateKey, STATUS_COLORS } from './types';

interface DashboardPanelProps {
    calendarData: Record<string, DayData>;
    deadlines: Deadline[];
}

export default function DashboardPanel({ calendarData, deadlines }: DashboardPanelProps) {
    const today = useMemo(() => new Date(), []);
    const todayStr = useMemo(() => formatDateKey(today.getFullYear(), today.getMonth(), today.getDate()), [today]);

    // 1. 最近的一个未完成且非 2099 年的 Deadline
    const nextDeadline = useMemo(() => {
        const active = deadlines.filter(d =>
            !d.done &&
            d.date &&
            d.date !== '2099-12-31' &&
            d.date >= todayStr
        ).sort((a, b) => a.date!.localeCompare(b.date!));

        return active[0] || null;
    }, [deadlines, todayStr]);

    const daysUntilNextDeadline = useMemo(() => {
        if (!nextDeadline || !nextDeadline.date) return null;
        if (nextDeadline.date === todayStr) return 0;

        const targetDate = new Date(nextDeadline.date + 'T00:00:00');
        const todayDate = new Date(todayStr + 'T00:00:00');
        const diffTime = targetDate.getTime() - todayDate.getTime();
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }, [nextDeadline, todayStr]);

    // 过去 7 天的日期序列 (从 6天前 到 今天)
    const past7DaysKeys = useMemo(() => {
        const keys = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(d.getDate() - i);
            keys.push(formatDateKey(d.getFullYear(), d.getMonth(), d.getDate()));
        }
        return keys;
    }, [today]);

    // 2. 过去 7 天的状态走势 (只取有状态的，或者包含 null 显示为灰色空环)
    const past7DaysStatus = useMemo(() => {
        return past7DaysKeys.map(key => {
            const dayData = calendarData[key];
            return dayData?.status || null;
        });
    }, [past7DaysKeys, calendarData]);

    const goodDaysCount = past7DaysStatus.filter(s => s === 'good').length;

    // 3. 过去 7 天平均有效工作时长
    const avgDuration = useMemo(() => {
        let totalHours = 0;
        past7DaysKeys.forEach(key => {
            const dayData = calendarData[key];
            if (dayData && dayData.activities) {
                dayData.activities.forEach(act => {
                    if (act.duration != null && !act.start_time) {
                        totalHours += act.duration;
                    }
                });
            }
        });
        return (totalHours / 7).toFixed(1);
    }, [past7DaysKeys, calendarData]);

    return (
        <div className="w-[260px] bg-white/95 backdrop-blur-xl rounded-r-2xl border border-l-0 border-slate-200/80 flex flex-col overflow-hidden">
            {/* 标题栏 */}
            <div className="px-5 py-4 border-b border-slate-100 shrink-0">
                <div className="flex items-center gap-2">
                    <ActivityIcon size={16} className="text-amber-500" />
                    <span className="font-mono font-bold text-slate-500 tracking-[0.15em] uppercase text-xs">Overview</span>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-6 space-y-8">
                {/* 1. 下一个 Deadline */}
                <div className="space-y-3">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                        <Flame size={12} className="text-rose-400" />
                        Next Deadline
                    </div>
                    {nextDeadline ? (
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 shadow-sm">
                            <div className="text-sm font-semibold text-slate-800 leading-tight mb-2 truncate" title={nextDeadline.title}>
                                {nextDeadline.title}
                            </div>
                            <div className="flex items-end justify-between">
                                <span className="text-xs font-mono text-slate-400">{nextDeadline.date?.slice(5).replace('-', '/')}</span>
                                <div className="flex items-baseline gap-1">
                                    {daysUntilNextDeadline === 0 ? (
                                        <span className="text-rose-500 font-black text-lg">TODAY</span>
                                    ) : (
                                        <>
                                            <span className="text-rose-500 font-black text-2xl leading-none">{daysUntilNextDeadline}</span>
                                            <span className="text-[10px] text-rose-400 font-mono font-bold">DAYS LEFT</span>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-slate-50 border border-slate-200 border-dashed rounded-xl p-4 text-center">
                            <span className="text-sm text-slate-400 font-medium">All clear! No upcoming deadlines.</span>
                        </div>
                    )}
                </div>

                {/* 2. 过去 7 天状态 */}
                <div className="space-y-3">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                        <CheckCircle2 size={12} className="text-blue-400" />
                        Past 7 Days Status
                    </div>
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col items-center gap-3">
                        <div className="flex items-center gap-2.5">
                            {past7DaysStatus.map((status, i) => {
                                const isToday = i === 6;
                                if (!status) {
                                    return (
                                        <div key={i} className={`w-4 h-4 rounded-full border border-slate-300 bg-slate-100 ${isToday ? 'scale-125 ring-2 ring-slate-200 ring-offset-1 ring-offset-white' : ''}`} />
                                    );
                                }
                                return (
                                    <div
                                        key={i}
                                        className={`w-4 h-4 rounded-full ${STATUS_COLORS[status].bg} shadow-sm ${isToday ? `scale-125 ring-2 ${STATUS_COLORS[status].ring} ring-offset-1 ring-offset-white` : ''}`}
                                        title={STATUS_COLORS[status].label}
                                    />
                                );
                            })}
                        </div>
                        <div className="text-xs font-mono text-slate-400 tracking-wider">
                            <span className="text-emerald-500 font-bold">{goodDaysCount}</span> GOOD DAYS
                        </div>
                    </div>
                </div>

                {/* 3. 过去 7 天日均时长 */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                        <div className="flex items-center gap-1.5">
                            <Zap size={12} className="text-amber-400" />
                            Avg Daily Work (7d)
                        </div>
                    </div>
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 shadow-sm flex items-center justify-center">
                        <div className="flex items-baseline gap-1.5 text-amber-500">
                            <span className="font-black text-4xl tracking-tighter">{avgDuration}</span>
                            <span className="font-mono font-bold text-sm text-amber-500/80">hrs</span>
                        </div>
                    </div>
                </div>

            </div>

            <div className="px-5 py-3 border-t border-slate-100 shrink-0 text-center">
                <span className="text-[9px] font-mono font-bold tracking-widest text-slate-300 uppercase">Monthly Dashboard</span>
            </div>
        </div>
    );
}
