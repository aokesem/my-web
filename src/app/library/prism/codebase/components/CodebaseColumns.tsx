"use client";

import React, { useState } from "react";
import { CodebaseNode } from "../../types";
import { ChevronRight, Plus, Edit2, Trash2, Folder, FileCode, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";

interface CodebaseColumnsProps {
    languageId: string;
    nodes: CodebaseNode[];
    selectedPath: string[]; // Length determines depth: [L1_id, L2_id, L3_id]
    onSelectPath: (level: number, nodeId: string) => void;
    isLoading: boolean;
    onDataChange: () => void;
}

const MAX_COLUMNS = 3; // L1, L2, L3

export function CodebaseColumns({ languageId, nodes, selectedPath, onSelectPath, isLoading, onDataChange }: CodebaseColumnsProps) {
    // Generate data for each column based on selection
    const columnsData: { level: number; parentId: string | null; items: CodebaseNode[] }[] = [];
    
    // Column 0: L1 nodes (parentId is null)
    columnsData.push({
        level: 0,
        parentId: null,
        items: nodes.filter(n => n.parent_id === null).sort((a,b) => a.sort_order - b.sort_order)
    });

    // Subsequent columns depending on selectedPath
    for (let i = 0; i < MAX_COLUMNS - 1; i++) {
        const selectedId = selectedPath[i];
        if (selectedId) {
            columnsData.push({
                level: i + 1,
                parentId: selectedId,
                items: nodes.filter(n => n.parent_id === selectedId).sort((a,b) => a.sort_order - b.sort_order)
            });
        } else {
            // Even if not selected, we display an empty state for the remaining columns up to MAX
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
                />
            ))}
        </div>
    );
}

// -------------------------------------------------------------
// INDIVIDUAL COLUMN COMPONENT
// -------------------------------------------------------------

