"use client";

import React, { useState, useEffect, useImperativeHandle, forwardRef, useRef, useCallback } from "react";
import { CodebaseNode } from "../../types";
import { ChevronRight, FileCode, CheckCircle2, Save, X } from "lucide-react";
import { BlockEditor, BlockEditorRef } from "@/components/ui/block-editor";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export interface CodebaseContentHandle {
    /** 返回 true 表示可以继续导航；false 表示用户取消 */
    confirmLeaveIfNeeded: () => boolean;
}

interface CodebaseContentProps {
    nodes: CodebaseNode[];
    selectedPath: string[];
    languageId: string;
    onDataChange: () => void;
    editorRef: React.RefObject<BlockEditorRef | null>;
}

export const CodebaseContent = forwardRef<CodebaseContentHandle, CodebaseContentProps>(function CodebaseContent(
    { nodes, selectedPath, languageId, onDataChange, editorRef },
    ref
) {
    const [isEditing, setIsEditing] = useState(false);
    const [isDirty, setIsDirty] = useState(false);
    /** 进入编辑后 TipTap 可能立刻触发一次 onUpdate，不应记为脏 */
    const skipNextDirtyFromEditorRef = useRef(false);

    // Deepest selected node is the target for content
    const targetNodeId = selectedPath.length > 0 ? selectedPath[selectedPath.length - 1] : null;
    const targetNode = nodes.find((n) => n.id === targetNodeId);

    // Breadcrumbs
    const breadcrumbs = selectedPath.map((id) => nodes.find((n) => n.id === id)?.title || "Unknown");

    useImperativeHandle(
        ref,
        () => ({
            confirmLeaveIfNeeded: () => {
                if (!isEditing || !isDirty) return true;
                return window.confirm("当前笔记有未保存的修改，确定要离开吗？未保存的内容将丢失。");
            },
        }),
        [isEditing, isDirty]
    );

    // Close editing when selecting a new node
    /* eslint-disable react-hooks/set-state-in-effect -- switching nodes must reset local edit flags immediately */
    useEffect(() => {
        setIsEditing(false);
        setIsDirty(false);
        skipNextDirtyFromEditorRef.current = false;
    }, [targetNodeId]);
    /* eslint-enable react-hooks/set-state-in-effect */

    useEffect(() => {
        if (!isEditing || !isDirty) return;
        const onBeforeUnload = (e: BeforeUnloadEvent) => {
            e.preventDefault();
            e.returnValue = "";
        };
        window.addEventListener("beforeunload", onBeforeUnload);
        return () => window.removeEventListener("beforeunload", onBeforeUnload);
    }, [isEditing, isDirty]);

    const handleSave = useCallback(async () => {
        if (!targetNode || !editorRef.current || !editorRef.current.editor) return;
        const htmlContent = editorRef.current.editor.getHTML();

        const { error } = await supabase.from("prism_codebase_nodes").update({ notes: htmlContent }).eq("id", targetNode.id);

        if (error) {
            toast.error("保存失败: " + error.message);
        } else {
            toast.success("保存成功", { icon: <CheckCircle2 className="text-emerald-500" /> });
            setIsEditing(false);
            setIsDirty(false);
            onDataChange();
        }
    }, [targetNode, editorRef, onDataChange]);

    // Ctrl+S save shortcut
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === "s") {
                e.preventDefault();
                if (isEditing && targetNode) {
                    void handleSave();
                }
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isEditing, targetNode, handleSave]);

    const beginEditing = () => {
        skipNextDirtyFromEditorRef.current = true;
        setIsEditing(true);
        setIsDirty(false);
    };

    if (!targetNode) {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center text-stone-400 bg-stone-50/50">
                <FileCode size={48} className="mb-4 opacity-20" />
                <p>从左侧目录选择一项开始查看或编辑笔记</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-white relative">
            {/* Header / Breadcrumbs */}
            <div className="h-12 border-b border-stone-200/60 flex items-center px-6 shrink-0 bg-white/80 backdrop-blur top-0 z-10 sticky">
                <div className="flex items-center text-xs font-mono text-stone-500">
                    {breadcrumbs.map((crumb, idx) => (
                        <React.Fragment key={idx}>
                            <span className={idx === breadcrumbs.length - 1 ? "text-purple-600 font-semibold" : ""}>{crumb}</span>
                            {idx < breadcrumbs.length - 1 && <ChevronRight size={14} className="mx-1 text-stone-300" />}
                        </React.Fragment>
                    ))}
                </div>

                <div className="ml-auto flex items-center gap-2">
                    {isEditing ? (
                        <>
                            <Button size="sm" variant="ghost" className="h-7 text-xs text-stone-500 px-2" onClick={() => setIsEditing(false)}>
                                <X size={14} className="mr-1" /> 取消
                            </Button>
                            <Button size="sm" className="h-7 text-xs bg-purple-600 hover:bg-purple-700 text-white px-3" onClick={handleSave}>
                                <Save size={14} className="mr-1" /> 保存
                            </Button>
                        </>
                    ) : (
                        <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs text-stone-600 border-stone-200 px-3 hover:bg-stone-50 hover:text-purple-600"
                            onClick={beginEditing}
                        >
                            编辑内容
                        </Button>
                    )}
                </div>
            </div>

            {/* Editor Area */}
            <div className="flex-1 overflow-y-auto px-10 py-8 custom-scrollbar relative group" onDoubleClick={() => !isEditing && beginEditing()}>
                {!isEditing && (
                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity text-[10px] text-stone-400 font-mono pointer-events-none select-none">
                        Double click to edit
                    </div>
                )}

                <div className="max-w-3xl mx-auto w-full min-h-full pb-20">
                    <h1 className="text-3xl font-bold font-serif text-stone-800 mb-8">{targetNode.title}</h1>

                    <BlockEditor
                        key={targetNodeId}
                        ref={editorRef}
                        value={targetNode.notes || ""}
                        editable={isEditing}
                        onChange={() => {
                            if (!isEditing) return;
                            if (skipNextDirtyFromEditorRef.current) {
                                skipNextDirtyFromEditorRef.current = false;
                                return;
                            }
                            setIsDirty(true);
                        }}
                        onSave={handleSave}
                        placeholder={isEditing ? "使用 / 唤出菜单..." : "还没有记录任何内容。"}
                        className="prose prose-stone prose-sm max-w-none focus:outline-none"
                        imageBucket="prism"
                        imageFolder={`codebase/${languageId}/${targetNode.id}`}
                    />
                </div>
            </div>
        </div>
    );
});

CodebaseContent.displayName = "CodebaseContent";
