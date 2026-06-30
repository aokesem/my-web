"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";
import { Loader2, Plus, Pencil, Trash2, BookText, Download, Upload, Archive } from "lucide-react";
import { Button } from "@/components/ui/button";
import { exportAllCoursesToZip, exportCourseToZip, importChapterFromJson } from "@/lib/prismIO";
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
import { Textarea } from "@/components/ui/textarea";

// ============================================================
// TYPES
// ============================================================

interface CourseItem {
    id: string;
    name: string;
    name_en?: string;
    icon?: string;
    color?: string;
    description?: string;
    sort_order: number;
    created_at: string;
}

const COLOR_OPTIONS = [
    { value: "violet", label: "Violet", dot: "bg-violet-400" },
    { value: "cyan", label: "Cyan", dot: "bg-cyan-400" },
    { value: "rose", label: "Rose", dot: "bg-rose-400" },
    { value: "amber", label: "Amber", dot: "bg-amber-400" },
    { value: "emerald", label: "Emerald", dot: "bg-emerald-400" },
    { value: "indigo", label: "Indigo", dot: "bg-indigo-400" },
    { value: "stone", label: "Stone", dot: "bg-stone-400" },
];

const EMPTY_FORM = {
    name: "",
    name_en: "",
    icon: "",
    color: "violet",
    description: "",
    sort_order: 0,
};

// ============================================================
// COMPONENT
// ============================================================

