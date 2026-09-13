"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { CodebaseNode } from "../../types";
import { ChevronRight, Plus, Edit2, Trash2, Folder, FileCode, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Reorder, useDragControls } from "framer-motion";

interface CodebaseColumnsProps {
    isAdmin: boolean;
    languageId: string;
    nodes: CodebaseNode[];
    selectedPath: string[]; // Length determines depth: [L1_id, L2_id, L3_id]
    onSelectPath: (level: number, nodeId: string) => void;
    isLoading: boolean;
    onDataChange: () => void;
}

const MAX_COLUMNS = 3; // L1, L2, L3

export function CodebaseColumns({ languageId, nodes, selectedPath, onSelectPath, isLoading, onDataChange, isAdmin }: CodebaseColumnsProps) {
    const sortNodes = (nodeList: CodebaseNode[]) => {
        return [...nodeList].sort((a, b) => {
            const orderA = a.sort_order ?? 0;
            const orderB = b.sort_order ?? 0;
            if (orderA !== orderB) return orderA - orderB;
            return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        });
    };

    // Generate data for each column based on selection
    const columnsData: { level: number; parentId: string | null; items: CodebaseNode[] }[] = [];

    // Column 0: L1 nodes (parentId is null)
    columnsData.push({
        level: 0,
        parentId: null,
        items: sortNodes(nodes.filter(n => n.parent_id === null))
    });

    // Subsequent columns depending on selectedPath
    for (let i = 0; i < MAX_COLUMNS - 1; i++) {
        const selectedId = selectedPath[i];
        if (selectedId) {
            columnsData.push({
                level: i + 1,
                parentId: selectedId,
                items: sortNodes(nodes.filter(n => n.parent_id === selectedId))
            });
        } else {
            columnsData.push({
                level: i + 1,
                parentId: null,
                items: []
            });
        }
    }

    return (
        <div className="flex h-full w-full bg-[#fcfcfc]">
            {columnsData.map((col) => (
                <Column
                    key={col.level}
                    level={col.level}
                    parentId={col.parentId}
                    languageId={languageId}
                    items={col.items}
                    selectedId={selectedPath[col.level]}
                    onSelect={(id) => onSelectPath(col.level, id)}
                    onDataChange={onDataChange}
                    allNodes={nodes}
                    isAdmin={isAdmin}
                />
            ))}
        </div>
    );
}

// -------------------------------------------------------------
// INDIVIDUAL COLUMN COMPONENT
// -------------------------------------------------------------

