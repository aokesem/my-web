"use client";

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { ListTodo, Trash2, Pencil, Check } from 'lucide-react';
import { Activity, WEEKDAYS, formatDateKey } from './types';

interface WeekActivityListPanelProps {
    allActivities: Activity[];
    isAdmin: boolean;
    onRemoveActivity: (id: number) => Promise<void>;
    onUpdateActivity: (id: number, updates: { content?: string, color?: string }) => Promise<void>;
    onJumpToDate?: (dateStr: string) => void;
}

const COLORS = [
    { name: 'blue', class: 'bg-blue-500' },
    { name: 'red', class: 'bg-rose-500' },
    { name: 'amber', class: 'bg-amber-500' },
    { name: 'emerald', class: 'bg-emerald-500' },
    { name: 'purple', class: 'bg-purple-500' },
    { name: 'slate', class: 'bg-slate-500' }
];

const DAY_LABELS = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];

export default function WeekActivityListPanel({
    allActivities, isAdmin, onRemoveActivity, onUpdateActivity, onJumpToDate
}: WeekActivityListPanelProps) {
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editValue, setEditValue] = useState('');
    const [editColor, setEditColor] = useState('bg-blue-500');
    const inputRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (editingId !== null && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [editingId]);

    // 只显示有时间段的事项，按 day_of_week -> start_time 排序
    const sortedActivities = useMemo(() => {
        return allActivities
            .filter(a => a.start_time && a.end_time)
            .sort((a, b) => {
                const dayA = a.day_of_week ?? -1; // 无 day_of_week 的排最前
                const dayB = b.day_of_week ?? -1;
                if (dayA !== dayB) return dayA - dayB;
                return (a.start_time || '').localeCompare(b.start_time || '');
            });
    }, [allActivities]);

    const startEdit = (act: Activity) => {
        setEditingId(act.id);
        setEditValue(act.content);
        setEditColor(act.color || 'bg-blue-500');
    };

    const confirmEdit = async () => {
        if (editingId === null) return;
        const trimmed = editValue.trim();
        if (trimmed) {
            await onUpdateActivity(editingId, { content: trimmed, color: editColor });
        }
        setEditingId(null);
    };

    const cancelEdit = () => {
        setEditingId(null);
    };

    const handleJump = (act: Activity) => {
        if (!onJumpToDate) return;
        const actDate = act.date;
        if (!act.recur_until || act.day_of_week == null) {
            if (actDate) onJumpToDate(actDate);
            return;
        }

        // 重复事项：判断今天与区间的关系
        const today = new Date();
        const todayStr = formatDateKey(today.getFullYear(), today.getMonth(), today.getDate());

        if (actDate && todayStr < actDate) {
            // 还没开始
            onJumpToDate(actDate);
        } else if (todayStr > act.recur_until) {
            // 已经过期
            onJumpToDate(act.recur_until);
        } else {
            // 正在进行中，跳转到今天（会自动定位到这周）
            onJumpToDate(todayStr);
        }
    };

    const fmtTime = (t: string) => t.length > 5 ? t.slice(0, 5) : t;

    return (
        <div className="w-[260px] bg-white/95 backdrop-blur-xl rounded-r-2xl border border-l-0 border-slate-200/80 flex flex-col overflow-hidden">
            {/* 标题栏 */}
            <div className="px-5 py-4 border-b border-slate-100 shrink-0">
                <div className="flex items-center gap-2">
                    <ListTodo size={16} className="text-blue-400" />
                    <span className="font-mono font-bold text-slate-500 tracking-[0.15em] uppercase text-xs">Activities</span>
                    <span className="ml-auto text-[10px] font-mono text-slate-300">{sortedActivities.length}</span>
                </div>
            </div>

            {/* 事项列表 */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-1">
                {sortedActivities.length === 0 ? (
                    <div className="text-sm text-slate-300 italic py-6 text-center">暂无事项</div>
                ) : (
                    sortedActivities.map(act => {
                        const isEditing = editingId === act.id;
                        const colorClass = act.color || 'bg-blue-500';
                        const dayLabel = act.day_of_week != null ? DAY_LABELS[act.day_of_week] : null;
                        const startDateStr = act.date ? `${new Date(act.date + 'T00:00:00').getMonth() + 1}/${new Date(act.date + 'T00:00:00').getDate()}` : null;
                        const recurUntilStr = act.recur_until
                            ? `${new Date(act.recur_until + 'T00:00:00').getMonth() + 1}/${new Date(act.recur_until + 'T00:00:00').getDate()}`
                            : null;
                        const dateRangeStr = startDateStr && recurUntilStr ? `${startDateStr} - ${recurUntilStr}` : null;

                        return (
                            <div
                                key={act.id}
                                className={`flex items-start gap-2.5 px-2 py-2 rounded-lg group transition-colors hover:bg-slate-50 ${!isEditing ? 'cursor-pointer' : ''}`}
                                onClick={() => !isEditing && handleJump(act)}
                            >
                                {/* 左侧色条 */}
                                <div className={`w-1 shrink-0 rounded-full self-stretch ${colorClass}`} />

                                {/* 内容区 */}
                                <div className="flex-1 min-w-0">
                                    {isEditing ? (
                                        <div className="flex flex-col gap-2">
                                            <textarea
                                                ref={inputRef}
                                                value={editValue}
                                                onChange={e => setEditValue(e.target.value)}
                                                onKeyDown={e => {
                                                    if (e.key === 'Enter') {
                                                        if (e.shiftKey) {
                                                            return; // 允许换行
                                                        } else {
                                                            e.preventDefault();
                                                            confirmEdit();
                                                        }
                                                    }
                                                    if (e.key === 'Escape') cancelEdit();
                                                }}
                                                onBlur={confirmEdit}
                                                className="flex-1 min-w-0 bg-blue-50 border border-blue-200 rounded px-2 py-1 text-sm text-slate-800 focus:outline-none focus:border-blue-400 resize-none overflow-y-auto"
                                                style={{ minHeight: '40px', maxHeight: '120px' }}
                                                rows={1}
                                            />
                                            <div className="flex items-center gap-1.5 p-1 bg-slate-50 rounded-lg border border-slate-200 self-start">
                                                {COLORS.map(c => (
                                                    <button
                                                        key={c.name}
                                                        onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
                                                        onClick={(e) => { e.stopPropagation(); setEditColor(c.class); }}
                                                        className={`w-4 h-4 rounded-md ${c.class} transition-all ${editColor === c.class ? 'ring-2 ring-offset-1 ring-slate-400 scale-110' : 'opacity-60 hover:opacity-100'}`}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    ) : (
                                        <div
                                            className={`text-[20px] font-semibold leading-tight text-slate-800 whitespace-pre-wrap wrap-break-word ${!isEditing ? 'group-hover:text-blue-600' : ''}`}
                                            title="点击跳转至该事项所在周"
                                        >
                                            {act.content}
                                        </div>
                                    )}
                                    <div className="text-[12px] font-mono mt-0.5 flex items-center gap-1.5 flex-wrap">
                                        {dayLabel && <span className="text-slate-400">{dayLabel}</span>}
                                        <span className="text-slate-400">{fmtTime(act.start_time!)}-{fmtTime(act.end_time!)}</span>
                                        {dateRangeStr && (
                                            <span className="text-[11px] text-blue-500/90 italic font-medium tracking-tight bg-blue-50/50 px-1 rounded-sm">{dateRangeStr}</span>
                                        )}
                                    </div>
                                </div>

                                {/* 操作按钮 */}
                                {isAdmin && !isEditing && (
                                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-0.5">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); startEdit(act); }}
                                            className="p-0.5 text-slate-300 hover:text-blue-500 transition-colors"
                                            title="编辑"
                                        >
                                            <Pencil size={12} />
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); onRemoveActivity(act.id); }}
                                            className="p-0.5 text-slate-300 hover:text-rose-400 transition-colors"
                                            title="删除"
                                        >
                                            <Trash2 size={12} />
                                        </button>
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
