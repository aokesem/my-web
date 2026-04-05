'use client';

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Pencil, Save, X, Plus, Trash2, Loader2, FileText, Lightbulb, MessageSquare, LinkIcon } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import type { ResearchQuestion, DirectionNote, PaperDetail } from '../types';

// ============================================================
// BOLD TEXT HELPERS (shared with ProjectView)
// ============================================================

function handleBoldShortcut(e: React.KeyboardEvent<HTMLTextAreaElement>, setContent: (val: string) => void) {
    if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault();
        const ta = e.currentTarget;
        const start = ta.selectionStart;
        const end = ta.selectionEnd;
        const text = ta.value;
        const selected = text.substring(start, end);

        let newText: string, newStart: number, newEnd: number;

        if (start >= 2 && end <= text.length - 2 && text.substring(start - 2, start) === '**' && text.substring(end, end + 2) === '**') {
            newText = text.substring(0, start - 2) + selected + text.substring(end + 2);
            newStart = start - 2; newEnd = end - 2;
        } else if (selected.startsWith('**') && selected.endsWith('**') && selected.length >= 4) {
            newText = text.substring(0, start) + selected.slice(2, -2) + text.substring(end);
            newStart = start; newEnd = end - 4;
        } else {
            newText = text.substring(0, start) + '**' + selected + '**' + text.substring(end);
            newStart = start + 2; newEnd = end + 2;
        }

        setContent(newText);
        requestAnimationFrame(() => { ta.selectionStart = newStart; ta.selectionEnd = newEnd; });
    }
}

function renderBoldText(text: string) {
    return text.split(/(\*\*.*?\*\*)/g).map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={i} className="font-extrabold text-stone-900">{part.slice(2, -2)}</strong>;
        }
        return <span key={i}>{part}</span>;
    });
}

// ============================================================
// NOTES COLUMN
// ============================================================

interface NotesColumnProps {
    title: string;
    icon: React.ReactNode;
    color: string;
    notes: DirectionNote[];
    projectId: string;
    columnSide: 'left' | 'right';
    mutate: () => void;
}

function NotesColumn({ title, icon, color, notes, projectId, columnSide, mutate }: NotesColumnProps) {
    const [editingId, setEditingId] = useState<string | null>(null);
    const [tempContent, setTempContent] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const handleAdd = async () => {
        const { error } = await supabase.from('prism_direction_notes').insert({
            project_id: projectId,
            column_side: columnSide,
            content: '新笔记...',
            sort_order: notes.length,
        });
        if (error) { toast.error('添加失败'); return; }
        mutate();
    };

    const handleSave = async (id: string) => {
        setIsSaving(true);
        const { error } = await supabase.from('prism_direction_notes').update({ content: tempContent }).eq('id', id);
        if (error) { toast.error('保存失败'); } else { toast.success('已保存'); }
        setEditingId(null);
        setIsSaving(false);
        mutate();
    };

    const handleDelete = async (id: string) => {
        if (!confirm('确定删除这条笔记？')) return;
        const { error } = await supabase.from('prism_direction_notes').delete().eq('id', id);
        if (error) { toast.error('删除失败'); return; }
        mutate();
    };

    return (
        <div className="flex flex-col h-full">
            <div className={`flex items-center gap-2 px-4 py-3 border-b border-stone-100 bg-stone-50/50 shrink-0`}>
                {icon}
                <h3 className="text-[13px] font-bold font-mono uppercase tracking-wider text-stone-700">{title}</h3>
                <span className="text-[10px] font-mono font-bold text-stone-300 bg-stone-100 px-1.5 py-0.5 rounded ml-auto">{notes.length}</span>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
                {notes.map(note => (
                    <div key={note.id} className={`p-3 rounded-xl border border-stone-200/60 ${color} hover:bg-white transition-colors relative group/note`}>
                        {editingId === note.id ? (
                            <div className="space-y-2">
                                <textarea
                                    value={tempContent}
                                    onChange={e => setTempContent(e.target.value)}
                                    onKeyDown={e => handleBoldShortcut(e, setTempContent)}
                                    className="w-full bg-white border border-stone-200 rounded-lg p-2 text-sm text-stone-700 focus:ring-1 focus:ring-violet-200 outline-none min-h-[60px] resize-none"
                                    placeholder="支持 Ctrl+B 加粗"
                                    autoFocus
                                />
                                <div className="flex justify-end gap-1.5">
                                    <button onClick={() => setEditingId(null)} className="p-1 text-stone-400 hover:text-stone-600"><X size={14} /></button>
                                    <button
                                        onClick={() => handleSave(note.id)}
                                        disabled={isSaving}
                                        className="flex items-center gap-1 px-2.5 py-1 bg-violet-600 text-white rounded-lg text-xs font-bold hover:bg-violet-700 disabled:opacity-50"
                                    >
                                        {isSaving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />} 保存
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover/note:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => { setEditingId(note.id); setTempContent(note.content); }}
                                        className="p-1 text-stone-400 hover:text-violet-600 hover:bg-violet-50 rounded-md"
                                    ><Pencil size={12} /></button>
                                    <button
                                        onClick={() => handleDelete(note.id)}
                                        className="p-1 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-md"
                                    ><Trash2 size={12} /></button>
                                </div>
                                <div className="text-[13px] text-stone-700 leading-relaxed pr-12 whitespace-pre-wrap">
                                    {renderBoldText(note.content)}
                                </div>
                            </>
                        )}
                    </div>
                ))}
                <button
                    onClick={handleAdd}
                    className="w-full p-2 rounded-xl border-2 border-dashed border-stone-200 text-stone-400 hover:border-violet-300 hover:text-violet-500 transition-all text-xs font-bold flex items-center justify-center gap-1"
                >
                    <Plus size={14} /> 添加笔记
                </button>
            </div>
        </div>
    );
}

