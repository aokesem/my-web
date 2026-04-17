import React from 'react';
import { Target, Plus, Pencil, Trash2, Link as LinkIcon, Save, Loader2, X } from 'lucide-react';
import { BoardColumn } from './BoardColumn';
import { AccordionGroup } from './AccordionGroup';
import { NewItemForm } from './NewItemForm';
import { renderBoldTextUtil } from './utils';
import { PaperDetail, ProjectOutcome } from '../../types';

interface OutcomesColumnProps {
    filteredOutcomes: { category: string; items: ProjectOutcome[] }[];
    editingId: string | null;
    tempContent: string;
    tempPaperIds: string[];
    isSaving: boolean;
    creatingIn: { type: 'insight' | 'outcome'; category: string } | null;
    newItemContent: string;
    newItemPaperIds: string[];
    newItemDirection: string | null;
    allPapers: PaperDetail[];
    relatedPapers: PaperDetail[];
    availableDirections: string[];
    selectedDirection: string | null;
    filteredPapersForEdit: PaperDetail[];
    
    // Handlers
    setEditingId: (id: string | null) => void;
    setTempContent: (content: string) => void;
    setTempPaperIds: (ids: string[] | ((prev: string[]) => string[])) => void;
    setSelectedDirection: (dir: string | null) => void;
    handleSave: (table: string, junction: string, idField: string) => Promise<void>;
    handleDeleteItem: (type: 'insight' | 'outcome', id: string) => Promise<void>;
    setCreatingIn: (val: { type: 'insight' | 'outcome'; category: string } | null) => void;
    setNewItemContent: (val: string) => void;
    setNewItemPaperIds: (ids: string[]) => void;
    setNewItemDirection: (dir: string | null) => void;
    handleCreateItem: () => Promise<void>;
    handleBoldShortcut: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
    onOpenPaper: (id: string) => void;
}

export function OutcomesColumn({
    filteredOutcomes,
    editingId,
    tempContent,
    tempPaperIds,
    isSaving,
    creatingIn,
    newItemContent,
    newItemPaperIds,
    newItemDirection,
    allPapers,
    relatedPapers,
    availableDirections,
    selectedDirection,
    filteredPapersForEdit,
    setEditingId,
    setTempContent,
    setTempPaperIds,
    setSelectedDirection,
    handleSave,
    handleDeleteItem,
    setCreatingIn,
    setNewItemContent,
    setNewItemPaperIds,
    setNewItemDirection,
    handleCreateItem,
    handleBoldShortcut,
    onOpenPaper
}: OutcomesColumnProps) {
    return (
        <BoardColumn
            title="现有成果 (输出)"
            icon={Target}
            color="emerald"
            count={filteredOutcomes.reduce((acc, c) => acc + c.items.length, 0)}
            action={
                <button
                    onClick={() => {
                        const cat = filteredOutcomes[0]?.category || '默认';
                        setCreatingIn({ type: 'outcome', category: cat });
                        setNewItemContent('');
                        setNewItemPaperIds([]);
                        setNewItemDirection(null);
                    }}
                    className="p-1 rounded-md text-stone-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                >
                    <Plus size={14} />
                </button>
            }
        >
            {/* New Outcome Creator */}
            {creatingIn?.type === 'outcome' && (
                <NewItemForm
                    type="outcome"
                    category={creatingIn.category}
                    categories={filteredOutcomes.map(g => g.category)}
                    onChangeCategory={(cat) => setCreatingIn({ ...creatingIn, category: cat })}
                    content={newItemContent}
                    onChangeContent={setNewItemContent}
                    paperIds={newItemPaperIds}
                    onChangePaperIds={setNewItemPaperIds}
                    relatedPapers={relatedPapers}
                    availableDirections={availableDirections}
                    selectedDirection={newItemDirection}
                    onChangeDirection={setNewItemDirection}
                    isSaving={isSaving}
                    onSave={handleCreateItem}
                    onCancel={() => setCreatingIn(null)}
                    handleBoldShortcut={handleBoldShortcut}
                />
            )}

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
                                    <div className="absolute top-1 right-1 opacity-0 group-hover/item:opacity-100 flex items-center gap-0.5 transition-all z-10">
                                        <button 
                                            onClick={() => {
                                                setEditingId(outcome.id);
                                                setTempContent(outcome.content);
                                                setTempPaperIds(outcome.paper_ids || []);
                                                setSelectedDirection(null);
                                            }}
                                            className="p-1 text-stone-300 hover:text-emerald-500"
                                        >
                                            <Pencil size={11} />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteItem('outcome', outcome.id)}
                                            className="p-1 text-stone-300 hover:text-red-500"
                                        >
                                            <Trash2 size={11} />
                                        </button>
                                    </div>
                                    <div className="flex items-start gap-2.5 p-2 mb-1">
                                        <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0 shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
                                        <div className="flex-1 flex flex-col gap-1">
                                            <span className="text-[15px] text-stone-700 leading-relaxed font-medium pr-6 whitespace-pre-wrap">
                                                {renderBoldTextUtil(outcome.content)}
                                            </span>
                                            <div className="flex flex-wrap gap-x-3 gap-y-1">
                                                {outcome.paper_ids?.map((pid: string) => {
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
    );
}
