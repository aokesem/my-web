"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Plus, Pencil, Trash2, ChevronRight, ChevronDown, BookMarked, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface TaskNode {
    id: string;
    title: string;
    parent_id: string | null;
    sort_order: number;
    user_id: string;
    children?: TaskNode[];
}

export default function PlaybookAdminPage() {
    const [forest, setForest] = useState<TaskNode[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

    // For creating new root
    const [isCreatingRoot, setIsCreatingRoot] = useState(false);
    const [newRootTitle, setNewRootTitle] = useState("");

    // For editing a node
    const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
    const [editingTitle, setEditingTitle] = useState("");

    // For creating a child node
    const [addingChildTo, setAddingChildTo] = useState<string | null>(null);
    const [newChildTitle, setNewChildTitle] = useState("");

    useEffect(() => {
        fetchForest();
    }, []);

    const fetchForest = async () => {
        setIsLoading(true);
        const { data, error } = await supabase
            .from("playbook_tasks")
            .select("*")
            .order("sort_order", { ascending: true });

        if (error) {
            toast.error("获取任务数据失败: " + error.message);
            setIsLoading(false);
            return;
        }

        if (data) {
            const taskMap = new Map<string, TaskNode>();
            const roots: TaskNode[] = [];

            data.forEach((item) => {
                taskMap.set(item.id, { ...item, children: [] });
            });

            data.forEach((item) => {
                const node = taskMap.get(item.id)!;
                if (item.parent_id) {
                    const parent = taskMap.get(item.parent_id);
                    if (parent) {
                        parent.children!.push(node);
                    }
                } else {
                    roots.push(node);
                }
            });

            setForest(roots);

            // Auto expand root nodes on first load
            if (expandedNodes.size === 0) {
                const initialExpanded = new Set<string>();
                roots.forEach(r => initialExpanded.add(r.id));
                setExpandedNodes(initialExpanded);
            }
        }
        setIsLoading(false);
    };

    const toggleExpand = (id: string) => {
        setExpandedNodes((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const handleCreateRoot = async () => {
        if (!newRootTitle.trim()) return;

        const { data: userData } = await supabase.auth.getUser();
        if (!userData.user) {
            toast.error("未登录");
            return;
        }

        const { error } = await supabase.from("playbook_tasks").insert([
            { title: newRootTitle.trim(), user_id: userData.user.id }
        ]);

        if (error) {
            toast.error("创建失败: " + error.message);
        } else {
            toast.success("根任务创建成功");
            setNewRootTitle("");
            setIsCreatingRoot(false);
            fetchForest();
        }
    };

    const handleCreateChild = async (parentId: string) => {
        if (!newChildTitle.trim()) return;

        const { data: userData } = await supabase.auth.getUser();
        if (!userData.user) return;

        const { error } = await supabase.from("playbook_tasks").insert([
            { title: newChildTitle.trim(), parent_id: parentId, user_id: userData.user.id }
        ]);

        if (error) {
            toast.error("添加子任务失败: " + error.message);
        } else {
            toast.success("子任务已添加");
            setNewChildTitle("");
            setAddingChildTo(null);
            // Ensure parent is expanded
            setExpandedNodes(prev => new Set(prev).add(parentId));
            fetchForest();
        }
    };

    const handleUpdateTitle = async (id: string) => {
        if (!editingTitle.trim()) return;

        const { error } = await supabase
            .from("playbook_tasks")
            .update({ title: editingTitle.trim() })
            .eq("id", id);

        if (error) {
            toast.error("重命名失败: " + error.message);
        } else {
            toast.success("重命名成功");
            setEditingNodeId(null);
            fetchForest();
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("确定要删除此任务及其所有子任务吗？此操作不可恢复。")) return;

        const { error } = await supabase
            .from("playbook_tasks")
            .delete()
            .eq("id", id);

        if (error) {
            toast.error("删除失败: " + error.message);
        } else {
            toast.success("节点已删除");
            fetchForest();
        }
    };

    const renderNode = (node: TaskNode, level = 0) => {
        const isExpanded = expandedNodes.has(node.id);
        const hasChildren = node.children && node.children.length > 0;
        const isEditing = editingNodeId === node.id;
        const isAddingChild = addingChildTo === node.id;

        return (
            <div key={node.id} className="w-full">
                <div
                    className={`group flex items-center py-2 px-3 rounded-md hover:bg-zinc-800/50 transition-colors ${level === 0 ? 'bg-zinc-900 border border-zinc-800 mb-2' : ''}`}
                    style={{ marginLeft: `${level === 0 ? 0 : 2}rem` }}
                >
                    <div className="flex items-center flex-1 gap-2">
                        {/* Expand/Collapse Icon */}
                        <button
                            onClick={() => toggleExpand(node.id)}
                            className={`p-1 rounded text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors ${!hasChildren ? 'opacity-0 cursor-default' : ''}`}
                            disabled={!hasChildren}
                        >
                            {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        </button>

                        {/* Node Content */}
                        {isEditing ? (
                            <div className="flex items-center gap-2 flex-1 mr-4">
                                <Input
                                    value={editingTitle}
                                    onChange={(e) => setEditingTitle(e.target.value)}
                                    className="h-8 bg-zinc-950 border-zinc-700 text-sm"
                                    autoFocus
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleUpdateTitle(node.id);
                                        if (e.key === 'Escape') setEditingNodeId(null);
                                    }}
                                />
                                <Button size="sm" variant="ghost" onClick={() => handleUpdateTitle(node.id)} className="text-green-400 hover:text-green-300 h-8 px-2">
                                    <Save size={14} />
                                </Button>
                                <Button size="sm" variant="ghost" onClick={() => setEditingNodeId(null)} className="text-zinc-400 hover:text-zinc-300 h-8 px-2">
                                    <X size={14} />
                                </Button>
                            </div>
                        ) : (
                            <span className={`text-sm ${level === 0 ? 'font-semibold text-zinc-200' : 'text-zinc-300'}`}>
                                {node.title}
                            </span>
                        )}
                    </div>

                    {/* Actions Menu (Hidden until hover) */}
                    {!isEditing && (
                        <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity gap-1">
                            <Button
                                size="sm" variant="ghost"
                                className="h-7 w-7 p-0 text-blue-400 hover:text-blue-300 hover:bg-blue-900/40"
                                onClick={() => {
                                    setAddingChildTo(node.id);
                                    setNewChildTitle("");
                                    setExpandedNodes(prev => new Set(prev).add(node.id)); // expand to see new input
                                }}
                                title="添加子任务"
                            >
                                <Plus size={14} />
                            </Button>
                            <Button
                                size="sm" variant="ghost"
                                className="h-7 w-7 p-0 text-zinc-400 hover:text-zinc-300 hover:bg-zinc-700"
                                onClick={() => {
                                    setEditingNodeId(node.id);
                                    setEditingTitle(node.title);
                                }}
                                title="重命名"
                            >
                                <Pencil size={14} />
                            </Button>
                            <Button
                                size="sm" variant="ghost"
                                className="h-7 w-7 p-0 text-red-400 hover:text-red-300 hover:bg-red-900/40"
                                onClick={() => handleDelete(node.id)}
                                title="删除"
                            >
                                <Trash2 size={14} />
                            </Button>
                        </div>
                    )}
                </div>

                {/* Inline Add Child Input */}
                {isAddingChild && (
                    <div className="flex items-center gap-2 mb-2" style={{ marginLeft: `${level + 2}rem` }}>
                        <div className="w-4 h-px bg-zinc-700 ml-2" />
                        <Input
                            value={newChildTitle}
                            onChange={(e) => setNewChildTitle(e.target.value)}
                            placeholder="输入新子任务标题..."
                            className="h-8 max-w-sm bg-zinc-950 border-zinc-800 text-sm"
                            autoFocus
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleCreateChild(node.id);
                                if (e.key === 'Escape') setAddingChildTo(null);
                            }}
                        />
                        <Button size="sm" variant="ghost" onClick={() => handleCreateChild(node.id)} className="text-blue-400 hover:text-blue-300 h-8 px-2">保存</Button>
                        <Button size="sm" variant="ghost" onClick={() => setAddingChildTo(null)} className="text-zinc-400 hover:text-zinc-300 h-8 px-2">取消</Button>
                    </div>
                )}

                {/* Render Children */}
                {isExpanded && hasChildren && (
                    <div className="flex flex-col relative">
                        {/* Indent Guide Line */}
                        <div className="absolute left-[1.35rem] top-0 bottom-4 w-px bg-zinc-800" />
                        {node.children!.map(child => renderNode(child, level + 1))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="flex flex-col h-full bg-[#0a0a0a] text-zinc-100 rounded-xl border border-white/10 p-6 md:p-8">
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/10">
                <div>
                    <h1 className="text-2xl font-semibold flex items-center">
                        <BookMarked className="mr-3 text-blue-500" />
                        任务森林管理
                    </h1>
                    <p className="text-zinc-400 text-sm mt-2">
                        管理显示在「窗外书本」内的展开态蓝图树。支持无限级嵌套与无限量树丛。
                    </p>
                </div>
                {!isCreatingRoot && (
                    <Button
                        onClick={() => {
                            setIsCreatingRoot(true);
                            setNewRootTitle("");
                        }}
                        className="bg-zinc-100 text-zinc-900 hover:bg-zinc-200"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        新建根任务 (Root Forest)
                    </Button>
                )}
            </div>

            {/* Create Root In-Place Input */}
            {isCreatingRoot && (
                <div className="flex gap-2 mb-6 p-4 bg-zinc-900 border border-zinc-800 rounded-lg">
                    <Input
                        value={newRootTitle}
                        onChange={(e) => setNewRootTitle(e.target.value)}
                        placeholder="输入新的根森林主题..."
                        className="bg-zinc-950 border-zinc-800 focus-visible:ring-1 focus-visible:ring-blue-500"
                        autoFocus
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') handleCreateRoot();
                            if (e.key === 'Escape') setIsCreatingRoot(false);
                        }}
                    />
                    <Button onClick={handleCreateRoot} className="bg-blue-600 hover:bg-blue-500 text-white">保存</Button>
                    <Button variant="ghost" onClick={() => setIsCreatingRoot(false)}>取消</Button>
                </div>
            )}

            {/* Tree Area */}
            <div className="flex-1 overflow-y-auto subtle-scrollbar pr-2">
                {isLoading ? (
                    <div className="animate-pulse space-y-4">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-12 bg-zinc-900 rounded-md border border-zinc-800 w-full md:w-2/3" />
                        ))}
                    </div>
                ) : forest.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-48 text-zinc-500 border border-dashed border-zinc-800 rounded-lg">
                        <BookMarked className="w-8 h-8 mb-4 opacity-50" />
                        <p>还没有记录任何任务森林，点击右上角开始创建。</p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-2 relative">
                        {forest.map(root => renderNode(root, 0))}
                    </div>
                )}
            </div>
        </div>
    );
}
