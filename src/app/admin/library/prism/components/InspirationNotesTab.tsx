"use client";

import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";
import { Plus, Trash2, Save, Loader2, Lightbulb, FolderPlus, ChevronDown, ChevronRight } from "lucide-react";

interface Project {
    id: string;
    name: string;
}

interface DirectionNoteRow {
    id: string;
    project_id: string;
    column_side: string;
    content: string;
    sort_order: number;
    parent_id: string | null;
    created_at?: string;
}

interface NoteGroup {
    title: DirectionNoteRow;
    children: DirectionNoteRow[];
}

export default function InspirationNotesTab() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [selectedProjectId, setSelectedProjectId] = useState("");
    const [noteGroups, setNoteGroups] = useState<NoteGroup[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [openGroups, setOpenGroups] = useState<Set<string>>(new Set());

    useEffect(() => {
        supabase
            .from("prism_projects")
            .select("id, name")
            .order("sort_order")
            .then(({ data }) => {
                setProjects(data || []);
                if (data?.length) setSelectedProjectId(data[0].id);
            });
    }, []);

    const loadNotes = useCallback(async () => {
        if (!selectedProjectId) return;
        setIsLoading(true);
        const { data, error } = await supabase
            .from("prism_direction_notes")
            .select("*")
            .eq("project_id", selectedProjectId)
            .eq("column_side", "right")
            .order("sort_order");

        if (error) {
            toast.error("加载失败");
            setIsLoading(false);
            return;
        }

        const rows = (data || []) as DirectionNoteRow[];
        const titles = rows.filter((n) => !n.parent_id);
        const childMap = new Map<string, DirectionNoteRow[]>();
        rows.filter((n) => n.parent_id).forEach((n) => {
            if (!childMap.has(n.parent_id!)) childMap.set(n.parent_id!, []);
            childMap.get(n.parent_id!)!.push(n);
        });

        const groups: NoteGroup[] = titles.map((t) => ({
            title: t,
            children: childMap.get(t.id) || [],
        }));

        setNoteGroups(groups);
        setOpenGroups(new Set(groups.map((g) => g.title.id)));
        setIsLoading(false);
    }, [selectedProjectId]);

    useEffect(() => {
        loadNotes();
    }, [loadNotes]);

    const toggleGroup = (id: string) => {
        setOpenGroups((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const addGroup = async () => {
        const { error } = await supabase.from("prism_direction_notes").insert({
            project_id: selectedProjectId,
            column_side: "right",
            content: "新分组...",
            sort_order: noteGroups.length,
            parent_id: null,
        });
        if (error) {
            toast.error("添加失败");
            return;
        }
        toast.success("已添加分组");
        loadNotes();
    };

    const addChild = async (parentId: string, sortOrder: number) => {
        const { error } = await supabase.from("prism_direction_notes").insert({
            project_id: selectedProjectId,
            column_side: "right",
            content: "新笔记...",
            sort_order: sortOrder,
            parent_id: parentId,
        });
        if (error) {
            toast.error("添加失败");
            return;
        }
        toast.success("已添加笔记");
        setOpenGroups((prev) => new Set(prev).add(parentId));
        loadNotes();
    };

    const updateNote = async (id: string, content: string) => {
        const { error } = await supabase.from("prism_direction_notes").update({ content }).eq("id", id);
        if (error) {
            toast.error("保存失败");
            return;
        }
        toast.success("已保存");
        loadNotes();
    };

    const deleteNote = async (id: string, isGroup: boolean) => {
        const msg = isGroup
            ? "确定删除此分组？组内笔记将一并删除。"
            : "确定删除这条笔记？";
        if (!confirm(msg)) return;

        if (isGroup) {
            await supabase.from("prism_direction_notes").delete().eq("parent_id", id);
        }
        const { error } = await supabase.from("prism_direction_notes").delete().eq("id", id);
        if (error) {
            toast.error("删除失败");
            return;
        }
        toast.success("已删除");
        loadNotes();
    };

    return (
        <div className="space-y-6">
            <p className="text-xs text-zinc-500">
                原 Library「性质」中的灵感与笔记（按项目、分组存储）。可在此查看与编辑，便于手动迁移到论文数据。
            </p>

            <div className="flex items-center gap-3">
                <label className="text-sm font-bold text-zinc-400">项目</label>
                <select
                    value={selectedProjectId}
                    onChange={(e) => setSelectedProjectId(e.target.value)}
                    className="bg-zinc-900 border border-zinc-700 text-white rounded-lg px-3 py-2 text-sm min-w-[200px]"
                >
                    {projects.map((p) => (
                        <option key={p.id} value={p.id}>
                            {p.name}
                        </option>
                    ))}
                </select>
                <button
                    type="button"
                    onClick={addGroup}
                    className="flex items-center gap-1.5 px-3 py-2 bg-amber-600 text-white rounded-lg text-xs font-bold hover:bg-amber-500 transition-colors"
                >
                    <FolderPlus size={14} /> 新建分组
                </button>
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center py-16">
                    <Loader2 size={24} className="animate-spin text-zinc-600" />
                </div>
            ) : noteGroups.length === 0 ? (
                <div className="text-center py-12 text-zinc-600 text-sm border border-dashed border-zinc-800 rounded-xl">
                    该项目暂无灵感与笔记
                </div>
            ) : (
                <div className="space-y-3">
                    {noteGroups.map((group) => (
                        <NoteGroupBlock
                            key={group.title.id}
                            group={group}
                            isOpen={openGroups.has(group.title.id)}
                            onToggle={() => toggleGroup(group.title.id)}
                            onSave={updateNote}
                            onDelete={deleteNote}
                            onAddChild={() => addChild(group.title.id, group.children.length)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

function NoteGroupBlock({
    group,
    isOpen,
    onToggle,
    onSave,
    onDelete,
    onAddChild,
}: {
    group: NoteGroup;
    isOpen: boolean;
    onToggle: () => void;
    onSave: (id: string, content: string) => void;
    onDelete: (id: string, isGroup: boolean) => void;
    onAddChild: () => void;
}) {
    const [titleDraft, setTitleDraft] = useState(group.title.content);
    const [childDrafts, setChildDrafts] = useState<Record<string, string>>({});

    useEffect(() => {
        setTitleDraft(group.title.content);
        const drafts: Record<string, string> = {};
        group.children.forEach((c) => {
            drafts[c.id] = c.content;
        });
        setChildDrafts(drafts);
    }, [group]);

    return (
        <div className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-zinc-800/80 bg-zinc-900/80">
                <button type="button" onClick={onToggle} className="p-1 text-zinc-500 hover:text-zinc-300">
                    {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </button>
                <Lightbulb size={14} className="text-amber-400 shrink-0" />
                <input
                    type="text"
                    value={titleDraft}
                    onChange={(e) => setTitleDraft(e.target.value)}
                    className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-sm text-white outline-none focus:ring-1 focus:ring-amber-500/50"
                    placeholder="分组标题"
                />
                {titleDraft !== group.title.content && (
                    <button
                        type="button"
                        onClick={() => onSave(group.title.id, titleDraft)}
                        className="p-1.5 text-blue-400 hover:bg-blue-500/10 rounded"
                        title="保存分组标题"
                    >
                        <Save size={14} />
                    </button>
                )}
                <button
                    type="button"
                    onClick={onAddChild}
                    className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded"
                    title="添加笔记"
                >
                    <Plus size={14} />
                </button>
                <button
                    type="button"
                    onClick={() => onDelete(group.title.id, true)}
                    className="p-1.5 text-zinc-600 hover:text-red-400 rounded"
                >
                    <Trash2 size={14} />
                </button>
            </div>

            {isOpen && (
                <div className="p-4 space-y-3">
                    {group.children.length === 0 ? (
                        <p className="text-xs text-zinc-600 text-center py-2">组内暂无笔记</p>
                    ) : (
                        group.children.map((child) => {
                            const draft = childDrafts[child.id] ?? child.content;
                            const changed = draft !== child.content;
                            return (
                                <div key={child.id} className="flex gap-2 items-start">
                                    <textarea
                                        value={draft}
                                        onChange={(e) =>
                                            setChildDrafts((prev) => ({ ...prev, [child.id]: e.target.value }))
                                        }
                                        className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg p-3 text-sm text-zinc-200 resize-y min-h-[72px] outline-none focus:ring-1 focus:ring-amber-500/30"
                                    />
                                    <div className="flex flex-col gap-1 shrink-0 pt-1">
                                        {changed && (
                                            <button
                                                type="button"
                                                onClick={() => onSave(child.id, draft)}
                                                className="p-1.5 text-blue-400 hover:bg-blue-500/10 rounded"
                                            >
                                                <Save size={14} />
                                            </button>
                                        )}
                                        <button
                                            type="button"
                                            onClick={() => onDelete(child.id, false)}
                                            className="p-1.5 text-zinc-600 hover:text-red-400 rounded"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            )}
        </div>
    );
}
