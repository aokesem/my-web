import React from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { ArrowLeft, Library, ListTodo, Loader2, Target, Settings2 } from 'lucide-react';
import { formatFolderReminderInterval } from '@/lib/infoItemReminder';
import Link from 'next/link';
import { InfoItem, InfoBookmark, InfoSidebarNavMode, InfoSidebarSelection, INFO_UNGROUPED_FOLDER_ID } from '../types';
import { countBookmarksInHub, countUngroupedBookmarks } from '../lib/infoSourceNav';

interface InfoSidebarProps {
    theme: any;
    isStudy: boolean;
    isLoading: boolean;
    sidebarMode: InfoSidebarNavMode;
    setSidebarMode: (mode: InfoSidebarNavMode) => void;
    mockItems: InfoItem[];
    mockBookmarks: InfoBookmark[];
    sidebarSelection: InfoSidebarSelection;
    onSelectAllHubs: () => void;
    onSelectHub: (hubId: number) => void;
    onSelectUngrouped: () => void;
    handleReorderItems: (newOrder: InfoItem[]) => void;
    onOpenFolderSettings: (item: InfoItem) => void;
    queuedBookmarks: InfoBookmark[];
    scrollToCard: (id: number) => void;
}

export function InfoSidebar({
    theme,
    isStudy,
    isLoading,
    sidebarMode,
    setSidebarMode,
    mockItems,
    mockBookmarks,
    sidebarSelection,
    onSelectAllHubs,
    onSelectHub,
    onSelectUngrouped,
    handleReorderItems,
    onOpenFolderSettings,
    queuedBookmarks,
    scrollToCard,
}: InfoSidebarProps) {
    const ungroupedCount = countUngroupedBookmarks(mockBookmarks);

    return (
        <aside
            className={`w-72 shrink-0 h-full flex flex-col border-r ${theme.border} ${theme.sidebarBg} relative z-10`}
        >
            <motion.div className="p-6 pb-4">
                <Link
                    href="/library/info-source"
                    className={`inline-flex items-center gap-2 mb-6 text-[11px] font-mono tracking-widest uppercase transition-colors hover:${theme.primary} ${theme.textMuted}`}
                >
                    <ArrowLeft size={14} /> Back to Hub
                </Link>

                <h1 className="text-2xl font-bold tracking-tight capitalize flex items-center gap-3">
                    {isStudy ? 'Study Nexus' : 'Life Archive'}
                </h1>
                <p className={`text-xs mt-2 ${theme.textMuted}`}>
                    {isStudy ? '学术与工具信息的沉淀池' : '日常出行与生活信息的集散地'}
                </p>
            </motion.div>

            <motion.div className="px-6 mb-4">
                <motion.div className={`flex p-1 rounded-xl ${isStudy ? 'bg-slate-800' : 'bg-stone-200'}`}>
                    <button
                        type="button"
                        onClick={() => setSidebarMode('folders')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${
                            sidebarMode === 'folders'
                                ? `${theme.cardBg} shadow-sm ${theme.textBase}`
                                : `${theme.textMuted} hover:text-opacity-80`
                        }`}
                    >
                        <Library size={14} /> 收藏夹{' '}
                        <span className="opacity-60 font-mono text-[10px]">Folders</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setSidebarMode('queue')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${
                            sidebarMode === 'queue'
                                ? `${theme.cardBg} shadow-sm ${theme.textBase}`
                                : `${theme.textMuted} hover:text-opacity-80`
                        }`}
                    >
                        <ListTodo size={14} /> 待看{' '}
                        <span className="opacity-60 font-mono text-[10px]">Queue</span>
                        {queuedBookmarks.length > 0 && (
                            <span
                                className={`px-1.5 py-0.5 rounded-md text-[10px] ${
                                    sidebarMode === 'queue'
                                        ? theme.activePill
                                        : isStudy
                                          ? 'bg-slate-700 text-slate-300'
                                          : 'bg-stone-300 text-stone-600'
                                }`}
                            >
                                {queuedBookmarks.length}
                            </span>
                        )}
                    </button>
                </motion.div>
            </motion.div>

            <motion.div className="flex-1 overflow-y-auto px-4 pb-6 scrollbar-hide">
                {isLoading ? (
                    <motion.div className="flex justify-center py-10">
                        <Loader2 className={`animate-spin ${theme.textMuted}`} size={20} />
                    </motion.div>
                ) : (
                    <AnimatePresence mode="wait">
                        {sidebarMode === 'folders' ? (
                            <motion.div
                                key="folders"
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 10 }}
                                transition={{ duration: 0.2 }}
                                className="space-y-1 mt-2"
                            >
                                <motion.div className="mt-2 space-y-1 pb-4">
                                    <button
                                        type="button"
                                        onClick={onSelectAllHubs}
                                        className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all mb-3 ${
                                            sidebarSelection === null
                                                ? theme.primaryBg + ' ' + theme.primary
                                                : `transparent hover:${theme.cardBg}`
                                        }`}
                                    >
                                        <span className="text-sm font-bold text-left leading-snug">
                                            全部收藏夹{' '}
                                            <span className="block text-[10px] font-mono font-normal opacity-70 mt-0.5">
                                                All folders
                                            </span>
                                        </span>
                                        <span
                                            className={`text-[10px] font-mono shrink-0 px-2 py-0.5 rounded-md ${
                                                sidebarSelection === null
                                                    ? isStudy
                                                        ? 'bg-blue-500/20 text-blue-400'
                                                        : 'bg-amber-500/20 text-amber-600'
                                                    : isStudy
                                                      ? 'bg-slate-800 text-slate-500'
                                                      : 'bg-stone-200 text-stone-500'
                                            }`}
                                        >
                                            {mockItems.length}
                                        </span>
                                    </button>

                                    <Reorder.Group
                                        axis="y"
                                        values={mockItems}
                                        onReorder={handleReorderItems}
                                        className="space-y-2"
                                    >
                                        {mockItems.map((hub) => {
                                            const entryCount = countBookmarksInHub(
                                                mockBookmarks,
                                                hub.id
                                            );
                                            const isActive = sidebarSelection === hub.id;
                                            const hasReminder = (hub.reminder_interval_days ?? 0) > 0;

                                            return (
                                                <Reorder.Item
                                                    key={hub.id}
                                                    value={hub}
                                                    className="relative group/hub"
                                                >
                                                    <div
                                                        className={`flex items-center gap-1 rounded-xl transition-all ${
                                                            isActive
                                                                ? theme.cardBg + ' shadow-sm'
                                                                : `transparent hover:${theme.cardBg}`
                                                        }`}
                                                    >
                                                        <button
                                                            type="button"
                                                            onClick={() => onSelectHub(hub.id)}
                                                            className="flex-1 flex items-center justify-between px-3 py-2.5 min-w-0"
                                                        >
                                                            <span className="flex flex-col min-w-0 text-left">
                                                                <span
                                                                    className={`text-[13px] font-bold truncate pr-2 ${
                                                                        isActive
                                                                            ? theme.primary
                                                                            : theme.textBase
                                                                    }`}
                                                                >
                                                                    {hub.name}
                                                                </span>
                                                                {hasReminder && (
                                                                    <span
                                                                        className={`text-[9px] font-mono mt-0.5 truncate ${theme.textMuted}`}
                                                                    >
                                                                        {formatFolderReminderInterval(
                                                                            hub.reminder_interval_days ?? 0
                                                                        )}
                                                                    </span>
                                                                )}
                                                            </span>
                                                            <span
                                                                className={`text-[10px] font-mono shrink-0 px-2 py-0.5 rounded-md ${
                                                                    isActive
                                                                        ? isStudy
                                                                            ? 'bg-blue-500/20 text-blue-400'
                                                                            : 'bg-amber-500/20 text-amber-600'
                                                                        : isStudy
                                                                          ? 'bg-slate-800 text-slate-500'
                                                                          : 'bg-stone-200 text-stone-500'
                                                                }`}
                                                            >
                                                                {entryCount}
                                                            </span>
                                                        </button>
                                                        <button
                                                            type="button"
                                                            title="收藏夹设置与提醒"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                onOpenFolderSettings(hub);
                                                            }}
                                                            className={`shrink-0 w-7 h-7 mr-1.5 flex items-center justify-center rounded-lg border ${theme.border} ${
                                                                isStudy
                                                                    ? 'bg-slate-800/60 hover:bg-slate-700'
                                                                    : 'bg-stone-100/90 hover:bg-stone-200/90'
                                                            } opacity-40 group-hover/hub:opacity-100 transition-all ${theme.textMuted} hover:${theme.primary}`}
                                                        >
                                                            <Settings2 size={13} strokeWidth={2.25} />
                                                        </button>
                                                    </div>
                                                </Reorder.Item>
                                            );
                                        })}
                                    </Reorder.Group>

                                    <button
                                        type="button"
                                        onClick={onSelectUngrouped}
                                        className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all mt-4 border border-dashed ${theme.border} ${
                                            sidebarSelection === INFO_UNGROUPED_FOLDER_ID
                                                ? theme.primaryBg + ' ' + theme.primary
                                                : `opacity-90 hover:${theme.cardBg}`
                                        }`}
                                    >
                                        <span className="text-sm font-bold text-left leading-snug">
                                            未归入收藏夹{' '}
                                            <span className="block text-[10px] font-mono font-normal opacity-70 mt-0.5">
                                                Ungrouped entries
                                            </span>
                                        </span>
                                        <span
                                            className={`text-[10px] font-mono px-2 py-0.5 rounded-md ${
                                                sidebarSelection === INFO_UNGROUPED_FOLDER_ID
                                                    ? isStudy
                                                        ? 'bg-blue-500/20 text-blue-400'
                                                        : 'bg-amber-500/20 text-amber-600'
                                                    : isStudy
                                                      ? 'bg-slate-800 text-slate-500'
                                                      : 'bg-stone-200 text-stone-500'
                                            }`}
                                        >
                                            {ungroupedCount}
                                        </span>
                                    </button>
                                </motion.div>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="queue"
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                transition={{ duration: 0.2 }}
                                className="space-y-2 mt-2"
                            >
                                {queuedBookmarks.length === 0 ? (
                                    <motion.div
                                        className={`text-center py-10 text-sm ${theme.textMuted}`}
                                    >
                                        当前没有待看条目
                                    </motion.div>
                                ) : (
                                    queuedBookmarks.map((item) => (
                                        <motion.div
                                            key={item.id}
                                            className={`w-full flex items-center gap-3 p-3 rounded-xl cursor-pointer ${theme.queueCardBg} border border-transparent hover:${theme.border} transition-all duration-300 group hover:scale-[1.02]`}
                                            onClick={() => scrollToCard(item.id)}
                                        >
                                            <motion.div className="w-8 h-8 rounded shrink-0 overflow-hidden bg-black/10 flex items-center justify-center">
                                                {item.image_url ? (
                                                    <img
                                                        src={item.image_url}
                                                        alt=""
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <Target size={14} className={theme.textMuted} />
                                                )}
                                            </motion.div>
                                            <motion.div className="flex-1 overflow-hidden">
                                                <h4
                                                    className={`text-[13px] font-bold truncate ${theme.textBase}`}
                                                >
                                                    {item.title}
                                                </h4>
                                            </motion.div>
                                        </motion.div>
                                    ))
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                )}
            </motion.div>
        </aside>
    );
}
