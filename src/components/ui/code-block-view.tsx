"use client";

import React, { useState } from 'react';
import { NodeViewContent, NodeViewWrapper } from '@tiptap/react';
import { Trash2 } from 'lucide-react';

/**
 * Custom NodeView for CodeBlockLowlight.
 * Adds a hover-visible delete button.
 */
export function CodeBlockView({ deleteNode, editor }: any) {
    const [hovered, setHovered] = useState(false);

    const handleDelete = () => {
        if (!editor?.isEditable) return;
        if (window.confirm('确定要删除这个代码块吗？')) {
            deleteNode();
        }
    };

    return (
        <NodeViewWrapper
            className="relative my-4"
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            {/* Delete button - top right corner, visible on hover in edit mode */}
            {editor?.isEditable && hovered && (
                <button
                    onClick={handleDelete}
                    className="absolute top-2 right-2 z-10 p-1.5 rounded-lg bg-zinc-700/80 hover:bg-red-500/30 text-zinc-400 hover:text-red-400 transition-colors"
                    title="删除代码块"
                >
                    <Trash2 size={13} />
                </button>
            )}

            {/* Code Content */}
            <pre className="rounded-xl bg-[#282c34] p-4 text-sm font-mono text-white custom-scrollbar overflow-x-auto">
                <NodeViewContent as="div" />
            </pre>
        </NodeViewWrapper>
    );
}
