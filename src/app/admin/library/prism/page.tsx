"use client";

import React, { useState } from "react";
import TagsTab from "./components/TagsTab";
import ProjectsTab from "./components/ProjectsTab";
import PapersTab from "./components/PapersTab";
import CoursesTab from "./components/CoursesTab";
import DirectionsTab from "./components/DirectionsTab";

type PaperLibraryTab = "papers" | "projects" | "tags" | "directions";

export default function PrismAdminPage() {
    const [activeTab, setActiveTab] = useState<PaperLibraryTab>("papers");

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-white mb-2">认知棱镜管理</h1>
                    <p className="text-zinc-400">
                        论文库与课程笔记分块维护：上方为论文与项目相关配置，下方为课程笔记模块（数据相互独立）。
                    </p>
                </div>
            </div>

            {/* —— 论文库 —— */}
            <section
                className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-5 space-y-4"
                aria-labelledby="prism-paper-library-heading"
            >
                <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2 border-b border-zinc-800/80 pb-3">
                    <div>
                        <h2 id="prism-paper-library-heading" className="text-lg font-semibold text-zinc-100">
                            论文库
                        </h2>
                        <p className="text-xs text-zinc-500 mt-1">论文、项目、方向/性质标签与研究问题背景</p>
                    </div>
                </div>

                <div className="flex flex-wrap gap-1 p-1 bg-zinc-900 rounded-lg w-fit border border-zinc-800">
                    <button
                        type="button"
                        className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === "papers" ? "bg-zinc-800 text-white shadow-sm" : "text-zinc-400 hover:text-zinc-200"}`}
                        onClick={() => setActiveTab("papers")}
                    >
                        论文管理
                    </button>
                    <button
                        type="button"
                        className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === "projects" ? "bg-zinc-800 text-white shadow-sm" : "text-zinc-400 hover:text-zinc-200"}`}
                        onClick={() => setActiveTab("projects")}
                    >
                        项目管理
                    </button>
                    <button
                        type="button"
                        className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === "tags" ? "bg-zinc-800 text-white shadow-sm" : "text-zinc-400 hover:text-zinc-200"}`}
                        onClick={() => setActiveTab("tags")}
                    >
                        论文方向与性质标签
                    </button>
                    <button
                        type="button"
                        className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === "directions" ? "bg-zinc-800 text-white shadow-sm" : "text-zinc-400 hover:text-zinc-200"}`}
                        onClick={() => setActiveTab("directions")}
                    >
                        研究背景与当前问题
                    </button>
                </div>

                <div className="pt-1">
                    {activeTab === "papers" && <PapersTab />}
                    {activeTab === "projects" && <ProjectsTab />}
                    {activeTab === "tags" && <TagsTab />}
                    {activeTab === "directions" && <DirectionsTab />}
                </div>
            </section>

            {/* —— 课程笔记（与论文库物理分隔） —— */}
            <section
                className="rounded-xl border border-emerald-900/40 bg-emerald-950/10 p-5 space-y-4"
                aria-labelledby="prism-courses-heading"
            >
                <div className="border-b border-emerald-900/30 pb-3">
                    <h2 id="prism-courses-heading" className="text-lg font-semibold text-emerald-100">
                        课程笔记
                    </h2>
                    <p className="text-xs text-emerald-200/50 mt-1">
                        课程、章节与公式；与上方论文库无共用表，可单独维护。
                    </p>
                </div>
                <CoursesTab />
            </section>
        </div>
    );
}
