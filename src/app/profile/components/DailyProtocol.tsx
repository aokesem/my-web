"use client";

import React, { useState, useMemo } from 'react';
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
    Archive
} from 'lucide-react';

// === 类型定义 ===
type Category = 'knowledge' | 'sports' | 'arts' | 'social';
type TaskStatus = 'todo' | 'in_progress'; // 新的状态逻辑

interface Task {
    id: string;
    title: string;
    category: Category;
    status: TaskStatus;
}

// === 初始数据 ===
const INITIAL_TASKS: Task[] = [
    { id: '1', title: '阅读 Paper 30min', category: 'knowledge', status: 'in_progress' },
    { id: '2', title: '整理笔记', category: 'knowledge', status: 'todo' },
    { id: '3', title: '晨跑 5km', category: 'sports', status: 'todo' },
    { id: '4', title: '核心力量训练', category: 'sports', status: 'todo' },
    { id: '5', title: '吉他爬格子', category: 'arts', status: 'in_progress' },
    { id: '6', title: '观看经典电影', category: 'arts', status: 'todo' },
    { id: '7', title: '约朋友周末吃饭', category: 'social', status: 'todo' },
];

// === 配置表 (新增 indicator 字段用于呼吸灯颜色) ===
const CATEGORY_CONFIG: Record<Category, { label: string; color: string; bg: string; indicator: string; icon: any }> = {
    knowledge: {
        label: 'Knowledge',
        color: 'text-blue-600',
        bg: 'bg-blue-50',
        indicator: 'bg-blue-500',
        icon: BookOpen
    },
    sports: {
        label: 'Sports',
        color: 'text-rose-600',
        bg: 'bg-rose-50',
        indicator: 'bg-rose-500',
        icon: Zap
    },
    arts: {
        label: 'Arts',
        color: 'text-emerald-600',
        bg: 'bg-emerald-50',
        indicator: 'bg-emerald-500',
        icon: Palette
    },
    social: {
        label: 'Social',
        color: 'text-purple-600',
        bg: 'bg-purple-50',
        indicator: 'bg-purple-500',
        icon: Users
    },
};

interface DailyProtocolProps {
    isActive: boolean;
    onToggle: () => void;
}

