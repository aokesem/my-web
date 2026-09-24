'use client';

import React, { useMemo } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

type Segment =
    | { type: 'text'; content: string }
    | { type: 'inline'; content: string }
    | { type: 'block'; content: string }
    | { type: 'code'; content: string }
    | { type: 'codeblock'; content: string; language?: string };

/** 将文本拆成普通文本、公式段（$...$, $$...$$, \(...\), \[...\]）与代码段（`...`, ```...```） */
export function parseLatexSegments(text: string): Segment[] {
    if (!text) return [];
    const segments: Segment[] = [];
    let i = 0;
    while (i < text.length) {
        // 1. Triple backticks code block: ```lang\n...```
        if (text.startsWith('```', i)) {
            const end = text.indexOf('```', i + 3);
            if (end !== -1) {
                const blockContent = text.slice(i + 3, end);
                const firstNewline = blockContent.indexOf('\n');
                let language = '';
                let code = blockContent;
                if (firstNewline !== -1) {
                    language = blockContent.slice(0, firstNewline).trim();
                    code = blockContent.slice(firstNewline + 1);
                }
                segments.push({ type: 'codeblock', content: code, language });
                i = end + 3;
                continue;
            }
        }
        // 2. LaTeX Display Math: $$...$$
        if (text.startsWith('$$', i)) {
            const end = text.indexOf('$$', i + 2);
            if (end !== -1) {
                segments.push({ type: 'block', content: text.slice(i + 2, end) });
                i = end + 2;
                continue;
            }
        }
        // 3. LaTeX Display Math: \[...\]
        if (text.startsWith('\\[', i)) {
            const end = text.indexOf('\\]', i + 2);
            if (end !== -1) {
                segments.push({ type: 'block', content: text.slice(i + 2, end) });
                i = end + 2;
                continue;
            }
        }
        // 4. LaTeX Inline Math: \(...\)
        if (text.startsWith('\\(', i)) {
            const end = text.indexOf('\\)', i + 2);
            if (end !== -1) {
                segments.push({ type: 'inline', content: text.slice(i + 2, end) });
                i = end + 2;
                continue;
            }
        }
        // 5. LaTeX Inline Math: $...$
        if (text[i] === '$' && text[i + 1] !== '$') {
            const end = text.indexOf('$', i + 1);
            if (end !== -1) {
                segments.push({ type: 'inline', content: text.slice(i + 1, end) });
                i = end + 1;
                continue;
            }
        }
        // 6. Inline Code: `...`
        if (text[i] === '`') {
            const end = text.indexOf('`', i + 1);
            if (end !== -1) {
                segments.push({ type: 'code', content: text.slice(i + 1, end) });
                i = end + 1;
                continue;
            }
        }

        // Find closest delimiter of any kind
        const nextCodeBlock = text.indexOf('```', i);
        const nextBlock = text.indexOf('$$', i);
        const nextBracketBlock = text.indexOf('\\[', i);
        const nextBracketInline = text.indexOf('\\(', i);
        const nextInline = text.indexOf('$', i);
        const nextCode = text.indexOf('`', i);

        let next = text.length;
        if (nextCodeBlock !== -1) next = Math.min(next, nextCodeBlock);
        if (nextBlock !== -1) next = Math.min(next, nextBlock);
        if (nextBracketBlock !== -1) next = Math.min(next, nextBracketBlock);
        if (nextBracketInline !== -1) next = Math.min(next, nextBracketInline);
        if (nextInline !== -1) next = Math.min(next, nextInline);
        if (nextCode !== -1) next = Math.min(next, nextCode);

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
                if (seg.type === 'code') {
                    return `<code class="font-mono bg-stone-100 text-stone-800 px-1.5 py-0.5 rounded text-[0.85em] border border-stone-200/60 font-medium">${escapeHtml(seg.content)}</code>`;
                }
                if (seg.type === 'codeblock') {
                    return `<pre class="bg-stone-100 text-stone-800 p-3 rounded-xl font-mono text-xs overflow-x-auto my-2 border border-stone-200/60 leading-relaxed"><code>${escapeHtml(seg.content)}</code></pre>`;
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
