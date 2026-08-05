"use client";

import React, { useState, useEffect, useMemo, useRef } from 'react';
import useSWR from 'swr';
import { motion, AnimatePresence } from 'framer-motion';
import { Layout, Calendar, MoreHorizontal, CheckCircle2, Play } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

import { Task, Category, TaskType, TaskStatus, CATEGORY_CONFIG } from './types';
import BoardView from './BoardView';
import TaskDetailPanel from './TaskDetailPanel';

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
    const [activeCategory, setActiveCategory] = useState<Category>('knowledge');
    const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);

    // 添加任务
    const [addingCategory, setAddingCategory] = useState<Category | null>(null);
    const [newTaskTitle, setNewTaskTitle] = useState("");
    const [newTaskType, setNewTaskType] = useState<TaskType>('plan');
    const [newTaskStartDate, setNewTaskStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [newTaskDeadline, setNewTaskDeadline] = useState("");
    const inputRef = useRef<HTMLInputElement>(null);

    // 行内重命名编辑任务
    const [editingTaskId, setEditingTaskId] = useState<number | null>(null);
    const [editForm, setEditForm] = useState<{ title: string; date: string; deadline: string; type: TaskType }>({ title: '', date: '', deadline: '', type: 'plan' });

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

    // === 更新任务 ===
    const updateTask = async (id: number, updates: Partial<Task>) => {
        if (!isAdmin) return toast.warning("只有本人才能操作");

        setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));

        const dbUpdates: any = {};
        if (updates.title !== undefined) dbUpdates.title = updates.title;
        if (updates.startDate !== undefined) dbUpdates.start_date = updates.startDate;
        if (updates.deadline !== undefined) dbUpdates.deadline = updates.deadline || null;
        if (updates.task_type !== undefined) dbUpdates.task_type = updates.task_type;
        if (updates.status !== undefined) dbUpdates.status = updates.status;

        const { error } = await supabase.from('profile_tasks').update(dbUpdates).eq('id', id);
        if (error) {
            console.error("Update task failed:", error);
            mutate();
            toast.error("更新失败");
        }
    };

    // 状态切换 (独立函数，与 updateTask 类似，兼容现有 BoardView 接口)
    const toggleStatus = async (id: number, currentStatus: TaskStatus) => {
        if (!isAdmin) return toast.warning("只有本人才能修改状态");
        if (editingTaskId === id) return;
        const newStatus = currentStatus === 'todo' ? 'in_progress' : 'todo';
        await updateTask(id, { status: newStatus });
    };

    const archiveTask = async (id: number, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!isAdmin) return toast.warning("只有本人才能修改状态");
        if (!confirm('确定要永久删除该任务吗？任务及其里程碑将从数据库中删除，无法恢复。')) return;

        setTasks(prev => prev.filter(t => t.id !== id));
        if (editingTaskId === id) setEditingTaskId(null);
        if (selectedTaskId === id) setSelectedTaskId(null);

        const { error: msError } = await supabase.from('profile_task_milestones').delete().eq('task_id', id);
        if (msError) {
            console.error('Delete milestones failed:', msError);
            await mutate();
            toast.error(msError.message || '删除里程碑失败，请重试');
            return;
        }

        const { error } = await supabase.from('profile_tasks').delete().eq('id', id);
        if (error) {
            console.error('Delete task failed:', error);
            await mutate();
            toast.error(error.message || '删除任务失败，请重试');
            return;
        }

        toast.success('已删除');
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

    // === 内联编辑(重命名)任务 ===
    const startEditing = (task: Task, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!isAdmin) return toast.warning("只有本人才能操作");
        setEditingTaskId(task.id);
        setEditForm({ title: task.title, date: task.startDate, deadline: task.deadline || '', type: task.task_type });
    };

    const cancelEditing = () => setEditingTaskId(null);

    const saveEdit = async (id: number) => {
        if (!editForm.title.trim()) return;
        await updateTask(id, {
            title: editForm.title,
            startDate: editForm.date,
            deadline: editForm.deadline || undefined,
            task_type: editForm.type
        });
        setEditingTaskId(null);
    };

    // === 里程碑 ===
    const addMilestone = async (taskId: number, title: string, date: string, endDate: string) => {
        if (!isAdmin) return toast.warning("只有本人才能操作");
        const { error } = await supabase.from('profile_task_milestones')
            .insert({ task_id: taskId, title: title, date: date, end_date: endDate })
            .select().single();
        if (!error) {
            mutate();
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

    const updateMilestone = async (msId: number, title: string, date: string, endDate: string) => {
        if (!isAdmin) return toast.warning("只有本人才能操作");
        const { error } = await supabase.from('profile_task_milestones')
            .update({ title, date, end_date: endDate })
            .eq('id', msId);
        if (!error) {
            mutate();
            toast.success("里程碑已更新");
        } else {
            console.error("Update milestone failed:", error);
            toast.error(`更新失败: ${error.message}`);
        }
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
    const selectedTask = tasks.find(t => t.id === selectedTaskId);

    return (
        <>
            <AnimatePresence>
                {isActive && (
                    <motion.div
                        key="active-modal"
                        initial={{ opacity: 0, scale: 0.95, y: 30 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 30 }}
                        transition={{ type: "spring", stiffness: 100, damping: 20 }}
                        className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
                    >
                        <div className="flex items-center justify-center w-full h-full p-6 md:p-12 pointer-events-auto" onClick={onToggle}>
                        <div 
                            className="w-full max-w-7xl h-full flex flex-row backdrop-blur-xl bg-white/95 border border-white/60 rounded-2xl shadow-2xl overflow-hidden relative"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* 绝对定位背景网格 */}
                            <div 
                                className="absolute inset-0 opacity-25 pointer-events-none" 
                                style={{
                                    backgroundImage: 'linear-gradient(to right, #e2e8f0 1px, transparent 1px), linear-gradient(to bottom, #e2e8f0 1px, transparent 1px)',
                                    backgroundSize: '20px 20px'
                                }}
                            />

                            {/* 左侧区域（展开态宽度固定） */}
                            <div className="flex flex-col h-full relative w-95 border-r border-slate-200/60 shrink-0 bg-white/60">
                                {/* 顶部栏 */}
                                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100/80 shrink-0 h-15">
                                    <div className="flex items-center gap-3">
                                        <Layout size={20} className="text-slate-400" />
                                        <span className="font-mono font-bold text-slate-500 tracking-[0.2em] uppercase text-sm">计划列表//TaskBoard</span>
                                    </div>
                                    <div className="flex items-center gap-2 relative z-50">
                                        <button onClick={onToggle} className="p-1.5 rounded-md hover:bg-slate-200 text-slate-400 transition-colors">
                                            <div className="w-4 h-1 bg-slate-400 rounded-full" />
                                        </button>
                                    </div>
                                </div>

                                {/* 内容区域 */}
                                <div className="flex-1 overflow-hidden relative">
                                    <BoardView
                                        tasks={tasks}
                                        isAdmin={isAdmin}
                                        activeCategory={activeCategory}
                                        onSelectCategory={setActiveCategory}
                                        selectedTaskId={selectedTaskId}
                                        onSelectTask={setSelectedTaskId}
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
                                        onUpdateTask={updateTask}
                                        onToggleStatus={toggleStatus}
                                        onArchiveTask={archiveTask}
                                        onAddMilestone={addMilestone}
                                        onDeleteMilestone={deleteMilestone}
                                        onUpdateMilestone={updateMilestone}
                                    />
                                </div>

                                {/* 暗纹化日期 */}
                                <div className="absolute bottom-4 left-5 text-sm font-mono font-black tracking-widest pointer-events-none text-slate-800 leading-tight opacity-15">
                                    {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase()}<br />
                                    {inProgressCount} IN PROGRESS
                                </div>
                            </div>

                            {/* 右侧面板区域 */}
                            <div className="flex-1 h-full relative overflow-hidden bg-white/40">
                                <AnimatePresence mode="wait">
                                    {selectedTaskId ? (
                                        <TaskDetailPanel
                                            key={selectedTaskId}
                                            task={selectedTask || null}
                                            isAdmin={isAdmin}
                                            onUpdateTask={updateTask}
                                            onToggleStatus={toggleStatus}
                                            onAddMilestone={addMilestone}
                                            onDeleteMilestone={deleteMilestone}
                                            onUpdateMilestone={updateMilestone}
                                            onClose={() => setSelectedTaskId(null)}
                                        />
                                    ) : (
                                        <motion.div
                                            key="empty-state"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            className="flex flex-col items-center justify-center h-full text-slate-300 bg-slate-50/30"
                                        >
                                            <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
                                                <Play size={24} className="text-slate-300 opacity-50" />
                                            </div>
                                            <p className="text-sm font-mono tracking-widest uppercase">Select a Task</p>
                                            <p className="text-xs text-slate-400 mt-2">Click on a task card to view details</p>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {!isActive && (
                    <motion.div
                        key="inactive-widget"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ type: "spring", stiffness: 280, damping: 32, mass: 0.9 }}
                        onClick={onToggle}
                        className="fixed z-30 top-85 right-[2.5%] w-90 h-45 cursor-pointer flex flex-col backdrop-blur-xl bg-white/80 border border-white/60 rounded-2xl shadow-lg ring-1 ring-slate-900/5 overflow-hidden group hover:bg-white/95 hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.2)] transition-[shadow,background-color] duration-300"
                    >
                        {/* 绝对定位背景网格 */}
                        <div 
                            className="absolute inset-0 opacity-25 pointer-events-none" 
                            style={{
                                backgroundImage: 'linear-gradient(to right, #e2e8f0 1px, transparent 1px), linear-gradient(to bottom, #e2e8f0 1px, transparent 1px)',
                                backgroundSize: '20px 20px'
                            }}
                        />

                        {/* 顶部栏 */}
                        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100/80 shrink-0 h-15 z-10 relative">
                            <div className="flex items-center gap-3">
                                <Layout size={20} className="text-slate-400" />
                                <span className="font-mono font-bold text-slate-500 tracking-[0.2em] uppercase text-sm">计划列表</span>
                            </div>
                            <div className="flex items-center gap-2 relative z-50">
                                {tasks.length > 0 && (
                                    <div className="text-xs font-mono font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{tasks.length} LEFT</div>
                                )}
                                <button onClick={(e) => { e.stopPropagation(); onToggle(); }} className="p-1.5 rounded-md hover:bg-slate-100 text-slate-400 transition-colors">
                                    <MoreHorizontal size={16} />
                                </button>
                            </div>
                        </div>

                        {/* 内容区域 */}
                        <div className="flex-1 relative overflow-hidden p-5 flex flex-col justify-center z-10">
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
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
