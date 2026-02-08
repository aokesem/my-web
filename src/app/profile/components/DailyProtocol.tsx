"use client";

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Play,
    Circle,
    Plus,
    MoreHorizontal,
    Layout,
    Zap,
    BookOpen,
    Users,
    Palette,
    Calendar,
    CheckCircle2,
    Archive,
    X,
    Check,
    Pencil, // 新增编辑图标
    Save    // 新增保存图标
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import { cn } from '@/lib/utils'; // 假设您有 utils，如果没有可以去掉 cn 使用模板字符串

// === 类型定义 ===
type Category = 'knowledge' | 'sports' | 'arts' | 'social';
type TaskStatus = 'todo' | 'in_progress' | 'archived';
type TaskType = 'plan' | 'project' | 'course';

interface Task {
    id: number;
    title: string;
    category: Category;
    status: TaskStatus;
    startDate: string;
    task_type: TaskType; // 强制类型
}

// === 配置表 ===
const CATEGORY_CONFIG: Record<Category, { label: string; color: string; bg: string; indicator: string; icon: any }> = {
    knowledge: { label: 'Knowledge', color: 'text-blue-600', bg: 'bg-blue-100', indicator: 'bg-blue-500', icon: BookOpen },
    sports: { label: 'Sports', color: 'text-rose-600', bg: 'bg-rose-100', indicator: 'bg-rose-500', icon: Zap },
    arts: { label: 'Arts', color: 'text-emerald-600', bg: 'bg-emerald-100', indicator: 'bg-emerald-500', icon: Palette },
    social: { label: 'Social', color: 'text-purple-600', bg: 'bg-purple-100', indicator: 'bg-purple-500', icon: Users },
};

// 类型选项配置
const TYPE_OPTIONS: { value: TaskType; label: string; opacity: string }[] = [
    { value: 'plan', label: '计划', opacity: 'opacity-50' },
    { value: 'project', label: '项目', opacity: 'opacity-80' },
    { value: 'course', label: '课程', opacity: 'opacity-100 font-bold' },
];

// [新增] 专门用于任务类型的颜色深浅映射
const TYPE_STYLE_MAP: Record<Category, Record<TaskType, string>> = {
    knowledge: {
        plan: 'text-blue-800 border-blue-800',
        project: 'text-blue-800 border-blue-800',
        course: 'text-blue-800 border-blue-800'
    },
    sports: {
        plan: 'text-rose-800 border-rose-800',
        project: 'text-rose-800 border-rose-800',
        course: 'text-rose-800 border-rose-800'
    },
    arts: {
        plan: 'text-emerald-800 border-emerald-800',
        project: 'text-emerald-800 border-emerald-800',
        course: 'text-emerald-800 border-emerald-800'
    },
    social: {
        plan: 'text-purple-800 border-purple-800',
        project: 'text-purple-800 border-purple-800',
        course: 'text-purple-800 border-purple-800'
    }
};

interface DailyProtocolProps {
    isActive: boolean;
    onToggle: () => void;
    isAdmin: boolean;
}

