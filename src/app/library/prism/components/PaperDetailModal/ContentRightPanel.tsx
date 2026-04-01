import React, { useState, useRef } from 'react';
import { Pencil, Save, X, Loader2 } from 'lucide-react';
import { ImageUpload } from '@/components/ui/image-upload';
import { BlockEditor } from '@/components/ui/block-editor';
import type { BlockEditorRef } from '@/components/ui/block-editor';
import type { PaperDetail } from '../../types';

interface ContentRightPanelProps {
    paper: PaperDetail;
    editorRef: React.RefObject<BlockEditorRef | null | any>;
    onUpdate: (field: keyof PaperDetail, value: any) => Promise<void>;
}

export function ContentRightPanel({ paper, editorRef, onUpdate }: ContentRightPanelProps) {
    const contentRef = useRef<HTMLDivElement>(null);
    const [isSaving, setIsSaving] = useState(false);

    // Summary state
    const [editingSummary, setEditingSummary] = useState(false);
    const [tempSummary, setTempSummary] = useState(paper.summary || '');

    // Figures state
    const [editingFigures, setEditingFigures] = useState(false);
    const [tempFigures, setTempFigures] = useState<{ url: string; description: string }[]>([]);

    // Notes state
    const [editingNotes, setEditingNotes] = useState(false);
    const [tempNotes, setTempNotes] = useState(paper.notes || '');

    const handleUpdateField = async (field: keyof PaperDetail, value: any, cleanup: () => void) => {
        setIsSaving(true);
        try {
            await onUpdate(field, value);
            cleanup();
        } finally {
            setIsSaving(false);
        }
    };

    const handleUpdateFigures = () => {
        const cleanFigures = tempFigures.filter(f => f.url || f.description);
        handleUpdateField('figures', cleanFigures, () => setEditingFigures(false));
    };

    // Keyboard shortcut for Summary Textarea
    const handleSummaryKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleUpdateField('summary', tempSummary, () => setEditingSummary(false));
        }
    };

    return (
        <div ref={contentRef} className="flex-1 bg-[#faf9f7] overflow-y-auto overscroll-contain p-10 md:p-14 custom-scrollbar print:p-0 print:bg-white print:overflow-visible">
            <div className="max-w-3xl mx-auto pb-20 print:pb-0">

                {/* Summary */}
                <div className="mb-12 group/section">
                    <div className="flex items-center gap-2 mb-3 opacity-0 group-hover/section:opacity-100 transition-opacity print:hidden">
                        <button
                            onClick={() => {
                                setTempSummary(paper.summary || '');
                                setEditingSummary(!editingSummary);
                            }}
                            className="text-[11px] font-mono flex items-center gap-1 text-stone-400 hover:text-stone-600 transition-colors"
                        >
                            <Pencil size={10} />
                            {editingSummary ? '取消编辑' : '编辑摘要'}
                        </button>
                    </div>

                    {editingSummary ? (
                        <div className="space-y-3">
                            <textarea
                                value={tempSummary}
                                onChange={e => setTempSummary(e.target.value)}
                                onKeyDown={handleSummaryKeyDown}
                                className="w-full bg-white border border-stone-200 rounded-xl p-4 text-stone-700 leading-relaxed focus:outline-hidden focus:ring-2 focus:ring-stone-200 resize-none custom-scrollbar min-h-[100px]"
                                placeholder="输入一句话摘要... (Enter 保存, Shift+Enter 换行)"
                            />
                            <div className="flex justify-end gap-2">
                                <button
                                    onClick={() => handleUpdateField('summary', tempSummary, () => setEditingSummary(false))}
                                    disabled={isSaving}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-800 text-white rounded-lg text-xs font-bold hover:bg-stone-900 transition-colors disabled:opacity-50"
                                >
                                    {isSaving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                                    保存
                                </button>
                            </div>
                        </div>
                    ) : (
                        paper.summary && (
                            <div className="relative">
                                <div className="absolute -left-4 top-0 bottom-0 w-1 bg-stone-200 rounded-full print:hidden" />
                                <p className="text-lg font-serif text-stone-600 leading-relaxed italic border-l-4 border-stone-300 pl-4 print:border-none print:pl-0">
                                    "{paper.summary}"
                                </p>
                            </div>
                        )
                    )}
                </div>

                {/* Figures */}
                <div className="mb-12 group/figures">
                    <div className="flex items-center justify-between mb-6 print:hidden">
                        <div className="flex items-center gap-2">
                            <h3 className="text-sm font-bold tracking-wide text-stone-800">
                                论文图表 (Figures)
                            </h3>
                        </div>
                        <button
                            onClick={() => {
                                setTempFigures(paper.figures || []);
                                setEditingFigures(!editingFigures);
                            }}
                            className="opacity-0 group-hover/figures:opacity-100 text-[11px] font-mono flex items-center gap-1 text-stone-400 hover:text-stone-600 transition-colors"
                        >
                            <Pencil size={10} />
                            {editingFigures ? '取消编辑' : '编辑图表'}
                        </button>
                    </div>

                    {editingFigures ? (
                        <div className="space-y-6 bg-stone-50 rounded-2xl border border-stone-200/60 p-6">
                            {tempFigures.map((fig, idx) => (
                                <div key={idx} className="relative bg-white rounded-xl border border-stone-200 p-4 flex flex-col gap-4">
                                    <button
                                        onClick={() => setTempFigures(tempFigures.filter((_, i) => i !== idx))}
                                        className="absolute top-2 right-2 p-1.5 text-stone-300 hover:text-red-500 hover:bg-stone-50 rounded-md transition-colors z-10"
                                    >
                                        <X size={16} />
                                    </button>

                                    {/* Upload Component */}
                                    <div className="pt-2">
                                        <ImageUpload
                                            bucket="paper_images"
                                            folder={`figures/${paper.id}`}
                                            onChange={(url) => {
                                                const newArr = [...tempFigures];
                                                newArr[idx].url = url;
                                                setTempFigures(newArr);
                                            }}
                                            value={fig.url}
                                        />
                                    </div>

                                    {/* Description Input */}
                                    <input
                                        value={fig.description}
                                        onChange={e => {
                                            const newArr = [...tempFigures];
                                            newArr[idx].description = e.target.value;
                                            setTempFigures(newArr);
                                        }}
                                        placeholder="输入图表描述 (可为空)..."
                                        className="w-full bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 text-sm text-stone-700 focus:outline-hidden focus:ring-1 focus:ring-stone-300"
                                    />
                                </div>
                            ))}
                            <button
                                onClick={() => setTempFigures([...tempFigures, { url: '', description: '' }])}
                                className="w-full py-3 border-2 border-dashed border-stone-200 rounded-xl text-stone-400 hover:bg-white hover:border-stone-300 hover:text-stone-600 transition-all text-sm font-bold flex items-center justify-center gap-2"
                            >
                                + 添加图表
                            </button>

                            <div className="pt-4 flex justify-end">
                                <button
                                    onClick={handleUpdateFigures}
                                    disabled={isSaving}
                                    className="flex items-center gap-1.5 px-5 py-2.5 bg-stone-800 text-white rounded-xl text-sm font-bold hover:bg-stone-900 transition-colors disabled:opacity-50 shadow-sm"
                                >
                                    {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                                    保存所有图表
                                </button>
                            </div>
                        </div>
                    ) : (
                        (paper.figures && paper.figures.length > 0) && (
                            <div className="grid gap-8">
                                {paper.figures.map((fig, idx) => (
                                    <div key={idx} id={`figure-${idx}`} className="flex flex-col gap-3">
                                        <div className="w-full bg-white rounded-2xl border border-stone-200/70 p-2 shadow-sm overflow-hidden flex items-center justify-center min-h-[200px]">
                                            {fig.url ? (
                                                <img
                                                    src={fig.url}
                                                    alt={fig.description || "Figure"}
                                                    className="max-w-full h-auto rounded-xl"
                                                />
                                            ) : (
                                                <div className="text-stone-300 font-mono text-xs">No Image Provided</div>
                                            )}
                                        </div>
                                        {fig.description && (
                                            <p className="text-sm font-serif text-stone-500 text-center px-4">
                                                <span className="font-bold font-mono text-stone-400 mr-2">Fig {idx + 1}.</span>
                                                {fig.description}
                                            </p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )
                    )}
                </div>

                {/* Notes Editor */}
                <div className="group/notes relative">
                    <div className="flex items-center justify-between mb-4 print:hidden">
                        <div className="flex items-center gap-2">
                            <h3 className="text-sm font-bold tracking-wide text-stone-800">
                                详细笔记 (Notes)
                            </h3>
                        </div>
                        <button
                            onClick={() => {
                                setTempNotes(paper.notes || '');
                                setEditingNotes(!editingNotes);
                            }}
                            className="opacity-0 group-hover/notes:opacity-100 text-[11px] font-mono flex items-center gap-1 text-stone-400 hover:text-stone-600 transition-all"
                        >
                            <Pencil size={10} />
                            {editingNotes ? '返回预览' : '直接编辑'}
                        </button>
                    </div>

                    {editingNotes ? (
                        <div className="space-y-4">
                            <div className="bg-white border border-stone-200 rounded-2xl p-8 min-h-[500px] shadow-sm print:border-none print:shadow-none print:p-0">
                                <BlockEditor
                                    ref={editorRef}
                                    key={`edit-${paper.id}`}
                                    value={tempNotes}
                                    onChange={(json) => setTempNotes(JSON.stringify(json))}
                                    onSave={() => handleUpdateField('notes', tempNotes, () => setEditingNotes(false))}
                                    editable={true}
                                    imageBucket="paper_images"
                                    imageFolder={`notes/${paper.id}`}
                                />
                            </div>
                            <div className="flex justify-end gap-2 print:hidden">
                                <button
                                    onClick={() => handleUpdateField('notes', tempNotes, () => setEditingNotes(false))}
                                    disabled={isSaving}
                                    className="flex items-center gap-1.5 px-4 py-2 bg-stone-800 text-white rounded-xl text-xs font-bold hover:bg-stone-900 transition-colors shadow-sm disabled:opacity-50"
                                >
                                    {isSaving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                                    保存笔记
                                </button>
                            </div>
                        </div>
                    ) : (
                        paper.notes ? (
                            <div
                                onDoubleClick={() => {
                                    setTempNotes(paper.notes || '');
                                    setEditingNotes(true);
                                }}
                                className="bg-white/50 border border-transparent rounded-2xl p-4 min-h-[200px] print:border-none print:bg-transparent print:p-0"
                            >
                                <BlockEditor
                                    ref={editorRef}
                                    key={`view-${paper.id}`}
                                    value={paper.notes}
                                    editable={false}
                                    imageBucket="paper_images"
                                    imageFolder={`notes/${paper.id}`}
                                />
                            </div>
                        ) : (
                            <div className="py-12 border-2 border-dashed border-stone-200 rounded-3xl flex flex-col items-center justify-center text-stone-400 gap-3 print:hidden">
                                <Pencil size={24} className="opacity-20" />
                                <p className="text-sm font-mono tracking-tight">暂无笔记，点击右上角开始记录</p>
                            </div>
                        )
                    )}
                </div>

            </div>
        </div>
    );
}
