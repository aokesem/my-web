"use client";

import React, { useState, useRef } from "react";
import { ArrowLeft, BookOpen } from "lucide-react";
import Link from "next/link";
import { LanguageSidebar } from "./components/LanguageSidebar";
import { CodebaseColumns } from "./components/CodebaseColumns";
import { CodebaseContent } from "./components/CodebaseContent";
import { useCodebaseLanguages, useCodebaseNodes } from "../hooks/useCodebaseData";
import { BlockEditorRef } from "@/components/ui/block-editor";

export default function CodebasePage() {
    // 1. App State
    const [selectedLanguageId, setSelectedLanguageId] = useState<string | null>(null);
    // An array of selected node IDs representing the active path
    const [selectedPath, setSelectedPath] = useState<string[]>([]);

    const editorRef = useRef<BlockEditorRef>(null);

    // 2. Data
    const { languages, isLoading: isLoadingLanguages, mutate: mutateLanguages } = useCodebaseLanguages();
    const { nodes, isLoading: isLoadingNodes, mutate: mutateNodes } = useCodebaseNodes(selectedLanguageId);

    const activeLanguage = languages.find((l) => l.id === selectedLanguageId);

    // 3. Handlers
    const handleSelectLanguage = (id: string) => {
        if (id !== selectedLanguageId) {
            setSelectedLanguageId(id);
            setSelectedPath([]); // Reset path when switching language
        }
    };

    const handleSelectPath = (level: number, nodeId: string) => {
        // level corresponds to index: L1=0, L2=1, L3=2
        const newPath = selectedPath.slice(0, level); // cutoff deeper selections
        newPath[level] = nodeId;
        setSelectedPath(newPath);
    };

    return (
        <div className="flex h-screen bg-[#faf9f7] overflow-hidden text-stone-800">
            {/* 1. Navbar / Back Button */}
            <div className="absolute top-6 left-6 z-20">
                <Link
                    href="/library/prism"
                    className="flex items-center justify-center p-2.5 rounded-xl bg-white/70 border border-stone-200/60 hover:bg-white hover:shadow-sm hover:border-stone-300 transition-all backdrop-blur-sm"
                >
                    <ArrowLeft size={16} className="text-stone-400 group-hover:text-stone-600" />
                </Link>
            </div>

            {/* 2. Language Sidebar (Narrow leftmost pane) */}
            <LanguageSidebar
                languages={languages}
                selectedLanguageId={selectedLanguageId}
                onSelectLanguage={handleSelectLanguage}
                isLoading={isLoadingLanguages}
                onDataChange={mutateLanguages}
            />

            {/* Main Content Area */}
            {selectedLanguageId ? (
                <div className="flex-1 flex overflow-hidden">
                    {/* 3. Miller Columns (L1, L2, L3) */}
                    <div className="w-[45%] h-full flex shrink-0">
                        <CodebaseColumns
                            languageId={selectedLanguageId}
                            nodes={nodes}
                            selectedPath={selectedPath}
                            onSelectPath={handleSelectPath}
                            isLoading={isLoadingNodes}
                            onDataChange={mutateNodes}
                        />
                    </div>

                    {/* 4. Right Content Area */}
                    <div className="flex-1 h-full bg-white border-l border-stone-200/70 overflow-hidden relative">
                        <CodebaseContent
                            nodes={nodes}
                            selectedPath={selectedPath}
                            languageId={selectedLanguageId}
                            isLoading={isLoadingNodes}
                            onDataChange={mutateNodes}
                            editorRef={editorRef}
                        />
                    </div>
                </div>
            ) : (
                // Empty state when no language is selected
                <div className="flex-1 flex flex-col items-center justify-centerbg-[#faf9f7]">
                    <div className="w-16 h-16 rounded-2xl bg-stone-50 border border-stone-200/60 flex items-center justify-center">
                        <BookOpen size={28} className="text-stone-400" />
                    </div>
                    <h2 className="text-xl font-serif font-bold text-stone-700 mt-4">选择语言或工具</h2>
                    <p className="text-sm text-stone-400 mt-2">从左侧边栏选择一门语言，开始你的代码探索</p>
                </div>
            )}
        </div>
    );
}
