'use client';

import React, { useState, useMemo } from 'react';
import { Pencil, Save, X, Loader2, Plus, ChevronDown, ChevronUp } from 'lucide-react';
import 'katex/dist/katex.min.css';
import type { CourseFormula } from '../../types';

interface FormulaGalleryProps {
    formulas: CourseFormula[];
    courseId: string;
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

    // Dynamically import KaTeX for rendering
    const renderedLatex = useMemo(() => {
        try {
            const katex = require('katex');
            return katex.renderToString(formula.latex, { throwOnError: false, displayMode: true });
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
            <div className="bg-white rounded-xl border border-stone-200 p-4 space-y-3 shadow-sm">
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
        <div className="group bg-white/80 rounded-xl border border-stone-200/60 p-4 hover:border-stone-300 hover:shadow-sm transition-all cursor-default relative">
            {/* Edit button */}
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

            {/* Formula Name */}
            <div className="text-[15px] font-mono font-bold uppercase tracking-wider text-stone-800 mb-2">
                {formula.name}
            </div>

            {/* Rendered LaTeX */}
            <div
                className="text-center py-2 overflow-x-auto"
                dangerouslySetInnerHTML={{ __html: renderedLatex }}
            />

            {/* Description */}
            {formula.description && (
                <p className="text-[12px] text-stone-500 mt-2 leading-snug border-t border-stone-100 pt-2">
                    {formula.description}
                </p>
            )}
        </div>
    );
}

export function FormulaGallery({ formulas, courseId, onSaveFormula, onDeleteFormula, onUpdateFormula }: FormulaGalleryProps) {
    const [adding, setAdding] = useState(false);
    const [collapsed, setCollapsed] = useState(false);
    const [newName, setNewName] = useState('');
    const [newLatex, setNewLatex] = useState('');
    const [newDesc, setNewDesc] = useState('');
    const [saving, setSaving] = useState(false);

    const handleAdd = async () => {
        if (!newName || !newLatex) return;
        setSaving(true);
        try {
            await onSaveFormula({
                course_id: courseId,
                name: newName,
                latex: newLatex,
                description: newDesc || undefined,
                sort_order: formulas.length,
            });
            setNewName('');
            setNewLatex('');
            setNewDesc('');
            setAdding(false);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="mb-10">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className="flex items-center gap-2 group"
                >
                    <h3 className="text-sm font-bold tracking-wide text-stone-800 group-hover:text-stone-900">
                        核心公式 ({formulas.length})
                    </h3>
                    {collapsed ? <ChevronDown size={14} className="text-stone-400" /> : <ChevronUp size={14} className="text-stone-400" />}
                </button>
            </div>

            {/* Grid */}
            {!collapsed && (
                <div className="space-y-3">
                    {formulas.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {formulas.map(f => (
                                <FormulaCard
                                    key={f.id}
                                    formula={f}
                                    onDelete={() => onDeleteFormula(f.id)}
                                    onUpdate={(updates) => onUpdateFormula(f.id, updates)}
                                />
                            ))}
                        </div>
                    )}

                    {/* Add new formula */}
                    {adding ? (
                        <div className="bg-stone-50 rounded-xl border border-stone-200/60 p-4 space-y-3">
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
                                <button onClick={() => setAdding(false)} className="text-xs text-stone-400 hover:text-stone-600 px-2 py-1">
                                    取消
                                </button>
                                <button onClick={handleAdd} disabled={saving || !newName || !newLatex} className="flex items-center gap-1 px-3 py-1.5 bg-stone-800 text-white rounded-lg text-xs font-bold hover:bg-stone-900 disabled:opacity-50 transition-colors">
                                    {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                                    添加
                                </button>
                            </div>
                        </div>
                    ) : (
                        <button
                            onClick={() => setAdding(true)}
                            className="w-full py-2.5 border-2 border-dashed border-stone-200 rounded-xl text-stone-400 hover:border-stone-300 hover:text-stone-600 hover:bg-stone-50/50 transition-all text-xs font-bold flex items-center justify-center gap-1.5"
                        >
                            <Plus size={14} />
                            添加公式
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
