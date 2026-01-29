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
    Check
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

// === 类型定义 ===
type Category = 'knowledge' | 'sports' | 'arts' | 'social';
type TaskStatus = 'todo' | 'in_progress' | 'archived';

interface Task {
    id: number;
    title: string;
    category: Category;
    status: TaskStatus;
    startDate: string;
}

// === 配置表 ===
const CATEGORY_CONFIG: Record<Category, { label: string; color: string; bg: string; indicator: string; icon: any }> = {
    knowledge: { label: 'Knowledge', color: 'text-blue-600', bg: 'bg-blue-100', indicator: 'bg-blue-500', icon: BookOpen },
    sports: { label: 'Sports', color: 'text-rose-600', bg: 'bg-rose-100', indicator: 'bg-rose-500', icon: Zap },
    arts: { label: 'Arts', color: 'text-emerald-600', bg: 'bg-emerald-100', indicator: 'bg-emerald-500', icon: Palette },
    social: { label: 'Social', color: 'text-purple-600', bg: 'bg-purple-100', indicator: 'bg-purple-500', icon: Users },
};

interface DailyProtocolProps {
    isActive: boolean;
    onToggle: () => void;
}

export default function DailyProtocol({ isActive, onToggle }: DailyProtocolProps) {
    const [tasks, setTasks] = useState<Task[]>([]);

    // [新增] 添加任务相关的状态
    const [addingCategory, setAddingCategory] = useState<Category | null>(null); // 当前正在哪一列添加
    const [newTaskTitle, setNewTaskTitle] = useState(""); // 输入框的内容
    const inputRef = useRef<HTMLInputElement>(null);

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
                    startDate: t.start_date
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

    // 切换状态
    const toggleStatus = async (id: number, currentStatus: TaskStatus) => {
        const newStatus = currentStatus === 'todo' ? 'in_progress' : 'todo';
        setTasks(prev => prev.map(t => t.id === id ? { ...t, status: newStatus } : t));
        const { error } = await supabase.from('profile_tasks').update({ status: newStatus }).eq('id', id);
        if (error) console.error("Update failed:", error);
    };

    // 归档任务
    const archiveTask = async (id: number, e: React.MouseEvent) => {
        e.stopPropagation();
        setTasks(prev => prev.filter(t => t.id !== id));
        const { error } = await supabase.from('profile_tasks').update({ status: 'archived' }).eq('id', id);
        if (error) console.error("Archive failed:", error);
    };

    // [新增] 启动添加模式
    const startAdding = (category: Category) => {
        setAddingCategory(category);
        setNewTaskTitle("");
    };

    // [新增] 取消添加
    const cancelAdding = () => {
        setAddingCategory(null);
        setNewTaskTitle("");
    };

    // [新增] 确认添加任务 (核心逻辑)
    const confirmAddTask = async () => {
        if (!newTaskTitle.trim() || !addingCategory) return;

        const title = newTaskTitle.trim();
        const category = addingCategory;
        const tempId = Date.now(); // 临时ID，防止Key冲突
        const todayStr = new Date().toISOString().split('T')[0];

        // 1. 乐观更新：先在界面上显示出来
        const optimisticTask: Task = {
            id: tempId,
            title: title,
            category: category,
            status: 'todo',
            startDate: todayStr
        };
        setTasks(prev => [...prev, optimisticTask]);

        // 重置输入状态，允许连续添加
        setNewTaskTitle("");
        // setAddingCategory(null); // 如果你想添加完自动关闭，把这行注释解开；否则保留输入框方便连续输入

        // 2. 发送请求到 Supabase
        const { data, error } = await supabase
            .from('profile_tasks')
            .insert({
                title: title,
                category: category,
                status: 'todo',
                start_date: todayStr
            })
            .select()
            .single();

        if (data) {
            // 3. 请求成功：用真实的数据库数据替换掉临时数据 (更新ID)
            setTasks(prev => prev.map(t => t.id === tempId ? {
                id: data.id,
                title: data.title,
                category: data.category,
                status: data.status,
                startDate: data.start_date
            } : t));
        } else {
            // 4. 请求失败 (比如权限不足)：回滚 UI
            console.error("Add task failed:", error);
            setTasks(prev => prev.filter(t => t.id !== tempId));
            // 可选：提示用户
            // alert("Failed to add task. Are you logged in?");
        }
    };

    // 处理键盘事件 (回车提交，ESC取消)
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            confirmAddTask();
        } else if (e.key === 'Escape') {
            cancelAdding();
        }
    };

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
            {/* === 背景网格 === */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-size-[20px_20px] opacity-30 pointer-events-none" />

            {/* === 顶部栏 === */}
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
                        /* 收起态代码保持不变 */
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
                                        {tasks.slice(0, 10).map((task) => (
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
                            exit={{ opacity: 0, transition: { duration: 0.1 } }}
                            className="h-full overflow-x-auto p-6"
                        >
                            <div className="flex h-full gap-6 min-w-[800px]">
                                {(['knowledge', 'sports', 'arts', 'social'] as Category[]).map(cat => {
                                    const config = CATEGORY_CONFIG[cat];
                                    const catTasks = tasks.filter(t => t.category === cat);
                                    catTasks.sort((a, b) => (a.status === 'in_progress' ? -1 : 1));
                                    const isAddingThisCat = addingCategory === cat;

                                    return (
                                        <div key={cat} className="flex-1 flex flex-col min-w-[200px] h-full bg-white/50 rounded-xl border border-white/60 shadow-sm backdrop-blur-sm overflow-hidden group/col hover:bg-white/80 transition-colors">
                                            <div className={`px-4 py-3 border-b border-slate-100 flex items-center gap-2 text-white ${config.indicator}`}>
                                                <config.icon size={16} />
                                                <span className="font-bold tracking-wider uppercase text-base">{config.label}</span>
                                                <span className="ml-auto text-[10px] font-mono bg-white/20 px-1.5 py-0.5 rounded-full text-white">{catTasks.length}</span>
                                            </div>

                                            <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
                                                <AnimatePresence mode='popLayout'>
                                                    {catTasks.map(task => (
                                                        <motion.div
                                                            layout
                                                            initial={{ opacity: 0, scale: 0.9 }}
                                                            animate={{ opacity: 1, scale: 1 }}
                                                            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                                                            key={task.id}
                                                            onClick={() => toggleStatus(task.id, task.status)}
                                                            className={`
                                                                p-3 rounded-lg border cursor-pointer transition-all duration-300 group/card relative overflow-hidden
                                                                ${task.status === 'in_progress' ? 'bg-white border-l-[3px] shadow-md' : 'bg-white/40 border-slate-200 text-slate-600 hover:bg-white hover:border-slate-300'}
                                                            `}
                                                            style={{ borderLeftColor: task.status === 'in_progress' ? config.color.replace('text-', '') : undefined }}
                                                        >
                                                            <div className="flex items-start justify-between gap-2 relative z-10">
                                                                <div className="flex items-start gap-2.5">
                                                                    <div className={`mt-0.5 transition-colors ${task.status === 'in_progress' ? config.color : 'text-slate-300'}`}>
                                                                        {task.status === 'in_progress' ? <Play size={14} fill="currentColor" /> : <Circle size={14} />}
                                                                    </div>
                                                                    <div className="flex flex-col">
                                                                        <span className={`text-base font-medium leading-tight ${task.status === 'in_progress' ? 'text-slate-800' : ''}`}>{task.title}</span>
                                                                        <span className="text-[14px] text-slate-400 font-mono mt-0.5">{task.startDate}</span>
                                                                    </div>
                                                                </div>
                                                                <button onClick={(e) => archiveTask(task.id, e)} className="text-slate-300 hover:text-emerald-500 hover:bg-emerald-50 rounded p-1 -mr-1 transition-all opacity-0 group-hover/card:opacity-100" title="Archive (Done)">
                                                                    <Archive size={14} />
                                                                </button>
                                                            </div>
                                                            {task.status === 'in_progress' && <div className={`absolute inset-0 ${config.bg} opacity-40 pointer-events-none`} />}
                                                        </motion.div>
                                                    ))}
                                                </AnimatePresence>

                                                {/* [核心修改] 底部添加栏逻辑 */}
                                                <div className="pt-2">
                                                    {isAddingThisCat ? (
                                                        <motion.div
                                                            initial={{ opacity: 0, y: 10 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            className="p-2 bg-white rounded-lg border border-blue-200 shadow-sm"
                                                        >
                                                            <input
                                                                ref={inputRef}
                                                                type="text"
                                                                placeholder="Type task title..."
                                                                className="w-full text-sm outline-none bg-transparent placeholder-slate-300 mb-2"
                                                                value={newTaskTitle}
                                                                onChange={(e) => setNewTaskTitle(e.target.value)}
                                                                onKeyDown={handleKeyDown}
                                                            />
                                                            <div className="flex justify-end gap-2">
                                                                <button onClick={cancelAdding} className="p-1 text-slate-400 hover:bg-slate-100 rounded">
                                                                    <X size={14} />
                                                                </button>
                                                                <button onClick={confirmAddTask} className="p-1 text-blue-500 hover:bg-blue-50 rounded font-bold">
                                                                    <Check size={14} />
                                                                </button>
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