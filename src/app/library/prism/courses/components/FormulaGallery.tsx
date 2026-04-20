'use client';

import React, { useState, useMemo } from 'react';
import { Pencil, Save, X, Loader2, Plus, ChevronDown, ChevronUp, Sigma, Hash } from 'lucide-react';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import type { CourseFormula, CourseChapter } from '../../types';

// Strip common LaTeX delimiters: $$...$$, $...$, \[...\], \(...\)
function stripLatexDelimiters(raw: string): string {
    let s = raw.trim();
    if (s.startsWith('$$') && s.endsWith('$$')) return s.slice(2, -2).trim();
    if (s.startsWith('$') && s.endsWith('$')) return s.slice(1, -1).trim();
    if (s.startsWith('\\[') && s.endsWith('\\]')) return s.slice(2, -2).trim();
    if (s.startsWith('\\(') && s.endsWith('\\)')) return s.slice(2, -2).trim();
    return s;
}

interface FormulaGalleryProps {
    formulas: CourseFormula[];
    chapters: CourseChapter[];
    courseId: string;
    currentChapterId?: string;
    overviewMode?: boolean;
    onSaveFormula: (formula: Partial<CourseFormula>) => Promise<void>;
    onDeleteFormula: (formulaId: string) => Promise<void>;
    onUpdateFormula: (formulaId: string, updates: Partial<CourseFormula>) => Promise<void>;
}

interface FormulaCardProps {
    formula: CourseFormula;
    onDelete: () => void;
    onUpdate: (updates: Partial<CourseFormula>) => Promise<void>;
}

