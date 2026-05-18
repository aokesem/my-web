'use client';

import React, { useMemo } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

type Segment = { type: 'text' | 'inline' | 'block'; content: string };

/** 将文本拆成普通文本与 $...$ / $$...$$ 公式段 */
export function parseLatexSegments(text: string): Segment[] {
    if (!text) return [];
    const segments: Segment[] = [];
    let i = 0;
    while (i < text.length) {
        if (text.startsWith('$$', i)) {
            const end = text.indexOf('$$', i + 2);
            if (end !== -1) {
                segments.push({ type: 'block', content: text.slice(i + 2, end) });
                i = end + 2;
                continue;
            }
        }
        if (text[i] === '$' && text[i + 1] !== '$') {
            const end = text.indexOf('$', i + 1);
            if (end !== -1) {
                segments.push({ type: 'inline', content: text.slice(i + 1, end) });
                i = end + 1;
                continue;
            }
        }
        const nextBlock = text.indexOf('$$', i);
        const nextInline = text.indexOf('$', i);
        let next = text.length;
        if (nextBlock !== -1) next = Math.min(next, nextBlock);
        if (nextInline !== -1) next = Math.min(next, nextInline);
        if (next > i) {
            segments.push({ type: 'text', content: text.slice(i, next) });
        }
        i = next === i ? i + 1 : next;
    }
    return segments;
}

function renderKatex(latex: string, displayMode: boolean): string {
    try {
        return katex.renderToString(latex.trim(), { throwOnError: false, displayMode });
    } catch {
        return `<span class="text-red-500 text-xs">${escapeHtml(latex)}</span>`;
    }
}

function escapeHtml(s: string): string {
    return s
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

export function LatexRichText({
    content,
    className = '',
}: {
    content: string;
    className?: string;
}) {
    const html = useMemo(() => {
        const segments = parseLatexSegments(content);
        return segments
            .map((seg) => {
                if (seg.type === 'text') {
                    return `<span class="whitespace-pre-wrap">${escapeHtml(seg.content)}</span>`;
                }
                return renderKatex(seg.content, seg.type === 'block');
            })
            .join('');
    }, [content]);

    if (!content.trim()) return null;

    return (
        <div
            className={`latex-rich-text leading-relaxed [&_.katex-display]:my-2 [&_.katex]:text-[1em] ${className}`}
            dangerouslySetInnerHTML={{ __html: html }}
        />
    );
}

export function LatexNoteField({
    value,
    onChange,
    rows = 6,
    placeholder,
    disabled,
    hint = '',
}: {
    value: string;
    onChange: (v: string) => void;
    rows?: number;
    placeholder?: string;
    disabled?: boolean;
    hint?: string;
}) {
    return (
        <div className="space-y-2">
            <textarea
                value={value}
                onChange={(e) => onChange(e.target.value)}
                rows={rows}
                disabled={disabled}
                placeholder={placeholder}
                className="w-full rounded-xl border border-stone-200 px-4 py-3 text-sm text-stone-800 resize-y min-h-[120px] outline-none focus:ring-1 focus:ring-teal-200 font-mono disabled:opacity-60"
            />
            {value.trim() ? (
                <div className="rounded-xl border border-stone-100 bg-stone-50/80 p-4">
                    <p className="text-[10px] font-medium text-stone-400 mb-2">预览</p>
                    <LatexRichText content={value} className="text-sm text-stone-700" />
                </div>
            ) : null}
            <p className="text-[11px] text-stone-400">{hint}</p>
        </div>
    );
}
