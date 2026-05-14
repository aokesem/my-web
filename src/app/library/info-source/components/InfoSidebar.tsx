import React from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { ArrowLeft, Library, ListTodo, Loader2, Target } from 'lucide-react';
import Link from 'next/link';
import { InfoSourceGroup, InfoSource, InfoItem, InfoSidebarNavMode, INFO_UNGROUPED_FOLDER_ID } from '../types';
import { itemBelongsToFolder } from '../lib/infoSourceFolders';

interface InfoSidebarProps {
    theme: any;
    isStudy: boolean;
    isLoading: boolean;
    sidebarMode: InfoSidebarNavMode;
    setSidebarMode: (mode: InfoSidebarNavMode) => void;

    mockGroups: InfoSourceGroup[];
    mockSources: InfoSource[];
    mockItems: InfoItem[];

    selectedGroupId: number | null;
    setSelectedGroupId: (id: number | null) => void;
    selectedSourceId: number | null;
    setSelectedSourceId: (id: number | null) => void;

    handleReorderGroups: (newOrder: InfoSourceGroup[]) => void;

    queuedItems: any[];
    scrollToCard: (id: number) => void;
}

export function InfoSidebar({
    theme, isStudy, isLoading, sidebarMode, setSidebarMode,
    mockGroups, mockSources, mockItems,
    selectedGroupId, setSelectedGroupId,
    selectedSourceId, setSelectedSourceId,
    handleReorderGroups,
    queuedItems, scrollToCard
}: InfoSidebarProps) {
    const ungroupedCount = mockItems.filter(i => itemBelongsToFolder(i, INFO_UNGROUPED_FOLDER_ID, mockSources)).length;

    return (
        <aside className={`w-72 shrink-0 h-full flex flex-col border-r ${theme.border} ${theme.sidebarBg} relative z-10`}>
            <div className="p-6 pb-4">
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
            </div>

            <div className="px-6 mb-4">
                <div className={`flex p-1 rounded-xl ${isStudy ? 'bg-slate-800' : 'bg-stone-200'}`}>
                    <button
                        type="button"
                        onClick={() => setSidebarMode('folders')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${sidebarMode === 'folders' ? `${theme.cardBg} shadow-sm ${theme.textBase}` : `${theme.textMuted} hover:text-opacity-80`
                            }`}
                    >
                        <Library size={14} /> 收藏夹 <span className="opacity-60 font-mono text-[10px]">Folders</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setSidebarMode('queue')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${sidebarMode === 'queue' ? `${theme.cardBg} shadow-sm ${theme.textBase}` : `${theme.textMuted} hover:text-opacity-80`
                            }`}
                    >
                        <ListTodo size={14} /> 待看 <span className="opacity-60 font-mono text-[10px]">Queue</span>
                        {queuedItems.length > 0 && (
                            <span className={`px-1.5 py-0.5 rounded-md text-[10px] ${sidebarMode === 'queue' ? theme.activePill : isStudy ? 'bg-slate-700 text-slate-300' : 'bg-stone-300 text-stone-600'}`}>
                                {queuedItems.length}
                            </span>
                        )}
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 pb-6 scrollbar-hide">
                {isLoading ? (
                    <div className="flex justify-center py-10">
                        <Loader2 className={`animate-spin ${theme.textMuted}`} size={20} />
                    </div>
                ) : (
                    <AnimatePresence mode='wait'>
                        {sidebarMode === 'folders' ? (
                            <motion.div
                                key="folders"
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 10 }}
                                transition={{ duration: 0.2 }}
                                className="space-y-1 mt-2"
                            >
                                <div className="mt-2 space-y-1 pb-4">
                                    <button
                                        type="button"
                                        onClick={() => { setSelectedGroupId(null); setSelectedSourceId(null); }}
                                        className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all mb-3 ${selectedGroupId === null && selectedSourceId === null ? theme.primaryBg + ' ' + theme.primary : `transparent hover:${theme.cardBg}`
                                            }`}
                                    >
                                        <span className="text-sm font-bold text-left leading-snug">全部收藏夹 <span className="block text-[10px] font-mono font-normal opacity-70 mt-0.5">All folders</span></span>
                                    </button>

                                    <Reorder.Group
                                        axis="y"
                                        values={mockGroups}
                                        onReorder={handleReorderGroups}
                                        className="space-y-2"
                                    >
                                        {mockGroups.map(group => {
                                            const totalCount = mockItems.filter(item => itemBelongsToFolder(item, group.id, mockSources)).length;
                                            const isGroupActive = selectedGroupId === group.id && selectedSourceId === null;

                                            return (
                                                <Reorder.Item key={group.id} value={group} className="relative">
                                                    <button
                                                        type="button"
                                                        onClick={() => { setSelectedGroupId(group.id); setSelectedSourceId(null); }}
                                                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all ${isGroupActive ? theme.cardBg + ' shadow-sm' : `transparent hover:${theme.cardBg}`
                                                            }`}
                                                    >
                                                        <span className={`text-[13px] font-bold text-left truncate pr-2 ${isGroupActive ? theme.primary : theme.textBase}`}>{group.name}</span>
                                                        <span className={`text-[10px] font-mono shrink-0 px-2 py-0.5 rounded-md ${isGroupActive ? (isStudy ? 'bg-blue-500/20 text-blue-400' : 'bg-amber-500/20 text-amber-600') : (isStudy ? 'bg-slate-800 text-slate-500' : 'bg-stone-200 text-stone-500')}`}>
                                                            {totalCount}
                                                        </span>
                                                    </button>
                                                </Reorder.Item>
                                            );
                                        })}
                                    </Reorder.Group>

                                    <button
                                        type="button"
                                        onClick={() => { setSelectedGroupId(INFO_UNGROUPED_FOLDER_ID); setSelectedSourceId(null); }}
                                        className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all mt-4 border border-dashed ${theme.border} ${selectedGroupId === INFO_UNGROUPED_FOLDER_ID && selectedSourceId === null ? theme.primaryBg + ' ' + theme.primary : `opacity-90 hover:${theme.cardBg}`}`}
                                    >
                                        <span className="text-sm font-bold text-left leading-snug">未归入收藏夹 <span className="block text-[10px] font-mono font-normal opacity-70 mt-0.5">Ungrouped</span></span>
                                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded-md ${selectedGroupId === INFO_UNGROUPED_FOLDER_ID ? (isStudy ? 'bg-blue-500/20 text-blue-400' : 'bg-amber-500/20 text-amber-600') : (isStudy ? 'bg-slate-800 text-slate-500' : 'bg-stone-200 text-stone-500')}`}>
                                            {ungroupedCount}
                                        </span>
                                    </button>
                                </div>
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
                                {queuedItems.length === 0 ? (
                                    <div className={`text-center py-10 text-sm ${theme.textMuted}`}>
                                        当前没有待看条目 <span className="block text-[10px] font-mono mt-1 opacity-80">Nothing in queue</span>
                                    </div>
                                ) : (
                                    queuedItems.map(item => (
                                        <div
                                            key={item.id}
                                            className={`w-full flex items-center gap-3 p-3 rounded-xl cursor-pointer ${theme.queueCardBg} border border-transparent hover:${theme.border} transition-all duration-300 group hover:scale-[1.02]`}
                                            onClick={() => scrollToCard(item.id)}
                                        >
                                            <div className="w-8 h-8 rounded shrink-0 overflow-hidden bg-black/10 flex items-center justify-center">
                                                {item.image_url ? (
                                                    <img src={item.image_url} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    <Target size={14} className={theme.textMuted} />
                                                )}
                                            </div>
                                            <div className="flex-1 overflow-hidden">
                                                <h4 className={`text-[13px] font-bold truncate ${theme.textBase}`}>{item.name || item.title}</h4>
                                                {item.info_date && <p className={`text-[10px] mt-0.5 uppercase tracking-wider ${theme.textMuted}`}>{item.info_date}</p>}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                )}
            </div>
        </aside>
    );
}
