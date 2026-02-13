"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";
import {
    Loader2,
    Plus,
    Pencil,
    Trash2,
    Search,
    Sprout,
    BookOpen,
    Code,
    Palette,
    MoreVertical,
    Calendar,
    Eye,
    EyeOff,
    FolderOpen,
    Layers,
    Save
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
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import * as LucideIcons from "lucide-react";

// Types
type GardenCategory = {
    id: string; // text id
    title: string;
    icon: string;
    description: string;
    color: string;
    sort_order: number;
    created_at?: string;
};

type GardenPost = {
    id: string;
    slug: string;
    title: string;
    description: string;
    content: string;
    tags: string[];
    category: string;
    cover_image: string | null;
    status: 'Draft' | 'Published';
    published_at: string | null;
    created_at: string;
    updated_at: string;
};

export default function GardenAdminPage() {
    // --- State ---
    const [activeTab, setActiveTab] = useState("posts");
    const [posts, setPosts] = useState<GardenPost[]>([]);
    const [categories, setCategories] = useState<GardenCategory[]>([]);

    // Loading States
    const [loadingPosts, setLoadingPosts] = useState(true);
    const [loadingCategories, setLoadingCategories] = useState(true);

    // Filters
    const [searchTerm, setSearchTerm] = useState("");
    const [filterStatus, setFilterStatus] = useState<string>("all");
    const [filterCategory, setFilterCategory] = useState<string>("all");

    // Dialogs
    const [isPostDialogOpen, setIsPostDialogOpen] = useState(false);
    const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);

    // Editing Items
    const [editingPost, setEditingPost] = useState<GardenPost | null>(null);
    const [editingCategory, setEditingCategory] = useState<GardenCategory | null>(null);

    // Forms
    const [postForm, setPostForm] = useState<Partial<GardenPost>>({
        title: "", slug: "", description: "", content: "", category: "learning", tags: [], status: "Draft"
    });
    const [tagsInput, setTagsInput] = useState("");

    const [categoryForm, setCategoryForm] = useState<Partial<GardenCategory>>({
        id: "", title: "", icon: "Sprout", description: "", color: "text-teal-500", sort_order: 0
    });

    // --- Fetch Data ---
    const fetchCategories = async () => {
        setLoadingCategories(true);
        const { data, error } = await supabase
            .from("garden_categories")
            .select("*")
            .order("sort_order", { ascending: true });

        if (error) {
            console.error("Error fetching categories:", error);
            // Fallback for initial setup if table doesn't exist yet
            if (error.code === '42P01') {
                toast.error("未找到 'garden_categories' 表。请运行初始化 SQL。");
            }
        } else {
            setCategories(data || []);
        }
        setLoadingCategories(false);
    };

    const fetchPosts = async () => {
        setLoadingPosts(true);
        let query = supabase
            .from("garden_posts")
            .select("*")
            .order("created_at", { ascending: false });

        if (filterStatus !== "all") query = query.eq("status", filterStatus);
        if (filterCategory !== "all") query = query.eq("category", filterCategory);

        const { data, error } = await query;

        if (error) {
            toast.error("加载文章失败");
            console.error(error);
        } else {
            setPosts(data || []);
        }
        setLoadingPosts(false);
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    useEffect(() => {
        fetchPosts();
    }, [filterStatus, filterCategory]);

    // --- Helpers ---
    const getIcon = (name: string) => {
        const Icon = (LucideIcons as any)[name] || Sprout;
        return Icon;
    };

    const generateSlug = (title: string) => {
        return title.toLowerCase().replace(/\s+/g, '-').replace(/[^\w\u4e00-\u9fa5-]/g, '') || 'untitled-' + Date.now();
    };

    // --- Handlers: Posts ---
    const handleAddPost = () => {
        setEditingPost(null);
        setPostForm({
            title: "", slug: "", description: "", content: "",
            category: categories[0]?.id || "learning",
            tags: [], status: "Draft"
        });
        setTagsInput("");
        setIsPostDialogOpen(true);
    };

    const handleEditPost = (post: GardenPost) => {
        setEditingPost(post);
        setPostForm({ ...post });
        setTagsInput(post.tags?.join(", ") || "");
        setIsPostDialogOpen(true);
    };

    const handleSavePost = async () => {
        if (!postForm.title || !postForm.content) {
            toast.error("标题和内容为必填项");
            return;
        }

        const tags = tagsInput.split(/[,，]/).map(t => t.trim()).filter(Boolean);
        let slug = postForm.slug?.trim();
        if (!slug) slug = generateSlug(postForm.title!);

        const payload = {
            ...postForm,
            slug,
            tags,
            updated_at: new Date().toISOString(),
            published_at: postForm.status === 'Published' && (!editingPost?.published_at)
                ? new Date().toISOString()
                : editingPost?.published_at
        };

        const promise = editingPost
            ? supabase.from("garden_posts").update(payload).eq("id", editingPost.id)
            : supabase.from("garden_posts").insert([payload]);

        const { error } = await promise;

        if (error) {
            toast.error("保存失败: " + error.message);
        } else {
            toast.success(editingPost ? "文章已更新" : "文章已创建");
            setIsPostDialogOpen(false);
            fetchPosts();
        }
    };

    const handleDeletePost = async (id: string) => {
        if (!confirm("确定要删除吗？")) return;
        const { error } = await supabase.from("garden_posts").delete().eq("id", id);
        if (error) toast.error("删除失败");
        else {
            toast.success("文章已删除");
            fetchPosts();
        }
    };

    // --- Handlers: Categories ---
    const handleAddCategory = () => {
        setEditingCategory(null);
        setCategoryForm({
            id: "", title: "", icon: "Sprout", description: "", color: "text-teal-500", sort_order: categories.length + 1
        });
        setIsCategoryDialogOpen(true);
    };

    const handleEditCategory = (cat: GardenCategory) => {
        setEditingCategory(cat);
        setCategoryForm({ ...cat });
        setIsCategoryDialogOpen(true);
    };

    const handleSaveCategory = async () => {
        if (!categoryForm.id || !categoryForm.title) {
            toast.error("ID 和标题为必填项");
            return;
        }

        const promise = editingCategory
            ? supabase.from("garden_categories").update(categoryForm).eq("id", editingCategory.id)
            : supabase.from("garden_categories").insert([categoryForm]);

        const { error } = await promise;

        if (error) {
            toast.error("保存失败: " + error.message);
        } else {
            toast.success(editingCategory ? "分类已更新" : "分类已创建");
            setIsCategoryDialogOpen(false);
            fetchCategories();
        }
    };

    const handleDeleteCategory = async (id: string) => {
        if (!confirm("确定要删除此分类吗？该分类下的文章可能会失去归属。")) return;
        const { error } = await supabase.from("garden_categories").delete().eq("id", id);
        if (error) toast.error("删除失败");
        else {
            toast.success("分类已删除");
            fetchCategories();
        }
    };


    // Filter Logic
    const filteredPosts = posts.filter(post =>
        post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6 h-full flex flex-col">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-white mb-2 flex items-center gap-3">
                        <Sprout className="text-teal-500" />
                        数字花园管理
                    </h1>
                    <p className="text-zinc-400">管理您的数字花园文章与分类</p>
                </div>
                <div className="flex gap-2">
                    {activeTab === 'posts' ? (
                        <Button onClick={handleAddPost} className="bg-teal-600 hover:bg-teal-700 text-white gap-2">
                            <Plus size={16} /> 新建文章
                        </Button>
                    ) : (
                        <Button onClick={handleAddCategory} className="bg-orange-600 hover:bg-orange-700 text-white gap-2">
                            <Plus size={16} /> 新建分类
                        </Button>
                    )}
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
                <TabsList className="bg-zinc-900 border border-zinc-800 w-fit">
                    <TabsTrigger value="posts" className="data-[state=active]:bg-zinc-800">文章管理</TabsTrigger>
                    <TabsTrigger value="categories" className="data-[state=active]:bg-zinc-800">分类管理</TabsTrigger>
                </TabsList>

                {/* --- POSTS TAB --- */}
                <TabsContent value="posts" className="flex-1 flex flex-col gap-4 mt-4 overflow-hidden">
                    {/* Filters */}
                    <div className="flex flex-col sm:flex-row gap-4 items-center bg-zinc-900/50 p-4 rounded-xl border border-zinc-800">
                        <div className="relative w-full sm:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                            <Input
                                placeholder="搜索标题..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-9 bg-zinc-900 border-zinc-800"
                            />
                        </div>
                        <Select value={filterStatus} onValueChange={setFilterStatus}>
                            <SelectTrigger className="w-full sm:w-32 bg-zinc-900 border-zinc-800">
                                <SelectValue placeholder="状态" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">所有状态</SelectItem>
                                <SelectItem value="Published">已发布</SelectItem>
                                <SelectItem value="Draft">草稿</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={filterCategory} onValueChange={setFilterCategory}>
                            <SelectTrigger className="w-full sm:w-40 bg-zinc-900 border-zinc-800">
                                <SelectValue placeholder="分类" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">所有分类</SelectItem>
                                {categories.map(cat => (
                                    <SelectItem key={cat.id} value={cat.id}>{cat.title}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* List */}
                    <Card className="flex-1 bg-zinc-900 border-zinc-800 flex flex-col overflow-hidden">
                        <CardContent className="flex-1 overflow-y-auto p-0">
                            {loadingPosts ? (
                                <div className="flex justify-center py-10"><Loader2 className="animate-spin text-zinc-500" /></div>
                            ) : filteredPosts.length === 0 ? (
                                <div className="text-center py-20 text-zinc-500">暂无文章</div>
                            ) : (
                                <div className="divide-y divide-zinc-800">
                                    {filteredPosts.map((post) => (
                                        <div key={post.id} className="p-4 hover:bg-zinc-800/50 transition-colors flex items-start justify-between group">
                                            <div className="flex-1 min-w-0 pr-4">
                                                <div className="flex items-center gap-3 mb-1">
                                                    <h3 className="font-medium text-zinc-200 truncate">{post.title}</h3>
                                                    <Badge variant="outline" className={`text-xs ${post.status === 'Published' ? 'border-teal-500/30 text-teal-500 bg-teal-500/10' : 'border-zinc-700 text-zinc-500'}`}>
                                                        {post.status === 'Published' ? '已发布' : '草稿'}
                                                    </Badge>
                                                    <Badge variant="secondary" className="bg-zinc-800 text-zinc-400 text-xs">
                                                        {categories.find(c => c.id === post.category)?.title || post.category}
                                                    </Badge>
                                                </div>
                                                <div className="flex items-center gap-4 text-xs text-zinc-600 font-mono">
                                                    <span>/{post.slug}</span>
                                                    <span>{format(new Date(post.created_at), 'yyyy-MM-dd HH:mm')}</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button variant="ghost" size="icon" onClick={() => handleEditPost(post)} className="h-8 w-8 text-zinc-400 hover:text-teal-400 hover:bg-teal-400/10">
                                                    <Pencil size={18} />
                                                </Button>
                                                <Button variant="ghost" size="icon" onClick={() => handleDeletePost(post.id)} className="h-8 w-8 text-zinc-400 hover:text-red-400 hover:bg-red-400/10">
                                                    <Trash2 size={18} />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* --- CATEGORIES TAB --- */}
                <TabsContent value="categories" className="flex-1 mt-4 overflow-hidden">
                    <Card className="bg-zinc-900 border-zinc-800 h-full flex flex-col">
                        <CardHeader className="py-4 px-6 border-b border-zinc-800">
                            <CardTitle className="text-sm font-medium text-zinc-400">
                                活跃分类
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="flex-1 overflow-y-auto p-4">
                            {loadingCategories ? (
                                <div className="flex justify-center py-10"><Loader2 className="animate-spin text-zinc-500" /></div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {categories.map(cat => {
                                        const Icon = getIcon(cat.icon);
                                        return (
                                            <div key={cat.id} className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 flex items-start justify-between group hover:border-zinc-700 transition-all">
                                                <div className="flex items-start gap-4">
                                                    <div className={`p-2 rounded-lg bg-zinc-900 border border-zinc-800 ${cat.color}`}>
                                                        <Icon size={20} />
                                                    </div>
                                                    <div>
                                                        <h3 className="font-semibold text-zinc-200">{cat.title}</h3>
                                                        <p className="text-xs text-zinc-500 font-mono mt-1">ID: {cat.id}</p>
                                                        <p className="text-xs text-zinc-600 mt-2 line-clamp-2">{cat.description || "暂无描述"}</p>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Button variant="ghost" size="icon" onClick={() => handleEditCategory(cat)} className="h-7 w-7">
                                                        <Pencil size={14} />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" onClick={() => handleDeleteCategory(cat.id)} className="h-7 w-7 text-red-500 hover:text-red-400">
                                                        <Trash2 size={14} />
                                                    </Button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* --- Post Dialog --- */}
            <Dialog open={isPostDialogOpen} onOpenChange={setIsPostDialogOpen}>
                <DialogContent className="bg-zinc-900 border-zinc-800 text-zinc-100 sm:max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{editingPost ? "编辑文章" : "新建文章"}</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-6 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>文章标题</Label>
                                <Input value={postForm.title} onChange={e => setPostForm({ ...postForm, title: e.target.value })} className="bg-zinc-950 border-zinc-800" />
                            </div>
                            <div className="space-y-2">
                                <Label>访问别名 (Slug)</Label>
                                <Input value={postForm.slug} onChange={e => setPostForm({ ...postForm, slug: e.target.value })} placeholder="自动生成" className="bg-zinc-950 border-zinc-800 font-mono" />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>所属分类</Label>
                                <Select value={postForm.category} onValueChange={v => setPostForm({ ...postForm, category: v })}>
                                    <SelectTrigger className="bg-zinc-950 border-zinc-800">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {categories.map(cat => <SelectItem key={cat.id} value={cat.id}>{cat.title}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>发布状态</Label>
                                <div className="flex gap-2">
                                    <Button type="button" variant="outline" className={`flex-1 border-zinc-800 ${postForm.status === 'Draft' ? 'bg-zinc-800' : 'bg-transparent text-zinc-500'}`} onClick={() => setPostForm({ ...postForm, status: 'Draft' })}>草稿</Button>
                                    <Button type="button" variant="outline" className={`flex-1 border-zinc-800 ${postForm.status === 'Published' ? 'bg-teal-900/50 text-teal-400' : 'bg-transparent text-zinc-500'}`} onClick={() => setPostForm({ ...postForm, status: 'Published' })}>已发布</Button>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>文章标签</Label>
                            <Input value={tagsInput} onChange={e => setTagsInput(e.target.value)} className="bg-zinc-950 border-zinc-800" />
                        </div>
                        <div className="space-y-2">
                            <Label>正文内容 (Markdown)</Label>
                            <Textarea value={postForm.content || ""} onChange={e => setPostForm({ ...postForm, content: e.target.value })} className="bg-zinc-950 border-zinc-800 font-mono min-h-[300px]" />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsPostDialogOpen(false)} className="border-zinc-800 text-zinc-300">取消</Button>
                        <Button onClick={handleSavePost} className="bg-teal-600 hover:bg-teal-700 text-white">确定保存</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* --- Category Dialog --- */}
            <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
                <DialogContent className="bg-zinc-900 border-zinc-800 text-zinc-100 sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>{editingCategory ? "编辑分类" : "新建分类"}</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label>ID (唯一标识符)</Label>
                            <Input
                                value={categoryForm.id}
                                onChange={e => setCategoryForm({ ...categoryForm, id: e.target.value })}
                                placeholder="例如：learning, tech"
                                className="bg-zinc-950 border-zinc-800 font-mono"
                                disabled={!!editingCategory} // ID cannot be changed after creation
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label>分类名称</Label>
                            <Input value={categoryForm.title} onChange={e => setCategoryForm({ ...categoryForm, title: e.target.value })} className="bg-zinc-950 border-zinc-800" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label>图标名称 (Lucide)</Label>
                                <Input value={categoryForm.icon} onChange={e => setCategoryForm({ ...categoryForm, icon: e.target.value })} className="bg-zinc-950 border-zinc-800" />
                            </div>
                            <div className="grid gap-2">
                                <Label>排序权重</Label>
                                <Input type="number" value={categoryForm.sort_order} onChange={e => setCategoryForm({ ...categoryForm, sort_order: parseInt(e.target.value) || 0 })} className="bg-zinc-950 border-zinc-800" />
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label>文本颜色 (Tailwind 类)</Label>
                            <Input value={categoryForm.color} onChange={e => setCategoryForm({ ...categoryForm, color: e.target.value })} className="bg-zinc-950 border-zinc-800" placeholder="text-blue-500" />
                        </div>
                        <div className="grid gap-2">
                            <Label>描述</Label>
                            <Textarea value={categoryForm.description || ""} onChange={e => setCategoryForm({ ...categoryForm, description: e.target.value })} className="bg-zinc-950 border-zinc-800 h-20" />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsCategoryDialogOpen(false)} className="border-zinc-800 text-zinc-300">取消</Button>
                        <Button onClick={handleSaveCategory} className="bg-orange-600 hover:bg-orange-700 text-white">保存分类</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