// ============================================================
// PAPERS COLUMN (middle)
// ============================================================

interface PapersColumnProps {
    questions: ResearchQuestion[];
    allPapers: PaperDetail[];
    onOpenPaper: (id: string) => void;
}

function PapersColumn({ questions, allPapers, onOpenPaper }: PapersColumnProps) {
    const [openGroups, setOpenGroups] = useState<Set<string>>(new Set(questions.map(q => q.id)));

    const toggle = (id: string) => {
        setOpenGroups(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    return (
        <div className="flex flex-col h-full">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-stone-100 bg-stone-50/50 shrink-0">
                <div className="p-1 rounded-md border bg-violet-50 text-violet-500 border-violet-100">
                    <FileText size={14} />
                </div>
                <h3 className="text-[13px] font-bold font-mono uppercase tracking-wider text-stone-700">涉及论文</h3>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
                {questions.filter(q => q.paper_ids.length > 0).map(q => (
                    <div key={q.id} className="space-y-1.5">
                        <button onClick={() => toggle(q.id)} className="flex items-center justify-between w-full group py-1">
                            <div className="flex items-center gap-1.5">
                                <ChevronDown size={14} className={`text-stone-400 transition-transform duration-200 ${openGroups.has(q.id) ? '' : '-rotate-90'}`} />
                                <span className="text-xs font-bold text-stone-600 group-hover:text-stone-900 transition-colors line-clamp-1">
                                    {q.content.length > 20 ? q.content.slice(0, 20) + '...' : q.content}
                                </span>
                            </div>
                            <span className="text-[10px] font-mono text-stone-300">{q.paper_ids.length}</span>
                        </button>

                        <AnimatePresence initial={false}>
                            {openGroups.has(q.id) && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="overflow-hidden"
                                >
                                    <div className="flex flex-col gap-1.5 pl-2">
                                        {q.paper_ids.map(pid => {
                                            const paper = allPapers.find(p => p.id === pid);
                                            if (!paper) return null;
                                            return (
                                                <div
                                                    key={pid}
                                                    onClick={() => onOpenPaper(pid)}
                                                    className="group/card p-2.5 rounded-xl border border-stone-200/60 bg-white hover:border-violet-300 hover:shadow-sm cursor-pointer transition-all"
                                                >
                                                    <div className="text-[10px] font-mono text-stone-400 mb-1 flex items-center justify-between">
                                                        <span>{paper.year || 'N/A'}</span>
                                                        {paper.read_depth === '精读' && (
                                                            <span className="text-emerald-500 font-bold bg-emerald-50 px-1 rounded">精读</span>
                                                        )}
                                                    </div>
                                                    <div className="font-medium text-[13px] text-stone-700 leading-snug group-hover/card:text-violet-700 transition-colors line-clamp-2">
                                                        {paper.nickname || paper.title}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                ))}
                {questions.every(q => q.paper_ids.length === 0) && (
                    <div className="text-center py-8 text-stone-300 text-xs font-mono">暂无关联论文</div>
                )}
            </div>
        </div>
    );
}

// ============================================================
// MAIN EXPORT
// ============================================================

interface DirectionNotesPanelProps {
    questions: ResearchQuestion[];
    leftNotes: DirectionNote[];
    rightNotes: DirectionNote[];
    allPapers: PaperDetail[];
    projectId: string;
    onOpenPaper: (id: string) => void;
    mutate: () => void;
}

export default function DirectionNotesPanel({ questions, leftNotes, rightNotes, allPapers, projectId, onOpenPaper, mutate }: DirectionNotesPanelProps) {
    return (
        <div className="flex-1 flex overflow-hidden bg-white rounded-b-3xl">
            {/* Left column */}
            <div className="flex-1 border-r border-stone-100 min-w-[220px]">
                <NotesColumn
                    title="问题思考"
                    icon={<div className="p-1 rounded-md border bg-blue-50 text-blue-500 border-blue-100"><MessageSquare size={14} /></div>}
                    color="bg-blue-50/30"
                    notes={leftNotes}
                    projectId={projectId}
                    columnSide="left"
                    mutate={mutate}
                />
            </div>

            {/* Middle column */}
            <div className="flex-1 border-r border-stone-100 min-w-[220px]">
                <PapersColumn questions={questions} allPapers={allPapers} onOpenPaper={onOpenPaper} />
            </div>

            {/* Right column */}
            <div className="flex-1 min-w-[220px]">
                <NotesColumn
                    title="灵感与笔记"
                    icon={<div className="p-1 rounded-md border bg-amber-50 text-amber-500 border-amber-100"><Lightbulb size={14} /></div>}
                    color="bg-amber-50/30"
                    notes={rightNotes}
                    projectId={projectId}
                    columnSide="right"
                    mutate={mutate}
                />
            </div>
        </div>
    );
}
