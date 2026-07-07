"use client";

import React, { useMemo, useState } from "react";
import { BarChart3, Database, Loader2, Pencil, Plus, Save, Unlink, X } from "lucide-react";
import { toast } from "sonner";
import type { PaperDetail, PrismDataCategory, PrismDataset, PrismMetric } from "../../types";
import {
    createDataset,
    createMetric,
    togglePaperDataset,
    togglePaperMetric,
    updateDataset,
    updateMetric,
    usePrismPaperData,
} from "../../hooks/usePrismPaperData";
import { LatexNoteField, LatexRichText } from "../LatexRichText";

type DataKind = "datasets" | "metrics";
type DataEntry = PrismDataset | PrismMetric;

const KIND_META: Record<DataKind, { label: string; empty: string; icon: React.ElementType }> = {
    datasets: {
        label: "数据集",
        empty: "本论文尚未关联数据集",
        icon: Database,
    },
    metrics: {
        label: "指标",
        empty: "本论文尚未关联指标",
        icon: BarChart3,
    },
};

interface PaperDataLinksDialogProps {
    paper: PaperDetail;
    isAdmin: boolean;
}

export function PaperDataLinksDialog({ paper, isAdmin }: PaperDataLinksDialogProps) {
    const { bundle, isLoading, mutate } = usePrismPaperData();
    const [open, setOpen] = useState(false);
    const [activeKind, setActiveKind] = useState<DataKind>("datasets");
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [nameDraft, setNameDraft] = useState("");
    const [accessUrlDraft, setAccessUrlDraft] = useState("");
    const [formatDraft, setFormatDraft] = useState("");
    const [categoryDraft, setCategoryDraft] = useState("");
    const [newName, setNewName] = useState("");
    const [newCategoryId, setNewCategoryId] = useState("");
    const [saving, setSaving] = useState(false);
    const [linking, setLinking] = useState(false);

    const paperLinks = bundle.linksByPaper[paper.id] ?? { datasetIds: [], metricIds: [] };

    const linkedDatasets = useMemo(
        () => bundle.datasets.filter((item) => paperLinks.datasetIds.includes(item.id)),
        [bundle.datasets, paperLinks.datasetIds],
    );

    const linkedMetrics = useMemo(
        () => bundle.metrics.filter((item) => paperLinks.metricIds.includes(item.id)),
        [bundle.metrics, paperLinks.metricIds],
    );

    const activeEntries: DataEntry[] = activeKind === "datasets" ? linkedDatasets : linkedMetrics;
    const allEntries: DataEntry[] = activeKind === "datasets" ? bundle.datasets : bundle.metrics;
    const activeCategories = useMemo(
        () => bundle.categories.filter((category) => category.kind === activeKind),
        [bundle.categories, activeKind],
    );
    const activeIds = activeKind === "datasets" ? paperLinks.datasetIds : paperLinks.metricIds;
    const unlinkedEntries = allEntries.filter((item) => !activeIds.includes(item.id));
    const unlinkedGroups = groupDataItemsByCategory(unlinkedEntries, activeCategories);
    const selectedEntry = activeEntries.find((item) => item.id === selectedId) ?? activeEntries[0] ?? null;

    React.useEffect(() => {
        if (!open) return;
        const first = activeEntries[0] ?? null;
        if (!selectedEntry && first) {
            setSelectedId(first.id);
        }
        if (!first) {
            setSelectedId(null);
        }
    }, [open, activeKind, activeEntries, selectedEntry]);

    React.useEffect(() => {
        if (!selectedEntry) {
            setNameDraft("");
            setAccessUrlDraft("");
            setFormatDraft("");
            setCategoryDraft("");
            return;
        }
        setNameDraft(selectedEntry.name);
        setAccessUrlDraft("access_url" in selectedEntry ? selectedEntry.access_url || "" : "");
        setFormatDraft(selectedEntry.format_note || "");
        setCategoryDraft(selectedEntry.category_id || "");
    }, [selectedEntry?.id, selectedEntry?.name, selectedEntry, selectedEntry?.format_note, selectedEntry?.category_id]);

    const openWithKind = (kind: DataKind) => {
        setActiveKind(kind);
        const first = kind === "datasets" ? linkedDatasets[0] : linkedMetrics[0];
        setSelectedId(first?.id ?? null);
        setNewName("");
        setNewCategoryId("");
        setOpen(true);
    };

    const handleSave = async () => {
        if (!selectedEntry) return;
        if (!isAdmin) {
            toast.warning("只有本人才能修改认知棱镜。");
            return;
        }
        if (!nameDraft.trim()) {
            toast.error("名称不能为空");
            return;
        }
        setSaving(true);
        try {
            if (activeKind === "datasets") {
                await updateDataset(selectedEntry.id, {
                    name: nameDraft,
                    access_url: accessUrlDraft,
                    format_note: formatDraft,
                    category_id: categoryDraft || null,
                });
            } else {
                await updateMetric(selectedEntry.id, {
                    name: nameDraft,
                    format_note: formatDraft,
                    category_id: categoryDraft || null,
                });
            }
            toast.success("已保存");
            await mutate();
        } catch (error) {
            toast.error("保存失败: " + (error instanceof Error ? error.message : String(error)));
        } finally {
            setSaving(false);
        }
    };

    const handleLinkExisting = async (id: string) => {
        if (!isAdmin) {
            toast.warning("只有本人才能修改认知棱镜。");
            return;
        }
        setLinking(true);
        try {
            if (activeKind === "datasets") {
                await togglePaperDataset(paper.id, id, false);
            } else {
                await togglePaperMetric(paper.id, id, false);
            }
            setSelectedId(id);
            toast.success("已关联");
            await mutate();
        } catch (error) {
            toast.error("关联失败: " + (error instanceof Error ? error.message : String(error)));
        } finally {
            setLinking(false);
        }
    };

    const handleCreateAndLink = async () => {
        if (!isAdmin) {
            toast.warning("只有本人才能修改认知棱镜。");
            return;
        }
        const name = newName.trim();
        if (!name) return;
        setLinking(true);
        try {
            const created =
                activeKind === "datasets"
                    ? await createDataset(name, "", newCategoryId || null)
                    : await createMetric(name, "", newCategoryId || null);
            if (activeKind === "datasets") {
                await togglePaperDataset(paper.id, created.id, false);
            } else {
                await togglePaperMetric(paper.id, created.id, false);
            }
            setNewName("");
            setNewCategoryId("");
            setSelectedId(created.id);
            toast.success("已创建并关联");
            await mutate();
        } catch (error) {
            toast.error("创建失败: " + (error instanceof Error ? error.message : String(error)));
        } finally {
            setLinking(false);
        }
    };

    const handleUnlinkSelected = async () => {
        if (!selectedEntry) return;
        if (!isAdmin) {
            toast.warning("只有本人才能修改认知棱镜。");
            return;
        }
        setLinking(true);
        try {
            if (activeKind === "datasets") {
                await togglePaperDataset(paper.id, selectedEntry.id, true);
            } else {
                await togglePaperMetric(paper.id, selectedEntry.id, true);
            }
            setSelectedId(null);
            toast.success("已取消关联");
            await mutate();
        } catch (error) {
            toast.error("取消关联失败: " + (error instanceof Error ? error.message : String(error)));
        } finally {
            setLinking(false);
        }
    };

    return (
        <>
            <div className="mt-6 mb-8 group/data">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <Database size={16} className="text-stone-400" />
                        <h3 className="text-[13px] font-mono font-bold uppercase tracking-widest text-stone-500">
                            数据关联
                        </h3>
                    </div>
                    {isLoading && <Loader2 size={13} className="animate-spin text-stone-300" />}
                </div>

                <div className="grid grid-cols-2 gap-2">
                    <DataLinkButton
                        kind="datasets"
                        count={linkedDatasets.length}
                        disabledVisual={linkedDatasets.length === 0}
                        onClick={() => openWithKind("datasets")}
                    />
                    <DataLinkButton
                        kind="metrics"
                        count={linkedMetrics.length}
                        disabledVisual={linkedMetrics.length === 0}
                        onClick={() => openWithKind("metrics")}
                    />
                </div>
            </div>

            {open && (
                <div className="fixed inset-0 z-[140] flex items-center justify-center p-6">
                    <div className="absolute inset-0 bg-stone-950/35 backdrop-blur-sm" onClick={() => setOpen(false)} />
                    <div className="relative z-10 w-full max-w-3xl max-h-[82vh] overflow-hidden rounded-3xl bg-[#faf9f7] border border-stone-200 shadow-2xl flex flex-col">
                        <div className="shrink-0 px-6 py-5 border-b border-stone-200/70 bg-white/80 flex items-start justify-between gap-4">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <Database size={16} className="text-teal-600" />
                                    <h2 className="text-lg font-serif font-bold text-stone-800">
                                        论文数据关联
                                    </h2>
                                </div>
                                <p className="text-xs text-stone-500 line-clamp-1">
                                    {paper.nickname || paper.title}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setOpen(false)}
                                className="p-2 rounded-full bg-stone-100 text-stone-400 hover:bg-stone-200 hover:text-stone-600 transition-colors"
                                aria-label="关闭"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        <div className="shrink-0 px-6 pt-4">
                            <div className="inline-flex p-1 rounded-xl bg-stone-100 border border-stone-200/70">
                                <KindTab
                                    kind="datasets"
                                    active={activeKind === "datasets"}
                                    count={linkedDatasets.length}
                                    onClick={() => {
                                        setActiveKind("datasets");
                                        setSelectedId(linkedDatasets[0]?.id ?? null);
                                    }}
                                />
                                <KindTab
                                    kind="metrics"
                                    active={activeKind === "metrics"}
                                    count={linkedMetrics.length}
                                    onClick={() => {
                                        setActiveKind("metrics");
                                        setSelectedId(linkedMetrics[0]?.id ?? null);
                                    }}
                                />
                            </div>
                        </div>

                        <div className="flex-1 min-h-0 grid grid-cols-[220px_1fr] gap-0 overflow-hidden">
                            <div className="border-r border-stone-200/70 p-4 overflow-y-auto custom-scrollbar">
                                {activeEntries.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center text-center px-3 py-8">
                                        <p className="text-sm font-medium text-stone-500">
                                            {KIND_META[activeKind].empty}
                                        </p>
                                        <p className="mt-2 text-xs text-stone-400 leading-relaxed">
                                            可以从已有条目中选择，或新建后直接关联。
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {activeEntries.map((item) => (
                                            <button
                                                key={item.id}
                                                type="button"
                                                onClick={() => setSelectedId(item.id)}
                                                className={`w-full text-left px-3 py-2.5 rounded-xl transition-all ${
                                                    selectedEntry?.id === item.id
                                                        ? "bg-teal-600 text-white shadow-sm"
                                                        : "text-stone-600 hover:bg-white"
                                                }`}
                                            >
                                                <p className="text-sm font-semibold line-clamp-2">{item.name}</p>
                                                <p
                                                    className={`mt-1 text-[10px] font-mono ${
                                                        selectedEntry?.id === item.id ? "text-teal-100" : "text-stone-400"
                                                    }`}
                                                >
                                                    {getCategoryName(item.category_id, activeCategories)}
                                                </p>
                                                {item.format_note ? (
                                                    <p
                                                        className={`mt-1 text-[11px] line-clamp-2 ${
                                                            selectedEntry?.id === item.id ? "text-teal-50" : "text-stone-400"
                                                        }`}
                                                    >
                                                        {item.format_note}
                                                    </p>
                                                ) : null}
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {isAdmin && (
                                    <div className="mt-5 pt-5 border-t border-stone-200/70 space-y-4">
                                        <div>
                                            <p className="text-[11px] font-mono font-bold uppercase tracking-widest text-stone-400 mb-2">
                                                关联已有
                                            </p>
                                            {unlinkedEntries.length === 0 ? (
                                                <p className="text-xs text-stone-400">
                                                    暂无可关联的{KIND_META[activeKind].label}
                                                </p>
                                            ) : (
                                                <div className="space-y-3">
                                                    {unlinkedGroups.map((group) => (
                                                        <div key={group.id}>
                                                            <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-stone-400 mb-1.5">
                                                                {group.name}
                                                            </p>
                                                            <div className="flex flex-wrap gap-1.5">
                                                                {group.items.map((item) => (
                                                                    <button
                                                                        key={item.id}
                                                                        type="button"
                                                                        onClick={() => handleLinkExisting(item.id)}
                                                                        disabled={linking}
                                                                        className="px-2 py-1 rounded-md border border-dashed border-stone-200 text-xs text-stone-500 hover:border-teal-300 hover:text-teal-700 disabled:opacity-50"
                                                                    >
                                                                        + {item.name}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        <div>
                                            <p className="text-[11px] font-mono font-bold uppercase tracking-widest text-stone-400 mb-2">
                                                新建并关联
                                            </p>
                                            <div className="space-y-2">
                                                <input
                                                    value={newName}
                                                    onChange={(event) => setNewName(event.target.value)}
                                                    placeholder={`新建${KIND_META[activeKind].label}`}
                                                    disabled={linking}
                                                    className="w-full rounded-lg border border-stone-200 px-2.5 py-2 text-xs text-stone-800 outline-none focus:ring-1 focus:ring-teal-200 disabled:opacity-60"
                                                />
                                                <div className="flex gap-2">
                                                    <select
                                                        value={newCategoryId}
                                                        onChange={(event) => setNewCategoryId(event.target.value)}
                                                        disabled={linking}
                                                        className="min-w-0 flex-1 rounded-lg border border-stone-200 px-2.5 py-2 text-xs text-stone-700 outline-none focus:ring-1 focus:ring-teal-200 disabled:opacity-60 bg-white"
                                                    >
                                                        <option value="">未分类</option>
                                                        {activeCategories.map((category) => (
                                                            <option key={category.id} value={category.id}>
                                                                {category.name}
                                                            </option>
                                                        ))}
                                                    </select>
                                                    <button
                                                        type="button"
                                                        onClick={handleCreateAndLink}
                                                        disabled={!newName.trim() || linking}
                                                        className="shrink-0 p-2 rounded-lg bg-stone-100 text-stone-600 hover:bg-teal-50 hover:text-teal-700 disabled:opacity-40"
                                                        aria-label={`新建${KIND_META[activeKind].label}并关联`}
                                                    >
                                                        {linking ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="min-h-0 overflow-y-auto custom-scrollbar p-6">
                                {!selectedEntry ? (
                                    <div className="h-full min-h-[320px] flex items-center justify-center text-sm text-stone-400">
                                        暂无可编辑条目
                                    </div>
                                ) : (
                                    <div className="space-y-6 max-w-xl">
                                        <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-widest text-stone-400">
                                            <Pencil size={13} />
                                            编辑{KIND_META[activeKind].label}
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-xs font-medium text-stone-500">名称</label>
                                            <input
                                                value={nameDraft}
                                                onChange={(event) => setNameDraft(event.target.value)}
                                                disabled={!isAdmin || saving}
                                                className="w-full rounded-xl border border-stone-200 px-3 py-2 text-sm text-stone-800 outline-none focus:ring-1 focus:ring-teal-200 disabled:opacity-60"
                                            />
                                        </div>

                                        {activeKind === "datasets" && (
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between gap-3">
                                                    <label className="text-xs font-medium text-stone-500">获取链接</label>
                                                    {accessUrlDraft.trim() ? (
                                                        <a
                                                            href={accessUrlDraft.trim()}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-[11px] font-medium text-teal-600 hover:text-teal-700"
                                                        >
                                                            打开
                                                        </a>
                                                    ) : null}
                                                </div>
                                                <input
                                                    value={accessUrlDraft}
                                                    onChange={(event) => setAccessUrlDraft(event.target.value)}
                                                    placeholder="https://..."
                                                    disabled={!isAdmin || saving}
                                                    className="w-full rounded-xl border border-stone-200 px-3 py-2 text-sm text-stone-800 outline-none focus:ring-1 focus:ring-teal-200 disabled:opacity-60"
                                                />
                                            </div>
                                        )}

                                        <div className="space-y-2">
                                            <label className="text-xs font-medium text-stone-500">所属分类</label>
                                            <select
                                                value={categoryDraft}
                                                onChange={(event) => setCategoryDraft(event.target.value)}
                                                disabled={!isAdmin || saving}
                                                className="w-full rounded-xl border border-stone-200 px-3 py-2 text-sm text-stone-800 outline-none focus:ring-1 focus:ring-teal-200 disabled:opacity-60 bg-white"
                                            >
                                                <option value="">未分类</option>
                                                {activeCategories.map((category) => (
                                                    <option key={category.id} value={category.id}>
                                                        {category.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-xs font-medium text-stone-500">
                                                样例 / 格式说明
                                            </label>
                                            {isAdmin ? (
                                                <LatexNoteField
                                                    value={formatDraft}
                                                    onChange={setFormatDraft}
                                                    placeholder="记录样例、字段格式或指标定义..."
                                                    disabled={saving}
                                                />
                                            ) : (
                                                <div className="rounded-xl border border-stone-100 bg-stone-50/80 p-4 min-h-[120px]">
                                                    {formatDraft.trim() ? (
                                                        <LatexRichText content={formatDraft} className="text-sm text-stone-700" />
                                                    ) : (
                                                        <p className="text-sm text-stone-400">暂无说明</p>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={handleSave}
                                                disabled={!isAdmin || saving}
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-600 text-white text-xs font-bold hover:bg-teal-500 disabled:opacity-40 disabled:hover:bg-teal-600"
                                            >
                                                {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                                                保存
                                            </button>
                                            {isAdmin && (
                                                <button
                                                    type="button"
                                                    onClick={handleUnlinkSelected}
                                                    disabled={linking}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-200 text-red-600 text-xs font-medium hover:bg-red-50 disabled:opacity-50"
                                                >
                                                    {linking ? <Loader2 size={12} className="animate-spin" /> : <Unlink size={12} />}
                                                    取消关联
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

function DataLinkButton({
    kind,
    count,
    disabledVisual,
    onClick,
}: {
    kind: DataKind;
    count: number;
    disabledVisual: boolean;
    onClick: () => void;
}) {
    const Icon = KIND_META[kind].icon;
    return (
        <button
            type="button"
            onClick={onClick}
            className={`flex items-center justify-between gap-2 rounded-xl border px-3 py-2.5 text-left transition-all ${
                disabledVisual
                    ? "border-stone-200 bg-stone-50/70 text-stone-400 hover:bg-stone-100"
                    : "border-teal-200 bg-teal-50 text-teal-800 hover:bg-teal-100"
            }`}
        >
            <span className="flex items-center gap-2 min-w-0">
                <Icon size={15} className={disabledVisual ? "text-stone-300" : "text-teal-600"} />
                <span className="text-xs font-bold truncate">{KIND_META[kind].label}</span>
            </span>
            <span className="shrink-0 text-[11px] font-mono font-bold">{count}</span>
        </button>
    );
}

function getCategoryName(categoryId: string | null | undefined, categories: PrismDataCategory[]) {
    if (!categoryId) return "未分类";
    return categories.find((category) => category.id === categoryId)?.name ?? "未分类";
}

function groupDataItemsByCategory<T extends { category_id?: string | null }>(
    items: T[],
    categories: PrismDataCategory[],
) {
    const groups = categories
        .map((category) => ({
            id: category.id,
            name: category.name,
            items: items.filter((item) => item.category_id === category.id),
        }))
        .filter((group) => group.items.length > 0);
    const uncategorized = items.filter((item) => !item.category_id);
    if (uncategorized.length > 0) {
        groups.push({ id: "uncategorized", name: "未分类", items: uncategorized });
    }
    return groups;
}

function KindTab({
    kind,
    active,
    count,
    onClick,
}: {
    kind: DataKind;
    active: boolean;
    count: number;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                active ? "bg-white text-stone-800 shadow-sm" : "text-stone-500 hover:text-stone-700"
            }`}
        >
            {KIND_META[kind].label}
            <span className={active ? "ml-1.5 text-teal-600" : "ml-1.5 text-stone-400"}>{count}</span>
        </button>
    );
}
