"use client";

import React, { useState, useEffect, useMemo } from "react";
import { CodebaseNode } from "../../types";
import {
    ListTree,
    Search,
    X,
    Columns3,
    FileText,
    ChevronRight,
    Hash,
    ArrowUpRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { indexHeadingsFromNotes, type IndexedHeading } from "@/lib/headingIndex";

interface CodebaseTreeSidebarProps {
    targetNode?: CodebaseNode | null;
    breadcrumbs?: string[];
    onSwitchToColumns?: () => void;
    // Compatibility props if passed
    languageId?: string;
    nodes?: CodebaseNode[];
    selectedPath?: string[];
    onSelectFullPath?: (path: string[]) => void;
    isLoading?: boolean;
    onDataChange?: () => void;
    isAdmin?: boolean;
}

export function CodebaseTreeSidebar({
    targetNode: directTargetNode,
    breadcrumbs: directBreadcrumbs,
    onSwitchToColumns,
    nodes,
    selectedPath,
}: CodebaseTreeSidebarProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [activeHeadingId, setActiveHeadingId] = useState<string | null>(null);

    // Resolve target node and breadcrumbs (from direct prop or from nodes + selectedPath)
    const activeNode = useMemo(() => {
        if (directTargetNode !== undefined) return directTargetNode;
        if (nodes && selectedPath && selectedPath.length > 0) {
            const lastId = selectedPath[selectedPath.length - 1];
            return nodes.find((n) => n.id === lastId) || null;
        }
        return null;
    }, [directTargetNode, nodes, selectedPath]);

    const activeBreadcrumbs = useMemo(() => {
        if (directBreadcrumbs !== undefined) return directBreadcrumbs;
        if (nodes && selectedPath) {
            return selectedPath.map((id) => nodes.find((n) => n.id === id)?.title).filter(Boolean) as string[];
        }
        return [];
    }, [directBreadcrumbs, nodes, selectedPath]);

    // Extract headings from notes
    const headings: IndexedHeading[] = useMemo(() => {
        if (!activeNode?.notes) return [];
        return indexHeadingsFromNotes(activeNode.notes);
    }, [activeNode?.notes]);

    // Filter headings based on search query
    const filteredHeadings = useMemo(() => {
        if (!searchQuery.trim()) return headings;
        const q = searchQuery.toLowerCase().trim();
        return headings.filter((h) => h.text.toLowerCase().includes(q));
    }, [headings, searchQuery]);

    // Track active heading with IntersectionObserver
    useEffect(() => {
        if (!headings || headings.length === 0) return;

        // Small timeout to ensure DOM headings are mounted
        const timer = setTimeout(() => {
            const headingElements = headings
                .map((h) => document.getElementById(h.id))
                .filter(Boolean) as HTMLElement[];

            if (headingElements.length === 0) return;

            const observer = new IntersectionObserver(
                (entries) => {
                    const visible = entries.filter((e) => e.isIntersecting);
                    if (visible.length > 0) {
                        const target = visible[0].target;
                        if (target.id) {
                            setActiveHeadingId(target.id);
                        }
                    }
                },
                {
                    rootMargin: "0px 0px -70% 0px",
                    threshold: 0.1,
                }
            );

            headingElements.forEach((el) => observer.observe(el));
            return () => observer.disconnect();
        }, 300);

        return () => clearTimeout(timer);
    }, [headings, activeNode?.id]);

    const scrollToHeading = (id: string) => {
        setActiveHeadingId(id);
        const el = document.getElementById(id);
        if (el) {
            el.scrollIntoView({ behavior: "smooth", block: "start" });
        }
    };

    return (
        <aside className="w-full h-full flex flex-col bg-[#fcfcfc] text-stone-700 select-none border-r border-stone-200/60">
            {/* 1. Header */}
            <div className="h-11 border-b border-stone-200/50 flex items-center justify-between px-3.5 bg-stone-100/50 shrink-0">
                <div className="flex items-center gap-1.5">
                    <ListTree size={14} className="text-purple-600" />
                    <span className="text-[11px] font-mono font-bold tracking-wider text-stone-600 uppercase">
                        页面大纲
                    </span>
                    {headings.length > 0 && (
                        <span className="ml-1 text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-purple-50 text-purple-600 border border-purple-200/60 font-semibold">
                            {headings.length}
                        </span>
                    )}
                </div>

                {onSwitchToColumns && (
                    <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6 text-stone-400 hover:text-purple-600 hover:bg-purple-50"
                        title="切换回三级级联目录"
                        onClick={onSwitchToColumns}
                    >
                        <Columns3 size={13} />
                    </Button>
                )}
            </div>

            {/* 2. Current Document Context */}
            {activeNode ? (
                <div className="px-3.5 py-2.5 border-b border-stone-200/40 bg-white/60">
                    {activeBreadcrumbs.length > 1 && (
                        <div className="flex items-center gap-1 text-[10px] font-mono text-stone-400 truncate mb-1">
                            {activeBreadcrumbs.slice(0, -1).map((crumb, idx) => (
                                <React.Fragment key={idx}>
                                    <span className="truncate">{crumb}</span>
                                    {idx < activeBreadcrumbs.length - 2 && <ChevronRight size={10} className="shrink-0 text-stone-300" />}
                                </React.Fragment>
                            ))}
                        </div>
                    )}
                    <div className="flex items-center gap-1.5">
                        <FileText size={13} className="text-stone-400 shrink-0" />
                        <span className="text-xs font-semibold text-stone-800 truncate" title={activeNode.title}>
                            {activeNode.title}
                        </span>
                    </div>
                </div>
            ) : null}

            {/* 3. Search Bar (if headings exist or during search) */}
            {activeNode && (headings.length > 4 || searchQuery.trim().length > 0) && (
                <div className="p-2 border-b border-stone-200/40">
                    <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white border border-stone-200/70 focus-within:border-purple-300 focus-within:ring-1 focus-within:ring-purple-200 transition-all">
                        <Search size={12} className="text-stone-400 shrink-0" />
                        <Input
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="筛选大纲标题..."
                            className="h-5 text-xs p-0 border-0 focus-visible:ring-0 placeholder:text-stone-400"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery("")}
                                className="text-stone-400 hover:text-stone-600 p-0.5 rounded cursor-pointer"
                            >
                                <X size={11} />
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* 4. Headings List Area */}
            <div className="flex-1 overflow-y-auto py-2 px-2 custom-scrollbar space-y-0.5">
                {!activeNode ? (
                    // Empty: No page selected
                    <div className="h-full flex flex-col items-center justify-center text-center p-6 text-stone-400">
                        <div className="w-10 h-10 rounded-xl bg-stone-100 flex items-center justify-center mb-3 text-stone-400">
                            <ListTree size={20} className="opacity-40" />
                        </div>
                        <p className="text-xs font-medium text-stone-600 mb-1">未选择笔记</p>
                        <p className="text-[11px] text-stone-400 leading-relaxed mb-4">
                            请在级联目录中选中具体章节或条目，以查看该页大纲
                        </p>
                        {onSwitchToColumns && (
                            <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs text-purple-600 border-purple-200 hover:bg-purple-50"
                                onClick={onSwitchToColumns}
                            >
                                <Columns3 size={12} className="mr-1.5" /> 打开级联目录
                            </Button>
                        )}
                    </div>
                ) : headings.length === 0 ? (
                    // Empty: Current page has no headings
                    <div className="h-full flex flex-col items-center justify-center text-center p-6 text-stone-400">
                        <div className="w-10 h-10 rounded-xl bg-stone-100 flex items-center justify-center mb-3 text-stone-400">
                            <Hash size={20} className="opacity-40" />
                        </div>
                        <p className="text-xs font-medium text-stone-600 mb-1">暂无大纲目录</p>
                        <p className="text-[11px] text-stone-400 leading-relaxed">
                            当前笔记未检测到 H1 / H2 / H3 标题。
                            <br />
                            在正文中使用一级、二级或三级标题，将自动在此生成大纲。
                        </p>
                    </div>
                ) : filteredHeadings.length === 0 ? (
                    // Search no match
                    <div className="py-8 text-center text-stone-400 text-xs">
                        <p>未找到匹配的标题</p>
                        <button
                            onClick={() => setSearchQuery("")}
                            className="mt-2 text-purple-600 hover:underline text-[11px] cursor-pointer"
                        >
                            清除搜索
                        </button>
                    </div>
                ) : (
                    // Render Headings
                    filteredHeadings.map((h, idx) => {
                        const isActive = activeHeadingId === h.id;

                        // Level-specific styles and indentation
                        let indentClass = "pl-2";
                        let levelBadge = "H1";
                        let badgeClass = "bg-purple-50 text-purple-600 border-purple-200/50";
                        let textClass = "font-medium text-stone-800 text-[13px]";

                        if (h.level === 2) {
                            indentClass = "pl-5";
                            levelBadge = "H2";
                            badgeClass = "bg-stone-100 text-stone-500 border-stone-200/60";
                            textClass = "text-stone-600 text-[12.5px]";
                        } else if (h.level >= 3) {
                            indentClass = "pl-8";
                            levelBadge = "H3";
                            badgeClass = "bg-stone-50 text-stone-400 border-transparent";
                            textClass = "text-stone-500 text-[12px]";
                        }

                        return (
                            <button
                                key={`${h.id}-${idx}`}
                                onClick={() => scrollToHeading(h.id)}
                                className={`w-full text-left py-1.5 pr-2.5 rounded-md transition-all flex items-center gap-1.5 group cursor-pointer ${indentClass} ${
                                    isActive
                                        ? "bg-purple-50/90 text-purple-700 font-semibold"
                                        : "hover:bg-stone-100/80 hover:text-stone-900"
                                }`}
                                title={h.text}
                            >
                                <span
                                    className={`text-[9px] font-mono font-bold px-1 py-0.2 rounded border shrink-0 transition-colors ${badgeClass} ${
                                        isActive ? "bg-purple-100 text-purple-700 border-purple-300" : ""
                                    }`}
                                >
                                    {levelBadge}
                                </span>
                                <span className={`truncate leading-snug ${textClass} ${isActive ? "text-purple-700" : ""}`}>
                                    {h.text}
                                </span>
                                <ArrowUpRight
                                    size={11}
                                    className="ml-auto opacity-0 group-hover:opacity-40 shrink-0 text-stone-400"
                                />
                            </button>
                        );
                    })
                )}
            </div>
        </aside>
    );
}
