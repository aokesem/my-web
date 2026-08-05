"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Circle, Plus, X, Check, Pencil, Archive, Save, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
    Task, Category, TaskType,
    CATEGORY_CONFIG, TYPE_OPTIONS, TYPE_STYLE_MAP
} from './types';
import TaskDetailPanel from './TaskDetailPanel';

interface BoardViewProps {
    tasks: Task[];
    isAdmin: boolean;
    // 分类和选中状态
    activeCategory: Category;
    onSelectCategory: (cat: Category) => void;
    selectedTaskId: number | null;
    onSelectTask: (id: number | null) => void;
    // 添加任务相关
    addingCategory: Category | null;
    newTaskTitle: string;
    newTaskType: TaskType;
    newTaskStartDate: string;
    newTaskDeadline: string;
    inputRef: React.RefObject<HTMLInputElement | null>;
    onStartAdding: (cat: Category) => void;
    onCancelAdding: () => void;
    onConfirmAddTask: () => void;
    onNewTaskTitleChange: (v: string) => void;
    onNewTaskTypeChange: (v: TaskType) => void;
    onNewTaskStartDateChange: (v: string) => void;
    onNewTaskDeadlineChange: (v: string) => void;
    onKeyDownAdd: (e: React.KeyboardEvent) => void;
    // 悬停编辑(重命名)相关
    editingTaskId: number | null;
    editForm: { title: string; date: string; deadline: string; type: TaskType };
    onStartEditing: (task: Task, e: React.MouseEvent) => void;
    onCancelEditing: () => void;
    onSaveEdit: (id: number) => void;
    onEditFormChange: (form: { title: string; date: string; deadline: string; type: TaskType }) => void;
    onKeyDownEdit: (e: React.KeyboardEvent, id: number) => void;
    // 状态与详情操作
    onToggleStatus: (id: number, status: Task['status']) => void;
    onArchiveTask: (id: number, e: React.MouseEvent) => void;
    onUpdateTask: (id: number, updates: Partial<Task>) => void;
    onAddMilestone: (taskId: number, title: string, startDate: string, endDate: string) => void;
    onDeleteMilestone: (msId: number) => void;
    onUpdateMilestone: (msId: number, title: string, startDate: string, endDate: string) => void;
}

const CATEGORIES: Category[] = ['knowledge', 'sports', 'arts', 'social'];

