import React from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { SlidersHorizontal, ChevronRight, ArrowLeft, Library, ListTodo, Loader2, Target } from 'lucide-react';
import Link from 'next/link';
import { InfoSourceGroup, InfoSource, InfoItem } from '../types';

interface InfoSidebarProps {
    theme: any;
    isStudy: boolean;
    isLoading: boolean;
    sidebarMode: 'source' | 'queue';
    setSidebarMode: (mode: 'source' | 'queue') => void;
    
    mockGroups: InfoSourceGroup[];
    mockSources: InfoSource[];
    mockItems: InfoItem[];
    
    selectedGroupId: number | null;
    setSelectedGroupId: (id: number | null) => void;
    selectedSourceId: number | null;
    setSelectedSourceId: (id: number | null) => void;
    
    expandedGroups: number[];
    toggleGroup: (id: number, e: React.MouseEvent) => void;
    
    handleReorderGroups: (newOrder: InfoSourceGroup[]) => void;
    handleReorderSources: (groupId: number | null, newOrder: InfoSource[]) => void;
    
    queuedItems: InfoItem[];
    scrollToCard: (id: number) => void;
}

export function InfoSidebar({
    theme, isStudy, isLoading, sidebarMode, setSidebarMode,
    mockGroups, mockSources, mockItems,
    selectedGroupId, setSelectedGroupId,
    selectedSourceId, setSelectedSourceId,
    expandedGroups, toggleGroup,
    handleReorderGroups, handleReorderSources,
    queuedItems, scrollToCard
}: InfoSidebarProps) {
    return (
        <aside className={`w-72 shrink-0 h-full flex flex-col border-r ${theme.border} ${theme.sidebarBg} relative z-10`}>
            {/* 顶部标题区 */}
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
                    {isStudy ? '学术与工具的沉淀之地' : '日常灵感的闪光的记录'}
                </p>
            </div>

            {/* Sidebar 模式切换 */}
            <div className="px-6 mb-4">
                <div className={`flex p-1 rounded-xl ${isStudy ? 'bg-slate-800' : 'bg-stone-200'}`}>
                    <button
                        onClick={() => setSidebarMode('source')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${
                            sidebarMode === 'source' ? `${theme.cardBg} shadow-sm ${theme.textBase}` : `${theme.textMuted} hover:text-opacity-80`
                        }`}
                    >
                        <Library size={14} /> 来源
                    </button>
                    <button
                        onClick={() => setSidebarMode('queue')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${
                            sidebarMode === 'queue' ? `${theme.cardBg} shadow-sm ${theme.textBase}` : `${theme.textMuted} hover:text-opacity-80`
                        }`}
                    >
                        <ListTodo size={14} /> 待看
                        {queuedItems.length > 0 && (
                            <span className={`px-1.5 py-0.5 rounded-md text-[10px] ${sidebarMode === 'queue' ? theme.activePill : isStudy ? 'bg-slate-700 text-slate-300' : 'bg-stone-300 text-stone-600'}`}>
                                {queuedItems.length}
                            </span>
                        )}
                    </button>
                </div>
            </div>

            {/* Sidebar 列表内容 */}
            <div className="flex-1 overflow-y-auto px-4 pb-6 scrollbar-hide">
                {isLoading ? (
                    <div className="flex justify-center py-10">
                        <Loader2 className={`animate-spin ${theme.textMuted}`} size={20} />
                    </div>
                ) : (
                    <AnimatePresence mode='wait'>
                        {sidebarMode === 'source' ? (
                            <motion.div 
                                key="source"
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 10 }}
                                transition={{ duration: 0.2 }}
                                className="space-y-1 mt-2"
                            >
                                <div className="mt-2 space-y-1 pb-4">
                                    <button
                                        onClick={() => { setSelectedGroupId(null); setSelectedSourceId(null); }}
                                        className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all mb-4 ${
                                            selectedGroupId === null && selectedSourceId === null ? theme.primaryBg + ' ' + theme.primary : `transparent hover:${theme.cardBg}`
                                        }`}
                                    >
                                        <span className="text-sm font-bold">所有聚合来源</span>
                                    </button>
                                    
                                    <Reorder.Group 
                                        axis="y" 
                                        values={mockGroups} 
                                        onReorder={handleReorderGroups}
                                        className="space-y-3"
                                    >
                                        {mockGroups.map(group => {
                                            const groupSources = mockSources.filter(s => s.group_id === group.id).sort((a,b)=>a.sort_order - b.sort_order);
                                            const isGroupActive = selectedGroupId === group.id && selectedSourceId === null;
                                            const isExpanded = expandedGroups.includes(group.id);
                                            const totalCount = mockItems.filter(item => 
                                                (item.source_id && groupSources.some(s=>s.id === item.source_id)) || 
                                                (item.group_id === group.id)
                                            ).length;

                                            return (
                                                <Reorder.Item key={group.id} value={group} className="relative">
                                                    <button
                                                        onClick={() => { setSelectedGroupId(group.id); setSelectedSourceId(null); }}
                                                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all group/header mb-1 ${
                                                            isGroupActive ? theme.cardBg + ' shadow-sm' : `transparent hover:${theme.cardBg}`
                                                        }`}
                                                    >
                                                        <div className="flex items-center gap-1.5">
                                                            <div 
                                                                onClick={(e) => toggleGroup(group.id, e)}
                                                                className={`p-1 rounded-md hover:bg-black/5 ${theme.textMuted} transition-colors`}
                                                            >
                                                                <ChevronRight size={14} className={`transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`} />
                                                            </div>
                                                            <span className={`text-[13px] font-bold ${isGroupActive ? theme.primary : theme.textBase}`}>{group.name}</span>
                                                        </div>
                                                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded-md ${isGroupActive ? (isStudy?'bg-blue-500/20 text-blue-400':'bg-amber-500/20 text-amber-600') : (isStudy?'bg-slate-800 text-slate-500':'bg-stone-200 text-stone-500')}`}>
                                                            {totalCount}
                                                        </span>
                                                    </button>
                                                    
                                                    <AnimatePresence>
                                                        {isExpanded && (
                                                            <motion.div 
                                                                initial={{ height: 0, opacity: 0 }} 
                                                                animate={{ height: 'auto', opacity: 1 }} 
                                                                exit={{ height: 0, opacity: 0 }} 
                                                                className="overflow-hidden"
                                                            >
                                                                <Reorder.Group axis="y" values={groupSources} onReorder={(newOrder) => handleReorderSources(group.id, newOrder)} className="pl-4 space-y-1">
                                                                    {groupSources.map(source => {
                                                                        const count = mockItems.filter(i => i.source_id === source.id).length;
                                                                        const isActive = selectedSourceId === source.id;
                                                                        return (
                                                                            <Reorder.Item key={source.id} value={source} className="relative cursor-grab active:cursor-grabbing">
                                                                                <button
                                                                                    onClick={() => { setSelectedGroupId(group.id); setSelectedSourceId(source.id); }}
                                                                                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all group ${
                                                                                        isActive ? theme.primaryBg + ' ' + theme.primary : `transparent hover:${theme.cardBg}`
                                                                                    }`}
                                                                                >
                                                                                    <div className="flex items-center gap-2.5">
                                                                                        {source.image_url ? (
                                                                                            <img src={source.image_url} alt="" className={`w-4 h-4 rounded object-cover ${!isActive && 'grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100'}`} />
                                                                                        ) : (
                                                                                            <div className={`w-4 h-4 rounded bg-gray-500/20`} />
                                                                                        )}
                                                                                        <span className={`text-xs ${isActive ? 'font-bold' : 'font-medium group-hover:font-semibold'}`}>{source.name}</span>
                                                                                    </div>
                                                                                    {count > 0 ? (
                                                                                        <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-md transition-colors ${isActive ? (isStudy?'bg-blue-500/20':'bg-amber-500/20') : (isStudy?'bg-slate-800':'bg-stone-200 group-hover:bg-stone-300')}`}>
                                                                                            {count}
                                                                                        </span>
                                                                                    ) : (
                                                                                        <div className="w-4 h-4 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                                                            <SlidersHorizontal size={10} className="text-zinc-600 rotate-90" />
                                                                                        </div>
                                                                                    )}
                                                                                </button>
                                                                            </Reorder.Item>
                                                                        )
                                                                    })}
                                                                </Reorder.Group>
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>
                                                </Reorder.Item>
                                            )
                                        })}
                                    </Reorder.Group>
                                    
                                    {/* 未分组来源处理 */}
                                    {mockSources.filter(s => s.group_id == null).length > 0 && (
                                        <div className="mt-4 pt-4 border-t border-slate-500/20">
                                            <div className={`px-4 mb-2 text-[10px] font-bold tracking-widest uppercase ${theme.textMuted}`}>未分组溯源</div>
                                            <Reorder.Group axis="y" values={mockSources.filter(s => s.group_id == null).sort((a,b)=>a.sort_order - b.sort_order)} onReorder={(newOrder) => handleReorderSources(null, newOrder)} className="space-y-1">
                                                {mockSources.filter(s => s.group_id == null).sort((a,b)=>a.sort_order - b.sort_order).map(source => {
                                                    const count = mockItems.filter(i => i.source_id === source.id).length;
                                                    const isActive = selectedSourceId === source.id;
                                                    return (
                                                        <Reorder.Item key={source.id} value={source} className="relative cursor-grab active:cursor-grabbing">
                                                            <button
                                                                onClick={() => { setSelectedGroupId(null); setSelectedSourceId(source.id); }}
                                                                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all group ${
                                                                    isActive ? theme.primaryBg + ' ' + theme.primary : `transparent hover:${theme.cardBg}`
                                                                }`}
                                                            >
                                                                <div className="flex items-center gap-2.5">
                                                                    {source.image_url ? (
                                                                        <img src={source.image_url} alt="" className={`w-4 h-4 rounded object-cover ${!isActive && 'grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100'}`} />
                                                                    ) : (
                                                                        <div className={`w-4 h-4 rounded bg-gray-500/20`} />
                                                                    )}
                                                                    <span className={`text-xs ${isActive ? 'font-bold' : 'font-medium group-hover:font-semibold'}`}>{source.name}</span>
                                                                </div>
                                                                {count > 0 && (
                                                                    <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-md transition-colors ${isActive ? (isStudy?'bg-blue-500/20':'bg-amber-500/20') : (isStudy?'bg-slate-800':'bg-stone-200 group-hover:bg-stone-300')}`}>
                                                                        {count}
                                                                    </span>
                                                                )}
                                                            </button>
                                                        </Reorder.Item>
                                                    )
                                                })}
                                            </Reorder.Group>
                                        </div>
                                    )}
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
                                        当前没有待看任务
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
                                                <h4 className={`text-[13px] font-bold truncate ${theme.textBase}`}>{item.name}</h4>
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
