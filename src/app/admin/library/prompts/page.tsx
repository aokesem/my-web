"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";
import {
    Loader2,
    Plus,
    Pencil,
    Trash2,
    SearchCode,
    Save,
    X,
    FolderOpen,
    FileText,
    MoreVertical
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

// Types
type Category = {
    id: string; // uuid
    title: string;
    en_title: string;
    icon: string;
    description: string;
    color: string;
    bg: string;
    status: string;
    sort_order: number;
    created_at?: string;
};

type Prompt = {
    id: number; // bigint
    category_id: string; // uuid
    name: string;
    content: string;
    sort_order: number;
    created_at?: string;
};

export default function PromptsAdminPage() {
    // State
    const [categories, setCategories] = useState<Category[]>([]);
    const [prompts, setPrompts] = useState<Prompt[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
    const [loadingCategories, setLoadingCategories] = useState(true);
    const [loadingPrompts, setLoadingPrompts] = useState(false);

    // Dialog States
    const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
    const [isPromptDialogOpen, setIsPromptDialogOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null);

    // Form States (Simple controlled inputs for now)
    const [categoryForm, setCategoryForm] = useState<Partial<Category>>({
        title: "", en_title: "", icon: "SearchCode", description: "", color: "text-stone-500", bg: "bg-stone-50", status: "Active", sort_order: 0
    });
    const [promptForm, setPromptForm] = useState<Partial<Prompt>>({
        name: "", content: "", sort_order: 0
    });

    // --- Fetch Data ---
    const fetchCategories = async () => {
        setLoadingCategories(true);
        const { data, error } = await supabase
            .from("prompt_categories")
            .select("*")
            .order("sort_order", { ascending: true });

        if (error) {
            toast.error("加载分类失败");
            console.error(error);
        } else {
            setCategories(data || []);
            // Select first category by default if none selected
            if (!selectedCategory && data && data.length > 0) {
                setSelectedCategory(data[0]);
            }
        }
        setLoadingCategories(false);
    };

    const fetchPrompts = async (categoryId: string) => {
        setLoadingPrompts(true);
        const { data, error } = await supabase
            .from("prompts")
            .select("*")
            .eq("category_id", categoryId)
            .order("sort_order", { ascending: true });

        if (error) {
            toast.error("加载提示词失败");
            console.error(error);
        } else {
            setPrompts(data || []);
        }
        setLoadingPrompts(false);
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    useEffect(() => {
        if (selectedCategory) {
            fetchPrompts(selectedCategory.id);
        } else {
            setPrompts([]);
        }
    }, [selectedCategory]);

    // --- Handlers: Category ---
    const handleAddCategory = () => {
        setEditingCategory(null);
        setCategoryForm({
            title: "", en_title: "", icon: "SearchCode", description: "", color: "text-stone-500", bg: "bg-stone-50", status: "Active", sort_order: categories.length + 1
        });
        setIsCategoryDialogOpen(true);
    };

    const handleEditCategory = (cat: Category) => {
        setEditingCategory(cat);
        setCategoryForm({ ...cat });
        setIsCategoryDialogOpen(true);
    };

    const handleSaveCategory = async () => {
        if (!categoryForm.title || !categoryForm.icon) {
            toast.error("标题和图标是必填项");
            return;
        }

        const promise = editingCategory
            ? supabase.from("prompt_categories").update(categoryForm).eq("id", editingCategory.id)
            : supabase.from("prompt_categories").insert([categoryForm]);

        const { error } = await promise;

        if (error) {
            toast.error("操作失败");
            console.error(error);
        } else {
            toast.success(editingCategory ? "分类已更新" : "分类已创建");
            setIsCategoryDialogOpen(false);
            fetchCategories();
        }
    };

    const handleDeleteCategory = async (id: string) => {
        if (!confirm("确定要删除吗？这将删除该分类下的所有提示词。")) return;

        const { error } = await supabase.from("prompt_categories").delete().eq("id", id);
        if (error) {
            toast.error("删除失败");
            console.error(error);
        } else {
            toast.success("分类已删除");
            if (selectedCategory?.id === id) setSelectedCategory(null);
            fetchCategories();
        }
    };

    // --- Handlers: Prompt ---
    const handleAddPrompt = () => {
        if (!selectedCategory) return;
        setEditingPrompt(null);
        setPromptForm({
            name: "", content: "", sort_order: prompts.length + 1, category_id: selectedCategory.id
        });
        setIsPromptDialogOpen(true);
    };

    const handleEditPrompt = (prompt: Prompt) => {
        setEditingPrompt(prompt);
        setPromptForm({ ...prompt });
        setIsPromptDialogOpen(true);
    };

    const handleSavePrompt = async () => {
        if (!promptForm.name || !promptForm.content) {
            toast.error("名称和内容是必填项");
            return;
        }

        const payload = { ...promptForm, category_id: selectedCategory?.id };

        const promise = editingPrompt
            ? supabase.from("prompts").update(payload).eq("id", editingPrompt.id)
            : supabase.from("prompts").insert([payload]);

        const { error } = await promise;

        if (error) {
            toast.error("操作失败");
            console.error(error);
        } else {
            toast.success(editingPrompt ? "提示词已更新" : "提示词已创建");
            setIsPromptDialogOpen(false);
            if (selectedCategory) fetchPrompts(selectedCategory.id);
        }
    };

    const handleDeletePrompt = async (id: number) => {
        if (!confirm("确定要删除吗？")) return;
        const { error } = await supabase.from("prompts").delete().eq("id", id);
        if (error) {
            toast.error("删除失败");
        } else {
            toast.success("提示词已删除");
            if (selectedCategory) fetchPrompts(selectedCategory.id);
        }
    };


    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-white mb-2">提示词仓库</h1>
                    <p className="text-zinc-400">管理分类和提示词模板</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 h-[calc(100vh-200px)]">
                {/* --- Left Column: Categories List --- */}
                <Card className="md:col-span-1 bg-zinc-900 border-zinc-800 flex flex-col h-full overflow-hidden">
                    <CardHeader className="py-4 px-4 border-b border-zinc-800 flex flex-row items-center justify-between space-y-0">
                        <CardTitle className="text-base font-semibold text-zinc-100">侧边分类</CardTitle>
                        <Button variant="ghost" size="icon" onClick={handleAddCategory} className="h-8 w-8 hover:bg-zinc-800">
                            <Plus size={16} />
                        </Button>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-y-auto p-2 space-y-1">
                        {loadingCategories ? (
                            <div className="flex justify-center py-4"><Loader2 className="animate-spin text-zinc-500" /></div>
                        ) : categories.map((cat) => (
                            <div
                                key={cat.id}
                                onClick={() => setSelectedCategory(cat)}
                                className={`
                                    group flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all border
                                    ${selectedCategory?.id === cat.id ? 'bg-zinc-800 border-zinc-700/60 text-white shadow-md' : 'border-transparent text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200'}
                                `}
                            >
                                <div className="flex items-center gap-3">
                                    <FolderOpen size={16} className={selectedCategory?.id === cat.id ? "text-orange-500" : "text-zinc-600"} />
                                    <span className="text-sm font-medium truncate max-w-[120px]">{cat.title}</span>
                                </div>
                                <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1">
                                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); handleEditCategory(cat); }}>
                                        <Pencil size={12} />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>

                {/* --- Right Column: Prompts List --- */}
                <Card className="md:col-span-3 bg-zinc-900 border-zinc-800 flex flex-col h-full overflow-hidden">
                    <CardHeader className="py-4 px-6 border-b border-zinc-800 flex flex-row items-center justify-between space-y-0">
                        <div className="flex items-center gap-4">
                            <CardTitle className="text-lg font-semibold text-zinc-100">
                                {selectedCategory ? selectedCategory.title : "请选择分类"}
                            </CardTitle>
                            {selectedCategory && (
                                <Badge variant="secondary" className="text-xs bg-zinc-800 text-zinc-400">
                                    {prompts.length} 条提示词
                                </Badge>
                            )}
                        </div>
                        <Button disabled={!selectedCategory} onClick={handleAddPrompt} className="gap-2 bg-orange-600 hover:bg-orange-700 text-white">
                            <Plus size={16} /> 新增提示词
                        </Button>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-y-auto p-6">
                        {!selectedCategory ? (
                            <div className="flex flex-col items-center justify-center h-full text-zinc-500 gap-2">
                                <SearchCode size={48} className="opacity-20" />
                                <p className="text-zinc-400">选择一个分类以管理提示词</p>
                            </div>
                        ) : loadingPrompts ? (
                            <div className="flex justify-center py-10"><Loader2 className="animate-spin text-zinc-500" /></div>
                        ) : prompts.length === 0 ? (
                            <div className="text-center py-20 text-zinc-500">
                                <p>该分类下暂无提示词。</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-4">
                                {prompts.map((prompt) => (
                                    <div key={prompt.id} className="group bg-zinc-950/50 border border-zinc-800/60 rounded-xl p-4 hover:border-zinc-700 transition-all">
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-zinc-900 border border-zinc-800 rounded-lg text-orange-500">
                                                    <FileText size={16} />
                                                </div>
                                                <div>
                                                    <h3 className="font-medium text-zinc-200 group-hover:text-white transition-colors">{prompt.name}</h3>
                                                    <p className="text-xs text-zinc-500 font-mono">ID: {prompt.id}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button variant="ghost" size="sm" onClick={() => handleEditPrompt(prompt)} className="h-8 w-8 p-0">
                                                    <Pencil size={14} className="text-zinc-400" />
                                                </Button>
                                                <Button variant="ghost" size="sm" onClick={() => handleDeletePrompt(prompt.id)} className="h-8 w-8 p-0 hover:text-red-400">
                                                    <Trash2 size={14} />
                                                </Button>
                                            </div>
                                        </div>
                                        <div className="bg-zinc-950/30 rounded-lg p-3 border border-zinc-800/50">
                                            <p className="text-xs font-mono text-zinc-300 line-clamp-3 whitespace-pre-wrap leading-relaxed opacity-80 group-hover:opacity-100 transition-opacity">
                                                {prompt.content}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* --- Category Modal --- */}
            <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
                <DialogContent className="bg-zinc-900 border-zinc-800 text-zinc-100 sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>{editingCategory ? "编辑分类" : "新建分类"}</DialogTitle>
                        <DialogDescription className="text-zinc-400">
                            创建文章/提示词所属的分组。
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="c_title">显示名称 (中文)</Label>
                            <Input id="c_title" value={categoryForm.title} onChange={e => setCategoryForm({ ...categoryForm, title: e.target.value })} className="bg-zinc-950 border-zinc-800" />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="c_en">英文标识 / 标题</Label>
                            <Input id="c_en" value={categoryForm.en_title} onChange={e => setCategoryForm({ ...categoryForm, en_title: e.target.value })} className="bg-zinc-950 border-zinc-800" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="c_icon">图标名称 (Lucide)</Label>
                                <Input id="c_icon" value={categoryForm.icon} onChange={e => setCategoryForm({ ...categoryForm, icon: e.target.value })} className="bg-zinc-950 border-zinc-800" placeholder="SearchCode" />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="c_sort">排序权重</Label>
                                <Input id="c_sort" type="number" value={categoryForm.sort_order || 0} onChange={e => setCategoryForm({ ...categoryForm, sort_order: parseInt(e.target.value) || 0 })} className="bg-zinc-950 border-zinc-800" />
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="c_desc">分类描述</Label>
                            <Textarea id="c_desc" value={categoryForm.description} onChange={e => setCategoryForm({ ...categoryForm, description: e.target.value })} className="bg-zinc-950 border-zinc-800" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="c_color">Color Class</Label>
                                <Input id="c_color" value={categoryForm.color} onChange={e => setCategoryForm({ ...categoryForm, color: e.target.value })} className="bg-zinc-950 border-zinc-800" placeholder="text-blue-500" />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="c_bg">Bg Class</Label>
                                <Input id="c_bg" value={categoryForm.bg} onChange={e => setCategoryForm({ ...categoryForm, bg: e.target.value })} className="bg-zinc-950 border-zinc-800" placeholder="bg-blue-50" />
                            </div>
                        </div>
                        {editingCategory && (
                            <div className="pt-2">
                                <Button variant="destructive" size="sm" type="button" onClick={() => handleDeleteCategory(editingCategory.id)} className="w-full">
                                    <Trash2 size={14} className="mr-2" /> Delete Category
                                </Button>
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsCategoryDialogOpen(false)} className="border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:text-white">Cancel</Button>
                        <Button onClick={handleSaveCategory} className="bg-orange-600 hover:bg-orange-700 text-white">Save Changes</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* --- Prompt Modal --- */}
            <Dialog open={isPromptDialogOpen} onOpenChange={setIsPromptDialogOpen}>
                <DialogContent className="bg-zinc-900 border-zinc-800 text-zinc-100 sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>{editingPrompt ? "编辑提示词" : "新建提示词"}</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-3 gap-4">
                            <div className="col-span-2 grid gap-2">
                                <Label htmlFor="p_name">提示词名称</Label>
                                <Input id="p_name" value={promptForm.name} onChange={e => setPromptForm({ ...promptForm, name: e.target.value })} className="bg-zinc-950 border-zinc-800" />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="p_sort">排序</Label>
                                <Input id="p_sort" type="number" value={promptForm.sort_order || 0} onChange={e => setPromptForm({ ...promptForm, sort_order: parseInt(e.target.value) || 0 })} className="bg-zinc-950 border-zinc-800" />
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="p_content">具体内容 (支持 Markdown)</Label>
                            <Textarea
                                id="p_content"
                                value={promptForm.content}
                                onChange={e => setPromptForm({ ...promptForm, content: e.target.value })}
                                className="bg-zinc-950 border-zinc-800 font-mono text-sm min-h-[300px]"
                                placeholder="输入模版内容..."
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsPromptDialogOpen(false)} className="border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:text-white">取消</Button>
                        <Button onClick={handleSavePrompt} className="bg-orange-600 hover:bg-orange-700 text-white">确定保存</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
