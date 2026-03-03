"use client";

import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, X, Calendar, Plus, Trash2 } from 'lucide-react';
import { DayStatus, DayData, Deadline, MONTH_NAMES, MONTH_ABBR, WEEKDAYS, formatDateKey, getMonthGrid, STATUS_COLORS } from './types';

interface MonthViewPanelProps {
    viewYear: number;
    viewMonth: number;
    selectedDay: number;
    calendarData: Record<string, DayData>;
    deadlines: Deadline[];
    isAdmin: boolean;
    onClose: () => void;
    onToggleMode: () => void;
    onPrevMonth: () => void;
    onNextMonth: () => void;
    onSelectDay: (day: number) => void;
    onStatusChange: (status: DayStatus) => void;
    onClearStatus: () => void;
    onAddActivity: (content: string, duration: string) => Promise<void>;
    onRemoveActivity: (id: number) => Promise<void>;
    onCommentChange: (comment: string) => void;
    onCommentBlur: () => void;
}

export default function MonthViewPanel({
    viewYear,
    viewMonth,
    selectedDay,
    calendarData,
    deadlines,
    isAdmin,
    onClose,
    onToggleMode,
    onPrevMonth,
    onNextMonth,
    onSelectDay,
    onStatusChange,
    onClearStatus,
    onAddActivity,
    onRemoveActivity,
    onCommentChange,
    onCommentBlur
}: MonthViewPanelProps) {
    const today = useMemo(() => new Date(), []);
    const { startOffset, daysInMonth } = useMemo(() => getMonthGrid(viewYear, viewMonth), [viewYear, viewMonth]);

    const [newActivity, setNewActivity] = useState('');
    const [newDuration, setNewDuration] = useState('');

    const gridCells: Array<{ day: number | null }> = [];
    for (let i = 0; i < startOffset; i++) gridCells.push({ day: null });
    for (let d = 1; d <= daysInMonth; d++) gridCells.push({ day: d });
    while (gridCells.length < 42) gridCells.push({ day: null });

    const selectedDate = new Date(viewYear, viewMonth, selectedDay);
    const weekdayNames = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];

    const selectedKey = formatDateKey(viewYear, viewMonth, selectedDay);
    const selectedData: DayData = calendarData[selectedKey] || { status: null, comment: '', activities: [] };
    const monthActivities = selectedData.activities.filter(act => !act.start_time);
    const todayStr = formatDateKey(today.getFullYear(), today.getMonth(), today.getDate());

    // 检查此日期是否有未完成、且未过期的 deadline
    const hasActiveDeadline = (dateKey: string) => deadlines.some(d => d.date === dateKey && !d.done && d.date >= todayStr);
    const isToday = (d: number) => viewYear === today.getFullYear() && viewMonth === today.getMonth() && d === today.getDate();

    const handleAdd = async () => {
        if (!newActivity.trim()) return;
        await onAddActivity(newActivity, newDuration);
        setNewActivity('');
        setNewDuration('');
    };

    return (
        <div className="w-[90vw] md:w-[700px] bg-white/95 backdrop-blur-xl border border-slate-200/80 overflow-hidden flex flex-col">
            {/* 顶部栏 */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
                <div className="flex items-center gap-2.5">
                    <Calendar size={18} className="text-blue-400" />
                    <span className="font-mono font-bold text-slate-500 tracking-[0.15em] uppercase text-sm">Calendar Log</span>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={onToggleMode}
                        className="px-3 py-1.5 text-xs font-bold rounded-md bg-slate-100 hover:bg-slate-200 text-slate-500 transition-colors"
                    >
                        周历模式
                    </button>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-all hover:rotate-90"
                    >
                        <X size={18} />
                    </button>
                </div>
            </div>

            {/* 可滚动内容区 */}
            <div className="flex-1 overflow-y-auto">
                {/* 月历区域 */}
                <div className="px-6 pt-5 pb-4">
                    {/* 月份导航 */}
                    <div className="flex items-center justify-center gap-6 mb-5">
                        <button onClick={onPrevMonth} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
                            <ChevronLeft size={18} />
                        </button>
                        <h3 className="text-lg font-bold text-slate-700 tracking-tight min-w-[180px] text-center">
                            {MONTH_NAMES[viewMonth]} <span className="text-blue-500">{viewYear}</span>
                        </h3>
                        <button onClick={onNextMonth} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
                            <ChevronRight size={18} />
                        </button>
                    </div>

                    {/* 星期标头 */}
                    <div className="grid grid-cols-7 mb-1">
                        {WEEKDAYS.map(w => (
                            <div key={w} className="text-center text-[11px] font-bold text-slate-400 py-1.5 uppercase tracking-wider">{w}</div>
                        ))}
                    </div>

                    {/* 日期网格 */}
                    <div className="grid grid-cols-7 gap-px">
                        {gridCells.map((cell, i) => {
                            if (!cell.day) return <div key={i} className="h-11" />;

                            const key = formatDateKey(viewYear, viewMonth, cell.day);
                            const dayData = calendarData[key];
                            const status = dayData?.status;
                            const isSel = cell.day === selectedDay;
                            const isTod = isToday(cell.day);
                            const isActiveDead = hasActiveDeadline(key);

                            return (
                                <button
                                    key={i}
                                    onClick={() => onSelectDay(cell.day!)}
                                    className={`h-[40px] rounded-lg relative flex items-center justify-center transition-all duration-200 m-1 
                                        ${isSel ? 'bg-blue-50 ring-2 ring-blue-400 font-black' : 'hover:bg-slate-50/70'} 
                                        ${isActiveDead && !isSel ? 'ring-1 ring-rose-400/80 bg-rose-50/30' : ''}`}
                                >
                                    {status && (
                                        <div className={`absolute inset-2.5 rounded-md ${STATUS_COLORS[status].bg} opacity-80`} />
                                    )}
                                    <span className={`relative z-10 text-[13px] font-semibold ${isSel ? 'text-blue-600' : isTod ? 'text-blue-500 font-bold' : isActiveDead ? 'text-rose-600 font-bold' : 'text-slate-600'}`}>
                                        {cell.day}
                                    </span>
                                    {isActiveDead && (
                                        <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500 z-20 shadow-sm" />
                                    )}
                                    {isTod && !isSel && (
                                        <div className="absolute bottom-1 w-1 h-1 rounded-full bg-blue-400" />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="mx-6 border-t border-slate-100" />

                {/* 选中日详情 */}
                <div className="px-6 py-5 space-y-5">
                    {/* 日期标题 + 状态选择器 */}
                    <div className="flex items-center justify-between">
                        <div>
                            <h4 className="text-base font-bold text-slate-700">
                                {viewMonth + 1}月{selectedDay}日
                                <span className="text-slate-400 font-normal text-sm ml-2">
                                    {weekdayNames[selectedDate.getDay()]}
                                </span>
                            </h4>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-[11px] text-slate-400 font-mono mr-1">STATUS</span>
                            {(['good', 'ok', 'bad'] as const).map(s => (
                                <button
                                    key={s}
                                    onClick={() => isAdmin && onStatusChange(s)}
                                    className={`w-7 h-7 rounded-full transition-all duration-300 ${STATUS_COLORS[s].dot} ${selectedData.status === s ? `ring-3 ${STATUS_COLORS[s].ring} scale-110 shadow-lg` : `opacity-30 hover:opacity-60 ${isAdmin ? 'cursor-pointer' : 'cursor-default'}`}`}
                                    title={STATUS_COLORS[s].label}
                                    disabled={!isAdmin}
                                />
                            ))}
                            {isAdmin && selectedData.status && (
                                <button
                                    onClick={onClearStatus}
                                    className="w-6 h-6 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:border-slate-400 transition-all ml-1"
                                    title="清除状态"
                                >
                                    <X size={12} />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* 事项记录 */}
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <div className="w-1 h-4 bg-blue-400 rounded-full" />
                            <span className="text-[12px] font-bold text-slate-500 uppercase tracking-wider">事项记录</span>
                        </div>

                        {monthActivities.length > 0 ? (
                            <div className="space-y-2">
                                {monthActivities.map(act => (
                                    <div key={act.id} className="flex items-center gap-3 bg-slate-50/80 rounded-lg px-4 py-2.5 group">
                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-300 shrink-0" />
                                        <span className="flex-1 text-[15px] text-slate-700 font-medium">{act.content}</span>
                                        {act.duration !== null && (
                                            <span className="text-[16px] font-mono text-black-400">
                                                {act.duration}h
                                            </span>
                                        )}
                                        {isAdmin && (
                                            <button
                                                onClick={() => onRemoveActivity(act.id)}
                                                className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-rose-400 transition-all p-1"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-sm text-slate-300 italic py-3 pl-4">暂无记录</div>
                        )}

                        {isAdmin && (
                            <div className="flex items-center gap-2 mt-3">
                                <input
                                    value={newActivity}
                                    onChange={e => setNewActivity(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleAdd()}
                                    placeholder="做了什么..."
                                    className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 placeholder:text-slate-300 focus:outline-none focus:border-blue-300 focus:ring-1 focus:ring-blue-200 transition-colors"
                                />
                                <input
                                    value={newDuration}
                                    onChange={e => setNewDuration(e.target.value)}
                                    placeholder="时长h"
                                    type="number"
                                    step="0.5"
                                    className="w-20 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 placeholder:text-slate-300 focus:outline-none focus:border-blue-300 focus:ring-1 focus:ring-blue-200 transition-colors"
                                />
                                <button
                                    onClick={handleAdd}
                                    className="p-2 rounded-lg bg-blue-50 text-blue-500 hover:bg-blue-100 hover:text-blue-600 transition-colors border border-blue-200/50"
                                >
                                    <Plus size={16} />
                                </button>
                            </div>
                        )}
                    </div>

                    {/* 当日评语 */}
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <div className="w-1 h-4 bg-blue-400 rounded-full" />
                            <span className="text-[12px] font-bold text-slate-500 uppercase tracking-wider">当日评语</span>
                        </div>
                        {isAdmin ? (
                            <textarea
                                value={selectedData.comment}
                                onChange={e => onCommentChange(e.target.value)}
                                onBlur={onCommentBlur}
                                placeholder="对今天说点什么..."
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-sm text-slate-700 placeholder:text-slate-300 focus:outline-none focus:border-blue-300 focus:ring-1 focus:ring-blue-200 transition-colors resize-none h-20"
                            />
                        ) : (
                            <p className={`text-sm pl-4 ${selectedData.comment ? 'text-slate-600' : 'text-slate-300 italic'}`}>
                                {selectedData.comment || '暂无评语'}
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* 底部信息栏 */}
            <div className="px-6 py-3 border-t border-slate-100 flex items-center justify-between text-[10px] font-mono text-slate-400 uppercase shrink-0">
                <div className="flex gap-4">
                    <span className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                        Calendar Active
                    </span>
                    <span>{MONTH_ABBR[viewMonth]} {viewYear}</span>
                </div>
                <span className="tracking-widest">
                    {isAdmin ? 'MODE: EDIT' : 'MODE: VIEW'}
                </span>
            </div>
        </div>
    );
}
