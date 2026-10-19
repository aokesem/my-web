"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";
import { Loader2, Plus, Pencil, Trash2, FileCode2, Download, Upload, Archive } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    exportAllLanguagesToZip,
    exportLanguageToZip,
    importLanguageFromZip,
    type LanguageExportRecord
} from "@/lib/prismIO";
import JSZip from "jszip";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface LanguageItem {
    id: string;
    name: string;
    icon?: string;
    color?: string;
    sort_order: number;
    created_at: string;
    node_count?: number;
}

const COLOR_OPTIONS = [
    { value: "emerald", label: "Emerald", dot: "bg-emerald-400" },
    { value: "teal", label: "Teal", dot: "bg-teal-400" },
    { value: "cyan", label: "Cyan", dot: "bg-cyan-400" },
    { value: "blue", label: "Blue", dot: "bg-blue-400" },
    { value: "violet", label: "Violet", dot: "bg-violet-400" },
    { value: "amber", label: "Amber", dot: "bg-amber-400" },
    { value: "rose", label: "Rose", dot: "bg-rose-400" },
];

const EMPTY_FORM = {
    name: "",
    icon: "Code",
    color: "emerald",
    sort_order: 0,
};

export default function CodebaseTab() {
    const [languages, setLanguages] = useState<LanguageItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [importing, setImporting] = useState(false);

    // Dialog state
    const [isOpen, setIsOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<LanguageItem | null>(null);
    const [form, setForm] = useState(EMPTY_FORM);
    const [saving, setSaving] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            const { data: langs, error: lError } = await supabase
                .from("prism_codebase_languages")
                .select("*")
                .order("sort_order");

            if (lError) throw lError;

            // 获取各语言的节点计数
            const { data: nodes, error: nError } = await supabase
                .from("prism_codebase_nodes")
                .select("language_id");

            if (nError) throw nError;

            const countMap = new Map<string, number>();
            (nodes || []).forEach(n => {
                countMap.set(n.language_id, (countMap.get(n.language_id) || 0) + 1);
            });

            const enriched = (langs || []).map(l => ({
                ...l,
                node_count: countMap.get(l.id) || 0,
            }));

            setLanguages(enriched);
        } catch (err: any) {
            toast.error("加载语言列表失败: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const pickZipFile = (onFile: (file: File) => Promise<void>) => {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = ".zip";
        input.onchange = async (e: any) => {
            const file = e.target.files?.[0];
            if (file) await onFile(file);
        };
        input.click();
    };

    // --- 导出逻辑 ---
    const handleExport = async (lang: LanguageItem) => {
        try {
            toast.info(`正在准备导出「${lang.name}」手册...`);
            await exportLanguageToZip(lang);
            toast.success("导出成功");
        } catch (e: any) {
            toast.error("导出失败: " + e.message);
        }
    };

    const handleExportAll = async () => {
        if (languages.length === 0) return toast.warning("没有可导出的语言记录");
        try {
            toast.info(`正在准备导出 ${languages.length} 门语言知识库...`);
            await exportAllLanguagesToZip(languages);
            toast.success("全部语言工具库导出成功");
        } catch (e: any) {
            toast.error("导出失败: " + e.message);
        }
    };

    // --- 导入逻辑 ---
    const handleImportSingleLanguage = async () => {
        pickZipFile(async (file) => {
            setImporting(true);
            try {
                const zip = await JSZip.loadAsync(file);
                const result = await importLanguageFromZip(zip, "");
                toast.success(`语言「${result.languageName}」已导入，包含 ${result.nodeCount} 个知识节点`);
                fetchData();
            } catch (err: any) {
                toast.error("导入失败: " + err.message);
            } finally {
                setImporting(false);
            }
        });
    };

    const handleImportAllLanguages = async () => {
        pickZipFile(async (file) => {
            setImporting(true);
            try {
                const zip = await JSZip.loadAsync(file);
                const manifestFile = zip.file("manifest.json");
                if (!manifestFile) throw new Error("无效的总备份包：根目录缺少 manifest.json");

                const manifest = JSON.parse(await manifestFile.async("string"));
                if (manifest.type !== "prism_codebase_backup") {
                    throw new Error("此压缩包不是语言工具全库备份格式");
                }

                const languagesFolder = zip.folder("languages");
                if (!languagesFolder) throw new Error("缺少 languages/ 目录");

                const langPrefixes = new Set<string>();
                Object.keys(zip.files).forEach(path => {
                    if (path.startsWith("languages/")) {
                        const parts = path.split("/");
                        if (parts.length >= 2 && parts[1]) {
                            langPrefixes.add(`languages/${parts[1]}/`);
                        }
                    }
                });

                if (langPrefixes.size === 0) throw new Error("未找到可导入的语言文件夹");

                toast.info(`检测到 ${langPrefixes.size} 门语言，正在逐一恢复...`);
                let successCount = 0;

                for (const prefix of Array.from(langPrefixes).sort()) {
                    try {
                        const res = await importLanguageFromZip(zip, prefix);
                        successCount++;
                    } catch (e: any) {
                        console.error(`导入子语言 [${prefix}] 失败:`, e);
                    }
                }

                toast.success(`全库恢复完成：成功导入 ${successCount} 门语言`);
                fetchData();
            } catch (err: any) {
                toast.error("全库导入失败: " + err.message);
            } finally {
                setImporting(false);
            }
        });
    };

    // --- CRUD 逻辑 ---
    const handleOpenCreate = () => {
        setEditingItem(null);
        setForm({ ...EMPTY_FORM, sort_order: languages.length + 1 });
        setIsOpen(true);
    };

    const handleOpenEdit = (lang: LanguageItem) => {
        setEditingItem(lang);
        setForm({
            name: lang.name,
            icon: lang.icon || "Code",
            color: lang.color || "emerald",
            sort_order: lang.sort_order,
        });
        setIsOpen(true);
    };

    const handleSave = async () => {
        if (!form.name.trim()) return toast.error("语言名称不能为空");

        setSaving(true);
        try {
            if (editingItem) {
                const { error } = await supabase
                    .from("prism_codebase_languages")
                    .update({
                        name: form.name.trim(),
                        icon: form.icon.trim() || "Code",
                        color: form.color,
                        sort_order: Number(form.sort_order),
                    })
                    .eq("id", editingItem.id);

                if (error) throw error;
                toast.success("更新成功");
            } else {
                const { error } = await supabase
                    .from("prism_codebase_languages")
                    .insert([{
                        name: form.name.trim(),
                        icon: form.icon.trim() || "Code",
                        color: form.color,
                        sort_order: Number(form.sort_order),
                    }]);

                if (error) throw error;
                toast.success("创建成功");
            }

            setIsOpen(false);
            fetchData();
        } catch (err: any) {
            toast.error("保存失败: " + err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`确定要彻底删除语言「${name}」吗？\n警告：该语言下的所有树状知识节点与笔记也会被同步删除！`)) {
            return;
        }

        try {
            await supabase.from("prism_codebase_nodes").delete().eq("language_id", id);
            const { error } = await supabase.from("prism_codebase_languages").delete().eq("id", id);
            if (error) throw error;
            toast.success(`已删除「${name}」`);
            fetchData();
        } catch (err: any) {
            toast.error("删除失败: " + err.message);
        }
    };

    return (
        <div className="space-y-6">
            {/* 顶栏操作区 */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 rounded-xl border border-zinc-800 bg-zinc-900/60">
                <div>
                    <h3 className="text-base font-semibold text-zinc-100 flex items-center gap-2">
                        <FileCode2 size={18} className="text-emerald-400" />
                        语言与工具手册库 ({languages.length})
                    </h3>
                    <p className="text-xs text-zinc-400 mt-1">
                        管理深层级代码片段与速查手册；支持树状节点、代码块与 Markdown 双向导出还原。
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <Button
                        size="sm"
                        variant="outline"
                        className="h-8 gap-1.5 text-xs border-emerald-500/30 bg-emerald-950/20 text-emerald-300 hover:bg-emerald-900/40"
                        onClick={handleExportAll}
                        disabled={loading || importing || languages.length === 0}
                    >
                        <Archive size={13} />
                        导出全库备份 (.zip)
                    </Button>

                    <Button
                        size="sm"
                        variant="outline"
                        className="h-8 gap-1.5 text-xs border-zinc-700 bg-zinc-800/80 text-zinc-200 hover:bg-zinc-700"
                        onClick={handleImportSingleLanguage}
                        disabled={loading || importing}
                    >
                        {importing ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
                        导入单门语言 (.zip)
                    </Button>

                    <Button
                        size="sm"
                        variant="outline"
                        className="h-8 gap-1.5 text-xs border-zinc-700 bg-zinc-800/80 text-zinc-200 hover:bg-zinc-700"
                        onClick={handleImportAllLanguages}
                        disabled={loading || importing}
                    >
                        <Archive size={13} />
                        恢复全库备份 (.zip)
                    </Button>

                    <Button
                        size="sm"
                        className="h-8 gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm"
                        onClick={handleOpenCreate}
                        disabled={loading || importing}
                    >
                        <Plus size={14} />
                        新建语言
                    </Button>
                </div>
            </div>

            {/* 语言列表网格 */}
            {loading ? (
                <div className="flex items-center justify-center p-12 text-zinc-500">
                    <Loader2 className="animate-spin mr-2" size={18} />
                    正在加载语言工具数据...
                </div>
            ) : languages.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-zinc-800 rounded-xl bg-zinc-950/30">
                    <FileCode2 size={36} className="mx-auto text-zinc-600 mb-2" />
                    <p className="text-zinc-400 text-sm">暂无语言配置</p>
                    <p className="text-zinc-600 text-xs mt-1">点击右上角「新建语言」或「导入单门语言」开始使用</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {languages.map((lang) => {
                        const colorOption = COLOR_OPTIONS.find(c => c.value === lang.color) || COLOR_OPTIONS[0];

                        return (
                            <div
                                key={lang.id}
                                className="group p-4 rounded-xl border border-zinc-800/80 bg-zinc-900/40 hover:bg-zinc-900/80 hover:border-zinc-700 transition-all flex flex-col justify-between"
                            >
                                <div className="space-y-2">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-2.5">
                                            <span className={`w-2.5 h-2.5 rounded-full ${colorOption.dot} shadow-xs`} />
                                            <h4 className="font-semibold text-zinc-100 text-base group-hover:text-white transition-colors">
                                                {lang.name}
                                            </h4>
                                        </div>
                                        <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-zinc-800/80 text-zinc-400 border border-zinc-700/50">
                                            #{lang.sort_order}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-4 text-xs text-zinc-400 pt-1">
                                        <span>知识节点: <strong className="text-zinc-200">{lang.node_count ?? 0}</strong> 个</span>
                                        <span>图标: <code className="text-zinc-300 font-mono text-[11px]">{lang.icon || 'Code'}</code></span>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between pt-4 mt-4 border-t border-zinc-800/60">
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-7 text-xs text-zinc-400 hover:text-emerald-400 hover:bg-emerald-950/20 px-2 gap-1.5"
                                        onClick={() => handleExport(lang)}
                                        disabled={importing}
                                        title="导出本语言备份包 (.zip)"
                                    >
                                        <Download size={13} />
                                        导出 ZIP
                                    </Button>

                                    <div className="flex items-center gap-1">
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-7 w-7 p-0 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
                                            onClick={() => handleOpenEdit(lang)}
                                            disabled={importing}
                                            title="编辑语言信息"
                                        >
                                            <Pencil size={13} />
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-7 w-7 p-0 text-zinc-500 hover:text-rose-400 hover:bg-rose-950/20"
                                            onClick={() => handleDelete(lang.id, lang.name)}
                                            disabled={importing}
                                            title="删除语言"
                                        >
                                            <Trash2 size={13} />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* 新建/编辑语言弹窗 */}
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="sm:max-w-md bg-zinc-900 border-zinc-800 text-zinc-100">
                    <DialogHeader>
                        <DialogTitle className="text-white">
                            {editingItem ? "编辑语言配置" : "新建语言分类"}
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4 py-2">
                        <div className="space-y-1.5">
                            <Label htmlFor="lang-name" className="text-xs text-zinc-300">
                                语言/工具名称 <span className="text-rose-400">*</span>
                            </Label>
                            <Input
                                id="lang-name"
                                placeholder="例如: Python, Rust, Docker..."
                                value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                                className="bg-zinc-800/80 border-zinc-700 text-zinc-100 placeholder:text-zinc-500"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label htmlFor="lang-icon" className="text-xs text-zinc-300">
                                    图标标识 (Lucide Icon)
                                </Label>
                                <Input
                                    id="lang-icon"
                                    placeholder="Code, Terminal..."
                                    value={form.icon}
                                    onChange={(e) => setForm({ ...form, icon: e.target.value })}
                                    className="bg-zinc-800/80 border-zinc-700 text-zinc-100 font-mono text-xs"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="lang-sort" className="text-xs text-zinc-300">
                                    排序序号
                                </Label>
                                <Input
                                    id="lang-sort"
                                    type="number"
                                    value={form.sort_order}
                                    onChange={(e) => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })}
                                    className="bg-zinc-800/80 border-zinc-700 text-zinc-100"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-xs text-zinc-300">主题色标</Label>
                            <div className="flex flex-wrap gap-2 pt-1">
                                {COLOR_OPTIONS.map((c) => (
                                    <button
                                        key={c.value}
                                        type="button"
                                        onClick={() => setForm({ ...form, color: c.value })}
                                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs border transition-all ${
                                            form.color === c.value
                                                ? "border-white bg-zinc-800 text-white shadow-xs"
                                                : "border-zinc-700 bg-zinc-800/50 text-zinc-400 hover:text-zinc-200"
                                        }`}
                                    >
                                        <span className={`w-2 h-2 rounded-full ${c.dot}`} />
                                        {c.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                            onClick={() => setIsOpen(false)}
                            disabled={saving}
                        >
                            取消
                        </Button>
                        <Button
                            className="bg-emerald-600 hover:bg-emerald-500 text-white"
                            onClick={handleSave}
                            disabled={saving}
                        >
                            {saving ? <Loader2 size={14} className="animate-spin mr-1.5" /> : null}
                            保存
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
