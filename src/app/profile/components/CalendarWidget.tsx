"use client";

import React, { useState, useMemo } from 'react';
import useSWR from 'swr';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { DayStatus, DayData, Deadline, DeadlineCategory, DeadlineItem, DeadlineTimepoint, formatDateKey, MONTH_ABBR } from './calendar/types';
import DeadlinePanel from './calendar/DeadlinePanel';
import MonthViewPanel from './calendar/MonthViewPanel';
import WeekViewPanel from './calendar/WeekViewPanel';
import WeekActivityListPanel from './calendar/WeekActivityListPanel';
import DashboardPanel from './calendar/DashboardPanel';

// === 类型定义 ===
interface CalendarWidgetProps {
    isActive: boolean;
    onToggle: () => void;
    isAdmin?: boolean;
}

// === 静止态指示灯颜色 ===
const IDLE_STATUS_COLOR = {
    none: 'bg-slate-300',
    good: 'bg-emerald-500',
    ok: 'bg-amber-500',
    bad: 'bg-rose-500',
};
const IDLE_GLOW = {
    none: 'shadow-[0_0_8px_rgba(148,163,184,0.6)]',
    good: 'shadow-[0_0_10px_rgba(52,211,153,0.8)]',
    ok: 'shadow-[0_0_10px_rgba(251,191,36,0.8)]',
    bad: 'shadow-[0_0_10px_rgba(251,113,133,0.8)]',
};
const IDLE_GLOW_HOVER = {
    none: 'shadow-[0_0_14px_rgba(148,163,184,0.9)]',
    good: 'shadow-[0_0_16px_rgba(52,211,153,1)]',
    ok: 'shadow-[0_0_16px_rgba(251,191,36,1)]',
    bad: 'shadow-[0_0_16px_rgba(251,113,133,1)]',
};