function Column({ level, parentId, languageId, items, selectedId, onSelect, onDataChange, allNodes, isAdmin }: {
    level: number;
    parentId: string | null;
    languageId: string;
    items: CodebaseNode[];
    selectedId?: string;
    onSelect: (id: string) => void;
    onDataChange: () => void;
    allNodes: CodebaseNode[];
    isAdmin: boolean;
}) {
    const [isCreating, setIsCreating] = useState(false);
    const [editTitle, setEditTitle] = useState("");
    const [localItems, setLocalItems] = useState<CodebaseNode[]>(items);
    const localItemsRef = useRef<CodebaseNode[]>(items);
    localItemsRef.current = localItems;

    const isEnabled = level === 0 || parentId !== null;

    // Sync external items when prop changes
    useEffect(() => {
        setLocalItems(items);
    }, [items]);

    const handleCreate = async () => {
        if (!isAdmin) return toast.warning("只有本人才能修改代码库。");
        if (!editTitle.trim()) return;
        const maxSortOrder = items.length > 0 ? Math.max(...items.map(i => i.sort_order ?? 0)) : 0;
        const { error } = await supabase.from('prism_codebase_nodes').insert([{
            language_id: languageId,
            parent_id: parentId,
            title: editTitle.trim(),
            level: level + 1,
            sort_order: maxSortOrder + 1
        }]);
        if (error) toast.error("新建失败");
        else {
            setIsCreating(false);
            setEditTitle("");
            onDataChange();
        }
    };

    const handleUpdate = async (id: string, newTitle: string) => {
        if (!isAdmin) return toast.warning("只有本人才能修改代码库。");
        if (!newTitle.trim()) return;
        const { error } = await supabase.from('prism_codebase_nodes').update({ title: newTitle.trim() }).eq('id', id);
        if (error) toast.error("更新失败");
        else {
            onDataChange();
        }
    };

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!isAdmin) return toast.warning("只有本人才能修改代码库。");
        if (!window.confirm("确定删除该节点及其所有子节点吗？")) return;
        const { error } = await supabase.from('prism_codebase_nodes').delete().eq('id', id);
        if (error) toast.error("删除失败");
        else onDataChange();
    };

    // Commit reordered items to Supabase
    const handleCommitReorder = useCallback(async (reorderedList: CodebaseNode[]) => {
        const hasOrderChanged = reorderedList.some((item, idx) => item.id !== items[idx]?.id);
        if (!hasOrderChanged) return;

        try {
            await Promise.all(
                reorderedList.map((item, index) =>
                    supabase
                        .from('prism_codebase_nodes')
                        .update({ sort_order: index + 1 })
                        .eq('id', item.id)
                )
            );
            onDataChange();
        } catch (err) {
            console.error("保存排序失败:", err);
            toast.error("排序更新失败");
            onDataChange();
        }
    }, [items, onDataChange]);

    return (
        <div className={`flex-1 flex flex-col border-r border-stone-200/60 bg-white transition-opacity ${level === 2 ? 'min-w-[130px]' : ''} ${isEnabled ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
            {/* Header */}
            <div className={`h-11 flex items-center justify-between px-3 border-b border-stone-200/50 shrink-0 ${level === 0 ? 'bg-stone-100/50 pt-2' : ''}`}>
                <span className="text-[10px] font-mono font-bold tracking-wider text-stone-400 capitalize">
                    {level === 0 ? 'Topics' : level === 1 ? 'Modules' : 'Items'}
                </span>
                {isAdmin && (
                    <Button size="icon" variant="ghost" className="h-6 w-6 text-stone-400 hover:text-stone-700" onClick={() => { setIsCreating(true); setEditTitle(""); }}>
                        <Plus size={14} />
                    </Button>
                )}
            </div>

            {/* Content list area */}
            <div className="flex-1 overflow-y-auto p-2 custom-scrollbar flex flex-col">
                {/* Creation Form */}
                {isAdmin && isCreating && (
                    <div className="flex items-center gap-1.5 p-1.5 mb-1.5 rounded-lg border border-purple-200 bg-purple-50 shrink-0">
                        <Input
                            value={editTitle}
                            onChange={e => setEditTitle(e.target.value)}
                            placeholder="Title..."
                            className="h-6 text-xs bg-white border-stone-200 px-1.5 focus-visible:ring-1 focus-visible:ring-purple-400"
                            autoFocus
                            onKeyDown={e => e.key === 'Enter' && handleCreate()}
                        />
                        <Button size="icon" variant="ghost" className="h-5 w-5 text-purple-600 shrink-0" onClick={handleCreate}>
                            <Check size={12} />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-5 w-5 text-stone-400 shrink-0" onClick={() => setIsCreating(false)}>
                            <X size={12} />
                        </Button>
                    </div>
                )}

                {/* Fixed Index Slots + Draggable Cards Container */}
                {localItems.length > 0 && (
                    <div className="flex w-full items-start gap-0.5">
                        {/* 1. Left Fixed Slot Numbers (Positions 1 to n remain static during drag) */}
                        <div className="w-3.5 shrink-0 flex flex-col space-y-1 select-none pointer-events-none py-0.5">
                            {localItems.map((_, idx) => (
                                <div
                                    key={idx}
                                    className="h-[34px] flex items-center justify-center text-[11px] font-mono font-semibold text-purple-600"
                                >
                                    {idx + 1}
                                </div>
                            ))}
                        </div>

                        {/* 2. Right Draggable Item Cards */}
                        <Reorder.Group
                            axis="y"
                            values={localItems}
                            onReorder={setLocalItems}
                            className="flex-1 min-w-0 flex flex-col space-y-1 py-0.5"
                        >
                            {localItems.map((item) => (
                                <ColumnItemRow
                                    key={item.id}
                                    item={item}
                                    isSelected={selectedId === item.id}
                                    allNodes={allNodes}
                                    isAdmin={isAdmin}
                                    onSelect={() => onSelect(item.id)}
                                    onUpdate={(newTitle) => handleUpdate(item.id, newTitle)}
                                    onDelete={(e) => handleDelete(item.id, e)}
                                    onCommitReorder={() => handleCommitReorder(localItemsRef.current)}
                                />
                            ))}
                        </Reorder.Group>
                    </div>
                )}
            </div>
        </div>
    );
}

// -------------------------------------------------------------
// DRAGGABLE / SELECTABLE ITEM COMPONENT WITH LONG-PRESS GESTURE
// -------------------------------------------------------------

function ColumnItemRow({
    item,
    isSelected,
    allNodes,
    isAdmin,
    onSelect,
    onUpdate,
    onDelete,
    onCommitReorder,
}: {
    item: CodebaseNode;
    isSelected: boolean;
    allNodes: CodebaseNode[];
    isAdmin: boolean;
    onSelect: () => void;
    onUpdate: (newTitle: string) => void;
    onDelete: (e: React.MouseEvent) => void;
    onCommitReorder: () => void;
}) {
    const controls = useDragControls();
    const [isEditing, setIsEditing] = useState(false);
    const [editTitle, setEditTitle] = useState(item.title);
    const [isLongPressReady, setIsLongPressReady] = useState(false);

    const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
    const pointerStartPosRef = useRef<{ x: number; y: number } | null>(null);
    const didDragRef = useRef(false);

    const childrenCount = allNodes.filter(n => n.parent_id === item.id).length;

    const clearTimer = () => {
        if (longPressTimerRef.current) {
            clearTimeout(longPressTimerRef.current);
            longPressTimerRef.current = null;
        }
    };

    const handlePointerDown = (e: React.PointerEvent) => {
        if (!isAdmin || isEditing) return;
        if (e.button !== 0) return; // Left click only

        pointerStartPosRef.current = { x: e.clientX, y: e.clientY };
        didDragRef.current = false;

        // Start long press timer (250ms)
        longPressTimerRef.current = setTimeout(() => {
            setIsLongPressReady(true);
            didDragRef.current = true;
            controls.start(e);
        }, 250);
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        if (!longPressTimerRef.current || !pointerStartPosRef.current) return;
        const dx = Math.abs(e.clientX - pointerStartPosRef.current.x);
        const dy = Math.abs(e.clientY - pointerStartPosRef.current.y);
        // If moved more than 6px before long press completes, cancel timer
        if (dx > 6 || dy > 6) {
            clearTimer();
        }
    };

    const handlePointerUp = () => {
        clearTimer();
    };

    const handlePointerCancel = () => {
        clearTimer();
        setIsLongPressReady(false);
    };

    const handleClick = () => {
        if (didDragRef.current) {
            didDragRef.current = false;
            return;
        }
        onSelect();
    };

    const handleSaveTitle = () => {
        if (editTitle.trim() && editTitle.trim() !== item.title) {
            onUpdate(editTitle.trim());
        }
        setIsEditing(false);
    };

    return (
        <Reorder.Item
            value={item}
            dragListener={false}
            dragControls={controls}
            onDragEnd={() => {
                setIsLongPressReady(false);
                onCommitReorder();
                setTimeout(() => {
                    didDragRef.current = false;
                }, 80);
            }}
            whileDrag={{
                scale: 1.02,
                boxShadow: "0 8px 18px rgba(0,0,0,0.08)",
                zIndex: 40,
            }}
            className="relative select-none"
        >
            <div
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerCancel}
                onClick={handleClick}
                className={`group h-[34px] flex items-center justify-between px-2 rounded-lg cursor-pointer transition-all border ${
                    isLongPressReady
                        ? 'bg-purple-100/90 border-purple-400 shadow-md ring-2 ring-purple-300/40 cursor-grabbing z-30'
                        : isSelected
                        ? 'bg-purple-50 border-purple-200/60 text-purple-900 shadow-sm'
                        : 'border-transparent text-stone-600 hover:bg-stone-50 hover:text-stone-900'
                }`}
            >
                {isEditing ? (
                    <div className="flex items-center gap-1 w-full" onClick={e => e.stopPropagation()}>
                        <Input
                            value={editTitle}
                            onChange={e => setEditTitle(e.target.value)}
                            className="h-6 text-xs bg-white border-stone-200 px-1.5"
                            autoFocus
                            onKeyDown={e => {
                                if (e.key === 'Enter') handleSaveTitle();
                                if (e.key === 'Escape') setIsEditing(false);
                            }}
                        />
                        <Button size="icon" variant="ghost" className="h-5 w-5 text-green-600 shrink-0" onClick={handleSaveTitle}>
                            <Check size={12} />
                        </Button>
                    </div>
                ) : (
                    <>
                        <div className="flex items-center gap-2 overflow-hidden min-w-0 flex-1">
                            {childrenCount > 0 ? (
                                <Folder size={14} className={isSelected ? 'text-purple-500' : 'text-stone-400'} />
                            ) : (
                                <FileCode size={14} className={isSelected ? 'text-purple-400' : 'text-stone-300'} />
                            )}
                            <span className={`text-xs truncate ${isSelected ? 'font-medium' : ''}`}>{item.title}</span>
                        </div>

                        <div className="flex items-center gap-0.5 shrink-0">
                            {isAdmin && (
                                <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-5 w-5 text-stone-400 hover:text-stone-700"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setIsEditing(true);
                                            setEditTitle(item.title);
                                        }}
                                    >
                                        <Edit2 size={10} />
                                    </Button>
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-5 w-5 text-stone-400 hover:text-red-500"
                                        onClick={onDelete}
                                    >
                                        <Trash2 size={10} />
                                    </Button>
                                </div>
                            )}
                            <ChevronRight
                                size={14}
                                className={`shrink-0 ml-1 transition-colors ${
                                    isSelected ? 'text-purple-500 opacity-100' : 'text-stone-300 opacity-0 group-hover:opacity-100'
                                }`}
                            />
                        </div>
                    </>
                )}
            </div>
        </Reorder.Item>
    );
}