export default function BoardView({
    tasks, isAdmin,
    activeCategory, onSelectCategory,
    selectedTaskId, onSelectTask,
    addingCategory, newTaskTitle, newTaskType, newTaskStartDate, newTaskDeadline,
    inputRef, onStartAdding, onCancelAdding, onConfirmAddTask,
    onNewTaskTitleChange, onNewTaskTypeChange, onNewTaskStartDateChange, onNewTaskDeadlineChange,
    onKeyDownAdd,
    editingTaskId, editForm, onStartEditing, onCancelEditing, onSaveEdit, onEditFormChange,
    onKeyDownEdit,
    onToggleStatus, onArchiveTask, onUpdateTask, onAddMilestone, onDeleteMilestone, onUpdateMilestone
}: BoardViewProps) {

    const config = CATEGORY_CONFIG[activeCategory];
    const catTasks = [...tasks.filter(t => t.category === activeCategory)].sort((a, b) =>
        a.status === 'in_progress' ? -1 : 1
    );
    const isAddingThisCat = addingCategory === activeCategory;
    const selectedTask = tasks.find(t => t.id === selectedTaskId) || null;

    return (
        <motion.div
            key="board-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`flex flex-col h-full w-full`}
        >
            {/* 顶部 Tab 分类切换 */}
            <div className="flex items-center p-3 gap-1 border-b border-slate-200/60 bg-white/60 backdrop-blur-sm shrink-0">
                {CATEGORIES.map(cat => {
                    const conf = CATEGORY_CONFIG[cat];
                    const isCatActive = activeCategory === cat;
                    return (
                        <button
                            key={cat}
                            onClick={() => onSelectCategory(cat)}
                            className={`flex-1 py-1.5 rounded-md text-[10px] font-bold tracking-widest uppercase transition-all flex items-center justify-center gap-1
                                ${isCatActive ? conf.indicator + ' text-white shadow-sm' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'}
                            `}
                        >
                            {isCatActive && <conf.icon size={12} />}
                            {conf.label}
                        </button>
                    );
                })}
            </div>

            {/* 列表内容 */}
            <div className={`flex-1 relative overflow-hidden transition-colors duration-300 ${config.bgLight} bg-opacity-40`}>
                <div className="h-full overflow-y-auto overflow-x-hidden p-3 space-y-2 scrollbar-hide relative z-10">
                    <AnimatePresence mode="popLayout">
                        {catTasks.map((task: Task) => {
                            const isEditing = editingTaskId === task.id;
                            const isSelected = selectedTaskId === task.id;
                            return (
                                <motion.div
                                    key={task.id}
                                    layout
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                                    onClick={() => !isEditing && onSelectTask(task.id)}
                                    className={`group/card relative rounded-xl border p-3 transition-all duration-200 cursor-pointer overflow-hidden ${
                                        isSelected 
                                            ? `bg-white shadow-md border-${config.color.split('-')[1]}-300 ring-2 ring-${config.color.split('-')[1]}-100` 
                                            : `bg-white/80 border-slate-200/60 hover:bg-white hover:shadow-sm hover:border-slate-300`
                                    }`}
                                >
                                    {isEditing ? (
                                        <div className="flex flex-col gap-2 relative z-10">
                                            <input 
                                                autoFocus
                                                type="text" 
                                                value={editForm.title} 
                                                onChange={e => onEditFormChange({...editForm, title: e.target.value})}
                                                onKeyDown={(e) => onKeyDownEdit(e, task.id)}
                                                className="w-full text-sm font-bold outline-none bg-slate-50 border border-slate-200 rounded px-2 py-1 focus:border-blue-400"
                                            />
                                            <div className="flex items-center gap-2">
                                                <input type="date" value={editForm.date} onChange={e => onEditFormChange({...editForm, date: e.target.value})} className="flex-1 text-xs font-mono bg-slate-50 border border-slate-200 rounded px-1 py-1 text-slate-500 outline-none focus:border-blue-400" />
                                                <input type="date" value={editForm.deadline} onChange={e => onEditFormChange({...editForm, deadline: e.target.value})} className="flex-1 text-xs font-mono bg-slate-50 border border-slate-200 rounded px-1 py-1 text-slate-500 outline-none focus:border-blue-400" placeholder="DDL" />
                                            </div>
                                            <div className="flex justify-between items-center mt-1">
                                                <div className="flex gap-1">
                                                    {TYPE_OPTIONS.map(opt => (
                                                        <button key={opt.value} onClick={() => onEditFormChange({...editForm, type: opt.value})} className={`text-[10px] px-1.5 py-1 rounded transition-colors ${editForm.type === opt.value ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-400'}`}>{opt.label}</button>
                                                    ))}
                                                </div>
                                                <div className="flex gap-1">
                                                    <button onClick={onCancelEditing} className="p-1 text-slate-400 hover:bg-slate-100 rounded"><X size={14} /></button>
                                                    <button onClick={() => onSaveEdit(task.id)} className="p-1 text-white bg-blue-500 hover:bg-blue-600 rounded"><Check size={14} /></button>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex justify-between items-start gap-3 relative z-10">
                                            <div className="flex gap-3 min-w-0 flex-1">
                                                <button onClick={(e) => { e.stopPropagation(); onToggleStatus(task.id, task.status); }} className="mt-0.5 shrink-0 text-slate-300 hover:text-slate-500 transition-colors">
                                                    {task.status === 'in_progress' ? <CheckCircle2 size={16} className={config.color} /> : <Circle size={16} />}
                                                </button>
                                                <div className="flex flex-col min-w-0 pr-1">
                                                    <span className={`text-sm font-medium leading-tight truncate ${task.status === 'in_progress' ? 'text-slate-800 font-bold' : ''}`}>{task.title}</span>
                                                    <span className="text-[11px] text-slate-400 font-mono mt-1 opacity-80">{task.startDate}</span>
                                                </div>
                                            </div>
                                            <div className="flex opacity-0 group-hover/card:opacity-100 transition-all duration-200 gap-1 shrink-0 -mr-1">
                                                <button onClick={(e) => onStartEditing(task, e)} className="text-slate-400 hover:bg-slate-100 hover:text-slate-600 p-1.5 rounded-md transition-colors"><Pencil size={13} /></button>
                                                <button type="button" title="永久删除" onClick={(e) => onArchiveTask(task.id, e)} className="text-slate-400 hover:bg-rose-100 hover:text-rose-600 p-1.5 rounded-md transition-colors"><Archive size={13} /></button>
                                            </div>
                                        </div>
                                    )}

                                    {/* 任务类型标签 */}
                                    {!isEditing && task.task_type && (
                                        <span className={`absolute top-2.5 right-2 text-[10px] font-mono tracking-widest uppercase px-1.5 py-0.5 rounded border transition-all duration-200 font-black z-20 pointer-events-none ${TYPE_STYLE_MAP[task.category][task.task_type]} ${task.status === 'in_progress' ? 'opacity-100' : 'opacity-40'} group-hover/card:opacity-0`}>
                                            {task.task_type === 'course' && '课程'}
                                            {task.task_type === 'project' && '项目'}
                                            {task.task_type === 'plan' && '计划'}
                                        </span>
                                    )}
                                    {!isEditing && task.status === 'in_progress' && (
                                        <div className={`absolute inset-0 ${config.bg} opacity-20 pointer-events-none`} />
                                    )}
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>

                    {/* 底部添加栏 */}
                    <div className="pt-2 pb-16">
                        {isAddingThisCat ? (
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-3 bg-white rounded-lg border border-blue-200 shadow-sm space-y-3">
                                <input
                                    ref={inputRef}
                                    type="text"
                                    placeholder="Task title..."
                                    className="w-full text-sm font-bold outline-none bg-transparent"
                                    value={newTaskTitle}
                                    onChange={(e) => onNewTaskTitleChange(e.target.value)}
                                    onKeyDown={onKeyDownAdd}
                                />
                                <div className="flex flex-col gap-2">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[9px] w-10 text-slate-400 uppercase font-mono">Start</span>
                                        <input type="date" value={newTaskStartDate} onChange={e => onNewTaskStartDateChange(e.target.value)} className="flex-1 text-[10px] font-mono bg-slate-50 border border-slate-100 rounded px-1.5 py-1 text-slate-500 outline-none focus:border-blue-300" />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[9px] w-10 text-rose-400 uppercase font-mono">DDL</span>
                                        <input type="date" value={newTaskDeadline} onChange={e => onNewTaskDeadlineChange(e.target.value)} className="flex-1 text-[10px] font-mono bg-slate-50 border border-slate-100 rounded px-1.5 py-1 text-slate-500 outline-none focus:border-blue-300" />
                                    </div>
                                </div>
                                <div className="flex items-center justify-between pt-2 border-t border-slate-50">
                                    <div className="flex gap-1">
                                        {TYPE_OPTIONS.map(opt => (
                                            <button key={opt.value} onClick={() => onNewTaskTypeChange(opt.value)} className={`text-[10px] px-1.5 py-1 rounded border transition-all ${newTaskType === opt.value ? 'bg-slate-800 text-white' : 'bg-slate-50 text-slate-400'}`}>{opt.label}</button>
                                        ))}
                                    </div>
                                    <div className="flex gap-1">
                                        <button onClick={onCancelAdding} className="p-1.5 text-slate-400 hover:bg-slate-100 rounded"><X size={14} /></button>
                                        <button onClick={onConfirmAddTask} className="p-1.5 text-white bg-blue-500 hover:bg-blue-600 rounded"><Check size={14} /></button>
                                    </div>
                                </div>
                            </motion.div>
                        ) : (
                            <button
                                onClick={() => onStartAdding(activeCategory)}
                                className="w-full py-2 flex items-center justify-center gap-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50/50 rounded-lg border border-dashed border-slate-200 opacity-60 hover:opacity-100 transition-all text-xs font-mono uppercase tracking-widest"
                            >
                                <Plus size={14} /> Add Task
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
