"use client";

import React, { useState } from "react";
import TagsTab from "./components/TagsTab";
import ProjectsTab from "./components/ProjectsTab";
import PapersTab from "./components/PapersTab";

export default function PrismAdminPage() {
    const [activeTab, setActiveTab] = useState<"papers" | "projects" | "tags">("papers");

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-white mb-2">论文体系库</h1>
                    <p className="text-zinc-400">管理 Cognitive Prism 模块的论文、体系与分类标签。</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex space-x-1 p-1 bg-zinc-900 rounded-lg w-fit border border-zinc-800">
                <button
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === "papers" ? "bg-zinc-800 text-white shadow-sm" : "text-zinc-400 hover:text-zinc-200"}`}
                    onClick={() => setActiveTab("papers")}
                >
                    论文管理
                </button>
                <button
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === "projects" ? "bg-zinc-800 text-white shadow-sm" : "text-zinc-400 hover:text-zinc-200"}`}
                    onClick={() => setActiveTab("projects")}
                >
                    项目体系管理
                </button>
                <button
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === "tags" ? "bg-zinc-800 text-white shadow-sm" : "text-zinc-400 hover:text-zinc-200"}`}
                    onClick={() => setActiveTab("tags")}
                >
                    研究方向与性质标签
                </button>
            </div>

            {/* Content Area */}
            <div className="mt-4">
                {activeTab === "papers" && <PapersTab />}
                {activeTab === "projects" && <ProjectsTab />}
                {activeTab === "tags" && <TagsTab />}
            </div>
        </div>
    );
}
