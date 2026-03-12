import React, { useState, useMemo } from 'react';
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
} from 'lucide-react';
import type { PaperDetail } from './PaperDetailModal';

// ============================================================
// TYPES
// ============================================================

export interface ProjectTimelineEvent {
    id: string;
    date: string;
    content: string;
}

export interface ProjectInsight {
    id: string;
    content: string;
    paper_id?: string;
}

export interface ProjectOutcome {
    id: string;
    content: string;
}

export interface ProjectCategory<T> {
    category: string;
    items: T[];
}

export interface ProjectData {
    name: string;
    timeline: ProjectTimelineEvent[];
    insights: ProjectCategory<ProjectInsight>[];
    outcomes: ProjectCategory<ProjectOutcome>[];
}

interface ProjectViewProps {
    projects: ProjectData[];
    allPapers: PaperDetail[];
    onOpenPaper: (id: string) => void;
}

// ============================================================
// COMPONENT
// ============================================================

export default function ProjectView({ projects, allPapers, onOpenPaper }: ProjectViewProps) {
    const [activeProjectName, setActiveProjectName] = useState<string>(projects[0]?.name || '');
    const [isTimelineOpen, setIsTimelineOpen] = useState(false);
    const [paperGroupMode, setPaperGroupMode] = useState<'direction' | 'type' | 'depth'>('direction');

    // Group papers by direction for the active project
    const activeProject = projects.find(p => p.name === activeProjectName);

    const relatedPapers = useMemo(() => {
        if (!activeProjectName) return [];
        return allPapers.filter(p => p.projects.includes(activeProjectName));
    }, [allPapers, activeProjectName]);

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
                                    {activeProject.timeline.map((event, i) => (
                                        <div key={event.id} className="relative pl-6">
                                            <div className="absolute left-px top-1.5 w-1.5 h-1.5 rounded-full bg-violet-400 ring-4 ring-stone-50" />
                                            <div className="flex items-baseline gap-3">
                                                <span className="text-[10px] font-mono font-bold text-violet-500 bg-violet-100 px-1.5 py-0.5 rounded shrink-0">
                                                    {event.date}
                                                </span>
                                                <span className="text-sm text-stone-600 leading-snug">
                                                    {event.content}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

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
                        count={activeProject.insights.reduce((acc, c) => acc + c.items.length, 0)}
                    >
                        {activeProject.insights.map(group => (
                            <AccordionGroup key={group.category} title={group.category} count={group.items.length} defaultOpen={true}>
                                {group.items.map(insight => (
                                    <div key={insight.id} className="p-3 rounded-xl border border-stone-200/60 bg-amber-50/30 hover:bg-white transition-colors relative group">
                                        <div className="text-base text-stone-700 leading-relaxed mb-2">
                                            {insight.content}
                                        </div>
                                        {insight.paper_id && (() => {
                                            const linkedPaper = allPapers.find(p => p.id === insight.paper_id);
                                            const pName = linkedPaper ? (linkedPaper.nickname || linkedPaper.title) : '未知论文';
                                            return (
                                                <button
                                                    onClick={() => onOpenPaper(insight.paper_id!)}
                                                    className="w-full flex items-center justify-between px-2 py-1.5 mt-2 bg-white border border-stone-100 rounded-lg text-[13px] font-mono text-blue-500 hover:bg-stone-50 hover:text-amber-600 transition-colors group-hover:border-amber-200"
                                                >
                                                    <span className="flex items-center gap-1.5 overflow-hidden">
                                                        <LinkIcon size={10} className="shrink-0" />
                                                        <span className="truncate">{pName}</span>
                                                    </span>
                                                    <ChevronRight size={12} className="opacity-50 shrink-0 ml-1" />
                                                </button>
                                            );
                                        })()}
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
                        count={activeProject.outcomes.reduce((acc, c) => acc + c.items.length, 0)}
                    >
                        {activeProject.outcomes.map(group => (
                            <AccordionGroup key={group.category} title={group.category} count={group.items.length} defaultOpen={true}>
                                {group.items.map(outcome => (
                                    <div key={outcome.id} className="flex items-start gap-2.5 p-1 mb-1">
                                        <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0 shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
                                        <span className="text-[15px] text-stone-700 leading-relaxed font-medium">
                                            {outcome.content}
                                        </span>
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
