"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";
import { Loader2, Plus, Pencil, Trash2, FolderOpen, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

// [说明] 包含 1主表 + 3子表 的管理
export default function ProjectsTab() {
    const [projects, setProjects] = useState<any[]>([]);
    const [selectedProject, setSelectedProject] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeSubTab, setActiveSubTab] = useState<"info" | "timeline" | "insights" | "outcomes">("info");

    const fetchProjects = async () => {
        setLoading(true);
        const { data, error } = await supabase.from("prism_projects").select("*").order("sort_order");
        if (error) toast.error("加载项目失败");
        else setProjects(data || []);
        setLoading(false);
    };

    useEffect(() => {
        fetchProjects();
    }, []);

    // --- 新增/编辑 项目 ---
    const [isEditingProject, setIsEditingProject] = useState(false);
    const [projectForm, setProjectForm] = useState({ id: "", name: "", sort_order: 0 });

    const handleCreateProject = () => {
        setProjectForm({ id: "", name: "", sort_order: projects.length + 1 });
        setIsEditingProject(true);
    };

    const handleEditProject = (p: any) => {
        setProjectForm({ id: p.id, name: p.name, sort_order: p.sort_order });
        setIsEditingProject(true);
    };

    const handleSaveProject = async () => {
        if (!projectForm.name.trim()) return toast.error("项目名不能为空");
        const payload = { name: projectForm.name, sort_order: projectForm.sort_order };
        const promise = projectForm.id 
            ? supabase.from("prism_projects").update(payload).eq("id", projectForm.id)
            : supabase.from("prism_projects").insert([payload]).select().single();
        
        const { data, error } = await promise;
        if (error) {
            toast.error(error.message);
        } else {
            toast.success("保存项目成功");
            setIsEditingProject(false);
            if (!projectForm.id && data) setSelectedProject(data);
            fetchProjects();
        }
    };

    const handleDeleteProject = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!window.confirm("确定删除该项目及其所有子内容吗？")) return;
        const { error } = await supabase.from("prism_projects").delete().eq("id", id);
        if (error) toast.error(error.message);
        else {
            toast.success("项目已删除");
            if (selectedProject?.id === id) setSelectedProject(null);
            fetchProjects();
        }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 h-[calc(100vh-200px)]">
            {/* 左侧：项目列表 */}
            <div className="md:col-span-1 bg-zinc-900 border border-zinc-800 rounded-xl flex flex-col h-full overflow-hidden">
                <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-950/50">
                    <h3 className="font-semibold text-white">所有项目</h3>
                    <Button size="sm" variant="outline" className="h-8 w-8 p-0 border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-white" onClick={handleCreateProject}>
                        <Plus size={14} />
                    </Button>
                </div>
                
                {isEditingProject && (
                    <div className="p-3 border-b border-zinc-800 bg-zinc-900/80">
                        <Input 
                            value={projectForm.name} 
                            onChange={e => setProjectForm({...projectForm, name: e.target.value})} 
                            placeholder="项目名称" 
                            className="h-8 mb-2 bg-zinc-950 border-zinc-800"
                        />
                        <div className="flex gap-2">
                            <Input 
                                type="number" 
                                value={projectForm.sort_order} 
                                onChange={e => setProjectForm({...projectForm, sort_order: parseInt(e.target.value)||0})} 
                                className="h-8 bg-zinc-950 border-zinc-800 w-20"
                            />
                            <div className="flex-1 flex gap-1">
                                <Button size="sm" onClick={handleSaveProject} className="h-8 flex-1 bg-orange-600 hover:bg-orange-700 text-white">保存</Button>
                                <Button size="sm" variant="ghost" onClick={() => setIsEditingProject(false)} className="h-8 px-2 text-zinc-400 hover:text-white"><X size={14} /></Button>
                            </div>
                        </div>
                    </div>
                )}

                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                    {loading ? (
                        <div className="flex justify-center p-4"><Loader2 className="animate-spin text-zinc-500" /></div>
                    ) : projects.map(p => (
                        <div 
                            key={p.id} 
                            onClick={() => setSelectedProject(p)}
                            className={`group flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all border ${selectedProject?.id === p.id ? 'bg-zinc-800 border-zinc-700/60 text-white' : 'border-transparent text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200'}`}
                        >
                            <span className="text-sm font-medium truncate">{p.name}</span>
                            <div className="opacity-0 group-hover:opacity-100 flex gap-1">
                                <Button variant="ghost" size="icon" className="h-6 w-6 text-zinc-400 hover:text-white" onClick={(e) => { e.stopPropagation(); handleEditProject(p); }}><Pencil size={12} /></Button>
                                <Button variant="ghost" size="icon" className="h-6 w-6 text-zinc-400 hover:text-red-400" onClick={(e) => handleDeleteProject(p.id, e)}><Trash2 size={12} /></Button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* 右侧：子模块管理 */}
            <div className="md:col-span-3 bg-zinc-900 border border-zinc-800 rounded-xl flex flex-col h-full overflow-hidden">
                {!selectedProject ? (
                    <div className="flex flex-col items-center justify-center h-full text-zinc-500 gap-2">
                        <FolderOpen size={48} className="opacity-20" />
                        <p>请在左侧选择或新建一个项目</p>
                    </div>
                ) : (
                    <>
                        {/* Sub Tabs */}
                        <div className="flex items-center gap-1 border-b border-zinc-800 p-2 bg-zinc-950/30">
                            {[
                                { id: "info", label: "项目信息" },
                                { id: "timeline", label: "时间轴 (Timeline)" },
                                { id: "insights", label: "启示 (Insights)" },
                                { id: "outcomes", label: "现有成果 (Outcomes)" }
                            ].map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveSubTab(tab.id as any)}
                                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${activeSubTab === tab.id ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'}`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-6 relative">
                            {activeSubTab === "info" && (
                                <div className="max-w-md space-y-4">
                                    <div>
                                        <Label className="text-zinc-400">项目 ID</Label>
                                        <Input value={selectedProject?.id || ""} readOnly className="bg-zinc-950/50 border-zinc-800 mt-1 font-mono text-xs text-zinc-500" />
                                    </div>
                                    <div>
                                        <Label className="text-zinc-400">项目名称</Label>
                                        <Input value={selectedProject?.name || ""} readOnly className="bg-zinc-950 border-zinc-800 mt-1" />
                                    </div>
                                    <p className="text-xs text-zinc-500 mt-4">如需修改名称或排序，请在左侧栏点击铅笔图标。</p>
                                </div>
                            )}

                            {activeSubTab === "timeline" && selectedProject?.id && <SubModuleManager projectId={selectedProject.id} table="prism_project_timeline" fields={["date", "content"]} sortBy="sort_order" />}
                            {activeSubTab === "insights" && selectedProject?.id && <SubModuleManager projectId={selectedProject.id} table="prism_project_insights" fields={["category", "content"]} sortBy="sort_order" showCreatedAt={true} />}
                            {activeSubTab === "outcomes" && selectedProject?.id && <SubModuleManager projectId={selectedProject.id} table="prism_project_outcomes" fields={["category", "content"]} sortBy="sort_order" showCreatedAt={true} />}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

// 可复用的子模块管理器组件（用于 Timeline, Insights, Outcomes）
function SubModuleManager({ projectId, table, fields, sortBy, showCreatedAt = false }: { projectId: string; table: string; fields: string[]; sortBy: string; showCreatedAt?: boolean }) {
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingItem, setEditingItem] = useState<any | null>(null);
    const [form, setForm] = useState<any>({});
    const [selectedCategory, setSelectedCategory] = useState<string>("All");

    const hasCategory = fields.includes("category");
    const categories = React.useMemo(() => {
        if (!hasCategory) return [];
        const cats = Array.from(new Set(data.map(item => item.category).filter(Boolean))) as string[];
        return ["All", ...cats.sort()];
    }, [data, hasCategory]);

    const filteredData = React.useMemo(() => {
        if (!hasCategory || selectedCategory === "All") return data;
        return data.filter(item => item.category === selectedCategory);
    }, [data, selectedCategory, hasCategory]);

    const fetchData = async () => {
        setLoading(true);
        const { data: res, error } = await supabase.from(table).select("*").eq("project_id", projectId).order(sortBy);
        if (error) toast.error(error.message);
        else setData(res || []);
        setLoading(false);
    };

    useEffect(() => {
        setEditingItem(null);
        fetchData();
    }, [projectId, table]);

    const handleCreate = () => {
        const defaultForm: any = { sort_order: data.length + 1 };
        fields.forEach(f => defaultForm[f] = "");
        if (showCreatedAt) {
            const d = new Date();
            defaultForm.created_at = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
        }
        setForm(defaultForm);
        setEditingItem({ isNew: true });
    };

    const handleEdit = (item: any) => {
        const editForm: any = { sort_order: item.sort_order };
        fields.forEach(f => editForm[f] = item[f] || "");
        if (showCreatedAt) {
            if (item.created_at) {
                const d = new Date(item.created_at);
                editForm.created_at = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
            } else {
                editForm.created_at = "";
            }
        }
        setForm(editForm);
        setEditingItem(item);
    };

    const handleSave = async () => {
        if (!editingItem) return;
        const payload = { ...form, project_id: projectId };
        
        if (showCreatedAt) {
            if (payload.created_at) {
                payload.created_at = new Date(payload.created_at).toISOString();
            } else {
                delete payload.created_at;
            }
        }

        const promise = editingItem.isNew 
            ? supabase.from(table).insert([payload])
            : supabase.from(table).update(payload).eq("id", editingItem.id);

        const { error } = await promise;
        if (error) toast.error(error.message);
        else {
            toast.success("保存成功");
            setEditingItem(null);
            fetchData();
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm("确定删除该记录吗？")) return;
        const { error } = await supabase.from(table).delete().eq("id", id);
        if (error) toast.error(error.message);
        else {
            toast.success("删除成功");
            fetchData();
        }
    };

    if (loading) return <div className="flex justify-center p-10"><Loader2 className="animate-spin text-zinc-500" /></div>;

    const renderFieldInput = (field: string) => {
        if (field === "content") {
            return <Textarea value={form[field]} onChange={e => setForm({...form, [field]: e.target.value})} className="bg-zinc-950 border-zinc-800 col-span-2 min-h-[100px]" placeholder={field} />
        }
        return <Input value={form[field]} onChange={e => setForm({...form, [field]: e.target.value})} className="bg-zinc-950 border-zinc-800" placeholder={field} />
    };

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-800/50 pb-4">
                {hasCategory ? (
                    <div className="flex flex-wrap gap-2">
                        {categories.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                                    selectedCategory === cat 
                                    ? 'bg-zinc-100 text-zinc-900 border-zinc-100' 
                                    : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-zinc-700 hover:text-zinc-200'
                                } border`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                ) : <div />}
                
                <Button onClick={handleCreate} disabled={!!editingItem} size="sm" className="bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700">
                    <Plus size={14} className="mr-1" /> 添加记录
                </Button>
            </div>

            {editingItem && (
                <div className="bg-zinc-950/50 border border-zinc-800 rounded-xl p-4 space-y-4 shadow-lg mb-6">
                    <div className="grid grid-cols-2 gap-4">
                        {fields.map(f => (
                            <div key={f} className={f === "content" ? "col-span-2" : ""}>
                                <Label className="text-zinc-400 capitalize">{f}</Label>
                                <div className="mt-1">{renderFieldInput(f)}</div>
                            </div>
                        ))}
                        {showCreatedAt && (
                            <div>
                                <Label className="text-zinc-400 capitalize">Created At</Label>
                                <Input 
                                    type="datetime-local" 
                                    value={form.created_at || ""} 
                                    onChange={e => setForm({...form, created_at: e.target.value})} 
                                    className="bg-zinc-950 border-zinc-800 mt-1 font-mono text-sm text-zinc-300" 
                                />
                            </div>
                        )}
                        <div>
                            <Label className="text-zinc-400">Sort Order</Label>
                            <Input type="number" value={form.sort_order} onChange={e => setForm({...form, sort_order: parseInt(e.target.value)||0})} className="bg-zinc-950 border-zinc-800 mt-1" />
                        </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-2 border-t border-zinc-800">
                        <Button variant="outline" size="sm" onClick={() => setEditingItem(null)} className="border-zinc-800 text-zinc-300">取消</Button>
                        <Button size="sm" onClick={handleSave} className="bg-orange-600 hover:bg-orange-700 text-white">确认保存</Button>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 gap-3">
                {filteredData.map(item => (
                    <div key={item.id} className="group bg-zinc-900 border border-zinc-800 rounded-lg p-3 hover:border-zinc-700 transition-colors flex gap-4">
                        <div className="flex flex-col items-center justify-center bg-zinc-950 rounded px-2 text-xs text-zinc-500 font-mono w-10 shrink-0">
                            {item.sort_order}
                        </div>
                        <div className="flex-1 space-y-1 overflow-hidden">
                            {fields.map(f => f !== "content" && (
                                <div key={f} className="text-sm font-semibold text-zinc-200">{item[f]}</div>
                            ))}
                            <p className="text-sm text-zinc-400 line-clamp-3 whitespace-pre-wrap">{item.content}</p>
                        </div>
                        <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button size="icon" variant="ghost" className="h-7 w-7 text-zinc-400 hover:text-white" onClick={() => handleEdit(item)}><Pencil size={14} /></Button>
                            <Button size="icon" variant="ghost" className="h-7 w-7 text-zinc-400 hover:text-red-400" onClick={() => handleDelete(item.id)}><Trash2 size={14} /></Button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