export default function DailyProtocol({ isActive, onToggle }: DailyProtocolProps) {
    const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);

    // 1. 切换状态：未开始 <-> 进行中
    const toggleStatus = (id: string) => {
        setTasks(prev => prev.map(t =>
            t.id === id
                ? { ...t, status: t.status === 'todo' ? 'in_progress' : 'todo' }
                : t
        ));
    };

    // 2. 归档任务 (直接删除)
    const archiveTask = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setTasks(prev => prev.filter(t => t.id !== id));
    };

    // 计算统计数据
    const inProgressCount = tasks.filter(t => t.status === 'in_progress').length;
    const todoCount = tasks.filter(t => t.status === 'todo').length;

    // === 核心逻辑：获取要在 Mini Widget 展示的“焦点任务” ===
    // 优先展示“进行中”的任务，如果没有，则展示第一个“待办”
    const featuredTask = useMemo(() => {
        return tasks.find(t => t.status === 'in_progress') || tasks[0];
    }, [tasks]);

    // 根据焦点任务动态获取呼吸灯颜色
    const indicatorColor = featuredTask
        ? CATEGORY_CONFIG[featuredTask.category].indicator
        : 'bg-slate-300'; // 如果没任务了，显示灰色

    return (
        <motion.div
            layout
            transition={{
                type: "spring",
                stiffness: 100,
                damping: 20,
                mass: 1.2
            }}
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
            {/* === 顶部栏 === */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100/80 shrink-0">
                <div className="flex items-center gap-3">
                    <Layout size={20} className="text-slate-400" />
                    <span className="font-mono font-bold text-slate-500 tracking-[0.2em] uppercase text-sm">
                        每日计划 // PROTOCOL
                    </span>
                </div>

                {/* 展开时的额外信息 */}
                {isActive && (
                    <div className="hidden md:flex items-center gap-4 text-xs font-mono text-slate-400">
                        <span className="flex items-center gap-2">
                            <Calendar size={14} /> JAN 26, 2026
                        </span>
                        <span className="w-px h-3 bg-slate-300" />
                        <span className={inProgressCount > 0 ? "text-blue-500 font-bold" : ""}>
                            {inProgressCount} IN PROGRESS
                        </span>
                    </div>
                )}

                {/* 按钮区域 */}
                <div className="flex items-center gap-2">
                    {!isActive && tasks.length > 0 && (
                        <div className="text-xs font-mono font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                            {tasks.length} LEFT
                        </div>
                    )}
                    <button
                        onClick={(e) => { e.stopPropagation(); onToggle(); }}
                        className="p-1.5 rounded-md hover:bg-slate-100 text-slate-400 transition-colors"
                    >
                        {isActive ? <div className="w-4 h-1 bg-slate-400 rounded-full" /> : <MoreHorizontal size={16} />}
                    </button>
                </div>
            </div>

            {/* === 内容区域 === */}
            <div className="flex-1 overflow-hidden relative bg-slate-50/30">

                {/* 1. 收起态：动态展示焦点任务 */}
                {!isActive && (
                    <div className="p-5 h-full flex flex-col justify-center">
                        {tasks.length > 0 ? (
                            <div className="space-y-4">
                                {/* 状态指示条：动态颜色 */}
                                <div className="flex items-center justify-between text-xs text-slate-400 font-mono tracking-wider mb-1">
                                    <span>CURRENT FOCUS</span>
                                    <span>{featuredTask.status === 'in_progress' ? 'RUNNING' : 'QUEUED'}</span>
                                </div>

                                <div className="p-3 bg-white border border-slate-100 rounded-lg flex items-center gap-3 shadow-sm group-hover:border-blue-200 transition-colors">
                                    {/* 动态呼吸灯：颜色跟随分类 */}
                                    <div className={`w-2.5 h-2.5 rounded-full ${indicatorColor} animate-pulse shadow-[0_0_8px_currentColor] opacity-80`} />

                                    <div className="flex flex-col min-w-0">
                                        <span className="text-sm text-slate-700 truncate font-bold leading-tight">
                                            {featuredTask.title}
                                        </span>
                                        <span className="text-[10px] text-slate-400 uppercase tracking-widest mt-0.5">
                                            {CATEGORY_CONFIG[featuredTask.category].label}
                                        </span>
                                    </div>
                                </div>

                                {/* 底部极简进度 */}
                                <div className="flex gap-1 h-1 w-full">
                                    {/* 进度条不再是百分比，而是根据剩余任务数量展示的小点 */}
                                    {[...Array(Math.min(tasks.length, 10))].map((_, i) => (
                                        <div key={i} className={`flex-1 rounded-full ${i === 0 ? indicatorColor : 'bg-slate-200'}`} />
                                    ))}
                                </div>
                            </div>
                        ) : (
                            // 空状态
                            <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-2">
                                <CheckCircle2 size={24} className="text-emerald-400" />
                                <span className="text-xs font-mono uppercase tracking-widest">All Tasks Done</span>
                            </div>
                        )}
                    </div>
                )}

                {/* 2. 展开态：Trello 看板四列布局 */}
                {isActive && (
                    <div className="h-full overflow-x-auto p-6">
                        <div className="flex h-full gap-6 min-w-[800px]">
                            {(['knowledge', 'sports', 'arts', 'social'] as Category[]).map(cat => {
                                const config = CATEGORY_CONFIG[cat];
                                const catTasks = tasks.filter(t => t.category === cat);
                                // 排序：进行中的排在前面
                                catTasks.sort((a, b) => (a.status === 'in_progress' ? -1 : 1));

                                return (
                                    <div key={cat} className="flex-1 flex flex-col min-w-[200px] h-full bg-white/50 rounded-xl border border-white/60 shadow-sm backdrop-blur-sm overflow-hidden group/col hover:bg-white/80 transition-colors">
                                        {/* 列头 */}
                                        <div className={`px-4 py-3 border-b border-slate-100 flex items-center gap-2 ${config.color} bg-white/40`}>
                                            <config.icon size={16} />
                                            <span className="font-bold tracking-wider uppercase text-xs">{config.label}</span>
                                            <span className="ml-auto text-[10px] font-mono opacity-60 bg-slate-100 px-1.5 py-0.5 rounded-full text-slate-500">
                                                {catTasks.length}
                                            </span>
                                        </div>

                                        {/* 任务列表 */}
                                        <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
                                            <AnimatePresence mode='popLayout'>
                                                {catTasks.map(task => (
                                                    <motion.div
                                                        layout
                                                        initial={{ opacity: 0, scale: 0.9 }}
                                                        animate={{ opacity: 1, scale: 1 }}
                                                        exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                                                        key={task.id}
                                                        // 点击卡片：切换 "未开始" <-> "进行中"
                                                        onClick={() => toggleStatus(task.id)}
                                                        className={`
                                                            p-3 rounded-lg border cursor-pointer transition-all duration-300 group/card relative overflow-hidden
                                                            ${task.status === 'in_progress'
                                                                ? 'bg-white border-l-[3px] shadow-md' // 进行中：强调样式
                                                                : 'bg-white/40 border-slate-200 text-slate-600 hover:bg-white hover:border-slate-300' // 未开始：默认样式
                                                            }
                                                        `}
                                                        style={{
                                                            borderLeftColor: task.status === 'in_progress' ? config.color.replace('text-', '') : undefined // 动态边框色
                                                        }}
                                                    >
                                                        <div className="flex items-start justify-between gap-2 relative z-10">
                                                            {/* 左侧：状态图标 + 标题 */}
                                                            <div className="flex items-start gap-2.5">
                                                                <div className={`mt-0.5 transition-colors ${task.status === 'in_progress' ? config.color : 'text-slate-300'}`}>
                                                                    {task.status === 'in_progress' ? <Play size={14} fill="currentColor" /> : <Circle size={14} />}
                                                                </div>
                                                                <span className={`text-sm font-medium leading-tight ${task.status === 'in_progress' ? 'text-slate-800' : ''}`}>
                                                                    {task.title}
                                                                </span>
                                                            </div>

                                                            {/* 右侧：归档按钮 (悬停显示) */}
                                                            <button
                                                                onClick={(e) => archiveTask(task.id, e)}
                                                                className="text-slate-300 hover:text-emerald-500 hover:bg-emerald-50 rounded p-1 -mr-1 transition-all opacity-0 group-hover/card:opacity-100"
                                                                title="Archive (Done)"
                                                            >
                                                                <Archive size={14} />
                                                            </button>
                                                        </div>

                                                        {/* 进行中背景光晕 */}
                                                        {task.status === 'in_progress' && (
                                                            <div className={`absolute inset-0 ${config.bg} opacity-30 pointer-events-none`} />
                                                        )}
                                                    </motion.div>
                                                ))}
                                            </AnimatePresence>

                                            {/* 添加按钮 (占位) */}
                                            <button className="w-full py-2 flex items-center justify-center gap-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50/50 rounded-lg border border-dashed border-slate-200 hover:border-blue-200 transition-all text-xs font-mono uppercase tracking-widest opacity-0 group-hover/col:opacity-100">
                                                <Plus size={14} /> Add Task
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </motion.div>
    );
}