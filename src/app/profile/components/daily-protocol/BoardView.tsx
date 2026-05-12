"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Circle, Plus, X, Check, Pencil, Archive, Save } from 'lucide-react';
import {
    Task, Category, TaskType,
    CATEGORY_CONFIG, TYPE_OPTIONS, TYPE_STYLE_MAP
} from './types';

interface BoardViewProps {
    tasks: Task[];
    isAdmin: boolean;
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
    // 编辑任务相关
    editingTaskId: number | null;
    editForm: { title: string; date: string; deadline: string; type: TaskType };
    onStartEditing: (task: Task, e: React.MouseEvent) => void;
    onCancelEditing: () => void;
    onSaveEdit: (id: number) => void;
    onEditFormChange: (form: { title: string; date: string; deadline: string; type: TaskType }) => void;
    onKeyDownEdit: (e: React.KeyboardEvent, id: number) => void;
    // 里程碑相关
    msInput: { title: string; date: string };
    onMsInputChange: (v: { title: string; date: string }) => void;
    onAddMilestone: (taskId: number) => void;
    onDeleteMilestone: (msId: number) => void;
    // 状态切换
    onToggleStatus: (id: number, status: Task['status']) => void;
    onArchiveTask: (id: number, e: React.MouseEvent) => void;
}

