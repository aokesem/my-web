import React, { useState } from 'react';
import { X, Save, Loader2 } from 'lucide-react';

interface NewItemFormProps {
    category: string;
    categories: string[];
    onChangeCategory: (cat: string) => void;
    /** 启示：项目内唯一标题 */
    title?: string;
    onChangeTitle?: (val: string) => void;
    content: string;
    onChangeContent: (val: string) => void;
    paperIds: string[];
    onChangePaperIds: (ids: string[]) => void;
    /** 关联调查方向：当前议程版本下的调查方向分条 */
    surveyOptions?: { id: string; title: string }[];
    surveyIds?: string[];
    onChangeSurveyIds?: (ids: string[]) => void;
    relatedPapers: { id: string; directions?: string[]; nickname?: string; title?: string }[];
    availableDirections: string[];
    selectedDirection: string | null;
    onChangeDirection: (dir: string | null) => void;
    isSaving: boolean;
    onSave: () => void;
    onCancel: () => void;
    handleBoldShortcut: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
}

export function NewItemForm({
    category,
    categories,
    onChangeCategory,
    title = '',
    onChangeTitle,
    content,
    onChangeContent,
    paperIds,
    onChangePaperIds,
    surveyOptions = [],
    surveyIds = [],
    onChangeSurveyIds,
    relatedPapers,
    availableDirections,
    selectedDirection,
    onChangeDirection,
    isSaving,
    onSave,
    onCancel,
    handleBoldShortcut
}: NewItemFormProps) {
    const hasSurveyLink = Boolean(surveyOptions.length > 0 && onChangeSurveyIds);
    const [linkTab, setLinkTab] = useState<'papers' | 'surveys'>('papers');

    const filteredPapers = selectedDirection
        ? relatedPapers.filter(p => p.directions?.includes(selectedDirection))
        : relatedPapers;

    const titleOk = onChangeTitle ? title.trim().length > 0 : true;
    const saveDisabled = isSaving || !content.trim() || !titleOk;

    return (
        <div className="p-3 rounded-xl border border-amber-200 bg-amber-50/50 space-y-3 mb-2 shadow-sm">
            <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold uppercase text-amber-600">
                    新增启示
                </span>
                <button type="button" onClick={onCancel} className="p-0.5 text-stone-400 hover:text-stone-600"><X size={12} /></button>
            </div>

            {categories.length > 0 && (
                <div className="flex flex-wrap gap-1">
                    <span className="text-[10px] font-mono text-stone-400 w-full mb-0.5">分类：</span>
                    {categories.map(cat => {
                        const isSelected = category === cat;
                        return (
                            <button
                                key={cat}
                                type="button"
                                onClick={() => onChangeCategory(cat)}
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold transition-all border ${
                                    isSelected
                                        ? 'bg-amber-600 border-amber-600 text-white'
                                        : 'bg-white border-stone-200 text-stone-400 hover:border-stone-300'
                                }`}
                            >{cat}</button>
                        );
                    })}
                </div>
            )}

            {onChangeTitle && (
                <div className="space-y-1">
                    <label className="text-[10px] font-mono font-bold text-stone-400 uppercase">标题（项目内唯一）</label>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => onChangeTitle(e.target.value)}
                        placeholder="如：用户侧动机假设"
                        className="w-full bg-white border border-stone-200 rounded-lg px-2 py-1.5 text-sm text-stone-700 outline-none focus:ring-1 focus:ring-amber-200"
                    />
                </div>
            )}

            <textarea
                value={content}
                onChange={e => onChangeContent(e.target.value)}
                onKeyDown={handleBoldShortcut}
                className="w-full bg-white border border-stone-200 rounded-lg p-2 text-sm text-stone-700 outline-none min-h-[60px] resize-none focus:ring-1 focus:ring-amber-200"
                placeholder="输入内容... (支持 Ctrl+B 加粗)"
                autoFocus
            />

            {hasSurveyLink ? (
                <div className="space-y-2">
                    <div className="flex gap-1 border-b border-stone-200 pb-1">
                        <button
                            type="button"
                            onClick={() => setLinkTab('papers')}
                            className={`px-2 py-1 rounded-md text-[10px] font-bold transition-colors ${
                                linkTab === 'papers'
                                    ? 'bg-amber-600 text-white'
                                    : 'text-stone-500 hover:bg-stone-100'
                            }`}
                        >
                            关联论文
                        </button>
                        <button
                            type="button"
                            onClick={() => setLinkTab('surveys')}
                            className={`px-2 py-1 rounded-md text-[10px] font-bold transition-colors ${
                                linkTab === 'surveys'
                                    ? 'bg-amber-600 text-white'
                                    : 'text-stone-500 hover:bg-stone-100'
                            }`}
                        >
                            关联调查方向
                        </button>
                    </div>
                    {linkTab === 'papers' ? (
                        <>
                            <label className="text-[10px] font-mono font-bold text-stone-400 uppercase">论文（多选，可选）</label>
                            <div className="flex flex-wrap gap-1 mb-1">
                                <button
                                    type="button"
                                    onClick={() => onChangeDirection(null)}
                                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold transition-all border ${
                                        !selectedDirection
                                            ? 'bg-stone-700 border-stone-700 text-white'
                                            : 'bg-white border-stone-200 text-stone-400 hover:border-stone-300'
                                    }`}
                                >
                                    全部
                                </button>
                                {availableDirections.map(dir => {
                                    const isSelected = selectedDirection === dir;
                                    return (
                                        <button
                                            key={dir}
                                            type="button"
                                            onClick={() => onChangeDirection(dir)}
                                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold transition-all border ${
                                                isSelected
                                                    ? 'bg-amber-600 border-amber-600 text-white'
                                                    : 'bg-white border-stone-200 text-stone-400 hover:border-stone-300'
                                            }`}
                                        >
                                            {dir}
                                        </button>
                                    );
                                })}
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                                {filteredPapers.map(p => {
                                    const isSelected = paperIds.includes(p.id);
                                    return (
                                        <button
                                            key={p.id}
                                            type="button"
                                            onClick={() =>
                                                onChangePaperIds(
                                                    isSelected ? paperIds.filter(id => id !== p.id) : [...paperIds, p.id]
                                                )
                                            }
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
                        </>
                    ) : (
                        <>
                            <label className="text-[10px] font-mono font-bold text-stone-400 uppercase">
                                调查方向分条（当前议程版本）
                            </label>
                            <div className="flex flex-wrap gap-1.5">
                                {surveyOptions.map((s) => {
                                    const isSelected = surveyIds.includes(s.id);
                                    return (
                                        <button
                                            key={s.id}
                                            type="button"
                                            onClick={() =>
                                                onChangeSurveyIds!(
                                                    isSelected ? surveyIds.filter((id) => id !== s.id) : [...surveyIds, s.id]
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
                        </>
                    )}
                </div>
            ) : (
            <div className="space-y-2">
                <label className="text-[10px] font-mono font-bold text-stone-400 uppercase">关联论文 (可选)</label>
                <div className="flex flex-wrap gap-1 mb-1">
                    <button
                        type="button"
                        onClick={() => onChangeDirection(null)}
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold transition-all border ${
                            !selectedDirection
                                ? 'bg-stone-700 border-stone-700 text-white'
                                : 'bg-white border-stone-200 text-stone-400 hover:border-stone-300'
                        }`}
                    >全部</button>
                    {availableDirections.map(dir => {
                        const isSelected = selectedDirection === dir;
                        return (
                            <button
                                key={dir}
                                type="button"
                                onClick={() => onChangeDirection(dir)}
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold transition-all border ${
                                    isSelected
                                        ? 'bg-amber-600 border-amber-600 text-white'
                                        : 'bg-white border-stone-200 text-stone-400 hover:border-stone-300'
                                }`}
                            >{dir}</button>
                        );
                    })}
                </div>
                <div className="flex flex-wrap gap-1.5">
                    {filteredPapers.map(p => {
                        const isSelected = paperIds.includes(p.id);
                        return (
                            <button
                                key={p.id}
                                type="button"
                                onClick={() => onChangePaperIds(isSelected ? paperIds.filter(id => id !== p.id) : [...paperIds, p.id])}
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
                <button type="button" onClick={onCancel} className="p-1.5 text-stone-400 hover:text-stone-600 transition-colors"><X size={14}/></button>
                <button
                    type="button"
                    onClick={onSave}
                    disabled={saveDisabled}
                    className="flex items-center gap-1 px-3 py-1 text-white rounded-lg text-xs font-bold transition-all disabled:opacity-50 bg-amber-600 hover:bg-amber-700"
                >
                    {isSaving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                    保存
                </button>
            </div>
        </div>
    );
}
