"use client";

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, X, Plus, Trash2, Calendar, Clock, Check } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

// === 类型定义 ===
interface CalendarWidgetProps {
    isActive: boolean;
    onToggle: () => void;
    isAdmin?: boolean;
}

type DayStatus = 'good' | 'ok' | 'bad' | null;

interface Activity {
    id: number;
    content: string;
    duration: number | null; // 小时
}

interface DayData {
    status: DayStatus;
    comment: string;
    activities: Activity[];
}

interface Deadline {
    id: number;
    title: string;
    date: string; // 'YYYY-MM-DD'
    done: boolean;
}

// === 工具函数 ===
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const MONTH_ABBR = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
const WEEKDAYS = ['一', '二', '三', '四', '五', '六', '日'];

function formatDateKey(year: number, month: number, day: number): string {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function getMonthGrid(year: number, month: number) {
    const firstDay = new Date(year, month, 1).getDay();
    // 转换为周一起始: 0(Sun)->6, 1(Mon)->0, ...
    const startOffset = firstDay === 0 ? 6 : firstDay - 1;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    return { startOffset, daysInMonth };
}

// === 状态颜色映射 ===
// bg: 日历格子背景, ring: 选中环, text: 文字, dot: 详情面板圆点
const STATUS_COLORS = {
    good: { bg: 'bg-emerald-500', ring: 'ring-emerald-400', text: 'text-emerald-700', dot: 'bg-emerald-500', label: '好' },
    ok: { bg: 'bg-amber-500', ring: 'ring-amber-400', text: 'text-amber-700', dot: 'bg-amber-500', label: '一般' },
    bad: { bg: 'bg-rose-500', ring: 'ring-rose-400', text: 'text-rose-700', dot: 'bg-rose-500', label: '差' },
};

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
    const today = new Date();
    const [isHovered, setIsHovered] = useState(false);

    // 展开态状态
    const [viewYear, setViewYear] = useState(today.getFullYear());
    const [viewMonth, setViewMonth] = useState(today.getMonth());
    const [selectedDay, setSelectedDay] = useState(today.getDate());
    const [calendarData, setCalendarData] = useState<Record<string, DayData>>({});
    const [deadlines, setDeadlines] = useState<Deadline[]>([]);
    const [dataLoaded, setDataLoaded] = useState(false);

    // 新事项输入
    const [newActivity, setNewActivity] = useState('');
    const [newDuration, setNewDuration] = useState('');
    // 新 deadline 输入
    const [newDeadlineTitle, setNewDeadlineTitle] = useState('');
    const [newDeadlineDate, setNewDeadlineDate] = useState('');

    // === Supabase 数据加载 ===
    const fetchData = useCallback(async () => {
        // 获取日历日期状态
        const { data: days } = await supabase.from('calendar_days').select('*');
        // 获取所有活动
        const { data: acts } = await supabase.from('calendar_activities').select('*').order('created_at', { ascending: true });
        // 获取所有 deadlines
        const { data: dls } = await supabase.from('calendar_deadlines').select('*').order('date', { ascending: true });

        // 组装 calendarData
        const map: Record<string, DayData> = {};
        if (days) {
            for (const d of days) {
                const key = d.date; // Supabase DATE 返回 'YYYY-MM-DD'
                map[key] = {
                    status: d.status as DayStatus,
                    comment: d.comment || '',
                    activities: [],
                };
            }
        }
        if (acts) {
            for (const a of acts) {
                const key = a.date;
                if (!map[key]) map[key] = { status: null, comment: '', activities: [] };
                map[key].activities.push({ id: a.id, content: a.content, duration: a.duration });
            }
        }

        setCalendarData(map);
        setDeadlines(dls || []);
        setDataLoaded(true);
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    // 当前月份网格
    const { startOffset, daysInMonth } = useMemo(() => getMonthGrid(viewYear, viewMonth), [viewYear, viewMonth]);

    // 选中日期的 key 和数据
    const selectedKey = formatDateKey(viewYear, viewMonth, selectedDay);
    const selectedData: DayData = calendarData[selectedKey] || { status: null, comment: '', activities: [] };

    // 今天的状态（用于静止态指示灯）
    const todayKey = formatDateKey(today.getFullYear(), today.getMonth(), today.getDate());
    const todayStatus = calendarData[todayKey]?.status || null;
    const idleStatusKey = todayStatus || 'none';

    // === Supabase 操作函数 ===
    const upsertDayField = async (dateKey: string, field: 'status' | 'comment', value: string | null) => {
        // 先更新本地状态
        setCalendarData(prev => ({
            ...prev,
            [dateKey]: { ...(prev[dateKey] || { status: null, comment: '', activities: [] }), [field]: value }
        }));
        // Upsert 到 Supabase
        const existing = await supabase.from('calendar_days').select('id').eq('date', dateKey).single();
        if (existing.data) {
            await supabase.from('calendar_days').update({ [field]: value, updated_at: new Date().toISOString() }).eq('date', dateKey);
        } else {
            await supabase.from('calendar_days').insert({ date: dateKey, [field]: value });
        }
    };

    const handleStatusChange = (status: DayStatus) => {
        const current = selectedData.status;
        const newStatus = current === status ? null : status;
        upsertDayField(selectedKey, 'status', newStatus);
    };

    const handleClearStatus = () => {
        upsertDayField(selectedKey, 'status', null);
    };

    const handleAddActivity = async () => {
        if (!newActivity.trim()) return;
        const payload = {
            date: selectedKey,
            content: newActivity.trim(),
            duration: newDuration ? parseFloat(newDuration) : null,
        };
        const { data, error } = await supabase.from('calendar_activities').insert(payload).select().single();
        if (!error && data) {
            setCalendarData(prev => {
                const day = prev[selectedKey] || { status: null, comment: '', activities: [] };
                return { ...prev, [selectedKey]: { ...day, activities: [...day.activities, { id: data.id, content: data.content, duration: data.duration }] } };
            });
        }
        setNewActivity('');
        setNewDuration('');
    };

    const handleRemoveActivity = async (actId: number) => {
        await supabase.from('calendar_activities').delete().eq('id', actId);
        setCalendarData(prev => {
            const day = prev[selectedKey];
            if (!day) return prev;
            return { ...prev, [selectedKey]: { ...day, activities: day.activities.filter(a => a.id !== actId) } };
        });
    };

    const handleCommentChange = (comment: string) => {
        // 本地立即更新，延迟保存
        setCalendarData(prev => ({
            ...prev,
            [selectedKey]: { ...(prev[selectedKey] || { status: null, comment: '', activities: [] }), comment }
        }));
    };

    // 评语失焦时保存
    const handleCommentBlur = () => {
        upsertDayField(selectedKey, 'comment', selectedData.comment);
    };

    // Deadline 操作
    const handleAddDeadline = async () => {
        if (!newDeadlineTitle.trim() || !newDeadlineDate) return;
        const { data, error } = await supabase.from('calendar_deadlines')
            .insert({ title: newDeadlineTitle.trim(), date: newDeadlineDate, done: false })
            .select().single();
        if (!error && data) {
            setDeadlines(prev => [...prev, data]);
        }
        setNewDeadlineTitle('');
        setNewDeadlineDate('');
    };

    const handleToggleDeadline = async (id: number) => {
        const dl = deadlines.find(d => d.id === id);
        if (!dl) return;
        const newDone = !dl.done;
        await supabase.from('calendar_deadlines').update({ done: newDone }).eq('id', id);
        setDeadlines(prev => prev.map(d => d.id === id ? { ...d, done: newDone } : d));
    };

    const handleRemoveDeadline = async (id: number) => {
        await supabase.from('calendar_deadlines').delete().eq('id', id);
        setDeadlines(prev => prev.filter(d => d.id !== id));
    };

    // 获取某天是否有 deadline
    const hasDeadline = (dateKey: string) => deadlines.some(d => d.date === dateKey);

    // 排序 deadlines: 未过期按日期升序，过期的排在最后
    const sortedDeadlines = useMemo(() => {
        const todayStr = formatDateKey(today.getFullYear(), today.getMonth(), today.getDate());
        const active = deadlines.filter(d => d.date >= todayStr && !d.done).sort((a, b) => a.date.localeCompare(b.date));
        const expired = deadlines.filter(d => d.date < todayStr || d.done).sort((a, b) => a.date.localeCompare(b.date));
        return [...active, ...expired];
    }, [deadlines, today]);

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

    const isToday = (d: number) => viewYear === today.getFullYear() && viewMonth === today.getMonth() && d === today.getDate();

    // === 静止态的日历网格数据 ===
    const idleGrid = useMemo(() => {
        const now = new Date();
        const y = now.getFullYear(), m = now.getMonth(), d = now.getDate();
        const first = new Date(y, m, 1).getDay();
        const startOff = first === 0 ? 6 : first - 1;
        const total = new Date(y, m + 1, 0).getDate();
        const cells: Array<{ day: number | null; isToday: boolean }> = [];
        for (let i = 0; i < startOff; i++) cells.push({ day: null, isToday: false });
        for (let dd = 1; dd <= total; dd++) cells.push({ day: dd, isToday: dd === d });
        while (cells.length < 35) cells.push({ day: null, isToday: false });
        return cells;
    }, []);

    // ===================================================
    // =================== 展开态渲染 ====================
    // ===================================================
    if (isActive) {
        // 计算日历格子
        const gridCells: Array<{ day: number | null }> = [];
        for (let i = 0; i < startOffset; i++) gridCells.push({ day: null });
        for (let d = 1; d <= daysInMonth; d++) gridCells.push({ day: d });
        while (gridCells.length < 42) gridCells.push({ day: null });

        // 选中日 中文星期
        const selectedDate = new Date(viewYear, viewMonth, selectedDay);
        const weekdayNames = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];

        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 30 }}
                transition={{ type: "spring", stiffness: 100, damping: 20 }}
                className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
            >
                <div className="flex items-stretch pointer-events-auto max-h-[85vh]" style={{ marginLeft: '-180px' }}>

                    {/* ===== 左侧 Deadline 面板 ===== */}
                    <div className="w-[260px] bg-white/95 backdrop-blur-xl rounded-l-2xl border border-r-0 border-slate-200/80 flex flex-col overflow-hidden">
                        {/* Deadline 标题 */}
                        <div className="px-5 py-4 border-b border-slate-100 shrink-0">
                            <div className="flex items-center gap-2">
                                <Clock size={16} className="text-rose-400" />
                                <span className="font-mono font-bold text-slate-500 tracking-[0.15em] uppercase text-xs">Deadlines</span>
                            </div>
                        </div>

                        {/* Deadline 列表 */}
                        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-1.5">
                            {sortedDeadlines.length === 0 ? (
                                <div className="text-sm text-slate-300 italic py-6 text-center">暂无 deadline</div>
                            ) : (
                                sortedDeadlines.map(dl => {
                                    const todayStr = formatDateKey(today.getFullYear(), today.getMonth(), today.getDate());
                                    const isExpired = dl.date < todayStr;
                                    const isOverdue = isExpired && !dl.done;

                                    return (
                                        <div
                                            key={dl.id}
                                            className={`flex items-start gap-2.5 px-3 py-2.5 rounded-lg group transition-colors ${isExpired || dl.done ? 'opacity-40' : 'hover:bg-slate-50'
                                                }`}
                                        >
                                            {/* 完成按钮 */}
                                            {isAdmin && (
                                                <button
                                                    onClick={() => handleToggleDeadline(dl.id)}
                                                    className={`mt-0.5 w-4 h-4 rounded border shrink-0 flex items-center justify-center transition-colors ${dl.done
                                                        ? 'bg-emerald-100 border-emerald-300 text-emerald-500'
                                                        : 'border-slate-300 hover:border-blue-400'
                                                        }`}
                                                >
                                                    {dl.done && <Check size={10} />}
                                                </button>
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <div className={`text-[14px] font-semibold leading-tight ${dl.done ? 'line-through text-slate-400' :
                                                    isOverdue ? 'text-rose-500' :
                                                        'text-slate-800'
                                                    }`}>
                                                    {dl.title}
                                                </div>
                                                <div className={`text-[13px] font-mono mt-0.5 ${isOverdue ? 'text-rose-400' : 'text-slate-400'
                                                    }`}>
                                                    {dl.date.slice(5).replace('-', '/')}
                                                </div>
                                            </div>
                                            {/* 删除 */}
                                            {isAdmin && (
                                                <button
                                                    onClick={() => handleRemoveDeadline(dl.id)}
                                                    className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-rose-400 transition-all p-0.5 mt-0.5"
                                                >
                                                    <Trash2 size={12} />
                                                </button>
                                            )}
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        {/* 添加 Deadline */}
                        {isAdmin && (
                            <div className="px-4 py-3 border-t border-slate-100 space-y-2 shrink-0">
                                <input
                                    value={newDeadlineTitle}
                                    onChange={e => setNewDeadlineTitle(e.target.value)}
                                    placeholder="事项名称..."
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700 placeholder:text-slate-300 focus:outline-none focus:border-blue-300 transition-colors"
                                />
                                <div className="flex gap-2">
                                    <input
                                        type="date"
                                        value={newDeadlineDate}
                                        onChange={e => setNewDeadlineDate(e.target.value)}
                                        className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-blue-300 transition-colors"
                                    />
                                    <button
                                        onClick={handleAddDeadline}
                                        className="px-3 py-1.5 rounded-lg bg-rose-50 text-rose-500 hover:bg-rose-100 transition-colors border border-rose-200/50 text-xs font-bold"
                                    >
                                        <Plus size={14} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* ===== 中间主面板（原有日历） ===== */}
                    <div className="w-[90vw] md:w-[700px] bg-white/95 backdrop-blur-xl rounded-r-2xl border border-slate-200/80 overflow-hidden flex flex-col">

                        {/* ===== 顶部栏 ===== */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
                            <div className="flex items-center gap-2.5">
                                <Calendar size={18} className="text-blue-400" />
                                <span className="font-mono font-bold text-slate-500 tracking-[0.15em] uppercase text-sm">Calendar Log</span>
                            </div>
                            <button
                                onClick={onToggle}
                                className="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-all hover:rotate-90"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* ===== 可滚动内容区 ===== */}
                        <div className="flex-1 overflow-y-auto">

                            {/* ===== 月历区域 ===== */}
                            <div className="px-6 pt-5 pb-4">
                                {/* 月份导航 */}
                                <div className="flex items-center justify-center gap-6 mb-5">
                                    <button onClick={handlePrevMonth} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
                                        <ChevronLeft size={18} />
                                    </button>
                                    <h3 className="text-lg font-bold text-slate-700 tracking-tight min-w-[180px] text-center">
                                        {MONTH_NAMES[viewMonth]} <span className="text-blue-500">{viewYear}</span>
                                    </h3>
                                    <button onClick={handleNextMonth} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
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

                                        return (
                                            <button
                                                key={i}
                                                onClick={() => setSelectedDay(cell.day!)}
                                                className={`
                                                h-11 rounded-lg relative flex items-center justify-center transition-all duration-200
                                                ${isSel
                                                        ? 'bg-blue-50 ring-2 ring-blue-400 font-black'
                                                        : 'hover:bg-slate-50/70'
                                                    }
                                            `}
                                            >
                                                {/* 状态圆圈背景 */}
                                                {status && (
                                                    <div className={`absolute inset-2.5 rounded-md ${STATUS_COLORS[status].bg} opacity-80`} />
                                                )}
                                                <span className={`relative z-10 text-[13px] font-semibold ${isSel ? 'text-blue-600' :
                                                    isTod ? 'text-blue-500 font-bold' :
                                                        'text-slate-600'
                                                    }`}>
                                                    {cell.day}
                                                </span>
                                                {/* Deadline 红点标记 */}
                                                {hasDeadline(key) && (
                                                    <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500 z-20" />
                                                )}
                                                {isTod && !isSel && (
                                                    <div className="absolute bottom-1 w-1 h-1 rounded-full bg-blue-400" />
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* ===== 分隔线 ===== */}
                            <div className="mx-6 border-t border-slate-100" />

                            {/* ===== 选中日详情 ===== */}
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

                                    {/* 状态选择器 */}
                                    <div className="flex items-center gap-2">
                                        <span className="text-[11px] text-slate-400 font-mono mr-1">STATUS</span>
                                        {(['good', 'ok', 'bad'] as const).map(s => (
                                            <button
                                                key={s}
                                                onClick={() => isAdmin && handleStatusChange(s)}
                                                className={`
                                                w-7 h-7 rounded-full transition-all duration-300
                                                ${STATUS_COLORS[s].dot}
                                                ${selectedData.status === s
                                                        ? `ring-3 ${STATUS_COLORS[s].ring} scale-110 shadow-lg`
                                                        : `opacity-30 hover:opacity-60 ${isAdmin ? 'cursor-pointer' : 'cursor-default'}`
                                                    }
                                            `}
                                                title={STATUS_COLORS[s].label}
                                                disabled={!isAdmin}
                                            />
                                        ))}
                                        {/* 清除状态 */}
                                        {isAdmin && selectedData.status && (
                                            <button
                                                onClick={handleClearStatus}
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

                                    {selectedData.activities.length > 0 ? (
                                        <div className="space-y-2">
                                            {selectedData.activities.map(act => (
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
                                                            onClick={() => handleRemoveActivity(act.id)}
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

                                    {/* 添加事项 */}
                                    {isAdmin && (
                                        <div className="flex items-center gap-2 mt-3">
                                            <input
                                                value={newActivity}
                                                onChange={e => setNewActivity(e.target.value)}
                                                onKeyDown={e => e.key === 'Enter' && handleAddActivity()}
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
                                                onClick={handleAddActivity}
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
                                            onChange={e => handleCommentChange(e.target.value)}
                                            onBlur={handleCommentBlur}
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

                        {/* ===== 底部信息栏 ===== */}
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
                </div>
            </motion.div >
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
            {/* 左侧：微型日历图案（无外框） */}
            <div
                className={`flex flex-col backdrop-blur-sm rounded-l-lg overflow-hidden transition-colors duration-400 ${isHovered ? 'bg-blue-50/90' : 'bg-slate-100/80'
                    }`}
                style={{ width: 52, height: 52 }}
            >
                <div className={`h-[10px] flex items-center justify-center shrink-0 transition-colors duration-400 ${isHovered ? 'bg-blue-400/60' : 'bg-blue-400/40'
                    }`}>
                    <div className="flex gap-[3px]">
                        <div className="w-[3px] h-[3px] rounded-full bg-white/80" />
                        <div className="w-[3px] h-[3px] rounded-full bg-white/80" />
                    </div>
                </div>
                <div className="flex-1 p-[3px] grid grid-cols-7 gap-[1.5px] place-items-center">
                    {idleGrid.slice(0, 35).map((cell, i) => (
                        <div
                            key={i}
                            className={`rounded-[1px] ${cell.day
                                ? cell.isToday
                                    ? 'bg-blue-500 w-[4px] h-[4px]'
                                    : 'bg-slate-300/80 w-[3px] h-[3px]'
                                : 'w-[3px] h-[3px]'
                                }`}
                        />
                    ))}
                </div>
            </div>

            {/* 右侧：日期 + 指示灯 */}
            <div
                className={`flex items-center gap-2 backdrop-blur-sm border border-l-0 rounded-r-lg px-3 transition-all duration-400 ${isHovered ? 'bg-white/90 border-blue-400/70' : 'bg-white/60 border-slate-300/60'
                    }`}
                style={{ height: 52 }}
            >
                <div className="flex flex-col items-center justify-center leading-none">
                    <span className={`text-[12px] font-mono font-bold tracking-[0.15em] uppercase transition-colors duration-400 ${isHovered ? 'text-blue-500' : 'text-slate-400'
                        }`}>
                        {MONTH_ABBR[today.getMonth()]}
                    </span>
                    <span className={`text-[22px] font-black tracking-tight leading-none mt-px transition-colors duration-400 ${isHovered ? 'text-slate-800' : 'text-slate-600'
                        }`}>
                        {today.getDate()}
                    </span>
                </div>

                <div className="w-px h-[26px] bg-slate-200/80" />

                <div
                    className={`rounded-full ${IDLE_STATUS_COLOR[idleStatusKey]} ${isHovered ? IDLE_GLOW_HOVER[idleStatusKey] : IDLE_GLOW[idleStatusKey]
                        } ${!isHovered ? 'animate-pulse' : ''} transition-all duration-400`}
                    style={{ width: 22, height: 22 }}
                    title={`Today's status: ${idleStatusKey}`}
                />
            </div>
        </motion.div>
    );
}
