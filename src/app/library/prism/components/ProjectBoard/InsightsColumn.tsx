import React, { useState } from 'react';
import { Lightbulb, Plus, Pencil, Trash2, Link as LinkIcon, Save, Loader2, X, Waypoints } from 'lucide-react';
import { BoardColumn } from './BoardColumn';
import { AccordionGroup } from './AccordionGroup';
import { NewItemForm } from './NewItemForm';
import { renderBoldTextUtil } from './utils';
import { PaperDetail, ProjectInsight } from '../../types';

interface InsightsColumnProps {
    filteredInsights: { category: string; items: ProjectInsight[] }[];
    editingId: string | null;
    tempTitle: string;
    tempContent: string;
    tempPaperIds: string[];
    tempSurveyIds: string[];
    isSaving: boolean;
    creatingIn: { category: string } | null;
    newItemTitle: string;
    newItemContent: string;
    newItemPaperIds: string[];
    newItemSurveyIds: string[];
    newItemDirection: string | null;
    allPapers: PaperDetail[];
    relatedPapers: PaperDetail[];
    availableDirections: string[];
    selectedDirection: string | null;
    filteredPapersForEdit: PaperDetail[];
    surveyItemOptions: { id: string; title: string }[];

    setEditingId: (id: string | null) => void;
    setTempTitle: (t: string) => void;
    setTempContent: (content: string) => void;
    setTempPaperIds: (ids: string[] | ((prev: string[]) => string[])) => void;
    setTempSurveyIds: (ids: string[] | ((prev: string[]) => string[])) => void;
    setSelectedDirection: (dir: string | null) => void;
    handleSave: () => Promise<void>;
    handleDeleteItem: (id: string) => Promise<void>;
    setCreatingIn: (val: { category: string } | null) => void;
    setNewItemTitle: (val: string) => void;
    setNewItemContent: (val: string) => void;
    setNewItemPaperIds: (ids: string[]) => void;
    setNewItemSurveyIds: (ids: string[]) => void;
    setNewItemDirection: (dir: string | null) => void;
    handleCreateItem: () => Promise<void>;
    handleBoldShortcut: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
    onOpenPaper: (id: string) => void;
    isAdmin: boolean;
}

