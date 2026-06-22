import React, { useMemo } from 'react';
import { ImageIcon, Hash, List } from 'lucide-react';
import { indexHeadingsFromNotes } from '@/lib/headingIndex';

interface SidebarTocPanelProps {
    notes?: string;
    figures?: { url: string; description: string }[];
}

export function SidebarTocPanel({ notes, figures }: SidebarTocPanelProps) {
    
    // Parse headings from notes for TOC
    const noteHeadings = useMemo(() => {
        return indexHeadingsFromNotes(notes);
    }, [notes]);

    const scrollToElement = (id: string) => {
        const el = document.getElementById(id);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    return (
        <div className="space-y-6">
            {/* Figures TOC */}
            {figures && figures.length > 0 && (
                <div>
                    <div className="flex items-center gap-2 mb-3">
                        <ImageIcon size={14} className="text-stone-400" />
                        <h4 className="text-[12px] font-mono font-bold uppercase tracking-widest text-stone-500">
                            图表 ({figures.length})
                        </h4>
                    </div>
                    <div className="space-y-1">
                        {figures.map((fig, idx) => (
                            <button
                                key={idx}
                                onClick={() => scrollToElement(`figure-${idx}`)}
                                className="w-full text-left px-3 py-2 rounded-lg text-[13px] text-stone-600 hover:bg-stone-100 hover:text-stone-800 transition-colors flex items-start gap-2 group"
                            >
                                <span className="text-[11px] font-mono font-bold text-stone-400 shrink-0 mt-0.5 group-hover:text-stone-600">Fig {idx + 1}</span>
                                <span className="line-clamp-2 leading-snug">{fig.description || '(无描述)'}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Notes Headings TOC */}
            {noteHeadings.length > 0 && (
                <div>
                    <div className="flex items-center gap-2 mb-3">
                        <Hash size={14} className="text-stone-400" />
                        <h4 className="text-[12px] font-mono font-bold uppercase tracking-widest text-stone-500">
                            笔记大纲
                        </h4>
                    </div>
                    <div className="space-y-0.5">
                        {noteHeadings.map((h, idx) => (
                            <button
                                key={idx}
                                onClick={() => scrollToElement(h.id)}
                                className="w-full text-left rounded-lg text-[13px] text-stone-600 hover:bg-stone-100 hover:text-stone-800 transition-colors py-1.5 px-3 leading-snug"
                                style={{ paddingLeft: `${(h.level - 1) * 16 + 12}px` }}
                            >
                                <span className={`${h.level === 1 ? 'font-bold text-stone-700' :
                                        h.level === 2 ? 'font-medium text-stone-600' :
                                            'text-stone-500'
                                    }`}>
                                    {h.text}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Empty state */}
            {(!figures || figures.length === 0) && noteHeadings.length === 0 && (
                <div className="py-12 flex flex-col items-center justify-center text-stone-400 gap-3">
                    <List size={24} className="opacity-20" />
                    <p className="text-sm font-mono tracking-tight">暂无目录内容</p>
                    <p className="text-xs text-stone-300">添加图表或在笔记中使用 # 标题</p>
                </div>
            )}
        </div>
    );
}
