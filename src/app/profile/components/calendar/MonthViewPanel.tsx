"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { ChevronLeft, ChevronRight, X, Calendar, Plus, Trash2, Edit2, Check, RotateCcw, MapPin } from 'lucide-react';
import { DayStatus, DayData, Deadline, DeadlineCategory, DeadlineItem, DeadlineTimepoint, RoutineLog, MONTH_NAMES, MONTH_ABBR, WEEKDAYS, formatDateKey, getMonthGrid, STATUS_COLORS, Activity } from './types';
import { SafeDeleteDialog } from '@/components/ui/safe-delete-dialog';

interface MonthViewPanelProps {
    viewYear: number;
    viewMonth: number;
    selectedDay: number;
    calendarData: Record<string, DayData>;
    deadlineTimepoints: DeadlineTimepoint[];
    deadlineItems: DeadlineItem[];
    deadlineCategories: DeadlineCategory[];
    allActivities: Activity[];
    isAdmin: boolean;
    onClose: () => void;
    onToggleMode: () => void;
    onPrevMonth: () => void;
    onNextMonth: () => void;
    onSelectDay: (day: number) => void;
    onStatusChange: (status: DayStatus) => void;
    onClearStatus: () => void;
    onAddActivity: (content: string, duration: string, deadlineItemId?: number | null) => Promise<void>;
    onRemoveActivity: (id: number) => Promise<void>;
    onRefresh: () => void;
    onUpdateActivity: (id: number, updates: { content?: string, duration?: number | null, deadline_item_id?: number | null, place_id?: number | null }) => Promise<void>;
    onCommentChange: (comment: string) => void;
    onCommentBlur: () => void;
    routineLog?: RoutineLog;
    onRoutineChange: (field: 'wake_time' | 'sleep_time', value: string) => Promise<void>;
    places: Array<{ id: number; name: string }>;
}

