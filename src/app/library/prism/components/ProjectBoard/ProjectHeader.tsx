import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, Clock, ChevronUp, ChevronDown, X } from 'lucide-react';
import { ProjectData } from '../../types';

interface ProjectHeaderProps {
    projects: ProjectData[];
    activeProjectName: string;
    setActiveProjectName: (name: string) => void;
    isTimelineOpen: boolean;
    setIsTimelineOpen: (open: boolean) => void;
    selectedTimelineIndex: number | null;
    setSelectedTimelineIndex: (index: number | null) => void;
    activeProject: ProjectData;
    activeTimeRange: { start: number; end: number } | null;
}

export function ProjectHeader({
    projects,
    activeProjectName,
    setActiveProjectName,
    isTimelineOpen,
    setIsTimelineOpen,
    selectedTimelineIndex,
    setSelectedTimelineIndex,
    activeProject,
    activeTimeRange
}: ProjectHeaderProps) {
    return (
        <>
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
                                {activeProject.timeline.map((event: any, i: number) => {
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
        </>
    );
}
