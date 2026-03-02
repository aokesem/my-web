"use client";

import React, { useState, useMemo } from 'react';
import { Clock, Check, Trash2, Plus, Pencil, X } from 'lucide-react';
import { Deadline, formatDateKey } from './types';

interface DeadlinePanelProps {
    deadlines: Deadline[];
    isAdmin: boolean;
    onAddDeadline: (title: string, date: string) => Promise<void>;
    onToggleDeadline: (id: number) => Promise<void>;
    onRemoveDeadline: (id: number) => Promise<void>;
    onUpdateDeadline: (id: number, title: string, date: string) => Promise<void>;
}

export default function DeadlinePanel({
    deadlines, isAdmin, onAddDeadline, onToggleDeadline, onRemoveDeadline, onUpdateDeadline
}: DeadlinePanelProps) {
    const [newDeadlineTitle, setNewDeadlineTitle] = useState('');
    const [newDeadlineDate, setNewDeadlineDate] = useState('');

    const [editingId, setEditingId] = useState<number | null>(null);
    const [editTitle, setEditTitle] = useState('');
    const [editDate, setEditDate] = useState('');

    const today = useMemo(() => new Date(), []);
    const todayStr = useMemo(() => formatDateKey(today.getFullYear(), today.getMonth(), today.getDate()), [today]);

    const handleAdd = async () => {
        if (!newDeadlineTitle.trim()) return;
        await onAddDeadline(newDeadlineTitle.trim(), newDeadlineDate);
        setNewDeadlineTitle('');
        setNewDeadlineDate('');
    };

    const startEdit = (dl: Deadline) => {
        setEditingId(dl.id);
        setEditTitle(dl.title);
        setEditDate(dl.date && dl.date !== '2099-12-31' ? dl.date : '');
    };

    const confirmEdit = async () => {
        if (editingId === null) return;
        const trimmed = editTitle.trim();
        if (trimmed) {
            await onUpdateDeadline(editingId, trimmed, editDate);
        }
        setEditingId(null);
    };

    const cancelEdit = () => {
        setEditingId(null);
    };

    const sortedDeadlines = useMemo(() => {
        const active = deadlines.filter(d => (!d.date || d.date === '2099-12-31' || d.date >= todayStr) && !d.done)
            .sort((a, b) => (a.date || '2099-12-31').localeCompare(b.date || '2099-12-31'));
        const expired = deadlines.filter(d => (d.date && d.date !== '2099-12-31' && d.date < todayStr) || d.done)
            .sort((a, b) => (a.date || '2099-12-31').localeCompare(b.date || '2099-12-31'));
        return [...active, ...expired];
    }, [deadlines, todayStr]);

    return (
        <div className="w-[260px] bg-white/95 backdrop-blur-xl rounded-l-2xl border border-r-0 border-slate-200/80 flex flex-col overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 shrink-0">
                <div className="flex items-center gap-2">
                    <Clock size={16} className="text-rose-400" />
                    <span className="font-mono font-bold text-slate-500 tracking-[0.15em] uppercase text-xs">Deadlines</span>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-1.5">
                {sortedDeadlines.length === 0 ? (
                    <div className="text-sm text-slate-300 italic py-6 text-center">暂无 deadline</div>
                ) : (
                    sortedDeadlines.map(dl => {
                        const isExpired = dl.date && dl.date !== '2099-12-31' ? dl.date < todayStr : false;
                        const isOverdue = isExpired && !dl.done;

                        return (
                            <div
                                key={dl.id}
                                className={`flex items-start gap-2.5 px-3 py-2.5 rounded-lg group transition-colors ${isExpired || dl.done ? 'opacity-40' : 'hover:bg-slate-50'}`}
                            >
                                {isAdmin && (
                                    <button
                                        onClick={() => onToggleDeadline(dl.id)}
                                        className={`mt-0.5 w-4 h-4 rounded border shrink-0 flex items-center justify-center transition-colors ${dl.done ? 'bg-emerald-100 border-emerald-300 text-emerald-500' : 'border-slate-300 hover:border-blue-400'}`}
                                    >
                                        {dl.done && <Check size={10} />}
                                    </button>
                                )}
                                <div className="flex-1 min-w-0">
                                    {editingId === dl.id ? (
                                        <div className="flex flex-col gap-2 py-0.5">
                                            <input
                                                value={editTitle}
                                                onChange={e => setEditTitle(e.target.value)}
                                                onKeyDown={e => {
                                                    if (e.key === 'Enter') confirmEdit();
                                                    if (e.key === 'Escape') cancelEdit();
                                                }}
                                                autoFocus
                                                className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-sm text-slate-800 focus:outline-none focus:border-blue-400"
                                            />
                                            <div className="flex items-center gap-1 relative z-10 w-full">
                                                <input
                                                    type="date"
                                                    value={editDate}
                                                    onChange={e => setEditDate(e.target.value)}
                                                    className="flex-1 min-w-0 bg-slate-50 border border-slate-200 rounded px-1.5 py-1 text-[11px] text-slate-700 focus:outline-none focus:border-blue-400"
                                                />
                                                <button onClick={confirmEdit} className="p-1 rounded text-blue-500 hover:bg-blue-50 transition-colors bg-white border border-blue-200/50 shrink-0"><Check size={14} /></button>
                                                <button onClick={cancelEdit} className="p-1 rounded text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-colors bg-white border border-slate-200 shrink-0"><X size={14} /></button>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <div className={`text-[14px] font-semibold leading-tight ${dl.done ? 'line-through text-slate-400' : isOverdue ? 'text-rose-500' : 'text-slate-800'}`}>
                                                {dl.title}
                                            </div>
                                            <div className={`text-[13px] font-mono mt-0.5 ${isOverdue ? 'text-rose-400' : 'text-slate-400'}`}>
                                                {dl.date && dl.date !== '2099-12-31' ? dl.date.slice(5).replace('-', '/') : 'Anytime'}
                                            </div>
                                        </>
                                    )}
                                </div>
                                {isAdmin && editingId !== dl.id && (
                                    <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 mt-0.5 transition-opacity shrink-0">
                                        <button
                                            onClick={() => startEdit(dl)}
                                            className="text-slate-300 hover:text-blue-500 transition-colors p-0.5"
                                        >
                                            <Pencil size={12} />
                                        </button>
                                        <button
                                            onClick={() => onRemoveDeadline(dl.id)}
                                            className="text-slate-300 hover:text-rose-400 transition-colors p-0.5"
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
                            onClick={handleAdd}
                            className="px-3 py-1.5 rounded-lg bg-rose-50 text-rose-500 hover:bg-rose-100 transition-colors border border-rose-200/50 text-xs font-bold"
                        >
                            <Plus size={14} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