export function InsightsColumn({
    filteredInsights,
    editingId,
    tempTitle,
    tempContent,
    tempPaperIds,
    tempSurveyIds,
    isSaving,
    creatingIn,
    newItemTitle,
    newItemContent,
    newItemPaperIds,
    newItemSurveyIds,
    newItemDirection,
    allPapers,
    relatedPapers,
    availableDirections,
    selectedDirection,
    filteredPapersForEdit,
    surveyItemOptions,
    setEditingId,
    setTempTitle,
    setTempContent,
    setTempPaperIds,
    setTempSurveyIds,
    setSelectedDirection,
    handleSave,
    handleDeleteItem,
    setCreatingIn,
    setNewItemTitle,
    setNewItemContent,
    setNewItemPaperIds,
    setNewItemSurveyIds,
    setNewItemDirection,
    handleCreateItem,
    handleBoldShortcut,
    onOpenPaper,
    isAdmin
}: InsightsColumnProps) {
    const hasSurveyLink = surveyItemOptions.length > 0;
    const [editLinkTab, setEditLinkTab] = useState<'papers' | 'surveys'>('papers');

    return (
        <BoardColumn
            title="启示整理"
            icon={Lightbulb}
            color="amber"
            count={filteredInsights.reduce((acc, c) => acc + c.items.length, 0)}
            action={isAdmin ? (
                <button
                    onClick={() => {
                        const cat = filteredInsights[0]?.category || '默认';
                        setCreatingIn({ category: cat });
                        setNewItemTitle('');
                        setNewItemContent('');
                        setNewItemPaperIds([]);
                        setNewItemSurveyIds([]);
                        setNewItemDirection(null);
                    }}
                    className="p-1 rounded-md text-stone-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                >
                    <Plus size={14} />
                </button>
            ) : null}
        >
            {isAdmin && creatingIn && (
                <NewItemForm
                    category={creatingIn.category}
                    categories={filteredInsights.map(g => g.category)}
                    onChangeCategory={(cat) => setCreatingIn({ ...creatingIn, category: cat })}
                    title={newItemTitle}
                    onChangeTitle={setNewItemTitle}
                    content={newItemContent}
                    onChangeContent={setNewItemContent}
                    paperIds={newItemPaperIds}
                    onChangePaperIds={setNewItemPaperIds}
                    surveyOptions={surveyItemOptions}
                    surveyIds={newItemSurveyIds}
                    onChangeSurveyIds={setNewItemSurveyIds}
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

            {filteredInsights.map(group => (
                <AccordionGroup key={group.category} title={group.category} count={group.items.length} defaultOpen={true}>
                    {group.items.map(insight => (
                        <div key={insight.id} className="p-3 rounded-xl border border-stone-200/60 bg-amber-50/30 hover:bg-white transition-colors relative group/item">
                            {editingId === insight.id ? (
                                <div className="space-y-3">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-mono font-bold text-stone-400 uppercase">标题</label>
                                        <input
                                            type="text"
                                            value={tempTitle}
                                            onChange={(e) => setTempTitle(e.target.value)}
                                            className="w-full bg-white border border-stone-200 rounded-lg px-3 py-2 text-base font-bold text-stone-900 focus:ring-1 focus:ring-amber-200 outline-none"
                                        />
                                    </div>
                                    <textarea 
                                        value={tempContent}
                                        onChange={e => setTempContent(e.target.value)}
                                        onKeyDown={handleBoldShortcut}
                                        className="w-full bg-white border border-stone-200 rounded-lg p-3 text-base text-stone-700 focus:ring-1 focus:ring-amber-200 outline-none min-h-[80px]"
                                        placeholder="支持 Ctrl+B 加粗"
                                    />
                                    {hasSurveyLink ? (
                                        <div className="space-y-2">
                                            <div className="flex gap-1 border-b border-stone-200 pb-1">
                                                <button
                                                    type="button"
                                                    onClick={() => setEditLinkTab('papers')}
                                                    className={`px-2 py-1 rounded-md text-[10px] font-bold ${
                                                        editLinkTab === 'papers'
                                                            ? 'bg-amber-600 text-white'
                                                            : 'text-stone-500 hover:bg-stone-100'
                                                    }`}
                                                >
                                                    关联论文
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setEditLinkTab('surveys')}
                                                    className={`px-2 py-1 rounded-md text-[10px] font-bold ${
                                                        editLinkTab === 'surveys'
                                                            ? 'bg-amber-600 text-white'
                                                            : 'text-stone-500 hover:bg-stone-100'
                                                    }`}
                                                >
                                                    关联调查方向
                                                </button>
                                            </div>
                                            {editLinkTab === 'papers' ? (
                                                <div className="space-y-2">
                                                    <div className="flex flex-wrap gap-1 mb-1.5">
                                                        <button
                                                            type="button"
                                                            onClick={() => setSelectedDirection(null)}
                                                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold transition-all border ${
                                                                !selectedDirection
                                                                    ? 'bg-stone-700 border-stone-700 text-white'
                                                                    : 'bg-white border-stone-200 text-stone-400 hover:border-amber-300'
                                                            }`}
                                                        >全部</button>
                                                        {availableDirections.map(dir => (
                                                            <button
                                                                key={dir}
                                                                type="button"
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
                                                                    type="button"
                                                                    onClick={() => {
                                                                        setTempPaperIds(prev => isSelected ? prev.filter(id => id !== p.id) : [...prev, p.id]);
                                                                    }}
                                                                    className={`px-2 py-1 rounded-md text-[11px] font-medium transition-all border ${
                                                                        isSelected 
                                                                            ? 'bg-amber-100 border-amber-300 text-amber-800' 
                                                                            : 'bg-stone-50 border-stone-200 text-stone-500 hover:border-stone-300'
                                                                    }`}
                                                                >
                                                                    {p.nickname || p.title?.slice(0, 15)}
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex flex-wrap gap-1.5">
                                                    {surveyItemOptions.map((s) => {
                                                        const isSelected = tempSurveyIds.includes(s.id);
                                                        return (
                                                            <button
                                                                key={s.id}
                                                                type="button"
                                                                onClick={() =>
                                                                    setTempSurveyIds((prev) =>
                                                                        isSelected ? prev.filter((id) => id !== s.id) : [...prev, s.id]
                                                                    )
                                                                }
                                                                className={`px-2 py-1 rounded-md text-[11px] font-medium transition-all border max-w-full truncate ${
                                                                    isSelected
                                                                        ? 'bg-amber-100 border-amber-300 text-amber-800'
                                                                        : 'bg-stone-50 border-stone-200 text-stone-500 hover:border-stone-300'
                                                                }`}
                                                                title={s.title}
                                                            >
                                                                {s.title}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-mono font-bold text-stone-400 uppercase">关联论文 (多选)</label>
                                            <div className="flex flex-wrap gap-1 mb-1.5">
                                                <button
                                                    type="button"
                                                    onClick={() => setSelectedDirection(null)}
                                                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold transition-all border ${
                                                        !selectedDirection
                                                            ? 'bg-stone-700 border-stone-700 text-white'
                                                            : 'bg-white border-stone-200 text-stone-400 hover:border-amber-300'
                                                    }`}
                                                >全部</button>
                                                {availableDirections.map(dir => (
                                                    <button
                                                        key={dir}
                                                        type="button"
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
                                                            type="button"
                                                            onClick={() => {
                                                                setTempPaperIds(prev => isSelected ? prev.filter(id => id !== p.id) : [...prev, p.id]);
                                                            }}
                                                            className={`px-2 py-1 rounded-md text-[11px] font-medium transition-all border ${
                                                                isSelected 
                                                                    ? 'bg-amber-100 border-amber-300 text-amber-800' 
                                                                    : 'bg-stone-50 border-stone-200 text-stone-500 hover:border-stone-300'
                                                            }`}
                                                        >
                                                            {p.nickname || p.title?.slice(0, 15)}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                    <div className="flex justify-end gap-2 pt-1">
                                        <button type="button" onClick={() => setEditingId(null)} className="p-1.5 text-stone-400 hover:text-stone-600 transition-colors"><X size={14}/></button>
                                        <button 
                                            type="button"
                                            onClick={() => void handleSave()}
                                            disabled={isSaving || !tempTitle.trim()}
                                            className="flex items-center gap-1 px-3 py-1 bg-amber-600 text-white rounded-lg text-xs font-bold hover:bg-amber-700 transition-colors disabled:opacity-50"
                                        >
                                            {isSaving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                                            保存
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="absolute top-2 right-2 opacity-0 group-hover/item:opacity-100 flex items-center gap-0.5 transition-all z-10">
                                        <button 
                                            type="button"
                                            onClick={() => {
                                                setEditingId(insight.id);
                                                setTempTitle(insight.title);
                                                setTempContent(insight.content);
                                                setTempPaperIds(insight.paper_ids || []);
                                                setTempSurveyIds(insight.survey_ids || []);
                                                setSelectedDirection(null);
                                                setEditLinkTab('papers');
                                            }}
                                            className="p-1.5 text-stone-400 hover:text-amber-600 hover:bg-amber-50 rounded-md"
                                        >
                                            <Pencil size={12} />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleDeleteItem(insight.id)}
                                            className="p-1.5 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-md"
                                        >
                                            <Trash2 size={12} />
                                        </button>
                                    </div>
                                    <div className="text-base font-bold text-stone-900 mb-1 pr-14 leading-snug" title={insight.title}>
                                        {insight.title}
                                    </div>
                                    <div className="text-base text-stone-700 leading-relaxed mb-2 pr-14 whitespace-pre-wrap">
                                        {renderBoldTextUtil(insight.content)}
                                    </div>
                                    {(insight.paper_ids?.length ?? 0) > 0 && (
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            {insight.paper_ids?.map((pid: string) => {
                                                const linkedPaper = allPapers.find(p => p.id === pid);
                                                if (!linkedPaper) return null;
                                                return (
                                                    <button
                                                        key={pid}
                                                        type="button"
                                                        onClick={() => onOpenPaper(pid)}
                                                        className="flex items-center gap-1.5 px-2 py-1 bg-white border border-stone-100 rounded-lg text-[12px] font-mono text-blue-500 hover:bg-stone-50 hover:text-amber-600 transition-colors border-dashed"
                                                    >
                                                        <LinkIcon size={10} className="shrink-0" />
                                                        <span className="truncate max-w-[150px]">{linkedPaper.nickname || linkedPaper.title}</span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    )}
                                    {(insight.survey_ids || []).length > 0 && (
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            {(insight.survey_ids || []).map((sid) => {
                                                const opt = surveyItemOptions.find((o) => o.id === sid);
                                                if (!opt) return null;
                                                return (
                                                    <span
                                                        key={sid}
                                                        className="inline-flex items-center gap-1.5 px-2 py-1 bg-white border border-teal-100 rounded-lg text-[12px] font-mono text-teal-600 border-dashed max-w-full"
                                                        title={opt.title}
                                                    >
                                                        <Waypoints size={10} className="shrink-0 text-teal-500" />
                                                        <span className="truncate max-w-[150px]">{opt.title}</span>
                                                    </span>
                                                );
                                            })}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    ))}
                </AccordionGroup>
            ))}
        </BoardColumn>
    );
}
