"use client";

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import {
    ArrowLeft,
    ArrowRight,
    ArrowUpRight,
    BookText,
    Check,
    ChevronLeft,
    ChevronRight,
    FileCode,
    FileText,
    Loader2,
    Pencil,
    Plus,
    Search,
    Trash2,
    X,
} from 'lucide-react';
import { toast } from 'sonner';
import { SafeDeleteDialog } from '@/components/ui/safe-delete-dialog';
import type { PrismTopicItemType, PrismTopicLink } from '../types';
import {
    addPrismTopicLink,
    createPrismTopic,
    removePrismTopicLink,
    swapPrismTopicOrder,
    updatePrismTopic,
    usePrismTopicMatrix,
} from '../hooks/usePrismTopics';

interface TopicMatrixModalProps {
    open: boolean;
    onClose: () => void;
    isAdmin: boolean;
}

interface ColumnEntity {
    id: string;
    name: string;
    sublabel?: string;
    href: string;
}

interface ColumnTheme {
    icon: React.ElementType;
    shell: string;
    iconBox: string;
    dot: string;
    pillHover: string;
    pickerActive: string;
}

const CARD_THEMES: Record<PrismTopicItemType, ColumnTheme> = {
    course: {
        icon: BookText,
        shell: 'bg-linear-to-b from-violet-50/75 via-white/80 to-white/65 border-violet-200/50',
        iconBox: 'bg-violet-100/70 text-violet-600',
        dot: 'bg-violet-400',
        pillHover: 'hover:border-violet-200/90 hover:-translate-y-0.5 hover:shadow-[0_6px_18px_rgba(139,92,246,0.08)]',
        pickerActive: 'bg-violet-50 text-violet-700 border-violet-200',
    },
    project: {
        icon: FileText,
        shell: 'bg-linear-to-b from-cyan-50/75 via-white/80 to-white/65 border-cyan-200/50',
        iconBox: 'bg-cyan-100/70 text-cyan-600',
        dot: 'bg-cyan-400',
        pillHover: 'hover:border-cyan-200/90 hover:-translate-y-0.5 hover:shadow-[0_6px_18px_rgba(6,182,212,0.08)]',
        pickerActive: 'bg-cyan-50 text-cyan-700 border-cyan-200',
    },
    language: {
        icon: FileCode,
        shell: 'bg-linear-to-b from-emerald-50/75 via-white/80 to-white/65 border-emerald-200/50',
        iconBox: 'bg-emerald-100/70 text-emerald-600',
        dot: 'bg-emerald-400',
        pillHover: 'hover:border-emerald-200/90 hover:-translate-y-0.5 hover:shadow-[0_6px_18px_rgba(16,185,129,0.08)]',
        pickerActive: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
};

export default function TopicMatrixModal({ open, onClose, isAdmin }: TopicMatrixModalProps) {
    const { data, isLoading, isError, mutate } = usePrismTopicMatrix(open);
    const { topics, links, courses, projects, languages } = data;

    const [activeIndex, setActiveIndex] = useState(0);
    const [slideDirection, setSlideDirection] = useState<1 | -1>(1);
    const [isEditMode, setIsEditMode] = useState(false);

    // 主题编辑状态
    const [isCreatingTopic, setIsCreatingTopic] = useState(false);
    const [newTopicName, setNewTopicName] = useState('');
    const [isRenamingTopic, setIsRenamingTopic] = useState(false);
    const [renameDraft, setRenameDraft] = useState('');
    const [submittingTopic, setSubmittingTopic] = useState(false);

    // 列内快捷添加面板状态
    const [openPickerType, setOpenPickerType] = useState<PrismTopicItemType | null>(null);
    const [pickerSearch, setPickerSearch] = useState('');
    const [busyLinkKey, setBusyLinkKey] = useState<string | null>(null);

    // 钳制页码
    useEffect(() => {
        if (topics.length === 0) {
            setActiveIndex(0);
        } else if (activeIndex >= topics.length) {
            setActiveIndex(topics.length - 1);
        }
    }, [topics.length, activeIndex]);

    // 非管理员强制退出编辑态
    useEffect(() => {
        if (!isAdmin) setIsEditMode(false);
    }, [isAdmin]);

    // 关闭弹窗时重置回纯净展示态
    useEffect(() => {
        if (!open) {
            setIsEditMode(false);
            setIsCreatingTopic(false);
            setIsRenamingTopic(false);
            setOpenPickerType(null);
            setPickerSearch('');
            setNewTopicName('');
            setRenameDraft('');
        }
    }, [open]);

    const currentTopic = topics[activeIndex] ?? null;

    const goToPage = (nextIndex: number) => {
        if (topics.length <= 1) return;
        const normalized = (nextIndex + topics.length) % topics.length;
        if (normalized === activeIndex) return;
        setSlideDirection(nextIndex > activeIndex ? 1 : -1);
        setActiveIndex(normalized);
        setIsRenamingTopic(false);
        setOpenPickerType(null);
        setPickerSearch('');
    };

    // 键盘支持：Esc 关闭，← / → 左右翻页
    useEffect(() => {
        if (!open) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (document.querySelector('[data-slot="dialog-content"]')) return;

            const activeTag = (document.activeElement as HTMLElement | null)?.tagName;
            const isTyping = activeTag === 'INPUT' || activeTag === 'TEXTAREA';

            if (e.key === 'Escape') {
                if (isCreatingTopic) {
                    setIsCreatingTopic(false);
                    return;
                }
                if (isRenamingTopic) {
                    setIsRenamingTopic(false);
                    return;
                }
                if (openPickerType) {
                    setOpenPickerType(null);
                    setPickerSearch('');
                    return;
                }
                if (!isTyping) {
                    onClose();
                }
                return;
            }

            if (isTyping) return;

            if (e.key === 'ArrowLeft' && topics.length > 1) {
                e.preventDefault();
                setSlideDirection(-1);
                setActiveIndex((prev) => (prev - 1 + topics.length) % topics.length);
                setIsRenamingTopic(false);
                setOpenPickerType(null);
                setPickerSearch('');
            } else if (e.key === 'ArrowRight' && topics.length > 1) {
                e.preventDefault();
                setSlideDirection(1);
                setActiveIndex((prev) => (prev + 1) % topics.length);
                setIsRenamingTopic(false);
                setOpenPickerType(null);
                setPickerSearch('');
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [open, topics.length, isCreatingTopic, isRenamingTopic, openPickerType, onClose]);

    const currentTopicLinksByType = useMemo(() => {
        const grouped: Record<PrismTopicItemType, PrismTopicLink[]> = {
            course: [],
            project: [],
            language: [],
        };
        if (!currentTopic) return grouped;

        for (const link of links) {
            if (link.topic_id === currentTopic.id && grouped[link.item_type]) {
                grouped[link.item_type].push(link);
            }
        }
        return grouped;
    }, [links, currentTopic]);

    // 组装三列数据与关联映射
    const columns = useMemo(() => {
        const rawColumns: Array<{
            type: PrismTopicItemType;
            title: string;
            subtitle: string;
            items: ColumnEntity[];
        }> = [
            {
                type: 'course',
                title: '课程笔记',
                subtitle: 'COURSES',
                items: courses.map((c) => ({
                    id: c.id,
                    name: c.name,
                    sublabel: c.name_en,
                    href: `/library/prism/courses?course=${encodeURIComponent(c.id)}`,
                })),
            },
            {
                type: 'project',
                title: '论文项目',
                subtitle: 'PROJECTS',
                items: projects.map((p) => ({
                    id: p.id,
                    name: p.name,
                    href: `/library/prism/papers?project=${encodeURIComponent(p.id)}`,
                })),
            },
            {
                type: 'language',
                title: '语言与工具',
                subtitle: 'CODEBASE',
                items: languages.map((l) => ({
                    id: l.id,
                    name: l.name,
                    href: `/library/prism/codebase?lang=${encodeURIComponent(l.id)}`,
                })),
            },
        ];

        return rawColumns.map((col) => {
            const entityMap = new Map(col.items.map((item) => [item.id, item]));
            const linkedEntries = currentTopicLinksByType[col.type]
                .map((link) => {
                    const entity = entityMap.get(link.item_id);
                    return entity ? { link, entity } : null;
                })
                .filter(
                    (entry): entry is { link: PrismTopicLink; entity: ColumnEntity } => entry !== null
                );

            return {
                ...col,
                theme: CARD_THEMES[col.type],
                linkedEntries,
                linkedIdSet: new Set(linkedEntries.map((e) => e.entity.id)),
            };
        });
    }, [courses, projects, languages, currentTopicLinksByType]);

    // === 主题操作 ===
    const handleCreateTopic = async () => {
        const trimmed = newTopicName.trim();
        if (!trimmed || submittingTopic) return;
        try {
            setSubmittingTopic(true);
            const maxOrder = topics.reduce((max, t) => Math.max(max, t.sort_order), -1);
            const created = await createPrismTopic(trimmed, maxOrder + 1);
            await mutate();
            setNewTopicName('');
            setIsCreatingTopic(false);
            setOpenPickerType(null);
            setSlideDirection(1);
            setActiveIndex(topics.length);
            toast.success(`已创建主题「${created.name}」`);
        } catch (err: any) {
            toast.error('创建主题失败: ' + (err?.message || '未知错误'));
        } finally {
            setSubmittingTopic(false);
        }
    };

    const handleRenameTopic = async () => {
        if (!currentTopic || submittingTopic) return;
        const trimmed = renameDraft.trim();
        if (!trimmed || trimmed === currentTopic.name) {
            setIsRenamingTopic(false);
            return;
        }
        try {
            setSubmittingTopic(true);
            await updatePrismTopic(currentTopic.id, { name: trimmed });
            await mutate();
            setIsRenamingTopic(false);
            toast.success('主题名称已更新');
        } catch (err: any) {
            toast.error('重命名失败: ' + (err?.message || '未知错误'));
        } finally {
            setSubmittingTopic(false);
        }
    };

    const handleMoveTopicOrder = async (direction: -1 | 1) => {
        if (!currentTopic || submittingTopic) return;
        const targetIndex = activeIndex + direction;
        if (targetIndex < 0 || targetIndex >= topics.length) return;
        const targetTopic = topics[targetIndex];
        try {
            setSubmittingTopic(true);
            if (direction === -1) {
                await swapPrismTopicOrder(targetTopic, currentTopic);
            } else {
                await swapPrismTopicOrder(currentTopic, targetTopic);
            }
            await mutate();
            setSlideDirection(direction);
            setActiveIndex(targetIndex);
        } catch (err: any) {
            toast.error('调整顺序失败: ' + (err?.message || '未知错误'));
        } finally {
            setSubmittingTopic(false);
        }
    };

    // === 关联条目操作 ===
    const handleToggleItemLink = async (type: PrismTopicItemType, itemId: string) => {
        if (!currentTopic) return;
        const key = `${type}:${itemId}`;
        if (busyLinkKey === key) return;

        const existingLink = currentTopicLinksByType[type].find((l) => l.item_id === itemId);
        try {
            setBusyLinkKey(key);
            if (existingLink) {
                await removePrismTopicLink(existingLink.id);
            } else {
                const typeLinks = currentTopicLinksByType[type];
                const maxOrder = typeLinks.reduce((max, l) => Math.max(max, l.sort_order), -1);
                await addPrismTopicLink(currentTopic.id, type, itemId, maxOrder + 1);
            }
            await mutate();
        } catch (err: any) {
            toast.error('更新关联失败: ' + (err?.message || '未知错误'));
        } finally {
            setBusyLinkKey(null);
        }
    };

    const handleRemoveLink = async (linkId: string) => {
        if (busyLinkKey === linkId) return;
        try {
            setBusyLinkKey(linkId);
            await removePrismTopicLink(linkId);
            await mutate();
        } catch (err: any) {
            toast.error('移出失败: ' + (err?.message || '未知错误'));
        } finally {
            setBusyLinkKey(null);
        }
    };

    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="fixed inset-0 z-40 bg-stone-900/25 backdrop-blur-sm flex items-center justify-center p-4 md:p-16"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.96, y: 12 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.96, y: 12 }}
                        transition={{ duration: 0.22, ease: 'easeOut' }}
                        className="relative w-full max-w-4xl flex items-center justify-center"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* 桌面端外侧悬浮左翻页 */}
                        <button
                            type="button"
                            onClick={() => goToPage(activeIndex - 1)}
                            disabled={topics.length <= 1}
                            className="hidden md:flex absolute -left-14 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-[#fbf9f5]/90 border border-white/80 text-stone-500 hover:text-stone-900 hover:bg-white shadow-[0_4px_16px_rgba(28,25,23,0.08)] items-center justify-center disabled:opacity-20 disabled:cursor-not-allowed transition-all backdrop-blur-md"
                            title="上一主题 (←)"
                        >
                            <ChevronLeft size={18} strokeWidth={1.6} />
                        </button>

                        {/* 暖白纸韵毛玻璃主容器 */}
                        <div className="relative w-full h-[590px] max-h-[86vh] rounded-3xl bg-[#fbf9f5]/92 backdrop-blur-2xl border border-white/90 shadow-[0_24px_80px_rgba(28,25,23,0.12),inset_0_1px_0_rgba(255,255,255,0.9)] flex flex-col overflow-hidden px-6 md:px-9 py-6 md:py-7">
                            {/* 极淡纸感噪点 */}
                            <div
                                className="absolute inset-0 opacity-[0.14] pointer-events-none mix-blend-multiply"
                                style={{
                                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.35'/%3E%3C/svg%3E")`,
                                }}
                            />

                            {/* ===== 顶部书眉区：极简页码 + 衬线大标题 + 低调编辑开关 ===== */}
                            <div className="relative z-10 shrink-0 pb-4 border-b border-stone-900/10">
                                <div className="flex items-center justify-between mb-2.5">
                                    <div className="flex items-center gap-3">
                                        <span className="text-[10px] font-mono tracking-[0.26em] text-stone-400 uppercase">
                                            {topics.length > 0
                                                ? `${String(activeIndex + 1).padStart(2, '0')} / ${String(topics.length).padStart(2, '0')}`
                                                : '00 / 00'}
                                        </span>
                                        {topics.length > 1 && (
                                            <div className="flex md:hidden items-center gap-1">
                                                <button
                                                    type="button"
                                                    onClick={() => goToPage(activeIndex - 1)}
                                                    className="p-1 text-stone-400 hover:text-stone-800"
                                                >
                                                    <ChevronLeft size={14} />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => goToPage(activeIndex + 1)}
                                                    className="p-1 text-stone-400 hover:text-stone-800"
                                                >
                                                    <ChevronRight size={14} />
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-2">
                                        {isAdmin && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setIsEditMode((prev) => !prev);
                                                    setOpenPickerType(null);
                                                    setIsRenamingTopic(false);
                                                }}
                                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-mono transition-all ${
                                                    isEditMode
                                                        ? 'bg-stone-800 text-white shadow-xs'
                                                        : 'text-stone-400 hover:text-stone-700 hover:bg-white/80'
                                                }`}
                                                title={isEditMode ? '完成编辑' : '编辑主题矩阵'}
                                            >
                                                <Pencil size={11} />
                                                {isEditMode ? '完成' : '编辑'}
                                            </button>
                                        )}
                                        <button
                                            type="button"
                                            onClick={onClose}
                                            className="w-7 h-7 rounded-full text-stone-400 hover:text-stone-800 hover:bg-white/80 flex items-center justify-center transition-colors"
                                            title="关闭 (Esc)"
                                        >
                                            <X size={16} strokeWidth={1.5} />
                                        </button>
                                    </div>
                                </div>

                                <div className="flex items-end justify-between gap-4">
                                    {isCreatingTopic ? (
                                        <div className="flex items-center gap-2 w-full max-w-md">
                                            <input
                                                value={newTopicName}
                                                onChange={(e) => setNewTopicName(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') handleCreateTopic();
                                                    if (e.key === 'Escape') {
                                                        setIsCreatingTopic(false);
                                                        setNewTopicName('');
                                                    }
                                                }}
                                                placeholder="输入新主题名称..."
                                                autoFocus
                                                className="flex-1 min-w-0 bg-transparent border-b border-stone-400 py-1 text-2xl font-serif font-bold text-stone-800 placeholder:text-stone-300 focus:outline-none focus:border-stone-800"
                                            />
                                            <button
                                                type="button"
                                                onClick={handleCreateTopic}
                                                disabled={!newTopicName.trim() || submittingTopic}
                                                className="w-7 h-7 rounded-full bg-stone-800 text-white flex items-center justify-center disabled:opacity-40"
                                            >
                                                <Check size={13} />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setIsCreatingTopic(false);
                                                    setNewTopicName('');
                                                }}
                                                className="w-7 h-7 rounded-full text-stone-400 hover:text-stone-700 flex items-center justify-center"
                                            >
                                                <X size={13} />
                                            </button>
                                        </div>
                                    ) : currentTopic ? (
                                        isRenamingTopic ? (
                                            <div className="flex items-center gap-2 w-full max-w-md">
                                                <input
                                                    value={renameDraft}
                                                    onChange={(e) => setRenameDraft(e.target.value)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') handleRenameTopic();
                                                        if (e.key === 'Escape') setIsRenamingTopic(false);
                                                    }}
                                                    autoFocus
                                                    className="flex-1 min-w-0 bg-transparent border-b border-stone-400 py-1 text-2xl font-serif font-bold text-stone-800 focus:outline-none focus:border-stone-800"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={handleRenameTopic}
                                                    disabled={!renameDraft.trim() || submittingTopic}
                                                    className="w-7 h-7 rounded-full bg-stone-800 text-white flex items-center justify-center disabled:opacity-40"
                                                >
                                                    <Check size={13} />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setIsRenamingTopic(false)}
                                                    className="w-7 h-7 rounded-full text-stone-400 hover:text-stone-700 flex items-center justify-center"
                                                >
                                                    <X size={13} />
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-3 min-w-0">
                                                <h2 className="text-2xl md:text-3xl font-serif font-bold tracking-tight text-stone-800 truncate">
                                                    {currentTopic.name}
                                                </h2>
                                                {isAdmin && isEditMode && (
                                                    <div className="flex items-center gap-0.5 bg-white/80 border border-stone-200/70 rounded-full px-1.5 py-0.5 shrink-0">
                                                        {topics.length > 1 && (
                                                            <>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleMoveTopicOrder(-1)}
                                                                    disabled={activeIndex === 0 || submittingTopic}
                                                                    className="p-1 text-stone-400 hover:text-stone-800 disabled:opacity-25"
                                                                    title="前移页序"
                                                                >
                                                                    <ArrowLeft size={12} />
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleMoveTopicOrder(1)}
                                                                    disabled={activeIndex === topics.length - 1 || submittingTopic}
                                                                    className="p-1 text-stone-400 hover:text-stone-800 disabled:opacity-25"
                                                                    title="后移页序"
                                                                >
                                                                    <ArrowRight size={12} />
                                                                </button>
                                                            </>
                                                        )}
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setRenameDraft(currentTopic.name);
                                                                setIsRenamingTopic(true);
                                                            }}
                                                            className="p-1 text-stone-400 hover:text-stone-800"
                                                            title="重命名主题"
                                                        >
                                                            <Pencil size={12} />
                                                        </button>
                                                        <SafeDeleteDialog
                                                            table="prism_topics"
                                                            recordId={currentTopic.id}
                                                            title={`删除主题「${currentTopic.name}」？`}
                                                            description="仅移除此主题页及其关联关系，不会删除课程、论文项目或语言工具本体。"
                                                            onSuccess={() => {
                                                                mutate();
                                                            }}
                                                        >
                                                            <button
                                                                type="button"
                                                                className="p-1 text-stone-400 hover:text-rose-500"
                                                                title="删除主题"
                                                            >
                                                                <Trash2 size={12} />
                                                            </button>
                                                        </SafeDeleteDialog>
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    ) : (
                                        <h2 className="text-2xl font-serif text-stone-400">尚未创建主题</h2>
                                    )}

                                    {isAdmin && isEditMode && !isCreatingTopic && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setNewTopicName('');
                                                setIsCreatingTopic(true);
                                            }}
                                            className="shrink-0 inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white/90 border border-stone-200/80 text-xs font-medium text-stone-600 hover:text-stone-900 hover:border-stone-300 shadow-2xs transition-all"
                                        >
                                            <Plus size={12} />
                                            新增主题
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* ===== 主体：三张独立悬浮渐变竖卡 ===== */}
                            <div className="relative z-10 flex-1 min-h-0 pt-5 overflow-hidden">
                                {isLoading ? (
                                    <div className="h-full flex items-center justify-center text-stone-400 gap-2 text-xs font-mono">
                                        <Loader2 size={16} className="animate-spin" />
                                        LOADING...
                                    </div>
                                ) : isError ? (
                                    <div className="h-full flex flex-col items-center justify-center gap-2 text-xs text-rose-500">
                                        <span>加载失败</span>
                                        <button
                                            type="button"
                                            onClick={() => mutate()}
                                            className="underline text-stone-600"
                                        >
                                            重试
                                        </button>
                                    </div>
                                ) : !currentTopic ? (
                                    <div className="h-full flex flex-col items-center justify-center text-center gap-4">
                                        <div className="flex items-center gap-1.5">
                                            <span className="w-2 h-2 rounded-full bg-violet-400/80" />
                                            <span className="w-2 h-2 rounded-full bg-cyan-400/80" />
                                            <span className="w-2 h-2 rounded-full bg-emerald-400/80" />
                                        </div>
                                        <p className="text-sm font-serif text-stone-500">
                                            按主题将课程笔记、论文项目与语言工具聚合到同一页矩阵中。
                                        </p>
                                        {isAdmin && !isCreatingTopic && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setIsEditMode(true);
                                                    setNewTopicName('');
                                                    setIsCreatingTopic(true);
                                                }}
                                                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-stone-800 text-white text-xs shadow-sm hover:bg-stone-900 transition-colors"
                                            >
                                                <Plus size={13} />
                                                创建第一个主题
                                            </button>
                                        )}
                                    </div>
                                ) : (
                                    <AnimatePresence mode="wait" initial={false}>
                                        <motion.div
                                            key={currentTopic.id}
                                            initial={{ opacity: 0, x: slideDirection * 18 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: slideDirection * -18 }}
                                            transition={{ duration: 0.2, ease: 'easeOut' }}
                                            className="grid grid-cols-1 md:grid-cols-3 gap-4 h-full min-h-0"
                                        >
                                            {columns.map((col) => {
                                                const ColIcon = col.theme.icon;
                                                const isPickerOpen = isAdmin && isEditMode && openPickerType === col.type;
                                                const query = pickerSearch.trim().toLowerCase();
                                                const filteredOptions =
                                                    isPickerOpen && query
                                                        ? col.items.filter(
                                                              (item) =>
                                                                  item.name.toLowerCase().includes(query) ||
                                                                  (item.sublabel || '').toLowerCase().includes(query)
                                                          )
                                                        : col.items;

                                                return (
                                                    <div
                                                        key={col.type}
                                                        className={`flex flex-col h-full min-h-0 rounded-2xl border shadow-[0_4px_20px_rgba(0,0,0,0.03)] overflow-hidden ${col.theme.shell}`}
                                                    >
                                                        {/* 竖卡头部 */}
                                                        <div className="shrink-0 px-4 py-3.5 flex items-center justify-between">
                                                            <div className="flex items-center gap-2.5">
                                                                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${col.theme.iconBox}`}>
                                                                    <ColIcon size={15} strokeWidth={1.7} />
                                                                </div>
                                                                <div>
                                                                    <div className="text-[13px] font-serif font-bold text-stone-800">
                                                                        {col.title}
                                                                    </div>
                                                                    <div className="text-[9px] font-mono text-stone-400 tracking-wider uppercase">
                                                                        {col.subtitle} · {col.linkedEntries.length}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            {isAdmin && isEditMode && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        if (isPickerOpen) {
                                                                            setOpenPickerType(null);
                                                                            setPickerSearch('');
                                                                        } else {
                                                                            setOpenPickerType(col.type);
                                                                            setPickerSearch('');
                                                                        }
                                                                    }}
                                                                    className="w-7 h-7 rounded-full bg-white/90 border border-stone-200/70 text-stone-500 hover:text-stone-800 flex items-center justify-center shadow-2xs transition-colors"
                                                                    title={isPickerOpen ? '收起选择面板' : `添加或移除${col.title}`}
                                                                >
                                                                    {isPickerOpen ? <X size={12} /> : <Plus size={12} />}
                                                                </button>
                                                            )}
                                                        </div>

                                                        {/* 编辑态内联勾选器 */}
                                                        {isPickerOpen && (
                                                            <div className="shrink-0 mx-3 mb-2 p-2 rounded-xl bg-white/95 border border-stone-200/70 shadow-sm space-y-1.5">
                                                                {col.items.length > 6 && (
                                                                    <div className="relative">
                                                                        <Search size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400" />
                                                                        <input
                                                                            value={pickerSearch}
                                                                            onChange={(e) => setPickerSearch(e.target.value)}
                                                                            placeholder="筛选..."
                                                                            autoFocus
                                                                            className="w-full bg-stone-50 rounded-lg pl-7 pr-2 py-1 text-xs focus:outline-none"
                                                                        />
                                                                    </div>
                                                                )}
                                                                <div className="max-h-36 overflow-y-auto space-y-1">
                                                                    {filteredOptions.length === 0 ? (
                                                                        <div className="text-[11px] text-stone-400 text-center py-2">
                                                                            无匹配条目
                                                                        </div>
                                                                    ) : (
                                                                        filteredOptions.map((item) => {
                                                                            const isLinked = col.linkedIdSet.has(item.id);
                                                                            const isBusy = busyLinkKey === `${col.type}:${item.id}`;
                                                                            return (
                                                                                <button
                                                                                    key={item.id}
                                                                                    type="button"
                                                                                    disabled={isBusy}
                                                                                    onClick={() => handleToggleItemLink(col.type, item.id)}
                                                                                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg border text-left text-xs transition-colors ${
                                                                                        isLinked
                                                                                            ? col.theme.pickerActive
                                                                                            : 'border-transparent text-stone-600 hover:bg-stone-50'
                                                                                    }`}
                                                                                >
                                                                                    <span className="truncate">{item.name}</span>
                                                                                    {isBusy ? (
                                                                                        <Loader2 size={11} className="animate-spin shrink-0" />
                                                                                    ) : isLinked ? (
                                                                                        <Check size={11} className="shrink-0" />
                                                                                    ) : (
                                                                                        <Plus size={11} className="shrink-0 opacity-40" />
                                                                                    )}
                                                                                </button>
                                                                            );
                                                                        })
                                                                    )}
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* 垂直单元列表（超出卡片独立滚动） */}
                                                        <div className="flex-1 min-h-0 overflow-y-auto px-3 pb-3 space-y-2">
                                                            {col.linkedEntries.length === 0 ? (
                                                                <div className="h-full min-h-[120px] flex items-center justify-center text-xs font-serif italic text-stone-300">
                                                                    暂未收录
                                                                </div>
                                                            ) : (
                                                                col.linkedEntries.map(({ link, entity }) => (
                                                                    <div key={link.id} className="relative group/pill">
                                                                        <Link
                                                                            href={entity.href}
                                                                            onClick={onClose}
                                                                            className={`flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl bg-white/90 border border-white shadow-[0_1px_4px_rgba(0,0,0,0.03)] transition-all duration-200 ${col.theme.pillHover}`}
                                                                        >
                                                                            <div className="flex items-center gap-2.5 min-w-0">
                                                                                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${col.theme.dot}`} />
                                                                                <div className="min-w-0">
                                                                                    <div className="text-[13px] font-medium text-stone-700 group-hover/pill:text-stone-900 truncate">
                                                                                        {entity.name}
                                                                                    </div>
                                                                                    {entity.sublabel && (
                                                                                        <div className="text-[10px] font-mono text-stone-400 truncate">
                                                                                            {entity.sublabel}
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                            <ArrowUpRight
                                                                                size={12}
                                                                                className={`shrink-0 text-stone-300 group-hover/pill:text-stone-700 transition-opacity ${
                                                                                    isAdmin && isEditMode ? 'opacity-0' : ''
                                                                                }`}
                                                                            />
                                                                        </Link>
                                                                        {isAdmin && isEditMode && (
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => handleRemoveLink(link.id)}
                                                                                disabled={busyLinkKey === link.id}
                                                                                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-full text-stone-400 hover:text-rose-500 hover:bg-rose-50 transition-colors"
                                                                                title="从此主题移除"
                                                                            >
                                                                                <X size={12} />
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                ))
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </motion.div>
                                    </AnimatePresence>
                                )}
                            </div>

                            {/* ===== 底部悬浮页码圆点 ===== */}
                            {topics.length > 1 && (
                                <div className="relative z-10 shrink-0 pt-4 flex items-center justify-center gap-2">
                                    {topics.map((t, idx) => (
                                        <button
                                            key={t.id}
                                            type="button"
                                            onClick={() => goToPage(idx)}
                                            title={t.name}
                                            className={`h-1.5 rounded-full transition-all duration-300 ${
                                                idx === activeIndex
                                                    ? 'w-6 bg-stone-700'
                                                    : 'w-1.5 bg-stone-300/80 hover:bg-stone-500'
                                            }`}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* 桌面端外侧悬浮右翻页 */}
                        <button
                            type="button"
                            onClick={() => goToPage(activeIndex + 1)}
                            disabled={topics.length <= 1}
                            className="hidden md:flex absolute -right-14 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-[#fbf9f5]/90 border border-white/80 text-stone-500 hover:text-stone-900 hover:bg-white shadow-[0_4px_16px_rgba(28,25,23,0.08)] items-center justify-center disabled:opacity-20 disabled:cursor-not-allowed transition-all backdrop-blur-md"
                            title="下一主题 (→)"
                        >
                            <ChevronRight size={18} strokeWidth={1.6} />
                        </button>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
