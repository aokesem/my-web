"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Calendar, CheckCircle2, Circle, Play, Flag, Target, 
    X, Plus, Save, Clock, Trash2, Pencil, Milestone as MilestoneIcon 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Task, TaskType, TYPE_OPTIONS, CATEGORY_CONFIG, Milestone, TaskWeeklyReport } from './types';
import HorizonView from './HorizonView';
import TaskProgressPanel, { TaskLinkedActivity } from './TaskProgressPanel';
import useSWR from 'swr';
import { supabase } from '@/lib/supabaseClient';
import { Activity } from '../calendar/types';

interface TaskDetailPanelProps {
    task: Task | null;
    isAdmin: boolean;
    onUpdateTask: (id: number, updates: Partial<Task>) => void;
    onToggleStatus: (id: number, currentStatus: Task['status']) => void;
    onAddMilestone: (taskId: number, title: string, startDate: string, endDate: string) => void;
    onDeleteMilestone: (msId: number) => void;
    onUpdateMilestone: (msId: number, title: string, startDate: string, endDate: string) => void;
    onClose: () => void;
}

// 独立的里程碑子组件，处理内部编辑态
const MilestoneItem = ({ ms, isAdmin, onUpdate, onDelete }: { 
    ms: Milestone, isAdmin: boolean, 
    onUpdate: (id: number, t: string, sd: string, ed: string) => void, 
    onDelete: (id: number) => void 
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [title, setTitle] = useState(ms.title);
    const [startDate, setStartDate] = useState(ms.date);
    const [endDate, setEndDate] = useState(ms.end_date || ms.date);

    const handleSave = () => {
        if (!title.trim()) return;
        onUpdate(ms.id, title, startDate, endDate);
        setIsEditing(false);
    };

    return (
        <div className="relative group/ms">
            {/* 垂直时间轴圆圈 */}
            <div className="absolute -left-7 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center">
                <div className="w-2.5 h-2.5 rounded-full bg-blue-400 ring-[3px] ring-white relative z-10" />
            </div>

            <div className="ml-0 p-3 bg-white border border-slate-100/80 rounded-xl flex flex-col transition-all duration-200 hover:border-slate-200">
                {isEditing ? (
                    <div className="flex flex-col gap-2.5">
                        <input 
                            value={title} 
                            onChange={e => setTitle(e.target.value)} 
                            className="text-sm font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded px-2 py-1 outline-none focus:border-blue-400" 
                        />
                        <div className="flex items-center gap-2">
                            <input 
                                type="date" 
                                value={startDate} 
                                onChange={e => setStartDate(e.target.value)} 
                                className="flex-1 text-xs font-mono bg-slate-50 border border-slate-200 rounded px-2 py-1 text-slate-600 outline-none focus:border-blue-400" 
                            />
                            <span className="text-slate-300">-</span>
                            <input 
                                type="date" 
                                value={endDate} 
                                onChange={e => setEndDate(e.target.value)} 
                                className="flex-1 text-xs font-mono bg-slate-50 border border-slate-200 rounded px-2 py-1 text-slate-600 outline-none focus:border-blue-400" 
                            />
                            <div className="flex gap-1">
                                <button onClick={() => setIsEditing(false)} className="p-1.5 text-slate-400 hover:bg-slate-100 rounded"><X size={14} /></button>
                                <button onClick={handleSave} className="p-1.5 text-white bg-blue-500 hover:bg-blue-600 rounded"><Save size={14} /></button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center justify-between">
                        <div className="flex flex-col min-w-0 pr-2">
                            <span className="text-sm font-bold text-slate-700 truncate leading-tight">{ms.title}</span>
                            <span className="text-[11px] font-mono text-slate-400 mt-1">
                                {ms.date.replace(/-/g, '.')} {ms.end_date && ms.end_date !== ms.date ? `- ${ms.end_date.replace(/-/g, '.')}` : ''}
                            </span>
                        </div>
                        {isAdmin && (
                            <div className="opacity-0 group-hover/ms:opacity-100 flex items-center gap-1 shrink-0 transition-opacity">
                                <button onClick={() => setIsEditing(true)} className="p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 rounded-md transition-colors"><Pencil size={14} /></button>
                                <button onClick={() => onDelete(ms.id)} className="p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-500 rounded-md transition-colors"><Trash2 size={14} /></button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default function TaskDetailPanel({
    task,
    isAdmin,
    onUpdateTask,
    onToggleStatus,
    onAddMilestone,
    onDeleteMilestone,
    onUpdateMilestone,
    onClose
}: TaskDetailPanelProps) {
    // Local state for editing basic info
    const [title, setTitle] = useState('');
    const [taskType, setTaskType] = useState<TaskType>('plan');
    const [startDate, setStartDate] = useState('');
    const [deadline, setDeadline] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    
    // View Mode
    const [viewMode, setViewMode] = useState<'overview' | 'progress'>('overview');
    
    // Milestone input (adding new)
    const [msTitle, setMsTitle] = useState('');
    const [msDate, setMsDate] = useState(new Date().toISOString().split('T')[0]);
    const [msEndDate, setMsEndDate] = useState('');

    // 手动关联与分类/事项规则共同决定计划进程，按活动 ID 合并避免重复统计。
    const { data: linkedActivities = [], mutate: mutateLinkedActivities } = useSWR(
        task ? ['task_activities', task.id, task.startDate, task.deadline || null] : null,
        async () => {
            const taskId = task!.id;
            let manualQuery = supabase.from('calendar_activities').select('*').eq('task_id', taskId);
            if (task!.startDate) manualQuery = manualQuery.gte('date', task!.startDate);
            if (task!.deadline) manualQuery = manualQuery.lte('date', task!.deadline);

            const [manualResult, categoryLinksResult, itemLinksResult] = await Promise.all([
                manualQuery,
                supabase
                    .from('profile_task_deadline_categories')
                    .select('deadline_category_id')
                    .eq('task_id', taskId),
                supabase
                    .from('profile_task_deadline_items')
                    .select('deadline_item_id')
                    .eq('task_id', taskId),
            ]);

            const linkError = manualResult.error || categoryLinksResult.error || itemLinksResult.error;
            if (linkError) {
                console.error("Failed to fetch task activity links:", linkError);
                return [];
            }

            const linkedItemIds = new Set<number>(
                (itemLinksResult.data || []).map(link => Number(link.deadline_item_id))
            );
            const linkedCategoryIds = (categoryLinksResult.data || []).map(
                link => Number(link.deadline_category_id)
            );

            if (linkedCategoryIds.length > 0) {
                const { data: categoryItems, error: categoryItemsError } = await supabase
                    .from('deadline_items')
                    .select('id')
                    .in('category_id', linkedCategoryIds);

                if (categoryItemsError) {
                    console.error("Failed to resolve linked calendar categories:", categoryItemsError);
                    return [];
                }
                categoryItems?.forEach(item => linkedItemIds.add(Number(item.id)));
            }

            let automaticActivities: Activity[] = [];
            if (linkedItemIds.size > 0) {
                let automaticQuery = supabase
                    .from('calendar_activities')
                    .select('*')
                    .in('deadline_item_id', Array.from(linkedItemIds));
                if (task!.startDate) automaticQuery = automaticQuery.gte('date', task!.startDate);
                if (task!.deadline) automaticQuery = automaticQuery.lte('date', task!.deadline);
                const { data, error } = await automaticQuery;

                if (error) {
                    console.error("Failed to fetch automatically linked activities:", error);
                    return [];
                }
                automaticActivities = (data || []) as Activity[];
            }

            const mergedActivities = new Map<number, TaskLinkedActivity>();
            ((manualResult.data || []) as Activity[]).forEach(activity => {
                mergedActivities.set(activity.id, {
                    ...activity,
                    linkSource: { manual: true, automatic: false },
                });
            });
            automaticActivities.forEach(activity => {
                const existing = mergedActivities.get(activity.id);
                mergedActivities.set(activity.id, {
                    ...activity,
                    linkSource: {
                        manual: existing?.linkSource.manual || false,
                        automatic: true,
                    },
                });
            });

            return Array.from(mergedActivities.values()).sort((a, b) =>
                (a.date || '').localeCompare(b.date || '') || a.id - b.id
            );
        }
    );

    const totalHours = linkedActivities.reduce((sum, act) => sum + (act.duration || 0), 0);

    useEffect(() => {
        if (task) {
            setTitle(task.title);
            setTaskType(task.task_type || 'plan');
            setStartDate(task.startDate);
            setDeadline(task.deadline || '');
        }
    }, [task]);

    if (!task) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-slate-300">
                <Target size={48} className="opacity-20 mb-4" />
                <p className="text-sm font-mono tracking-widest uppercase">No Task Selected</p>
                <p className="text-xs text-slate-400 mt-2">Select a task from the board to view details</p>
            </div>
        );
    }

    const config = CATEGORY_CONFIG[task.category];
    const isDirty = title !== task.title || taskType !== task.task_type || startDate !== task.startDate || deadline !== (task.deadline || '');

    const handleSave = () => {
        if (!isAdmin) return;
        if (!title.trim()) return;
        setIsSaving(true);
        onUpdateTask(task.id, {
            title: title.trim(),
            task_type: taskType,
            startDate: startDate,
            deadline: deadline || undefined
        });
        setIsSaving(false);
    };

    const handleAddMilestone = () => {
        if (!isAdmin || !msTitle.trim()) return;
        const finalEndDate = msEndDate || msDate; // 默认EndDate = StartDate
        onAddMilestone(task.id, msTitle.trim(), msDate, finalEndDate);
        setMsTitle('');
        setMsEndDate('');
    };

    const Divider = () => <hr className="border-slate-200/60 my-6" />;
    
    // 复用的统一标题样式
    const SectionLabel = ({ children, className }: { children: React.ReactNode, className?: string }) => (
        <label className={cn("text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 block", className)}>
            {children}
        </label>
    );

    return (
        <motion.div 
            key="task-detail"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="flex flex-col h-full bg-white relative"
        >
            {/* Header */}
            <div className={`shrink-0 px-6 py-4 flex items-center justify-between border-b border-slate-200/60 z-10 h-15 ${config.bgLight}`}>
                <div className="flex items-center gap-3">
                    <div className={cn("p-1.5 rounded-lg text-white", config.indicator)}>
                        <config.icon size={18} />
                    </div>
                    <div className="flex bg-white/50 p-1 rounded-lg border border-white/60 shadow-sm ml-2">
                        <button onClick={() => setViewMode('overview')} className={cn("px-3 py-1 rounded-md text-xs font-bold tracking-widest uppercase transition-all", viewMode === 'overview' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700 hover:bg-white/50')}>概览</button>
                        <button onClick={() => setViewMode('progress')} className={cn("px-3 py-1 rounded-md text-xs font-bold tracking-widest uppercase transition-all", viewMode === 'progress' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700 hover:bg-white/50')}>进程</button>
                    </div>
                </div>
                <button 
                    onClick={onClose}
                    className="p-1.5 text-slate-400 hover:bg-slate-200/60 hover:text-slate-700 rounded-lg transition-colors"
                >
                    <X size={18} />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto subtle-scrollbar p-6 pb-24 h-full">
                <AnimatePresence mode="wait">
                    {viewMode === 'overview' ? (
                        <motion.div
                            key="overview"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            transition={{ duration: 0.2 }}
                            className="space-y-6"
                        >
                            {/* 1. Basic Info Edit (Title & Date) */}
                            <section className="space-y-5">
                    <div className="flex flex-col gap-2.5">
                        <SectionLabel className="mb-0!">Title</SectionLabel>
                        <div className="flex items-center gap-4">
                            <input 
                                value={title} 
                                onChange={e => setTitle(e.target.value)} 
                                placeholder="Task title..."
                                className="text-xl font-black text-slate-800 bg-transparent border-b-2 border-transparent outline-none focus:border-blue-400 transition-colors flex-1 pb-1 min-w-0"
                            />
                            <div className="shrink-0 flex flex-col items-end px-3 py-1.5 bg-slate-50 border border-slate-200/60 rounded-xl">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Time</span>
                                <div className="flex items-baseline gap-0.5">
                                    <span className="text-lg font-black text-slate-700 font-mono">{totalHours % 1 === 0 ? totalHours : totalHours.toFixed(1)}</span>
                                    <span className="text-xs font-bold text-slate-400">h</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="flex-1">
                            <SectionLabel>Start Date</SectionLabel>
                            <div className="flex items-center gap-2 px-3 py-2.5 bg-slate-50 border border-slate-200/60 rounded-lg">
                                <Calendar size={15} className="text-slate-400" />
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={e => setStartDate(e.target.value)}
                                    disabled={!isAdmin}
                                    className="bg-transparent text-sm font-mono text-slate-600 outline-none w-full disabled:opacity-70"
                                />
                            </div>
                        </div>
                        <div className="flex-1">
                            <SectionLabel className="text-rose-400">Deadline</SectionLabel>
                            <div className="flex items-center gap-2 px-3 py-2.5 bg-rose-50/50 border border-rose-200/60 rounded-lg">
                                <Flag size={15} className="text-rose-400" />
                                <input
                                    type="date"
                                    value={deadline}
                                    onChange={e => setDeadline(e.target.value)}
                                    disabled={!isAdmin}
                                    className="bg-transparent text-sm font-mono text-rose-600 outline-none w-full disabled:opacity-70"
                                />
                            </div>
                        </div>
                    </div>
                </section>

                {(task.deadline || (task.milestones?.length || 0) > 0) && (
                    <>
                        <Divider />
                        {/* 2. Timeline Horizon (Pure 14 blocks) */}
                        <section>
                            <SectionLabel className="flex items-center gap-2">
                                <Clock size={14} className="text-blue-500" /> Timeline Progress
                            </SectionLabel>
                            <div className="mt-4">
                                <HorizonView tasks={[task]} />
                            </div>
                        </section>
                    </>
                )}

                <Divider />

                {/* 3. Status (Merged Block) */}
                <section>
                    <SectionLabel>Status</SectionLabel>
                    <div className="bg-slate-50/50 border border-slate-200/60 rounded-2xl p-4 flex flex-col gap-5">
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Task Type Column */}
                            <div className="flex flex-col gap-2">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Task Type</span>
                                <div className="flex bg-slate-100/60 border border-slate-200/60 rounded-xl p-1 h-full">
                                    {TYPE_OPTIONS.map(opt => (
                                        <button
                                            key={opt.value}
                                            onClick={() => setTaskType(opt.value)}
                                            disabled={!isAdmin}
                                            className={cn(
                                                "flex-1 flex items-center justify-center py-2 rounded-lg text-xs font-bold transition-all",
                                                taskType === opt.value 
                                                    ? "bg-white text-slate-800 shadow-sm ring-1 ring-slate-200/50" 
                                                    : "text-slate-400 hover:text-slate-600 hover:bg-slate-200/50"
                                            )}
                                        >
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Status Column */}
                            <div className="flex flex-col gap-2">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Progress State</span>
                                <div className="flex bg-slate-100/60 border border-slate-200/60 rounded-xl p-1 h-full">
                                    <button
                                        onClick={() => onToggleStatus(task.id, task.status)}
                                        disabled={!isAdmin}
                                        className={cn(
                                            "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all",
                                            task.status === 'todo' ? "bg-white text-slate-800 shadow-sm ring-1 ring-slate-200/50" : "text-slate-400 hover:text-slate-600 hover:bg-slate-200/50"
                                        )}
                                    >
                                        <Circle size={14} />
                                        To Do
                                    </button>
                                    <button
                                        onClick={() => onToggleStatus(task.id, task.status)}
                                        disabled={!isAdmin}
                                        className={cn(
                                            "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all",
                                            task.status === 'in_progress' ? `bg-white ${config.color} shadow-sm ring-1 ring-${config.color.split('-')[1]}-200/50` : "text-slate-400 hover:text-slate-600 hover:bg-slate-200/50"
                                        )}
                                    >
                                        <Play size={14} className={task.status === 'in_progress' ? "fill-current" : ""} />
                                        In Progress
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Save Button */}
                        <AnimatePresence>
                            {isDirty && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="overflow-hidden pt-2"
                                >
                                    <button
                                        onClick={handleSave}
                                        disabled={isSaving}
                                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-500 text-white rounded-xl text-sm font-bold hover:bg-blue-600 transition-colors shadow-sm disabled:opacity-50"
                                    >
                                        <Save size={16} />
                                        {isSaving ? 'Saving...' : 'Save Changes'}
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>

                    </div>
                </section>

                <Divider />

                {/* 5. Milestones */}
                <section>
                    <div className="flex items-center justify-between mb-5">
                        <SectionLabel className="flex items-center gap-2 mb-0!">
                            <MilestoneIcon size={14} className="text-indigo-400" /> Milestones Roadmap
                        </SectionLabel>
                        <span className="text-xs font-mono font-bold text-indigo-500 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-100">
                            {task.milestones?.length || 0}
                        </span>
                    </div>

                    {/* Milestone Add Form */}
                    {isAdmin && (
                        <div className="flex flex-col gap-3 p-4 bg-slate-50 border border-slate-200/60 rounded-2xl mb-6">
                            <input
                                type="text"
                                value={msTitle}
                                onChange={e => setMsTitle(e.target.value)}
                                placeholder="Name a new milestone..."
                                className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold text-slate-700 outline-none focus:border-blue-400 transition-colors"
                            />
                            <div className="flex items-center gap-3">
                                <div className="flex flex-1 items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2 focus-within:border-blue-400 transition-colors">
                                    <input
                                        type="date"
                                        value={msDate}
                                        onChange={e => setMsDate(e.target.value)}
                                        className="w-full text-xs font-mono text-slate-600 outline-none bg-transparent"
                                    />
                                    <span className="text-slate-300">-</span>
                                    <input
                                        type="date"
                                        value={msEndDate}
                                        onChange={e => setMsEndDate(e.target.value)}
                                        placeholder="End Date"
                                        className="w-full text-xs font-mono text-slate-600 outline-none bg-transparent"
                                    />
                                </div>
                                <button
                                    onClick={handleAddMilestone}
                                    disabled={!msTitle.trim()}
                                    className="flex items-center justify-center gap-1.5 px-5 py-2.5 bg-slate-800 text-white rounded-xl text-xs font-bold hover:bg-slate-900 transition-all shadow-sm disabled:opacity-50 disabled:shadow-none shrink-0"
                                >
                                    <Plus size={16} /> Add
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Milestone List (Vertical Timeline) */}
                    <div className="relative pl-7 space-y-4">
                        {/* 垂直时间轴基线 */}
                        {task.milestones && task.milestones.length > 0 && (
                            <div className="absolute top-8 bottom-4 left-3.25 w-0.5 bg-slate-100 rounded-full" />
                        )}

                        {task.milestones?.map(ms => (
                            <MilestoneItem 
                                key={ms.id}
                                ms={ms}
                                isAdmin={isAdmin}
                                onUpdate={onUpdateMilestone}
                                onDelete={onDeleteMilestone}
                            />
                        ))}

                        {(!task.milestones || task.milestones.length === 0) && (
                            <div className="text-center py-6">
                                <p className="text-xs text-slate-400 font-mono tracking-widest uppercase">No Milestones Yet</p>
                            </div>
                        )}
                    </div>
                </section>
            </motion.div>
                    ) : (
                        <motion.div
                            key="progress"
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 10 }}
                            transition={{ duration: 0.2 }}
                            className="h-full"
                        >
                            <TaskProgressPanel 
                                task={task!} 
                                linkedActivities={linkedActivities} 
                                mutateLinkedActivities={mutateLinkedActivities}
                                isAdmin={isAdmin}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
}