function Column({ level, parentId, languageId, items, selectedId, onSelect, onDataChange, allNodes }: {
    level: number;
    parentId: string | null;
    languageId: string;
    items: CodebaseNode[];
    selectedId?: string;
    onSelect: (id: string) => void;
    onDataChange: () => void;
    allNodes: CodebaseNode[];
}) {
    const [isCreating, setIsCreating] = useState(false);
    const [isEditing, setIsEditing] = useState<string | null>(null);
    const [editTitle, setEditTitle] = useState("");

    const isEnabled = level === 0 || parentId !== null;

    const handleCreate = async () => {
        if (!editTitle.trim()) return;
        const { error } = await supabase.from('prism_codebase_nodes').insert([{
            language_id: languageId,
            parent_id: parentId,
            title: editTitle,
            level: level + 1,
            sort_order: items.length + 1
        }]);
        if (error) toast.error("新建失败");
        else {
            setIsCreating(false);
            setEditTitle("");
            onDataChange();
        }
    };

    const handleUpdate = async (id: string) => {
        if (!editTitle.trim()) return;
        const { error } = await supabase.from('prism_codebase_nodes').update({ title: editTitle }).eq('id', id);
        if (error) toast.error("更新失败");
        else {
            setIsEditing(null);
            onDataChange();
        }
    };

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!window.confirm("确定删除该节点及其所有子节点吗？")) return;
        const { error } = await supabase.from('prism_codebase_nodes').delete().eq('id', id);
        if (error) toast.error("删除失败");
        else onDataChange();
    };

    const hasChildren = (id: string) => allNodes.some(n => n.parent_id === id);

    return (
        <div className={`flex-1 flex flex-col border-r border-stone-200/60 bg-white transition-opacity ${isEnabled ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
            {/* Header */}
            <div className={`h-11 flex items-center justify-between px-3 border-b border-stone-200/50 shrink-0 ${level === 0 ? 'bg-stone-100/50 pt-2' : ''}`}>
                <span className="text-[10px] font-mono font-bold tracking-wider text-stone-400 capitalize">
                    {level === 0 ? 'Topics' : level === 1 ? 'Modules' : 'Items'}
                </span>
                <Button size="icon" variant="ghost" className="h-6 w-6 text-stone-400 hover:text-stone-700" onClick={() => { setIsCreating(true); setEditTitle(""); }}>
                    <Plus size={14} />
                </Button>
            </div>

            {/* List */}
            <div className={`flex-1 overflow-y-auto p-2 space-y-0.5 custom-scrollbar`}>
                {isCreating && (
                    <div className="flex items-center gap-1.5 p-1.5 rounded-lg border border-purple-200 bg-purple-50">
                        <Input value={editTitle} onChange={e => setEditTitle(e.target.value)} placeholder="Title..." className="h-6 text-xs bg-white border-stone-200 px-1.5 focus-visible:ring-1 focus-visible:ring-purple-400" autoFocus onKeyDown={e => e.key === 'Enter' && handleCreate()} />
                        <Button size="icon" variant="ghost" className="h-5 w-5 text-purple-600 shrink-0" onClick={handleCreate}><Check size={12} /></Button>
                        <Button size="icon" variant="ghost" className="h-5 w-5 text-stone-400 shrink-0" onClick={() => setIsCreating(false)}><X size={12} /></Button>
                    </div>
                )}

                {items.map(item => {
                    const isSelected = selectedId === item.id;
                    const childrenCount = allNodes.filter(n => n.parent_id === item.id).length;

                    return (
                        <div
                            key={item.id}
                            className={`group flex items-center justify-between p-2 rounded-lg cursor-pointer transition-all border ${isSelected ? 'bg-purple-50 border-purple-200/60 text-purple-900 shadow-sm' : 'border-transparent text-stone-600 hover:bg-stone-50 hover:text-stone-900'}`}
                            onClick={() => onSelect(item.id)}
                        >
                            {isEditing === item.id ? (
                                <div className="flex items-center gap-1 w-full" onClick={e => e.stopPropagation()}>
                                    <Input value={editTitle} onChange={e => setEditTitle(e.target.value)} className="h-6 text-xs bg-white border-stone-200 px-1.5" autoFocus onKeyDown={e => e.key === 'Enter' && handleUpdate(item.id)} />
                                    <Button size="icon" variant="ghost" className="h-5 w-5 text-green-600 shrink-0" onClick={() => handleUpdate(item.id)}><Check size={12} /></Button>
                                </div>
                            ) : (
                                <>
                                    <div className="flex items-center gap-2 overflow-hidden">
                                        {childrenCount > 0 ? (
                                            <Folder size={14} className={isSelected ? 'text-purple-500' : 'text-stone-400'} />
                                        ) : (
                                            <FileCode size={14} className={isSelected ? 'text-purple-400' : 'text-stone-300'} />
                                        )}
                                        <span className={`text-xs truncate ${isSelected ? 'font-medium' : ''}`}>{item.title}</span>
                                    </div>

                                    <div className="flex items-center gap-0.5">
                                        <div className="opacity-0 group-hover:opacity-100 flex items-center transition-opacity">
                                            <Button size="icon" variant="ghost" className="h-5 w-5 text-stone-400 hover:text-stone-700" onClick={(e) => { e.stopPropagation(); setIsEditing(item.id); setEditTitle(item.title); }}><Edit2 size={10} /></Button>
                                            <Button size="icon" variant="ghost" className="h-5 w-5 text-stone-400 hover:text-red-500" onClick={(e) => handleDelete(item.id, e)}><Trash2 size={10} /></Button>
                                        </div>
                                        {/* Chevron for indicating it has children or can be opened */}
                                        <ChevronRight size={14} className={`shrink-0 ml-1 transition-colors ${isSelected ? 'text-purple-500 opacity-100' : 'text-stone-300 opacity-0 group-hover:opacity-100'}`} />
                                    </div>
                                </>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
