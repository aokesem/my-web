// === 类型定义 ===
export type Category = 'knowledge' | 'sports' | 'arts' | 'social';
export type TaskStatus = 'todo' | 'in_progress' | 'archived';
export type TaskType = 'plan' | 'project' | 'course';

export interface Milestone {
    id: number;
    task_id: number;
    title: string;
    date: string;
    is_completed: boolean;
}

export interface Task {
    id: number;
    title: string;
    category: Category;
    status: TaskStatus;
    startDate: string;
    deadline?: string;
    task_type: TaskType;
    milestones?: Milestone[];
}

// === 配置表 ===
import { BookOpen, Zap, Palette, Users } from 'lucide-react';

export const CATEGORY_CONFIG: Record<Category, { label: string; color: string; bg: string; bgLight: string; indicator: string; icon: any }> = {
    knowledge: { label: 'Knowledge', color: 'text-blue-600',    bg: 'bg-blue-100',    bgLight: 'bg-blue-50',    indicator: 'bg-blue-500',    icon: BookOpen },
    sports:    { label: 'Sports',    color: 'text-rose-600',    bg: 'bg-rose-100',    bgLight: 'bg-rose-50',    indicator: 'bg-rose-500',    icon: Zap },
    arts:      { label: 'Arts',      color: 'text-emerald-600', bg: 'bg-emerald-100', bgLight: 'bg-emerald-50', indicator: 'bg-emerald-500', icon: Palette },
    social:    { label: 'Social',    color: 'text-purple-600',  bg: 'bg-purple-100',  bgLight: 'bg-purple-50',  indicator: 'bg-purple-500',  icon: Users },
};

export const TYPE_OPTIONS: { value: TaskType; label: string; opacity: string }[] = [
    { value: 'plan',    label: '计划', opacity: 'opacity-50' },
    { value: 'project', label: '项目', opacity: 'opacity-80' },
    { value: 'course',  label: '课程', opacity: 'opacity-100 font-bold' },
];

export const TYPE_STYLE_MAP: Record<Category, Record<TaskType, string>> = {
    knowledge: { plan: 'text-blue-800 border-blue-800',    project: 'text-blue-800 border-blue-800',    course: 'text-blue-800 border-blue-800' },
    sports:    { plan: 'text-rose-800 border-rose-800',    project: 'text-rose-800 border-rose-800',    course: 'text-rose-800 border-rose-800' },
    arts:      { plan: 'text-emerald-800 border-emerald-800', project: 'text-emerald-800 border-emerald-800', course: 'text-emerald-800 border-emerald-800' },
    social:    { plan: 'text-purple-800 border-purple-800', project: 'text-purple-800 border-purple-800', course: 'text-purple-800 border-purple-800' },
};
