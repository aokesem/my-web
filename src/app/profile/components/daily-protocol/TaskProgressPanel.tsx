"use client";

import React, { useState, useEffect, useMemo } from 'react';
import useSWR from 'swr';
import { supabase } from '@/lib/supabaseClient';
import { Task, TaskWeeklyReport } from './types';
import { Activity, DeadlineCategory, DeadlineItem } from '../calendar/types';
import { ChevronDown, ChevronLeft, ChevronRight, Link2, Plus, Search, Settings2, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

interface TaskProgressPanelProps {
    task: Task;
    linkedActivities: TaskLinkedActivity[];
    mutateLinkedActivities: () => void;
    isAdmin: boolean;
}

export interface TaskLinkedActivity extends Activity {
    linkSource: {
        manual: boolean;
        automatic: boolean;
    };
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

interface TaskCalendarLinksData {
    categories: DeadlineCategory[];
    items: DeadlineItem[];
    categoryIds: number[];
    itemIds: number[];
}

interface CalendarLinkManagerProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    taskId: number;
    data: TaskCalendarLinksData;
    onSaved: () => Promise<unknown>;
}

function CalendarLinkManager({ open, onOpenChange, taskId, data, onSaved }: CalendarLinkManagerProps) {
    const [selectedCategoryIds, setSelectedCategoryIds] = useState<Set<number>>(new Set());
    const [selectedItemIds, setSelectedItemIds] = useState<Set<number>>(new Set());
    const [expandedCategoryIds, setExpandedCategoryIds] = useState<Set<number>>(new Set());
    const [searchQuery, setSearchQuery] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const initializeDraft = () => {
        setSelectedCategoryIds(new Set(data.categoryIds));
        setSelectedItemIds(new Set(data.itemIds));
        setExpandedCategoryIds(new Set(data.categories.map(category => category.id)));
        setSearchQuery('');
    };

    const handleOpenChange = (nextOpen: boolean) => {
        if (nextOpen) initializeDraft();
        onOpenChange(nextOpen);
    };

    const toggleId = (ids: Set<number>, id: number, setter: React.Dispatch<React.SetStateAction<Set<number>>>) => {
        const next = new Set(ids);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setter(next);
    };

    const normalizedSearch = searchQuery.trim().toLocaleLowerCase();
    const visibleCategories = data.categories.filter(category => {
        if (!normalizedSearch) return true;
        return category.name.toLocaleLowerCase().includes(normalizedSearch)
            || data.items.some(item => item.category_id === category.id && item.title.toLocaleLowerCase().includes(normalizedSearch));
    });

    const handleSave = async () => {
        setIsSaving(true);
        const nextCategoryIds = Array.from(selectedCategoryIds);
        const nextItemIds = Array.from(selectedItemIds);
        const categoryIdsToAdd = nextCategoryIds.filter(id => !data.categoryIds.includes(id));
        const categoryIdsToRemove = data.categoryIds.filter(id => !selectedCategoryIds.has(id));
        const itemIdsToAdd = nextItemIds.filter(id => !data.itemIds.includes(id));
        const itemIdsToRemove = data.itemIds.filter(id => !selectedItemIds.has(id));

        const operations = [];
        if (categoryIdsToAdd.length > 0) {
            operations.push(supabase.from('profile_task_deadline_categories').insert(
                categoryIdsToAdd.map(deadline_category_id => ({ task_id: taskId, deadline_category_id }))
            ));
        }
        if (categoryIdsToRemove.length > 0) {
            operations.push(supabase.from('profile_task_deadline_categories').delete()
                .eq('task_id', taskId).in('deadline_category_id', categoryIdsToRemove));
        }
        if (itemIdsToAdd.length > 0) {
            operations.push(supabase.from('profile_task_deadline_items').insert(
                itemIdsToAdd.map(deadline_item_id => ({ task_id: taskId, deadline_item_id }))
            ));
        }
        if (itemIdsToRemove.length > 0) {
            operations.push(supabase.from('profile_task_deadline_items').delete()
                .eq('task_id', taskId).in('deadline_item_id', itemIdsToRemove));
        }

        const results = await Promise.all(operations);
        const error = results.find(result => result.error)?.error;
        if (error) {
            toast.error(`保存关联失败：${error.message}`);
            setIsSaving(false);
            return;
        }

        await onSaved();
        toast.success('日历关联已更新');
        setIsSaving(false);
        onOpenChange(false);
    };

    const hasChanges = selectedCategoryIds.size !== data.categoryIds.length
        || selectedItemIds.size !== data.itemIds.length
        || data.categoryIds.some(id => !selectedCategoryIds.has(id))
        || data.itemIds.some(id => !selectedItemIds.has(id));

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="flex max-h-[82vh] flex-col gap-0 overflow-hidden border-slate-200 bg-white p-0 text-slate-800 sm:max-w-xl">
                <DialogHeader className="border-b border-slate-100 px-6 py-5">
                    <DialogTitle className="flex items-center gap-2 text-base">
                        <Link2 size={17} className="text-blue-500" />
                        自动关联日历事项
                    </DialogTitle>
                    <DialogDescription className="text-xs text-slate-400">
                        日历记录命中所选分类或事项时，将自动计入当前计划的进程。
                    </DialogDescription>
                </DialogHeader>

                <div className="border-b border-slate-100 px-5 py-3">
                    <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 focus-within:border-blue-300 focus-within:bg-white">
                        <Search size={14} className="text-slate-400" />
                        <input
                            value={searchQuery}
                            onChange={event => setSearchQuery(event.target.value)}
                            placeholder="搜索分类或事项"
                            className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-300"
                        />
                    </div>
                </div>

                <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-4 subtle-scrollbar">
                    {visibleCategories.map(category => {
                        const categoryItems = data.items.filter(item =>
                            item.category_id === category.id
                            && (!normalizedSearch || category.name.toLocaleLowerCase().includes(normalizedSearch)
                                || item.title.toLocaleLowerCase().includes(normalizedSearch))
                        );
                        const isCategorySelected = selectedCategoryIds.has(category.id);
                        const isExpanded = expandedCategoryIds.has(category.id) || !!normalizedSearch;

                        return (
                            <div key={category.id} className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                                <div className="flex items-center gap-3 bg-slate-50/70 px-3 py-2.5">
                                    <button
                                        type="button"
                                        onClick={() => toggleId(expandedCategoryIds, category.id, setExpandedCategoryIds)}
                                        className="rounded p-0.5 text-slate-400 hover:bg-slate-200 hover:text-slate-600"
                                        aria-label={isExpanded ? '收起分类' : '展开分类'}
                                    >
                                        <ChevronDown size={15} className={cn('transition-transform', !isExpanded && '-rotate-90')} />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => toggleId(selectedCategoryIds, category.id, setSelectedCategoryIds)}
                                        className="flex min-w-0 flex-1 items-center gap-2 text-left"
                                    >
                                        <span className={cn(
                                            'flex h-4 w-4 shrink-0 items-center justify-center rounded border',
                                            isCategorySelected ? 'border-blue-500 bg-blue-500 text-white' : 'border-slate-300 bg-white text-transparent'
                                        )}>
                                            <Check size={11} strokeWidth={3} />
                                        </span>
                                        <span className="truncate text-xs font-bold uppercase tracking-wider text-slate-600">{category.name}</span>
                                        <span className="ml-auto text-[10px] font-mono text-slate-300">{categoryItems.length}</span>
                                    </button>
                                </div>

                                {isExpanded && (
                                    <div className="space-y-1 border-t border-slate-100 p-2">
                                        {categoryItems.length > 0 ? categoryItems.map(item => {
                                            const isItemSelected = selectedItemIds.has(item.id);
                                            return (
                                                <button
                                                    key={item.id}
                                                    type="button"
                                                    onClick={() => toggleId(selectedItemIds, item.id, setSelectedItemIds)}
                                                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left hover:bg-blue-50/50"
                                                >
                                                    <span className={cn(
                                                        'flex h-4 w-4 shrink-0 items-center justify-center rounded border',
                                                        isItemSelected ? 'border-blue-500 bg-blue-500 text-white' : 'border-slate-300 bg-white text-transparent'
                                                    )}>
                                                        <Check size={11} strokeWidth={3} />
                                                    </span>
                                                    <span className="min-w-0 flex-1 truncate text-sm text-slate-600">{item.title}</span>
                                                    {isCategorySelected && (
                                                        <span className="shrink-0 rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold text-slate-400">分类已覆盖</span>
                                                    )}
                                                </button>
                                            );
                                        }) : (
                                            <div className="px-3 py-4 text-center text-xs text-slate-300">该分类下暂无事项</div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                    {visibleCategories.length === 0 && (
                        <div className="py-10 text-center text-xs text-slate-400">没有匹配的分类或事项</div>
                    )}
                </div>

                <DialogFooter className="border-t border-slate-100 bg-slate-50/60 px-5 py-4 sm:justify-between">
                    <span className="self-center text-[11px] font-mono text-slate-400">
                        {selectedCategoryIds.size} 个分类 · {selectedItemIds.size} 个事项
                    </span>
                    <div className="flex gap-2">
                        <button type="button" onClick={() => onOpenChange(false)} className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-50">
                            取消
                        </button>
                        <button type="button" onClick={handleSave} disabled={!hasChanges || isSaving} className="rounded-lg bg-blue-500 px-4 py-2 text-xs font-bold text-white hover:bg-blue-600 disabled:bg-slate-300">
                            {isSaving ? '保存中...' : '保存关联'}
                        </button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export default function TaskProgressPanel({ task, linkedActivities, mutateLinkedActivities, isAdmin }: TaskProgressPanelProps) {
    const [weekOffset, setWeekOffset] = useState(0);
    const [isLinkManagerOpen, setIsLinkManagerOpen] = useState(false);

    const { data: linkData = {
        categories: [],
        items: [],
        categoryIds: [],
        itemIds: [],
    }, mutate: mutateLinkData } = useSWR<TaskCalendarLinksData>(
        `task_calendar_links_${task.id}`,
        async () => {
            const [categoriesResult, itemsResult, categoryLinksResult, itemLinksResult] = await Promise.all([
                supabase.from('deadline_categories').select('*').order('sort_order', { ascending: true }),
                supabase.from('deadline_items').select('*').order('sort_order', { ascending: true }),
                supabase.from('profile_task_deadline_categories').select('deadline_category_id').eq('task_id', task.id),
                supabase.from('profile_task_deadline_items').select('deadline_item_id').eq('task_id', task.id),
            ]);

            const error = categoriesResult.error || itemsResult.error || categoryLinksResult.error || itemLinksResult.error;
            if (error) {
                console.error('Failed to fetch task calendar links:', error);
                return { categories: [], items: [], categoryIds: [], itemIds: [] };
            }

            return {
                categories: (categoriesResult.data || []) as DeadlineCategory[],
                items: (itemsResult.data || []).filter(item => !item.is_archived) as DeadlineItem[],
                categoryIds: (categoryLinksResult.data || []).map(link => Number(link.deadline_category_id)),
                itemIds: (itemLinksResult.data || []).map(link => Number(link.deadline_item_id)),
            };
        }
    );

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

    const getAutomaticSourceLabel = (activity: TaskLinkedActivity) => {
        const item = linkData.items.find(entry => entry.id === activity.deadline_item_id);
        if (!item) return '已关联的日历事项';
        const category = linkData.categories.find(entry => entry.id === item.category_id);
        return category ? `${category.name} / ${item.title}` : item.title;
    };

    const handleActivityClick = async (activity: TaskLinkedActivity) => {
        if (!isAdmin) return;
        if (activity.linkSource.automatic) {
            toast.info(`该记录由“${getAutomaticSourceLabel(activity)}”自动同步，请在管理关联中调整规则`);
            setIsLinkManagerOpen(true);
            return;
        }

        const { error } = await supabase
            .from('calendar_activities')
            .update({ task_id: null })
            .eq('id', activity.id);
        if (error) toast.error('解绑失败');
        else await mutateLinkedActivities();
    };

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

            {/* 自动关联来源 */}
            <div className="flex items-center gap-3 rounded-xl border border-blue-100 bg-blue-50/40 px-3 py-2.5 shrink-0">
                <div className="flex items-center gap-1.5 shrink-0 text-[10px] font-bold uppercase tracking-widest text-blue-500">
                    <Link2 size={13} />
                    <span>进度来源</span>
                </div>
                <div className="flex min-w-0 flex-1 items-center gap-1.5 overflow-hidden">
                    {linkData.categoryIds.map(id => {
                        const category = linkData.categories.find(item => item.id === id);
                        return category ? <span key={`category-${id}`} className="shrink-0 rounded-full bg-blue-100 px-2 py-1 text-[10px] font-bold text-blue-700">{category.name}</span> : null;
                    })}
                    {linkData.itemIds.map(id => {
                        const item = linkData.items.find(entry => entry.id === id);
                        return item ? <span key={`item-${id}`} className="shrink-0 rounded-full border border-blue-200 bg-white px-2 py-1 text-[10px] font-medium text-slate-600">{item.title}</span> : null;
                    })}
                    {linkData.categoryIds.length === 0 && linkData.itemIds.length === 0 && (
                        <span className="truncate text-[11px] text-slate-400">尚未设置自动关联</span>
                    )}
                </div>
                <button
                    type="button"
                    onClick={() => setIsLinkManagerOpen(true)}
                    disabled={!isAdmin}
                    className="flex shrink-0 items-center gap-1 rounded-lg border border-blue-200 bg-white px-2.5 py-1.5 text-[10px] font-bold text-blue-600 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                    <Settings2 size={12} />
                    管理关联
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
                                            "bg-white border-slate-200",
                                            isAdmin && a.linkSource.automatic && "cursor-pointer hover:border-blue-300 hover:bg-blue-50/50",
                                            isAdmin && !a.linkSource.automatic && "cursor-pointer hover:border-red-200 hover:bg-red-50"
                                        )}
                                        onClick={isAdmin ? () => handleActivityClick(a) : undefined}
                                        title={a.linkSource.automatic ? `自动来源：${getAutomaticSourceLabel(a)}` : '点击解除手动关联'}
                                    >
                                        <div>
                                            <div className="font-bold text-slate-700 truncate" title={a.content}>{a.content}</div>
                                            <div className="mt-1 flex items-center justify-between gap-1">
                                                {a.duration ? <span className="font-mono text-blue-500">{a.duration}h</span> : <span />}
                                                <span className="flex items-center gap-0.5">
                                                    {a.linkSource.automatic && (
                                                        <span className="rounded bg-blue-50 px-1 py-0.5 text-[8px] font-black tracking-wider text-blue-500">AUTO</span>
                                                    )}
                                                    {a.linkSource.manual && (
                                                        <span className="rounded bg-slate-100 px-1 py-0.5 text-[8px] font-black tracking-wider text-slate-400">MANUAL</span>
                                                    )}
                                                </span>
                                            </div>
                                        </div>
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

            <CalendarLinkManager
                open={isLinkManagerOpen}
                onOpenChange={setIsLinkManagerOpen}
                taskId={task.id}
                data={linkData}
                onSaved={async () => {
                    await mutateLinkData();
                    await mutateLinkedActivities();
                }}
            />
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