function FormulaCard({ formula, onDelete, onUpdate }: FormulaCardProps) {
    const [editing, setEditing] = useState(false);
    const [tempName, setTempName] = useState(formula.name);
    const [tempLatex, setTempLatex] = useState(formula.latex);
    const [tempDesc, setTempDesc] = useState(formula.description || '');
    const [saving, setSaving] = useState(false);

    // 判断是否为长公式：根据源码长度或是否包含特定换行/大型环境
    const isLongFormula = useMemo(() => {
        const raw = formula.latex;
        return raw.length > 50 || raw.includes('\\begin{aligned}') || raw.includes('\\\\');
    }, [formula.latex]);

    const renderedLatex = useMemo(() => {
        try {
            const cleaned = stripLatexDelimiters(formula.latex);
            return katex.renderToString(cleaned, { throwOnError: false, displayMode: true });
        } catch {
            return `<span style="color:#ef4444;">${formula.latex}</span>`;
        }
    }, [formula.latex]);

    const handleSave = async () => {
        setSaving(true);
        try {
            await onUpdate({ name: tempName, latex: tempLatex, description: tempDesc || undefined });
            setEditing(false);
        } finally {
            setSaving(false);
        }
    };

    if (editing) {
        return (
            <div className={`bg-white rounded-xl border border-stone-200 p-4 space-y-3 shadow-sm ${isLongFormula ? 'md:col-span-2' : ''}`}>
                <input
                    value={tempName}
                    onChange={e => setTempName(e.target.value)}
                    placeholder="公式名称"
                    className="w-full bg-stone-50 border border-stone-200 rounded-lg px-3 py-1.5 text-sm font-bold text-stone-700 focus:outline-none focus:ring-1 focus:ring-stone-300"
                />
                <textarea
                    value={tempLatex}
                    onChange={e => setTempLatex(e.target.value)}
                    placeholder="LaTeX 公式，如 E = mc^2"
                    className="w-full bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 text-sm font-mono text-stone-700 focus:outline-none focus:ring-1 focus:ring-stone-300 resize-none min-h-[60px]"
                />
                <input
                    value={tempDesc}
                    onChange={e => setTempDesc(e.target.value)}
                    placeholder="简短描述（可选）"
                    className="w-full bg-stone-50 border border-stone-200 rounded-lg px-3 py-1.5 text-sm text-stone-600 focus:outline-none focus:ring-1 focus:ring-stone-300"
                />
                <div className="flex justify-between">
                    <button onClick={onDelete} className="text-xs text-red-400 hover:text-red-600 transition-colors">
                        删除公式
                    </button>
                    <div className="flex gap-2">
                        <button onClick={() => setEditing(false)} className="text-xs text-stone-400 hover:text-stone-600 px-2 py-1">
                            取消
                        </button>
                        <button onClick={handleSave} disabled={saving || !tempName || !tempLatex} className="flex items-center gap-1 px-3 py-1.5 bg-stone-800 text-white rounded-lg text-xs font-bold hover:bg-stone-900 disabled:opacity-50 transition-colors">
                            {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                            保存
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div id={`formula-${formula.id}`} className={`group bg-white/80 rounded-xl border border-stone-200/60 p-4 hover:border-stone-300 hover:shadow-sm transition-all cursor-default relative ${isLongFormula ? 'md:col-span-2' : ''}`}>
            <button
                onClick={() => {
                    setTempName(formula.name);
                    setTempLatex(formula.latex);
                    setTempDesc(formula.description || '');
                    setEditing(true);
                }}
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1.5 rounded-md text-stone-300 hover:text-stone-600 hover:bg-stone-100 transition-all"
            >
                <Pencil size={12} />
            </button>
            <div className="text-[14px] font-mono font-bold uppercase tracking-wider text-stone-800 mb-2">
                {formula.name}
            </div>
            <div
                className="text-center py-2 overflow-x-auto overflow-y-hidden custom-scrollbar-thin"
                dangerouslySetInnerHTML={{ __html: renderedLatex }}
            />
            {formula.description && (
                <p className="text-[11px] text-stone-500 mt-2 leading-snug border-t border-stone-100 pt-2">
                    {formula.description}
                </p>
            )}
        </div>
    );
}

export function FormulaGallery({
    formulas,
    chapters,
    courseId,
    currentChapterId,
    overviewMode = false,
    onSaveFormula,
    onDeleteFormula,
    onUpdateFormula
}: FormulaGalleryProps) {
    const [addingToChapter, setAddingToChapter] = useState<string | null>(null);
    const [collapsed, setCollapsed] = useState(false);

    // Add form state
    const [newName, setNewName] = useState('');
    const [newLatex, setNewLatex] = useState('');
    const [newDesc, setNewDesc] = useState('');
    const [saving, setSaving] = useState(false);

    const handleAdd = async (chapterId?: string) => {
        if (!newName || !newLatex) return;
        setSaving(true);
        try {
            await onSaveFormula({
                course_id: courseId,
                chapter_id: chapterId === 'global' ? undefined : chapterId,
                name: newName,
                latex: newLatex,
                description: newDesc || undefined,
                sort_order: formulas.length,
            });
            setNewName('');
            setNewLatex('');
            setNewDesc('');
            setAddingToChapter(null);
        } finally {
            setSaving(false);
        }
    };

    // Filtered formulas based on current mode
    const displayFormulas = useMemo(() => {
        if (overviewMode) return formulas;
        return formulas.filter(f => f.chapter_id === currentChapterId);
    }, [formulas, overviewMode, currentChapterId]);

    // Grouping for overview mode
    const formulaGroups = useMemo(() => {
        if (!overviewMode) return [];

        const groups: { chapterId?: string; title: string; formulas: CourseFormula[] }[] = [];

        // 1. Global group (chapter_id is null)
        const globalFormulas = formulas.filter(f => !f.chapter_id);
        if (globalFormulas.length > 0) {
            groups.push({ title: '全课通用公式', formulas: globalFormulas });
        }

        // 2. Per chapter groups
        chapters.forEach(ch => {
            const chFormulas = formulas.filter(f => f.chapter_id === ch.id);
            if (chFormulas.length > 0 || addingToChapter === ch.id) {
                groups.push({ chapterId: ch.id, title: ch.title, formulas: chFormulas });
            }
        });

        return groups;
    }, [overviewMode, formulas, chapters, addingToChapter]);

    const renderAddForm = (chapterId?: string) => (
        <div className="bg-stone-50 rounded-xl border border-stone-200/60 p-4 space-y-3 mt-3">
            <input
                value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder="公式名称，如「欧拉公式」"
                autoFocus
                className="w-full bg-white border border-stone-200 rounded-lg px-3 py-1.5 text-sm font-bold text-stone-700 focus:outline-none focus:ring-1 focus:ring-stone-300"
            />
            <textarea
                value={newLatex}
                onChange={e => setNewLatex(e.target.value)}
                placeholder="LaTeX 源码，如 e^{i\pi} + 1 = 0"
                className="w-full bg-white border border-stone-200 rounded-lg px-3 py-2 text-sm font-mono text-stone-700 focus:outline-none focus:ring-1 focus:ring-stone-300 resize-none min-h-[60px]"
            />
            <input
                value={newDesc}
                onChange={e => setNewDesc(e.target.value)}
                placeholder="简短描述（可选）"
                className="w-full bg-white border border-stone-200 rounded-lg px-3 py-1.5 text-sm text-stone-600 focus:outline-none focus:ring-1 focus:ring-stone-300"
            />
            <div className="flex justify-end gap-2">
                <button onClick={() => setAddingToChapter(null)} className="text-xs text-stone-400 hover:text-stone-600 px-2 py-1">
                    取消
                </button>
                <button onClick={() => handleAdd(chapterId)} disabled={saving || !newName || !newLatex} className="flex items-center gap-1 px-3 py-1.5 bg-stone-800 text-white rounded-xl text-xs font-bold hover:bg-stone-900 disabled:opacity-50 transition-colors shadow-sm shadow-stone-200">
                    {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                    添加公式
                </button>
            </div>
        </div>
    );

    if (overviewMode) {
        return (
            <div className="space-y-12 mb-20 animate-in fade-in duration-500">
                {formulaGroups.map(group => (
                    <div key={group.chapterId || 'global'} id={`overview-chapter-${group.chapterId}`} className="scroll-mt-24">
                        <div className="flex items-center justify-between border-b border-stone-200 pb-3 mb-6">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-stone-100 flex items-center justify-center text-stone-500">
                                    {group.chapterId ? <Hash size={14} /> : <Sigma size={14} />}
                                </div>
                                <h3 className="text-lg font-serif font-bold text-stone-800">{group.title}</h3>
                                <span className="text-xs font-mono text-stone-400 bg-stone-100 px-1.5 py-0.5 rounded uppercase">
                                    {group.formulas.length} Formulas
                                </span>
                            </div>
                            <button
                                onClick={() => setAddingToChapter(group.chapterId || 'global')}
                                className="p-1.5 rounded-lg border border-stone-200 text-stone-400 hover:text-violet-600 hover:border-violet-200 hover:bg-violet-50 transition-all"
                            >
                                <Plus size={16} />
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {group.formulas.map(f => (
                                <FormulaCard
                                    key={f.id}
                                    formula={f}
                                    onDelete={() => onDeleteFormula(f.id)}
                                    onUpdate={(updates) => onUpdateFormula(f.id, updates)}
                                />
                            ))}
                        </div>

                        {addingToChapter === (group.chapterId || 'global') && renderAddForm(group.chapterId || 'global')}
                    </div>
                ))}

                {formulaGroups.length === 0 && (
                    <div className="py-20 flex flex-col items-center justify-center text-stone-300 border-2 border-dashed border-stone-100 rounded-3xl">
                        <Sigma size={40} className="opacity-10 mb-4" />
                        <p className="text-sm font-mono">本课程尚未录入任何公式</p>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="mb-10">
            <div className="flex items-center justify-between mb-4">
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className="flex items-center gap-2 group"
                >
                    <h3 className="text-[21px] font-bold tracking-wide text-stone-800 group-hover:text-stone-900">
                        章节公式 ({displayFormulas.length})
                    </h3>
                    {collapsed ? <ChevronDown size={14} className="text-stone-400" /> : <ChevronUp size={14} className="text-stone-400" />}
                </button>
            </div>

            {!collapsed && (
                <div className="space-y-4">
                    {displayFormulas.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {displayFormulas.map(f => (
                                <FormulaCard
                                    key={f.id}
                                    formula={f}
                                    onDelete={() => onDeleteFormula(f.id)}
                                    onUpdate={(updates) => onUpdateFormula(f.id, updates)}
                                />
                            ))}
                        </div>
                    )}

                    {addingToChapter === currentChapterId ? (
                        renderAddForm(currentChapterId)
                    ) : (
                        <button
                            onClick={() => setAddingToChapter(currentChapterId || null)}
                            className="w-full py-2.5 border-2 border-dashed border-stone-200 rounded-xl text-stone-400 hover:border-stone-300 hover:text-stone-600 hover:bg-stone-50/50 transition-all text-xs font-bold flex items-center justify-center gap-1.5"
                        >
                            <Plus size={14} />
                            添加本章公式
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
