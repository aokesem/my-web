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
    BookmarkMinus,
    Pencil,
    Check,
    Bell,
    ClipboardList,
    Milestone,
    Clock,
    Activity,
    Palette,
    ExternalLink,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { supabase } from "@/lib/supabaseClient";
import type { InfoBookmark } from "@/app/library/info-source/types";
import { DEFAULT_FRIEND_CONTACT_SNOOZE_DAYS, useInfoHubData } from "./useInfoHubData";
import type {
    HubCapture,
    HubCategoryType,
    HubFolderReminder,
    HubQueuedBookmark,
    HubReminder,
    HubRhythmCategory,
} from "./types";
import { formatDeadlineCountdown, formatHubRowTime } from "./formatTime";
import { getHubDayKey } from "./hubDay";

// 导入提取出的子组件
import { SectionBlock, TaskGroupBlock, CategoryTag, taskCategoryConfig } from "./components/BaseBlocks";
import { CollapsibleReminderGroup } from "./components/CollapsibleReminderGroup";
import { FolderReminderGroup } from "./components/FolderReminderRow";
import { ReminderRow } from "./components/ReminderRow";

interface InfoHubModalProps {
    isOpen: boolean;
    onClose: () => void;
    onOpenCalendar?: () => void;
    onOpenProtocol?: () => void;
    isAdmin: boolean;
}

type CollapseKey = "reminders" | "tasks" | "longTerm";
type TaskGroupKey = "captures" | "folderReminders" | "queuedBookmarks";

