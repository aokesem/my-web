import React, { useState, useMemo } from 'react';
import { BookOpen, Eye, Star, FileDown, Printer, ListChecks, Pencil, Loader2, Save, X, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import type { PaperDetail } from '../../types';
import type { BlockEditorRef } from '@/components/ui/block-editor';

const TAG_STYLES: Record<string, { bg: string, text: string, border: string, dot: string }> = {
    project: { bg: 'bg-indigo-50/50', text: 'text-indigo-600', border: 'border-indigo-100', dot: 'bg-indigo-400' },
    direction: { bg: 'bg-rose-50/50', text: 'text-rose-600', border: 'border-rose-100', dot: 'bg-rose-400' },
    type: { bg: 'bg-amber-50/50', text: 'text-amber-700', border: 'border-amber-100', dot: 'bg-amber-400' }
};

interface SidebarInfoPanelProps {
    paper: PaperDetail;
    editorRef: React.RefObject<BlockEditorRef | null | any>;
    onUpdate: (field: keyof PaperDetail, value: any) => Promise<void>;
    onEditingChange?: (isEditing: boolean) => void;
}

export function SidebarInfoPanel({ paper, editorRef, onUpdate, onEditingChange }: SidebarInfoPanelProps) {
    const [editingKeyContributions, setEditingKeyContributions] = useState(false);
    // Notify parent about editing state
    React.useEffect(() => {
        if (onEditingChange) onEditingChange(editingKeyContributions);
    }, [editingKeyContributions]);
    const [tempKeyContributions, setTempKeyContributions] = useState<string[]>(paper.key_contributions || []);
    const [isSaving, setIsSaving] = useState(false);

    const allTags = useMemo(() => {
        const tags: { label: string; kind: 'project' | 'direction' | 'type' }[] = [];
        paper.projects?.forEach(p => tags.push({ label: p, kind: 'project' }));
        paper.directions?.forEach(d => tags.push({ label: d, kind: 'direction' }));
        paper.types?.forEach(t => tags.push({ label: t, kind: 'type' }));
        return tags;
    }, [paper]);

    const handleUpdate = async () => {
        setIsSaving(true);
        try {
            await onUpdate('key_contributions', tempKeyContributions.filter(c => c.trim() !== ''));
            setEditingKeyContributions(false);
        } finally {
            setIsSaving(false);
        }
    };

    const handleExportMarkdown = () => {
        if (!paper) return;
        let md = `# ${paper.title}\n\n`;
        if (paper.authors) md += `**作者**: ${paper.authors}\n\n`;
        if (paper.year) md += `**年份**: ${paper.year}\n\n`;
        if (paper.url) md += `**链接**: <${paper.url}>\n\n`;
        if (paper.summary) md += `## 摘要\n> ${paper.summary}\n\n`;

        if (paper.key_contributions && paper.key_contributions.length > 0) {
            md += `## 主要成果\n`;
            paper.key_contributions.forEach(c => md += `- ${c}\n`);
            md += `\n`;
        }

        if (paper.figures && paper.figures.length > 0) {
            md += `# 图表\n`;
            paper.figures.forEach((f, i) => {
                if (f.url) md += `![Fig ${i + 1}](${f.url})\n`;
                if (f.description) md += `*Fig ${i + 1}: ${f.description}*\n\n`;
            });
        }

        if (paper.notes) {
            let notesMd = '';
            if (editorRef.current?.editor) {
                try {
                    notesMd = (editorRef.current.editor.storage as any).markdown.getMarkdown();
                } catch (e) {
                    notesMd = typeof paper.notes === 'string' ? paper.notes : '';
                }
            } else if (typeof paper.notes === 'string' && !paper.notes.trim().startsWith('{')) {
                notesMd = paper.notes;
            } else {
                notesMd = typeof paper.notes === 'string' ? paper.notes : JSON.stringify(paper.notes);
            }
            md += `${notesMd}\n`;
        }

        const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${paper.nickname || paper.title}.md`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleExportPdf = () => {
        if (!paper) return;

        // Build clean HTML for notes
        let notesHtml = '';
        if (editorRef.current?.editor) {
            notesHtml = editorRef.current.editor.getHTML();
        } else if (paper.notes && typeof paper.notes === 'string' && !paper.notes.trim().startsWith('{')) {
            notesHtml = `<pre style="white-space:pre-wrap;font-family:serif;">${paper.notes}</pre>`;
        }

        // Build figures HTML
        let figuresHtml = '';
        if (paper.figures && paper.figures.length > 0) {
            figuresHtml = '<h2 style="margin-top:2em;margin-bottom:1em;font-size:1.4em;">论文图表</h2>';
            paper.figures.forEach((f, i) => {
                figuresHtml += '<div style="margin-bottom:2em;">';
                if (f.url) {
                    figuresHtml += `<img src="${f.url}" style="max-width:100%;border-radius:8px;border:1px solid #e7e5e4;" />`;
                }
                if (f.description) {
                    figuresHtml += `<p style="font-size:0.9em;color:#78716c;border-left:2px solid #d6d3d1;padding-left:0.8em;margin-top:0.5em;"><strong>Fig ${i + 1}.</strong> ${f.description}</p>`;
                }
                figuresHtml += '</div>';
            });
        }

        // Build key contributions
        let contribHtml = '';
        if (paper.key_contributions && paper.key_contributions.length > 0) {
            contribHtml = '<h2 style="margin-top:1.5em;margin-bottom:0.8em;font-size:1.1em;color:#57534e;">主要成果</h2><ul>';
            paper.key_contributions.forEach(c => {
                contribHtml += `<li style="margin-bottom:0.4em;color:#44403c;">${c}</li>`;
            });
            contribHtml += '</ul>';
        }

        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        printWindow.document.write(`<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>${paper.title}</title>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css">
<style>
  body { font-family: 'Georgia', 'Noto Serif SC', serif; max-width: 800px; margin: 0 auto; padding: 40px 30px; color: #1c1917; line-height: 1.8; }
  h1 { font-size: 1.6em; margin-bottom: 0.3em; }
  .meta { font-size: 0.85em; color: #78716c; margin-bottom: 1.5em; }
  .summary { font-style: italic; font-size: 1.1em; color: #57534e; border-left: 3px solid #d6d3d1; padding-left: 1em; margin: 1.5em 0; }
  hr { border: none; border-top: 1px solid #e7e5e4; margin: 2em 0; }
  img { max-width: 100%; page-break-inside: avoid; }
  /* Prose styles for Tiptap HTML output */
  .notes-content h1 { font-size: 1.5em; margin-top: 1.5em; }
  .notes-content h2 { font-size: 1.3em; margin-top: 1.3em; }
  .notes-content h3 { font-size: 1.15em; margin-top: 1.1em; }
  .notes-content p { margin: 0.6em 0; }
  .notes-content ul, .notes-content ol { padding-left: 1.5em; }
  .notes-content li { margin: 0.3em 0; }
  .notes-content pre { background: #f5f5f4; padding: 1em; border-radius: 8px; overflow-x: auto; font-size: 0.9em; }
  .notes-content code { background: #f5f5f4; padding: 0.15em 0.3em; border-radius: 3px; font-size: 0.9em; }
  .notes-content blockquote { border-left: 3px solid #d6d3d1; padding-left: 1em; color: #57534e; margin: 1em 0; }
  @media print { body { padding: 0; } @page { margin: 1.5cm; } }
</style>
</head>
<body>
  <h1>${paper.title}</h1>
  <div class="meta">
    ${paper.authors ? `<div>${paper.authors}</div>` : ''}
    ${paper.year ? `<span>${paper.year}</span>` : ''}
    ${paper.url ? ` · <a href="${paper.url}">原文链接</a>` : ''}
  </div>
  ${paper.summary ? `<div class="summary">"${paper.summary}"</div>` : ''}
  ${contribHtml}
  ${figuresHtml ? `<hr>${figuresHtml}` : ''}
  ${notesHtml ? `<hr><div class="notes-content">${notesHtml}</div>` : ''}
</body>
</html>`);
        printWindow.document.close();
        printWindow.onload = () => {
            setTimeout(() => { printWindow.print(); }, 500);
        };
    };

    return (
        <div className="flex flex-col h-full">
            {/* Meta top bar */}
            <div className="flex items-center justify-between gap-3 mb-6">
                <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center gap-1.5 text-[11px] font-mono font-bold uppercase tracking-wider px-2.5 py-1 rounded-md ${paper.read_depth === '精读'
                        ? 'bg-emerald-50 text-emerald-600 border border-emerald-200/60'
                        : 'bg-stone-50 text-stone-500 border border-stone-200/60'
                        }`}>
                        {paper.read_depth === '精读' ? <BookOpen size={12} /> : <Eye size={12} />}
                        {paper.read_depth}
                    </span>
                    {paper.year && (
                        <span className="text-[14px] font-serif text-stone-400">
                            {paper.year}
                        </span>
                    )}
                </div>
                {paper.rating !== undefined && (
                    <div className="flex items-center gap-1.5 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200/50">
                        <Star size={14} className="text-amber-400 fill-amber-400" />
                        <span className="text-[13px] font-bold text-amber-600 font-mono">
                            {paper.rating.toFixed(1)}
                        </span>
                    </div>
                )}
            </div>

            {/* Title & Authors */}
            <h1 className="text-2xl font-serif font-bold text-stone-800 leading-tight mb-3">
                {paper.title}
            </h1>
            {paper.nickname && (
                <div className="mb-4 inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-stone-100 text-stone-500 text-[11px] font-mono border border-stone-200">
                    <span className="opacity-60">Alias:</span>
                    <span className="font-bold text-stone-700">{paper.nickname}</span>
                </div>
            )}
            {paper.authors && (
                <p className="text-sm text-stone-500 font-mono mb-6 leading-relaxed">
                    {paper.authors}
                </p>
            )}

            {/* Tags */}
            <div className="flex flex-wrap gap-2 mb-8">
                {allTags.map((tag, i) => {
                    const s = TAG_STYLES[tag.kind];
                    return (
                        <span
                            key={`${tag.kind}-${i}`}
                            className={`inline-flex items-center gap-1.5 text-[11px] font-mono font-medium px-2 py-1 rounded-md ${s.bg} ${s.text} border ${s.border}`}
                        >
                            <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                            {tag.label}
                        </span>
                    );
                })}
            </div>

            {/* Divider */}
            <div className="h-px w-full bg-linear-to-r from-stone-200 to-transparent my-2 print:hidden" />

            {/* Export Actions */}
            <div className="flex gap-2 my-6 print:hidden">
                <button
                    onClick={handleExportMarkdown}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-stone-50 text-stone-600 rounded-lg text-xs font-bold hover:bg-stone-100/80 hover:text-stone-800 transition-colors border border-stone-200 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] shadow-stone-200/50"
                >
                    <FileDown size={14} />
                    导出 MD
                </button>
                <button
                    onClick={handleExportPdf}
                    className="flex-1 hidden md:flex items-center justify-center gap-1.5 px-3 py-2 bg-stone-50 text-stone-600 rounded-lg text-xs font-bold hover:bg-stone-100/80 hover:text-stone-800 transition-colors border border-stone-200 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] shadow-stone-200/50"
                >
                    <Printer size={14} />
                    存为 PDF(暂不可用)
                </button>
            </div>

            {/* Key Contributions */}
            <div className="mt-6 mb-8 group/contributions">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <ListChecks size={16} className="text-stone-400" />
                        <h3 className="text-[13px] font-mono font-bold uppercase tracking-widest text-stone-500">
                            主要成果
                        </h3>
                    </div>
                    <button
                        onClick={() => setEditingKeyContributions(!editingKeyContributions)}
                        className="opacity-0 group-hover/contributions:opacity-100 text-[11px] font-mono flex items-center gap-1 text-stone-400 hover:text-stone-600 transition-colors"
                    >
                        <Pencil size={10} />
                        {editingKeyContributions ? '取消' : '编辑'}
                    </button>
                </div>

                {editingKeyContributions ? (
                    <div className="space-y-3 bg-stone-50 rounded-xl border border-stone-200/60 p-4">
                        {tempKeyContributions.map((item, idx) => (
                            <div key={idx} className="flex gap-2 items-start">
                                <textarea
                                    value={item}
                                    onChange={e => {
                                        const newArr = [...tempKeyContributions];
                                        newArr[idx] = e.target.value;
                                        setTempKeyContributions(newArr);
                                        // Auto-resize
                                        e.target.style.height = 'auto';
                                        e.target.style.height = e.target.scrollHeight + 'px';
                                    }}
                                    ref={(el) => {
                                        // Auto-resize on mount
                                        if (el) {
                                            el.style.height = 'auto';
                                            el.style.height = el.scrollHeight + 'px';
                                        }
                                    }}
                                    rows={1}
                                    className="flex-1 bg-white border border-stone-200 rounded-lg px-3 py-1.5 text-xs text-stone-700 focus:outline-hidden focus:ring-1 focus:ring-stone-300 resize-none overflow-hidden"
                                />
                                <button
                                    onClick={() => setTempKeyContributions(tempKeyContributions.filter((_, i) => i !== idx))}
                                    className="text-stone-300 hover:text-red-400 p-1 mt-0.5"
                                >
                                    <X size={14} />
                                </button>
                            </div>
                        ))}
                        <button
                            onClick={() => setTempKeyContributions([...tempKeyContributions, ""])}
                            className="w-full py-2 border border-dashed border-stone-200 rounded-lg text-[11px] text-stone-400 hover:bg-white hover:text-stone-600 transition-colors"
                        >
                            + 添加项
                        </button>
                        <div className="pt-2 border-t border-stone-100 flex justify-end">
                            <button
                                onClick={handleUpdate}
                                disabled={isSaving}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-800 text-white rounded-lg text-xs font-bold hover:bg-stone-900 transition-colors disabled:opacity-50"
                            >
                                {isSaving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                                保存成果
                            </button>
                        </div>
                    </div>
                ) : (
                    paper.key_contributions && paper.key_contributions.length > 0 && (
                        <div className="bg-stone-50 rounded-xl border border-stone-200/60 p-5">
                            <ul className="space-y-3">
                                {paper.key_contributions.map((item, idx) => (
                                    <li key={idx} className="flex items-start gap-2.5 text-sm text-stone-700 leading-relaxed">
                                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-stone-300 shrink-0" />
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )
                )}
            </div>

            <div className="flex-1" />

            {/* Bottom Actions */}
            <div className="pt-6 mt-6 border-t border-stone-100 flex flex-col gap-3">
                {paper.url && (
                    <Link
                        href={paper.url}
                        target="_blank"
                        className="w-full flex items-center gap-2 justify-center px-4 py-2.5 rounded-xl bg-stone-800 text-white hover:bg-stone-900 transition-colors shadow-sm"
                    >
                        <ExternalLink size={14} />
                        <span className="text-[13px] font-bold uppercase tracking-wide">
                            阅读原文 (Source)
                        </span>
                    </Link>
                )}
                <div className="text-center">
                    <span className="text-[10px] font-mono text-stone-300">
                        Added on {new Date(paper.created_at).toLocaleDateString()}
                    </span>
                </div>
            </div>
        </div>
    );
}
