import React from 'react';
import { FileText, Plus, X } from 'lucide-react';
import { BoardColumn } from './BoardColumn';
import { AccordionGroup } from './AccordionGroup';
import { PaperDetail } from '../../types';

interface PapersColumnProps {
    relatedPapers: PaperDetail[];
    paperGroupMode: 'direction' | 'type' | 'depth';
    setPaperGroupMode: (mode: 'direction' | 'type' | 'depth') => void;
    isAddingPaper: boolean;
    setIsAddingPaper: (val: boolean) => void;
    addPaperDirection: string | null;
    setAddPaperDirection: (dir: string | null) => void;
    availableAllDirections: string[];
    papersNotInProject: PaperDetail[];
    handleAddPaperToProject: (id: string) => Promise<void>;
    isSaving: boolean;
    papersGrouped: { category: string; papers: PaperDetail[] }[];
    onOpenPaper: (id: string) => void;
}

export function PapersColumn({
    relatedPapers,
    paperGroupMode,
    setPaperGroupMode,
    isAddingPaper,
    setIsAddingPaper,
    addPaperDirection,
    setAddPaperDirection,
    availableAllDirections,
    papersNotInProject,
    handleAddPaperToProject,
    isSaving,
    papersGrouped,
    onOpenPaper
}: PapersColumnProps) {
    return (
        <BoardColumn
            title="关联论文 (素材)"
            icon={FileText}
            color="cyan"
            count={relatedPapers.length}
            action={
                <div className="flex items-center gap-1.5">
                    <select
                        value={paperGroupMode}
                        onChange={(e) => setPaperGroupMode(e.target.value as any)}
                        className="bg-white/50 border border-stone-200/60 text-stone-500 hover:text-stone-700 text-[13px] rounded px-1.5 py-0.5 outline-none font-mono focus:ring-1 focus:ring-cyan-200 transition-all cursor-pointer"
                    >
                        <option value="direction">按方向</option>
                        <option value="type">按性质</option>
                        <option value="depth">按阅读</option>
                    </select>
                    <button
                        onClick={() => { setIsAddingPaper(!isAddingPaper); setAddPaperDirection(null); }}
                        className={`p-1 rounded-md transition-colors ${isAddingPaper ? 'bg-cyan-100 text-cyan-600' : 'text-stone-400 hover:text-cyan-600 hover:bg-cyan-50'}`}
                    >
                        <Plus size={14} />
                    </button>
                </div>
            }
        >
            {/* Paper Add Selector */}
            {isAddingPaper && (
                <div className="p-3 rounded-xl border border-cyan-200 bg-cyan-50/50 space-y-2 mb-2">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono font-bold text-cyan-600 uppercase">添加论文到项目</span>
                        <button onClick={() => { setIsAddingPaper(false); setAddPaperDirection(null); }} className="p-0.5 text-stone-400 hover:text-stone-600"><X size={12} /></button>
                    </div>
                    {/* Direction filter */}
                    <div className="flex flex-wrap gap-1">
                        {availableAllDirections.map(dir => (
                            <button
                                key={dir}
                                onClick={() => setAddPaperDirection(addPaperDirection === dir ? null : dir)}
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold transition-all border ${
                                    addPaperDirection === dir
                                    ? 'bg-cyan-600 border-cyan-600 text-white'
                                    : 'bg-white border-stone-200 text-stone-400 hover:border-cyan-300'
                                }`}
                            >{dir}</button>
                        ))}
                    </div>
                    {/* Paper list to add */}
                    {addPaperDirection && (
                        <div className="max-h-[200px] overflow-y-auto custom-scrollbar space-y-1 pt-1">
                            {papersNotInProject
                                .filter(p => p.directions?.includes(addPaperDirection))
                                .map(p => (
                                    <button
                                        key={p.id}
                                        onClick={() => handleAddPaperToProject(p.id)}
                                        disabled={isSaving}
                                        className="w-full text-left p-2 rounded-lg bg-white border border-stone-200 hover:border-cyan-400 hover:bg-cyan-50 text-sm text-stone-700 transition-colors disabled:opacity-50"
                                    >
                                        {p.nickname || p.title}
                                    </button>
                                ))
                            }
                            {papersNotInProject.filter(p => p.directions?.includes(addPaperDirection!)).length === 0 && (
                                <p className="text-[11px] text-stone-400 text-center py-2">该方向下无可添加的论文</p>
                            )}
                        </div>
                    )}
                </div>
            )}

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
    );
}
