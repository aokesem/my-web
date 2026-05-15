'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Target, Loader2, GitBranch } from 'lucide-react';
import { ReactFlowProvider } from 'reactflow';
import AgendaChainFlowMap from './AgendaChainFlowMap';
import { useProjectAgenda, useAgendaVersionItems } from '../hooks/useProjectAgenda';
import type { ProjectData, ProjectAgendaVersion, ProjectInsight } from '../types';

function formatVersionOption(v: ProjectAgendaVersion) {
    if (v.label?.trim()) return v.label.trim();
    const d = new Date(v.created_at);
    return d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

const DISPLAY_MODES = [
    { id: 'agenda_chain', label: '议程链' },
] as const;

interface DirectionViewProps {
    projects: ProjectData[];
}

export default function DirectionView({ projects }: DirectionViewProps) {
    const [activeProjectId, setActiveProjectId] = useState<string>(projects[0]?.id || '');
    const [versionId, setVersionId] = useState<string | null>(null);
    const [displayMode, setDisplayMode] = useState<string>('agenda_chain');

    const { versions, isLoading: isLoadingVersions } = useProjectAgenda(activeProjectId || null);
    const { bundle, isLoading: isLoadingItems } = useAgendaVersionItems(versionId);

    useEffect(() => {
        if (versions.length > 0) {
            setVersionId(versions[0].id);
        } else {
            setVersionId(null);
        }
    }, [activeProjectId, versions]);

    const projectInsights = useMemo((): ProjectInsight[] => {
        const proj = projects.find((p) => p.id === activeProjectId);
        if (!proj) return [];
        return proj.insights.flatMap((cat) => cat.items);
    }, [projects, activeProjectId]);

    const isLoading = isLoadingVersions || (versionId ? isLoadingItems : false);

    if (!projects.length) {
        return (
            <div className="flex-1 flex items-center justify-center text-stone-400 font-mono text-sm py-20">
                NO PROJECTS FOUND
            </div>
        );
    }

    return (
        <div className="flex-1 w-full max-w-[1400px] mx-auto px-18 pb-6 flex flex-col h-[calc(100vh-220px)] overflow-hidden">
            <div className="bg-white rounded-3xl border border-stone-200/70 shadow-sm flex flex-col overflow-hidden flex-1 min-h-0">

                {/* Project selector */}
                <div className="shrink-0 px-6 py-4 flex items-center gap-2 overflow-x-auto custom-scrollbar border-b border-stone-100 bg-stone-50/50">
                    {projects.map((proj) => (
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

                {/* Toolbar: display mode + agenda version */}
                <div className="shrink-0 px-6 py-3 flex flex-wrap items-center gap-4 border-b border-stone-100 bg-white">
                    <div className="flex items-center gap-2">
                        <GitBranch size={14} className="text-stone-400" />
                        <label className="text-xs font-medium text-stone-500">展示模式</label>
                        <select
                            value={displayMode}
                            onChange={(e) => setDisplayMode(e.target.value)}
                            className="rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-sm text-stone-800 outline-none focus:ring-1 focus:ring-violet-200"
                        >
                            {DISPLAY_MODES.map((m) => (
                                <option key={m.id} value={m.id}>{m.label}</option>
                            ))}
                        </select>
                    </div>

                    {versions.length > 0 && (
                        <div className="flex items-center gap-2">
                            <label className="text-xs font-medium text-stone-500">议程版本</label>
                            <select
                                value={versionId ?? ''}
                                onChange={(e) => setVersionId(e.target.value || null)}
                                className="rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-sm text-stone-800 outline-none focus:ring-1 focus:ring-violet-200 min-w-[160px]"
                            >
                                {versions.map((v) => (
                                    <option key={v.id} value={v.id}>
                                        {formatVersionOption(v)}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>

                {/* Flow map — full remaining height */}
                <div className="flex-1 min-h-0 relative">
                    {isLoading ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <Loader2 size={32} className="animate-spin text-stone-300 mb-3" />
                            <span className="text-sm font-mono text-stone-400">加载议程数据...</span>
                        </div>
                    ) : versions.length === 0 ? (
                        <div className="absolute inset-0 flex items-center justify-center p-8">
                            <p className="text-sm text-stone-500 text-center leading-relaxed max-w-md">
                                该项目尚无议程版本。请在管理后台「认知棱镜 → 项目管理 → 研究议程版本」中新建。
                            </p>
                        </div>
                    ) : displayMode === 'agenda_chain' ? (
                        <div className="absolute inset-0">
                            <ReactFlowProvider>
                                <AgendaChainFlowMap
                                    surveys={bundle.survey}
                                    insights={projectInsights}
                                    synthesisItems={bundle.synthesis}
                                />
                            </ReactFlowProvider>
                        </div>
                    ) : null}
                </div>
            </div>
        </div>
    );
}
