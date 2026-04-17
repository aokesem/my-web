"use client";

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { ListTodo, Trash2, Pencil, Check } from 'lucide-react';
import { Activity, DeadlineItem, WEEKDAYS, formatDateKey } from './types';
import { SafeDeleteDialog } from '@/components/ui/safe-delete-dialog';

interface WeekActivityListPanelProps {
    allActivities: Activity[];
    deadlineItems: DeadlineItem[];
    isAdmin: boolean;
    selectedKey?: string;
    onRemoveActivity: (id: number) => Promise<void>;
    onClearDayOneOffs?: (dateKey: string) => Promise<void>;
    onRefresh: () => void;
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
    allActivities, deadlineItems, isAdmin, selectedKey, onRemoveActivity, onClearDayOneOffs, onRefresh, onUpdateActivity, onJumpToDate
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

    // 将事项拆分为「单次」与「循环」
    const splitActivities = useMemo(() => {
        const oneOffs = allActivities
            .filter(a => a.day_of_week == null && a.start_time && a.end_time)
            .sort((a, b) => {
                const dateComp = (a.date || '').localeCompare(b.date || '');
                if (dateComp !== 0) return dateComp;
                return (a.start_time || '').localeCompare(b.start_time || '');
            });

        const routines = allActivities
            .filter(a => a.day_of_week != null && a.start_time && a.end_time)
            .sort((a, b) => {
                // 按结束日期升序排
                return (a.recur_until || '').localeCompare(b.recur_until || '');
            });

        return { oneOffs, routines };
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

    const renderActivityGroup = (title: string, list: Activity[], iconColor: string, isOneOff: boolean) => (
        <div className="space-y-1">
            <div className="flex items-center gap-1.5 px-2 py-1 mb-1">
                <div className={`w-1 h-3 rounded-full ${iconColor}`} />
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{title}</span>
                <span className="text-[9px] font-mono text-slate-300 ml-1">{list.length}</span>
                
                {isAdmin && isOneOff && onClearDayOneOffs && selectedKey && (
                    <button 
                        onClick={() => {
                            const count = list.filter(a => a.date === selectedKey).length;
                            if (count === 0) return;
                            if (window.confirm(`确定要清空选中日 (${selectedKey}) 的所有 ${count} 个单次任务吗？`)) {
                                onClearDayOneOffs(selectedKey);
                            }
                        }}
                        className="ml-auto text-[9px] font-bold text-rose-400/70 hover:text-rose-500 flex items-center gap-0.5 px-1.5 py-0.5 rounded-md hover:bg-rose-50 transition-colors"
                        title="清空选中日单次任务"
                    >
                        <Trash2 size={10} />
                        <span>CLEAR DAY</span>
                    </button>
                )}
            </div>
            {list.length === 0 ? (
                <div className="text-[11px] text-slate-300 italic px-4 py-2 opacity-60">暂无事项</div>
            ) : (
                list.map(act => {
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
                            <div className={`w-1 shrink-0 rounded-full self-stretch ${colorClass}`} />
                            <div className="flex-1 min-w-0">
                                {isEditing ? (
                                    <div className="flex flex-col gap-2">
                                        <textarea
                                            ref={inputRef}
                                            value={editValue}
                                            onChange={e => setEditValue(e.target.value)}
                                            onKeyDown={e => {
                                                if (e.key === 'Enter') {
                                                    if (e.shiftKey) return;
                                                    else { e.preventDefault(); confirmEdit(); }
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
                                    <>
                                        <div className={`text-[15px] font-semibold leading-tight text-slate-800 whitespace-pre-wrap wrap-break-word ${!isEditing ? 'group-hover:text-blue-600' : ''}`}>
                                            {act.content}
                                        </div>
                                        {act.deadline_item_id && (() => {
                                            const linked = deadlineItems.find(i => i.id === act.deadline_item_id);
                                            return linked ? (
                                                <div className="text-[10px] font-medium text-rose-400 bg-rose-50 px-1.5 py-0.5 rounded-full mt-0.5 w-fit">
                                                    {linked.title}
                                                </div>
                                            ) : null;
                                        })()}
                                    </>
                                )}
                                <div className="text-[11px] font-mono mt-0.5 flex items-center gap-1.5 flex-wrap">
                                    {act.date && !dayLabel && (
                                        <span className="text-blue-500 font-bold bg-blue-50 px-1 rounded-sm">
                                            {act.date.slice(5).replace('-', '/')}
                                        </span>
                                    )}
                                    {dayLabel && <span className="text-slate-400">{dayLabel}</span>}
                                    <span className="text-slate-400">{fmtTime(act.start_time!)}-{fmtTime(act.end_time!)}</span>
                                    {dateRangeStr && (
                                        <span className="text-[10px] text-blue-500/90 italic font-medium tracking-tight bg-blue-50/50 px-1 rounded-sm">{dateRangeStr}</span>
                                    )}
                                </div>
                            </div>

                            {isAdmin && !isEditing && (
                                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-0.5">
                                    <button onClick={(e) => { e.stopPropagation(); startEdit(act); }} className="p-0.5 text-slate-300 hover:text-blue-500"><Pencil size={12} /></button>
                                    <SafeDeleteDialog table="calendar_activities" recordId={act.id} title="确定要彻底删除该事项吗？" onSuccess={onRefresh}>
                                        <button className="p-0.5 text-slate-300 hover:text-rose-400" onClick={(e) => e.stopPropagation()}><Trash2 size={12} /></button>
                                    </SafeDeleteDialog>
                                </div>
                            )}
                        </div>
                    );
                })
            )}
        </div>
    );

    return (
        <div className="w-[260px] bg-white/95 backdrop-blur-xl rounded-r-2xl border border-l-0 border-slate-200/80 flex flex-col overflow-hidden">
            {/* 标题栏 */}
            <div className="px-5 py-4 border-b border-slate-100 shrink-0">
                <div className="flex items-center gap-2">
                    <ListTodo size={16} className="text-blue-400" />
                    <span className="font-mono font-bold text-slate-500 tracking-[0.15em] uppercase text-xs">Activities</span>
                    <span className="ml-auto text-[10px] font-mono text-slate-300">{allActivities.length}</span>
                </div>
            </div>

            {/* 事项列表 */}
            <div className="flex-1 overflow-y-auto px-2 py-4 space-y-6">
                {renderActivityGroup("单次任务", splitActivities.oneOffs, "bg-blue-400", true)}
                {renderActivityGroup("周期循环", splitActivities.routines, "bg-slate-400", false)}
            </div>
        </div>
    );
}