type RhythmDraft = { eventName: string; eventDate: string };

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
    const [lastContactDates, setLastContactDates] = useState<Record<number, string>>({});
    const [updatingLastContactId, setUpdatingLastContactId] = useState<number | null>(null);
    const [rhythmDrafts, setRhythmDrafts] = useState<Partial<Record<HubRhythmCategory, RhythmDraft>>>({});
    const [updatingRhythmCategory, setUpdatingRhythmCategory] = useState<HubRhythmCategory | null>(null);

    const [folderBookmarks, setFolderBookmarks] = useState<Record<number, InfoBookmark[]>>({});
    const [loadingFolders, setLoadingFolders] = useState<Record<number, boolean>>({});

    const fetchFolderBookmarks = async (folderId: number) => {
        if (folderBookmarks[folderId]) return;
        setLoadingFolders((prev) => ({ ...prev, [folderId]: true }));
        try {
            const { data, error } = await supabase
                .from("info_bookmarks")
                .select("*")
                .eq("parent_item_id", folderId)
                .order("created_at", { ascending: false });
            if (error) throw error;
            setFolderBookmarks((prev) => ({ ...prev, [folderId]: data || [] }));
        } catch (error: any) {
            toast.error("拉取收藏夹条目失败：" + error.message);
        } finally {
            setLoadingFolders((prev) => ({ ...prev, [folderId]: false }));
        }
    };

    const hub = useInfoHubData(isOpen);

    const requireAdmin = () => {
        if (!isAdmin) {
            toast.warning("只有本人才能修改信息清单。");
            return false;
        }
        return true;
    };

    const scrollToId = (id: string) => {
        const el = document.getElementById(id);
        if (el) {
            el.scrollIntoView({ behavior: "smooth", block: "start" });
        }
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

    const handleUpdateFriendLastContact = async (friendId: number) => {
        if (!requireAdmin()) return;
        const date = lastContactDates[friendId];
        if (!date) return;

        try {
            setUpdatingLastContactId(friendId);
            await hub.updateFriendLastContact(friendId, date);
            setLastContactDates((prev: Record<number, string>) => {
                const next = { ...prev };
                delete next[friendId];
                return next;
            });
            toast.success("已更新联系日期");
        } catch {
            toast.error("操作失败");
        } finally {
            setUpdatingLastContactId(null);
        }
    };

    const handleUpdateRhythmReminder = async (category: HubRhythmCategory) => {
        if (!requireAdmin()) return;
        const draft = rhythmDrafts[category] ?? { eventName: "", eventDate: getHubDayKey() };
        const eventName = draft.eventName.trim();
        if (!eventName) {
            toast.error("请输入事件名称");
            return;
        }
        if (!draft.eventDate) {
            toast.error("请选择日期");
            return;
        }

        try {
            setUpdatingRhythmCategory(category);
            await hub.updateRhythmReminder(category, eventName, draft.eventDate);
            setRhythmDrafts((prev) => {
                const next = { ...prev };
                delete next[category];
                return next;
            });
            toast.success("已记录节奏事件");
        } catch {
            toast.error("操作失败");
        } finally {
            setUpdatingRhythmCategory(null);
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

    const deadlineReminders = hub.reminders.filter((r) => r.kind === "deadline");
    const friendReminders = hub.reminders.filter((r) => r.kind === "friend_contact");
    const rhythmReminders = hub.reminders.filter((r) => r.kind === "rhythm");
    const defaultReminders = hub.reminders.filter((r) => r.kind === "default" || !r.kind);

    const reminderTotalCount = hub.reminders.length + hub.folderReminders.length;
    const taskTotalCount = hub.captures.length + hub.queuedBookmarks.length;

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
                        className="relative w-full max-w-[1080px] h-[min(760px,88vh)] bg-[#fdfbf7] rounded-xl shadow-2xl border border-stone-200/90 flex flex-col overflow-hidden ring-1 ring-white/60"
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

                        <div className="flex-1 flex overflow-hidden">
                            <nav className="w-56 border-r border-stone-200/80 bg-stone-50/40 p-4 flex flex-col justify-between overflow-y-auto subtle-scrollbar shrink-0 select-none">
                                <div className="space-y-6 text-slate-800">
                                    {/* 提醒大项 */}
                                    <div className="space-y-1.5">
                                        <div
                                            onClick={() => scrollToId("sec-reminders")}
                                            className="flex items-center gap-2 font-serif font-bold text-sm text-stone-700 hover:text-stone-900 cursor-pointer p-1.5 rounded-lg hover:bg-stone-200/30 transition-colors"
                                        >
                                            <Bell size={14} className="text-stone-500 shrink-0" />
                                            <span>提醒</span>
                                        </div>
                                        <ul className="pl-6 space-y-1 text-xs text-stone-500 border-l border-stone-200/80 ml-3">
                                            <li
                                                onClick={() => scrollToId("sub-folders")}
                                                className="hover:text-stone-850 cursor-pointer py-1 px-1.5 rounded-md hover:bg-stone-200/20 transition-colors flex items-center justify-between"
                                            >
                                                <span>收藏夹提醒</span>
                                                {hub.folderReminders.length > 0 && (
                                                    <span className="text-[10px] font-mono font-bold text-amber-600 bg-amber-50 px-1.5 py-0.2 rounded-full border border-amber-200/60">
                                                        {hub.folderReminders.length}
                                                    </span>
                                                )}
                                            </li>
                                            <li
                                                onClick={() => scrollToId("sub-deadline-reminders")}
                                                className="hover:text-stone-850 cursor-pointer py-1 px-1.5 rounded-md hover:bg-stone-200/20 transition-colors flex items-center justify-between"
                                            >
                                                <span>截止事项提醒</span>
                                                {deadlineReminders.length > 0 && (
                                                    <span className="text-[10px] font-mono font-bold text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded-full border border-amber-200/50">
                                                        {deadlineReminders.length}
                                                    </span>
                                                )}
                                            </li>
                                            <li
                                                onClick={() => scrollToId("sub-friend-reminders")}
                                                className="hover:text-stone-850 cursor-pointer py-1 px-1.5 rounded-md hover:bg-stone-200/20 transition-colors flex items-center justify-between"
                                            >
                                                <span>朋友联系提醒</span>
                                                {friendReminders.length > 0 && (
                                                    <span className="text-[10px] font-mono font-bold text-rose-700 bg-rose-50 px-1.5 py-0.2 rounded-full border border-rose-200/50">
                                                        {friendReminders.length}
                                                    </span>
                                                )}
                                            </li>
                                            <li
                                                onClick={() => scrollToId("sub-activity-reminders")}
                                                className="hover:text-stone-850 cursor-pointer py-1 px-1.5 rounded-md hover:bg-stone-200/20 transition-colors flex items-center justify-between"
                                            >
                                                <span>活动提醒</span>
                                                {rhythmReminders.length > 0 && (
                                                    <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded-full border border-emerald-200/50">
                                                        {rhythmReminders.length}
                                                    </span>
                                                )}
                                            </li>
                                        </ul>
                                    </div>

                                    {/* 任务清单大项 */}
                                    <div className="space-y-1.5">
                                        <div
                                            onClick={() => scrollToId("sec-tasks")}
                                            className="flex items-center gap-2 font-serif font-bold text-sm text-stone-700 hover:text-stone-900 cursor-pointer p-1.5 rounded-lg hover:bg-stone-200/30 transition-colors"
                                        >
                                            <ClipboardList size={14} className="text-stone-500 shrink-0" />
                                            <span>任务清单</span>
                                        </div>
                                        <ul className="pl-6 space-y-1 text-xs text-stone-500 border-l border-stone-200/80 ml-3">
                                            <li
                                                onClick={() => scrollToId("sub-captures")}
                                                className="hover:text-stone-850 cursor-pointer py-1 px-1.5 rounded-md hover:bg-stone-200/20 transition-colors flex items-center justify-between"
                                            >
                                                <span>收集箱</span>
                                                {hub.captures.length > 0 && (
                                                    <span className="text-[10px] font-mono font-bold text-stone-500 bg-stone-100/80 px-1.5 py-0.2 rounded-full border border-stone-200/40">
                                                        {hub.captures.length}
                                                    </span>
                                                )}
                                            </li>
                                            <li
                                                onClick={() => scrollToId("sub-queued")}
                                                className="hover:text-stone-850 cursor-pointer py-1 px-1.5 rounded-md hover:bg-stone-200/20 transition-colors flex items-center justify-between"
                                            >
                                                <span>待看条目</span>
                                                {hub.queuedBookmarks.length > 0 && (
                                                    <span className="text-[10px] font-mono font-bold text-stone-500 bg-stone-100/80 px-1.5 py-0.2 rounded-full border border-stone-200/40">
                                                        {hub.queuedBookmarks.length}
                                                    </span>
                                                )}
                                            </li>
                                        </ul>
                                    </div>

                                    {/* 长期计划大项 */}
                                    <div className="space-y-1.5">
                                        <div
                                            onClick={() => scrollToId("sec-longterm")}
                                            className="flex items-center gap-2 font-serif font-bold text-sm text-stone-700 hover:text-stone-900 cursor-pointer p-1.5 rounded-lg hover:bg-stone-200/30 transition-colors"
                                        >
                                            <Milestone size={14} className="text-stone-500 shrink-0" />
                                            <span>长期计划</span>
                                        </div>
                                        {hub.longTermTasks.length > 0 && (
                                            <ul className="pl-6 space-y-1 text-xs text-stone-500 border-l border-stone-200/80 ml-3 max-w-[200px] overflow-hidden">
                                                {hub.longTermTasks.map((t) => (
                                                    <li
                                                        key={`nav-lt-${t.id}`}
                                                        onClick={() => scrollToId(`sub-longterm-${t.id}`)}
                                                        className="hover:text-stone-850 cursor-pointer py-1 px-1.5 rounded-md hover:bg-stone-200/20 transition-colors flex items-center justify-between truncate"
                                                        title={t.title}
                                                    >
                                                        <span className="truncate">{t.title}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                </div>

                                <div className="text-[9px] font-mono text-stone-400/80 uppercase tracking-widest pt-4 border-t border-stone-200/40 shrink-0">
                                    SYSTEM MODULE v2.0
                                </div>
                            </nav>

                            <div id="hub-scroll-container" className="flex-1 overflow-y-auto px-8 py-6 space-y-10 subtle-scrollbar scroll-smooth">
                                {hub.isLoading ? (
                                    <div className="flex justify-center py-20 text-slate-400">
                                        <Loader2 className="animate-spin" size={28} />
                                    </div>
                                ) : (
                                    <>
                                        <div id="sec-reminders">
                                            <SectionBlock title="提醒" count={reminderTotalCount} isOpen={expandedSections.reminders} onToggle={() => toggleSection("reminders")}>
                                                {hub.reminders.length === 0 && hub.folderReminders.length === 0 ? (
                                                    <p className="text-sm text-slate-400 italic pl-0.5">
                                                        暂无提醒
                                                    </p>
                                                ) : (
                                                    <div className="space-y-4">
                                                        {/* 1. 截止事项提醒卡片 */}
                                                        {deadlineReminders.length > 0 && (
                                                            <div id="sub-deadline-reminders">
                                                                <CollapsibleReminderGroup
                                                                    title="截止事项提醒"
                                                                    count={deadlineReminders.length}
                                                                    icon={Clock}
                                                                    themeClass={{
                                                                        row: "border-amber-200/45 bg-amber-50/15",
                                                                        icon: "border-amber-200 bg-amber-50 text-amber-700",
                                                                    }}
                                                                >
                                                                    <ul className="space-y-2">
                                                                        {deadlineReminders.map((r) => (
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
                                                                                onUpdateFriendLastContact={handleUpdateFriendLastContact}
                                                                                friendLastContactDate={
                                                                                    r.friendId
                                                                                        ? lastContactDates[r.friendId] ?? ''
                                                                                        : undefined
                                                                                }
                                                                                onFriendLastContactDateChange={
                                                                                    r.friendId
                                                                                        ? (value: string) =>
                                                                                            setLastContactDates((prev: Record<number, string>) => ({
                                                                                                ...prev,
                                                                                                [r.friendId!]: value,
                                                                                            }))
                                                                                        : undefined
                                                                                }
                                                                                isUpdatingLastContact={
                                                                                    r.friendId != null && updatingLastContactId === r.friendId
                                                                                }
                                                                                onUpdateRhythmReminder={handleUpdateRhythmReminder}
                                                                                rhythmEventName={
                                                                                    r.rhythmCategory
                                                                                        ? rhythmDrafts[r.rhythmCategory]?.eventName ?? ""
                                                                                        : undefined
                                                                                }
                                                                                onRhythmEventNameChange={
                                                                                    r.rhythmCategory
                                                                                        ? (value: string) =>
                                                                                            setRhythmDrafts((prev) => ({
                                                                                                ...prev,
                                                                                                [r.rhythmCategory!]: {
                                                                                                    eventName: value,
                                                                                                    eventDate:
                                                                                                        prev[r.rhythmCategory!]?.eventDate ?? getHubDayKey(),
                                                                                                },
                                                                                            }))
                                                                                        : undefined
                                                                                }
                                                                                rhythmEventDate={
                                                                                    r.rhythmCategory
                                                                                        ? rhythmDrafts[r.rhythmCategory]?.eventDate ?? getHubDayKey()
                                                                                        : undefined
                                                                                }
                                                                                onRhythmEventDateChange={
                                                                                    r.rhythmCategory
                                                                                        ? (value: string) =>
                                                                                            setRhythmDrafts((prev) => ({
                                                                                                ...prev,
                                                                                                [r.rhythmCategory!]: {
                                                                                                    eventName:
                                                                                                        prev[r.rhythmCategory!]?.eventName ?? "",
                                                                                                    eventDate: value,
                                                                                                },
                                                                                            }))
                                                                                        : undefined
                                                                                }
                                                                                isUpdatingRhythm={
                                                                                    r.rhythmCategory != null && updatingRhythmCategory === r.rhythmCategory
                                                                                }
                                                                            />
                                                                        ))}
                                                                    </ul>
                                                                </CollapsibleReminderGroup>
                                                            </div>
                                                        )}

                                                        {/* 2. 朋友联系提醒卡片 */}
                                                        {friendReminders.length > 0 && (
                                                            <div id="sub-friend-reminders">
                                                                <CollapsibleReminderGroup
                                                                    title="朋友联系提醒"
                                                                    count={friendReminders.length}
                                                                    icon={Activity}
                                                                    themeClass={{
                                                                        row: "border-rose-200/45 bg-rose-50/15",
                                                                        icon: "border-rose-200 bg-rose-50 text-rose-700",
                                                                    }}
                                                                >
                                                                    <ul className="space-y-3">
                                                                        {friendReminders.map((r) => (
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
                                                                                onUpdateFriendLastContact={handleUpdateFriendLastContact}
                                                                                friendLastContactDate={
                                                                                    r.friendId
                                                                                        ? lastContactDates[r.friendId] ?? ''
                                                                                        : undefined
                                                                                }
                                                                                onFriendLastContactDateChange={
                                                                                    r.friendId
                                                                                        ? (value: string) =>
                                                                                            setLastContactDates((prev: Record<number, string>) => ({
                                                                                                ...prev,
                                                                                                [r.friendId!]: value,
                                                                                            }))
                                                                                        : undefined
                                                                                }
                                                                                isUpdatingLastContact={
                                                                                    r.friendId != null && updatingLastContactId === r.friendId
                                                                                }
                                                                                onUpdateRhythmReminder={handleUpdateRhythmReminder}
                                                                                rhythmEventName={
                                                                                    r.rhythmCategory
                                                                                        ? rhythmDrafts[r.rhythmCategory]?.eventName ?? ""
                                                                                        : undefined
                                                                                }
                                                                                onRhythmEventNameChange={
                                                                                    r.rhythmCategory
                                                                                        ? (value: string) =>
                                                                                            setRhythmDrafts((prev) => ({
                                                                                                ...prev,
                                                                                                [r.rhythmCategory!]: {
                                                                                                    eventName: value,
                                                                                                    eventDate:
                                                                                                        prev[r.rhythmCategory!]?.eventDate ?? getHubDayKey(),
                                                                                                },
                                                                                            }))
                                                                                        : undefined
                                                                                }
                                                                                rhythmEventDate={
                                                                                    r.rhythmCategory
                                                                                        ? rhythmDrafts[r.rhythmCategory]?.eventDate ?? getHubDayKey()
                                                                                        : undefined
                                                                                }
                                                                                onRhythmEventDateChange={
                                                                                    r.rhythmCategory
                                                                                        ? (value: string) =>
                                                                                            setRhythmDrafts((prev) => ({
                                                                                                ...prev,
                                                                                                [r.rhythmCategory!]: {
                                                                                                    eventName:
                                                                                                        prev[r.rhythmCategory!]?.eventName ?? "",
                                                                                                    eventDate: value,
                                                                                                },
                                                                                            }))
                                                                                        : undefined
                                                                                }
                                                                                isUpdatingRhythm={
                                                                                    r.rhythmCategory != null && updatingRhythmCategory === r.rhythmCategory
                                                                                }
                                                                            />
                                                                        ))}
                                                                    </ul>
                                                                </CollapsibleReminderGroup>
                                                            </div>
                                                        )}

                                                        {/* 3. 活动提醒卡片 */}
                                                        {rhythmReminders.length > 0 && (
                                                            <div id="sub-activity-reminders">
                                                                <CollapsibleReminderGroup
                                                                    title="活动提醒"
                                                                    count={rhythmReminders.length}
                                                                    icon={Palette}
                                                                    themeClass={{
                                                                        row: "border-emerald-200/45 bg-emerald-50/15",
                                                                        icon: "border-emerald-200 bg-emerald-50 text-emerald-700",
                                                                    }}
                                                                >
                                                                    <ul className="space-y-3">
                                                                        {rhythmReminders.map((r) => (
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
                                                                                onUpdateFriendLastContact={handleUpdateFriendLastContact}
                                                                                friendLastContactDate={
                                                                                    r.friendId
                                                                                        ? lastContactDates[r.friendId] ?? ''
                                                                                        : undefined
                                                                                }
                                                                                onFriendLastContactDateChange={
                                                                                    r.friendId
                                                                                        ? (value: string) =>
                                                                                            setLastContactDates((prev: Record<number, string>) => ({
                                                                                                ...prev,
                                                                                                [r.friendId!]: value,
                                                                                            }))
                                                                                        : undefined
                                                                                }
                                                                                isUpdatingLastContact={
                                                                                    r.friendId != null && updatingLastContactId === r.friendId
                                                                                }
                                                                                onUpdateRhythmReminder={handleUpdateRhythmReminder}
                                                                                rhythmEventName={
                                                                                    r.rhythmCategory
                                                                                        ? rhythmDrafts[r.rhythmCategory]?.eventName ?? ""
                                                                                        : undefined
                                                                                }
                                                                                onRhythmEventNameChange={
                                                                                    r.rhythmCategory
                                                                                        ? (value: string) =>
                                                                                            setRhythmDrafts((prev) => ({
                                                                                                ...prev,
                                                                                                [r.rhythmCategory!]: {
                                                                                                    eventName: value,
                                                                                                    eventDate:
                                                                                                        prev[r.rhythmCategory!]?.eventDate ?? getHubDayKey(),
                                                                                                },
                                                                                            }))
                                                                                        : undefined
                                                                                }
                                                                                rhythmEventDate={
                                                                                    r.rhythmCategory
                                                                                        ? rhythmDrafts[r.rhythmCategory]?.eventDate ?? getHubDayKey()
                                                                                        : undefined
                                                                                }
                                                                                onRhythmEventDateChange={
                                                                                    r.rhythmCategory
                                                                                        ? (value: string) =>
                                                                                            setRhythmDrafts((prev) => ({
                                                                                                ...prev,
                                                                                                [r.rhythmCategory!]: {
                                                                                                    eventName:
                                                                                                        prev[r.rhythmCategory!]?.eventName ?? "",
                                                                                                    eventDate: value,
                                                                                                },
                                                                                            }))
                                                                                        : undefined
                                                                                }
                                                                                isUpdatingRhythm={
                                                                                    r.rhythmCategory != null && updatingRhythmCategory === r.rhythmCategory
                                                                                }
                                                                            />
                                                                        ))}
                                                                    </ul>
                                                                </CollapsibleReminderGroup>
                                                            </div>
                                                        )}

                                                        {/* 4. 其他常规默认提醒 */}
                                                        {defaultReminders.length > 0 && (
                                                            <div id="sub-general-reminders">
                                                                <ul className="space-y-2">
                                                                    {defaultReminders.map((r) => (
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
                                                                            onUpdateFriendLastContact={handleUpdateFriendLastContact}
                                                                            friendLastContactDate={
                                                                                r.friendId
                                                                                    ? lastContactDates[r.friendId] ?? ''
                                                                                    : undefined
                                                                            }
                                                                            onFriendLastContactDateChange={
                                                                                r.friendId
                                                                                    ? (value: string) =>
                                                                                        setLastContactDates((prev: Record<number, string>) => ({
                                                                                            ...prev,
                                                                                            [r.friendId!]: value,
                                                                                        }))
                                                                                    : undefined
                                                                            }
                                                                            isUpdatingLastContact={
                                                                                r.friendId != null && updatingLastContactId === r.friendId
                                                                            }
                                                                            onUpdateRhythmReminder={handleUpdateRhythmReminder}
                                                                            rhythmEventName={
                                                                                r.rhythmCategory
                                                                                    ? rhythmDrafts[r.rhythmCategory]?.eventName ?? ""
                                                                                    : undefined
                                                                            }
                                                                            onRhythmEventNameChange={
                                                                                r.rhythmCategory
                                                                                    ? (value: string) =>
                                                                                        setRhythmDrafts((prev) => ({
                                                                                            ...prev,
                                                                                            [r.rhythmCategory!]: {
                                                                                                eventName: value,
                                                                                                eventDate:
                                                                                                    prev[r.rhythmCategory!]?.eventDate ?? getHubDayKey(),
                                                                                            },
                                                                                        }))
                                                                                    : undefined
                                                                            }
                                                                            rhythmEventDate={
                                                                                r.rhythmCategory
                                                                                    ? rhythmDrafts[r.rhythmCategory]?.eventDate ?? getHubDayKey()
                                                                                    : undefined
                                                                            }
                                                                            onRhythmEventDateChange={
                                                                                r.rhythmCategory
                                                                                    ? (value: string) =>
                                                                                        setRhythmDrafts((prev) => ({
                                                                                            ...prev,
                                                                                            [r.rhythmCategory!]: {
                                                                                                eventName:
                                                                                                    prev[r.rhythmCategory!]?.eventName ?? "",
                                                                                                eventDate: value,
                                                                                            },
                                                                                        }))
                                                                                    : undefined
                                                                            }
                                                                            isUpdatingRhythm={
                                                                                r.rhythmCategory != null && updatingRhythmCategory === r.rhythmCategory
                                                                            }
                                                                        />
                                                                    ))}
                                                                </ul>
                                                            </div>
                                                        )}

                                                        <div id="sub-folders">
                                                            <FolderReminderGroup
                                                                folders={hub.folderReminders}
                                                                isOpen={expandedTaskGroups.folderReminders}
                                                                onToggle={() => toggleTaskGroup("folderReminders")}
                                                                onClose={onClose}
                                                                onClear={handleClearFolderReminder}
                                                                folderBookmarks={folderBookmarks}
                                                                loadingFolders={loadingFolders}
                                                                onLoadFolderBookmarks={fetchFolderBookmarks}
                                                            />
                                                        </div>
                                                    </div>
                                                )}
                                            </SectionBlock>
                                        </div>

                                        <div id="sec-tasks">
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
                                                    hub.queuedBookmarks.length === 0 ? (
                                                    <p className="text-sm text-slate-400 italic pl-0.5">
                                                        暂无待处理项
                                                    </p>
                                                ) : (
                                                    <div>
                                                        {hub.captures.length > 0 && (
                                                            <div id="sub-captures">
                                                                <TaskGroupBlock title="想法汇总" count={hub.captures.length} isOpen={expandedTaskGroups.captures} onToggle={() => toggleTaskGroup("captures")}>
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
                                                            </div>
                                                        )}

                                                        {hub.queuedBookmarks.length > 0 && (
                                                            <div id="sub-queued">
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
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </SectionBlock>
                                        </div>

                                        <div id="sec-longterm">
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
                                                                    id={`sub-longterm-${t.id}`}
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
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
}
