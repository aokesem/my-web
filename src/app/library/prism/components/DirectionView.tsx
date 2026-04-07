'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Target, Loader2 } from 'lucide-react';
import { ReactFlowProvider } from 'reactflow';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import DirectionFlowMap from './DirectionFlowMap';
import DirectionNotesPanel from './DirectionNotesPanel';
import { usePrismDirections } from '../hooks/usePrismDirections';
import type { ProjectData, PaperDetail } from '../types';

// ============================================================
// MAIN DIRECTION VIEW
// ============================================================

interface DirectionViewProps {
    projects: ProjectData[];
    allPapers: PaperDetail[];
    onOpenPaper: (id: string) => void;
}

export default function DirectionView({ projects, allPapers, onOpenPaper }: DirectionViewProps) {
    const [activeProjectId, setActiveProjectId] = useState<string>(projects[0]?.id || '');
    const containerRef = useRef<HTMLDivElement>(null);

    // ---- pixel-based split ----
    const [containerH, setContainerH] = useState(0);
    const [topRatio, setTopRatio] = useState(0.55); // 0-1
    const DIVIDER_H = 12; // px

    // Observe the resizable area's height (pixels)
    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;
        const ro = new ResizeObserver(entries => {
            setContainerH(entries[0].contentRect.height);
        });
        ro.observe(el);
        return () => ro.disconnect();
    }, []);

    const topH = Math.floor((containerH - DIVIDER_H) * topRatio);
    const bottomH = containerH - DIVIDER_H - topH;

    // ---- drag divider ----
    const isDragging = useRef(false);
    const lastY = useRef(0);

    const handleDividerMouseDown = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        isDragging.current = true;
        lastY.current = e.clientY;
        document.body.style.cursor = 'row-resize';
        document.body.style.userSelect = 'none';
    }, []);

    useEffect(() => {
        const onMove = (e: MouseEvent) => {
            if (!isDragging.current || !containerRef.current) return;
            const delta = e.clientY - lastY.current;
            lastY.current = e.clientY;
            const h = containerRef.current.clientHeight - DIVIDER_H;
            if (h <= 0) return;
            setTopRatio(prev => Math.min(0.8, Math.max(0.2, prev + delta / h)));
        };
        const onUp = () => {
            if (!isDragging.current) return;
            isDragging.current = false;
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        };
        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onUp);
        return () => {
            window.removeEventListener('mousemove', onMove);
            window.removeEventListener('mouseup', onUp);
        };
    }, []); // stable: refs only, no deps needed

    const { questions, innovationPoints, leftNotes, rightNoteGroups, isLoading, mutate } = usePrismDirections(activeProjectId || null);

    // ---- front-end edit / delete for question & innovation nodes ----
    const handleEditNode = useCallback(async (id: string, content: string) => {
        const isQuestion = questions.some(q => q.id === id);
        const table = isQuestion ? 'prism_research_questions' : 'prism_innovation_points';
        const { error } = await supabase.from(table).update({ content }).eq('id', id);
        if (error) { toast.error('保存失败'); return; }
        toast.success('已保存');
        // Don't call mutate() here — avoids re-layout, local text is already updated
    }, [questions]);

    const handleDeleteNode = useCallback(async (id: string) => {
        if (!confirm('确定删除此节点？')) return;
        const isQuestion = questions.some(q => q.id === id);
        const table = isQuestion ? 'prism_research_questions' : 'prism_innovation_points';
        const { error } = await supabase.from(table).delete().eq('id', id);
        if (error) { toast.error('删除失败'); return; }
        toast.success('已删除');
        mutate();
    }, [questions, mutate]);

    if (!projects.length) {
        return (
            <div className="flex-1 flex items-center justify-center text-stone-400 font-mono text-sm py-20">
                NO PROJECTS FOUND
            </div>
        );
    }

    return (
        <div className="flex-1 w-full max-w-[1400px] mx-auto px-18 pb-6 flex flex-col h-[calc(100vh-220px)] overflow-hidden">
            <div className="bg-white rounded-3xl border border-stone-200/70 shadow-sm flex flex-col overflow-hidden flex-1">

                {/* Project Selector */}
                <div className="shrink-0 px-6 py-4 flex items-center gap-2 overflow-x-auto custom-scrollbar border-b border-stone-100 bg-stone-50/50">
                    {projects.map(proj => (
                        <button
                            key={proj.id}
                            onClick={() => setActiveProjectId(proj.id)}
                            className={`
                                flex items-center gap-2 px-4 py-2 rounded-xl text-[14px] font-medium transition-all duration-200 whitespace-nowrap shrink-0
                                ${activeProjectId === proj.id
                                    ? 'bg-violet-600 text-white shadow-md shadow-violet-600/20 font-bold'
                                    : 'bg-white text-stone-600 hover:text-violet-600 border border-stone-200/60 hover:border-violet-200'
                                }
                            `}
                        >
                            {activeProjectId === proj.id && <Target size={14} className="text-violet-200" />}
                            <span>{proj.name}</span>
                        </button>
                    ))}
                </div>

                {/* Content area — ref always mounted so ResizeObserver works */}
                <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar" ref={containerRef}>
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center h-full">
                            <Loader2 size={32} className="animate-spin text-stone-300 mb-3" />
                            <span className="text-sm font-mono text-stone-400">加载研究数据...</span>
                        </div>
                    ) : containerH > 0 ? (
                        <>
                            {/* Upper: Flow Map */}
                            <div style={{ width: '100%', height: topH, position: 'relative', flexShrink: 0 }}>
                                <ReactFlowProvider>
                                    <DirectionFlowMap
                                        questions={questions}
                                        innovationPoints={innovationPoints}
                                        allPapers={allPapers}
                                        onOpenPaper={onOpenPaper}
                                        onEditNode={handleEditNode}
                                        onDeleteNode={handleDeleteNode}
                                    />
                                </ReactFlowProvider>
                            </div>

                            {/* Divider */}
                            <div
                                onMouseDown={handleDividerMouseDown}
                                style={{ height: DIVIDER_H, flexShrink: 0 }}
                                className="cursor-row-resize flex items-center justify-center group hover:bg-violet-50/60 transition-colors relative z-20"
                            >
                                <div className="w-12 h-1 rounded-full bg-stone-200 group-hover:bg-violet-400 group-hover:w-20 transition-all" />
                            </div>

                            {/* Lower: Notes Panel — minHeight allows global scroll */}
                            <div style={{ width: '100%', minHeight: bottomH, display: 'flex', flexDirection: 'column' }}>
                                <DirectionNotesPanel
                                    questions={questions}
                                    leftNotes={leftNotes}
                                    rightNoteGroups={rightNoteGroups}
                                    allPapers={allPapers}
                                    projectId={activeProjectId}
                                    onOpenPaper={onOpenPaper}
                                    mutate={mutate}
                                />
                            </div>
                        </>
                    ) : null}
                </div>
            </div>
        </div>
    );
}