export default function CoursesTab() {
    const [courses, setCourses] = useState<CourseItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [importing, setImporting] = useState(false);

    // Dialog state
    const [isOpen, setIsOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<CourseItem | null>(null);
    const [form, setForm] = useState(EMPTY_FORM);
    const [saving, setSaving] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from("prism_courses")
            .select("*")
            .order("sort_order");

        if (error) toast.error("加载课程列表失败");
        else setCourses(data || []);
        setLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, []);


    const createImportedCourse = async (manifest: any, sortOrder: number) => {
        const dateKey = new Date().toISOString().slice(0, 10);
        const { data: newCourse, error } = await supabase
            .from("prism_courses")
            .insert([{
                name: `${manifest.name || "Imported Course"}_Imported_${dateKey}`,
                name_en: manifest.name_en || null,
                description: manifest.description || null,
                icon: manifest.icon || null,
                color: manifest.color || "violet",
                sort_order: sortOrder
            }])
            .select()
            .single();

        if (error) throw error;
        return newCourse;
    };

    const importCourseFromZip = async (zip: JSZip, basePath: string, sortOrder: number) => {
        const manifestFile = zip.file(`${basePath}manifest.json`);
        if (!manifestFile) throw new Error("无效的课程备份包：缺少 manifest.json");

        const manifest = JSON.parse(await manifestFile.async("string"));
        const newCourse = await createImportedCourse(manifest, sortOrder);
        const chapterPrefix = `${basePath}chapters/`;
        const chapterFiles = Object.keys(zip.files)
            .filter(name => name.startsWith(chapterPrefix) && name.endsWith(".json"))
            .sort();

        for (const fileName of chapterFiles) {
            const content = await zip.file(fileName)?.async("string");
            if (!content) continue;
            await importChapterFromJson(newCourse.id, JSON.parse(content));
        }

        return { courseName: manifest.name || newCourse.name, chapterCount: chapterFiles.length };
    };

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

    const handleExport = async (course: CourseItem) => {
        try {
            toast.info(`正在准备导出课程「${course.name}」...`);
            await exportCourseToZip(course);
            toast.success("导出成功");
        } catch (e: any) {
            toast.error("导出失败: " + e.message);
        }
    };

    const handleExportAll = async () => {
        if (courses.length === 0) return toast.warning("没有可导出的课程");
        try {
            toast.info(`正在准备导出 ${courses.length} 门课程...`);
            await exportAllCoursesToZip(courses);
            toast.success("全部课程导出成功");
        } catch (e: any) {
            toast.error("导出失败: " + e.message);
        }
    };

    const handleImportSingleCourse = async () => {
        pickZipFile(async (file) => {
            setImporting(true);
            try {
                const zip = await JSZip.loadAsync(file);
                const result = await importCourseFromZip(zip, "", courses.length);
                toast.success(`课程「${result.courseName}」已导入，包含 ${result.chapterCount} 个章节`);
                fetchData();
            } catch (err: any) {
                toast.error("单课导入失败: " + err.message);
            } finally {
                setImporting(false);
            }
        });
    };

    const handleImportAllCourses = async () => {
        pickZipFile(async (file) => {
            setImporting(true);
            try {
                const zip = await JSZip.loadAsync(file);
                const manifestFile = zip.file("manifest.json");
                if (!manifestFile) throw new Error("无效的全体课程备份包：缺少 manifest.json");

                const manifest = JSON.parse(await manifestFile.async("string"));
                if (manifest.type !== "prism_courses_backup") {
                    throw new Error("这不是全体课程备份包；如需导入单课，请使用“导入单课”");
                }

                const courseManifestPaths = Object.keys(zip.files)
                    .filter(name => /^courses\/[^/]+\/manifest\.json$/.test(name))
                    .sort();

                if (courseManifestPaths.length === 0) throw new Error("备份包中没有课程数据");

                let importedCount = 0;
                let chapterCount = 0;
                for (const manifestPath of courseManifestPaths) {
                    const basePath = manifestPath.replace(/manifest\.json$/, "");
                    const result = await importCourseFromZip(zip, basePath, courses.length + importedCount);
                    importedCount += 1;
                    chapterCount += result.chapterCount;
                }

                toast.success(`已导入 ${importedCount} 门课程，共 ${chapterCount} 个章节`);
                fetchData();
            } catch (err: any) {
                toast.error("全体导入失败: " + err.message);
            } finally {
                setImporting(false);
            }
        });
    };

    const handleOpen = (item?: CourseItem) => {
        if (item) {
            setEditingItem(item);
            setForm({
                name: item.name,
                name_en: item.name_en || "",
                icon: item.icon || "",
                color: item.color || "violet",
                description: item.description || "",
                sort_order: item.sort_order,
            });
        } else {
            setEditingItem(null);
            setForm({ ...EMPTY_FORM, sort_order: courses.length });
        }
        setIsOpen(true);
    };

    const handleSave = async () => {
        if (!form.name.trim()) return toast.error("课程名称不能为空");
        setSaving(true);

        const payload = {
            name: form.name.trim(),
            name_en: form.name_en.trim() || null,
            icon: form.icon.trim() || null,
            color: form.color,
            description: form.description.trim() || null,
            sort_order: form.sort_order,
        };

        const promise = editingItem
            ? supabase.from("prism_courses").update(payload).eq("id", editingItem.id)
            : supabase.from("prism_courses").insert([payload]);

        const { error } = await promise;
        setSaving(false);

        if (error) {
            toast.error(error.message);
        } else {
            toast.success(editingItem ? "课程已更新" : "课程已创建");
            setIsOpen(false);
            fetchData();
        }
    };

    const handleDelete = async (id: string, name: string) => {
        if (!window.confirm(`确认删除课程「${name}」吗？\n⚠️ 这将同时删除该课程下的所有章节和公式！`)) return;
        const { error } = await supabase.from("prism_courses").delete().eq("id", id);

        if (error) toast.error(error.message);
        else {
            toast.success("删除成功");
            fetchData();
        }
    };

    if (loading) return <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-zinc-500" /></div>;

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex justify-between items-center">
                <p className="text-sm text-zinc-400">
                    共 {courses.length} 门课程。课程内的章节与公式在前台页面中管理。
                </p>
                <div className="flex flex-wrap justify-end gap-2">
                    <Button
                        size="sm"
                        variant="outline"
                        className="gap-1.5 border-zinc-700 bg-zinc-900 text-zinc-300 hover:bg-zinc-800 hover:text-white"
                        onClick={handleExportAll}
                        disabled={importing || courses.length === 0}
                    >
                        <Archive size={14} />
                        导出全部
                    </Button>
                    <Button
                        size="sm"
                        variant="outline"
                        className="gap-1.5 border-zinc-700 bg-zinc-900 text-zinc-300 hover:bg-zinc-800 hover:text-white"
                        onClick={handleImportSingleCourse}
                        disabled={importing}
                    >
                        <Upload size={14} />
                        导入单课
                    </Button>
                    <Button
                        size="sm"
                        variant="outline"
                        className="gap-1.5 border-zinc-700 bg-zinc-900 text-zinc-300 hover:bg-zinc-800 hover:text-white"
                        onClick={handleImportAllCourses}
                        disabled={importing}
                    >
                        {importing ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                        导入全部
                    </Button>
                    <Button
                        size="sm"
                        className="gap-1.5 bg-orange-600 hover:bg-orange-700 text-white"
                        onClick={() => handleOpen()}
                        disabled={importing}
                    >
                        <Plus size={14} />
                        新建课程
                    </Button>
                </div>
            </div>

            {/* Course List */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                {courses.length === 0 ? (
                    <div className="p-12 text-center text-sm text-zinc-500 flex flex-col items-center gap-3">
                        <BookText size={32} className="opacity-20" />
                        <p>还没有课程，点击右上角创建第一门课程</p>
                    </div>
                ) : (
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-zinc-800 bg-zinc-950/50 text-left">
                                <th className="px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider w-12">序</th>
                                <th className="px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">课程名称</th>
                                <th className="px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">英文缩写</th>
                                <th className="px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">描述</th>
                                <th className="px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider w-20">颜色</th>
                                <th className="px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider w-28 text-right">操作</th>
                            </tr>
                        </thead>
                        <tbody>
                            {courses.map((course) => {
                                const colorOpt = COLOR_OPTIONS.find(c => c.value === course.color);
                                return (
                                    <tr key={course.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors group">
                                        <td className="px-4 py-3 text-xs text-zinc-500 font-mono">{course.sort_order}</td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2.5">
                                                {course.icon ? (
                                                    <span className="text-base">{course.icon}</span>
                                                ) : (
                                                    <BookText size={16} className="text-zinc-500" />
                                                )}
                                                <span className="text-sm font-medium text-zinc-200">{course.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-xs font-mono text-zinc-500">{course.name_en || "-"}</td>
                                        <td className="px-4 py-3 text-xs text-zinc-400 max-w-[200px] truncate">{course.description || "-"}</td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <span className={`w-2.5 h-2.5 rounded-full ${colorOpt?.dot || 'bg-zinc-400'}`} />
                                                <span className="text-xs text-zinc-500">{course.color}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button size="icon" variant="ghost" className="h-7 w-7 text-zinc-400 hover:text-emerald-300" title="导出课程" onClick={() => handleExport(course)} disabled={importing}>
                                                    <Download size={12} />
                                                </Button>
                                                <Button size="icon" variant="ghost" className="h-7 w-7 text-zinc-400 hover:text-white" title="编辑课程" onClick={() => handleOpen(course)} disabled={importing}>
                                                    <Pencil size={12} />
                                                </Button>
                                                <Button size="icon" variant="ghost" className="h-7 w-7 text-zinc-400 hover:text-red-400" title="删除课程" onClick={() => handleDelete(course.id, course.name)} disabled={importing}>
                                                    <Trash2 size={12} />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Dialog */}
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-lg">
                    <DialogHeader>
                        <DialogTitle>{editingItem ? "编辑课程" : "新建课程"}</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        {/* Name */}
                        <div className="grid gap-2">
                            <Label>课程名称 <span className="text-red-400">*</span></Label>
                            <Input
                                value={form.name}
                                onChange={e => setForm({ ...form, name: e.target.value })}
                                className="bg-zinc-950 border-zinc-800"
                                placeholder="如：高等数学"
                            />
                        </div>
                        {/* Name EN */}
                        <div className="grid gap-2">
                            <Label>英文缩写</Label>
                            <Input
                                value={form.name_en}
                                onChange={e => setForm({ ...form, name_en: e.target.value })}
                                className="bg-zinc-950 border-zinc-800"
                                placeholder="如：Advanced Math（可选）"
                            />
                        </div>
                        {/* Icon + Color row */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label>图标（Emoji）</Label>
                                <Input
                                    value={form.icon}
                                    onChange={e => setForm({ ...form, icon: e.target.value })}
                                    className="bg-zinc-950 border-zinc-800"
                                    placeholder="如：📐（可选）"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label>主题色</Label>
                                <select
                                    value={form.color}
                                    onChange={e => setForm({ ...form, color: e.target.value })}
                                    className="w-full bg-zinc-950 border border-zinc-800 rounded-md px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:ring-1 focus:ring-zinc-600"
                                >
                                    {COLOR_OPTIONS.map(opt => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        {/* Description */}
                        <div className="grid gap-2">
                            <Label>简短描述</Label>
                            <Textarea
                                value={form.description}
                                onChange={e => setForm({ ...form, description: e.target.value })}
                                className="bg-zinc-950 border-zinc-800 min-h-[60px] resize-none"
                                placeholder="对课程内容的简要说明（可选）"
                            />
                        </div>
                        {/* Sort order */}
                        <div className="grid gap-2 w-32">
                            <Label>排序权重</Label>
                            <Input
                                type="number"
                                value={form.sort_order}
                                onChange={e => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })}
                                className="bg-zinc-950 border-zinc-800"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsOpen(false)} className="border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-zinc-300">取消</Button>
                        <Button onClick={handleSave} disabled={saving} className="bg-orange-600 hover:bg-orange-700 text-white gap-1.5">
                            {saving && <Loader2 size={14} className="animate-spin" />}
                            确认
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
