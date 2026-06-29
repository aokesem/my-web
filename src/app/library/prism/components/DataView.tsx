'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { Database, Loader2, Search, X, Plus, Save, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import type { PaperDetail, PrismDataset, PrismMetric } from '../types';
import {
    usePrismPaperData,
    savePaperDataNotes,
    togglePaperDataset,
    togglePaperMetric,
    createDataset,
    createMetric,
    updateDataset,
    updateMetric,
    deleteDataset,
    deleteMetric,
    paperHasData,
} from '../hooks/usePrismPaperData';
import { LatexNoteField } from './LatexRichText';

type ViewMode = 'paper' | 'library';
type DictKind = 'datasets' | 'metrics';

interface DataViewProps {
    papers: PaperDetail[];
    isAdmin: boolean;
}

export default function DataView({ papers, isAdmin }: DataViewProps) {
    const { bundle, isLoading, mutate } = usePrismPaperData();
    const [viewMode, setViewMode] = useState<ViewMode>('paper');
    const [paperSearch, setPaperSearch] = useState('');
    const [selectedPaperId, setSelectedPaperId] = useState<string | null>(null);

    const [dictKind, setDictKind] = useState<DictKind>('datasets');
    const [dictSearch, setDictSearch] = useState('');
    const [selectedDictId, setSelectedDictId] = useState<string | null>(null);

    const [notesDraft, setNotesDraft] = useState('');
    const [savingNotes, setSavingNotes] = useState(false);
    const [newDatasetName, setNewDatasetName] = useState('');
    const [newMetricName, setNewMetricName] = useState('');
    const [onlyWithData, setOnlyWithData] = useState(true);
    const [newDictName, setNewDictName] = useState('');

    const requireAdmin = useCallback(() => {
        if (!isAdmin) {
            toast.warning('只有本人才能修改认知棱镜。');
            return false;
        }
        return true;
    }, [isAdmin]);

    const filteredPapers = useMemo(() => {
        const q = paperSearch.trim().toLowerCase();
        let list = [...papers];
        if (onlyWithData) {
            list = list.filter((p) => paperHasData(p.id, bundle));
        }
        if (q) {
            list = list.filter(
                (p) =>
                    (p.title || '').toLowerCase().includes(q) ||
                    (p.nickname || '').toLowerCase().includes(q),
            );
        }
        return list;
    }, [papers, paperSearch, onlyWithData, bundle]);

    const activePaper = useMemo(
        () => papers.find((p) => p.id === selectedPaperId) ?? null,
        [papers, selectedPaperId],
    );

    const paperLinks = selectedPaperId
        ? bundle.linksByPaper[selectedPaperId] ?? { datasetIds: [], metricIds: [] }
        : { datasetIds: [], metricIds: [] };

    const selectPaper = useCallback(
        (id: string) => {
            setSelectedPaperId(id);
            setNotesDraft(bundle.notesByPaper[id] ?? '');
        },
        [bundle.notesByPaper],
    );

    React.useEffect(() => {
        if (filteredPapers.length === 0) {
            setSelectedPaperId(null);
            return;
        }
        const stillVisible = filteredPapers.some((p) => p.id === selectedPaperId);
        if (!selectedPaperId || !stillVisible) {
            selectPaper(filteredPapers[0].id);
        }
    }, [filteredPapers, selectedPaperId, selectPaper]);

    React.useEffect(() => {
        if (selectedPaperId) {
            setNotesDraft(bundle.notesByPaper[selectedPaperId] ?? '');
        }
    }, [selectedPaperId, bundle.notesByPaper]);

    const handleSaveNotes = async () => {
        if (!requireAdmin()) return;
        if (!selectedPaperId) return;
        setSavingNotes(true);
        try {
            await savePaperDataNotes(selectedPaperId, notesDraft);
            toast.success('数据说明已保存');
            await mutate();
        } catch (e: unknown) {
            toast.error('保存失败: ' + (e instanceof Error ? e.message : String(e)));
        } finally {
            setSavingNotes(false);
        }
    };

    const handleToggleDataset = async (datasetId: string) => {
        if (!requireAdmin()) return;
        if (!selectedPaperId) return;
        const linked = paperLinks.datasetIds.includes(datasetId);
        try {
            await togglePaperDataset(selectedPaperId, datasetId, linked);
            await mutate();
        } catch (e: unknown) {
            toast.error('更新失败: ' + (e instanceof Error ? e.message : String(e)));
        }
    };

    const handleToggleMetric = async (metricId: string) => {
        if (!requireAdmin()) return;
        if (!selectedPaperId) return;
        const linked = paperLinks.metricIds.includes(metricId);
        try {
            await togglePaperMetric(selectedPaperId, metricId, linked);
            await mutate();
        } catch (e: unknown) {
            toast.error('更新失败: ' + (e instanceof Error ? e.message : String(e)));
        }
    };

    const handleCreateAndLinkDataset = async () => {
        if (!requireAdmin()) return;
        if (!selectedPaperId || !newDatasetName.trim()) return;
        try {
            const created = await createDataset(newDatasetName.trim());
            await togglePaperDataset(selectedPaperId, created.id, false);
            setNewDatasetName('');
            toast.success('已创建并关联');
            await mutate();
        } catch (e: unknown) {
            toast.error('创建失败: ' + (e instanceof Error ? e.message : String(e)));
        }
    };

    const handleCreateAndLinkMetric = async () => {
        if (!requireAdmin()) return;
        if (!selectedPaperId || !newMetricName.trim()) return;
        try {
            const created = await createMetric(newMetricName.trim());
            await togglePaperMetric(selectedPaperId, created.id, false);
            setNewMetricName('');
            toast.success('已创建并关联');
            await mutate();
        } catch (e: unknown) {
            toast.error('创建失败: ' + (e instanceof Error ? e.message : String(e)));
        }
    };

    const dictList = dictKind === 'datasets' ? bundle.datasets : bundle.metrics;
    const filteredDict = useMemo(() => {
        const q = dictSearch.trim().toLowerCase();
        if (!q) return dictList;
        return dictList.filter((d) => d.name.toLowerCase().includes(q));
    }, [dictList, dictSearch]);

    const selectedDict = filteredDict.find((d) => d.id === selectedDictId) ?? filteredDict[0] ?? null;

    React.useEffect(() => {
        if (viewMode === 'library' && filteredDict.length > 0 && !selectedDictId) {
            setSelectedDictId(filteredDict[0].id);
        }
    }, [viewMode, filteredDict, selectedDictId]);

    const papersForDict = useMemo(() => {
        if (!selectedDict) return [];
        if (dictKind === 'datasets') {
            return papers.filter((p) => bundle.linksByPaper[p.id]?.datasetIds.includes(selectedDict.id));
        }
        return papers.filter((p) => bundle.linksByPaper[p.id]?.metricIds.includes(selectedDict.id));
    }, [selectedDict, dictKind, papers, bundle.linksByPaper]);

    const handleCreateDict = async () => {
        if (!requireAdmin()) return;
        const name = newDictName.trim();
        if (!name) return;
        try {
            const created =
                dictKind === 'datasets' ? await createDataset(name) : await createMetric(name);
            setNewDictName('');
            setSelectedDictId(created.id);
            toast.success('已创建');
            await mutate();
        } catch (e: unknown) {
            toast.error('创建失败: ' + (e instanceof Error ? e.message : String(e)));
        }
    };

    const handleSaveDict = async (payload: { name: string; format_note: string }) => {
        if (!requireAdmin()) return;
        if (!selectedDict) return;
        try {
            if (dictKind === 'datasets') {
                await updateDataset(selectedDict.id, payload);
            } else {
                await updateMetric(selectedDict.id, payload);
            }
            toast.success('已保存');
            await mutate();
        } catch (e: unknown) {
            toast.error('保存失败: ' + (e instanceof Error ? e.message : String(e)));
        }
    };

    const openDictInLibrary = useCallback((kind: DictKind, id: string) => {
        setViewMode('library');
        setDictKind(kind);
        setSelectedDictId(id);
        setDictSearch('');
    }, []);

    const handleDeleteDict = async () => {
        if (!requireAdmin()) return;
        if (!selectedDict) return;
        const usage =
            dictKind === 'datasets'
                ? bundle.datasetUsageCount[selectedDict.id] || 0
                : bundle.metricUsageCount[selectedDict.id] || 0;
        const label = dictKind === 'datasets' ? '数据集' : '指标';
        if (
            !window.confirm(
                usage > 0
                    ? `确定删除该${label}？将同时解除 ${usage} 篇论文的关联。`
                    : `确定删除该${label}？`,
            )
        ) {
            return;
        }
        try {
            if (dictKind === 'datasets') {
                await deleteDataset(selectedDict.id);
            } else {
                await deleteMetric(selectedDict.id);
            }
            setSelectedDictId(null);
            toast.success('已删除');
            await mutate();
        } catch (e: unknown) {
            toast.error('删除失败: ' + (e instanceof Error ? e.message : String(e)));
        }
    };

    if (isLoading) {
        return (
            <div className="flex-1 flex items-center justify-center py-20">
                <Loader2 size={32} className="animate-spin text-stone-300" />
            </div>
        );
    }

    return (
        <div className="flex-1 w-full max-w-[1400px] mx-auto px-18 pb-6 flex flex-col h-[calc(100vh-220px)] overflow-hidden">
            <div className="bg-white rounded-3xl border border-stone-200/70 shadow-sm flex flex-col overflow-hidden flex-1 min-h-0">
                <div className="shrink-0 px-6 py-3 flex items-center gap-4 border-b border-stone-100">
                    <Database size={16} className="text-teal-600" />
                    <div className="flex p-1 bg-stone-100 rounded-lg border border-stone-200/60">
                        <button
                            type="button"
                            onClick={() => setViewMode('paper')}
                            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                                viewMode === 'paper' ? 'bg-white text-stone-800 shadow-sm' : 'text-stone-500'
                            }`}
                        >
                            论文视角
                        </button>
                        <button
                            type="button"
                            onClick={() => setViewMode('library')}
                            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                                viewMode === 'library' ? 'bg-white text-stone-800 shadow-sm' : 'text-stone-500'
                            }`}
                        >
                            库视角
                        </button>
                    </div>
                </div>

                {viewMode === 'paper' ? (
                    <div className="flex-1 min-h-0 flex">
                        <div className="w-[280px] shrink-0 border-r border-stone-100 flex flex-col">
                            <div className="p-3 border-b border-stone-100 space-y-2">
                                <div className="relative">
                                    <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400" />
                                    <input
                                        value={paperSearch}
                                        onChange={(e) => setPaperSearch(e.target.value)}
                                        placeholder="搜索标题或简称…"
                                        className="w-full pl-8 pr-2 py-2 text-sm rounded-lg border border-stone-200 outline-none focus:ring-1 focus:ring-teal-200"
                                    />
                                </div>
                                <label className="flex items-center gap-2 cursor-pointer select-none">
                                    <input
                                        type="checkbox"
                                        checked={onlyWithData}
                                        onChange={(e) => setOnlyWithData(e.target.checked)}
                                        className="rounded border-stone-300 text-teal-600 focus:ring-teal-500"
                                    />
                                    <span className="text-xs text-stone-600">仅显示有数据内容的论文</span>
                                </label>
                            </div>
                            <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
                                {filteredPapers.length === 0 ? (
                                    <p className="text-xs text-stone-400 text-center py-6 px-2">
                                        {onlyWithData ? '暂无符合筛选的论文' : '暂无论文'}
                                    </p>
                                ) : null}
                                {filteredPapers.map((p) => {
                                    const links = bundle.linksByPaper[p.id];
                                    const ds = links?.datasetIds.length ?? 0;
                                    const ms = links?.metricIds.length ?? 0;
                                    return (
                                        <button
                                            key={p.id}
                                            type="button"
                                            onClick={() => selectPaper(p.id)}
                                            className={`w-full text-left px-3 py-2.5 rounded-xl transition-all ${
                                                selectedPaperId === p.id
                                                    ? 'bg-teal-600 text-white shadow-md'
                                                    : 'hover:bg-stone-50 text-stone-700'
                                            }`}
                                        >
                                            <p className="text-sm font-medium line-clamp-2">
                                                {p.nickname || p.title}
                                            </p>
                                            {(ds > 0 || ms > 0) && (
                                                <p
                                                    className={`text-[10px] mt-1 font-mono ${
                                                        selectedPaperId === p.id ? 'text-teal-100' : 'text-stone-400'
                                                    }`}
                                                >
                                                    {ds} 数据集 · {ms} 指标
                                                </p>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-6">
                            {!activePaper ? (
                                <p className="text-sm text-stone-400 text-center py-12">请选择一篇论文</p>
                            ) : (
                                <div className="max-w-2xl space-y-8">
                                    <div>
                                        <h2 className="text-lg font-bold text-stone-800 leading-snug">
                                            {activePaper.title}
                                        </h2>
                                        {activePaper.nickname && (
                                            <p className="text-sm text-stone-500 mt-1">{activePaper.nickname}</p>
                                        )}
                                    </div>

                                    <section className="space-y-2">
                                        <label className="text-xs font-medium text-stone-500">数据说明</label>
                                        <p className="text-[11px] text-stone-400">
                                            对比对象、打分方式等
                                        </p>
                                        <LatexNoteField
                                            value={notesDraft}
                                            onChange={setNotesDraft}
                                            placeholder="记录本篇论文的对比设置、打分方式等…"
                                            disabled={savingNotes}
                                        />
                                        <button
                                            type="button"
                                            onClick={handleSaveNotes}
                                            disabled={savingNotes}
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-600 text-white text-xs font-bold hover:bg-teal-500 disabled:opacity-50"
                                        >
                                            {savingNotes ? (
                                                <Loader2 size={12} className="animate-spin" />
                                            ) : (
                                                <Save size={12} />
                                            )}
                                            保存说明
                                        </button>
                                    </section>

                                    <TagSection
                                        title="使用的数据集"
                                        emptyHint="尚未关联数据集"
                                        items={bundle.datasets}
                                        selectedIds={paperLinks.datasetIds}
                                        onOpenLinked={(id) => openDictInLibrary('datasets', id)}
                                        onUnlink={handleToggleDataset}
                                        onLink={handleToggleDataset}
                                        newName={newDatasetName}
                                        onNewNameChange={setNewDatasetName}
                                        onCreate={handleCreateAndLinkDataset}
                                        createLabel="新建数据集并关联"
                                    />

                                    <TagSection
                                        title="涉及的指标"
                                        emptyHint="尚未关联指标"
                                        items={bundle.metrics}
                                        selectedIds={paperLinks.metricIds}
                                        onOpenLinked={(id) => openDictInLibrary('metrics', id)}
                                        onUnlink={handleToggleMetric}
                                        onLink={handleToggleMetric}
                                        newName={newMetricName}
                                        onNewNameChange={setNewMetricName}
                                        onCreate={handleCreateAndLinkMetric}
                                        createLabel="新建指标并关联"
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 min-h-0 flex">
                        <div className="w-[120px] shrink-0 border-r border-stone-100 p-2 space-y-1">
                            <DictNavButton
                                active={dictKind === 'datasets'}
                                onClick={() => {
                                    setDictKind('datasets');
                                    setSelectedDictId(null);
                                }}
                                label="数据集"
                            />
                            <DictNavButton
                                active={dictKind === 'metrics'}
                                onClick={() => {
                                    setDictKind('metrics');
                                    setSelectedDictId(null);
                                }}
                                label="指标"
                            />
                        </div>

                        <div className="w-[240px] shrink-0 border-r border-stone-100 flex flex-col">
                            <div className="p-3 border-b border-stone-100">
                                <div className="relative">
                                    <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400" />
                                    <input
                                        value={dictSearch}
                                        onChange={(e) => setDictSearch(e.target.value)}
                                        placeholder="搜索…"
                                        className="w-full pl-8 pr-2 py-2 text-sm rounded-lg border border-stone-200 outline-none focus:ring-1 focus:ring-teal-200"
                                    />
                                </div>
                            </div>
                            <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-0.5">
                                {filteredDict.length === 0 ? (
                                    <p className="text-xs text-stone-400 text-center py-6">暂无词条</p>
                                ) : (
                                    filteredDict.map((d) => {
                                        const count =
                                            dictKind === 'datasets'
                                                ? bundle.datasetUsageCount[d.id] || 0
                                                : bundle.metricUsageCount[d.id] || 0;
                                        return (
                                            <button
                                                key={d.id}
                                                type="button"
                                                onClick={() => setSelectedDictId(d.id)}
                                                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
                                                    selectedDict?.id === d.id
                                                        ? 'bg-teal-50 text-teal-800 font-medium border border-teal-100'
                                                        : 'text-stone-600 hover:bg-stone-50'
                                                }`}
                                            >
                                                <span className="line-clamp-2">{d.name}</span>
                                                <span className="text-[10px] font-mono text-stone-400">{count} 篇</span>
                                            </button>
                                        );
                                    })
                                )}
                            </div>
                            <div className="p-2 border-t border-stone-100 flex gap-1.5">
                                <input
                                    value={newDictName}
                                    onChange={(e) => setNewDictName(e.target.value)}
                                    placeholder={`新建${dictKind === 'datasets' ? '数据集' : '指标'}…`}
                                    className="flex-1 text-xs rounded-lg border border-stone-200 px-2 py-2 outline-none focus:ring-1 focus:ring-teal-200"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') void handleCreateDict();
                                    }}
                                />
                                <button
                                    type="button"
                                    onClick={() => void handleCreateDict()}
                                    disabled={!newDictName.trim()}
                                    className="shrink-0 p-2 rounded-lg bg-stone-100 text-stone-600 hover:bg-teal-50 hover:text-teal-700 disabled:opacity-40"
                                >
                                    <Plus size={14} />
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-6">
                            {!selectedDict ? (
                                <p className="text-sm text-stone-400 text-center py-12">选择或新建左侧词条</p>
                            ) : (
                                <DictEntryEditor
                                    key={selectedDict.id}
                                    item={selectedDict}
                                    kind={dictKind}
                                    papersForDict={papersForDict}
                                    onSave={handleSaveDict}
                                    onDelete={() => void handleDeleteDict()}
                                />
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function DictEntryEditor({
    item,
    kind,
    papersForDict,
    onSave,
    onDelete,
}: {
    item: PrismDataset | PrismMetric;
    kind: DictKind;
    papersForDict: PaperDetail[];
    onSave: (payload: { name: string; format_note: string }) => Promise<void>;
    onDelete: () => void;
}) {
    const [name, setName] = useState(item.name);
    const [formatNote, setFormatNote] = useState(item.format_note || '');
    const [saving, setSaving] = useState(false);

    React.useEffect(() => {
        setName(item.name);
        setFormatNote(item.format_note || '');
    }, [item.id, item.name, item.format_note]);

    const handleSave = async () => {
        if (!name.trim()) {
            toast.error('名称不能为空');
            return;
        }
        setSaving(true);
        try {
            await onSave({ name, format_note: formatNote });
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-6 max-w-xl">
            <div className="space-y-3">
                <label className="text-xs font-medium text-stone-500">名称</label>
                <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-xl border border-stone-200 px-3 py-2 text-sm text-stone-800 outline-none focus:ring-1 focus:ring-teal-200"
                />
            </div>
            <div className="space-y-2">
                <label className="text-xs font-medium text-stone-500">样例 / 格式说明</label>
                <LatexNoteField
                    value={formatNote}
                    onChange={setFormatNote}
                    placeholder="记录样例、字段格式或指标定义…"
                    disabled={saving}
                />
            </div>
            <div className="flex items-center gap-2">
                <button
                    type="button"
                    onClick={() => void handleSave()}
                    disabled={saving}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-600 text-white text-xs font-bold hover:bg-teal-500 disabled:opacity-50"
                >
                    {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                    保存
                </button>
                <button
                    type="button"
                    onClick={onDelete}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-200 text-red-600 text-xs font-medium hover:bg-red-50"
                >
                    <Trash2 size={12} />
                    删除
                </button>
            </div>
            <div>
                <p className="text-xs font-medium text-stone-500 mb-2">
                    使用该{kind === 'datasets' ? '数据集' : '指标'}的论文（{papersForDict.length}）
                </p>
                {papersForDict.length === 0 ? (
                    <p className="text-sm text-stone-400">暂无关联论文</p>
                ) : (
                    <ul className="space-y-2">
                        {papersForDict.map((p) => (
                            <li
                                key={p.id}
                                className="text-sm text-stone-700 px-3 py-2 rounded-lg border border-stone-100 bg-white"
                            >
                                {p.nickname || p.title}
                                {p.year ? (
                                    <span className="text-stone-400 font-mono text-xs ml-2">{p.year}</span>
                                ) : null}
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}

function DictNavButton({
    active,
    onClick,
    label,
}: {
    active: boolean;
    onClick: () => void;
    label: string;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`w-full px-3 py-2 rounded-lg text-sm font-medium text-left transition-all ${
                active ? 'bg-teal-600 text-white' : 'text-stone-600 hover:bg-stone-50'
            }`}
        >
            {label}
        </button>
    );
}

function TagSection({
    title,
    emptyHint,
    items,
    selectedIds,
    onOpenLinked,
    onUnlink,
    onLink,
    newName,
    onNewNameChange,
    onCreate,
    createLabel,
}: {
    title: string;
    emptyHint: string;
    items: { id: string; name: string }[];
    selectedIds: string[];
    onOpenLinked: (id: string) => void;
    onUnlink: (id: string) => void;
    onLink: (id: string) => void;
    newName: string;
    onNewNameChange: (v: string) => void;
    onCreate: () => void;
    createLabel: string;
}) {
    const selected = items.filter((i) => selectedIds.includes(i.id));
    const unselected = items.filter((i) => !selectedIds.includes(i.id));

    return (
        <section className="space-y-3">
            <h3 className="text-sm font-bold text-stone-700">{title}</h3>
            <div className="flex flex-wrap gap-2 min-h-[28px]">
                {selected.length === 0 ? (
                    <span className="text-xs text-stone-400">{emptyHint}</span>
                ) : (
                    selected.map((item) => (
                        <span
                            key={item.id}
                            className="inline-flex items-stretch rounded-full bg-teal-50 border border-teal-200 text-xs font-medium overflow-hidden"
                        >
                            <button
                                type="button"
                                onClick={() => onOpenLinked(item.id)}
                                className="px-2.5 py-1 text-teal-800 hover:bg-teal-100 transition-colors text-left"
                                title="在库视角中查看"
                            >
                                {item.name}
                            </button>
                            <button
                                type="button"
                                onClick={() => onUnlink(item.id)}
                                className="px-1.5 py-1 text-teal-600/70 hover:text-red-600 hover:bg-red-50 border-l border-teal-200/80 transition-colors"
                                title="取消关联"
                                aria-label={`取消关联 ${item.name}`}
                            >
                                <X size={12} />
                            </button>
                        </span>
                    ))
                )}
            </div>
            {unselected.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                    {unselected.map((item) => (
                        <button
                            key={item.id}
                            type="button"
                            onClick={() => onLink(item.id)}
                            className="px-2 py-0.5 rounded-md border border-dashed border-stone-200 text-xs text-stone-500 hover:border-teal-300 hover:text-teal-700"
                        >
                            + {item.name}
                        </button>
                    ))}
                </div>
            )}
            <div className="flex gap-2 items-center pt-1">
                <input
                    value={newName}
                    onChange={(e) => onNewNameChange(e.target.value)}
                    placeholder={createLabel}
                    className="flex-1 text-xs rounded-lg border border-stone-200 px-3 py-2 outline-none focus:ring-1 focus:ring-teal-200"
                />
                <button
                    type="button"
                    onClick={onCreate}
                    disabled={!newName.trim()}
                    className="shrink-0 p-2 rounded-lg bg-stone-100 text-stone-600 hover:bg-teal-50 hover:text-teal-700 disabled:opacity-40"
                >
                    <Plus size={14} />
                </button>
            </div>
        </section>
    );
}
