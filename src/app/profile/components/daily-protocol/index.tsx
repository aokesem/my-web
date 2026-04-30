"use client";

import React, { useState, useEffect, useMemo, useRef } from 'react';
import useSWR from 'swr';
import { motion, AnimatePresence } from 'framer-motion';
import { Layout, Calendar, MoreHorizontal, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

import { Task, Category, TaskType, TaskStatus, CATEGORY_CONFIG } from './types';
import BoardView from './BoardView';
import HorizonView from './HorizonView';

interface DailyProtocolProps {
    isActive: boolean;
    onToggle: () => void;
    isAdmin: boolean;
}

export default function DailyProtocol({ isActive, onToggle, isAdmin }: DailyProtocolProps) {

    // === 数据获取 ===
    const { data: swrTasks = [], mutate } = useSWR<Task[]>('profile_tasks', async () => {
        const { data, error } = await supabase
            .from('profile_tasks')
            .select('*, profile_task_milestones(*)')
            .neq('status', 'archived')
            .order('id', { ascending: true });

        if (data) {
            return data.map((t: any) => ({
                id: t.id,
                title: t.title,
                category: t.category,
                status: t.status,
                startDate: t.start_date,
                deadline: t.deadline,
                task_type: t.task_type || 'plan',
                milestones: t.profile_task_milestones || []
            })) as Task[];
        }
        return [];
    }, { fallbackData: [] });

    const tasks = swrTasks;
    const setTasks = (updater: Task[] | ((prev: Task[]) => Task[])) => {
        mutate(updater as any, false);
    };

    // === 状态管理 ===
    const [viewMode, setViewMode] = useState<'board' | 'horizon'>('board');

    // 添加任务
    const [addingCategory, setAddingCategory] = useState<Category | null>(null);
    const [newTaskTitle, setNewTaskTitle] = useState("");
    const [newTaskType, setNewTaskType] = useState<TaskType>('plan');
    const [newTaskStartDate, setNewTaskStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [newTaskDeadline, setNewTaskDeadline] = useState("");
    const inputRef = useRef<HTMLInputElement>(null);

    // 编辑任务
    const [editingTaskId, setEditingTaskId] = useState<number | null>(null);
    const [editForm, setEditForm] = useState<{ title: string; date: string; deadline: string; type: TaskType }>({ title: '', date: '', deadline: '', type: 'plan' });

    // 里程碑
    const [msInput, setMsInput] = useState({ title: '', date: new Date().toISOString().split('T')[0] });

    // 自动聚焦
    useEffect(() => {
        if (addingCategory && inputRef.current) inputRef.current.focus();
    }, [addingCategory]);

    // === 辅助变量 ===
    const inProgressCount = tasks.filter(t => t.status === 'in_progress').length;
    const featuredTask = useMemo(() => tasks.find(t => t.status === 'in_progress') || tasks[0], [tasks]);
    const indicatorColor = featuredTask && CATEGORY_CONFIG[featuredTask.category]
        ? CATEGORY_CONFIG[featuredTask.category].indicator
        : 'bg-slate-300';

    // === 状态切换 ===
    const toggleStatus = async (id: number, currentStatus: TaskStatus) => {
        if (!isAdmin) return toast.warning("只有本人才能修改状态");
        if (editingTaskId === id) return;
        const newStatus = currentStatus === 'todo' ? 'in_progress' : 'todo';
        setTasks(prev => prev.map(t => t.id === id ? { ...t, status: newStatus } : t));
        const { error } = await supabase.from('profile_tasks').update({ status: newStatus }).eq('id', id);
        if (error) console.error("Update failed:", error);
    };

    const archiveTask = async (id: number, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!isAdmin) return toast.warning("只有本人才能修改状态");
        setTasks(prev => prev.filter(t => t.id !== id));
        const { error } = await supabase.from('profile_tasks').update({ status: 'archived' }).eq('id', id);
        if (error) console.error("Archive failed:", error);
    };

    // === 添加任务 ===
    const startAdding = (category: Category) => {
        if (!isAdmin) return toast.warning("只有本人才能操作");
        setAddingCategory(category);
        setNewTaskTitle("");
        setNewTaskType('plan');
        setNewTaskStartDate(new Date().toISOString().split('T')[0]);
        setNewTaskDeadline("");
    };

    const cancelAdding = () => { setAddingCategory(null); setNewTaskTitle(""); };

    const confirmAddTask = async () => {
        if (!newTaskTitle.trim() || !addingCategory) return;
        const title = newTaskTitle.trim();
        const category = addingCategory;
        const type = newTaskType;
        const start = newTaskStartDate;
        const ddl = newTaskDeadline;
        const tempId = Date.now();

        const optimisticTask: Task = { id: tempId, title, category, status: 'todo', startDate: start, deadline: ddl || undefined, task_type: type };
        setTasks(prev => [...prev, optimisticTask]);
        setNewTaskTitle(""); setNewTaskType('plan'); setAddingCategory(null);

        const { data, error } = await supabase.from('profile_tasks')
            .insert({ title, category, status: 'todo', start_date: start, deadline: ddl || null, task_type: type })
            .select().single();

        if (data) {
            setTasks(prev => prev.map(t => t.id === tempId ? { ...t, id: data.id } : t));
        } else {
            setTasks(prev => prev.filter(t => t.id !== tempId));
            toast.error("添加失败");
        }
    };

    // === 编辑任务 ===
    const startEditing = (task: Task, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!isAdmin) return toast.warning("只有本人才能操作");
        setEditingTaskId(task.id);
        setEditForm({ title: task.title, date: task.startDate, deadline: task.deadline || '', type: task.task_type });
    };

    const cancelEditing = () => setEditingTaskId(null);

    const saveEdit = async (id: number) => {
        if (!editForm.title.trim()) return;
        setTasks(prev => prev.map(t => t.id === id ? { ...t, title: editForm.title, startDate: editForm.date, deadline: editForm.deadline, task_type: editForm.type } : t));
        setEditingTaskId(null);
        const { error } = await supabase.from('profile_tasks')
            .update({ title: editForm.title, start_date: editForm.date, deadline: editForm.deadline || null, task_type: editForm.type })
            .eq('id', id);
        if (error) { console.error("Update failed:", error); toast.error("更新失败"); }
    };

    // === 里程碑 ===
    const addMilestone = async (taskId: number) => {
        if (!isAdmin) return toast.warning("只有本人才能操作");
        if (!msInput.title.trim()) return;
        const { error } = await supabase.from('profile_task_milestones')
            .insert({ task_id: taskId, title: msInput.title.trim(), date: msInput.date })
            .select().single();
        if (!error) {
            mutate();
            setMsInput({ title: '', date: new Date().toISOString().split('T')[0] });
            toast.success("里程碑已添加");
        } else {
            console.error("Add milestone failed:", error);
            toast.error(`添加失败: ${error.message}`);
        }
    };

    const deleteMilestone = async (msId: number) => {
        if (!confirm("确定删除该里程碑吗？")) return;
        const { error } = await supabase.from('profile_task_milestones').delete().eq('id', msId);
        if (!error) { mutate(); toast.success("里程碑已删除"); }
    };

    // === 键盘事件 ===
    const handleKeyDownAdd = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') confirmAddTask();
        if (e.key === 'Escape') cancelAdding();
    };
    const handleKeyDownEdit = (e: React.KeyboardEvent, id: number) => {
        if (e.key === 'Enter') saveEdit(id);
        if (e.key === 'Escape') cancelEditing();
    };

    // === 渲染 ===
    return (
        <motion.div
            layout
            transition={{ type: "spring", stiffness: 280, damping: 32, mass: 0.9 }}
            onClick={!isActive ? onToggle : undefined}
            className={`
                fixed flex flex-col backdrop-blur-xl bg-white/80 border border-white/60 
                rounded-2xl shadow-lg ring-1 ring-slate-900/5 overflow-hidden group 
                hover:bg-white/95 transition-[shadow,background-color] duration-300
                ${isActive
                    ? 'z-50 inset-10 md:inset-20'
                    : 'z-30 top-[340px] right-[2.5%] w-[360px] h-[180px] cursor-pointer hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.2)]'
                }
            `}
        >
            {/* 背景网格 */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-size-[20px_20px] opacity-30 pointer-events-none" />

            {/* 顶部栏 */}
            <motion.div layout="position" className="flex items-center justify-between px-5 py-4 border-b border-slate-100/80 shrink-0 h-[60px]">
                <div className="flex items-center gap-3">
                    <Layout size={20} className="text-slate-400" />
                    <span className="font-mono font-bold text-slate-500 tracking-[0.2em] uppercase text-sm">计划列表//TaskBoard</span>
                </div>
                {isActive && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="hidden md:flex items-center gap-4 text-base font-mono text-slate-400">
                        {/* 视图切换 */}
                        <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200 mr-2">
                            <button onClick={() => setViewMode('board')} className={cn("px-3 py-1 rounded-md text-[11px] font-bold tracking-widest transition-all", viewMode === 'board' ? "bg-white text-blue-600 shadow-sm" : "text-slate-400 hover:text-slate-600")}>BOARD</button>
                            <button onClick={() => setViewMode('horizon')} className={cn("px-3 py-1 rounded-md text-[11px] font-bold tracking-widest transition-all", viewMode === 'horizon' ? "bg-white text-blue-600 shadow-sm" : "text-slate-400 hover:text-slate-600")}>HORIZON</button>
                        </div>
                        <span className="flex items-center gap-2"><Calendar size={14} /> {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase()}</span>
                        <span className="w-px h-3 bg-slate-300" />
                        <span className={inProgressCount > 0 ? "text-blue-500 font-bold" : ""}>{inProgressCount} IN PROGRESS</span>
                    </motion.div>
                )}
                <div className="flex items-center gap-2">
                    {!isActive && tasks.length > 0 && (
                        <motion.div layoutId="task-count-badge" className="text-xs font-mono font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{tasks.length} LEFT</motion.div>
                    )}
                    <button onClick={(e) => { e.stopPropagation(); onToggle(); }} className="p-1.5 rounded-md hover:bg-slate-100 text-slate-400 transition-colors">
                        {isActive ? <div className="w-4 h-1 bg-slate-400 rounded-full" /> : <MoreHorizontal size={16} />}
                    </button>
                </div>
            </motion.div>

            {/* 内容区域 */}
            <div className="flex-1 relative bg-slate-50/30 overflow-hidden">
                <AnimatePresence mode="wait">
                    {!isActive ? (
                        /* 收起态 */
                        <motion.div key="idle-view" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.2 } }} className="absolute inset-0 p-5 flex flex-col justify-center">
                            {tasks.length > 0 && featuredTask ? (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between text-xs text-slate-400 font-mono tracking-wider mb-1">
                                        <span>CURRENT FOCUS</span>
                                        <span>{featuredTask.status === 'in_progress' ? 'RUNNING' : 'QUEUED'}</span>
                                    </div>
                                    <div className="p-3 bg-white border border-slate-100 rounded-lg flex items-center gap-3 shadow-sm group-hover:border-blue-200 transition-colors">
                                        <div className={`w-2.5 h-2.5 rounded-full ${indicatorColor} animate-pulse shadow-[0_0_8px_currentColor] opacity-80`} />
                                        <div className="flex flex-col min-w-0">
                                            <span className="text-sm text-slate-700 truncate font-bold leading-tight">{featuredTask.title}</span>
                                            <span className="text-[10px] text-slate-400 uppercase tracking-widest mt-0.5">{CATEGORY_CONFIG[featuredTask.category]?.label || 'General'}</span>
                                        </div>
                                    </div>
                                    <div className="flex gap-1 h-1 w-full">
                                        {tasks.filter(t => t.status === 'in_progress').slice(0, 10).map((task) => (
                                            <div key={task.id} className={`flex-1 rounded-full ${CATEGORY_CONFIG[task.category]?.indicator || 'bg-slate-200'}`} />
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-2">
                                    <CheckCircle2 size={24} className="text-emerald-400" />
                                    <span className="text-xs font-mono uppercase tracking-widest">{tasks.length === 0 ? "Loading / No Tasks" : "All Tasks Done"}</span>
                                </div>
                            )}
                        </motion.div>
                    ) : (
                        /* 展开态 */
                        <motion.div key="active-view" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0, transition: { duration: 0.25 } }} exit={{ opacity: 0, transition: { duration: 0.05 } }} className="h-full">
                            <AnimatePresence mode="wait">
                                {viewMode === 'board' ? (
                                    <BoardView
                                        tasks={tasks}
                                        isAdmin={isAdmin}
                                        addingCategory={addingCategory}
                                        newTaskTitle={newTaskTitle}
                                        newTaskType={newTaskType}
                                        newTaskStartDate={newTaskStartDate}
                                        newTaskDeadline={newTaskDeadline}
                                        inputRef={inputRef}
                                        onStartAdding={startAdding}
                                        onCancelAdding={cancelAdding}
                                        onConfirmAddTask={confirmAddTask}
                                        onNewTaskTitleChange={setNewTaskTitle}
                                        onNewTaskTypeChange={setNewTaskType}
                                        onNewTaskStartDateChange={setNewTaskStartDate}
                                        onNewTaskDeadlineChange={setNewTaskDeadline}
                                        onKeyDownAdd={handleKeyDownAdd}
                                        editingTaskId={editingTaskId}
                                        editForm={editForm}
                                        onStartEditing={startEditing}
                                        onCancelEditing={cancelEditing}
                                        onSaveEdit={saveEdit}
                                        onEditFormChange={setEditForm}
                                        onKeyDownEdit={handleKeyDownEdit}
                                        msInput={msInput}
                                        onMsInputChange={setMsInput}
                                        onAddMilestone={addMilestone}
                                        onDeleteMilestone={deleteMilestone}
                                        onToggleStatus={toggleStatus}
                                        onArchiveTask={archiveTask}
                                    />
                                ) : (
                                    <HorizonView tasks={tasks} />
                                )}
                            </AnimatePresence>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
}