export default function BoardView({
    tasks, isAdmin,
    addingCategory, newTaskTitle, newTaskType, newTaskStartDate, newTaskDeadline,
    inputRef, onStartAdding, onCancelAdding, onConfirmAddTask,
    onNewTaskTitleChange, onNewTaskTypeChange, onNewTaskStartDateChange, onNewTaskDeadlineChange,
    onKeyDownAdd,
    editingTaskId, editForm, onStartEditing, onCancelEditing, onSaveEdit, onEditFormChange,
    onKeyDownEdit,
    msInput, onMsInputChange, onAddMilestone, onDeleteMilestone,
    onToggleStatus, onArchiveTask,
}: BoardViewProps) {
    return (
        <motion.div
            key="board-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="h-full overflow-x-auto p-6"
        >
            <div className="flex h-full gap-6 min-w-[800px]">
                {(['knowledge', 'sports', 'arts', 'social'] as Category[]).map(cat => {
                    const config = CATEGORY_CONFIG[cat];
                    const catTasks = [...tasks.filter(t => t.category === cat)].sort((a, b) =>
                        a.status === 'in_progress' ? -1 : 1
                    );
                    const isAddingThisCat = addingCategory === cat;

                    return (
                        <div
                            key={cat}
                            className={`flex-1 flex flex-col min-w-[200px] h-full rounded-xl border border-white/60 shadow-sm backdrop-blur-sm overflow-hidden group/col transition-colors ${config.bgLight}`}
                        >
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
                                                onClick={() => !isEditing && onToggleStatus(task.id, task.status)}
                                                className={`
                                                    p-3 rounded-lg border transition-all duration-300 group/card relative overflow-hidden
                                                    ${isEditing ? 'bg-blue-50/80 border-blue-300 ring-2 ring-blue-100 cursor-default' : 'cursor-pointer'}
                                                    ${!isEditing && task.status === 'in_progress' ? 'bg-white border-l-[3px] shadow-md' : ''}
                                                    ${!isEditing && task.status !== 'in_progress' ? 'bg-white/40 border-slate-200 text-slate-600 hover:bg-white hover:border-slate-300' : ''}
                                                `}
                                            >
                                                {isEditing ? (
                                                    /* 编辑态 */
                                                    <div className="flex flex-col gap-2 relative z-20">
                                                        <input
                                                            type="text"
                                                            value={editForm.title}
                                                            onChange={e => onEditFormChange({ ...editForm, title: e.target.value })}
                                                            className="w-full text-sm font-bold text-slate-700 bg-white border border-slate-200 rounded px-2 py-1 outline-none focus:border-blue-400"
                                                            autoFocus
                                                            onKeyDown={(e) => onKeyDownEdit(e, task.id)}
                                                        />
                                                        <div className="flex items-center gap-2">
                                                            <div className="flex flex-col gap-0.5">
                                                                <span className="text-[9px] text-slate-400 uppercase font-mono px-1">Start</span>
                                                                <input
                                                                    type="date"
                                                                    value={editForm.date}
                                                                    onChange={e => onEditFormChange({ ...editForm, date: e.target.value })}
                                                                    className="text-[10px] font-mono bg-white border border-slate-200 rounded px-1 py-0.5 text-slate-500 outline-none focus:border-blue-400"
                                                                />
                                                            </div>
                                                            <div className="flex flex-col gap-0.5">
                                                                <span className="text-[9px] text-rose-400 uppercase font-mono px-1">Deadline</span>
                                                                <input
                                                                    type="date"
                                                                    value={editForm.deadline}
                                                                    onChange={e => onEditFormChange({ ...editForm, deadline: e.target.value })}
                                                                    className="text-[10px] font-mono bg-white border border-slate-200 rounded px-1 py-0.5 text-slate-500 outline-none focus:border-blue-400"
                                                                />
                                                            </div>
                                                            <div className="flex bg-white rounded border border-slate-200 p-0.5 self-end">
                                                                {TYPE_OPTIONS.map(opt => (
                                                                    <button
                                                                        key={opt.value}
                                                                        onClick={() => onEditFormChange({ ...editForm, type: opt.value })}
                                                                        className={`px-1.5 py-0.5 text-[10px] rounded transition-colors ${editForm.type === opt.value ? 'bg-blue-500 text-white' : 'text-slate-400 hover:text-slate-600'}`}
                                                                    >
                                                                        {opt.label}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </div>

                                                        {/* 里程碑管理区 */}
                                                        <div className="mt-3 pt-3 border-t border-slate-100">
                                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Milestones</span>

                                                            {/* 行内添加里程碑表单 */}
                                                            <div className="flex flex-col gap-2 p-2 mb-3 bg-slate-50 rounded-lg border border-slate-100">
                                                                <input
                                                                    type="text"
                                                                    placeholder="New milestone name..."
                                                                    className="text-[11px] bg-white border border-slate-200 rounded px-2 py-1 outline-none focus:border-blue-400"
                                                                    value={msInput.title}
                                                                    onChange={e => onMsInputChange({ ...msInput, title: e.target.value })}
                                                                />
                                                                <div className="flex items-center justify-between gap-2">
                                                                    <input
                                                                        type="date"
                                                                        className="text-[10px] font-mono bg-white border border-slate-200 rounded px-1.5 py-0.5 outline-none text-slate-500"
                                                                        value={msInput.date}
                                                                        onChange={e => onMsInputChange({ ...msInput, date: e.target.value })}
                                                                    />
                                                                    <button
                                                                        onClick={() => onAddMilestone(task.id)}
                                                                        className="flex items-center gap-1 bg-blue-500 text-white text-[10px] px-2 py-1 rounded hover:bg-blue-600 transition-colors"
                                                                    >
                                                                        <Plus size={10} /> Add
                                                                    </button>
                                                                </div>
                                                            </div>

                                                            <div className="space-y-1 max-h-32 overflow-y-auto custom-scrollbar">
                                                                {task.milestones?.map(ms => (
                                                                    <div key={ms.id} className="flex items-center justify-between text-[10px] bg-white p-1.5 rounded border border-slate-100 group/ms">
                                                                        <div className="flex items-center gap-2 truncate">
                                                                            <span className="font-mono text-slate-400">{ms.date.split('-').slice(1).join('/')}</span>
                                                                            <span className="text-slate-600 truncate">{ms.title}</span>
                                                                        </div>
                                                                        <button onClick={() => onDeleteMilestone(ms.id)} className="opacity-0 group-hover/ms:opacity-100 text-rose-400 hover:text-rose-600 transition-opacity">
                                                                            <X size={10} />
                                                                        </button>
                                                                    </div>
                                                                ))}
                                                                {(!task.milestones || task.milestones.length === 0) && (
                                                                    <p className="text-[10px] text-slate-300 italic text-center py-2">No milestones yet</p>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {/* 保存 / 取消 按钮 — 移至底部 */}
                                                        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 mt-1">
                                                            <button onClick={onCancelEditing} className="p-1 text-slate-400 hover:bg-slate-200 rounded"><X size={14} /></button>
                                                            <button onClick={() => onSaveEdit(task.id)} className="p-1 text-blue-500 hover:bg-blue-100 rounded"><Save size={14} /></button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    /* 展示态 */
                                                    <div className="flex items-start justify-between gap-2 relative z-10">
                                                        <div className="flex items-start gap-2.5 min-w-0">
                                                            <div className={`mt-0.5 transition-colors ${task.status === 'in_progress' ? config.color : 'text-slate-300'}`}>
                                                                {task.status === 'in_progress' ? <Play size={14} fill="currentColor" /> : <Circle size={14} />}
                                                            </div>
                                                            <div className="flex flex-col min-w-0">
                                                                <span className={`text-base font-medium leading-tight truncate ${task.status === 'in_progress' ? 'text-slate-800' : ''}`}>{task.title}</span>
                                                                <span className="text-[14px] text-slate-400 font-mono mt-0.5">{task.startDate}</span>
                                                            </div>
                                                        </div>
                                                        <div className="flex opacity-0 group-hover/card:opacity-100 transition-all duration-300 gap-1.5 shrink-0">
                                                            <button onClick={(e) => onStartEditing(task, e)} className="text-slate-400 hover:bg-slate-200 p-1.5 rounded"><Pencil size={14} /></button>
                                                            <button type="button" title="永久删除" onClick={(e) => onArchiveTask(task.id, e)} className="text-slate-400 hover:bg-rose-100 hover:text-rose-500 p-1.5 rounded"><Archive size={14} /></button>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* 任务类型标签 */}
                                                {!isEditing && task.task_type && (
                                                    <span className={`absolute top-3 right-3 text-[14px] font-mono tracking-widest uppercase px-1.5 py-0.5 rounded border transition-all duration-200 font-black z-20 pointer-events-none ${TYPE_STYLE_MAP[task.category][task.task_type]} ${task.status === 'in_progress' ? 'opacity-100' : 'opacity-40'} group-hover/card:opacity-0`}>
                                                        {task.task_type === 'course' && '课程'}
                                                        {task.task_type === 'project' && '项目'}
                                                        {task.task_type === 'plan' && '计划'}
                                                    </span>
                                                )}
                                                {!isEditing && task.status === 'in_progress' && (
                                                    <div className={`absolute inset-0 ${config.bg} opacity-40 pointer-events-none`} />
                                                )}
                                            </motion.div>
                                        );
                                    })}
                                </AnimatePresence>

                                {/* 底部添加栏 */}
                                <div className="pt-2">
                                    {isAddingThisCat ? (
                                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-3 bg-white rounded-lg border border-blue-200 shadow-sm space-y-3">
                                            <input
                                                ref={inputRef}
                                                type="text"
                                                placeholder="Type task title..."
                                                className="w-full text-sm font-bold outline-none bg-transparent"
                                                value={newTaskTitle}
                                                onChange={(e) => onNewTaskTitleChange(e.target.value)}
                                                onKeyDown={onKeyDownAdd}
                                            />
                                            <div className="flex items-center gap-3">
                                                <div className="flex flex-col gap-0.5">
                                                    <span className="text-[9px] text-slate-400 uppercase font-mono px-1">Start</span>
                                                    <input type="date" value={newTaskStartDate} onChange={e => onNewTaskStartDateChange(e.target.value)} className="text-[10px] font-mono bg-slate-50 border border-slate-100 rounded px-1.5 py-1 text-slate-500 outline-none focus:border-blue-300" />
                                                </div>
                                                <div className="flex flex-col gap-0.5">
                                                    <span className="text-[9px] text-rose-400 uppercase font-mono px-1">Deadline</span>
                                                    <input type="date" value={newTaskDeadline} onChange={e => onNewTaskDeadlineChange(e.target.value)} className="text-[10px] font-mono bg-slate-50 border border-slate-100 rounded px-1.5 py-1 text-slate-500 outline-none focus:border-blue-300" />
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between pt-1 border-t border-slate-50">
                                                <div className="flex gap-1">
                                                    {TYPE_OPTIONS.map(opt => (
                                                        <button key={opt.value} onClick={() => onNewTaskTypeChange(opt.value)} className={`text-[10px] px-2 py-1 rounded-md border transition-all ${newTaskType === opt.value ? 'bg-slate-800 text-white' : 'bg-slate-50 text-slate-400'}`}>{opt.label}</button>
                                                    ))}
                                                </div>
                                                <div className="flex gap-1">
                                                    <button onClick={onCancelAdding} className="p-1.5 text-slate-400"><X size={14} /></button>
                                                    <button onClick={onConfirmAddTask} className="p-1.5 text-white bg-blue-500 rounded"><Check size={14} /></button>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ) : (
                                        <button
                                            onClick={() => onStartAdding(cat)}
                                            className="w-full py-2 flex items-center justify-center gap-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50/50 rounded-lg border border-dashed border-slate-200 opacity-0 group-hover/col:opacity-100 transition-all text-xs font-mono uppercase tracking-widest"
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
    );
}
