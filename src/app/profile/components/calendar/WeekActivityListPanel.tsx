"use client";

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { ListTodo, Trash2, Pencil, Check } from 'lucide-react';
import { Activity, WEEKDAYS } from './types';

interface WeekActivityListPanelProps {
    allActivities: Activity[];
    isAdmin: boolean;
    onRemoveActivity: (id: number) => Promise<void>;
    onUpdateActivity: (id: number, content: string) => Promise<void>;
}

const DAY_LABELS = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];

export default function WeekActivityListPanel({
    allActivities, isAdmin, onRemoveActivity, onUpdateActivity
}: WeekActivityListPanelProps) {
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editValue, setEditValue] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

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
                const dayA = a.day_of_week ?? 7; // 无 day_of_week 的排最后
                const dayB = b.day_of_week ?? 7;
                if (dayA !== dayB) return dayA - dayB;
                return (a.start_time || '').localeCompare(b.start_time || '');
            });
    }, [allActivities]);

    const startEdit = (act: Activity) => {
        setEditingId(act.id);
        setEditValue(act.content);
    };

    const confirmEdit = async () => {
        if (editingId === null) return;
        const trimmed = editValue.trim();
        if (trimmed) {
            await onUpdateActivity(editingId, trimmed);
        }
        setEditingId(null);
    };

    const cancelEdit = () => {
        setEditingId(null);
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
                        const recurUntilStr = act.recur_until
                            ? `→ ${new Date(act.recur_until + 'T00:00:00').getMonth() + 1}/${new Date(act.recur_until + 'T00:00:00').getDate()}`
                            : null;

                        return (
                            <div
                                key={act.id}
                                className="flex items-start gap-2.5 px-2 py-2 rounded-lg group transition-colors hover:bg-slate-50"
                            >
                                {/* 左侧色条 */}
                                <div className={`w-1 shrink-0 rounded-full self-stretch ${colorClass}`} />

                                {/* 内容区 */}
                                <div className="flex-1 min-w-0">
                                    {isEditing ? (
                                        <div className="flex items-center gap-1">
                                            <input
                                                ref={inputRef}
                                                value={editValue}
                                                onChange={e => setEditValue(e.target.value)}
                                                onKeyDown={e => {
                                                    if (e.key === 'Enter') confirmEdit();
                                                    if (e.key === 'Escape') cancelEdit();
                                                }}
                                                onBlur={confirmEdit}
                                                className="flex-1 min-w-0 bg-blue-50 border border-blue-200 rounded px-2 py-0.5 text-sm text-slate-800 focus:outline-none focus:border-blue-400"
                                            />
                                        </div>
                                    ) : (
                                        <div
                                            className={`text-[20px] font-semibold leading-tight text-slate-800 ${isAdmin ? 'cursor-pointer hover:text-blue-600' : ''}`}
                                            onClick={() => isAdmin && startEdit(act)}
                                            title={isAdmin ? '点击编辑' : undefined}
                                        >
                                            {act.content}
                                        </div>
                                    )}
                                    <div className="text-[11px] font-mono text-slate-400 mt-0.5 flex items-center gap-1 flex-wrap">
                                        {dayLabel && <span>{dayLabel}</span>}
                                        <span>{fmtTime(act.start_time!)}-{fmtTime(act.end_time!)}</span>
                                        {recurUntilStr && (
                                            <span className="text-blue-400">{recurUntilStr}</span>
                                        )}
                                    </div>
                                </div>

                                {/* 操作按钮 */}
                                {isAdmin && !isEditing && (
                                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-0.5">
                                        <button
                                            onClick={() => startEdit(act)}
                                            className="p-0.5 text-slate-300 hover:text-blue-500 transition-colors"
                                            title="编辑"
                                        >
                                            <Pencil size={12} />
                                        </button>
                                        <button
                                            onClick={() => onRemoveActivity(act.id)}
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
