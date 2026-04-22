"use client";

import React, { useState } from 'react';
import type { Editor } from '@tiptap/core';
import { NodeViewContent, NodeViewWrapper } from '@tiptap/react';
import { Trash2 } from 'lucide-react';

type SupportedCodeLanguage = 'javascript' | 'python';

interface CodeBlockViewProps {
    deleteNode: () => void;
    editor?: Editor | null;
    node?: {
        attrs?: {
            language?: string | null;
        };
    };
    updateAttributes?: (attrs: { language?: string | null }) => void;
}

/**
 * Custom NodeView for CodeBlockLowlight.
 * Adds a hover-visible delete button.
 */
export function CodeBlockView({ deleteNode, editor, node, updateAttributes }: CodeBlockViewProps) {
    const [hovered, setHovered] = useState(false);
    // 默认与 CodeBlockLowlight defaultLanguage=python 一致；仅当显式为 javascript 时显示 JS
    const currentLanguage: SupportedCodeLanguage = node?.attrs?.language === 'javascript' ? 'javascript' : 'python';

    const handleDelete = () => {
        if (!editor?.isEditable) return;
        if (window.confirm('确定要删除这个代码块吗？')) {
            deleteNode();
        }
    };

    const handleLanguageChange = (language: SupportedCodeLanguage) => {
        if (!editor?.isEditable) return;
        if (updateAttributes) {
            updateAttributes({ language });
            return;
        }
        editor.chain().focus().updateAttributes('codeBlock', { language }).run();
    };

    return (
        <NodeViewWrapper
            className="relative my-4"
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            {/* Controls - top right corner, visible on hover in edit mode */}
            {editor?.isEditable && hovered && (
                <div className="absolute top-2 right-2 z-10 flex items-center gap-1.5" onPointerDown={(e) => e.stopPropagation()}>
                    <select
                        value={currentLanguage}
                        onChange={(e) => handleLanguageChange(e.target.value as SupportedCodeLanguage)}
                        className="rounded-md border border-zinc-500/60 bg-zinc-800/95 px-2 py-1 text-[11px] text-zinc-100 outline-none"
                        title="选择代码语言"
                    >
                        <option value="javascript">JavaScript</option>
                        <option value="python">Python</option>
                    </select>
                    <button
                        type="button"
                        onClick={handleDelete}
                        className="p-1.5 rounded-lg bg-zinc-700/80 hover:bg-red-500/30 text-zinc-400 hover:text-red-400 transition-colors"
                        title="删除代码块"
                    >
                        <Trash2 size={13} />
                    </button>
                </div>
            )}

            {/* Code: pre > code only (phrasing inside pre); div inside pre is invalid HTML and breaks PM DOM sync */}
            <pre className="rounded-xl bg-[#282c34] p-4 m-0 text-sm font-mono text-white custom-scrollbar overflow-x-auto">
                <NodeViewContent<'code'>
                    as="code"
                    className="block w-full min-w-0 whitespace-pre bg-transparent p-0 text-inherit font-inherit outline-none"
                />
            </pre>
        </NodeViewWrapper>
    );
}
