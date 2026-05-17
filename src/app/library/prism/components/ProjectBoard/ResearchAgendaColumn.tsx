'use client';

import React, { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import { AgendaContentDisplay, AgendaContentTextarea } from './utils';
import { ClipboardList, Loader2, Save, Trash2, Plus, Pencil, X } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import { BoardColumn } from './BoardColumn';
import { useAgendaVersionItems } from '../../hooks/useProjectAgenda';
import type {
    ProjectAgendaDriveItem,
    ProjectAgendaSurveyItem,
    ProjectAgendaSynthesisItem,
    ProjectAgendaVersion,
} from '../../types';

export interface ActiveTimeRange {
    start: number;
    end: number;
}

function inTimeRange(createdAt: string, range: ActiveTimeRange | null): boolean {
    if (!range) return true;
    const t = new Date(createdAt).getTime();
    return t >= range.start && t < range.end;
}

function newSubItemCreatedAt(range: ActiveTimeRange | null): string {
    if (!range) return new Date().toISOString();
    if (range.end === Infinity) return new Date().toISOString();
    return new Date((range.start + range.end) / 2).toISOString();
}

function formatVersionOption(v: ProjectAgendaVersion) {
    if (v.label?.trim()) return v.label.trim();
    const d = new Date(v.created_at);
    return d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

interface ResearchAgendaColumnProps {
    activeTimeRange: ActiveTimeRange | null;
    versions: ProjectAgendaVersion[];
    versionId: string | null;
    onVersionIdChange: (id: string | null) => void;
    isLoadingVersions: boolean;
    /** 综合条多选引用：当前项目全部启示 */
    allInsights: { id: string; title: string }[];
}

function DriveRow({
    item,
    disabled,
    onSave,
    onDelete,
}: {
    item: ProjectAgendaDriveItem;
    disabled: boolean;
    onSave: (payload: { title: string; content: string }) => Promise<void>;
    onDelete: () => Promise<void>;
}) {
    const [isEditing, setIsEditing] = useState(false);
    const [title, setTitle] = useState(item.title);
    const [content, setContent] = useState(item.content);
    const [busy, setBusy] = useState(false);
    const contentDisplayRef = useRef<HTMLDivElement>(null);
    const [contentMinH, setContentMinH] = useState<number | undefined>();

    useEffect(() => {
        setTitle(item.title);
        setContent(item.content);
    }, [item.id, item.title, item.content]);

    const enterEdit = () => {
        const h = contentDisplayRef.current?.offsetHeight;
        setContentMinH(h && h > 0 ? h : undefined);
        setTitle(item.title);
        setContent(item.content);
        setIsEditing(true);
    };

    const cancelEdit = () => {
        setTitle(item.title);
        setContent(item.content);
        setContentMinH(undefined);
        setIsEditing(false);
    };

    const handleSave = async () => {
        setBusy(true);
        try {
            await onSave({ title, content });
            setIsEditing(false);
            setContentMinH(undefined);
        } finally {
            setBusy(false);
        }
    };

    return (
        <div
            className={`relative group/agenda-row rounded-xl border border-stone-200/60 p-3 transition-colors ${
                isEditing ? 'bg-white ring-1 ring-violet-100' : 'bg-violet-50/20 hover:bg-white'
            }`}
        >
            {!isEditing && !disabled && (
                <div className="absolute top-2 right-2 z-10 flex items-center gap-0.5 opacity-0 pointer-events-none group-hover/agenda-row:opacity-100 group-hover/agenda-row:pointer-events-auto transition-opacity">
                    <button
                        type="button"
                        onClick={enterEdit}
                        className="p-1.5 text-stone-400 hover:text-violet-600 hover:bg-violet-50 rounded-md"
                        title="编辑"
                    >
                        <Pencil size={14} />
                    </button>
                    <button
                        type="button"
                        onClick={() => void onDelete()}
                        className="p-1.5 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-md"
                        title="删除本条"
                    >
                        <Trash2 size={14} />
                    </button>
                </div>
            )}

            {isEditing ? (
                <div className="space-y-3">
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="小标题"
                        disabled={disabled || busy}
                        className="w-full rounded-lg border border-stone-200 bg-white py-2 px-3 text-base font-bold text-stone-900 outline-none focus:ring-1 focus:ring-violet-200"
                    />
                    <AgendaContentTextarea
                        value={content}
                        onChange={setContent}
                        disabled={disabled || busy}
                        minHeightPx={contentMinH}
                    />
                    <div className="flex justify-end gap-2 pt-1">
                        <button
                            type="button"
                            onClick={cancelEdit}
                            disabled={busy}
                            className="p-1.5 text-stone-400 hover:text-stone-600 transition-colors disabled:opacity-40"
                        >
                            <X size={14} />
                        </button>
                        <button
                            type="button"
                            onClick={() => void handleSave()}
                            disabled={disabled || busy}
                            className="flex items-center gap-1 px-3 py-1 bg-violet-600 text-white rounded-lg text-xs font-bold hover:bg-violet-700 transition-colors disabled:opacity-50"
                        >
                            {busy ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                            保存
                        </button>
                    </div>
                </div>
            ) : (
                <div className="space-y-2 pr-12">
                    <div className="text-base font-bold text-stone-900 leading-snug">
                        {item.title?.trim() ? item.title : <span className="text-stone-400 font-normal">（无小标题）</span>}
                    </div>
                    <AgendaContentDisplay content={item.content} displayRef={contentDisplayRef} />
                </div>
            )}
        </div>
    );
}

function SurveyRow({
    item,
    disabled,
    onSave,
    onDelete,
}: {
    item: ProjectAgendaSurveyItem;
    disabled: boolean;
    onSave: (payload: { title: string; content: string }) => Promise<void>;
    onDelete: () => Promise<void>;
}) {
    const [isEditing, setIsEditing] = useState(false);
    const [title, setTitle] = useState(item.title);
    const [content, setContent] = useState(item.content);
    const [busy, setBusy] = useState(false);
    const contentDisplayRef = useRef<HTMLDivElement>(null);
    const [contentMinH, setContentMinH] = useState<number | undefined>();

    useEffect(() => {
        setTitle(item.title);
        setContent(item.content);
    }, [item.id, item.title, item.content]);

    const enterEdit = () => {
        const h = contentDisplayRef.current?.offsetHeight;
        setContentMinH(h && h > 0 ? h : undefined);
        setTitle(item.title);
        setContent(item.content);
        setIsEditing(true);
    };

    const cancelEdit = () => {
        setTitle(item.title);
        setContent(item.content);
        setContentMinH(undefined);
        setIsEditing(false);
    };

    const handleSave = async () => {
        setBusy(true);
        try {
            await onSave({ title, content });
            setIsEditing(false);
            setContentMinH(undefined);
        } finally {
            setBusy(false);
        }
    };

    return (
        <div
            className={`relative group/agenda-row rounded-xl border border-stone-200/60 p-3 transition-colors ${
                isEditing ? 'bg-white ring-1 ring-violet-100' : 'bg-violet-50/20 hover:bg-white'
            }`}
        >
            {!isEditing && !disabled && (
                <div className="absolute top-2 right-2 z-10 flex items-center gap-0.5 opacity-0 pointer-events-none group-hover/agenda-row:opacity-100 group-hover/agenda-row:pointer-events-auto transition-opacity">
                    <button
                        type="button"
                        onClick={enterEdit}
                        className="p-1.5 text-stone-400 hover:text-violet-600 hover:bg-violet-50 rounded-md"
                        title="编辑"
                    >
                        <Pencil size={14} />
                    </button>
                    <button
                        type="button"
                        onClick={() => void onDelete()}
                        className="p-1.5 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-md"
                        title="删除本条"
                    >
                        <Trash2 size={14} />
                    </button>
                </div>
            )}

            {isEditing ? (
                <div className="space-y-3">
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="方向小标题"
                        disabled={disabled || busy}
                        className="w-full rounded-lg border border-stone-200 bg-white py-2 px-3 text-base font-bold text-stone-900 outline-none focus:ring-1 focus:ring-violet-200"
                    />
                    <AgendaContentTextarea
                        value={content}
                        onChange={setContent}
                        disabled={disabled || busy}
                        minHeightPx={contentMinH}
                    />
                    <div className="flex justify-end gap-2 pt-1">
                        <button
                            type="button"
                            onClick={cancelEdit}
                            disabled={busy}
                            className="p-1.5 text-stone-400 hover:text-stone-600 transition-colors disabled:opacity-40"
                        >
                            <X size={14} />
                        </button>
                        <button
                            type="button"
                            onClick={() => void handleSave()}
                            disabled={disabled || busy}
                            className="flex items-center gap-1 px-3 py-1 bg-violet-600 text-white rounded-lg text-xs font-bold hover:bg-violet-700 transition-colors disabled:opacity-50"
                        >
                            {busy ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                            保存
                        </button>
                    </div>
                </div>
            ) : (
                <div className="space-y-2 pr-12">
                    <div className="text-base font-bold text-stone-900 leading-snug">
                        {item.title?.trim() ? item.title : <span className="text-stone-400 font-normal">（无小标题）</span>}
                    </div>
                    <AgendaContentDisplay content={item.content} displayRef={contentDisplayRef} />
                </div>
            )}
        </div>
    );
}

function SynthesisRow({
    item,
    allInsights,
    disabled,
    onSave,
    onDelete,
}: {
    item: ProjectAgendaSynthesisItem;
    allInsights: { id: string; title: string }[];
    disabled: boolean;
    onSave: (payload: { content: string; insight_ref_ids: string[] }) => Promise<void>;
    onDelete: () => Promise<void>;
}) {
    const [isEditing, setIsEditing] = useState(false);
    const [content, setContent] = useState(item.content);
    const [refIds, setRefIds] = useState<string[]>(item.insight_ref_ids);
    const [busy, setBusy] = useState(false);
    const contentDisplayRef = useRef<HTMLDivElement>(null);
    const [contentMinH, setContentMinH] = useState<number | undefined>();

    useEffect(() => {
        setContent(item.content);
        setRefIds(item.insight_ref_ids);
    }, [item.id, item.content, item.insight_ref_ids]);

    const toggleRef = (id: string) => {
        setRefIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
    };

    const enterEdit = () => {
        const h = contentDisplayRef.current?.offsetHeight;
        setContentMinH(h && h > 0 ? h : undefined);
        setContent(item.content);
        setRefIds(item.insight_ref_ids);
        setIsEditing(true);
    };

    const cancelEdit = () => {
        setContent(item.content);
        setRefIds(item.insight_ref_ids);
        setContentMinH(undefined);
        setIsEditing(false);
    };

    const handleSave = async () => {
        setBusy(true);
        try {
            await onSave({ content, insight_ref_ids: refIds });
            setIsEditing(false);
            setContentMinH(undefined);
        } finally {
            setBusy(false);
        }
    };

    const displayRefs = item.insight_ref_ids
        .map((id) => {
            const ins = allInsights.find((i) => i.id === id);
            return ins ? { id, title: ins.title } : null;
        })
        .filter((r): r is { id: string; title: string } => r != null);

    return (
        <div
            className={`relative group/agenda-row rounded-xl border border-stone-200/60 p-3 transition-colors ${
                isEditing ? 'bg-white ring-1 ring-violet-100' : 'bg-violet-50/20 hover:bg-white'
            }`}
        >
            {!isEditing && !disabled && (
                <div className="absolute top-2 right-2 z-10 flex items-center gap-0.5 opacity-0 pointer-events-none group-hover/agenda-row:opacity-100 group-hover/agenda-row:pointer-events-auto transition-opacity">
                    <button
                        type="button"
                        onClick={enterEdit}
                        className="p-1.5 text-stone-400 hover:text-violet-600 hover:bg-violet-50 rounded-md"
                        title="编辑"
                    >
                        <Pencil size={14} />
                    </button>
                    <button
                        type="button"
                        onClick={() => void onDelete()}
                        className="p-1.5 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-md"
                        title="删除本条"
                    >
                        <Trash2 size={14} />
                    </button>
                </div>
            )}

            {isEditing ? (
                <div className="space-y-3">
                    <AgendaContentTextarea
                        value={content}
                        onChange={setContent}
                        disabled={disabled || busy}
                        minHeightPx={contentMinH}
                        placeholder="共识、缺口、下一步待检验点…（支持 Ctrl+B 加粗）"
                    />
                    <div className="space-y-2">
                        <label className="text-xs font-medium text-stone-500">引用启示</label>
                        <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto custom-scrollbar">
                            {allInsights.length === 0 ? (
                                <span className="text-xs text-stone-400">暂无启示条目</span>
                            ) : (
                                allInsights.map((ins) => {
                                    const on = refIds.includes(ins.id);
                                    return (
                                        <button
                                            key={ins.id}
                                            type="button"
                                            onClick={() => toggleRef(ins.id)}
                                            disabled={disabled || busy}
                                            className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                                                on
                                                    ? 'bg-violet-100 border-violet-300 text-violet-900'
                                                    : 'bg-white border-stone-200 text-stone-600 hover:border-violet-200'
                                            }`}
                                        >
                                            {ins.title}
                                        </button>
                                    );
                                })
                            )}
                        </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-1">
                        <button
                            type="button"
                            onClick={cancelEdit}
                            disabled={busy}
                            className="p-1.5 text-stone-400 hover:text-stone-600 transition-colors disabled:opacity-40"
                        >
                            <X size={14} />
                        </button>
                        <button
                            type="button"
                            onClick={() => void handleSave()}
                            disabled={disabled || busy}
                            className="flex items-center gap-1 px-3 py-1 bg-violet-600 text-white rounded-lg text-xs font-bold hover:bg-violet-700 transition-colors disabled:opacity-50"
                        >
                            {busy ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                            保存
                        </button>
                    </div>
                </div>
            ) : (
                <div className="space-y-3 pr-12">
                    <AgendaContentDisplay content={item.content} displayRef={contentDisplayRef} />
                    {displayRefs.length > 0 && (
                        <div>
                            <div className="text-xs font-medium text-stone-500 mb-1.5">引用启示</div>
                            <div className="flex flex-wrap gap-1.5">
                                {displayRefs.map((r) => (
                                    <span
                                        key={r.id}
                                        className="px-2.5 py-1 rounded-lg text-xs font-medium border bg-violet-50/80 border-violet-200 text-violet-900"
                                    >
                                        {r.title}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export function ResearchAgendaColumn({
    activeTimeRange,
    versions,
    versionId,
    onVersionIdChange,
    isLoadingVersions,
    allInsights,
}: ResearchAgendaColumnProps) {
    const { bundle, isLoading: isLoadingItems, mutate: mutateItems, isError: itemsError } =
        useAgendaVersionItems(versionId);

    const [addingKind, setAddingKind] = useState<'drive' | 'survey' | 'synthesis' | null>(null);

    useEffect(() => {
        if (itemsError) toast.error('加载议程分条失败');
    }, [itemsError]);

    const filteredDrive = useMemo(
        () => bundle.drive.filter((i) => inTimeRange(i.created_at, activeTimeRange)),
        [bundle.drive, activeTimeRange]
    );
    const filteredSurvey = useMemo(
        () => bundle.survey.filter((i) => inTimeRange(i.created_at, activeTimeRange)),
        [bundle.survey, activeTimeRange]
    );
    const filteredSynth = useMemo(
        () => bundle.synthesis.filter((i) => inTimeRange(i.created_at, activeTimeRange)),
        [bundle.synthesis, activeTimeRange]
    );

    const timelineCount = filteredDrive.length + filteredSurvey.length + filteredSynth.length;

    const nextSortOrder = useCallback(
        (rows: { sort_order: number }[]) => (rows.length ? Math.max(...rows.map((r) => r.sort_order)) + 1 : 0),
        []
    );

    const saveDrive = async (id: string, payload: { title: string; content: string }) => {
        try {
            const { error } = await supabase
                .from('prism_agenda_drive_items')
                .update({ title: payload.title, content: payload.content })
                .eq('id', id);
            if (error) throw error;
            toast.success('已保存');
            await mutateItems();
        } catch (e: unknown) {
            toast.error(e instanceof Error ? e.message : String(e));
        }
    };

    const saveSurvey = async (id: string, payload: { title: string; content: string }) => {
        try {
            const { error } = await supabase
                .from('prism_agenda_survey_items')
                .update({ title: payload.title, content: payload.content })
                .eq('id', id);
            if (error) throw error;
            toast.success('已保存');
            await mutateItems();
        } catch (e: unknown) {
            toast.error(e instanceof Error ? e.message : String(e));
        }
    };

    const saveSynthesis = async (id: string, payload: { content: string; insight_ref_ids: string[] }) => {
        try {
            const { error: uErr } = await supabase
                .from('prism_agenda_synthesis_items')
                .update({ content: payload.content })
                .eq('id', id);
            if (uErr) throw uErr;

            const { error: dErr } = await supabase
                .from('prism_synthesis_insight_refs')
                .delete()
                .eq('synthesis_item_id', id);
            if (dErr) throw dErr;

            if (payload.insight_ref_ids.length > 0) {
                const { error: iErr } = await supabase.from('prism_synthesis_insight_refs').insert(
                    payload.insight_ref_ids.map((insight_id) => ({ synthesis_item_id: id, insight_id }))
                );
                if (iErr) throw iErr;
            }

            toast.success('已保存');
            await mutateItems();
        } catch (e: unknown) {
            toast.error(e instanceof Error ? e.message : String(e));
        }
    };

    const deleteRow = async (table: string, id: string) => {
        if (!window.confirm('确定删除该条？')) return;
        try {
            const { error } = await supabase.from(table).delete().eq('id', id);
            if (error) throw error;
            toast.success('已删除');
            await mutateItems();
        } catch (e: unknown) {
            toast.error(e instanceof Error ? e.message : String(e));
        }
    };

    const addDrive = async () => {
        if (!versionId) return;
        setAddingKind('drive');
        try {
            const { error } = await supabase.from('prism_agenda_drive_items').insert([
                {
                    agenda_version_id: versionId,
                    title: '',
                    content: '',
                    sort_order: nextSortOrder(bundle.drive),
                    created_at: newSubItemCreatedAt(activeTimeRange),
                },
            ]);
            if (error) throw error;
            await mutateItems();
        } catch (e: unknown) {
            toast.error(e instanceof Error ? e.message : String(e));
        } finally {
            setAddingKind(null);
        }
    };

    const addSurvey = async () => {
        if (!versionId) return;
        setAddingKind('survey');
        try {
            const { error } = await supabase.from('prism_agenda_survey_items').insert([
                {
                    agenda_version_id: versionId,
                    title: '',
                    content: '',
                    sort_order: nextSortOrder(bundle.survey),
                    created_at: newSubItemCreatedAt(activeTimeRange),
                },
            ]);
            if (error) throw error;
            await mutateItems();
        } catch (e: unknown) {
            toast.error(e instanceof Error ? e.message : String(e));
        } finally {
            setAddingKind(null);
        }
    };

    const addSynthesis = async () => {
        if (!versionId) return;
        setAddingKind('synthesis');
        try {
            const { error } = await supabase.from('prism_agenda_synthesis_items').insert([
                {
                    agenda_version_id: versionId,
                    content: '',
                    sort_order: nextSortOrder(bundle.synthesis),
                    created_at: newSubItemCreatedAt(activeTimeRange),
                },
            ]);
            if (error) throw error;
            await mutateItems();
        } catch (e: unknown) {
            toast.error(e instanceof Error ? e.message : String(e));
        } finally {
            setAddingKind(null);
        }
    };

    const emptyVersions = !isLoadingVersions && versions.length === 0;
    const hasVersion = Boolean(versionId);
    const emptyInRange =
        hasVersion &&
        !isLoadingItems &&
        bundle.drive.length + bundle.survey.length + bundle.synthesis.length > 0 &&
        timelineCount === 0 &&
        activeTimeRange !== null;

    return (
        <BoardColumn
            title="研究问题与背景"
            icon={ClipboardList}
            color="violet"
            count={timelineCount}
            className="min-h-0 min-w-0"
        >
            {isLoadingVersions && (
                <div className="flex flex-col items-center justify-center py-12 text-stone-400 gap-2">
                    <Loader2 size={22} className="animate-spin" />
                    <span className="text-xs text-stone-500">加载议程版本…</span>
                </div>
            )}

            {!isLoadingVersions && emptyVersions && (
                <div className="rounded-xl border border-dashed border-stone-200 bg-white/60 p-6 text-center space-y-2">
                    <p className="text-sm text-stone-500 leading-relaxed">
                        该项目尚无议程版本。请在管理后台「认知棱镜 → 项目管理 → 研究议程版本」中新建；此处仅可选择版本并编辑各版本下的分条（版本标题与时间在后台修改）。
                    </p>
                </div>
            )}

            {!isLoadingVersions && !emptyVersions && (
                <div className="space-y-5">
                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-stone-500">议程版本</label>
                        <select
                            value={versionId ?? ''}
                            onChange={(e) => onVersionIdChange(e.target.value || null)}
                            className="w-full rounded-lg border border-stone-200 bg-white px-3 py-2.5 text-sm text-stone-800 outline-none focus:ring-1 focus:ring-violet-200"
                        >
                            {versions.map((v) => (
                                <option key={v.id} value={v.id}>
                                    {formatVersionOption(v)}
                                </option>
                            ))}
                        </select>
                    </div>

                    {hasVersion && (
                        <>
                            {emptyInRange && (
                                <div className="rounded-lg border border-amber-100 bg-amber-50/50 p-3 text-sm text-amber-900/90 leading-relaxed">
                                    当前时间线下，本版本没有落在区间内的分条。可切换到「全项目」查看全部，或新增分条（创建时间落在当前窗内）。
                                </div>
                            )}

                            {isLoadingItems && (
                                <div className="flex items-center gap-2 text-stone-400 text-sm py-4">
                                    <Loader2 size={18} className="animate-spin" />
                                    加载分条…
                                </div>
                            )}

                            {!isLoadingItems && (
                                <div className="space-y-8">
                                    <section className="space-y-3">
                                        <div className="flex items-center justify-between gap-2">
                                            <h4 className="text-sm font-bold text-stone-800">1. 驱动与边界</h4>
                                            <button
                                                type="button"
                                                onClick={() => void addDrive()}
                                                disabled={addingKind !== null}
                                                title="添加一条"
                                                className="p-1 rounded-md text-stone-400 hover:text-violet-600 hover:bg-violet-50 transition-colors disabled:opacity-40"
                                            >
                                                <Plus size={14} />
                                            </button>
                                        </div>
                                        <div className="space-y-3">
                                            {filteredDrive.length === 0 ? (
                                                <p className="text-xs text-stone-400">（无显示项）</p>
                                            ) : (
                                                filteredDrive.map((row) => (
                                                    <DriveRow
                                                        key={row.id}
                                                        item={row}
                                                        disabled={addingKind !== null}
                                                        onSave={(p) => saveDrive(row.id, p)}
                                                        onDelete={() => deleteRow('prism_agenda_drive_items', row.id)}
                                                    />
                                                ))
                                            )}
                                        </div>
                                    </section>

                                    <section className="space-y-3">
                                        <div className="flex items-center justify-between gap-2">
                                            <h4 className="text-sm font-bold text-stone-800">2. 调查方向</h4>
                                            <button
                                                type="button"
                                                onClick={() => void addSurvey()}
                                                disabled={addingKind !== null}
                                                title="添加一条"
                                                className="p-1 rounded-md text-stone-400 hover:text-violet-600 hover:bg-violet-50 transition-colors disabled:opacity-40"
                                            >
                                                <Plus size={14} />
                                            </button>
                                        </div>
                                        <div className="space-y-3">
                                            {filteredSurvey.length === 0 ? (
                                                <p className="text-xs text-stone-400">（无显示项）</p>
                                            ) : (
                                                filteredSurvey.map((row) => (
                                                    <SurveyRow
                                                        key={row.id}
                                                        item={row}
                                                        disabled={addingKind !== null}
                                                        onSave={(p) => saveSurvey(row.id, p)}
                                                        onDelete={() => deleteRow('prism_agenda_survey_items', row.id)}
                                                    />
                                                ))
                                            )}
                                        </div>
                                    </section>

                                    <section className="space-y-3">
                                        <div className="flex items-center justify-between gap-2">
                                            <h4 className="text-sm font-bold text-stone-800">3. 综合与开放问题</h4>
                                            <button
                                                type="button"
                                                onClick={() => void addSynthesis()}
                                                disabled={addingKind !== null}
                                                title="添加一条"
                                                className="p-1 rounded-md text-stone-400 hover:text-violet-600 hover:bg-violet-50 transition-colors disabled:opacity-40"
                                            >
                                                <Plus size={14} />
                                            </button>
                                        </div>
                                        <div className="space-y-3">
                                            {filteredSynth.length === 0 ? (
                                                <p className="text-xs text-stone-400">（无显示项）</p>
                                            ) : (
                                                filteredSynth.map((row) => (
                                                    <SynthesisRow
                                                        key={row.id}
                                                        item={row}
                                                        allInsights={allInsights}
                                                        disabled={addingKind !== null}
                                                        onSave={(p) => saveSynthesis(row.id, p)}
                                                        onDelete={() =>
                                                            deleteRow('prism_agenda_synthesis_items', row.id)
                                                        }
                                                    />
                                                ))
                                            )}
                                        </div>
                                    </section>

                                </div>
                            )}
                        </>
                    )}
                </div>
            )}
        </BoardColumn>
    );
}