export default function MonthViewPanel({
    viewYear,
    viewMonth,
    selectedDay,
    calendarData,
    deadlineTimepoints,
    deadlineItems,
    deadlineCategories,
    allActivities,
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
    onRefresh,
    onUpdateActivity,
    onCommentChange,
    onCommentBlur,
    routineLog,
    onRoutineChange,
    places
}: MonthViewPanelProps) {
    const today = useMemo(() => new Date(), []);
    const { startOffset, daysInMonth } = useMemo(() => getMonthGrid(viewYear, viewMonth), [viewYear, viewMonth]);

    const [newActivity, setNewActivity] = useState('');
    const [newDuration, setNewDuration] = useState('');
    const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
    const [newLinkedItemId, setNewLinkedItemId] = useState<number | null>(null);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editContent, setEditContent] = useState('');
    const [editDuration, setEditDuration] = useState('');
    const [editCategoryId, setEditCategoryId] = useState<number | null>(null);
    const [editLinkedItemId, setEditLinkedItemId] = useState<number | null>(null);
    const [placePickerForId, setPlacePickerForId] = useState<number | null>(null);
    const [wakeTimeInput, setWakeTimeInput] = useState('');
    const [sleepTimeInput, setSleepTimeInput] = useState('');

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
    const hasActiveDeadline = (dateKey: string) => deadlineTimepoints.some(d => d.date === dateKey && !d.done && d.date >= todayStr);
    const isToday = (d: number) => viewYear === today.getFullYear() && viewMonth === today.getMonth() && d === today.getDate();

    // 提取选中日期的具体 Deadline 详情
    const selectedDayDeadlines = useMemo(() => {
        return deadlineTimepoints.filter(d => d.date === selectedKey).map(d => ({
            timepoint: d,
            item: deadlineItems.find(i => i.id === d.item_id)
        })).filter(d => d.item !== undefined);
    }, [deadlineTimepoints, deadlineItems, selectedKey]);

    useEffect(() => {
        setWakeTimeInput(routineLog?.wake_time ? routineLog.wake_time.slice(0, 5) : '');
        setSleepTimeInput(routineLog?.sleep_time ? routineLog.sleep_time.slice(0, 5) : '');
    }, [routineLog?.wake_time, routineLog?.sleep_time, selectedKey]);

    const hasRoutineRecord = !!(wakeTimeInput || sleepTimeInput);

    const parseMinutes = (time: string): number | null => {
        if (!time || !time.includes(':')) return null;
        const [hStr, mStr] = time.split(':');
        const h = parseInt(hStr, 10);
        const m = parseInt(mStr, 10);
        if (Number.isNaN(h) || Number.isNaN(m)) return null;
        return h * 60 + m;
    };

    const routineVisual = useMemo(() => {
        const AXIS_START = 7 * 60 + 30;   // 07:30
        const AXIS_END = 25 * 60;         // 次日 01:00

        const wake = parseMinutes(wakeTimeInput);
        const sleep = parseMinutes(sleepTimeInput);
        if (wake === null || sleep === null) {
            return { ready: false, leftPct: 0, widthPct: 0, durationText: '' };
        }

        const sleepMapped = sleep < AXIS_START ? sleep + 24 * 60 : sleep;
        const durationMin = sleepMapped - wake;
        const safeDurationMin = durationMin > 0 ? durationMin : 0;
        const durationText = `${Math.floor(safeDurationMin / 60)}h${String(safeDurationMin % 60).padStart(2, '0')}m`;

        const clampedStart = Math.max(AXIS_START, Math.min(wake, AXIS_END));
        const clampedEnd = Math.max(AXIS_START, Math.min(sleepMapped, AXIS_END));
        const total = AXIS_END - AXIS_START;
        const leftPct = ((clampedStart - AXIS_START) / total) * 100;
        const widthPct = Math.max(0, ((clampedEnd - clampedStart) / total) * 100);

        return { ready: true, leftPct, widthPct, durationText };
    }, [wakeTimeInput, sleepTimeInput]);

    // 检查明天是否有单次任务规划
    const tomorrowWarning = useMemo(() => {
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = formatDateKey(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate());

        const hasOneOff = allActivities.some(a => a.date === tomorrowStr && a.day_of_week == null);
        return !hasOneOff;
    }, [allActivities, today]);

    const handleAdd = async () => {
        if (!newActivity.trim()) return;
        await onAddActivity(newActivity, newDuration, newLinkedItemId);
        setNewActivity('');
        setNewDuration('');
        setSelectedCategoryId(null);
        setNewLinkedItemId(null);
    };

    const handleEditStart = (act: any) => {
        setEditingId(act.id);
        setEditContent(act.content);
        setEditDuration(act.duration?.toString() || '');
        
        // 回填分类和条目
        if (act.deadline_item_id) {
            const item = deadlineItems.find(i => i.id === act.deadline_item_id);
            if (item) {
                setEditCategoryId(item.category_id);
                setEditLinkedItemId(act.deadline_item_id);
            } else {
                setEditCategoryId(null);
                setEditLinkedItemId(null);
            }
        } else {
            setEditCategoryId(null);
            setEditLinkedItemId(null);
        }
    };

    const handleEditSave = async () => {
        if (!editingId || !editContent.trim()) return;
        await onUpdateActivity(editingId, {
            content: editContent.trim(),
            duration: editDuration ? parseFloat(editDuration) : null,
            deadline_item_id: editLinkedItemId
        });
        setEditingId(null);
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

                            // 琥珀色斜条纹预警：如果是明天，且明天没有任何单次任务
                            const isTomorrow = (() => {
                                const tomorrow = new Date(today);
                                tomorrow.setDate(tomorrow.getDate() + 1);
                                return viewYear === tomorrow.getFullYear() && viewMonth === tomorrow.getMonth() && cell.day === tomorrow.getDate();
                            })();
                            const isTomorrowEmpty = isTomorrow && !allActivities.some(a => a.date === key && a.day_of_week == null);

                            return (
                                <button
                                    key={i}
                                    onClick={() => onSelectDay(cell.day!)}
                                    className={`h-[40px] rounded-lg relative flex items-center justify-center transition-all duration-200 m-1 overflow-hidden
                                        ${isSel ? 'bg-blue-50 ring-2 ring-blue-400 font-black' : 'hover:bg-slate-50/70'} 
                                        ${isActiveDead && !isSel ? 'ring-1 ring-rose-400/80 bg-rose-50/30' : ''}`}
                                    style={isTomorrowEmpty && !isSel ? {
                                        backgroundImage: 'repeating-linear-gradient(45deg, #fef3c7, #fef3c7 8px, #fde68a 8px, #fde68a 16px)'
                                    } : {}}
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

                    {/* 今日 Deadline */}
                    {selectedDayDeadlines.length > 0 && (
                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <div className="w-1 h-4 bg-rose-400 rounded-full" />
                                <span className="text-[12px] font-bold text-rose-500 uppercase tracking-wider">今日 Deadline</span>
                            </div>
                            <div className="space-y-2 mb-5">
                                {selectedDayDeadlines.map(({ timepoint, item }) => (
                                    <div key={timepoint.id} className="bg-rose-50 border border-rose-100/60 rounded-lg px-4 py-3 flex items-center justify-between">
                                        <div className="flex flex-col">
                                            <span className="text-[11px] font-mono text-rose-400 uppercase tracking-wider mb-0.5">{item?.title}</span>
                                            <span className="text-sm font-semibold text-rose-600">{timepoint.label || timepoint.date}</span>
                                        </div>
                                        {timepoint.done && (
                                            <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-500 bg-emerald-50 border border-emerald-100/50 px-2 py-1 rounded-md">
                                                <Check size={12} /> 已完成
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* 事项记录 */}
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <div className="w-1 h-4 bg-blue-400 rounded-full" />
                            <span className="text-[12px] font-bold text-slate-500 uppercase tracking-wider">事项记录</span>
                        </div>

                        {monthActivities.length > 0 ? (
                            <div className="space-y-2">
                                {monthActivities.map(act => (
                                    <div key={act.id} className="flex items-center gap-3 bg-slate-50/80 rounded-lg px-4 py-2.5 group animate-in fade-in slide-in-from-left-2 duration-300">
                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-300 shrink-0" />
                                        {editingId === act.id ? (
                                            <div className="flex-1 flex flex-col gap-2 bg-white border border-blue-100 rounded-lg p-2 shadow-sm">
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        value={editContent}
                                                        onChange={e => setEditContent(e.target.value)}
                                                        className="flex-1 bg-slate-50 border border-slate-200 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-300 transition-all"
                                                        autoFocus
                                                    />
                                                    <input
                                                        value={editDuration}
                                                        onChange={e => setEditDuration(e.target.value)}
                                                        placeholder="h"
                                                        className="w-12 bg-slate-50 border border-slate-200 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-300 transition-all"
                                                    />
                                                    <div className="flex items-center gap-1 ml-1">
                                                        <button onClick={handleEditSave} className="p-1.5 text-emerald-500 hover:bg-emerald-50 rounded transition-colors" title="保存">
                                                            <Check size={16} />
                                                        </button>
                                                        <button onClick={() => setEditingId(null)} className="p-1.5 text-slate-400 hover:bg-slate-100 rounded transition-colors" title="取消">
                                                            <RotateCcw size={16} />
                                                        </button>
                                                    </div>
                                                </div>
                                                
                                                <div className="grid grid-cols-2 gap-2">
                                                    <select
                                                        value={editCategoryId ?? ''}
                                                        onChange={e => {
                                                            const catId = e.target.value ? parseInt(e.target.value) : null;
                                                            setEditCategoryId(catId);
                                                            setEditLinkedItemId(null);
                                                        }}
                                                        className="bg-slate-50 border border-slate-200 rounded px-2 py-1 text-[11px] text-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-300 transition-all"
                                                    >
                                                        <option value="">修改分类 (可选)</option>
                                                        {(deadlineCategories || []).map(cat => (
                                                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                                                        ))}
                                                    </select>

                                                    <select
                                                        value={editLinkedItemId ?? ''}
                                                        onChange={e => setEditLinkedItemId(e.target.value ? parseInt(e.target.value) : null)}
                                                        disabled={!editCategoryId}
                                                        className="bg-slate-50 border border-slate-200 rounded px-2 py-1 text-[11px] text-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-300 transition-all disabled:opacity-50"
                                                    >
                                                        <option value="">修改具体条目...</option>
                                                        {deadlineItems
                                                            .filter(item => item.category_id === editCategoryId)
                                                            .map(item => (
                                                                <option key={item.id} value={item.id}>{item.title}</option>
                                                            ))}
                                                    </select>
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                <span className="flex-1 min-w-0 text-[15px] text-slate-700 font-medium truncate">{act.content}</span>
                                                <div className="flex items-center gap-2 shrink-0">
                                                    {act.place_id && (() => {
                                                        const linkedPlace = places.find(p => p.id === act.place_id);
                                                        return linkedPlace ? (
                                                            <span className="text-[10px] font-medium text-sky-500 bg-sky-50 px-1.5 py-0.5 rounded-full whitespace-nowrap">
                                                                {linkedPlace.name}
                                                            </span>
                                                        ) : null;
                                                    })()}
                                                    {act.deadline_item_id && (() => {
                                                        const linkedItem = deadlineItems.find(i => i.id === act.deadline_item_id);
                                                        return linkedItem ? (
                                                            <span className="text-[10px] font-medium text-rose-400 bg-rose-50 px-1.5 py-0.5 rounded-full whitespace-nowrap">
                                                                {linkedItem.title}
                                                            </span>
                                                        ) : null;
                                                    })()}
                                                    {act.duration !== null && (
                                                        <span className="text-[16px] font-mono text-black-400 whitespace-nowrap">
                                                            {act.duration}h
                                                        </span>
                                                    )}
                                                </div>
                                                {isAdmin && (
                                                    <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-all">
                                                        {placePickerForId === act.id ? (
                                                            <select
                                                                value={act.place_id ?? ''}
                                                                onChange={async (e) => {
                                                                    const value = e.target.value ? parseInt(e.target.value, 10) : null;
                                                                    await onUpdateActivity(act.id, { place_id: value });
                                                                    setPlacePickerForId(null);
                                                                }}
                                                                className="h-7 rounded-md border border-slate-200 bg-white px-2 text-[11px] text-slate-600 focus:outline-none"
                                                            >
                                                                <option value="">无地点</option>
                                                                {places.length === 0 && (
                                                                    <option value="" disabled>暂无地点可选</option>
                                                                )}
                                                                {places.map(place => (
                                                                    <option key={place.id} value={place.id}>{place.name}</option>
                                                                ))}
                                                            </select>
                                                        ) : (
                                                            <button
                                                                onClick={() => setPlacePickerForId(act.id)}
                                                                className="text-slate-300 hover:text-sky-500 transition-all p-1"
                                                                title="设置地点"
                                                            >
                                                                <MapPin size={14} />
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={() => handleEditStart(act)}
                                                            className="text-slate-300 hover:text-blue-400 transition-all p-1"
                                                            title="编辑"
                                                        >
                                                            <Edit2 size={14} />
                                                        </button>
                                                        <SafeDeleteDialog
                                                            table="calendar_activities"
                                                            recordId={act.id}
                                                            title="确定要删除此项记录吗？"
                                                            onSuccess={onRefresh}
                                                        >
                                                            <button
                                                                className="text-slate-300 hover:text-rose-400 transition-all p-1"
                                                                title="删除"
                                                            >
                                                                <Trash2 size={14} />
                                                            </button>
                                                        </SafeDeleteDialog>
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-sm text-slate-300 italic py-3 pl-4">暂无记录</div>
                        )}

                        {isAdmin && (
                            <div className="space-y-2 mt-3">
                                <div className="flex items-center gap-2">
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
                                <div className="grid grid-cols-2 gap-2">
                                    {/* 分类选择 */}
                                    <select
                                        value={selectedCategoryId ?? ''}
                                        onChange={e => {
                                            const catId = e.target.value ? parseInt(e.target.value) : null;
                                            setSelectedCategoryId(catId);
                                            setNewLinkedItemId(null);
                                        }}
                                        className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-500 focus:outline-none focus:border-blue-300 transition-colors"
                                    >
                                        <option value="">选择分类 (可选)</option>
                                        {(deadlineCategories || []).map(cat => (
                                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                                        ))}
                                    </select>

                                    {/* 关联条目选择器 */}
                                    <select
                                        value={newLinkedItemId ?? ''}
                                        onChange={e => setNewLinkedItemId(e.target.value ? parseInt(e.target.value) : null)}
                                        disabled={!selectedCategoryId}
                                        className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-500 focus:outline-none focus:border-blue-300 transition-colors disabled:opacity-50"
                                    >
                                        <option value="">选择具体条目...</option>
                                        {deadlineItems
                                            .filter(item => item.category_id === selectedCategoryId)
                                            .map(item => (
                                                <option key={item.id} value={item.id}>{item.title}</option>
                                            ))}
                                    </select>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* 作息记录 */}
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <div className="w-1 h-4 bg-blue-400 rounded-full" />
                            <span className="text-[12px] font-bold text-slate-500 uppercase tracking-wider">作息记录</span>
                        </div>
                        {isAdmin ? (
                            <div className="space-y-3">
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                                        <div className="text-[10px] text-slate-400 font-mono uppercase mb-1">起床</div>
                                        <input
                                            type="time"
                                            value={wakeTimeInput}
                                            onChange={(e) => setWakeTimeInput(e.target.value)}
                                            onBlur={() => onRoutineChange('wake_time', wakeTimeInput)}
                                            className="w-full bg-white border border-slate-200 rounded px-2 py-1.5 text-sm text-slate-700 focus:outline-none focus:border-blue-300"
                                        />
                                    </div>
                                    <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                                        <div className="text-[10px] text-slate-400 font-mono uppercase mb-1">入睡</div>
                                        <input
                                            type="time"
                                            value={sleepTimeInput}
                                            onChange={(e) => setSleepTimeInput(e.target.value)}
                                            onBlur={() => onRoutineChange('sleep_time', sleepTimeInput)}
                                            className="w-full bg-white border border-slate-200 rounded px-2 py-1.5 text-sm text-slate-700 focus:outline-none focus:border-blue-300"
                                        />
                                    </div>
                                </div>
                                <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-3">
                                    <div className="flex justify-between items-center text-[10px] font-mono text-slate-400 uppercase mb-2">
                                        <span>07:30</span>
                                        <span>01:00</span>
                                    </div>
                                    <div className="relative h-4 rounded-full bg-slate-200/80 overflow-hidden">
                                        {routineVisual.ready && routineVisual.widthPct > 0 && (
                                            <div
                                                className="absolute top-0 h-full bg-blue-500/80"
                                                style={{ left: `${routineVisual.leftPct}%`, width: `${routineVisual.widthPct}%` }}
                                            />
                                        )}
                                    </div>
                                    <div className="mt-2 text-[11px] text-slate-500">
                                        {hasRoutineRecord ? (
                                            routineVisual.ready ? (
                                                <span>
                                                    清醒时段：{wakeTimeInput || '--:--'} {'->'} {sleepTimeInput || '--:--'}（约 {routineVisual.durationText}）
                                                </span>
                                            ) : (
                                                <span className="italic text-slate-400">信息不完整（仅记录了部分时间）</span>
                                            )
                                        ) : (
                                            <span className="italic text-slate-400">未记录</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-3">
                                {hasRoutineRecord ? (
                                    <div className="text-sm text-slate-600">
                                        起床 {wakeTimeInput || '--:--'}，入睡 {sleepTimeInput || '--:--'}
                                    </div>
                                ) : (
                                    <div className="text-sm text-slate-300 italic">未记录</div>
                                )}
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