export default function DailyProtocol({ isActive, onToggle, isAdmin }: DailyProtocolProps) {
    const [tasks, setTasks] = useState<Task[]>([]);

    // === 状态管理 ===
    // 1. 添加模式状态
    const [addingCategory, setAddingCategory] = useState<Category | null>(null);
    const [newTaskTitle, setNewTaskTitle] = useState("");
    const [newTaskType, setNewTaskType] = useState<TaskType>('plan'); // [新增] 新任务的类型
    const inputRef = useRef<HTMLInputElement>(null);

    // 2. 编辑模式状态 [新增]
    const [editingTaskId, setEditingTaskId] = useState<number | null>(null);
    const [editForm, setEditForm] = useState<{ title: string; date: string; type: TaskType }>({ title: '', date: '', type: 'plan' });

    // 获取数据
    useEffect(() => {
        const fetchTasks = async () => {
            const { data, error } = await supabase
                .from('profile_tasks')
                .select('*')
                .neq('status', 'archived')
                .order('id', { ascending: true });

            if (data) {
                const mappedTasks: Task[] = data.map((t: any) => ({
                    id: t.id,
                    title: t.title,
                    category: t.category,
                    status: t.status,
                    startDate: t.start_date,
                    task_type: t.task_type || 'plan' // 默认为 plan
                }));
                setTasks(mappedTasks);
            }
        };
        fetchTasks();
    }, []);

    // 自动聚焦输入框
    useEffect(() => {
        if (addingCategory && inputRef.current) {
            inputRef.current.focus();
        }
    }, [addingCategory]);

    // 切换状态 (待办 <-> 进行中)
    const toggleStatus = async (id: number, currentStatus: TaskStatus) => {
        if (!isAdmin) return toast.warning("只有本人才能修改状态");
        // 如果正在编辑该任务，阻止状态切换
        if (editingTaskId === id) return;

        const newStatus = currentStatus === 'todo' ? 'in_progress' : 'todo';
        setTasks(prev => prev.map(t => t.id === id ? { ...t, status: newStatus } : t));
        const { error } = await supabase.from('profile_tasks').update({ status: newStatus }).eq('id', id);
        if (error) console.error("Update failed:", error);
    };

    // 归档任务
    const archiveTask = async (id: number, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!isAdmin) return toast.warning("只有本人才能修改状态");
        setTasks(prev => prev.filter(t => t.id !== id));
        const { error } = await supabase.from('profile_tasks').update({ status: 'archived' }).eq('id', id);
        if (error) console.error("Archive failed:", error);
    };

    // === 添加逻辑 ===
    const startAdding = (category: Category) => {
        if (!isAdmin) return toast.warning("只有本人才能操作");
        setAddingCategory(category);
        setNewTaskTitle("");
        setNewTaskType('plan'); // 重置默认类型
    };

    const cancelAdding = () => {
        setAddingCategory(null);
        setNewTaskTitle("");
    };

    const confirmAddTask = async () => {
        if (!newTaskTitle.trim() || !addingCategory) return;

        const title = newTaskTitle.trim();
        const category = addingCategory;
        const type = newTaskType;
        const tempId = Date.now();
        const todayStr = new Date().toISOString().split('T')[0];

        // 乐观更新
        const optimisticTask: Task = {
            id: tempId,
            title: title,
            category: category,
            status: 'todo',
            startDate: todayStr,
            task_type: type
        };
        setTasks(prev => [...prev, optimisticTask]);

        // 重置
        setNewTaskTitle("");
        setNewTaskType('plan');

        // 提交数据库
        const { data, error } = await supabase
            .from('profile_tasks')
            .insert({
                title: title,
                category: category,
                status: 'todo',
                start_date: todayStr,
                task_type: type
            })
            .select()
            .single();

        if (data) {
            setTasks(prev => prev.map(t => t.id === tempId ? {
                ...t,
                id: data.id // 更新为真实ID
            } : t));
        } else {
            console.error("Add failed:", error);
            setTasks(prev => prev.filter(t => t.id !== tempId));
            toast.error("添加失败");
        }
    };

    // === 编辑逻辑 ===
    const startEditing = (task: Task, e: React.MouseEvent) => {
        e.stopPropagation(); // 防止触发卡片点击
        if (!isAdmin) return toast.warning("只有本人才能操作");
        setEditingTaskId(task.id);
        setEditForm({
            title: task.title,
            date: task.startDate,
            type: task.task_type
        });
    };

    const cancelEditing = () => {
        setEditingTaskId(null);
    };

    const saveEdit = async (id: number) => {
        if (!editForm.title.trim()) return;

        // 乐观更新
        setTasks(prev => prev.map(t => t.id === id ? {
            ...t,
            title: editForm.title,
            startDate: editForm.date,
            task_type: editForm.type
        } : t));

        setEditingTaskId(null); // 立即退出编辑模式

        // 提交数据库
        const { error } = await supabase
            .from('profile_tasks')
            .update({
                title: editForm.title,
                start_date: editForm.date,
                task_type: editForm.type
            })
            .eq('id', id);

        if (error) {
            console.error("Update failed:", error);
            toast.error("更新失败");
            // 这里可以考虑回滚，暂略
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

    // === 辅助变量 ===
    const inProgressCount = tasks.filter(t => t.status === 'in_progress').length;
    const featuredTask = useMemo(() => tasks.find(t => t.status === 'in_progress') || tasks[0], [tasks]);
    const indicatorColor = featuredTask && CATEGORY_CONFIG[featuredTask.category] ? CATEGORY_CONFIG[featuredTask.category].indicator : 'bg-slate-300';

    return (
        <motion.div
            layout
            transition={{ type: "spring", stiffness: 120, damping: 25, mass: 1 }}
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
            {/* ... (背景网格和顶部栏代码保持不变) ... */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-size-[20px_20px] opacity-30 pointer-events-none" />

            <motion.div layout="position" className="flex items-center justify-between px-5 py-4 border-b border-slate-100/80 shrink-0 h-[60px]">
                <div className="flex items-center gap-3">
                    <Layout size={20} className="text-slate-400" />
                    <span className="font-mono font-bold text-slate-500 tracking-[0.2em] uppercase text-sm">
                        计划列表//TaskBoard
                    </span>
                </div>
                {isActive && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="hidden md:flex items-center gap-4 text-base font-mono text-slate-400">
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

            {/* === 内容区域 === */}
            <div className="flex-1 relative bg-slate-50/30 overflow-hidden">
                <AnimatePresence mode="wait">
                    {!isActive ? (
                        /* 收起态 (保持不变) */
                        <motion.div
                            key="idle-view"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0, transition: { duration: 0.2 } }}
                            className="absolute inset-0 p-5 flex flex-col justify-center"
                        >
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
                        <motion.div
                            key="active-view"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0, transition: { delay: 0.3, duration: 0.4 } }}
                            exit={{ opacity: 0, transition: { duration: 0 } }}
                            className="h-full overflow-x-auto p-6"
                        >
                            <div className="flex h-full gap-6 min-w-[800px]">
                                {(['knowledge', 'sports', 'arts', 'social'] as Category[]).map(cat => {
                                    const config = CATEGORY_CONFIG[cat];
                                    const catTasks = tasks.filter(t => t.category === cat);
                                    catTasks.sort((a, b) => (a.status === 'in_progress' ? -1 : 1));
                                    const isAddingThisCat = addingCategory === cat;

                                    return (
                                        <div key={cat} className={`flex-1 flex flex-col min-w-[200px] h-full rounded-xl border border-white/60 shadow-sm backdrop-blur-sm overflow-hidden group/col transition-colors ${config.indicator.replace('bg-', 'bg-')}/10`}>
                                            {/* 列标题 */}
                                            <div className={`px-4 py-3 border-b border-slate-100 flex items-center gap-2 text-white ${config.indicator}`}>
                                                <config.icon size={16} />
                                                <span className="font-bold tracking-wider uppercase text-base">{config.label}</span>
                                                <span className="ml-auto text-[10px] font-mono bg-white/20 px-1.5 py-0.5 rounded-full text-white">{catTasks.length}</span>
                                            </div>

                                            {/* 任务列表区 */}
                                            <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
                                                <AnimatePresence mode='popLayout'>
                                                    {catTasks.map(task => {
                                                        const isEditing = editingTaskId === task.id;

                                                        return (
                                                            <motion.div
                                                                layout
                                                                initial={{ opacity: 0, scale: 0.9 }}
                                                                animate={{ opacity: 1, scale: 1 }}
                                                                exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                                                                key={task.id}
                                                                onClick={() => !isEditing && toggleStatus(task.id, task.status)}
                                                                className={`
                                                                    p-3 rounded-lg border transition-all duration-300 group/card relative overflow-hidden
                                                                    ${isEditing ? 'bg-blue-50/80 border-blue-300 ring-2 ring-blue-100 cursor-default' : 'cursor-pointer'}
                                                                    ${!isEditing && task.status === 'in_progress' ? 'bg-white border-l-[3px] shadow-md' : ''}
                                                                    ${!isEditing && task.status !== 'in_progress' ? 'bg-white/40 border-slate-200 text-slate-600 hover:bg-white hover:border-slate-300' : ''}
                                                                `}
                                                                style={{ borderLeftColor: (!isEditing && task.status === 'in_progress') ? config.color.replace('text-', '') : undefined }}
                                                            >
                                                                {isEditing ? (
                                                                    // === 编辑模式 UI ===
                                                                    <div className="flex flex-col gap-2 relative z-20">
                                                                        <input
                                                                            type="text"
                                                                            value={editForm.title}
                                                                            onChange={e => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                                                                            className="w-full text-sm font-bold text-slate-700 bg-white border border-slate-200 rounded px-2 py-1 outline-none focus:border-blue-400"
                                                                            autoFocus
                                                                            onKeyDown={(e) => handleKeyDownEdit(e, task.id)}
                                                                        />
                                                                        <div className="flex items-center gap-2">
                                                                            <input
                                                                                type="date"
                                                                                value={editForm.date}
                                                                                onChange={e => setEditForm(prev => ({ ...prev, date: e.target.value }))}
                                                                                className="text-[10px] font-mono bg-white border border-slate-200 rounded px-1 py-0.5 text-slate-500 outline-none focus:border-blue-400"
                                                                            />
                                                                            <div className="flex bg-white rounded border border-slate-200 p-0.5">
                                                                                {TYPE_OPTIONS.map(opt => (
                                                                                    <button
                                                                                        key={opt.value}
                                                                                        onClick={() => setEditForm(prev => ({ ...prev, type: opt.value }))}
                                                                                        className={`px-1.5 py-0.5 text-[10px] rounded transition-colors ${editForm.type === opt.value ? 'bg-blue-500 text-white' : 'text-slate-400 hover:text-slate-600'}`}
                                                                                    >
                                                                                        {opt.label}
                                                                                    </button>
                                                                                ))}
                                                                            </div>
                                                                        </div>
                                                                        <div className="flex justify-end gap-2 mt-1">
                                                                            <button onClick={cancelEditing} className="p-1 text-slate-400 hover:bg-slate-200 rounded">
                                                                                <X size={14} />
                                                                            </button>
                                                                            <button onClick={() => saveEdit(task.id)} className="p-1 text-blue-500 hover:bg-blue-100 rounded">
                                                                                <Save size={14} />
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                ) : (
                                                                    // === 普通展示模式 UI ===
                                                                    <div className="flex items-start justify-between gap-2 relative z-10">
                                                                        <div className="flex items-start gap-2.5 min-w-0 pr-0">
                                                                            <div className={`mt-0.5 transition-colors ${task.status === 'in_progress' ? config.color : 'text-slate-300'}`}>
                                                                                {task.status === 'in_progress' ? <Play size={14} fill="currentColor" /> : <Circle size={14} />}
                                                                            </div>
                                                                            <div className="flex flex-col min-w-0">
                                                                                <span className={`text-base font-medium leading-tight truncate ${task.status === 'in_progress' ? 'text-slate-800' : ''}`}>{task.title}</span>
                                                                                <span className="text-[14px] text-slate-400 font-mono mt-0.5">{task.startDate}</span>
                                                                            </div>
                                                                        </div>

                                                                        {/* 右侧：操作按钮 (标签已改为绝对定位) */}
                                                                        <div className="flex flex-col items-end gap-1 shrink-0">
                                                                            <div className="flex items-center gap-1">
                                                                                <div className="flex opacity-0 group-hover/card:opacity-100 transition-all duration-300 gap-1.5">
                                                                                    <button
                                                                                        onClick={(e) => startEditing(task, e)}
                                                                                        className="text-slate-400 hover:text-blue-500 hover:bg-white bg-white/40 backdrop-blur-[2px] rounded-md p-1.5 shadow-sm border border-slate-100/50 transition-all"
                                                                                        title="Edit"
                                                                                    >
                                                                                        <Pencil size={14} />
                                                                                    </button>
                                                                                    <button
                                                                                        onClick={(e) => archiveTask(task.id, e)}
                                                                                        className="text-slate-400 hover:text-rose-500 hover:bg-white bg-white/40 backdrop-blur-[2px] rounded-md p-1.5 shadow-sm border border-slate-100/50 transition-all"
                                                                                        title="Archive"
                                                                                    >
                                                                                        <Archive size={14} />
                                                                                    </button>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                                {!isEditing && task.task_type && (
                                                                    <span className={`
                                                                        absolute top-3 right-3 text-[14px] font-mono tracking-widest uppercase px-1.5 py-0.5 rounded border transition-all duration-200 bg-transparent font-black z-20 pointer-events-none
                                                                        ${TYPE_STYLE_MAP[task.category][task.task_type]}
                                                                        ${task.status === 'in_progress' ? 'opacity-100 brightness-110' : 'opacity-40'}
                                                                        group-hover/card:opacity-0
                                                                    `}>
                                                                        {task.task_type === 'course' && '课程'}
                                                                        {task.task_type === 'project' && '项目'}
                                                                        {task.task_type === 'plan' && '计划'}
                                                                    </span>
                                                                )}
                                                                {!isEditing && task.status === 'in_progress' && <div className={`absolute inset-0 ${config.bg} opacity-40 pointer-events-none`} />}
                                                            </motion.div>
                                                        );
                                                    })}
                                                </AnimatePresence>

                                                {/* 底部添加栏 */}
                                                <div className="pt-2">
                                                    {isAddingThisCat ? (
                                                        <motion.div
                                                            initial={{ opacity: 0, y: 10 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            className="p-3 bg-white rounded-lg border border-blue-200 shadow-sm"
                                                        >
                                                            <input
                                                                ref={inputRef}
                                                                type="text"
                                                                placeholder="Type task title..."
                                                                className="w-full text-sm outline-none bg-transparent placeholder-slate-300 mb-3"
                                                                value={newTaskTitle}
                                                                onChange={(e) => setNewTaskTitle(e.target.value)}
                                                                onKeyDown={handleKeyDownAdd}
                                                            />
                                                            <div className="flex items-center justify-between">
                                                                {/* 新增：类型选择器 */}
                                                                <div className="flex gap-1">
                                                                    {TYPE_OPTIONS.map(opt => (
                                                                        <button
                                                                            key={opt.value}
                                                                            onClick={() => setNewTaskType(opt.value)}
                                                                            className={`
                                                                                text-[10px] px-2 py-1 rounded-md transition-all border
                                                                                ${newTaskType === opt.value
                                                                                    ? `bg-slate-800 text-white border-slate-800 font-medium`
                                                                                    : `bg-slate-50 text-slate-400 border-slate-100 hover:bg-slate-100`
                                                                                }
                                                                            `}
                                                                        >
                                                                            {opt.label}
                                                                        </button>
                                                                    ))}
                                                                </div>

                                                                <div className="flex gap-1">
                                                                    <button onClick={cancelAdding} className="p-1.5 text-slate-400 hover:bg-slate-100 rounded">
                                                                        <X size={14} />
                                                                    </button>
                                                                    <button onClick={confirmAddTask} className="p-1.5 text-white bg-blue-500 hover:bg-blue-600 rounded shadow-sm shadow-blue-200">
                                                                        <Check size={14} />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </motion.div>
                                                    ) : (
                                                        <button
                                                            onClick={() => startAdding(cat)}
                                                            className="w-full py-2 flex items-center justify-center gap-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50/50 rounded-lg border border-dashed border-slate-200 hover:border-blue-200 transition-all text-xs font-mono uppercase tracking-widest opacity-0 group-hover/col:opacity-100"
                                                        >
                                                            <Plus size={14} /> Add Task
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
}