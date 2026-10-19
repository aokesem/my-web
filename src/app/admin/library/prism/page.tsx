"use client";

import React, { useState } from "react";
import { FileText, BookText, FileCode, Archive, Loader2 } from "lucide-react";
import TagsTab from "./components/TagsTab";
import ProjectsTab from "./components/ProjectsTab";
import PapersTab from "./components/PapersTab";
import CoursesTab from "./components/CoursesTab";
import InspirationNotesTab from "./components/InspirationNotesTab";
import CodebaseTab from "./components/CodebaseTab";
import { exportEntirePrismToZip } from "@/lib/prismIO";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";

type PrismTopModule = "papers" | "courses" | "codebase";
type PaperLibrarySubTab = "papers" | "projects" | "tags" | "inspiration";

export default function PrismAdminPage() {
    const [topModule, setTopModule] = useState<PrismTopModule>("papers");
    const [paperSubTab, setPaperSubTab] = useState<PaperLibrarySubTab>("papers");
    const [isExportingAll, setIsExportingAll] = useState(false);
    const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);

    const handleConfirmExport = async () => {
        setConfirmDialogOpen(false);
        setIsExportingAll(true);
        try {
            await exportEntirePrismToZip((status) => {
                toast.loading(status, { id: "full-prism-export" });
            });
            toast.success("认知棱镜全库知识总备导出成功！", { id: "full-prism-export" });
        } catch (err: any) {
            toast.error("全库导出失败: " + err.message, { id: "full-prism-export" });
        } finally {
            setIsExportingAll(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* 顶栏标题与说明 */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-zinc-800 pb-4 gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-white mb-1.5">认知棱镜管理</h1>
                    <p className="text-sm text-zinc-400">
                        论文库、课程笔记与语言工具分模块独立维护与全库一键备份。
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    {/* 顶层模块切换 Tab */}
                    <div className="flex flex-wrap gap-1.5 p-1 bg-zinc-900 rounded-xl border border-zinc-800 w-fit">
                        <button
                            type="button"
                            onClick={() => setTopModule("papers")}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                topModule === "papers"
                                    ? "bg-zinc-800 text-white shadow-xs border border-zinc-700/60"
                                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40"
                            }`}
                        >
                            <FileText size={15} className={topModule === "papers" ? "text-cyan-400" : "text-zinc-500"} />
                            论文库
                        </button>

                        <button
                            type="button"
                            onClick={() => setTopModule("courses")}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                topModule === "courses"
                                    ? "bg-zinc-800 text-white shadow-xs border border-zinc-700/60"
                                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40"
                            }`}
                        >
                            <BookText size={15} className={topModule === "courses" ? "text-violet-400" : "text-zinc-500"} />
                            课程笔记
                        </button>

                        <button
                            type="button"
                            onClick={() => setTopModule("codebase")}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                topModule === "codebase"
                                    ? "bg-zinc-800 text-white shadow-xs border border-zinc-700/60"
                                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40"
                            }`}
                        >
                            <FileCode size={15} className={topModule === "codebase" ? "text-emerald-400" : "text-zinc-500"} />
                            语言与工具
                        </button>
                    </div>

                    {/* 全库总备导出按钮（低调沉稳外观） */}
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-10 gap-2 px-3.5 rounded-xl border-zinc-800 bg-zinc-900/80 text-zinc-300 hover:bg-zinc-800 hover:text-white transition-all font-medium text-xs shadow-xs"
                        onClick={() => setConfirmDialogOpen(true)}
                        disabled={isExportingAll}
                        title="一键导出论文库、课程笔记、语言工具三大体系的完整总备份"
                    >
                        {isExportingAll ? (
                            <>
                                <Loader2 size={14} className="animate-spin text-zinc-400" />
                                打包中...
                            </>
                        ) : (
                            <>
                                <Archive size={14} className="text-zinc-400" />
                                全库总备导出 (.zip)
                            </>
                        )}
                    </Button>
                </div>
            </div>

            {/* 二次确认弹窗 */}
            <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
                <DialogContent className="sm:max-w-md bg-zinc-900 border-zinc-800 text-zinc-100">
                    <DialogHeader>
                        <DialogTitle className="text-white flex items-center gap-2">
                            <Archive size={18} className="text-zinc-400" />
                            导出认知棱镜全库归档
                        </DialogTitle>
                        <DialogDescription className="text-zinc-400 pt-2 text-xs leading-relaxed">
                            即将对认知棱镜下的「论文库」、「课程笔记」与「语言与工具」三大体系进行全量打包，生成包含独立 Markdown 手册与系统 JSON 数据的完整归档包。
                        </DialogDescription>
                    </DialogHeader>

                    <DialogFooter className="mt-4 flex gap-2 justify-end">
                        <Button
                            type="button"
                            variant="outline"
                            className="border-zinc-700 bg-transparent text-zinc-300 hover:bg-zinc-800 hover:text-white"
                            onClick={() => setConfirmDialogOpen(false)}
                        >
                            取消
                        </Button>
                        <Button
                            type="button"
                            className="bg-zinc-100 text-zinc-900 hover:bg-white font-medium"
                            onClick={handleConfirmExport}
                        >
                            确认导出
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* 1. 论文库模块 */}
            {topModule === "papers" && (
                <section
                    className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-5 space-y-4"
                    aria-labelledby="prism-paper-library-heading"
                >
                    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2 border-b border-zinc-800/80 pb-3">
                        <div>
                            <h2 id="prism-paper-library-heading" className="text-lg font-semibold text-zinc-100 flex items-center gap-2">
                                <FileText size={18} className="text-cyan-400" />
                                论文库
                            </h2>
                            <p className="text-xs text-zinc-500 mt-1">论文、项目、方向/性质标签管理；支持全库与单篇 ZIP/JSON 备份还原</p>
                        </div>

                        {/* 论文库二级 Tab */}
                        <div className="flex flex-wrap gap-1 p-1 bg-zinc-900 rounded-lg w-fit border border-zinc-800">
                            <button
                                type="button"
                                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                                    paperSubTab === "papers" ? "bg-zinc-800 text-white shadow-xs" : "text-zinc-400 hover:text-zinc-200"
                                }`}
                                onClick={() => setPaperSubTab("papers")}
                            >
                                论文管理
                            </button>
                            <button
                                type="button"
                                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                                    paperSubTab === "projects" ? "bg-zinc-800 text-white shadow-xs" : "text-zinc-400 hover:text-zinc-200"
                                }`}
                                onClick={() => setPaperSubTab("projects")}
                            >
                                项目管理
                            </button>
                            <button
                                type="button"
                                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                                    paperSubTab === "tags" ? "bg-zinc-800 text-white shadow-xs" : "text-zinc-400 hover:text-zinc-200"
                                }`}
                                onClick={() => setPaperSubTab("tags")}
                            >
                                论文方向与性质标签
                            </button>
                            <button
                                type="button"
                                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                                    paperSubTab === "inspiration" ? "bg-zinc-800 text-white shadow-xs" : "text-zinc-400 hover:text-zinc-200"
                                }`}
                                onClick={() => setPaperSubTab("inspiration")}
                            >
                                灵感与笔记
                            </button>
                        </div>
                    </div>

                    <div className="pt-1">
                        {paperSubTab === "papers" && <PapersTab />}
                        {paperSubTab === "projects" && <ProjectsTab />}
                        {paperSubTab === "tags" && <TagsTab />}
                        {paperSubTab === "inspiration" && <InspirationNotesTab />}
                    </div>
                </section>
            )}

            {/* 2. 课程笔记模块 */}
            {topModule === "courses" && (
                <section
                    className="rounded-xl border border-violet-900/30 bg-violet-950/5 p-5 space-y-4"
                    aria-labelledby="prism-courses-heading"
                >
                    <div className="border-b border-violet-900/20 pb-3">
                        <h2 id="prism-courses-heading" className="text-lg font-semibold text-violet-100 flex items-center gap-2">
                            <BookText size={18} className="text-violet-400" />
                            课程笔记
                        </h2>
                        <p className="text-xs text-violet-200/50 mt-1">
                            课程、章节与核心公式维护；支持独立 Markdown 章节、LaTeX 排版及全库 ZIP 备份还原。
                        </p>
                    </div>
                    <CoursesTab />
                </section>
            )}

            {/* 3. 语言与工具 (Codebase) 模块 */}
            {topModule === "codebase" && (
                <section
                    className="rounded-xl border border-emerald-900/30 bg-emerald-950/5 p-5 space-y-4"
                    aria-labelledby="prism-codebase-heading"
                >
                    <div className="border-b border-emerald-900/20 pb-3">
                        <h2 id="prism-codebase-heading" className="text-lg font-semibold text-emerald-100 flex items-center gap-2">
                            <FileCode size={18} className="text-emerald-400" />
                            语言与工具 (Codebase)
                        </h2>
                        <p className="text-xs text-emerald-200/50 mt-1">
                            多层级代码片段与速查手册维护；支持树形拓扑结构还原、独立 Markdown 手册与全库 ZIP 导入导出。
                        </p>
                    </div>
                    <CodebaseTab />
                </section>
            )}
        </div>
    );
}
