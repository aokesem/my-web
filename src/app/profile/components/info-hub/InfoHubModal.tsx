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
    FolderOpen,
    BellOff,
    ChevronDown,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { DEFAULT_FRIEND_CONTACT_SNOOZE_DAYS, useInfoHubData } from "./useInfoHubData";
import type {
    HubCapture,
    HubCategoryType,
    HubFolderReminder,
    HubQueuedBookmark,
    HubReminder,
} from "./types";
import { formatDeadlineCountdown, formatHubRowTime } from "./formatTime";
import { formatFolderReminderInterval } from "@/lib/infoItemReminder";
import { CATEGORY_CONFIG, type Category } from "../daily-protocol/types";

interface InfoHubModalProps {
    isOpen: boolean;
    onClose: () => void;
    onOpenCalendar?: () => void;
    onOpenProtocol?: () => void;
    isAdmin: boolean;
}

type CollapseKey = "reminders" | "tasks" | "longTerm";
type TaskGroupKey = "captures" | "folderReminders" | "queuedBookmarks";

function SectionBlock({
    title,
    count,
    isOpen,
    onToggle,
    children,
}: {
    title: string;
    count?: number;
    isOpen: boolean;
    onToggle: () => void;
    children: React.ReactNode;
}) {
    return (
        <section>
            <button
                type="button"
                onClick={onToggle}
                className="group mb-4 flex w-full items-center gap-3 rounded-lg -mx-2 px-2 py-1.5 text-left transition-colors hover:bg-white/45"
            >
                <ChevronDown
                    size={15}
                    className={`shrink-0 text-slate-400 transition-transform duration-200 ${isOpen ? "rotate-0" : "-rotate-90"}`}
                />
                <h2 className="text-sm font-bold text-slate-700 tracking-wide shrink-0">
                    {title}
                </h2>
                {typeof count === "number" && (
                    <span className="rounded-full border border-stone-200/80 bg-white/70 px-2 py-0.5 text-[10px] font-mono font-bold text-slate-400">
                        {count}
                    </span>
                )}
                <div className="flex-1 h-px bg-linear-to-r from-stone-300 via-stone-200 to-transparent transition-opacity group-hover:opacity-80" />
            </button>
            <AnimatePresence initial={false}>
                {isOpen && (
                    <motion.div
                        key="section-content"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2, ease: "easeInOut" }}
                        className="overflow-hidden"
                    >
                        {children}
                    </motion.div>
                )}
            </AnimatePresence>
        </section>
    );
}

function categoryTagStyles(type: HubCategoryType) {
    if (type === "study") {
        return "bg-blue-500/10 text-blue-600 border-blue-500/20";
    }
    return "bg-amber-500/10 text-amber-700 border-amber-500/20";
}

function folderReminderRowStyles(type: HubCategoryType) {
    if (type === "study") {
        return {
            row: "border-blue-200/70 bg-gradient-to-r from-blue-50/90 via-white/90 to-blue-50/30 shadow-[inset_3px_0_0_0_rgba(59,130,246,0.45)]",
            icon: "border-blue-200/60 bg-blue-100/70 text-blue-600",
            meta: "text-blue-700/80",
            action: "hover:text-blue-800 hover:bg-blue-50",
        };
    }
    return {
        row: "border-amber-200/70 bg-gradient-to-r from-amber-50/90 via-white/90 to-amber-50/30 shadow-[inset_3px_0_0_0_rgba(245,158,11,0.45)]",
        icon: "border-amber-200/60 bg-amber-100/70 text-amber-700",
        meta: "text-amber-800/80",
        action: "hover:text-amber-900 hover:bg-amber-50",
    };
}

