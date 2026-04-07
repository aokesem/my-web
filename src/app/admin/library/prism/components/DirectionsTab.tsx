"use client";

import React, { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";
import {
    Plus, Trash2, Save, Loader2, HelpCircle, Lightbulb, LinkIcon, X, ChevronRight, Filter, FolderPlus, Check
} from "lucide-react";

interface Question {
    id: string;
    project_id: string;
    content: string;
    sort_order: number;
}

interface Innovation {
    id: string;
    question_id: string;
    paper_id?: string;
    content: string;
    sort_order: number;
}

interface QuestionPaper {
    id: string;
    question_id: string;
    paper_id: string;
}

interface Project {
    id: string;
    name: string;
}

interface Paper {
    id: string;
    title: string;
    nickname?: string;
}

interface NoteGroupItem {
    id: string;
    content: string;
    sort_order: number;
}

// ---- Sub-components with explicit save buttons ----

function QuestionEditor({ questionId, initialContent, onSave }: { questionId: string; initialContent: string; onSave: (id: string, content: string) => void }) {
    const [content, setContent] = useState(initialContent);
    const changed = content !== initialContent;

    return (
        <div className="px-5 py-4 border-b border-zinc-800 space-y-2">
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">问题内容</label>
            <textarea
                value={content}
                onChange={e => setContent(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-3 text-sm text-white resize-none min-h-[60px] focus:ring-1 focus:ring-blue-500 outline-none"
            />
            {changed && (
                <div className="flex justify-end">
                    <button
                        onClick={() => onSave(questionId, content)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-500 transition-colors"
                    >
                        <Save size={12} /> 保存
                    </button>
                </div>
            )}
        </div>
    );
}

function InnovationEditor({ innovation, linkedPapers, onSave, onDelete }: {
    innovation: Innovation;
    linkedPapers: Paper[];
    onSave: (id: string, updates: Partial<Innovation>) => void;
    onDelete: (id: string) => void;
}) {
    const [content, setContent] = useState(innovation.content);
    const changed = content !== innovation.content;

    return (
        <div className="bg-zinc-800/50 rounded-lg p-3 space-y-2 border border-zinc-700/50 group">
            <textarea
                value={content}
                onChange={e => setContent(e.target.value)}
                className="w-full bg-transparent border-none text-sm text-zinc-300 resize-none min-h-[40px] focus:ring-0 outline-none p-0"
            />
            <div className="flex items-center justify-between">
                <select
                    value={innovation.paper_id || ""}
                    onChange={e => onSave(innovation.id, { paper_id: e.target.value || undefined })}
                    className="bg-zinc-900 border border-zinc-700 text-xs text-zinc-400 rounded px-2 py-1 max-w-[180px]"
                >
                    <option value="">不关联论文</option>
                    {linkedPapers.map(p => (
                        <option key={p.id} value={p.id}>{(p.nickname || p.title).slice(0, 25)}</option>
                    ))}
                </select>
                <div className="flex items-center gap-1">
                    {changed && (
                        <button
                            onClick={() => onSave(innovation.id, { content })}
                            className="p-1 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded transition-all"
                            title="保存"
                        >
                            <Save size={12} />
                        </button>
                    )}
                    <button
                        onClick={() => onDelete(innovation.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-zinc-600 hover:text-red-400 transition-all"
                    >
                        <Trash2 size={12} />
                    </button>
                </div>
            </div>
        </div>
    );
}

function NoteGroupEditor({ group, onSave, onDelete }: {
    group: NoteGroupItem;
    onSave: (id: string, content: string) => void;
    onDelete: (id: string) => void;
}) {
    const [content, setContent] = useState(group.content);
    const changed = content !== group.content;

    return (
        <div className="flex items-center gap-2 bg-zinc-800/60 rounded-lg px-3 py-2.5 border border-zinc-700/50 group">
            <Lightbulb size={12} className="text-amber-500 shrink-0" />
            <input
                type="text"
                value={content}
                onChange={e => setContent(e.target.value)}
                className="flex-1 bg-transparent text-sm text-zinc-300 outline-none border-none focus:text-white"
            />
            {changed && (
                <button
                    onClick={() => onSave(group.id, content)}
                    className="p-1 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded transition-all shrink-0"
                    title="保存"
                >
                    <Save size={12} />
                </button>
            )}
            <button
                onClick={() => onDelete(group.id)}
                className="opacity-0 group-hover:opacity-100 p-1 text-zinc-600 hover:text-red-400 transition-all shrink-0"
            >
                <Trash2 size={12} />
            </button>
        </div>
    );
}

export default function DirectionsTab() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [papers, setPapers] = useState<Paper[]>([]);
    const [selectedProjectId, setSelectedProjectId] = useState<string>("");
    const [questions, setQuestions] = useState<Question[]>([]);
    const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(null);
    const [questionPapers, setQuestionPapers] = useState<QuestionPaper[]>([]);
    const [innovations, setInnovations] = useState<Innovation[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [noteGroups, setNoteGroups] = useState<NoteGroupItem[]>([]);

    // Fetch projects & papers on mount
    useEffect(() => {
        const loadBase = async () => {
            const [{ data: p }, { data: pa }] = await Promise.all([
                supabase.from("prism_projects").select("id, name").order("sort_order"),
                supabase.from("prism_papers").select("id, title, nickname"),
            ]);
            setProjects(p || []);
            setPapers(pa || []);
            if (p && p.length > 0) setSelectedProjectId(p[0].id);
        };
        loadBase();
    }, []);

    // Fetch questions + note groups when project changes
    useEffect(() => {
        if (!selectedProjectId) return;
        const load = async () => {
            setIsLoading(true);
            setSelectedQuestionId(null);
            const [{ data: qData }, { data: ngData }] = await Promise.all([
                supabase.from("prism_research_questions").select("*").eq("project_id", selectedProjectId).order("sort_order"),
                supabase.from("prism_direction_notes").select("id, content, sort_order").eq("project_id", selectedProjectId).eq("column_side", "right").is("parent_id", null).order("sort_order"),
            ]);
            setQuestions(qData || []);
            setNoteGroups(ngData || []);
            setIsLoading(false);
        };
        load();
    }, [selectedProjectId]);

    // Fetch question details when question changes
    useEffect(() => {
        if (!selectedQuestionId) { setQuestionPapers([]); setInnovations([]); return; }
        const load = async () => {
            const [{ data: qp }, { data: inno }] = await Promise.all([
                supabase.from("prism_question_papers").select("*").eq("question_id", selectedQuestionId),
                supabase.from("prism_innovation_points").select("*").eq("question_id", selectedQuestionId).order("sort_order"),
            ]);
            setQuestionPapers(qp || []);
            setInnovations(inno || []);
        };
        load();
    }, [selectedQuestionId]);

    // --- CRUD ---

    const [projectPaperIds, setProjectPaperIds] = useState<string[]>([]);
    const [directions, setDirections] = useState<{ id: string; name: string }[]>([]);
    const [paperDirections, setPaperDirections] = useState<{ paper_id: string; direction_id: string }[]>([]);
    const [filterDirectionId, setFilterDirectionId] = useState<string>("");

    useEffect(() => {
        if (!selectedProjectId) return;
        Promise.all([
            supabase.from("prism_paper_projects").select("paper_id").eq("project_id", selectedProjectId),
            supabase.from("prism_directions").select("id, name").order("name"),
            supabase.from("prism_paper_directions").select("paper_id, direction_id"),
        ]).then(([{ data: pp }, { data: dirs }, { data: pd }]) => {
            setProjectPaperIds((pp || []).map((d: any) => d.paper_id));
            setDirections(dirs || []);
            setPaperDirections(pd || []);
        });
    }, [selectedProjectId]);

    const availablePapers = papers.filter(p => {
        if (!projectPaperIds.includes(p.id)) return false;
        if (filterDirectionId === "") return true;
        return paperDirections.some(pd => pd.paper_id === p.id && pd.direction_id === filterDirectionId);
    });

    const addQuestion = async () => {
        const { error } = await supabase.from("prism_research_questions").insert({
            project_id: selectedProjectId,
            content: "新研究问题...",
            sort_order: questions.length,
        });
        if (error) { toast.error("添加失败"); return; }
        toast.success("已添加");
        const { data } = await supabase.from("prism_research_questions").select("*").eq("project_id", selectedProjectId).order("sort_order");
        setQuestions(data || []);
    };

    const updateQuestion = async (id: string, content: string) => {
        const { error } = await supabase.from("prism_research_questions").update({ content }).eq("id", id);
        if (error) { toast.error("保存失败"); return; }
        toast.success("已保存");
        setQuestions(prev => prev.map(q => q.id === id ? { ...q, content } : q));
    };

    const deleteQuestion = async (id: string) => {
        if (!confirm("确定删除此问题？关联的创新点也会被删除。")) return;
        await supabase.from("prism_research_questions").delete().eq("id", id);
        setQuestions(prev => prev.filter(q => q.id !== id));
        if (selectedQuestionId === id) setSelectedQuestionId(null);
        toast.success("已删除");
    };

    const togglePaperLink = async (paperId: string) => {
        if (!selectedQuestionId) return;
        const exists = questionPapers.find(qp => qp.paper_id === paperId);
        if (exists) {
            await supabase.from("prism_question_papers").delete().eq("id", exists.id);
            setQuestionPapers(prev => prev.filter(qp => qp.id !== exists.id));
        } else {
            const { data } = await supabase.from("prism_question_papers").insert({
                question_id: selectedQuestionId,
                paper_id: paperId,
            }).select().single();
            if (data) setQuestionPapers(prev => [...prev, data]);
        }
    };

    const addInnovation = async () => {
        if (!selectedQuestionId) return;
        const { error } = await supabase.from("prism_innovation_points").insert({
            question_id: selectedQuestionId,
            content: "新创新点...",
            sort_order: innovations.length,
        });
        if (error) { toast.error("添加失败"); return; }
        const { data } = await supabase.from("prism_innovation_points").select("*").eq("question_id", selectedQuestionId).order("sort_order");
        setInnovations(data || []);
    };

    const updateInnovation = async (id: string, updates: Partial<Innovation>) => {
        const { error } = await supabase.from("prism_innovation_points").update(updates).eq("id", id);
        if (error) { toast.error("保存失败"); return; }
        toast.success("已保存");
        setInnovations(prev => prev.map(i => i.id === id ? { ...i, ...updates } : i));
    };

    const deleteInnovation = async (id: string) => {
        await supabase.from("prism_innovation_points").delete().eq("id", id);
        setInnovations(prev => prev.filter(i => i.id !== id));
    };

    // ---- Note Groups CRUD ----
    const refreshNoteGroups = async () => {
        const { data } = await supabase.from("prism_direction_notes").select("id, content, sort_order").eq("project_id", selectedProjectId).eq("column_side", "right").is("parent_id", null).order("sort_order");
        setNoteGroups(data || []);
    };

    const addNoteGroup = async () => {
        const { error } = await supabase.from("prism_direction_notes").insert({
            project_id: selectedProjectId,
            column_side: "right",
            content: "新分组...",
            sort_order: noteGroups.length,
            parent_id: null,
        });
        if (error) { toast.error("添加失败"); return; }
        toast.success("已添加");
        refreshNoteGroups();
    };

    const updateNoteGroup = async (id: string, content: string) => {
        const { error } = await supabase.from("prism_direction_notes").update({ content }).eq("id", id);
        if (error) { toast.error("保存失败"); return; }
        toast.success("已保存");
        setNoteGroups(prev => prev.map(g => g.id === id ? { ...g, content } : g));
    };

    const deleteNoteGroup = async (id: string) => {
        if (!confirm("确定删除此分组？其下所有笔记将被删除。")) return;
        await supabase.from("prism_direction_notes").delete().eq("id", id);
        setNoteGroups(prev => prev.filter(g => g.id !== id));
        toast.success("已删除");
    };

    const linkedPaperIds = new Set(questionPapers.map(qp => qp.paper_id));

    return (
        <div className="space-y-6">
            {/* Project Selector */}
            <div className="flex items-center gap-3">
                <label className="text-sm font-bold text-zinc-400">项目</label>
                <select
                    value={selectedProjectId}
                    onChange={e => setSelectedProjectId(e.target.value)}
                    className="bg-zinc-900 border border-zinc-700 text-white rounded-lg px-3 py-2 text-sm"
                >
                    {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
            </div>

            <div className="flex gap-6 h-[600px]">
                {/* Left: Questions List */}
                <div className="w-[320px] shrink-0 bg-zinc-900 rounded-xl border border-zinc-800 flex flex-col overflow-hidden">
                    <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <HelpCircle size={16} className="text-blue-400" />
                            <span className="text-sm font-bold text-white">研究问题</span>
                            <span className="text-xs font-mono text-zinc-500">{questions.length}</span>
                        </div>
                        <button onClick={addQuestion} className="p-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors">
                            <Plus size={14} />
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-1">
                        {isLoading ? (
                            <div className="flex items-center justify-center py-10"><Loader2 size={20} className="animate-spin text-zinc-600" /></div>
                        ) : questions.map(q => (
                            <div
                                key={q.id}
                                onClick={() => setSelectedQuestionId(q.id)}
                                className={`group p-3 rounded-lg cursor-pointer transition-all flex items-start gap-2 ${
                                    selectedQuestionId === q.id ? "bg-blue-600/20 border border-blue-500/30" : "hover:bg-zinc-800 border border-transparent"
                                }`}
                            >
                                <ChevronRight size={14} className={`mt-0.5 shrink-0 transition-transform ${selectedQuestionId === q.id ? "text-blue-400 rotate-90" : "text-zinc-600"}`} />
                                <span className="text-sm text-zinc-300 leading-snug flex-1 line-clamp-2">{q.content}</span>
                                <button
                                    onClick={e => { e.stopPropagation(); deleteQuestion(q.id); }}
                                    className="opacity-0 group-hover:opacity-100 p-1 text-zinc-600 hover:text-red-400 transition-all shrink-0"
                                ><Trash2 size={12} /></button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right: Question Details */}
                <div className="flex-1 bg-zinc-900 rounded-xl border border-zinc-800 flex flex-col overflow-hidden">
                    {selectedQuestionId ? (
                        <>
                            {/* Question Content Editor */}
                            <QuestionEditor
                                key={selectedQuestionId}
                                questionId={selectedQuestionId}
                                initialContent={questions.find(q => q.id === selectedQuestionId)?.content || ""}
                                onSave={updateQuestion}
                            />

                            <div className="flex-1 flex overflow-hidden">
                                {/* Left half: Linked Papers */}
                                <div className="w-1/2 border-r border-zinc-800 flex flex-col overflow-hidden">
                                    <div className="px-4 py-3 border-b border-zinc-800/50 flex items-center gap-2">
                                        <LinkIcon size={14} className="text-violet-400" />
                                        <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">关联论文</span>
                                        <select
                                            value={filterDirectionId}
                                            onChange={e => setFilterDirectionId(e.target.value)}
                                            className="ml-auto bg-zinc-800 border border-zinc-700 text-xs text-zinc-400 rounded px-2 py-1 max-w-[120px]"
                                        >
                                            <option value="">全部方向</option>
                                            {directions.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                        </select>
                                    </div>
                                    <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
                                        {availablePapers.length === 0 ? (
                                            <div className="text-xs text-zinc-600 text-center py-4">该项目暂无关联论文</div>
                                        ) : availablePapers.map(paper => (
                                            <label
                                                key={paper.id}
                                                className={`flex items-center gap-2.5 p-2.5 rounded-lg cursor-pointer transition-colors ${
                                                    linkedPaperIds.has(paper.id) ? "bg-violet-500/10 border border-violet-500/20" : "hover:bg-zinc-800 border border-transparent"
                                                }`}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={linkedPaperIds.has(paper.id)}
                                                    onChange={() => togglePaperLink(paper.id)}
                                                    className="rounded border-zinc-600 text-violet-500 focus:ring-violet-500"
                                                />
                                                <span className="text-sm text-zinc-300 leading-snug line-clamp-1">
                                                    {paper.nickname || paper.title}
                                                </span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                {/* Right half: Innovation Points */}
                                <div className="w-1/2 flex flex-col overflow-hidden">
                                    <div className="px-4 py-3 border-b border-zinc-800/50 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Lightbulb size={14} className="text-amber-400" />
                                            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">创新点</span>
                                        </div>
                                        <button onClick={addInnovation} className="p-1 bg-amber-600 text-white rounded-md hover:bg-amber-500 transition-colors">
                                            <Plus size={12} />
                                        </button>
                                    </div>
                                    <div className="flex-1 overflow-y-auto p-3 space-y-2">
                                        {innovations.map(inno => (
                                            <InnovationEditor
                                                key={inno.id}
                                                innovation={inno}
                                                linkedPapers={availablePapers.filter(p => linkedPaperIds.has(p.id))}
                                                onSave={updateInnovation}
                                                onDelete={deleteInnovation}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex items-center justify-center text-zinc-600 font-mono text-sm">
                            ← 选择一个研究问题进行编辑
                        </div>
                    )}
                </div>
            </div>

            {/* ===== Note Groups Section ===== */}
            <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-5">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <Lightbulb size={16} className="text-amber-400" />
                        <span className="text-sm font-bold text-white">灵感分组管理</span>
                        <span className="text-xs font-mono text-zinc-500">{noteGroups.length} 组</span>
                    </div>
                    <button
                        onClick={addNoteGroup}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 text-white rounded-lg text-xs font-bold hover:bg-amber-500 transition-colors"
                    >
                        <FolderPlus size={14} /> 新建分组
                    </button>
                </div>
                {noteGroups.length === 0 ? (
                    <div className="text-center py-6 text-zinc-600 text-xs font-mono">暂无灵感分组，点击上方按钮新建</div>
                ) : (
                    <div className="grid grid-cols-2 gap-3">
                        {noteGroups.map(g => (
                            <NoteGroupEditor
                                key={g.id}
                                group={g}
                                onSave={updateNoteGroup}
                                onDelete={deleteNoteGroup}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
