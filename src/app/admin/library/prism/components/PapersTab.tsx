"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";
import { Loader2, Plus, Pencil, Trash2, Save, X, FileText, Image as ImageIcon, Download, Upload, FileJson } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ImageUpload } from "@/components/ui/image-upload";
import { exportPapersToZip, importPaperFromJson } from "@/lib/prismIO";
import JSZip from "jszip";

// ==========================================
// Papers Tab
// ==========================================

export default function PapersTab() {
    const [papers, setPapers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [importing, setImporting] = useState(false);

    // Dictionary Data for multi-select
    const [projectsDict, setProjectsDict] = useState<any[]>([]);
    const [directionsDict, setDirectionsDict] = useState<any[]>([]);
    const [typesDict, setTypesDict] = useState<any[]>([]);

    // State
    const [selectedPaperStr, setSelectedPaperStr] = useState<string | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    
    // Form States
    const [form, setForm] = useState<any>({});
    const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
    const [selectedDirections, setSelectedDirections] = useState<string[]>([]);
    const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
    const [figures, setFigures] = useState<any[]>([]);

    const fetchData = async () => {
        setLoading(true);
        const [
            { data: pData },
            { data: pdData },
            { data: dData },
            { data: tData }
        ] = await Promise.all([
            supabase.from("prism_papers").select("id, title, year, nickname").order("created_at", { ascending: false }),
            supabase.from("prism_projects").select("id, name").order("sort_order"),
            supabase.from("prism_directions").select("id, name").order("sort_order"),
            supabase.from("prism_types").select("id, name").order("sort_order"),
        ]);
        
        setPapers(pData || []);
        setProjectsDict(pdData || []);
        setDirectionsDict(dData || []);
        setTypesDict(tData || []);
        setLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, []);

    // --- IO Actions ---

    const handleExportAll = async () => {
        if (papers.length === 0) return;
        if (!window.confirm(`确定要导出全部 ${papers.length} 篇论文的完整备份吗？\n这可能需要一点时间来聚合数据。`)) return;

        setImporting(true);
        try {
            toast.info("正在聚合全量论文数据...");
            const { data: fullPapers } = await supabase.from("prism_papers").select("*");
            if (fullPapers) {
                await exportPapersToZip(fullPapers);
                toast.success("全量论文导出成功");
            }
        } catch (e: any) {
            toast.error("导出失败: " + e.message);
        } finally {
            setImporting(false);
        }
    };

    const handleExportSingle = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setImporting(true);
        try {
            const { data: pData } = await supabase.from("prism_papers").select("*").eq("id", id).single();
            if (pData) {
                await exportPapersToZip([pData]);
                toast.success("单篇论文导出成功");
            }
        } catch (e: any) {
            toast.error("导出失败: " + e.message);
        } finally {
            setImporting(false);
        }
    };

    const handleImportSingleJson = async () => {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = ".json";
        input.onchange = async (e: any) => {
            const file = e.target.files?.[0];
            if (!file) return;

            setImporting(true);
            try {
                const reader = new FileReader();
                reader.onload = async (event) => {
                    try {
                        const json = JSON.parse(event.target?.result as string);
                        const finalTitle = await importPaperFromJson(json);
                        toast.success(`论文「${finalTitle}」已作为新记录导入`);
                        fetchData();
                    } catch (err: any) {
                        toast.error("解析或导入失败: " + err.message);
                    } finally {
                        setImporting(false);
                    }
                };
                reader.readAsText(file);
            } catch (e: any) {
                toast.error("读取文件失败");
                setImporting(false);
            }
        };
        input.click();
    };

    const handleImportZip = async () => {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = ".zip";
        input.onchange = async (e: any) => {
            const file = e.target.files?.[0];
            if (!file) return;

            setImporting(true);
            try {
                const zip = await JSZip.loadAsync(file);
                const paperFolders: string[] = [];
                
                zip.folder("papers")?.forEach((relativePath) => {
                    if (relativePath.endsWith("paper.json")) {
                        paperFolders.push(relativePath);
                    }
                });

                if (paperFolders.length === 0) throw new Error("ZIP 包中未找到有效的论文数据");

                toast.info(`正在导入 ${paperFolders.length} 篇论文...`);
                let successCount = 0;

                for (const path of paperFolders) {
                    const content = await zip.file(`papers/${path}`)?.async("string");
                    if (content) {
                        const paperData = JSON.parse(content);
                        await importPaperFromJson(paperData);
                        successCount++;
                    }
                }

                toast.success(`成功导入 ${successCount} 篇论文，关联的项目/方向已同步`);
                fetchData();
            } catch (err: any) {
                toast.error("导入失败: " + err.message);
            } finally {
                setImporting(false);
            }
        };
        input.click();
    };

    // --- Actions ---

    const handleCreate = () => {
        const d = new Date();
        const localNow = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
        setForm({
            title: "", nickname: "", authors: "", year: new Date().getFullYear(),
            url: "", summary: "", notes: "", rating: 0,
            read_depth: "粗读", key_contributions: [],
            created_at: localNow
        });
        setSelectedProjects([]);
        setSelectedDirections([]);
        setSelectedTypes([]);
        setFigures([]);
        setIsEditing(true);
        setSelectedPaperStr("new");
    };

    const handleSelect = async (id: string) => {
        setSelectedPaperStr(id);
        setIsEditing(false);
        // fetch full details
        setLoading(true);
        const [
            { data: pData },
            { data: relProj },
            { data: relDir },
            { data: relType },
            { data: figs }
        ] = await Promise.all([
            supabase.from("prism_papers").select("*").eq("id", id).single(),
            supabase.from("prism_paper_projects").select("project_id").eq("paper_id", id),
            supabase.from("prism_paper_directions").select("direction_id").eq("paper_id", id),
            supabase.from("prism_paper_types").select("type_id").eq("paper_id", id),
            supabase.from("prism_paper_figures").select("*").eq("paper_id", id).order("sort_order")
        ]);

        if (pData) {
            if (pData.created_at) {
                const d = new Date(pData.created_at);
                pData.created_at = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
            }
            setForm(pData);
        }
        if (relProj) setSelectedProjects(relProj.map((r: any) => r.project_id));
        if (relDir) setSelectedDirections(relDir.map((r: any) => r.direction_id));
        if (relType) setSelectedTypes(relType.map((r: any) => r.type_id));
        if (figs) setFigures(figs);
        
        setLoading(false);
        setIsEditing(true);
    };

    const handleSave = async () => {
        if (!form.title.trim()) return toast.error("论文标题不能为空");

        const isNew = selectedPaperStr === "new";
        let targetId = selectedPaperStr;

        try {
            // 1. Save main paper
            const payload = { ...form };
            delete payload.id; // ensure ID is not updated
            if (payload.created_at) {
                payload.created_at = new Date(payload.created_at).toISOString();
            } else {
                delete payload.created_at;
            }

            if (isNew) {
                const { data, error } = await supabase.from("prism_papers").insert([payload]).select().single();
                if (error) throw error;
                targetId = data.id;
            } else {
                const { error } = await supabase.from("prism_papers").update(payload).eq("id", targetId);
                if (error) throw error;
            }

            // 2. Sync relationships
            const pid = targetId as string;
            
            // Delete old relations
            if (!isNew) {
                await Promise.all([
                    supabase.from("prism_paper_projects").delete().eq("paper_id", pid),
                    supabase.from("prism_paper_directions").delete().eq("paper_id", pid),
                    supabase.from("prism_paper_types").delete().eq("paper_id", pid),
                    supabase.from("prism_paper_figures").delete().eq("paper_id", pid) // simpler to delete and re-insert figures
                ]);
            }

            // Insert new relations
            const projInserts = selectedProjects.map(id => ({ paper_id: pid, project_id: id }));
            const dirInserts = selectedDirections.map(id => ({ paper_id: pid, direction_id: id }));
            const typeInserts = selectedTypes.map(id => ({ paper_id: pid, type_id: id }));
            const figInserts = figures.map((f, i) => ({ paper_id: pid, url: f.url, description: f.description, sort_order: i }));

            if (projInserts.length) await supabase.from("prism_paper_projects").insert(projInserts);
            if (dirInserts.length) await supabase.from("prism_paper_directions").insert(dirInserts);
            if (typeInserts.length) await supabase.from("prism_paper_types").insert(typeInserts);
            if (figInserts.length) await supabase.from("prism_paper_figures").insert(figInserts);

            toast.success("保存成功");
            fetchData();
            setIsEditing(false);
            setSelectedPaperStr(null);
        } catch (e: any) {
            toast.error("保存失败: " + e.message);
        }
    };

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!window.confirm("确定彻底删除该论文的所有记录吗？")) return;
        const { error } = await supabase.from("prism_papers").delete().eq("id", id);
        if (error) toast.error(error.message);
        else {
            toast.success("论文删除成功");
            fetchData();
            if (selectedPaperStr === id) {
                setSelectedPaperStr(null);
                setIsEditing(false);
            }
        }
    };

    // --- Handlers for Complex Fields ---
    const toggleArrayItem = (setter: React.Dispatch<React.SetStateAction<string[]>>, item: string) => {
        setter(prev => prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]);
    };

    const updateContribution = (index: number, val: string) => {
        const newArr = [...(form.key_contributions || [])];
        newArr[index] = val;
        setForm({ ...form, key_contributions: newArr });
    };

    const addContribution = () => {
        setForm({ ...form, key_contributions: [...(form.key_contributions || []), ""] });
    };

    const removeContribution = (index: number) => {
        const newArr = [...(form.key_contributions || [])];
        newArr.splice(index, 1);
        setForm({ ...form, key_contributions: newArr });
    };

    const addFigure = () => setFigures([...figures, { url: "", description: "" }]);
    const updateFigure = (index: number, key: string, val: string) => {
        const newFigs = [...figures];
        newFigs[index][key] = val;
        setFigures(newFigs);
    };
    const removeFigure = (index: number) => {
        const newFigs = [...figures];
        newFigs.splice(index, 1);
        setFigures(newFigs);
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-200px)]">
            {/* 左侧：列表 */}
            <div className="lg:col-span-1 bg-zinc-900 border border-zinc-800 rounded-xl flex flex-col h-full overflow-hidden">
                <div className="p-4 border-b border-zinc-800 flex flex-col gap-3 bg-zinc-950/50">
                    <div className="flex justify-between items-center">
                        <h3 className="font-semibold text-white">所有论文 ({papers.length})</h3>
                        <Button size="sm" variant="outline" className="h-8 w-8 p-0 border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-white" onClick={handleCreate} disabled={importing}>
                            <Plus size={14} />
                        </Button>
                    </div>

                    {/* IO Controls Area */}
                    <div className="space-y-2 pt-1">
                        <Button
                            size="sm"
                            className="w-full gap-2 bg-blue-600/10 border border-blue-500/30 text-blue-400 hover:bg-blue-600/20 transition-all font-bold h-9"
                            onClick={handleExportAll}
                            disabled={importing || papers.length === 0}
                        >
                            <Download size={14} />
                            导出全库论文备份 (.zip)
                        </Button>
                        
                        <div className="grid grid-cols-2 gap-2">
                            <Button
                                size="sm"
                                variant="outline"
                                className="h-8 text-[10px] font-mono border-zinc-800 bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-emerald-400"
                                onClick={handleImportZip}
                                disabled={importing}
                            >
                                {importing ? <Loader2 size={10} className="animate-spin mr-1" /> : <Upload size={10} className="mr-1" />} 
                                导入 ZIP
                            </Button>
                            <Button
                                size="sm"
                                variant="outline"
                                className="h-8 text-[10px] font-mono border-zinc-800 bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-amber-400"
                                onClick={handleImportSingleJson}
                                disabled={importing}
                            >
                                <FileJson size={10} className="mr-1" /> 
                                导入单篇
                            </Button>
                        </div>
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                    {loading && !isEditing ? (
                        <div className="flex justify-center p-4"><Loader2 className="animate-spin text-zinc-500" /></div>
                    ) : papers.map(p => (
                        <div 
                            key={p.id} 
                            onClick={() => handleSelect(p.id)}
                            className={`group flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all border ${selectedPaperStr === p.id ? 'bg-zinc-800 border-zinc-700/60 text-white shadow' : 'border-transparent text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200'}`}
                        >
                            <div className="flex items-center gap-3 overflow-hidden">
                                <FileText size={16} className={selectedPaperStr === p.id ? "text-orange-500" : "text-zinc-600"} />
                                <div className="truncate text-sm flex-1">
                                    <span className="font-medium mr-2">{p.nickname || p.title}</span>
                                    <span className="text-xs text-zinc-500 opacity-60">[{p.year}]</span>
                                </div>
                            </div>
                            <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 text-zinc-500 hover:text-blue-400"
                                    title="导出单篇论文 ZIP"
                                    onClick={(e) => handleExportSingle(p.id, e)}
                                    disabled={importing}
                                >
                                    <Download size={11} />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-6 w-6 text-zinc-500 hover:text-red-400" onClick={(e) => handleDelete(p.id, e)}><Trash2 size={11} /></Button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* 右侧：编辑表单 */}
            <div className="lg:col-span-3 bg-zinc-900 border border-zinc-800 rounded-xl flex flex-col h-full overflow-hidden">
                {!isEditing ? (
                    <div className="flex flex-col items-center justify-center h-full text-zinc-500 gap-2">
                        <FileText size={48} className="opacity-20" />
                        <p>请在左侧选择或新建一篇论文</p>
                    </div>
                ) : loading ? (
                    <div className="flex justify-center items-center h-full"><Loader2 className="animate-spin text-zinc-500 w-8 h-8" /></div>
                ) : (
                    <>
                        <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-950/50 shrink-0">
                            <h3 className="font-semibold text-white">{selectedPaperStr === "new" ? "新增论文" : "编辑论文"}</h3>
                            <div className="flex gap-2">
                                <Button size="sm" variant="outline" onClick={() => setIsEditing(false)} className="border-zinc-700 text-zinc-300 bg-zinc-800 hover:bg-zinc-700 h-8">取消</Button>
                                <Button size="sm" onClick={handleSave} className="bg-orange-600 hover:bg-orange-700 text-white h-8"><Save size={14} className="mr-1" /> 保存配置</Button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar relative">
                            {/* --- Basics --- */}
                            <section className="space-y-4">
                                <h4 className="text-sm font-bold text-zinc-500 uppercase tracking-wider">基础信息</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="col-span-2 space-y-1">
                                        <Label className="text-zinc-400">标题 (Title) *</Label>
                                        <Input value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="bg-zinc-950 border-zinc-800 text-white font-medium" />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-zinc-400">简称 (Nickname)</Label>
                                        <Input value={form.nickname || ""} onChange={e => setForm({...form, nickname: e.target.value})} className="bg-zinc-950 border-zinc-800" />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-zinc-400">作者 (Authors)</Label>
                                        <Input value={form.authors || ""} onChange={e => setForm({...form, authors: e.target.value})} className="bg-zinc-950 border-zinc-800" />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-zinc-400">年份 (Year)</Label>
                                        <Input type="number" value={form.year || ""} onChange={e => setForm({...form, year: parseInt(e.target.value)||new Date().getFullYear()})} className="bg-zinc-950 border-zinc-800" />
                                    </div>
                                    <div className="space-y-1 flex items-end gap-2">
                                        <div className="flex-1 space-y-1">
                                            <Label className="text-zinc-400">评分 (Rating 0-10)</Label>
                                            <Input type="number" step="0.1" value={form.rating || ""} onChange={e => setForm({...form, rating: parseFloat(e.target.value)||0})} className="bg-zinc-950 border-zinc-800" />
                                        </div>
                                        <div className="flex-1 space-y-1">
                                            <Label className="text-zinc-400">阅读层级</Label>
                                            <select 
                                                value={form.read_depth} 
                                                onChange={e => setForm({...form, read_depth: e.target.value})}
                                                className="flex h-10 w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-700"
                                            >
                                                <option value="粗读">粗读</option>
                                                <option value="精读">精读</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-zinc-400">URL链接</Label>
                                        <Input value={form.url || ""} onChange={e => setForm({...form, url: e.target.value})} className="bg-zinc-950 border-zinc-800 font-mono text-sm" />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-zinc-400">录入时间 (Created At)</Label>
                                        <Input 
                                            type="datetime-local" 
                                            value={form.created_at || ""} 
                                            onChange={e => setForm({...form, created_at: e.target.value})} 
                                            className="bg-zinc-950 border-zinc-800 font-mono text-sm" 
                                        />
                                    </div>
                                </div>
                            </section>

                            {/* --- Dictionary Tags --- */}
                            <section className="space-y-4">
                                <h4 className="text-sm font-bold text-zinc-500 uppercase tracking-wider border-t border-zinc-800 pt-6">关联字典</h4>
                                
                                <div className="space-y-2">
                                    <Label className="text-zinc-400">所属项目 (Projects)</Label>
                                    <div className="flex flex-wrap gap-2">
                                        {projectsDict.map(p => (
                                            <button key={p.id} type="button" onClick={() => toggleArrayItem(setSelectedProjects, p.id)} 
                                                className={`px-3 py-1.5 rounded-full border text-xs font-medium transition-colors ${selectedProjects.includes(p.id) ? 'bg-orange-500/10 border-orange-500/50 text-orange-400' : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'}`}>
                                                {p.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-zinc-400">研究方向 (Directions)</Label>
                                    <div className="flex flex-wrap gap-2">
                                        {directionsDict.map(d => (
                                            <button key={d.id} type="button" onClick={() => toggleArrayItem(setSelectedDirections, d.id)} 
                                                className={`px-3 py-1.5 rounded-full border text-xs font-medium transition-colors ${selectedDirections.includes(d.id) ? 'bg-blue-500/10 border-blue-500/50 text-blue-400' : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'}`}>
                                                {d.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-zinc-400">论文性质 (Types)</Label>
                                    <div className="flex flex-wrap gap-2">
                                        {typesDict.map(t => (
                                            <button key={t.id} type="button" onClick={() => toggleArrayItem(setSelectedTypes, t.id)} 
                                                className={`px-3 py-1.5 rounded-full border text-xs font-medium transition-colors ${selectedTypes.includes(t.id) ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400' : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'}`}>
                                                {t.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </section>

                            {/* --- Content Fields --- */}
                            <section className="space-y-4">
                                <h4 className="text-sm font-bold text-zinc-500 uppercase tracking-wider border-t border-zinc-800 pt-6">核心内容</h4>
                                <div className="space-y-1">
                                    <Label className="text-zinc-400">一句话摘要 (Summary)</Label>
                                    <Textarea value={form.summary || ""} onChange={e => setForm({...form, summary: e.target.value})} className="bg-zinc-950 border-zinc-800 min-h-[80px]" />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-zinc-400 flex justify-between">详细笔记 (Notes - 支持 Markdown) <span>※ 如果不想记笔记留空即可</span></Label>
                                    <Textarea value={form.notes || ""} onChange={e => setForm({...form, notes: e.target.value})} className="bg-zinc-950 border-zinc-800 font-mono text-sm min-h-[200px]" />
                                </div>
                                
                                <div className="space-y-2 pt-2">
                                    <Label className="text-zinc-400 block mb-2">主要贡献 (Key Contributions 字符串数组)</Label>
                                    {(form.key_contributions || []).map((cont: string, i: number) => (
                                        <div key={i} className="flex gap-2">
                                            <Input value={cont} onChange={e => updateContribution(i, e.target.value)} className="bg-zinc-950 border-zinc-800 text-sm h-9" />
                                            <Button variant="ghost" size="icon" className="h-9 w-9 text-zinc-500 hover:text-red-400 shrink-0" onClick={() => removeContribution(i)}>
                                                <X size={14} />
                                            </Button>
                                        </div>
                                    ))}
                                    <div>
                                        <Button variant="outline" size="sm" onClick={addContribution} className="border-dashed border-zinc-700 text-zinc-400 hover:bg-zinc-800 bg-transparent h-8 mt-1">
                                            <Plus size={14} className="mr-1"/> Add Contribution
                                        </Button>
                                    </div>
                                </div>
                            </section>

                            {/* --- Figures --- */}
                            <section className="space-y-4 pb-12">
                                <h4 className="text-sm font-bold text-zinc-500 uppercase tracking-wider border-t border-zinc-800 pt-6">论文图表 (Figures)</h4>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {figures.map((fig, i) => (
                                        <div key={i} className="bg-zinc-950/50 p-4 rounded-xl border border-zinc-800 relative group">
                                            <Button variant="ghost" size="icon" className="absolute top-2 right-2 h-6 w-6 text-zinc-500 opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-400" onClick={() => removeFigure(i)}>
                                                <X size={14} />
                                            </Button>
                                            <div className="space-y-3">
                                                <div>
                                                    <Label className="text-xs text-zinc-500">Image Upload</Label>
                                                    <div className="mt-1">
                                                        <ImageUpload 
                                                            value={fig.url}
                                                            onChange={val => updateFigure(i, "url", val)}
                                                            bucket="paper_images"
                                                            folder="figures"
                                                            className="w-full"
                                                        />
                                                    </div>
                                                </div>
                                                <div>
                                                    <Label className="text-xs text-zinc-500">Description</Label>
                                                    <Textarea value={fig.description} onChange={e => updateFigure(i, "description", e.target.value)} className="min-h-[60px] bg-zinc-900 border-zinc-700 text-xs mt-1" />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    <div className="bg-transparent border border-dashed border-zinc-700 hover:border-zinc-500 rounded-xl flex items-center justify-center p-4 cursor-pointer transition-colors text-zinc-500 hover:text-zinc-300 min-h-[160px]" onClick={addFigure}>
                                        <div className="text-center">
                                            <Plus size={24} className="mx-auto mb-2 opacity-50" />
                                            <span className="text-sm">Add New Figure</span>
                                        </div>
                                    </div>
                                </div>
                            </section>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
