'use client';

import React, { useMemo } from 'react';
import { Hash } from 'lucide-react';

// ============================================================
// TYPES
// ============================================================

interface Heading {
    level: number;
    text: string;
    id: string;
}

interface GardenTOCProps {
    /** Tiptap JSON 字符串或对象 */
    notes: string | null | undefined;
}

// ============================================================
// HELPERS
// ============================================================

/**
 * 从 Tiptap JSON 中提取 h1/h2/h3 标题
 * 复用 Prism Courses 中已验证的提取逻辑
 */
function extractHeadings(notes: string | null | undefined): Heading[] {
    if (!notes) return [];

    let parsed: any = null;
    if (typeof notes === 'string' && notes.trim().startsWith('{')) {
        try { parsed = JSON.parse(notes); } catch { return []; }
    } else if (typeof notes === 'object') {
        parsed = notes;
    }

    if (!parsed?.content) return [];

    const headings: Heading[] = [];
    const traverse = (node: any) => {
        if (node.type === 'heading') {
            const level = node.attrs?.level || 1;
            if (level > 3) { // 只提取 h1-h3
                if (node.content) node.content.forEach(traverse);
                return;
            }
            const text = node.content?.map((c: any) => c.text || '').join('') || '';
            if (text) {
                const id = 'heading-' + text.toLowerCase()
                    .replace(/[^\w\u4e00-\u9fff]+/g, '-')
                    .replace(/(^-|-$)/g, '');
                headings.push({ level, text, id });
            }
        }
        if (node.content && Array.isArray(node.content)) {
            node.content.forEach(traverse);
        }
    };
    traverse(parsed);
    return headings;
}

// ============================================================
// COMPONENT
// ============================================================

export function GardenTOC({ notes }: GardenTOCProps) {
    const headings = useMemo(() => extractHeadings(notes), [notes]);

    // 无标题时不显示
    if (headings.length === 0) return null;

    const scrollToElement = (id: string) => {
        const el = document.getElementById(id);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    return (
        <aside className="w-48 shrink-0 hidden lg:flex flex-col py-6 px-4 overflow-y-auto custom-scrollbar border-r border-[#ccd8d0] bg-[#e8f0eb]/50">
            {/* Header */}
            <div className="flex items-center gap-1.5 mb-4 px-1 mt-4">
                <Hash size={12} className="text-[#8aaa9a]" />
                <span className="text-[10px] font-mono font-bold uppercase tracking-[0.15em] text-[#8aaa9a]">
                    大纲
                </span>
            </div>

            {/* Heading Links */}
            <nav className="space-y-0.5">
                {headings.map((h, idx) => (
                    <button
                        key={idx}
                        onClick={() => scrollToElement(h.id)}
                        className="w-full text-left rounded-md text-[12px] text-[#6b8a7a] hover:bg-[#dae6df] hover:text-[#3a5a4a] transition-colors py-1.5 pr-2 leading-snug truncate"
                        style={{ paddingLeft: `${(h.level - 1) * 12 + 8}px` }}
                        title={h.text}
                    >
                        <span className={
                            h.level === 1 ? 'font-bold text-[#4a6b5a]' :
                            h.level === 2 ? 'font-medium text-[#5a7a6a]' :
                            'text-[#7a9a8a]'
                        }>
                            {h.text}
                        </span>
                    </button>
                ))}
            </nav>
        </aside>
    );
}
