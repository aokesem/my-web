"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
    X,
    Plus,
    Loader2,
    Archive,
    Trash2,
    ExternalLink,
    BookmarkMinus,
    AlertCircle,
    Info,
    Pencil,
    Check,
    Clock,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { useInfoHubData } from "./useInfoHubData";
import type {
    HubCapture,
    HubCategoryType,
    HubQueuedBookmark,
    HubReminder,
} from "./types";
import { formatDeadlineCountdown, formatHubRowTime } from "./formatTime";
import { CATEGORY_CONFIG, type Category } from "../daily-protocol/types";

interface InfoHubModalProps {
    isOpen: boolean;
    onClose: () => void;
    onOpenCalendar?: () => void;
    onOpenProtocol?: () => void;
}

function SectionBlock({
    title,
    children,
}: {
    title: string;
    children: React.ReactNode;
}) {
    return (
        <section>
            <div className="flex items-center gap-3 mb-4">
                <h2 className="text-sm font-bold text-slate-700 tracking-wide shrink-0">
                    {title}
                </h2>
                <div className="flex-1 h-px bg-gradient-to-r from-stone-300 via-stone-200 to-transparent" />
            </div>
            {children}
        </section>
    );
}

function categoryTagStyles(type: HubCategoryType) {
    if (type === "study") {
        return "bg-blue-500/10 text-blue-600 border-blue-500/20";
    }
    return "bg-amber-500/10 text-amber-700 border-amber-500/20";
}

function TaskSubheading({ title }: { title: string }) {
    return (
        <h3 className="text-[11px] font-bold text-slate-500 tracking-wide mb-2 mt-4 first:mt-0">
            {title}
        </h3>
    );
}

function CategoryTag({ type }: { type: HubCategoryType }) {
    return (
        <span
            className={`text-[10px] font-mono uppercase shrink-0 px-1.5 py-0.5 rounded border ${categoryTagStyles(type)}`}
        >
            {type}
        </span>
    );
}

function taskCategoryConfig(category: string) {
    if (category in CATEGORY_CONFIG) {
        return CATEGORY_CONFIG[category as Category];
    }
    return null;
}

function reminderStyles(tone: HubReminder["tone"]) {
    if (tone === "warn") {
        return "text-amber-900/90 bg-amber-50/90 border-amber-200/70";
    }
    return "text-slate-700 bg-slate-50/90 border-slate-200/70";
}

function deadlineReminderStyles(tone: HubReminder["tone"]) {
    if (tone === "warn") {
        return "border-rose-300/80 bg-gradient-to-r from-rose-50/95 via-white/90 to-rose-50/40 shadow-[inset_3px_0_0_0_rgba(244,63,94,0.55)]";
    }
    return "border-violet-200/70 bg-gradient-to-r from-violet-50/80 via-white/90 to-violet-50/30 shadow-[inset_3px_0_0_0_rgba(139,92,246,0.45)]";
}