export default function CalendarWidget({ isActive, onToggle, isAdmin = false }: CalendarWidgetProps) {
    const today = useMemo(() => new Date(), []);
    const [isHovered, setIsHovered] = useState(false);

    // 视图模式
    const [viewMode, setViewMode] = useState<'month' | 'week'>('month');

    // 展开态状态
    const [viewYear, setViewYear] = useState(today.getFullYear());
    const [viewMonth, setViewMonth] = useState(today.getMonth());
    const [selectedDay, setSelectedDay] = useState(today.getDate());
    const [isWeeklyFullscreen, setIsWeeklyFullscreen] = useState(false);

    const { data: swrData, mutate } = useSWR('calendar_data', async () => {
        const [daysRes, actsRes, catsRes, itemsRes, tpsRes] = await Promise.all([
            supabase.from('calendar_days').select('*'),
            supabase.from('calendar_activities').select('*').order('created_at', { ascending: true }),
            supabase.from('deadline_categories').select('*').order('sort_order', { ascending: true }),
            supabase.from('deadline_items').select('*').order('sort_order', { ascending: true }),
            supabase.from('deadline_timepoints').select('*').order('date', { ascending: true }),
        ]);

        const map: Record<string, DayData> = {};
        if (daysRes.data) {
            for (const d of daysRes.data) {
                map[d.date] = { status: d.status as DayStatus, comment: d.comment || '', activities: [] };
            }
        }
        const allActs: any[] = [];
        if (actsRes.data) {
            for (const a of actsRes.data) {
                const act = { id: a.id, content: a.content, duration: a.duration, start_time: a.start_time, end_time: a.end_time, color: a.color, day_of_week: a.day_of_week, recur_until: a.recur_until, date: a.date, deadline_item_id: a.deadline_item_id };
                allActs.push(act);
                if (!map[a.date]) map[a.date] = { status: null, comment: '', activities: [] };
                map[a.date].activities.push(act);
            }
        }
        return {
            calendarData: map,
            deadlineCategories: (catsRes.data || []) as DeadlineCategory[],
            deadlineItems: (itemsRes.data || []) as DeadlineItem[],
            deadlineTimepoints: (tpsRes.data || []) as DeadlineTimepoint[],
            allActivities: allActs,
        };
    }, { fallbackData: { calendarData: {}, deadlineCategories: [], deadlineItems: [], deadlineTimepoints: [], allActivities: [] } });

    const { calendarData, deadlineCategories, deadlineItems, deadlineTimepoints, allActivities } = swrData;

    // 将 timepoints 转为旧 Deadline 格式，供月历/周历红点标注等使用（过渡兼容）
    const deadlines: Deadline[] = useMemo(() => {
        return deadlineTimepoints.map(tp => {
            const item = deadlineItems.find(i => i.id === tp.item_id);
            return {
                id: tp.id,
                title: item ? `${item.title} - ${tp.label || tp.date}` : tp.label || tp.date,
                date: tp.date,
                done: tp.done,
            };
        });
    }, [deadlineTimepoints, deadlineItems]);
    const selectedKey = formatDateKey(viewYear, viewMonth, selectedDay);
    const selectedData: DayData = calendarData[selectedKey] || { status: null, comment: '', activities: [] };

    const todayKey = formatDateKey(today.getFullYear(), today.getMonth(), today.getDate());
    const todayStatus = calendarData[todayKey]?.status || null;
    const idleStatusKey = todayStatus || 'none';

    // === Supabase 操作函数 ===
    const upsertDayField = async (dateKey: string, field: 'status' | 'comment', value: string | null) => {
        mutate((prev: any) => ({
            ...prev,
            calendarData: {
                ...prev.calendarData,
                [dateKey]: { ...(prev.calendarData[dateKey] || { status: null, comment: '', activities: [] }), [field]: value }
            }
        }), false);
        const existing = await supabase.from('calendar_days').select('id').eq('date', dateKey).single();
        if (existing.data) {
            await supabase.from('calendar_days').update({ [field]: value, updated_at: new Date().toISOString() }).eq('date', dateKey);
        } else {
            await supabase.from('calendar_days').insert({ date: dateKey, [field]: value });
        }
    };

    const handleStatusChange = (status: DayStatus) => {
        const current = selectedData.status;
        upsertDayField(selectedKey, 'status', current === status ? null : status);
    };

    const handleClearStatus = () => upsertDayField(selectedKey, 'status', null);

    const handleAddActivity = async (content: string, duration: string, deadlineItemId?: number | null) => {
        const payload: any = {
            date: selectedKey,
            content: content.trim(),
            duration: duration ? parseFloat(duration) : null,
            deadline_item_id: deadlineItemId || null,
        };
        const { data, error } = await supabase.from('calendar_activities').insert(payload).select().single();
        if (!error && data) {
            mutate(); // refetch to rebuild allActivities with deadline_item_id
        }
    };

    const handleRemoveActivity = async (actId: number) => {
        await supabase.from('calendar_activities').delete().eq('id', actId);
        mutate((prev: any) => {
            const day = prev.calendarData[selectedKey];
            if (!day) return prev;
            return {
                ...prev,
                calendarData: {
                    ...prev.calendarData,
                    [selectedKey]: { ...day, activities: day.activities.filter((a: any) => a.id !== actId) }
                }
            };
        }, false);
    };

    const handleCommentChange = (comment: string) => {
        mutate((prev: any) => ({
            ...prev,
            calendarData: {
                ...prev.calendarData,
                [selectedKey]: { ...(prev.calendarData[selectedKey] || { status: null, comment: '', activities: [] }), comment }
            }
        }), false);
    };

    const handleCommentBlur = () => upsertDayField(selectedKey, 'comment', selectedData.comment);

    // === 新 Deadline 三级操作 ===
    // -- 分类操作 --
    const handleAddCategory = async (name: string) => {
        const maxOrder = deadlineCategories.length > 0 ? Math.max(...deadlineCategories.map(c => c.sort_order)) + 1 : 0;
        const { data, error } = await supabase.from('deadline_categories').insert({ name, sort_order: maxOrder }).select().single();
        if (!error && data) mutate();
    };

    const handleUpdateCategory = async (id: number, name: string) => {
        await supabase.from('deadline_categories').update({ name }).eq('id', id);
        mutate();
    };

    const handleRemoveCategory = async (id: number) => {
        await supabase.from('deadline_categories').delete().eq('id', id);
        mutate();
    };

    const handleReorderCategories = async (newOrder: DeadlineCategory[]) => {
        // 乐观更新
        mutate((prev: any) => ({ ...prev, deadlineCategories: newOrder }), false);
        const updates = newOrder.map((cat, i) => ({ id: cat.id, name: cat.name, sort_order: i }));
        await supabase.from('deadline_categories').upsert(updates);
    };

    // -- 条目操作 --
    const handleAddItem = async (categoryId: number, title: string) => {
        const siblings = deadlineItems.filter(i => i.category_id === categoryId);
        const maxOrder = siblings.length > 0 ? Math.max(...siblings.map(i => i.sort_order)) + 1 : 0;
        const { data, error } = await supabase.from('deadline_items').insert({ category_id: categoryId, title, sort_order: maxOrder }).select().single();
        if (!error && data) mutate();
    };

    const handleUpdateItem = async (id: number, updates: { title?: string; done?: boolean; is_archived?: boolean }) => {
        await supabase.from('deadline_items').update(updates).eq('id', id);
        mutate();
    };

    const handleRemoveItem = async (id: number) => {
        await supabase.from('deadline_items').delete().eq('id', id);
        mutate();
    };

    const handleReorderItems = async (categoryId: number, newOrder: DeadlineItem[]) => {
        mutate((prev: any) => ({
            ...prev,
            deadlineItems: prev.deadlineItems.map((item: DeadlineItem) => {
                const idx = newOrder.findIndex(n => n.id === item.id);
                return idx !== -1 ? { ...item, sort_order: idx } : item;
            })
        }), false);
        const updates = newOrder.map((item, i) => ({ id: item.id, category_id: categoryId, title: item.title, sort_order: i }));
        await supabase.from('deadline_items').upsert(updates);
    };

    // -- 时间点操作 --
    const handleAddTimepoint = async (itemId: number, label: string, date: string) => {
        const { data, error } = await supabase.from('deadline_timepoints').insert({ item_id: itemId, label, date }).select().single();
        if (!error && data) mutate();
    };

    const handleUpdateTimepoint = async (id: number, updates: { label?: string; date?: string; done?: boolean }) => {
        await supabase.from('deadline_timepoints').update(updates).eq('id', id);
        mutate();
    };

    const handleRemoveTimepoint = async (id: number) => {
        await supabase.from('deadline_timepoints').delete().eq('id', id);
        mutate();
    };

    const handlePrevMonth = () => {
        if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
        else setViewMonth(m => m - 1);
        setSelectedDay(1);
    };

    const handleNextMonth = () => {
        if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
        else setViewMonth(m => m + 1);
        setSelectedDay(1);
    };

    const handlePrevWeek = () => {
        const current = new Date(viewYear, viewMonth, selectedDay);
        current.setDate(current.getDate() - 7);
        setViewYear(current.getFullYear());
        setViewMonth(current.getMonth());
        setSelectedDay(current.getDate());
    };

    const handleNextWeek = () => {
        const current = new Date(viewYear, viewMonth, selectedDay);
        current.setDate(current.getDate() + 7);
        setViewYear(current.getFullYear());
        setViewMonth(current.getMonth());
        setSelectedDay(current.getDate());
    };

    const handleSelectDay = (day: number, month?: number, year?: number) => {
        if (year !== undefined) setViewYear(year);
        if (month !== undefined) setViewMonth(month);
        setSelectedDay(day);
    };

    const handleJumpToDate = (dateStr: string) => {
        const parts = dateStr.split('-');
        if (parts.length === 3) {
            setViewYear(parseInt(parts[0], 10));
            setViewMonth(parseInt(parts[1], 10) - 1);
            setSelectedDay(parseInt(parts[2], 10));
        }
    };

    const handleAddActivityWeek = async (dateKey: string, content: string, start: string, end: string, color: string, dayOfWeek: number, recurUntil: string | null) => {
        const payload: any = {
            date: dateKey,
            content: content.trim(),
            start_time: start,
            end_time: end,
            color: color,
            day_of_week: dayOfWeek,
            recur_until: recurUntil || null,
        };
        const { data, error } = await supabase.from('calendar_activities').insert(payload).select().single();
        if (!error && data) {
            mutate(); // refetch all data to properly rebuild allActivities
        }
    };

    const handleRemoveActivityById = async (actId: number) => {
        await supabase.from('calendar_activities').delete().eq('id', actId);
        mutate(); // refetch
    };

    const handleUpdateActivity = async (actId: number, updates: { content?: string, color?: string, duration?: number | null }) => {
        await supabase.from('calendar_activities').update(updates).eq('id', actId);
        mutate();
    };

    // === 静止态的日历网格数据 ===
    const idleGrid = useMemo(() => {
        const y = today.getFullYear(), m = today.getMonth(), d = today.getDate();
        const first = new Date(y, m, 1).getDay();
        const startOff = first === 0 ? 6 : first - 1;
        const total = new Date(y, m + 1, 0).getDate();
        const cells: Array<{ day: number | null; isToday: boolean }> = [];
        for (let i = 0; i < startOff; i++) cells.push({ day: null, isToday: false });
        for (let dd = 1; dd <= total; dd++) cells.push({ day: dd, isToday: dd === d });
        while (cells.length < 35) cells.push({ day: null, isToday: false });
        return cells;
    }, [today]);

    // ===================================================
    // =================== 展开态渲染 ====================
    // ===================================================
    if (isActive) {
        return (
            <>
                <AnimatePresence>
                    {isWeeklyFullscreen && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                            className="fixed inset-0 z-100 bg-slate-900/90 backdrop-blur-md flex items-center justify-center pointer-events-auto"
                            onClick={() => setIsWeeklyFullscreen(false)}
                        >
                            <div
                                className="relative w-full max-w-6xl mx-8 shadow-[0_0_50px_rgba(0,0,0,0.3)] rounded-2xl overflow-hidden bg-white/5"
                                style={{ height: 'fit-content', maxHeight: '96vh' }}
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className="w-full h-full bg-white">
                                    <WeekViewPanel
                                        viewYear={viewYear}
                                        viewMonth={viewMonth}
                                        selectedDay={selectedDay}
                                        calendarData={calendarData}
                                        allActivities={allActivities}
                                        deadlines={deadlines}
                                        isAdmin={false} // Disable editing in fullscreen
                                        onClose={() => setIsWeeklyFullscreen(false)}
                                        onToggleMode={() => { }}
                                        onPrevWeek={handlePrevWeek}
                                        onNextWeek={handleNextWeek}
                                        onSelectDay={handleSelectDay}
                                        onAddActivity={async () => { }}
                                        onRemoveActivity={async () => { }}
                                        isFullscreen={true}
                                    />
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 30 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 30 }}
                    transition={{ type: "spring", stiffness: 100, damping: 20 }}
                    className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
                >
                    <div className="flex items-center justify-center w-full h-full p-4 md:p-12 pointer-events-auto">
                        <div className="flex items-stretch shadow-2xl rounded-2xl max-h-[88vh] w-fit" style={{ marginLeft: '-50px' }}>
                            <DeadlinePanel
                                categories={deadlineCategories}
                                items={deadlineItems}
                                timepoints={deadlineTimepoints}
                                allActivities={allActivities}
                                isAdmin={isAdmin}
                                onRefresh={mutate}
                                onAddCategory={handleAddCategory}
                                onUpdateCategory={handleUpdateCategory}
                                onRemoveCategory={handleRemoveCategory}
                                onReorderCategories={handleReorderCategories}
                                onAddItem={handleAddItem}
                                onUpdateItem={handleUpdateItem}
                                onRemoveItem={handleRemoveItem}
                                onReorderItems={handleReorderItems}
                                onAddTimepoint={handleAddTimepoint}
                                onUpdateTimepoint={handleUpdateTimepoint}
                                onRemoveTimepoint={handleRemoveTimepoint}
                            />

                            {viewMode === 'month' ? (
                                <>
                                    <MonthViewPanel
                                        viewYear={viewYear}
                                        viewMonth={viewMonth}
                                        selectedDay={selectedDay}
                                        calendarData={calendarData}
                                        deadlineTimepoints={deadlineTimepoints}
                                        deadlineItems={deadlineItems}
                                        isAdmin={isAdmin}
                                        onClose={onToggle}
                                        onToggleMode={() => setViewMode('week')}
                                        onPrevMonth={handlePrevMonth}
                                        onNextMonth={handleNextMonth}
                                        onSelectDay={setSelectedDay}
                                        onStatusChange={handleStatusChange}
                                        onClearStatus={handleClearStatus}
                                        onAddActivity={handleAddActivity}
                                        onRemoveActivity={handleRemoveActivity}
                                        onRefresh={mutate}
                                        onUpdateActivity={handleUpdateActivity}
                                        onCommentChange={handleCommentChange}
                                        onCommentBlur={handleCommentBlur}
                                    />
                                    <DashboardPanel
                                        calendarData={calendarData}
                                        deadlineTimepoints={deadlineTimepoints}
                                        deadlineItems={deadlineItems}
                                        allActivities={allActivities}
                                    />
                                </>
                            ) : (
                                <>
                                    <WeekViewPanel
                                        viewYear={viewYear}
                                        viewMonth={viewMonth}
                                        selectedDay={selectedDay}
                                        calendarData={calendarData}
                                        allActivities={allActivities}
                                        deadlines={deadlines}
                                        isAdmin={isAdmin}
                                        onClose={onToggle}
                                        onToggleMode={() => setViewMode('month')}
                                        onPrevWeek={handlePrevWeek}
                                        onNextWeek={handleNextWeek}
                                        onSelectDay={handleSelectDay}
                                        onAddActivity={handleAddActivityWeek}
                                        onRemoveActivity={handleRemoveActivityById}
                                        onToggleFullscreen={() => setIsWeeklyFullscreen(true)}
                                    />
                                    <WeekActivityListPanel
                                        allActivities={allActivities}
                                        deadlineItems={deadlineItems}
                                        isAdmin={isAdmin}
                                        onRemoveActivity={handleRemoveActivityById}
                                        onRefresh={mutate}
                                        onUpdateActivity={handleUpdateActivity}
                                        onJumpToDate={handleJumpToDate}
                                    />
                                </>
                            )}
                        </div>
                    </div>
                </motion.div>
            </>
        );
    }

    // ===================================================
    // =================== 静止态渲染 ====================
    // ===================================================
    return (
        <motion.div
            onClick={onToggle}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            whileHover={{ scale: 1.03 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="cursor-pointer select-none flex items-stretch"
            style={{ height: 52 }}
        >
            <div className={`flex flex-col backdrop-blur-sm rounded-l-lg overflow-hidden transition-colors duration-400 ${isHovered ? 'bg-blue-50/90' : 'bg-slate-100/80'}`} style={{ width: 52, height: 52 }}>
                <div className={`h-[10px] flex items-center justify-center shrink-0 transition-colors duration-400 ${isHovered ? 'bg-blue-400/60' : 'bg-blue-400/40'}`}>
                    <div className="flex gap-[3px]">
                        <div className="w-[3px] h-[3px] rounded-full bg-white/80" />
                        <div className="w-[3px] h-[3px] rounded-full bg-white/80" />
                    </div>
                </div>
                <div className="flex-1 p-[3px] grid grid-cols-7 gap-[1.5px] place-items-center">
                    {idleGrid.slice(0, 35).map((cell, i) => (
                        <div key={i} className={`rounded-[1px] ${cell.day ? cell.isToday ? 'bg-blue-500 w-[4px] h-[4px]' : 'bg-slate-300/80 w-[3px] h-[3px]' : 'w-[3px] h-[3px]'}`} />
                    ))}
                </div>
            </div>

            <div className={`flex items-center gap-2 backdrop-blur-sm border border-l-0 rounded-r-lg px-3 transition-all duration-400 ${isHovered ? 'bg-white/90 border-blue-400/70' : 'bg-white/60 border-slate-300/60'}`} style={{ height: 52 }}>
                <div className="flex flex-col items-center justify-center leading-none">
                    <span className={`text-[12px] font-mono font-bold tracking-[0.15em] uppercase transition-colors duration-400 ${isHovered ? 'text-blue-500' : 'text-slate-400'}`}>
                        {MONTH_ABBR[today.getMonth()]}
                    </span>
                    <span className={`text-[22px] font-black tracking-tight leading-none mt-px transition-colors duration-400 ${isHovered ? 'text-slate-800' : 'text-slate-600'}`}>
                        {today.getDate()}
                    </span>
                </div>
                <div className="w-px h-[26px] bg-slate-200/80" />
                <div className={`rounded-full ${IDLE_STATUS_COLOR[idleStatusKey as keyof typeof IDLE_STATUS_COLOR]} ${isHovered ? IDLE_GLOW_HOVER[idleStatusKey as keyof typeof IDLE_GLOW_HOVER] : IDLE_GLOW[idleStatusKey as keyof typeof IDLE_GLOW]} ${!isHovered ? 'animate-pulse' : ''} transition-all duration-400`} style={{ width: 22, height: 22 }} />
            </div>
        </motion.div>
    );
}
