"use client";

import React, { useState } from 'react';
import useSWR from 'swr';
import { motion, AnimatePresence } from 'framer-motion';
import {
    BookOpen,
    Zap,
    Heart,
    Plus,
    Pencil,
    Trash2,
    Check,
    X,
    Loader2,
    Sparkles
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';

export interface HabitItem {
    id: number;
    domain: 'learning' | 'body' | 'mind';
    content: string;
    is_active: boolean;
    sort_order: number;
    created_at: string;
}

interface HabitsBoardViewProps {
    isAdmin?: boolean;
}

type DomainType = 'learning' | 'body' | 'mind';

interface DomainMeta {
    id: DomainType;
    title: string;
    subtitle: string;
    icon: React.ComponentType<{ size?: number; className?: string }>;
    accentColor: string;
    bgAccent: string;
    badgeBorder: string;
    dotGlow: string;
    activeText: string;
    cardActiveBorder: string;
}

const DOMAIN_CONFIG: DomainMeta[] = [
    {
        id: 'learning',
        title: '学习习惯',
        subtitle: 'Learning & Cognitive Exploration',
        icon: BookOpen,
        accentColor: 'text-blue-600',
        bgAccent: 'bg-blue-50/70',
        badgeBorder: 'border-blue-200/80',
        dotGlow: 'bg-blue-500 shadow-[0_0_10px_rgba(37,99,235,0.7)]',
        activeText: 'text-slate-800',
        cardActiveBorder: 'border-blue-200/80 hover:border-blue-300',
    },
    {
        id: 'body',
        title: '身体习惯',
        subtitle: 'Body, Vitality & Discipline',
        icon: Zap,
        accentColor: 'text-emerald-600',
        bgAccent: 'bg-emerald-50/70',
        badgeBorder: 'border-emerald-200/80',
        dotGlow: 'bg-emerald-500 shadow-[0_0_10px_rgba(5,150,105,0.7)]',
        activeText: 'text-slate-800',
        cardActiveBorder: 'border-emerald-200/80 hover:border-emerald-300',
    },
    {
        id: 'mind',
        title: '心绪习惯',
        subtitle: 'Mind, Emotions & Inner Peace',
        icon: Heart,
        accentColor: 'text-rose-600',
        bgAccent: 'bg-rose-50/70',
        badgeBorder: 'border-rose-200/80',
        dotGlow: 'bg-rose-500 shadow-[0_0_10px_rgba(225,29,72,0.7)]',
        activeText: 'text-slate-800',
        cardActiveBorder: 'border-rose-200/80 hover:border-rose-300',
    },
];

export default function HabitsBoardView({ isAdmin = false }: HabitsBoardViewProps) {
    // 1. 数据拉取
    const { data: habits = [], mutate, isLoading } = useSWR<HabitItem[]>(
        'profile_status_habits',
        async () => {
            const { data, error } = await supabase
                .from('profile_status_habits')
                .select('*')
                .order('created_at', { ascending: true });

            if (error) {
                console.error('Failed to fetch habits:', error);
                throw error;
            }
            return data || [];
        }
    );

    // 2. 状态管理
    const [addingDomain, setAddingDomain] = useState<DomainType | null>(null);
    const [newContent, setNewContent] = useState('');
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editContent, setEditContent] = useState('');
    const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // 3. 切换状态 (is_active)
    const toggleHabitActive = async (item: HabitItem) => {
        if (!isAdmin) {
            toast.info('查看模式：登录管理员后可调整习惯状态');
            return;
        }

        const nextStatus = !item.is_active;

        // 乐观更新
        mutate(
            habits.map(h => (h.id === item.id ? { ...h, is_active: nextStatus } : h)),
            false
        );

        const { error } = await supabase
            .from('profile_status_habits')
            .update({ is_active: nextStatus, updated_at: new Date().toISOString() })
            .eq('id', item.id);

        if (error) {
            toast.error('更新失败：' + error.message);
            mutate();
        }
    };

    // 4. 添加新习惯
    const handleAddHabit = async (domain: DomainType) => {
        if (!newContent.trim()) {
            toast.warning('请输入习惯内容');
            return;
        }

        try {
            setIsSubmitting(true);
            const { data, error } = await supabase
                .from('profile_status_habits')
                .insert({
                    domain,
                    content: newContent.trim(),
                    is_active: true,
                    sort_order: habits.filter(h => h.domain === domain).length + 1,
                })
                .select()
                .single();

            if (error) throw error;

            toast.success('习惯已添加');
            mutate([...habits, data], false);
            setNewContent('');
            setAddingDomain(null);
        } catch (err: any) {
            toast.error('添加失败：' + err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    // 5. 保存编辑
    const handleSaveEdit = async (id: number) => {
        if (!editContent.trim()) {
            toast.warning('习惯内容不能为空');
            return;
        }

        try {
            setIsSubmitting(true);
            const { error } = await supabase
                .from('profile_status_habits')
                .update({
                    content: editContent.trim(),
                    updated_at: new Date().toISOString()
                })
                .eq('id', id);

            if (error) throw error;

            toast.success('习惯已修改');
            mutate(
                habits.map(h => (h.id === id ? { ...h, content: editContent.trim() } : h)),
                false
            );
            setEditingId(null);
            setEditContent('');
        } catch (err: any) {
            toast.error('修改失败：' + err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    // 6. 删除习惯
    const handleDeleteHabit = async (id: number) => {
        try {
            setIsSubmitting(true);
            const { error } = await supabase
                .from('profile_status_habits')
                .delete()
                .eq('id', id);

            if (error) throw error;

            toast.success('习惯已删除');
            mutate(habits.filter(h => h.id !== id), false);
            setDeleteConfirmId(null);
        } catch (err: any) {
            toast.error('删除失败：' + err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex-1 w-full h-full overflow-y-auto px-6 md:px-14 py-8 custom-scrollbar space-y-10">
            {isLoading && habits.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-slate-400 gap-3">
                    <Loader2 size={24} className="animate-spin text-blue-500" />
                    <span className="text-xs font-mono tracking-widest uppercase">LOADING HABITS...</span>
                </div>
            ) : (
                DOMAIN_CONFIG.map((conf) => {
                    const domainHabits = habits.filter(h => h.domain === conf.id);
                    const activeCount = domainHabits.filter(h => h.is_active).length;
                    const totalCount = domainHabits.length;
                    const IconComponent = conf.icon;

                    return (
                        <div key={conf.id} className="space-y-4">
                            {/* Section Header */}
                            <div className="flex items-center justify-between pb-3 border-b border-dashed border-slate-200">
                                <div className="flex items-center gap-3">
                                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${conf.bgAccent} ${conf.badgeBorder} border shadow-xs`}>
                                        <IconComponent size={18} className={conf.accentColor} />
                                    </div>
                                    <div>
                                        <div className="flex items-baseline gap-2.5">
                                            <h4 className="text-base font-black text-slate-800 tracking-tight">
                                                {conf.title}
                                            </h4>
                                            <span className="text-[10px] font-mono tracking-wider uppercase text-slate-400">
                                                {conf.subtitle}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Active Stats Pill */}
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full border border-slate-200/70">
                                        坚持中: <span className={conf.accentColor}>{activeCount}</span> / {totalCount}
                                    </span>
                                </div>
                            </div>

                            {/* Habit Item Cards List */}
                            <div className="space-y-2.5">
                                {domainHabits.length === 0 && addingDomain !== conf.id && (
                                    <div className="py-6 px-4 text-center rounded-2xl bg-white/40 border border-dashed border-slate-200 text-slate-400 text-xs font-mono">
                                        暂无习惯记录
                                    </div>
                                )}

                                {domainHabits.map((item, index) => {
                                    const isEditing = editingId === item.id;
                                    const isConfirmingDelete = deleteConfirmId === item.id;

                                    return (
                                        <motion.div
                                            key={item.id}
                                            layout
                                            initial={{ opacity: 0, y: 8 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.2 }}
                                            className={`
                                                group relative w-full rounded-2xl p-4 transition-all duration-300 border flex items-center justify-between gap-4
                                                ${item.is_active
                                                    ? `bg-white/80 ${conf.cardActiveBorder} shadow-sm hover:shadow-md`
                                                    : 'bg-white/35 border-slate-100/90 text-slate-400 hover:bg-white/60 hover:border-slate-200'
                                                }
                                            `}
                                        >
                                            {/* Left Section: Index Number + Status Dot + Text Content */}
                                            <div
                                                onClick={() => !isEditing && toggleHabitActive(item)}
                                                className={`flex-1 flex items-center gap-3.5 ${isAdmin ? 'cursor-pointer select-none' : 'cursor-default'}`}
                                            >
                                                {/* Index Number */}
                                                <span className="w-5 text-[11px] font-mono font-semibold text-slate-400 shrink-0 text-right">
                                                    {String(index + 1).padStart(2, '0')}
                                                </span>

                                                {/* Indicator Dot */}
                                                <div
                                                    className={`
                                                        w-3 h-3 rounded-full shrink-0 transition-all duration-300
                                                        ${item.is_active
                                                            ? `${conf.dotGlow} ring-4 ring-white`
                                                            : 'bg-slate-200'
                                                        }
                                                    `}
                                                    title={item.is_active ? '最近在坚持' : '暂未坚持'}
                                                />

                                                {/* Content Text / Inline Edit */}
                                                {isEditing ? (
                                                    <div className="flex-1 flex items-center gap-2" onClick={e => e.stopPropagation()}>
                                                        <input
                                                            type="text"
                                                            value={editContent}
                                                            onChange={e => setEditContent(e.target.value)}
                                                            onKeyDown={e => {
                                                                if (e.key === 'Enter') handleSaveEdit(item.id);
                                                                if (e.key === 'Escape') setEditingId(null);
                                                            }}
                                                            autoFocus
                                                            className="flex-1 bg-white border border-slate-300 focus:border-blue-500 rounded-lg px-3 py-1.5 text-sm text-slate-800 outline-hidden shadow-inner"
                                                        />
                                                        <button
                                                            onClick={() => handleSaveEdit(item.id)}
                                                            disabled={isSubmitting}
                                                            className="p-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                                                            title="保存"
                                                        >
                                                            <Check size={14} />
                                                        </button>
                                                        <button
                                                            onClick={() => setEditingId(null)}
                                                            className="p-1.5 rounded-lg bg-slate-200 text-slate-600 hover:bg-slate-300 transition-colors"
                                                            title="取消"
                                                        >
                                                            <X size={14} />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <span
                                                        className={`text-sm font-medium tracking-tight transition-all duration-300 ${
                                                            item.is_active
                                                                ? conf.activeText
                                                                : 'text-slate-400 line-through decoration-slate-300 opacity-65'
                                                        }`}
                                                    >
                                                        {item.content}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Right Section: Admin Actions (Hover to reveal) */}
                                            {isAdmin && !isEditing && (
                                                <div className="shrink-0 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                                    {isConfirmingDelete ? (
                                                        <div className="flex items-center gap-1 bg-rose-50 border border-rose-200 rounded-lg px-2 py-1">
                                                            <span className="text-[11px] font-bold text-rose-600 mr-1">确定删除?</span>
                                                            <button
                                                                onClick={() => handleDeleteHabit(item.id)}
                                                                disabled={isSubmitting}
                                                                className="p-1 rounded text-rose-600 hover:bg-rose-100 transition-colors"
                                                            >
                                                                <Check size={12} />
                                                            </button>
                                                            <button
                                                                onClick={() => setDeleteConfirmId(null)}
                                                                className="p-1 rounded text-slate-500 hover:bg-slate-200 transition-colors"
                                                            >
                                                                <X size={12} />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setEditingId(item.id);
                                                                    setEditContent(item.content);
                                                                }}
                                                                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                                                                title="编辑习惯"
                                                            >
                                                                <Pencil size={14} />
                                                            </button>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setDeleteConfirmId(item.id);
                                                                }}
                                                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                                                title="删除习惯"
                                                            >
                                                                <Trash2 size={14} />
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            )}
                                        </motion.div>
                                    );
                                })}

                                {/* Inline Add Input / Trigger (Admin Only) */}
                                {isAdmin && (
                                    <div className="pt-1">
                                        {addingDomain === conf.id ? (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                exit={{ opacity: 0, height: 0 }}
                                                className="bg-white/90 border border-blue-200 rounded-2xl p-3 shadow-sm flex items-center gap-2"
                                            >
                                                <input
                                                    type="text"
                                                    value={newContent}
                                                    onChange={e => setNewContent(e.target.value)}
                                                    onKeyDown={e => {
                                                        if (e.key === 'Enter') handleAddHabit(conf.id);
                                                        if (e.key === 'Escape') {
                                                            setAddingDomain(null);
                                                            setNewContent('');
                                                        }
                                                    }}
                                                    placeholder={`输入新${conf.title.slice(0, 2)}习惯（回车保存）...`}
                                                    autoFocus
                                                    className="flex-1 bg-transparent px-2 py-1 text-sm text-slate-800 placeholder:text-slate-400 outline-hidden"
                                                />
                                                <button
                                                    onClick={() => handleAddHabit(conf.id)}
                                                    disabled={isSubmitting}
                                                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-colors shadow-xs"
                                                >
                                                    {isSubmitting ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                                                    <span>保存</span>
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setAddingDomain(null);
                                                        setNewContent('');
                                                    }}
                                                    className="px-2.5 py-1.5 rounded-xl bg-slate-100 text-slate-600 text-xs font-medium hover:bg-slate-200 transition-colors"
                                                >
                                                    取消
                                                </button>
                                            </motion.div>
                                        ) : (
                                            <button
                                                onClick={() => {
                                                    setAddingDomain(conf.id);
                                                    setNewContent('');
                                                }}
                                                className="w-full py-2.5 px-4 rounded-2xl border border-dashed border-slate-200 hover:border-slate-300 text-slate-400 hover:text-slate-600 hover:bg-white/40 transition-all flex items-center justify-center gap-2 text-xs font-semibold group"
                                            >
                                                <Plus size={14} className="group-hover:scale-110 transition-transform" />
                                                <span>添加{conf.title.slice(0, 2)}习惯</span>
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })
            )}
        </div>
    );
}