function TaskGroupBlock({
    title,
    count,
    isOpen,
    onToggle,
    children,
}: {
    title: string;
    count: number;
    isOpen: boolean;
    onToggle: () => void;
    children: React.ReactNode;
}) {
    return (
        <div className="mt-4 first:mt-0">
            <button
                type="button"
                onClick={onToggle}
                className="group mb-2 flex w-full items-center gap-2 rounded-md px-1.5 py-1 text-left transition-colors hover:bg-white/55"
            >
                <ChevronDown
                    size={13}
                    className={`shrink-0 text-slate-400 transition-transform duration-200 ${isOpen ? "rotate-0" : "-rotate-90"}`}
                />
                <h3 className="text-[11px] font-bold text-slate-500 tracking-wide">
                    {title}
                </h3>
                <span className="rounded-full bg-stone-100/80 px-1.5 py-0.5 text-[9px] font-mono font-bold text-slate-400">
                    {count}
                </span>
                <div className="h-px flex-1 bg-stone-200/70 opacity-0 transition-opacity group-hover:opacity-100" />
            </button>
            <AnimatePresence initial={false}>
                {isOpen && (
                    <motion.div
                        key="task-group-content"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.18, ease: "easeInOut" }}
                        className="overflow-hidden"
                    >
                        {children}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
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
    onIgnoreFriendReminder,
    friendSnoozeDays,
    onFriendSnoozeDaysChange,
}: {
    reminder: HubReminder;
    onOpenCalendar?: () => void;
    onOpenProtocol?: () => void;
    onClose: () => void;
    onIgnoreFriendReminder?: (friendId: number) => void;
    friendSnoozeDays?: string;
    onFriendSnoozeDaysChange?: (value: string) => void;
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
                    className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${isUrgent
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
                            className={`text-[11px] font-mono font-bold tracking-wide px-2 py-0.5 rounded-md border ${isUrgent
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
                        className={`self-center text-[11px] font-mono shrink-0 px-2 py-1 rounded-md border transition-colors ${isUrgent
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
            {reminder.kind === "friend_contact" && reminder.friendId && onIgnoreFriendReminder && (
                <div className="flex shrink-0 items-center gap-1.5">
                    <input
                        type="number"
                        min="1"
                        step="1"
                        inputMode="numeric"
                        aria-label="推迟提醒天数"
                        value={friendSnoozeDays ?? `${DEFAULT_FRIEND_CONTACT_SNOOZE_DAYS}`}
                        onChange={(event) => onFriendSnoozeDaysChange?.(event.target.value)}
                        className="h-7 w-14 rounded-md border border-amber-200/70 bg-white/70 px-2 text-right text-[11px] font-mono text-amber-800 outline-none transition-colors focus:border-amber-300 focus:bg-white"
                    />
                    <button
                        type="button"
                        onClick={() => onIgnoreFriendReminder(reminder.friendId!)}
                        className="rounded-md border border-amber-200/70 px-2 py-1 text-[11px] font-mono text-amber-700/80 transition-colors hover:bg-amber-100/60 hover:text-amber-800"
                    >
                        天后提醒
                    </button>
                </div>
            )}
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
    isAdmin,
}: InfoHubModalProps) {
    const [mounted, setMounted] = useState(false);
    const [draftTitle, setDraftTitle] = useState("");
    const [draftType, setDraftType] = useState<HubCategoryType>("study");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingCaptureId, setEditingCaptureId] = useState<number | null>(null);
    const [editTitle, setEditTitle] = useState("");
    const [editType, setEditType] = useState<HubCategoryType>("study");
    const [archivingCaptureId, setArchivingCaptureId] = useState<number | null>(null);
    const [archiveParentItemId, setArchiveParentItemId] = useState("");
    const [expandedSections, setExpandedSections] = useState<Record<CollapseKey, boolean>>({
        reminders: true,
        tasks: true,
        longTerm: true,
    });
    const [expandedTaskGroups, setExpandedTaskGroups] = useState<Record<TaskGroupKey, boolean>>({
        captures: true,
        folderReminders: true,
        queuedBookmarks: true,
    });
    const [snoozeDayDrafts, setSnoozeDayDrafts] = useState<Record<number, string>>({});

    const hub = useInfoHubData(isOpen);

    const requireAdmin = () => {
        if (!isAdmin) {
            toast.warning("只有本人才能修改信息清单。");
            return false;
        }
        return true;
    };

    useEffect(() => setMounted(true), []);

    useEffect(() => {
        if (isOpen) document.body.style.overflow = "hidden";
        else document.body.style.overflow = "unset";
        return () => {
            document.body.style.overflow = "unset";
        };
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) {
            setEditingCaptureId(null);
            setArchivingCaptureId(null);
            setArchiveParentItemId("");
        }
    }, [isOpen]);

    const handleAdd = async () => {
        if (!requireAdmin()) return;
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

    const startArchive = (capture: HubCapture) => {
        if (!requireAdmin()) return;
        setArchivingCaptureId(capture.id);
        setArchiveParentItemId("");
    };

    const cancelArchive = () => {
        setArchivingCaptureId(null);
        setArchiveParentItemId("");
    };

    const confirmArchive = async (capture: HubCapture) => {
        if (!requireAdmin()) return;
        const folderLabel =
            archiveParentItemId === ""
                ? "未归入收藏夹"
                : hub.hubFolders.find((f) => f.id === parseInt(archiveParentItemId, 10))
                    ?.name ?? "所选收藏夹";
        if (
            !confirm(
                `归档「${capture.title}」至信息溯源？\n放入：${folderLabel}\n归档后将进入待看列表。`
            )
        ) {
            return;
        }
        const parentId =
            archiveParentItemId === ""
                ? null
                : parseInt(archiveParentItemId, 10);
        setIsSubmitting(true);
        try {
            await hub.archiveCapture(capture, parentId);
            cancelArchive();
            toast.success("已归档至信息溯源");
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : "归档失败";
            toast.error(msg);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: number, title: string) => {
        if (!requireAdmin()) return;
        if (!confirm(`删除「${title}」？此操作不可撤销。`)) return;
        try {
            await hub.deleteCapture(id);
        } catch {
            toast.error("删除失败");
        }
    };

    const handleUnqueue = async (bookmark: HubQueuedBookmark) => {
        if (!requireAdmin()) return;
        if (!confirm(`将「${bookmark.title}」移出待看？`)) return;
        try {
            await hub.unqueueBookmark(bookmark.id);
        } catch {
            toast.error("操作失败");
        }
    };

    const handleClearFolderReminder = async (folder: HubFolderReminder) => {
        if (!requireAdmin()) return;
        if (
            !confirm(
                `清除「${folder.name}」的回顾提醒？\n清除后将从今日重新计算周期。`
            )
        ) {
            return;
        }
        try {
            await hub.clearFolderReminder(folder.id);
            toast.success("已清除提醒");
        } catch {
            toast.error("操作失败");
        }
    };

    const handleIgnoreFriendReminder = async (friendId: number) => {
        if (!requireAdmin()) return;
        const rawValue = snoozeDayDrafts[friendId] ?? `${DEFAULT_FRIEND_CONTACT_SNOOZE_DAYS}`;
        const snoozeDays = Number.parseInt(rawValue, 10);
        if (!Number.isFinite(snoozeDays) || snoozeDays < 1) {
            toast.error("请输入大于 0 的天数");
            return;
        }

        try {
            await hub.dismissFriendReminder(friendId, snoozeDays);
            setSnoozeDayDrafts((prev: Record<number, string>) => {
                const next = { ...prev };
                delete next[friendId];
                return next;
            });
            toast.success(`已推迟 ${snoozeDays} 天`);
        } catch {
            toast.error("操作失败");
        }
    };

    const startEditingCapture = (capture: HubCapture) => {
        if (!requireAdmin()) return;
        cancelArchive();
        setEditingCaptureId(capture.id);
        setEditTitle(capture.title);
        setEditType(capture.category_type);
    };

    const cancelEditingCapture = () => {
        setEditingCaptureId(null);
    };

    const handleSaveCaptureEdit = async () => {
        if (!requireAdmin()) return;
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

    const toggleSection = (section: CollapseKey) => {
        setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
    };

    const toggleTaskGroup = (group: TaskGroupKey) => {
        setExpandedTaskGroups((prev) => ({ ...prev, [group]: !prev[group] }));
    };

    const taskTotalCount = hub.captures.length + hub.folderReminders.length + hub.queuedBookmarks.length;

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
                        className="relative w-full max-w-[880px] h-[min(760px,88vh)] bg-[#fdfbf7] rounded-xl shadow-2xl border border-stone-200/90 flex flex-col overflow-hidden ring-1 ring-white/60"
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
                                    <SectionBlock title="提醒" count={hub.reminders.length} isOpen={expandedSections.reminders} onToggle={() => toggleSection("reminders")}>
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
                                                        onIgnoreFriendReminder={handleIgnoreFriendReminder}
                                                        friendSnoozeDays={
                                                            r.friendId
                                                                ? snoozeDayDrafts[r.friendId] ?? `${DEFAULT_FRIEND_CONTACT_SNOOZE_DAYS}`
                                                                : undefined
                                                        }
                                                        onFriendSnoozeDaysChange={
                                                            r.friendId
                                                                ? (value: string) =>
                                                                    setSnoozeDayDrafts((prev: Record<number, string>) => ({
                                                                        ...prev,
                                                                        [r.friendId!]: value,
                                                                    }))
                                                                : undefined
                                                        }
                                                    />
                                                ))}
                                            </ul>
                                        )}
                                    </SectionBlock>

                                    <SectionBlock title="任务清单" count={taskTotalCount} isOpen={expandedSections.tasks} onToggle={() => toggleSection("tasks")}>
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
                                                className="w-18 px-2 py-2.5 rounded-lg border border-stone-200/90 bg-white text-[11px] font-mono text-slate-700 outline-none"
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
                                            hub.queuedBookmarks.length === 0 &&
                                            hub.folderReminders.length === 0 ? (
                                            <p className="text-sm text-slate-400 italic pl-0.5">
                                                暂无待处理项
                                            </p>
                                        ) : (
                                            <div>
                                                {hub.captures.length > 0 && (
                                                    <TaskGroupBlock title="未归档" count={hub.captures.length} isOpen={expandedTaskGroups.captures} onToggle={() => toggleTaskGroup("captures")}>
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
                                                                                    className="w-18 px-2 py-1.5 rounded-md border border-stone-200 bg-white text-[11px] font-mono text-slate-700 outline-none"
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
                                                                        ) : archivingCaptureId ===
                                                                            capture.id ? (
                                                                            <>
                                                                                <div className="flex-1 min-w-0 flex flex-col gap-2">
                                                                                    <span className="text-sm text-slate-800 truncate">
                                                                                        {capture.title}
                                                                                    </span>
                                                                                    <label className="text-[10px] font-bold text-slate-500">
                                                                                        放入收藏夹
                                                                                    </label>
                                                                                    <select
                                                                                        value={archiveParentItemId}
                                                                                        onChange={(e) =>
                                                                                            setArchiveParentItemId(
                                                                                                e.target.value
                                                                                            )
                                                                                        }
                                                                                        disabled={isSubmitting}
                                                                                        className="w-full px-2 py-1.5 rounded-md border border-stone-200 bg-white text-xs text-slate-800 outline-none focus:ring-2 focus:ring-slate-300/50"
                                                                                    >
                                                                                        <option value="">
                                                                                            未归入收藏夹
                                                                                        </option>
                                                                                        {hub.hubFolders
                                                                                            .filter(
                                                                                                (f) =>
                                                                                                    f.category_type ===
                                                                                                    capture.category_type
                                                                                            )
                                                                                            .map((f) => (
                                                                                                <option
                                                                                                    key={f.id}
                                                                                                    value={f.id}
                                                                                                >
                                                                                                    {f.name}
                                                                                                </option>
                                                                                            ))}
                                                                                    </select>
                                                                                </div>
                                                                                <CategoryTag
                                                                                    type={capture.category_type}
                                                                                />
                                                                                <button
                                                                                    type="button"
                                                                                    title="确认归档"
                                                                                    onClick={() =>
                                                                                        confirmArchive(capture)
                                                                                    }
                                                                                    disabled={isSubmitting}
                                                                                    className="p-1.5 rounded-md text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
                                                                                >
                                                                                    <Check size={14} />
                                                                                </button>
                                                                                <button
                                                                                    type="button"
                                                                                    title="取消"
                                                                                    onClick={cancelArchive}
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
                                                                                        startArchive(capture)
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
                                                    </TaskGroupBlock>
                                                )}

                                                {hub.folderReminders.length > 0 && (
                                                    <TaskGroupBlock title="收藏夹提醒" count={hub.folderReminders.length} isOpen={expandedTaskGroups.folderReminders} onToggle={() => toggleTaskGroup("folderReminders")}>
                                                        <ul className="space-y-2">
                                                            {hub.folderReminders.map((folder) => {
                                                                const styles =
                                                                    folderReminderRowStyles(
                                                                        folder.category_type
                                                                    );
                                                                return (
                                                                    <li
                                                                        key={`f-${folder.id}`}
                                                                        className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 ${styles.row}`}
                                                                    >
                                                                        <div
                                                                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${styles.icon}`}
                                                                        >
                                                                            <FolderOpen size={15} />
                                                                        </div>
                                                                        <span className="flex-1 min-w-0">
                                                                            <span className="block text-sm font-semibold text-slate-800 truncate">
                                                                                {folder.name}
                                                                            </span>
                                                                            <span
                                                                                className={`text-[10px] font-mono mt-0.5 block ${styles.meta}`}
                                                                            >
                                                                                {formatFolderReminderInterval(
                                                                                    folder.reminder_interval_days
                                                                                )}{" "}
                                                                                · 回顾
                                                                            </span>
                                                                        </span>
                                                                        <CategoryTag type={folder.category_type} />
                                                                        <Link
                                                                            href={`/library/info-source/${folder.category_type}`}
                                                                            onClick={onClose}
                                                                            className={`p-1.5 rounded-md text-slate-500 transition-colors ${styles.action}`}
                                                                            title="打开信息溯源"
                                                                        >
                                                                            <ExternalLink size={14} />
                                                                        </Link>
                                                                        <button
                                                                            type="button"
                                                                            title="清除提醒"
                                                                            onClick={() =>
                                                                                handleClearFolderReminder(folder)
                                                                            }
                                                                            className={`p-1.5 rounded-md text-slate-500 transition-colors ${styles.action}`}
                                                                        >
                                                                            <BellOff size={14} />
                                                                        </button>
                                                                    </li>
                                                                );
                                                            })}
                                                        </ul>
                                                    </TaskGroupBlock>
                                                )}

                                                {hub.queuedBookmarks.length > 0 && (
                                                    <TaskGroupBlock title="待看条目" count={hub.queuedBookmarks.length} isOpen={expandedTaskGroups.queuedBookmarks} onToggle={() => toggleTaskGroup("queuedBookmarks")}>
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
                                                                        <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                                                                            来自 · {bookmark.hub_name ?? "未归入收藏夹"}
                                                                        </span>
                                                                        <span className="text-[10px] text-slate-400/80 font-mono">
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
                                                    </TaskGroupBlock>
                                                )}
                                            </div>
                                        )}
                                    </SectionBlock>

                                    <SectionBlock title="长期计划" count={hub.longTermTasks.length} isOpen={expandedSections.longTerm} onToggle={() => toggleSection("longTerm")}>
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
                                                            className={`flex items-center gap-3 rounded-lg border border-stone-200/60 px-3 py-2.5 text-sm shadow-sm ${catConfig?.bgLight ?? "bg-white/60"
                                                                }`}
                                                        >
                                                            <div
                                                                className={`w-1 self-stretch min-h-9 rounded-full shrink-0 ${catConfig?.indicator ?? "bg-slate-300"
                                                                    }`}
                                                                aria-hidden
                                                            />
                                                            <span className="flex-1 min-w-0">
                                                                <span className="block text-slate-800 truncate">
                                                                    {t.title}
                                                                </span>
                                                                <span
                                                                    className={`inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-wide mt-0.5 ${catConfig?.color ?? "text-slate-400"
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
