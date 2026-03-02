"use client";

import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, X, Calendar, Plus, Trash2, Maximize } from 'lucide-react';
import { Activity, DayData, Deadline, DayStatus, formatDateKey, WEEKDAYS, MONTH_NAMES, MONTH_ABBR, STATUS_COLORS } from './types';

interface WeekViewPanelProps {
    viewYear: number;
    viewMonth: number;
    selectedDay: number;
    calendarData: Record<string, DayData>;
    allActivities: any[];
    deadlines: Deadline[];
    isAdmin: boolean;
    onClose: () => void;
    onToggleMode: () => void;
    onPrevWeek: () => void;
    onNextWeek: () => void;
    onSelectDay: (day: number, month: number, year: number) => void;
    onAddActivity: (dateKey: string, content: string, start: string, end: string, color: string, dayOfWeek: number, recurUntil: string | null) => Promise<void>;
    onRemoveActivity: (id: number) => Promise<void>;
    isFullscreen?: boolean;
    onToggleFullscreen?: () => void;
}

const HOURS = Array.from({ length: 14 }, (_, i) => i + 8); // 8:00 to 21:00
const ROW_HEIGHT = 60; // 60px per hour

export default function WeekViewPanel({
    viewYear,
    viewMonth,
    selectedDay,
    calendarData,
    allActivities,
    deadlines,
    isAdmin,
    onClose,
    onToggleMode,
    onPrevWeek,
    onNextWeek,
    onSelectDay,
    onAddActivity,
    onRemoveActivity,
    isFullscreen = false,
    onToggleFullscreen
}: WeekViewPanelProps) {
    const today = useMemo(() => new Date(), []);

    // Calculate the start of the current selected week (Monday as start)
    const selectedDate = useMemo(() => new Date(viewYear, viewMonth, selectedDay), [viewYear, viewMonth, selectedDay]);

    const weekDates = useMemo(() => {
        const d = new Date(selectedDate);
        const dayOfWeek = d.getDay();
        const diff = d.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
        const startOfWeek = new Date(d.getFullYear(), d.getMonth(), diff);

        const dates = [];
        for (let i = 0; i < 7; i++) {
            const date = new Date(startOfWeek);
            date.setDate(startOfWeek.getDate() + i);
            dates.push(date);
        }
        return dates;
    }, [selectedDate]);

    const weekStartYear = weekDates[0].getFullYear();

    // 当前选中的星期 index (0=一 ... 6=日)
    const selectedDayIndex = useMemo(() => {
        const sel = new Date(viewYear, viewMonth, selectedDay);
        const dow = sel.getDay();
        return dow === 0 ? 6 : dow - 1;
    }, [viewYear, viewMonth, selectedDay]);

    const [newActivity, setNewActivity] = useState('');
    const [newStart, setNewStart] = useState('09:00');
    const [newEnd, setNewEnd] = useState('10:00');
    const [newColor, setNewColor] = useState('bg-blue-500');
    const [newRecurUntil, setNewRecurUntil] = useState('');

    const handleAdd = async () => {
        if (!newActivity.trim() || !newStart || !newEnd) return;

        if (newStart >= newEnd) {
            alert("结束时间必须晚于开始时间");
            return;
        }

        const targetDate = weekDates[selectedDayIndex];
        const dateKey = formatDateKey(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
        // 只有填了截止日期才设 day_of_week（重复），否则按一次性事项处理
        const dayOfWeek = newRecurUntil ? selectedDayIndex : null;
        await onAddActivity(dateKey, newActivity, newStart, newEnd, newColor, dayOfWeek as any, newRecurUntil || null);
        setNewActivity('');
    };

    const isToday = (d: Date) => d.getFullYear() === today.getFullYear() && d.getMonth() === today.getMonth() && d.getDate() === today.getDate();
    const isSelected = (d: Date) => d.getFullYear() === viewYear && d.getMonth() === viewMonth && d.getDate() === selectedDay;
    const hasDeadline = (dateKey: string) => deadlines.some(d => d.date === dateKey);

    const parseTime = (timeStr: string) => {
        const [h, m] = timeStr.split(':').map(Number);
        return h + m / 60;
    };

    // 为每一天收集应显示的事项（一次性 + 重复的）
    const getActivitiesForDate = (date: Date, dayIndex: number): Activity[] => {
        const dateKey = formatDateKey(date.getFullYear(), date.getMonth(), date.getDate());
        const result: Activity[] = [];

        for (const act of allActivities) {
            if (!act.start_time || !act.end_time) continue; // 周历只显示有时间的

            if (act.day_of_week != null && act.recur_until) {
                // 重复事项：检查 day_of_week 匹配 且 日期在 [act.date, recur_until] 范围内
                if (act.day_of_week !== dayIndex) continue;
                // 用字符串比较避免时区问题
                if (dateKey < act.date) continue; // 还没到开始日
                if (dateKey > act.recur_until) continue; // 已过期
                result.push(act);
            } else {
                // 一次性事项：精确日期匹配
                if (act.date === dateKey) {
                    result.push(act);
                }
            }
        }

        return result;
    };

    const COLORS = [
        { name: 'blue', class: 'bg-blue-500' },
        { name: 'emerald', class: 'bg-emerald-500' },
        { name: 'rose', class: 'bg-rose-500' },
        { name: 'amber', class: 'bg-amber-500' },
        { name: 'purple', class: 'bg-purple-500' }
    ];

    return (
        <div className={`bg-white/95 backdrop-blur-xl flex flex-col ${isFullscreen ? 'w-full h-full max-h-full rounded-xl overflow-hidden shadow-2xl' : 'w-[90vw] md:w-[820px] border border-slate-200/80 overflow-hidden'}`}>
            {/* 顶部栏：全屏模式下隐藏 */}
            {!isFullscreen && (
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
                    <div className="flex items-center gap-2.5">
                        <Calendar size={18} className="text-blue-400" />
                        <span className="font-mono font-bold text-slate-500 tracking-[0.15em] uppercase text-sm">Weekly View</span>
                    </div>

                    {/* 周次导航（居中） */}
                    <div className="flex items-center gap-4">
                        <button onClick={onPrevWeek} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
                            <ChevronLeft size={20} />
                        </button>
                        <h3 className="text-xl font-black text-slate-700 tracking-tight min-w-[200px] text-center">
                            {`${weekDates[0].getMonth() + 1}/${weekDates[0].getDate()} - ${weekDates[6].getMonth() + 1}/${weekDates[6].getDate()}`}
                            <span className="text-blue-500 ml-2">{weekStartYear}</span>
                        </h3>
                        <button onClick={onNextWeek} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
                            <ChevronRight size={20} />
                        </button>
                    </div>

                    <div className="flex items-center gap-2">
                        {!isFullscreen && onToggleFullscreen && (
                            <button
                                onClick={onToggleFullscreen}
                                className="p-1.5 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                                title="全屏进入快照模式"
                            >
                                <Maximize size={16} />
                            </button>
                        )}
                        {!isFullscreen && (
                            <>
                                <button
                                    onClick={onToggleMode}
                                    className="px-3 py-1.5 text-xs font-bold rounded-md bg-slate-100 hover:bg-slate-200 text-slate-500 transition-colors"
                                >
                                    月历模式
                                </button>
                                <button
                                    onClick={onClose}
                                    className="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-all hover:rotate-90"
                                >
                                    <X size={18} />
                                </button>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* 可滚动内容区 */}
            <div className="flex-1 overflow-y-auto flex flex-col">
                {/* 头部日期行 */}
                {isFullscreen ? (
                    /* 全屏极简日期行～24px */
                    <div className="flex border-b border-slate-100 shrink-0 py-1">
                        <div className="w-14 shrink-0" />
                        <div className="flex-1 grid grid-cols-7">
                            {weekDates.map((date, i) => {
                                const tod = isToday(date);
                                return (
                                    <div key={i} className="flex flex-col items-center justify-center gap-1 py-1.5">
                                        <span className={`text-[11px] font-bold uppercase tracking-widest ${tod ? 'text-blue-500' : 'text-slate-400'}`}>{WEEKDAYS[i]}</span>
                                        <span className={`text-sm font-semibold ${tod ? 'text-blue-500' : 'text-slate-600'}`}>{date.getMonth() + 1}/{date.getDate()}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ) : (
                    <div className="flex border-b border-slate-100 shrink-0 pr-6">
                        <div className="w-14 shrink-0"></div> {/* 左侧时间轴占位 */}
                        <div className="flex-1 grid grid-cols-7">
                            {weekDates.map((date, i) => {
                                const sel = isSelected(date);
                                const tod = isToday(date);
                                return (
                                    <button
                                        key={i}
                                        onClick={() => onSelectDay(date.getDate(), date.getMonth(), date.getFullYear())}
                                        className={`relative flex flex-col items-center py-2 transition-colors ${sel ? 'bg-blue-50/50' : 'hover:bg-slate-50'}`}
                                    >
                                        <span className={`text-[11px] font-bold uppercase tracking-wider mb-1 ${sel ? 'text-blue-500' : 'text-slate-400'}`}>{WEEKDAYS[i]}</span>
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${sel ? 'bg-blue-500 text-white shadow-md' : tod ? 'text-blue-500 bg-blue-50' : 'text-slate-700'}`}>
                                            {date.getDate()}
                                        </div>
                                        {/* 底部小红绿灯点 */}
                                        {calendarData[formatDateKey(date.getFullYear(), date.getMonth(), date.getDate())]?.status && (
                                            <div className={`w-1.5 h-1.5 rounded-full mt-1 ${STATUS_COLORS[calendarData[formatDateKey(date.getFullYear(), date.getMonth(), date.getDate())].status as keyof typeof STATUS_COLORS]?.bg}`} />
                                        )}
                                        {/* Deadline 红点标记 */}
                                        {hasDeadline(formatDateKey(date.getFullYear(), date.getMonth(), date.getDate())) && (
                                            <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500 z-20" />
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* 网格与时间块区域 (可相对滚动) */}
                <div className={`flex-1 relative bg-slate-50/30 ${isFullscreen ? 'overflow-hidden flex flex-col justify-center' : 'overflow-y-auto pr-6'}`}>
                    <div className={`flex ${isFullscreen ? 'my-2' : 'mt-4 mb-8'}`}>
                        {/* 左侧时间轴 */}
                        <div className="w-14 shrink-0 border-r border-slate-100 bg-white z-10">
                            {HOURS.map(hour => (
                                <div key={hour} className="relative" style={{ height: ROW_HEIGHT }}>
                                    <span className="absolute right-2 -top-2 text-[11px] font-mono text-slate-400 leading-none">
                                        {hour}:00
                                    </span>
                                </div>
                            ))}
                        </div>

                        {/* 右侧 7 天 columns */}
                        <div className="flex-1 grid grid-cols-7 relative">
                            {/* 水平网格线 */}
                            <div className="absolute inset-0 pointer-events-none">
                                {HOURS.map((hour) => (
                                    <div key={hour} className="border-b border-slate-200/70" style={{ height: ROW_HEIGHT }} />
                                ))}
                            </div>

                            {/* 垂直列，渲染 Block */}
                            {weekDates.map((date, colIndex) => {
                                const dateKey = formatDateKey(date.getFullYear(), date.getMonth(), date.getDate());
                                const activities = getActivitiesForDate(date, colIndex);

                                return (
                                    <div key={colIndex} className="relative border-r border-slate-200/50 last:border-r-0">
                                        {activities.map(act => {
                                            if (!act.start_time || !act.end_time) return null;

                                            const startH = parseTime(act.start_time);
                                            const endH = parseTime(act.end_time);

                                            // Ensure within 8:00 - 21:00
                                            if (startH >= 21 || endH <= 8) return null;

                                            const visibleStart = Math.max(8, startH);
                                            const visibleEnd = Math.min(21, endH);

                                            const topPos = (visibleStart - 8) * ROW_HEIGHT;
                                            const heightPx = (visibleEnd - visibleStart) * ROW_HEIGHT;

                                            const colorClass = act.color || 'bg-blue-500';
                                            const fmtTime = (t: string) => t.length > 5 ? t.slice(0, 5) : t;
                                            const showEndTime = heightPx >= 40;

                                            return (
                                                <div key={act.id} className="absolute left-0 right-0" style={{ top: topPos, height: heightPx }}>
                                                    <div className="absolute top-0 left-0 right-0 flex items-center z-10 -translate-y-1/2 pointer-events-none">
                                                        <span className="text-[10px] font-mono text-slate-700 bg-white/80 px-1 shrink-0 leading-none">{fmtTime(act.start_time!)}</span>
                                                        <div className="flex-1 border-t border-dashed border-slate-300" />
                                                    </div>
                                                    {/* 结束时间横线 + 标注 */}
                                                    {showEndTime && (
                                                        <div className="absolute bottom-0 left-0 right-0 flex items-center z-10 translate-y-1/2 pointer-events-none">
                                                            <span className="text-[10px] font-mono text-slate-700 bg-white/80 px-1 shrink-0 leading-none">{fmtTime(act.end_time!)}</span>
                                                            <div className="flex-1 border-t border-dashed border-slate-300" />
                                                        </div>
                                                    )}
                                                    {/* 色块主体 */}
                                                    <div
                                                        className={`absolute inset-x-1 inset-y-0.5 rounded-md px-1.5 py-1 overflow-hidden text-xs shadow-sm hover:shadow-md transition-shadow group
                                                            ${colorClass} bg-opacity-90 text-white backdrop-blur-sm border border-white/20`}
                                                    >
                                                        <div className="font-semibold leading-tight whitespace-pre-wrap wrap-break-word">{act.content}</div>

                                                        {/* 删除按钮 */}
                                                        {isAdmin && (
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); onRemoveActivity(act.id); }}
                                                                className="absolute bottom-1 right-1 p-0.5 rounded opacity-0 group-hover:opacity-100 bg-black/20 hover:bg-black/40 text-white transition-all transform scale-75"
                                                            >
                                                                <Trash2 size={12} />
                                                            </button>
                                                        )}
                                                    </div>

                                                    {/* 重复截止日期胶囊（色块外部右上角） */}
                                                    {act.recur_until && (
                                                        <div className="absolute -top-2 -right-0.5 px-1 py-0.5 rounded-full bg-blue-500 text-[11px] font-mono text-white leading-none shadow-sm border border-white/40 z-20 pointer-events-none">
                                                            {new Date(act.recur_until + 'T00:00:00').getMonth() + 1}/{new Date(act.recur_until + 'T00:00:00').getDate()}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* 底部输入区 */}
                {!isFullscreen && isAdmin && (
                    <div className="px-6 py-3 bg-white border-t border-slate-100 shrink-0">
                        <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1.5 p-1 bg-slate-50 rounded-lg border border-slate-200 shrink-0">
                                {COLORS.map(c => (
                                    <button
                                        key={c.name}
                                        onClick={() => setNewColor(c.class)}
                                        className={`w-5 h-5 rounded-md ${c.class} transition-all ${newColor === c.class ? 'ring-2 ring-offset-1 ring-slate-400 scale-110' : 'opacity-60 hover:opacity-100'}`}
                                    />
                                ))}
                            </div>

                            <input
                                type="time"
                                value={newStart}
                                onChange={e => setNewStart(e.target.value)}
                                className="w-[88px] bg-slate-50 border border-slate-200 rounded-lg px-2 py-2 text-xs text-slate-700 focus:outline-none focus:border-blue-300 shrink-0"
                            />
                            <span className="text-slate-300 text-xs">-</span>
                            <input
                                type="time"
                                value={newEnd}
                                onChange={e => setNewEnd(e.target.value)}
                                className="w-[88px] bg-slate-50 border border-slate-200 rounded-lg px-2 py-2 text-xs text-slate-700 focus:outline-none focus:border-blue-300 shrink-0"
                            />

                            <div className="relative w-8 h-8 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center hover:bg-slate-100 transition-colors shrink-0" title="设置重复截止日期">
                                <Calendar size={14} className={newRecurUntil ? "text-blue-500" : "text-slate-400"} />
                                <input
                                    type="date"
                                    value={newRecurUntil}
                                    onChange={e => setNewRecurUntil(e.target.value)}
                                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                />
                            </div>
                            {newRecurUntil && (
                                <button onClick={() => setNewRecurUntil('')} className="shrink-0 p-1 text-slate-400 hover:text-rose-500 transition-colors -ml-1" title="清除截止日期">
                                    <X size={14} />
                                </button>
                            )}

                            <textarea
                                value={newActivity}
                                onChange={e => setNewActivity(e.target.value)}
                                onKeyDown={e => {
                                    if (e.key === 'Enter') {
                                        if (e.shiftKey) {
                                            return;
                                        } else {
                                            e.preventDefault();
                                            handleAdd();
                                        }
                                    }
                                }}
                                placeholder="事项名称 (Shift+Enter 换行)..."
                                className="flex-1 min-w-0 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 placeholder:text-slate-300 focus:outline-none focus:border-blue-300 transition-colors resize-none overflow-y-auto"
                                style={{ maxHeight: '60px', minHeight: '36px' }}
                                rows={1}
                            />
                            <button
                                onClick={handleAdd}
                                className="p-2 rounded-lg bg-blue-50 text-blue-500 hover:bg-blue-100 hover:text-blue-600 transition-colors border border-blue-200/50"
                            >
                                <Plus size={16} />
                            </button>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-1 font-mono">
                            目标：{WEEKDAYS[selectedDayIndex]} · {weekDates[selectedDayIndex]?.getMonth() + 1}/{weekDates[selectedDayIndex]?.getDate()}
                            {newRecurUntil ? ` → 重复至 ${newRecurUntil}` : ' · 仅当天'}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
