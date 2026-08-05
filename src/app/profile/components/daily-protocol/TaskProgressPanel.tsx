"use client";

import React, { useState, useEffect, useMemo } from 'react';
import useSWR from 'swr';
import { supabase } from '@/lib/supabaseClient';
import { Task, TaskWeeklyReport } from './types';
import { Activity } from '../calendar/types';
import { ChevronLeft, ChevronRight, Plus, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface TaskProgressPanelProps {
    task: Task;
    linkedActivities: Activity[];
    mutateLinkedActivities: () => void;
    isAdmin: boolean;
}

// Utility to get Monday of a given date
function getMonday(d: Date) {
    const date = new Date(d);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1); 
    return new Date(date.setDate(diff));
}

// Format Date as YYYY-MM-DD
function formatDateString(d: Date) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// Format for display (MM.DD)
function formatDisplayDate(d: Date) {
    return `${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function TaskProgressPanel({ task, linkedActivities, mutateLinkedActivities, isAdmin }: TaskProgressPanelProps) {
    const [weekOffset, setWeekOffset] = useState(0);

    // 计算当前显示的周一和周末
    const { monday, sunday, days, mondayStr } = useMemo(() => {
        const today = new Date();
        const mon = getMonday(today);
        mon.setDate(mon.getDate() + weekOffset * 7);
        
        const sun = new Date(mon);
        sun.setDate(mon.getDate() + 6);

        const dArr = [];
        for (let i = 0; i < 7; i++) {
            const cur = new Date(mon);
            cur.setDate(mon.getDate() + i);
            dArr.push({
                dateObj: cur,
                dateStr: formatDateString(cur),
                display: formatDisplayDate(cur),
                dayName: WEEKDAYS[i]
            });
        }
        
        return { monday: mon, sunday: sun, days: dArr, mondayStr: formatDateString(mon) };
    }, [weekOffset]);

    // 读取本周周报
    const { data: weeklyReport, mutate: mutateReport } = useSWR(
        `weekly_report_${task.id}_${mondayStr}`,
        async () => {
            const { data, error } = await supabase
                .from('profile_task_weekly_reports')
                .select('*')
                .eq('task_id', task.id)
                .eq('week_start_date', mondayStr)
                .maybeSingle();
            
            if (error) console.error("Error fetching weekly report:", error);
            return data as TaskWeeklyReport | null;
        }
    );

    const [reportContent, setReportContent] = useState('');
    const [isSavingReport, setIsSavingReport] = useState(false);

    useEffect(() => {
        setReportContent(weeklyReport?.content || '');
    }, [weeklyReport]);

    const handleSaveReport = async () => {
        if (!isAdmin) return toast.warning("只有本人能操作");
        setIsSavingReport(true);
        if (weeklyReport?.id) {
            // Update
            const { error } = await supabase.from('profile_task_weekly_reports')
                .update({ content: reportContent, updated_at: new Date().toISOString() })
                .eq('id', weeklyReport.id);
            if (!error) { toast.success("周报已更新"); mutateReport(); }
            else toast.error("更新失败");
        } else {
            // Insert
            const { error } = await supabase.from('profile_task_weekly_reports')
                .insert({ task_id: task.id, week_start_date: mondayStr, content: reportContent });
            if (!error) { toast.success("周报已保存"); mutateReport(); }
            else toast.error("保存失败");
        }
        setIsSavingReport(false);
    };

    // 绑定弹窗状态
    const [linkModalDate, setLinkModalDate] = useState<string | null>(null);

    return (
        <div className="flex flex-col h-full space-y-4">
            
            {/* Week Navigator */}
            <div className="flex items-center justify-between bg-slate-50 border border-slate-200/60 p-2 rounded-xl shrink-0">
                <button onClick={() => setWeekOffset(o => o - 1)} className="p-1.5 hover:bg-slate-200/50 rounded-lg text-slate-500 transition-colors">
                    <ChevronLeft size={16} />
                </button>
                <span className="text-xs font-bold font-mono tracking-widest uppercase text-slate-600">
                    {formatDisplayDate(monday)} - {formatDisplayDate(sunday)}
                </span>
                <button onClick={() => setWeekOffset(o => o + 1)} className="p-1.5 hover:bg-slate-200/50 rounded-lg text-slate-500 transition-colors">
                    <ChevronRight size={16} />
                </button>
            </div>

            {/* 7-Day Grid */}
            <div className="flex gap-2 shrink-0">
                {days.map(d => {
                    const acts = linkedActivities.filter(a => a.date === d.dateStr);
                    const isToday = d.dateStr === formatDateString(new Date());
                    return (
                        <div key={d.dateStr} className={`flex-1 flex flex-col border rounded-xl overflow-hidden ${isToday ? 'border-blue-200 bg-blue-50/60' : 'border-slate-200/80 bg-slate-100/60'}`}>
                            {/* Header */}
                            <div className={`text-center py-1.5 border-b ${isToday ? 'bg-blue-100 border-blue-200' : 'bg-slate-200/60 border-slate-200/80'}`}>
                                <div className={cn("text-[9px] font-black uppercase tracking-widest", isToday ? 'text-blue-600' : 'text-slate-500')}>{d.dayName}</div>
                                <div className={cn("text-xs font-mono font-bold", isToday ? 'text-blue-700' : 'text-slate-700')}>{d.display}</div>
                            </div>
                            {/* Content */}
                            <div className="flex-1 p-1.5 flex flex-col gap-1 min-h-24">
                                {acts.map(a => (
                                    <div 
                                        key={a.id} 
                                        className={cn(
                                            "group/act text-[10px] border p-1.5 rounded-lg leading-tight shadow-sm transition-all",
                                            isAdmin ? "cursor-pointer hover:bg-red-50 hover:border-red-200 bg-white border-slate-200" : "bg-white border-slate-200"
                                        )}
                                        onClick={isAdmin ? async () => {
                                            const { error } = await supabase.from('calendar_activities').update({ task_id: null }).eq('id', a.id);
                                            if (!error) mutateLinkedActivities();
                                            else toast.error("解绑失败");
                                        } : undefined}
                                    >
                                        {/* Normal content - hidden on hover */}
                                        <div className={isAdmin ? "group-hover/act:hidden" : ""}>
                                            <div className="font-bold text-slate-700 truncate" title={a.content}>{a.content}</div>
                                            {a.duration && <div className="text-blue-500 font-mono mt-0.5">{a.duration}h</div>}
                                        </div>
                                        {/* Delete state - shown on hover */}
                                        {isAdmin && (
                                            <div className="hidden group-hover/act:flex items-center justify-center gap-1 text-red-400 py-0.5">
                                                <X size={12} strokeWidth={3} />
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                            {/* Action */}
                            {isAdmin && (
                                <button 
                                    onClick={() => setLinkModalDate(d.dateStr)}
                                    className="p-1 mx-1.5 mb-1.5 mt-auto flex items-center justify-center border border-dashed border-slate-300 rounded-lg text-slate-400 hover:text-blue-500 hover:border-blue-300 hover:bg-blue-50 transition-colors"
                                >
                                    <Plus size={14} />
                                </button>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Weekly Report Editor */}
            <div className="flex-1 flex flex-col bg-white border border-slate-200/60 rounded-xl overflow-hidden shadow-sm">
                <div className="flex items-center justify-between px-4 py-2 border-b border-slate-100 bg-slate-50/50 shrink-0">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Weekly Report</span>
                    <button 
                        onClick={handleSaveReport}
                        disabled={isSavingReport || reportContent === weeklyReport?.content}
                        className="text-[10px] font-bold uppercase tracking-widest px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:bg-slate-300 transition-colors"
                    >
                        {isSavingReport ? 'Saving' : 'Save'}
                    </button>
                </div>
                <textarea 
                    value={reportContent}
                    onChange={e => setReportContent(e.target.value)}
                    disabled={!isAdmin}
                    placeholder="Write your weekly progress, learnings, and reflections here..."
                    className="flex-1 w-full p-4 text-sm text-slate-700 bg-transparent outline-none resize-none disabled:opacity-70 subtle-scrollbar"
                />
            </div>

            {/* Link Modal */}
            {linkModalDate && (
                <LinkActivityModal 
                    date={linkModalDate}
                    taskId={task.id}
                    onClose={() => setLinkModalDate(null)}
                    onSuccess={mutateLinkedActivities}
                />
            )}
        </div>
    );
}

// === Link Activity Modal ===
function LinkActivityModal({ date, taskId, onClose, onSuccess }: { date: string, taskId: number, onClose: () => void, onSuccess: () => void }) {
    // Fetch activities and also joined deadline info for category
    const { data: dayActivities, isLoading } = useSWR(`daily_protocol_acts_to_link_${date}`, async () => {
        const { data, error } = await supabase
            .from('calendar_activities')
            .select(`
                *,
                deadline_items (
                    title,
                    deadline_categories ( name )
                )
            `)
            .eq('date', date);
        if (error) console.error(error);
        return (data as any[]) || [];
    });

    const [isLinking, setIsLinking] = useState(false);

    const toggleLink = async (act: any) => {
        setIsLinking(true);
        const newTaskId = act.task_id === taskId ? null : taskId;
        const { error } = await supabase.from('calendar_activities').update({ task_id: newTaskId }).eq('id', act.id);
        if (error) toast.error("操作失败");
        else {
            onSuccess();
        }
        setIsLinking(false);
    };

    return (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/20 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden border border-slate-200">
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50">
                    <div>
                        <div className="text-sm font-bold text-slate-800">Bind Activities</div>
                        <div className="text-xs font-mono text-slate-500">{date}</div>
                    </div>
                    <button onClick={onClose} className="p-1 text-slate-400 hover:bg-slate-200 rounded-lg"><X size={16} /></button>
                </div>
                <div className="p-2 max-h-[60vh] overflow-y-auto subtle-scrollbar">
                    {isLoading ? (
                        <div className="text-center py-8 text-xs text-slate-400">Loading...</div>
                    ) : dayActivities && dayActivities.length > 0 ? (
                        <div className="space-y-1">
                            {dayActivities.map(act => {
                                const isLinkedToThis = act.task_id === taskId;
                                const isLinkedToOther = act.task_id && act.task_id !== taskId;
                                const categoryName = act.deadline_items?.deadline_categories?.name || 'Uncategorized';
                                return (
                                    <div 
                                        key={act.id} 
                                        onClick={() => !isLinkedToOther && toggleLink(act)}
                                        className={cn(
                                            "flex items-center justify-between p-3 rounded-xl border transition-colors cursor-pointer",
                                            isLinkedToThis ? "bg-blue-50/50 border-blue-200" : 
                                            isLinkedToOther ? "bg-slate-50 border-slate-100 opacity-60 cursor-not-allowed" : 
                                            "bg-white border-slate-100 hover:border-blue-300 hover:bg-blue-50/20"
                                        )}
                                    >
                                        <div className="flex flex-col min-w-0 pr-3">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-bold text-slate-700 truncate">{act.content}</span>
                                                <span className="shrink-0 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-slate-100 text-slate-500">{categoryName}</span>
                                            </div>
                                            {act.duration && <span className="text-xs font-mono text-slate-400 mt-0.5">{act.duration}h</span>}
                                        </div>
                                        <div className={cn(
                                            "w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors",
                                            isLinkedToThis ? "bg-blue-500 border-blue-500 text-white" : 
                                            isLinkedToOther ? "bg-slate-200 border-slate-200 text-slate-400" :
                                            "border-slate-300 text-transparent"
                                        )}>
                                            <Check size={12} strokeWidth={3} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-xs text-slate-400">该日期下没有记录任何事项</div>
                    )}
                </div>
            </div>
        </div>
    );
}
