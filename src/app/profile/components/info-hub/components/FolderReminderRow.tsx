"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FolderOpen, ExternalLink, BellOff, Loader2, ChevronDown } from "lucide-react";
import Link from "next/link";
import type { HubFolderReminder, HubCategoryType } from "../types";
import type { InfoBookmark } from "@/app/library/info-source/types";
import { formatFolderReminderInterval } from "@/lib/infoItemReminder";
import { CategoryTag } from "./BaseBlocks";

function extractDomain(url: string): string | null {
    try {
        const domain = new URL(url).hostname;
        return domain.replace("www.", "");
    } catch {
        return null;
    }
}

function formatRange(start?: string | null, end?: string | null, legacy?: string | null): string {
    const s = start?.slice(0, 10) || legacy?.slice(0, 10) || null;
    const e = end?.slice(0, 10) || null;
    if (!s && !e) return "";
    const formatKey = (k: string) => k.replace(/-/g, ".");
    if (s && e) {
        if (s === e) return formatKey(s);
        return `${formatKey(s)} — ${formatKey(e)}`;
    }
    if (s) return formatKey(s);
    return `至 ${formatKey(e!)}`;
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

export function FolderReminderRow({
    folder,
    onClose,
    onClear,
    bookmarks,
    isLoading,
    onLoad,
}: {
    folder: HubFolderReminder;
    onClose: () => void;
    onClear: (folder: HubFolderReminder) => void;
    bookmarks?: InfoBookmark[];
    isLoading?: boolean;
    onLoad: (folderId: number) => void;
}) {
    const [isExpanded, setIsExpanded] = useState(true);

    const handleToggle = () => {
        const nextState = !isExpanded;
        setIsExpanded(nextState);
        if (nextState) {
            onLoad(folder.id);
        }
    };

    const styles = folderReminderRowStyles(folder.category_type);

    return (
        <li className="rounded-lg border border-stone-200/90 bg-white shadow-sm overflow-hidden flex flex-col">
            <div
                onClick={handleToggle}
                className={`flex cursor-pointer items-center gap-3 px-3 py-2.5 hover:bg-slate-50 transition-colors ${styles.row}`}
            >
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${styles.icon}`}>
                    <FolderOpen size={15} />
                </div>
                <span className="flex-1 min-w-0">
                    <span className="block text-sm font-semibold text-slate-800 truncate">
                        {folder.name}
                    </span>
                    <span className={`text-[10px] font-mono mt-0.5 block ${styles.meta}`}>
                        {formatFolderReminderInterval(folder.reminder_interval_days)} · 回顾
                    </span>
                </span>
                <CategoryTag type={folder.category_type} />
                <Link
                    href={`/library/info-source/${folder.category_type}`}
                    onClick={(e) => {
                        e.stopPropagation();
                        onClose();
                    }}
                    className={`p-1.5 rounded-md text-slate-500 transition-colors ${styles.action}`}
                    title="打开信息溯源"
                >
                    <ExternalLink size={14} />
                </Link>
                <button
                    type="button"
                    title="清除提醒"
                    onClick={(e) => {
                        e.stopPropagation();
                        onClear(folder);
                    }}
                    className={`p-1.5 rounded-md text-slate-500 transition-colors ${styles.action}`}
                >
                    <BellOff size={14} />
                </button>
            </div>

            <AnimatePresence initial={false}>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2, ease: "easeInOut" }}
                        className="overflow-hidden border-t border-stone-200/50 bg-stone-50/80 shadow-[inset_0_2px_5px_rgba(0,0,0,0.03)]"
                    >
                        <div className="p-3.5">
                            {isLoading ? (
                                <div className="flex items-center justify-center py-3">
                                    <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                                </div>
                            ) : !bookmarks || bookmarks.length === 0 ? (
                                <div className="text-sm text-stone-400 italic py-1 pl-2">
                                    暂无条目
                                </div>
                            ) : (
                                <div className="max-h-48 overflow-y-auto pr-1">
                                    <ul className="space-y-2 border-l border-dashed border-stone-300 pl-3.5 py-0.5 ml-2.5">
                                        {bookmarks.map((bookmark) => {
                                            const formattedDate = formatRange(
                                                bookmark.effective_date_start,
                                                bookmark.effective_date_end,
                                                bookmark.info_date || bookmark.created_at
                                            );
                                            const domain = bookmark.url ? extractDomain(bookmark.url) : null;

                                            return (
                                                <li
                                                    key={`b-${bookmark.id}`}
                                                    className="flex items-center justify-between gap-4 py-1.5 border-b border-stone-200/40 last:border-b-0"
                                                >
                                                    <div className="flex items-center gap-2 flex-1 min-w-0">
                                                        <span className="w-1 h-1 rounded-full bg-stone-300 shrink-0" />
                                                        <span className="flex-1 min-w-0 truncate">
                                                            {bookmark.url ? (
                                                                <a
                                                                    href={bookmark.url}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="inline-flex items-baseline flex-wrap gap-1.5 font-medium text-slate-700 hover:text-amber-600 hover:underline text-sm truncate"
                                                                    title={bookmark.title}
                                                                >
                                                                    <span className="truncate">{bookmark.title}</span>
                                                                    {domain && (
                                                                        <span className="text-[10px] font-normal text-slate-400 font-mono tracking-tight shrink-0 select-none">
                                                                            ({domain})
                                                                        </span>
                                                                    )}
                                                                    <ExternalLink size={11} className="shrink-0 text-slate-400/80 align-baseline" />
                                                                </a>
                                                            ) : (
                                                                <span className="text-slate-600 text-sm" title={bookmark.title}>
                                                                    {bookmark.title}
                                                                </span>
                                                            )}
                                                        </span>
                                                    </div>
                                                    {formattedDate && (
                                                        <span className="text-[11px] font-mono text-slate-400 shrink-0 select-none">
                                                            {formattedDate}
                                                        </span>
                                                    )}
                                                </li>
                                            );
                                        })}
                                    </ul>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </li>
    );
}

export function FolderReminderGroup({
    folders,
    isOpen,
    onToggle,
    onClose,
    onClear,
    folderBookmarks,
    loadingFolders,
    onLoadFolderBookmarks,
}: {
    folders: HubFolderReminder[];
    isOpen: boolean;
    onToggle: () => void;
    onClose: () => void;
    onClear: (folder: HubFolderReminder) => void;
    folderBookmarks: Record<number, InfoBookmark[]>;
    loadingFolders: Record<number, boolean>;
    onLoadFolderBookmarks: (folderId: number) => void;
}) {
    if (folders.length === 0) return null;

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
                    收藏夹提醒
                </h3>
                <span className="rounded-full bg-stone-100/80 px-1.5 py-0.5 text-[9px] font-mono font-bold text-slate-400">
                    {folders.length}
                </span>
                <div className="h-px flex-1 bg-stone-200/70 opacity-0 transition-opacity group-hover:opacity-100" />
            </button>
            <AnimatePresence initial={false}>
                {isOpen && (
                    <motion.div
                        key="folder-reminder-content"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.18, ease: "easeInOut" }}
                        className="overflow-hidden"
                    >
                        <ul className="space-y-2">
                            {folders.map((folder) => (
                                <FolderReminderRow
                                    key={`f-${folder.id}`}
                                    folder={folder}
                                    onClose={onClose}
                                    onClear={onClear}
                                    bookmarks={folderBookmarks[folder.id]}
                                    isLoading={loadingFolders[folder.id]}
                                    onLoad={onLoadFolderBookmarks}
                                />
                            ))}
                        </ul>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
