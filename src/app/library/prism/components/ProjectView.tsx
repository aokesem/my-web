import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChevronDown,
    ChevronRight,
    ChevronUp,
    Clock,
    FileText,
    Lightbulb,
    Target,
    Link as LinkIcon,
    Pencil,
    Save,
    X,
    Loader2,
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import type { PaperDetail } from '../types';

// ============================================================
// TYPES
// ============================================================

import { ProjectData, ProjectCategory, ProjectInsight, ProjectOutcome, ProjectTimelineEvent } from '../types';

export type { ProjectData, ProjectCategory, ProjectInsight, ProjectOutcome, ProjectTimelineEvent };

interface ProjectViewProps {
    projects: ProjectData[];
    allPapers: any[];
    onOpenPaper: (id: string) => void;
    onUpdateProjects: () => Promise<void>;
}

// ============================================================
// COMPONENT
// ============================================================

export default function ProjectView({ projects, allPapers, onOpenPaper, onUpdateProjects }: ProjectViewProps) {
    const [activeProjectName, setActiveProjectName] = useState<string>(projects[0]?.name || '');
    const [isTimelineOpen, setIsTimelineOpen] = useState(false);
    const [selectedTimelineIndex, setSelectedTimelineIndex] = useState<number | null>(null);
    const [paperGroupMode, setPaperGroupMode] = useState<'direction' | 'type' | 'depth'>('direction');

    // Editing State
    const [editingId, setEditingId] = useState<string | null>(null);
    const [tempContent, setTempContent] = useState('');
    const [tempPaperIds, setTempPaperIds] = useState<string[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [selectedDirection, setSelectedDirection] = useState<string | null>(null);

    // === Ctrl+B 加粗快捷键处理 ===
    const handleBoldShortcut = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
            e.preventDefault();
            const textarea = e.currentTarget;
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            const text = textarea.value;
            const selected = text.substring(start, end);

            let newText: string;
            let newStart: number;
            let newEnd: number;

            // 检查选中文本是否已被 ** 包裹
            if (start >= 2 && end <= text.length - 2 && text.substring(start - 2, start) === '**' && text.substring(end, end + 2) === '**') {
                // 取消加粗：移除外层的 **
                newText = text.substring(0, start - 2) + selected + text.substring(end + 2);
                newStart = start - 2;
                newEnd = end - 2;
            } else if (selected.startsWith('**') && selected.endsWith('**') && selected.length >= 4) {
                // 选中区域包含了 **，取消加粗
                newText = text.substring(0, start) + selected.slice(2, -2) + text.substring(end);
                newStart = start;
                newEnd = end - 4;
            } else {
                // 加粗：包裹 **
                newText = text.substring(0, start) + '**' + selected + '**' + text.substring(end);
                newStart = start + 2;
                newEnd = end + 2;
            }

            setTempContent(newText);
            // 恢复光标位置
            requestAnimationFrame(() => {
                textarea.selectionStart = newStart;
                textarea.selectionEnd = newEnd;
            });
        }
    }, []);

    // === 渲染含 **加粗** 的文本 ===
    const renderBoldText = useCallback((text: string) => {
        const parts = text.split(/(\*\*.*?\*\*)/g);
        return parts.map((part, i) => {
            if (part.startsWith('**') && part.endsWith('**')) {
                return <strong key={i} className="font-extrabold text-stone-900">{part.slice(2, -2)}</strong>;
            }
            return <span key={i}>{part}</span>;
        });
    }, []);

    const handleSave = async (table: 'prism_project_insights' | 'prism_project_outcomes', junctionTable: 'prism_insight_papers' | 'prism_outcome_papers', idField: 'insight_id' | 'outcome_id') => {
        if (!editingId) return;
        setIsSaving(true);
        try {
            // 1. Update content
            const { error: txtErr } = await supabase
                .from(table)
                .update({ content: tempContent })
                .eq('id', editingId);
            if (txtErr) throw txtErr;

            // 2. Refresh associations
            const { error: delErr } = await supabase
                .from(junctionTable)
                .delete()
                .eq(idField, editingId);
            if (delErr) throw delErr;

            if (tempPaperIds.length > 0) {
                const { error: insErr } = await supabase
                    .from(junctionTable)
                    .insert(tempPaperIds.map(pid => ({ [idField]: editingId, paper_id: pid })));
                if (insErr) throw insErr;
            }

            toast.success('保存成功');
            await onUpdateProjects();
            setEditingId(null);
        } catch (e: any) {
            toast.error('保存失败: ' + e.message);
        } finally {
            setIsSaving(false);
        }
    };

    // Group papers by direction for the active project
    const activeProject = projects.find(p => p.name === activeProjectName);

    const activeTimeRange = useMemo(() => {
        if (selectedTimelineIndex === null || !activeProject) return null;
        const events = activeProject.timeline;
        if (selectedTimelineIndex < 0 || selectedTimelineIndex >= events.length) return null;
        
        let startDateValue = new Date(events[selectedTimelineIndex].date.replace(/\//g, '-')).getTime();
        if (isNaN(startDateValue)) {
            startDateValue = Date.parse(events[selectedTimelineIndex].date.replace(/\//g, '-'));
        }

        let endDateValue = Infinity;
        if (selectedTimelineIndex < events.length - 1) {
            endDateValue = new Date(events[selectedTimelineIndex + 1].date.replace(/\//g, '-')).getTime();
            if (isNaN(endDateValue)) {
                endDateValue = Date.parse(events[selectedTimelineIndex + 1].date.replace(/\//g, '-'));
            }
        }

        return { start: startDateValue || 0, end: endDateValue || Infinity };
    }, [selectedTimelineIndex, activeProject]);

    const relatedPapers = useMemo(() => {
        if (!activeProjectName) return [];
        let papers = allPapers.filter(p => p.projects.includes(activeProjectName));
        if (activeTimeRange) {
            papers = papers.filter(p => {
                if (!p.created_at) return false;
                const pt = new Date(p.created_at).getTime();
                return pt >= activeTimeRange.start && pt < activeTimeRange.end;
            });
        }
        return papers;
    }, [allPapers, activeProjectName, activeTimeRange]);

    const filteredInsights = useMemo(() => {
        if (!activeProject) return [];
        if (!activeTimeRange) return activeProject.insights;

        return activeProject.insights.map(group => ({
            ...group,
            items: group.items.filter(item => {
                if (!item.created_at) return false;
                const it = new Date(item.created_at).getTime();
                return it >= activeTimeRange.start && it < activeTimeRange.end;
            })
        })).filter(g => g.items.length > 0);
    }, [activeProject, activeTimeRange]);

    const filteredOutcomes = useMemo(() => {
        if (!activeProject) return [];
        if (!activeTimeRange) return activeProject.outcomes;

        return activeProject.outcomes.map(group => ({
            ...group,
            items: group.items.filter(item => {
                if (!item.created_at) return false;
                const ot = new Date(item.created_at).getTime();
                return ot >= activeTimeRange.start && ot < activeTimeRange.end;
            })
        })).filter(g => g.items.length > 0);
    }, [activeProject, activeTimeRange]);

    const availableDirections = useMemo(() => {
        const dirs = new Set<string>();
        relatedPapers.forEach(p => p.directions?.forEach((d: string) => dirs.add(d)));
        return Array.from(dirs).sort();
    }, [relatedPapers]);

    const filteredPapersForEdit = useMemo(() => {
        if (!selectedDirection) return relatedPapers;
        return relatedPapers.filter(p => p.directions?.includes(selectedDirection));
    }, [relatedPapers, selectedDirection]);

    const papersGrouped = useMemo(() => {
        const groups: Record<string, PaperDetail[]> = {};
        const uncategorized: PaperDetail[] = [];

        relatedPapers.forEach(p => {
            let categories: string[] = [];
            if (paperGroupMode === 'direction') {
                categories = p.directions;
            } else if (paperGroupMode === 'type') {
                categories = p.types;
            } else if (paperGroupMode === 'depth') {
                categories = [p.read_depth];
            }

            if (categories.length === 0) {
                uncategorized.push(p);
            } else {
                categories.forEach(c => {
                    if (!groups[c]) groups[c] = [];
                    // Prevent duplicates if a paper sits in multiple directions slightly differently
                    if (!groups[c].find(ext => ext.id === p.id)) {
                        groups[c].push(p);
                    }
                });
            }
        });

        const result = Object.entries(groups).map(([cat, papers]) => ({
            category: cat,
            papers
        }));
        if (uncategorized.length > 0) {
            result.push({ category: '未分类', papers: uncategorized });
        }

        return result.sort((a, b) => b.papers.length - a.papers.length);
    }, [relatedPapers, paperGroupMode]);

    if (!activeProject) {
        return (
            <div className="flex-1 flex items-center justify-center text-stone-400 font-mono text-sm py-20">
                NO PROJECTS FOUND
            </div>
        );
    }

    return (
        <div className="flex-1 w-full max-w-[1400px] mx-auto px-18 pb-12 flex h-[calc(100vh-220px)] overflow-hidden">

            {/* ===== RIGHT: Project Board ===== */}
            <div className="flex-1 bg-white rounded-3xl border border-stone-200/70 shadow-sm flex flex-col overflow-hidden">

                {/* Header & Toggle Timeline */}
                <div className="shrink-0 px-6 py-4 flex items-center justify-between border-b border-stone-100 bg-stone-50/50">
                    <div className="flex flex-1 items-center gap-2 overflow-x-auto custom-scrollbar pb-1 -mb-1 mr-4">
                        {projects.map(proj => (
                            <button
                                key={proj.name}
                                onClick={() => {
                                    setActiveProjectName(proj.name);
                                    setIsTimelineOpen(false);
                                    setSelectedTimelineIndex(null);
                                }}
                                className={`
                                    flex items-center gap-2 px-4 py-2 rounded-xl text-[14px] font-medium transition-all duration-200 whitespace-nowrap shrink-0
                                    ${activeProjectName === proj.name
                                        ? 'bg-violet-600 text-white shadow-md shadow-violet-600/20 font-bold'
                                        : 'bg-white text-stone-600 hover:text-violet-600 border border-stone-200/60 hover:border-violet-200'
                                    }
                                `}
                            >
                                {activeProjectName === proj.name && (
                                    <Target size={14} className="text-violet-200" />
                                )}
                                <span>{proj.name}</span>
                            </button>
                        ))}
                    </div>
                    {activeProject.timeline.length > 0 && (
                        <button
                            onClick={() => setIsTimelineOpen(!isTimelineOpen)}
                            className={`
                                flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all
                                ${isTimelineOpen
                                    ? 'bg-stone-800 text-white shadow-sm'
                                    : 'bg-white text-stone-500 border border-stone-200 hover:text-stone-800 hover:bg-stone-50 hover:border-stone-300'
                                }
                            `}
                        >
                            <Clock size={12} />
                            {isTimelineOpen ? '折叠时间轴' : '展开时间轴'}
                            {isTimelineOpen ? <ChevronUp size={12} className="ml-1 opacity-60" /> : <ChevronDown size={12} className="ml-1 opacity-60" />}
                        </button>
                    )}
                </div>

                {/* Collapsible Timeline Content */}
                <AnimatePresence initial={false}>
                    {isTimelineOpen && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3, ease: 'easeInOut' }}
                            className="overflow-hidden border-b border-stone-100 bg-stone-50/80"
                        >
                            <div className="p-6 pt-4 max-h-[180px] overflow-y-auto custom-scrollbar">
                                <div className="space-y-4 relative before:absolute before:inset-y-2 before:left-[4px] before:w-px before:bg-stone-200/70">
                                    {activeProject.timeline.map((event, i) => {
                                        const isActive = selectedTimelineIndex === i;
                                        return (
                                        <div 
                                            key={event.id} 
                                            onClick={() => setSelectedTimelineIndex(isActive ? null : i)}
                                            className={`relative pl-6 py-1 -ml-2 rounded-lg cursor-pointer group transition-all duration-200 ${isActive ? 'bg-violet-50' : 'hover:bg-stone-50'}`}
                                        >
                                            <div className={`absolute left-[9px] top-2.5 w-1.5 h-1.5 rounded-full ring-4 transition-all duration-300 ${isActive ? 'bg-violet-600 ring-violet-200' : 'bg-violet-400 ring-stone-50 group-hover:ring-stone-200/50'}`} />
                                            <div className="flex items-baseline gap-3">
                                                <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded shrink-0 transition-colors ${isActive ? 'text-white bg-violet-600' : 'text-violet-500 bg-violet-100 group-hover:bg-violet-200'}`}>
                                                    {event.date}
                                                </span>
                                                <span className={`text-sm leading-snug transition-colors ${isActive ? 'text-violet-900 font-medium' : 'text-stone-600'}`}>
                                                    {event.content}
                                                </span>
                                            </div>
                                        </div>
                                    )})}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Active Time Filter Bar */}
                {activeTimeRange && selectedTimelineIndex !== null && (
                    <div className="shrink-0 px-6 py-2 bg-violet-50 border-b border-violet-100/60 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="flex w-2 h-2 rounded-full bg-violet-500 shadow-[0_0_8px_rgba(139,92,246,0.5)] animate-pulse" />
                            <span className="text-xs font-mono text-violet-700 font-bold tracking-wider">
                                时间切片 [ {activeProject.timeline[selectedTimelineIndex].date} - {selectedTimelineIndex < activeProject.timeline.length - 1 ? activeProject.timeline[selectedTimelineIndex + 1].date : 'Now'} ]
                            </span>
                        </div>
                        <button 
                            onClick={() => setSelectedTimelineIndex(null)}
                            className="flex items-center gap-1.5 text-[10px] uppercase font-mono px-2 py-1 rounded bg-white text-violet-600 hover:bg-violet-100 border border-violet-200 transition-colors shadow-sm"
                        >
                            <X size={10} /> 清除过滤 (Show All)
                        </button>
                    </div>
                )}

                {/* 3-Column Board */}
                <div className="flex-1 flex overflow-hidden">

                    {/* Col 1: Papers */}
                    <BoardColumn
                        title="关联论文 (素材)"
                        icon={FileText}
                        color="cyan"
                        count={relatedPapers.length}
                        action={
                            <select
                                value={paperGroupMode}
                                onChange={(e) => setPaperGroupMode(e.target.value as any)}
                                className="bg-white/50 border border-stone-200/60 text-stone-500 hover:text-stone-700 text-[13px] rounded px-1.5 py-0.5 outline-none font-mono focus:ring-1 focus:ring-cyan-200 transition-all cursor-pointer"
                            >
                                <option value="direction">按方向</option>
                                <option value="type">按性质</option>
                                <option value="depth">按阅读</option>
                            </select>
                        }
                    >
                        {papersGrouped.map(group => (
                            <AccordionGroup key={group.category} title={group.category} count={group.papers.length} defaultOpen={true}>
                                {group.papers.map(p => (
                                    <div
                                        key={p.id}
                                        onClick={() => onOpenPaper(p.id)}
                                        className="group p-2.5 rounded-xl border border-stone-200/60 bg-white hover:border-cyan-300 hover:shadow-sm cursor-pointer transition-all"
                                    >
                                        <div className="text-[10px] font-mono text-stone-400 mb-1 flex items-center justify-between">
                                            <span>{p.year || 'N/A'}</span>
                                            {p.read_depth === '精读' && (
                                                <span className="text-emerald-500 font-bold bg-emerald-50 px-1 rounded">精讲</span>
                                            )}
                                        </div>
                                        <div className="font-medium text-[15px] text-stone-700 leading-snug group-hover:text-cyan-700 transition-colors line-clamp-2">
                                            {p.nickname || p.title}
                                        </div>
                                    </div>
                                ))}
                            </AccordionGroup>
                        ))}
                    </BoardColumn>

                    {/* Col 2: Insights */}
                    <BoardColumn
                        title="项目启示 (处理)"
                        icon={Lightbulb}
                        color="amber"
                        count={filteredInsights.reduce((acc, c) => acc + c.items.length, 0)}
                    >
                        {filteredInsights.map(group => (
                            <AccordionGroup key={group.category} title={group.category} count={group.items.length} defaultOpen={true}>
                                {group.items.map(insight => (
                                    <div key={insight.id} className="p-3 rounded-xl border border-stone-200/60 bg-amber-50/30 hover:bg-white transition-colors relative group/item">
                                        {editingId === insight.id ? (
                                            <div className="space-y-3">
                                                <textarea 
                                                    value={tempContent}
                                                    onChange={e => setTempContent(e.target.value)}
                                                    onKeyDown={handleBoldShortcut}
                                                    className="w-full bg-white border border-stone-200 rounded-lg p-2 text-sm text-stone-700 focus:ring-1 focus:ring-amber-200 outline-none min-h-[80px]"
                                                    placeholder="支持 Ctrl+B 加粗"
                                                />
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-mono font-bold text-stone-400 uppercase">关联论文 (多选)</label>
                                                    <div className="flex flex-wrap gap-1 mb-1.5">
                                                        <button
                                                            onClick={() => setSelectedDirection(null)}
                                                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold transition-all border ${
                                                                !selectedDirection
                                                                ? 'bg-stone-700 border-stone-700 text-white'
                                                                : 'bg-white border-stone-200 text-stone-400 hover:border-stone-300'
                                                            }`}
                                                        >全部</button>
                                                        {availableDirections.map(dir => (
                                                            <button
                                                                key={dir}
                                                                onClick={() => setSelectedDirection(dir)}
                                                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold transition-all border ${
                                                                    selectedDirection === dir
                                                                    ? 'bg-amber-600 border-amber-600 text-white'
                                                                    : 'bg-white border-stone-200 text-stone-400 hover:border-amber-300'
                                                                }`}
                                                            >{dir}</button>
                                                        ))}
                                                    </div>
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {filteredPapersForEdit.map(p => {
                                                            const isSelected = tempPaperIds.includes(p.id);
                                                            return (
                                                                <button
                                                                    key={p.id}
                                                                    onClick={() => {
                                                                        setTempPaperIds(prev => isSelected ? prev.filter(id => id !== p.id) : [...prev, p.id]);
                                                                    }}
                                                                    className={`px-2 py-1 rounded-md text-[11px] font-medium transition-all border ${
                                                                        isSelected 
                                                                        ? 'bg-amber-100 border-amber-300 text-amber-800' 
                                                                        : 'bg-stone-50 border-stone-200 text-stone-500 hover:border-stone-300'
                                                                    }`}
                                                                >
                                                                    {p.nickname || p.title.slice(0, 15)}
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                                <div className="flex justify-end gap-2 pt-1">
                                                    <button onClick={() => setEditingId(null)} className="p-1.5 text-stone-400 hover:text-stone-600 transition-colors"><X size={14}/></button>
                                                    <button 
                                                        onClick={() => handleSave('prism_project_insights', 'prism_insight_papers', 'insight_id')}
                                                        disabled={isSaving}
                                                        className="flex items-center gap-1 px-3 py-1 bg-amber-600 text-white rounded-lg text-xs font-bold hover:bg-amber-700 transition-colors disabled:opacity-50"
                                                    >
                                                        {isSaving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                                                        保存
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                <button 
                                                    onClick={() => {
                                                        setEditingId(insight.id);
                                                        setTempContent(insight.content);
                                                        setTempPaperIds(insight.paper_ids || []);
                                                        setSelectedDirection(null);
                                                    }}
                                                    className="absolute top-2 right-2 opacity-0 group-hover/item:opacity-100 p-1.5 text-stone-400 hover:text-amber-600 hover:bg-amber-50 rounded-md transition-all z-10"
                                                >
                                                    <Pencil size={12} />
                                                </button>
                                                <div className="text-base text-stone-700 leading-relaxed mb-2 pr-6 whitespace-pre-wrap">
                                                    {renderBoldText(insight.content)}
                                                </div>
                                                <div className="flex flex-wrap gap-2 mt-2">
                                                    {insight.paper_ids?.map(pid => {
                                                        const linkedPaper = allPapers.find(p => p.id === pid);
                                                        if (!linkedPaper) return null;
                                                        return (
                                                            <button
                                                                key={pid}
                                                                onClick={() => onOpenPaper(pid)}
                                                                className="flex items-center gap-1.5 px-2 py-1 bg-white border border-stone-100 rounded-lg text-[12px] font-mono text-blue-500 hover:bg-stone-50 hover:text-amber-600 transition-colors border-dashed"
                                                            >
                                                                <LinkIcon size={10} className="shrink-0" />
                                                                <span className="truncate max-w-[150px]">{linkedPaper.nickname || linkedPaper.title}</span>
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                ))}
                            </AccordionGroup>
                        ))}
                    </BoardColumn>

                    {/* Col 3: Outcomes */}
                    <BoardColumn
                        title="现有成果 (输出)"
                        icon={Target}
                        color="emerald"
                        count={filteredOutcomes.reduce((acc, c) => acc + c.items.length, 0)}
                    >
                        {filteredOutcomes.map(group => (
                            <AccordionGroup key={group.category} title={group.category} count={group.items.length} defaultOpen={true}>
                                {group.items.map(outcome => (
                                    <div key={outcome.id} className="p-3 rounded-xl border border-stone-200/60 bg-emerald-50/30 hover:bg-white transition-colors relative group/item">
                                        {editingId === outcome.id ? (
                                            <div className="p-3 space-y-3">
                                                <textarea 
                                                    value={tempContent}
                                                    onChange={e => setTempContent(e.target.value)}
                                                    onKeyDown={handleBoldShortcut}
                                                    className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2 text-sm text-stone-700 focus:ring-1 focus:ring-emerald-200 outline-none min-h-[80px]"
                                                    placeholder="支持 Ctrl+B 加粗"
                                                />
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-mono font-bold text-stone-400 uppercase">关联论文 (多选)</label>
                                                    <div className="flex flex-wrap gap-1 mb-1.5">
                                                        <button
                                                            onClick={() => setSelectedDirection(null)}
                                                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold transition-all border ${
                                                                !selectedDirection
                                                                ? 'bg-stone-700 border-stone-700 text-white'
                                                                : 'bg-white border-stone-200 text-stone-400 hover:border-stone-300'
                                                            }`}
                                                        >全部</button>
                                                        {availableDirections.map(dir => (
                                                            <button
                                                                key={dir}
                                                                onClick={() => setSelectedDirection(dir)}
                                                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold transition-all border ${
                                                                    selectedDirection === dir
                                                                    ? 'bg-emerald-600 border-emerald-600 text-white'
                                                                    : 'bg-white border-stone-200 text-stone-400 hover:border-emerald-300'
                                                                }`}
                                                            >{dir}</button>
                                                        ))}
                                                    </div>
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {filteredPapersForEdit.map(p => {
                                                            const isSelected = tempPaperIds.includes(p.id);
                                                            return (
                                                                <button
                                                                    key={p.id}
                                                                    onClick={() => {
                                                                        setTempPaperIds(prev => isSelected ? prev.filter(id => id !== p.id) : [...prev, p.id]);
                                                                    }}
                                                                    className={`px-2 py-1 rounded-md text-[11px] font-medium transition-all border ${
                                                                        isSelected 
                                                                        ? 'bg-emerald-100 border-emerald-300 text-emerald-800' 
                                                                        : 'bg-stone-50 border-stone-200 text-stone-500 hover:border-stone-300'
                                                                    }`}
                                                                >
                                                                    {p.nickname || p.title.slice(0, 15)}
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                                <div className="flex justify-end gap-2 pt-1">
                                                    <button onClick={() => setEditingId(null)} className="p-1.5 text-stone-400 hover:text-stone-600 transition-colors"><X size={14}/></button>
                                                    <button 
                                                        onClick={() => handleSave('prism_project_outcomes', 'prism_outcome_papers', 'outcome_id')}
                                                        disabled={isSaving}
                                                        className="flex items-center gap-1 px-3 py-1 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 transition-colors disabled:opacity-50"
                                                    >
                                                        {isSaving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                                                        保存
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                <button 
                                                    onClick={() => {
                                                        setEditingId(outcome.id);
                                                        setTempContent(outcome.content);
                                                        setTempPaperIds(outcome.paper_ids || []);
                                                        setSelectedDirection(null);
                                                    }}
                                                    className="absolute top-1 right-1 opacity-0 group-hover/item:opacity-100 p-1 text-stone-300 hover:text-emerald-500 transition-all z-10"
                                                >
                                                    <Pencil size={11} />
                                                </button>
                                                <div className="flex items-start gap-2.5 p-2 mb-1">
                                                    <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0 shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
                                                    <div className="flex-1 flex flex-col gap-1">
                                                        <span className="text-[15px] text-stone-700 leading-relaxed font-medium pr-6 whitespace-pre-wrap">
                                                            {renderBoldText(outcome.content)}
                                                        </span>
                                                        <div className="flex flex-wrap gap-x-3 gap-y-1">
                                                            {outcome.paper_ids?.map(pid => {
                                                                const linkedPaper = allPapers.find(p => p.id === pid);
                                                                if (!linkedPaper) return null;
                                                                return (
                                                                    <button
                                                                        key={pid}
                                                                        onClick={() => onOpenPaper(pid)}
                                                                        className="flex items-center gap-1 text-[11px] font-mono text-stone-400 hover:text-emerald-600 transition-colors"
                                                                    >
                                                                        <LinkIcon size={9} />
                                                                        <span className="truncate max-w-[120px]">{linkedPaper.nickname || linkedPaper.title}</span>
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                ))}
                            </AccordionGroup>
                        ))}
                    </BoardColumn>

                </div>
            </div>
        </div>
    );
}

// ============================================================
// HELPER COMPONENTS
// ============================================================

function BoardColumn({ title, icon: Icon, color, count, action, children }: {
    title: string;
    icon: any;
    color: 'cyan' | 'amber' | 'emerald';
    count: number;
    action?: React.ReactNode;
    children: React.ReactNode;
}) {
    const colorStyles = {
        cyan: 'bg-cyan-50 text-cyan-500 border-cyan-100',
        amber: 'bg-amber-50 text-amber-500 border-amber-100',
        emerald: 'bg-emerald-50 text-emerald-500 border-emerald-100',
    };

    return (
        <div className="flex-1 border-r border-stone-100 last:border-r-0 flex flex-col min-w-[260px]">
            <div className="shrink-0 p-4 border-b border-stone-100 flex items-center justify-between bg-white/50">
                <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-md border ${colorStyles[color]}`}>
                        <Icon size={14} />
                    </div>
                    <h3 className="text-base font-bold font-mono uppercase tracking-wider text-stone-800">
                        {title}
                    </h3>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold text-stone-400 bg-stone-100 px-1.5 py-0.5 rounded">
                        {count}
                    </span>
                    {action}
                </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-4 bg-stone-50/20">
                {children}
            </div>
        </div>
    );
}

function AccordionGroup({ title, count, defaultOpen = false, children }: {
    title: string;
    count: number;
    defaultOpen?: boolean;
    children: React.ReactNode;
}) {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <div className="flex flex-col gap-2">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center justify-between w-full group py-1"
            >
                <div className="flex items-center gap-1.5">
                    <ChevronDown size={14} className={`text-stone-400 transition-transform duration-200 ${isOpen ? '' : '-rotate-90'}`} />
                    <span className="text-sm font-bold text-stone-600 group-hover:text-stone-900 transition-colors">
                        {title}
                    </span>
                </div>
                <span className="text-[10px] font-mono text-stone-300">
                    {count}
                </span>
            </button>

            <AnimatePresence initial={false}>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                    >
                        <div className="flex flex-col gap-2 pl-2">
                            {children}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
