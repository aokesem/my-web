'use client';

import React from 'react';
import type { Editor } from '@tiptap/core';
import {
    Plus,
    Trash2,
    Heading,
    ArrowUp,
    ArrowDown,
    ArrowLeft,
    ArrowRight,
    Table as TableIcon,
} from 'lucide-react';

interface TableBubbleMenuProps {
    editor: Editor | null;
}

export function TableBubbleMenu({ editor }: TableBubbleMenuProps) {
    if (!editor || !editor.isEditable) return null;

    const isTableActive = editor.isActive('table');
    if (!isTableActive) return null;

    return (
        <div className="sticky top-2 z-20 flex justify-end mb-2 pointer-events-auto select-none">
            <div className="flex items-center gap-0.5 bg-stone-900/95 text-white p-1 rounded-xl shadow-xl border border-stone-700/60 backdrop-blur-md text-xs animate-in fade-in slide-in-from-top-1 duration-150">
                <div className="flex items-center gap-1 px-2 text-teal-400 font-mono text-[11px] font-bold">
                    <TableIcon size={13} />
                    表格控制
                </div>

                <div className="w-px h-3.5 bg-stone-700 mx-0.5" />

                {/* 插入行 (上) */}
                <button
                    type="button"
                    onClick={() => editor.chain().focus().addRowBefore().run()}
                    className="flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-stone-700/80 text-stone-200 hover:text-white transition-colors"
                    title="在上方插入行"
                >
                    <Plus size={12} />
                    <ArrowUp size={10} />
                    <span className="text-[11px] font-medium">行</span>
                </button>

                {/* 插入行 (下) */}
                <button
                    type="button"
                    onClick={() => editor.chain().focus().addRowAfter().run()}
                    className="flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-stone-700/80 text-stone-200 hover:text-white transition-colors"
                    title="在下方插入行"
                >
                    <Plus size={12} />
                    <ArrowDown size={10} />
                    <span className="text-[11px] font-medium">行</span>
                </button>

                <div className="w-px h-3.5 bg-stone-700 mx-0.5" />

                {/* 插入列 (左) */}
                <button
                    type="button"
                    onClick={() => editor.chain().focus().addColumnBefore().run()}
                    className="flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-stone-700/80 text-stone-200 hover:text-white transition-colors"
                    title="在左侧插入列"
                >
                    <Plus size={12} />
                    <ArrowLeft size={10} />
                    <span className="text-[11px] font-medium">列</span>
                </button>

                {/* 插入列 (右) */}
                <button
                    type="button"
                    onClick={() => editor.chain().focus().addColumnAfter().run()}
                    className="flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-stone-700/80 text-stone-200 hover:text-white transition-colors"
                    title="在右侧插入列"
                >
                    <Plus size={12} />
                    <ArrowRight size={10} />
                    <span className="text-[11px] font-medium">列</span>
                </button>

                <div className="w-px h-3.5 bg-stone-700 mx-0.5" />

                {/* 删除行 */}
                <button
                    type="button"
                    onClick={() => editor.chain().focus().deleteRow().run()}
                    className="px-2 py-1 rounded-lg hover:bg-red-500/20 text-stone-300 hover:text-red-300 transition-colors text-[11px]"
                    title="删除当前行"
                >
                    删行
                </button>

                {/* 删除列 */}
                <button
                    type="button"
                    onClick={() => editor.chain().focus().deleteColumn().run()}
                    className="px-2 py-1 rounded-lg hover:bg-red-500/20 text-stone-300 hover:text-red-300 transition-colors text-[11px]"
                    title="删除当前列"
                >
                    删列
                </button>

                <div className="w-px h-3.5 bg-stone-700 mx-0.5" />

                {/* 切换表头行 */}
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleHeaderRow().run()}
                    className={`px-2 py-1 rounded-lg transition-colors text-[11px] flex items-center gap-1 ${
                        editor.isActive('tableHeader') ? 'bg-teal-500/30 text-teal-300' : 'hover:bg-stone-700/80 text-stone-300'
                    }`}
                    title="切换表头行"
                >
                    <Heading size={12} />
                    表头
                </button>

                <div className="w-px h-3.5 bg-stone-700 mx-0.5" />

                {/* 删除整个表格 */}
                <button
                    type="button"
                    onClick={() => editor.chain().focus().deleteTable().run()}
                    className="p-1 rounded-lg hover:bg-red-500/30 text-stone-400 hover:text-red-400 transition-colors"
                    title="删除整个表格"
                >
                    <Trash2 size={13} />
                </button>
            </div>
        </div>
    );
}