function ReminderRow({
    reminder,
    onOpenCalendar,
    onOpenProtocol,
    onClose,
}: {
    reminder: HubReminder;
    onOpenCalendar?: () => void;
    onOpenProtocol?: () => void;
    onClose: () => void;
}) {
    const handleCalendar = () => {
        onClose();
        onOpenCalendar?.();
    };

    const handleProtocol = () => {
        onClose();
        onOpenProtocol?.();
    };

    if (reminder.kind === "deadline" && reminder.deadlineTitle) {
        const dateLabel = reminder.deadlineDate?.replace(/-/g, ".") ?? "";
        const isUrgent = reminder.tone === "warn";

        return (
            <li
                className={`flex items-stretch gap-3 rounded-lg border px-3 py-3 text-sm ${deadlineReminderStyles(reminder.tone)}`}
            >
                <div
                    className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${
                        isUrgent
                            ? "border-rose-200/80 bg-rose-100/80 text-rose-600"
                            : "border-violet-200/70 bg-violet-100/70 text-violet-600"
                    }`}
                    aria-hidden
                >
                    <Clock size={15} strokeWidth={2.25} />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-800 leading-snug truncate">
                        {reminder.deadlineTitle}
                    </p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-2">
                        <span
                            className={`text-[11px] font-mono font-bold tracking-wide px-2 py-0.5 rounded-md border ${
                                isUrgent
                                    ? "text-rose-700 bg-rose-100/60 border-rose-200/60"
                                    : "text-violet-700 bg-violet-100/50 border-violet-200/50"
                            }`}
                        >
                            {reminder.deadlineWhen}
                        </span>
                        <span className="text-[11px] font-mono text-slate-500 tracking-tight">
                            {dateLabel}
                        </span>
                    </div>
                </div>
                {onOpenCalendar && (
                    <button
                        type="button"
                        onClick={handleCalendar}
                        className={`self-center text-[11px] font-mono shrink-0 px-2 py-1 rounded-md border transition-colors ${
                            isUrgent
                                ? "text-rose-600/80 border-rose-200/50 hover:bg-rose-100/60 hover:text-rose-700"
                                : "text-violet-600/80 border-violet-200/50 hover:bg-violet-100/50 hover:text-violet-700"
                        }`}
                    >
                        日历
                    </button>
                )}
            </li>
        );
    }

    const Icon = reminder.tone === "warn" ? AlertCircle : Info;

    return (
        <li
            className={`flex items-start gap-2 text-sm border rounded-lg px-3 py-2.5 ${reminderStyles(reminder.tone)}`}
        >
            <Icon size={16} className="shrink-0 mt-0.5 opacity-80" />
            <span className="flex-1 leading-snug">{reminder.message}</span>
            {reminder.action && (reminder.action === "calendar" ? onOpenCalendar : onOpenProtocol) && (
                <button
                    type="button"
                    onClick={reminder.action === "calendar" ? handleCalendar : handleProtocol}
                    className="text-[11px] font-mono opacity-70 hover:opacity-100 hover:underline shrink-0"
                >
                    {reminder.action === "calendar" ? "日历" : "Protocol"}
                </button>
            )}
        </li>
    );
}

export default function InfoHubModal({
    isOpen,
    onClose,
    onOpenCalendar,
    onOpenProtocol,
}: InfoHubModalProps) {
    const [mounted, setMounted] = useState(false);
    const [draftTitle, setDraftTitle] = useState("");
    const [draftType, setDraftType] = useState<HubCategoryType>("study");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingCaptureId, setEditingCaptureId] = useState<number | null>(null);
    const [editTitle, setEditTitle] = useState("");
    const [editType, setEditType] = useState<HubCategoryType>("study");

    const hub = useInfoHubData(isOpen);

    useEffect(() => setMounted(true), []);

    useEffect(() => {
        if (isOpen) document.body.style.overflow = "hidden";
        else document.body.style.overflow = "unset";
        return () => {
            document.body.style.overflow = "unset";
        };
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) setEditingCaptureId(null);
    }, [isOpen]);

    const handleAdd = async () => {
        const title = draftTitle.trim();
        if (!title) return;
        setIsSubmitting(true);
        try {
            await hub.addCapture(title, draftType);
            setDraftTitle("");
            toast.success("已记入清单");
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : "保存失败";
            toast.error(msg);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleArchive = async (capture: HubCapture) => {
        if (!confirm(`归档「${capture.title}」至信息溯源？归档后将进入待看列表。`)) return;
        setIsSubmitting(true);
        try {
            await hub.archiveCapture(capture);
            toast.success("已归档至信息溯源");
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : "归档失败";
            toast.error(msg);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: number, title: string) => {
        if (!confirm(`删除「${title}」？此操作不可撤销。`)) return;
        try {
            await hub.deleteCapture(id);
        } catch {
            toast.error("删除失败");
        }
    };

    const handleUnqueue = async (bookmark: HubQueuedBookmark) => {
        if (!confirm(`将「${bookmark.title}」移出待看？`)) return;
        try {
            await hub.unqueueBookmark(bookmark.id);
        } catch {
            toast.error("操作失败");
        }
    };

    const startEditingCapture = (capture: HubCapture) => {
        setEditingCaptureId(capture.id);
        setEditTitle(capture.title);
        setEditType(capture.category_type);
    };

    const cancelEditingCapture = () => {
        setEditingCaptureId(null);
    };

    const handleSaveCaptureEdit = async () => {
        const title = editTitle.trim();
        if (!title || editingCaptureId == null) return;
        setIsSubmitting(true);
        try {
            await hub.updateCapture(editingCaptureId, {
                title,
                category_type: editType,
            });
            setEditingCaptureId(null);
            toast.success("已更新");
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : "保存失败";
            toast.error(msg);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!mounted) return null;

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-100 flex items-center justify-center p-4 md:p-8 pointer-events-auto">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/35 backdrop-blur-sm"
                        onClick={onClose}
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.96, y: 12 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.98, y: 8 }}
                        transition={{ type: "spring", damping: 28, stiffness: 360 }}
                        className="relative w-full max-w-2xl max-h-[88vh] bg-[#fdfbf7] rounded-xl shadow-2xl border border-stone-200/90 flex flex-col overflow-hidden ring-1 ring-white/60"
                        style={{
                            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.7' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E")`,
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <header className="shrink-0 px-6 py-4 border-b border-stone-200/80 flex items-center justify-between bg-white/30">
                            <div>
                                <h1 className="text-xl font-serif font-bold text-slate-800 tracking-tight">
                                    信息清单
                                </h1>
                                <p className="text-[10px] font-mono text-slate-500 mt-1 tracking-wider">
                                    INFO HUB
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={onClose}
                                className="p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-black/5 transition-colors"
                            >
                                <X size={22} />
                            </button>
                        </header>

                        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-10 subtle-scrollbar">
                            {hub.isLoading ? (
                                <div className="flex justify-center py-20 text-slate-400">
                                    <Loader2 className="animate-spin" size={28} />
                                </div>
                            ) : (
                                <>
                                    <SectionBlock title="提醒">
                                        {hub.reminders.length === 0 ? (
                                            <p className="text-sm text-slate-400 italic pl-0.5">
                                                暂无提醒
                                            </p>
                                        ) : (
                                            <ul className="space-y-2">
                                                {hub.reminders.map((r) => (
                                                    <ReminderRow
                                                        key={r.id}
                                                        reminder={r}
                                                        onClose={onClose}
                                                        onOpenCalendar={onOpenCalendar}
                                                        onOpenProtocol={onOpenProtocol}
                                                    />
                                                ))}
                                            </ul>
                                        )}
                                    </SectionBlock>

                                    <SectionBlock title="任务清单">
                                        <div className="flex gap-2 mb-4">
                                            <input
                                                type="text"
                                                value={draftTitle}
                                                onChange={(e) => setDraftTitle(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === "Enter") handleAdd();
                                                }}
                                                placeholder="快速记录…"
                                                className="flex-1 px-3 py-2.5 rounded-lg border border-stone-200/90 bg-white text-slate-800 placeholder:text-slate-400 text-sm outline-none focus:ring-2 focus:ring-slate-300/50 shadow-sm"
                                                disabled={isSubmitting}
                                                autoFocus
                                            />
                                            <select
                                                value={draftType}
                                                onChange={(e) =>
                                                    setDraftType(e.target.value as HubCategoryType)
                                                }
                                                className="w-[4.5rem] px-2 py-2.5 rounded-lg border border-stone-200/90 bg-white text-[11px] font-mono text-slate-700 outline-none"
                                                title="归档目标 Nexus"
                                            >
                                                <option value="study">study</option>
                                                <option value="life">life</option>
                                            </select>
                                            <button
                                                type="button"
                                                onClick={handleAdd}
                                                disabled={isSubmitting || !draftTitle.trim()}
                                                className="px-3.5 py-2.5 rounded-lg bg-slate-800 text-white text-sm font-bold hover:bg-slate-700 disabled:opacity-40 shadow-sm transition-colors"
                                            >
                                                {isSubmitting ? (
                                                    <Loader2 size={16} className="animate-spin" />
                                                ) : (
                                                    <Plus size={16} />
                                                )}
                                            </button>
                                        </div>

                                        {hub.captures.length === 0 &&
                                        hub.queuedBookmarks.length === 0 ? (
                                            <p className="text-sm text-slate-400 italic pl-0.5">
                                                暂无待处理项
                                            </p>
                                        ) : (
                                            <div>
                                                {hub.captures.length > 0 && (
                                                    <>
                                                        <TaskSubheading title="未归档" />
                                                        <ul className="space-y-2">
                                                        {hub.captures.map((capture) => {
                                                            const isEditing =
                                                                editingCaptureId === capture.id;
                                                            return (
                                                            <li
                                                                key={`c-${capture.id}`}
                                                                className="group flex items-center gap-2 rounded-lg bg-white/80 px-3 py-2.5"
                                                            >
                                                                {isEditing ? (
                                                                    <>
                                                                        <input
                                                                            type="text"
                                                                            value={editTitle}
                                                                            onChange={(e) =>
                                                                                setEditTitle(
                                                                                    e.target.value
                                                                                )
                                                                            }
                                                                            onKeyDown={(e) => {
                                                                                if (e.key === "Enter")
                                                                                    handleSaveCaptureEdit();
                                                                                if (e.key === "Escape")
                                                                                    cancelEditingCapture();
                                                                            }}
                                                                            className="flex-1 min-w-0 px-2 py-1.5 rounded-md border border-stone-200 bg-white text-sm text-slate-800 outline-none focus:ring-2 focus:ring-slate-300/50"
                                                                            disabled={isSubmitting}
                                                                            autoFocus
                                                                        />
                                                                        <select
                                                                            value={editType}
                                                                            onChange={(e) =>
                                                                                setEditType(
                                                                                    e.target
                                                                                        .value as HubCategoryType
                                                                                )
                                                                            }
                                                                            className="w-[4.5rem] px-2 py-1.5 rounded-md border border-stone-200 bg-white text-[11px] font-mono text-slate-700 outline-none"
                                                                            disabled={isSubmitting}
                                                                        >
                                                                            <option value="study">
                                                                                study
                                                                            </option>
                                                                            <option value="life">
                                                                                life
                                                                            </option>
                                                                        </select>
                                                                        <button
                                                                            type="button"
                                                                            title="保存"
                                                                            onClick={handleSaveCaptureEdit}
                                                                            disabled={
                                                                                isSubmitting ||
                                                                                !editTitle.trim()
                                                                            }
                                                                            className="p-1.5 rounded-md text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 transition-colors disabled:opacity-40"
                                                                        >
                                                                            <Check size={14} />
                                                                        </button>
                                                                        <button
                                                                            type="button"
                                                                            title="取消"
                                                                            onClick={cancelEditingCapture}
                                                                            disabled={isSubmitting}
                                                                            className="p-1.5 rounded-md text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                                                                        >
                                                                            <X size={14} />
                                                                        </button>
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <span className="flex-1 min-w-0">
                                                                            <span className="block text-sm text-slate-800 truncate">
                                                                                {capture.title}
                                                                            </span>
                                                                            <span className="text-[10px] text-slate-400 font-mono">
                                                                                {formatHubRowTime(
                                                                                    capture.created_at
                                                                                )}
                                                                            </span>
                                                                        </span>
                                                                        <CategoryTag
                                                                            type={
                                                                                capture.category_type
                                                                            }
                                                                        />
                                                                        <button
                                                                            type="button"
                                                                            title="编辑"
                                                                            onClick={() =>
                                                                                startEditingCapture(
                                                                                    capture
                                                                                )
                                                                            }
                                                                            disabled={isSubmitting}
                                                                            className="p-1.5 rounded-md text-slate-500 hover:text-slate-800 hover:bg-white/80 transition-colors"
                                                                        >
                                                                            <Pencil size={14} />
                                                                        </button>
                                                                        <button
                                                                            type="button"
                                                                            title="归档至信息溯源"
                                                                            onClick={() =>
                                                                                handleArchive(capture)
                                                                            }
                                                                            disabled={isSubmitting}
                                                                            className="p-1.5 rounded-md text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
                                                                        >
                                                                            <Archive size={14} />
                                                                        </button>
                                                                        <button
                                                                            type="button"
                                                                            title="删除"
                                                                            onClick={() =>
                                                                                handleDelete(
                                                                                    capture.id,
                                                                                    capture.title
                                                                                )
                                                                            }
                                                                            className="p-1.5 rounded-md text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                                                                        >
                                                                            <Trash2 size={14} />
                                                                        </button>
                                                                    </>
                                                                )}
                                                            </li>
                                                            );
                                                        })}
                                                        </ul>
                                                    </>
                                                )}

                                                {hub.queuedBookmarks.length > 0 && (
                                                    <>
                                                        <TaskSubheading title="待看" />
                                                        <ul className="space-y-2">
                                                        {hub.queuedBookmarks.map((bookmark) => (
                                                            <li
                                                                key={`b-${bookmark.id}`}
                                                                className="group flex items-center gap-2 rounded-lg bg-white/80 px-3 py-2.5"
                                                            >
                                                                <span className="flex-1 min-w-0">
                                                                    <span className="block text-sm text-slate-800 truncate">
                                                                        {bookmark.title}
                                                                    </span>
                                                                    <span className="text-[10px] text-slate-400 font-mono">
                                                                        {formatHubRowTime(
                                                                            bookmark.created_at
                                                                        )}
                                                                    </span>
                                                                </span>
                                                                <CategoryTag
                                                                    type={bookmark.category_type}
                                                                />
                                                                <Link
                                                                    href={`/library/info-source/${bookmark.category_type}`}
                                                                    onClick={onClose}
                                                                    className="p-1.5 rounded-md text-slate-500 hover:text-slate-800 hover:bg-white/80 transition-colors"
                                                                    title="打开信息溯源"
                                                                >
                                                                    <ExternalLink size={14} />
                                                                </Link>
                                                                <button
                                                                    type="button"
                                                                    title="移出待看"
                                                                    onClick={() =>
                                                                        handleUnqueue(bookmark)
                                                                    }
                                                                    className="p-1.5 rounded-md text-slate-500 hover:text-slate-700 hover:bg-white/80 transition-colors"
                                                                >
                                                                    <BookmarkMinus size={14} />
                                                                </button>
                                                            </li>
                                                        ))}
                                                        </ul>
                                                    </>
                                                )}
                                            </div>
                                        )}
                                    </SectionBlock>

                                    <SectionBlock title="长期计划">
                                        {hub.longTermTasks.length === 0 ? (
                                            <p className="text-sm text-slate-400 italic pl-0.5">
                                                暂无进行中的长期任务（需带 deadline）
                                            </p>
                                        ) : (
                                            <ul className="space-y-2">
                                                {hub.longTermTasks.map((t) => {
                                                    const catConfig = taskCategoryConfig(t.category);
                                                    return (
                                                    <li
                                                        key={t.id}
                                                        className={`flex items-center gap-3 rounded-lg border border-stone-200/60 px-3 py-2.5 text-sm shadow-sm ${
                                                            catConfig?.bgLight ?? "bg-white/60"
                                                        }`}
                                                    >
                                                        <div
                                                            className={`w-1 self-stretch min-h-[2.25rem] rounded-full shrink-0 ${
                                                                catConfig?.indicator ?? "bg-slate-300"
                                                            }`}
                                                            aria-hidden
                                                        />
                                                        <span className="flex-1 min-w-0">
                                                            <span className="block text-slate-800 truncate">
                                                                {t.title}
                                                            </span>
                                                            <span
                                                                className={`inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-wide mt-0.5 ${
                                                                    catConfig?.color ?? "text-slate-400"
                                                                }`}
                                                            >
                                                                {catConfig?.label ?? t.category}
                                                            </span>
                                                        </span>
                                                        <span className="text-[11px] font-mono text-slate-500 shrink-0 text-right">
                                                            <span className="block">
                                                                {t.deadline.replace(/-/g, ".")}
                                                            </span>
                                                            <span className="text-[10px] text-amber-700/80">
                                                                {formatDeadlineCountdown(t.deadline)}
                                                            </span>
                                                        </span>
                                                        {onOpenProtocol && (
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    onClose();
                                                                    onOpenProtocol();
                                                                }}
                                                                className="text-[11px] font-mono text-slate-500 hover:text-slate-800 shrink-0"
                                                            >
                                                                →
                                                            </button>
                                                        )}
                                                    </li>
                                                    );
                                                })}
                                            </ul>
                                        )}
                                    </SectionBlock>
                                </>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
}
