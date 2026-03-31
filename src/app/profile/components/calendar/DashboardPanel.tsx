"use client";

import React, { useMemo } from 'react';
import { Activity as ActivityIcon, CheckCircle2, Zap, Flame } from 'lucide-react';
import { DayData, DeadlineTimepoint, DeadlineItem, Activity, formatDateKey, STATUS_COLORS } from './types';

interface DashboardPanelProps {
    calendarData: Record<string, DayData>;
    deadlineTimepoints: DeadlineTimepoint[];
    deadlineItems: DeadlineItem[];
    allActivities: Activity[];
}

export default function DashboardPanel({ calendarData, deadlineTimepoints, deadlineItems, allActivities }: DashboardPanelProps) {
    const today = useMemo(() => new Date(), []);
    const todayStr = useMemo(() => formatDateKey(today.getFullYear(), today.getMonth(), today.getDate()), [today]);

    // 过去 7 天的日期序列 (从 7天前 到 昨天，不包含今天)
    const past7DaysKeys = useMemo(() => {
        const keys = [];
        for (let i = 7; i >= 1; i--) {
            const d = new Date(today);
            d.setDate(d.getDate() - i);
            keys.push(formatDateKey(d.getFullYear(), d.getMonth(), d.getDate()));
        }
        return keys;
    }, [today]);

    // 1. 最近的 Deadline 事项（含绝对最近及其后 2 天内的其他事项）
    const upcomingDeadlines = useMemo(() => {
        const archivedItemIds = new Set(deadlineItems.filter(i => i.is_archived).map(i => i.id));
        const active = deadlineTimepoints.filter(tp =>
            tp.date &&
            tp.date >= todayStr &&
            !archivedItemIds.has(tp.item_id)
        ).sort((a, b) => a.date.localeCompare(b.date));

        if (active.length === 0) return [];

        // 定位绝对最近的那天
        const firstDateStr = active[0].date;
        const firstDateObj = new Date(firstDateStr + 'T00:00:00');
        
        // 阈值：绝对最近那天的 2 天之内
        const thresholdDate = new Date(firstDateObj);
        thresholdDate.setDate(thresholdDate.getDate() + 2);
        const thresholdStr = formatDateKey(thresholdDate.getFullYear(), thresholdDate.getMonth(), thresholdDate.getDate());

        // 筛选出在 [firstDateStr, thresholdStr] 范围内的所有不同条目的截止点
        // 如果同一条目有多个点在这个窗口，我们只取最近的一个，或者按需求全列
        const seenItems = new Set<number>();
        const results = [];

        for (const tp of active) {
            if (tp.date > thresholdStr) break;
            if (!seenItems.has(tp.item_id)) {
                results.push({
                    timepoint: tp,
                    item: deadlineItems.find(i => i.id === tp.item_id),
                    daysLeft: (() => {
                        const targetDate = new Date(tp.date + 'T00:00:00');
                        const todayDate = new Date(todayStr + 'T00:00:00');
                        const diffTime = targetDate.getTime() - todayDate.getTime();
                        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    })()
                });
                seenItems.add(tp.item_id);
            }
        }

        return results;
    }, [deadlineTimepoints, deadlineItems, todayStr]);

    // 2. 活跃项目周汇总 (Weekly Focus)
    const activeItems = useMemo(() => {
        return deadlineItems.map(item => {
            const dayRecords = past7DaysKeys.map(dateKey => {
                const dayActs = allActivities.filter(a => a.deadline_item_id === item.id && a.date === dateKey);
                const hrs = dayActs.reduce((s, a) => s + (a.duration || 0), 0);
                return { dateKey, hasActivity: dayActs.length > 0, hours: hrs };
            });
            const totalHrs = dayRecords.reduce((s, d) => s + d.hours, 0);
            const activeDaysCount = dayRecords.filter(d => d.hasActivity).length;
            return { ...item, weeklyActivity: dayRecords, totalHrs, activeDaysCount };
        }).filter(item => item.activeDaysCount >= 2) // 仅显示本周活跃 >= 2 天的项目
          .sort((a, b) => b.totalHrs - a.totalHrs);
    }, [deadlineItems, allActivities, past7DaysKeys]);

    // 3. 过去 7 天的状态走势 (只取有状态的，或者包含 null 显示为灰色空环)
    const past7DaysStatus = useMemo(() => {
        return past7DaysKeys.map(key => {
            const dayData = calendarData[key];
            return dayData?.status || null;
        });
    }, [past7DaysKeys, calendarData]);

    const goodDaysCount = past7DaysStatus.filter(s => s === 'good').length;

    // 4. 过去 7 天平均有效工作时长
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
                {/* 1. 下一个 Deadline 窗口 (2天内) */}
                <div className="space-y-3">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                        <Flame size={12} className="text-rose-400" />
                        Upcoming Deadlines
                    </div>
                    {upcomingDeadlines.length > 0 ? (
                        <div className="space-y-2">
                            {upcomingDeadlines.map(({ timepoint, item, daysLeft }, idx) => {
                                const isPrimary = idx === 0;
                                return (
                                    <div key={timepoint.id} className={`${isPrimary ? 'bg-slate-50 border-slate-200 p-3 shadow-sm' : 'bg-slate-50/50 border-slate-100 p-2'} border rounded-xl`}>
                                        {item && (
                                            <div className="text-[10px] font-mono text-rose-400 uppercase tracking-wider mb-0.5">{item.title}</div>
                                        )}
                                        <div className={`${isPrimary ? 'text-sm' : 'text-xs'} font-semibold text-slate-800 leading-tight mb-1 truncate`} title={timepoint.label || timepoint.date}>
                                            {timepoint.label || timepoint.date.slice(5).replace('-', '/')}
                                        </div>
                                        <div className="flex items-end justify-between">
                                            <span className="text-[10px] font-mono text-slate-400">{timepoint.date.slice(5).replace('-', '/')}</span>
                                            <div className="flex items-baseline gap-1">
                                                {daysLeft === 0 ? (
                                                    <span className={`${isPrimary ? 'text-lg' : 'text-sm'} text-rose-500 font-black`}>TODAY</span>
                                                ) : (
                                                    <>
                                                        <span className={`${isPrimary ? 'text-2xl' : 'text-base'} text-rose-500 font-black leading-none`}>{daysLeft}</span>
                                                        <span className="text-[8px] text-rose-400 font-mono font-bold">DAYS LEFT</span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
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

                {/* 3. 重点项目活跃度 (New) */}
                {activeItems.length > 0 && (
                    <div className="space-y-3">
                        <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                            <Zap size={12} className="text-amber-500" />
                            Weekly Focus
                        </div>
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 shadow-sm space-y-2 max-h-[180px] overflow-y-auto">
                            {activeItems.map(item => (
                                <div key={item.id} className="flex items-center justify-between gap-2 h-6">
                                    <span className="text-[11px] font-medium text-slate-600 truncate flex-1" title={item.title}>
                                        {item.title}
                                    </span>
                                    <div className="flex gap-1 shrink-0">
                                        {item.weeklyActivity.map((d, i) => (
                                            <div
                                                key={i}
                                                className={`w-2.5 h-2.5 rounded-[1px] ${
                                                    d.hasActivity
                                                        ? d.hours >= 2 ? 'bg-amber-500' : d.hours >= 1 ? 'bg-amber-400' : 'bg-amber-300'
                                                        : 'bg-slate-200/50'
                                                }`}
                                                title={`${d.dateKey}: ${d.hours.toFixed(1)}h`}
                                            />
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* 4. 过去 7 天日均时长 */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                        <div className="flex items-center gap-1.5">
                            <Zap size={12} className="text-blue-500" />
                            Avg Daily Work (7d)
                        </div>
                    </div>
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 shadow-sm flex items-center justify-center">
                        <div className="flex items-baseline gap-1.5 text-blue-500">
                            <span className="font-black text-4xl tracking-tighter">{avgDuration}</span>
                            <span className="font-mono font-bold text-sm text-blue-500/80">hrs</span>
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
