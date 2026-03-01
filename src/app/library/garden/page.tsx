"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import useSWR from 'swr';
import { motion } from 'framer-motion';
import {
    ArrowLeft,
    BookOpen,
    Code,
    Palette,
    Sprout,
    ChevronLeft,
    ChevronRight,
    Loader2,
    Plus,
    Pencil,
    Trash2,
    Eye,
    EyeOff,
    Save,
    X,
    FolderOpen
} from 'lucide-react';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { supabase } from '@/lib/supabaseClient';
import { format } from 'date-fns';
import { toast } from 'sonner';
import * as LucideIcons from "lucide-react";
import { handleHtmlTablePaste } from '@/lib/markdownUtils';

// UI Components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

// ============================================================
// DATA & TYPES
// ============================================================

const PAGE_DELIMITER = '\n\n===PAGE_BREAK===\n\n';

const MARKDOWN_COMPONENTS = {
    h1: ({ node, ...props }: any) => <h1 className="text-[24px] font-serif font-bold mt-8 mb-4 text-stone-800 break-after-avoid" {...props} />,
    h2: ({ node, ...props }: any) => <h2 className="text-[22px] font-serif font-bold mt-6 mb-3 text-stone-800 break-after-avoid" {...props} />,
    h3: ({ node, ...props }: any) => <h3 className="text-[20px] font-serif font-bold mt-5 mb-2 text-stone-700 break-after-avoid" {...props} />,
    p: ({ node, ...props }: any) => <p className="mb-3 text-stone-600 leading-[1.95] break-inside-avoid-column" {...props} />,
    code: ({ node, className, children, ...props }: any) => {
        const isBlock = className?.includes('language-');
        if (isBlock) return <code className="block bg-[#1e293b] text-stone-200 p-4 rounded-lg text-[15px] font-mono my-4 overflow-x-auto break-inside-avoid" {...props}>{children}</code>;
        return <code className="bg-teal-50/80 text-teal-700 px-1.5 py-0.5 rounded text-[15px] border border-teal-100/60" {...props} />;
    },
    img: ({ node, ...props }: any) => <img className="rounded-lg my-4 max-w-full break-inside-avoid shadow-sm border border-stone-200" {...props} alt="" />,
    table: ({ node, ...props }: any) => (
        <div className="overflow-x-auto -mt-4 mb-4 border border-[#ccd8d0] rounded-lg max-w-full">
            <table className="w-full text-left border-collapse text-[14px]" {...props} />
        </div>
    ),
    thead: ({ node, ...props }: any) => <thead className="bg-[#e4ece7]/50 border-b border-[#ccd8d0] text-[#4a6b5a] font-semibold" {...props} />,
    tbody: ({ node, ...props }: any) => <tbody className="divide-y divide-[#d5ddd8] bg-[#eef3f0]" {...props} />,
    tr: ({ node, ...props }: any) => <tr className="hover:bg-[#e4ece7]/30 transition-colors" {...props} />,
    th: ({ node, ...props }: any) => <th className="px-4 py-3 whitespace-nowrap" {...props} />,
    td: ({ node, ...props }: any) => <td className="px-4 py-3 leading-relaxed text-[#5a7a6a]" {...props} />
};

// Fallback if DB is empty
const DEFAULT_BOARDS = [
    { id: 'learning', title: '学习笔记', icon: 'BookOpen' },
    { id: 'programming', title: 'AI与编程', icon: 'Code' },
    { id: 'creative', title: 'AI与创作', icon: 'Palette' },
];

interface Category {
    id: string;
    title: string;
    icon: string;
    sort_order?: number;
}

interface Article {
    id: string;
    slug: string;
    title: string;
    date: string;
    tags: string[];
    content: string;
    category: string;
    status: 'Draft' | 'Published';
    created_at: string;
    published_at: string | null;
}

// ============================================================
// COMPONENT
// ============================================================

export default function GardenPage() {
    // --- Navigation State ---
    const [activeBoard, setActiveBoard] = useState(0);
    const [activeArticle, setActiveArticle] = useState(0);
    const [currentSpread, setCurrentSpread] = useState(0);

    const [isAuthenticated, setIsAuthenticated] = useState(false);

    // --- Data Fetching with SWR ---
    const fetchGardenData = async () => {
        // Step 1: Parallel fetch categories + auth session
        const [catResult, sessionResult] = await Promise.all([
            supabase.from('garden_categories').select('*').order('sort_order', { ascending: true }),
            supabase.auth.getSession()
        ]);

        const loadedCategories = (!catResult.error && catResult.data && catResult.data.length > 0)
            ? catResult.data
            : DEFAULT_BOARDS;

        // Step 2: Fetch posts (depends on session for filtering)
        const isAuth = !!sessionResult.data?.session;
        let query = supabase.from('garden_posts').select('*').order('created_at', { ascending: false });
        if (!isAuth) {
            query = query.eq('status', 'Published');
        }

        const { data: postData, error: postError } = await query;
        if (postError) {
            toast.error("加载文章失败");
            throw postError;
        }

        const grouped: Record<string, Article[]> = {};
        loadedCategories.forEach((c: any) => grouped[c.id] = []);

        postData?.forEach((post: any) => {
            const article: Article = {
                id: post.id,
                slug: post.slug,
                title: post.title,
                date: format(new Date(post.published_at || post.created_at), 'yyyy-MM-dd'),
                tags: post.tags || [],
                content: post.content || '',
                category: post.category,
                status: post.status,
                created_at: post.created_at,
                published_at: post.published_at
            };

            const fallback = loadedCategories[0]?.id || 'learning';
            if (!grouped[post.category]) {
                if (!grouped[fallback]) grouped[fallback] = [];
                grouped[fallback].push(article);
            } else {
                grouped[post.category].push(article);
            }
        });

        return { categories: loadedCategories, articlesMap: grouped };
    };

    const { data: gardenData, isLoading: loading, mutate } = useSWR('garden_data', fetchGardenData, { fallbackData: { categories: [], articlesMap: {} } });
    const categories = gardenData.categories;
    const articlesMap = gardenData.articlesMap;

    // --- References ---
    const contentRef = useRef<HTMLDivElement>(null);
    const bookRef = useRef<HTMLDivElement>(null);

    // --- Computed ---
    // Handle case where categories might be empty during load
    const currentBoard = categories[activeBoard];
    const currentArticles = currentBoard ? (articlesMap[currentBoard.id] || []) : [];
    const currentArticleData = currentArticles[activeArticle];

    // --- CRUD / Editing State ---
    const [isEditing, setIsEditing] = useState(false);
    const [editingArticle, setEditingArticle] = useState<Article | null>(null);
    const [tagsInput, setTagsInput] = useState("");
    const [formData, setFormData] = useState<Partial<Article>>({
        title: "", slug: "", content: "", category: "learning", tags: [], status: "Draft"
    });

    const readPages = currentArticleData ? (currentArticleData.content || '').split(PAGE_DELIMITER) : [];
    if (readPages.length === 0) readPages.push('');
    const readTotalSpreads = Math.max(1, Math.ceil(readPages.length / 2));

    const editPages = (formData.content || '').split(PAGE_DELIMITER);
    if (editPages.length === 0) editPages.push('');
    const editTotalSpreads = Math.max(1, Math.ceil(editPages.length / 2));

    const actualTotalSpreads = isEditing ? editTotalSpreads : readTotalSpreads;

    const updateEditPage = (index: number, newContent: string) => {
        const newPages = [...editPages];
        newPages[index] = newContent;
        setFormData(prev => ({ ...prev, content: newPages.join(PAGE_DELIMITER) }));
    };

    const addEditPage = () => {
        const newPages = [...editPages, ''];
        setFormData(prev => ({ ...prev, content: newPages.join(PAGE_DELIMITER) }));
        if (newPages.length % 2 === 1) {
            setCurrentSpread(Math.floor((newPages.length - 1) / 2));
        }
    };

    // ============================================================
    // EFFECTS
    // ============================================================

    const getIconComponent = (name: string) => {
        return (LucideIcons as any)[name] || FolderOpen;
    };

    // Check Auth
    useEffect(() => {
        const checkAuth = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            setIsAuthenticated(!!session);
        };
        checkAuth();
    }, []);

    // Helper to refresh only articles (after save)
    const refreshArticles = async () => {
        mutate();
    };


    // Calculate spreads
    useEffect(() => {
        if (!isEditing) {
            setCurrentSpread(0);
        }
    }, [activeBoard, activeArticle, isEditing]);

    // Keyboard navigation
    const prevSpread = useCallback(() => {
        setCurrentSpread(s => Math.max(0, s - 1));
    }, []);

    const nextSpread = useCallback(() => {
        setCurrentSpread(s => Math.min(actualTotalSpreads - 1, s + 1));
    }, [actualTotalSpreads]);

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLInputElement) return;
            if (e.key === 'ArrowRight') nextSpread();
            if (e.key === 'ArrowLeft') prevSpread();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [nextSpread, prevSpread]);


    // ============================================================
    // HANDLERS
    // ============================================================

    const selectArticle = (bIdx: number, aIdx: number) => {
        if (isEditing) {
            if (!confirm("Your changes will be lost. Continue?")) return;
            setIsEditing(false);
        }
        setActiveBoard(bIdx);
        setActiveArticle(aIdx);
        setCurrentSpread(0);
    };

    const generateSlug = (title: string) => {
        return title.toLowerCase().replace(/\s+/g, '-').replace(/[^\w\u4e00-\u9fa5-]/g, '') || 'untitled-' + Date.now();
    };

    const handleAdd = () => {
        setEditingArticle(null);
        setFormData({
            title: "",
            slug: "",
            content: "",
            category: currentBoard?.id || categories[0]?.id || 'learning',
            tags: [],
            status: "Draft"
        });
        setTagsInput("");
        setIsEditing(true);
        setCurrentSpread(0);
    };

    const handleEdit = (article: Article) => {
        setEditingArticle(article);
        setFormData({
            title: article.title,
            slug: article.slug,
            content: article.content,
            category: article.category,
            status: article.status,
            tags: article.tags
        });
        setTagsInput(article.tags.join(", "));
        setIsEditing(true);
        setCurrentSpread(0);
    };

    const handleCancelEdit = () => {
        setIsEditing(false);
        setEditingArticle(null);
    };

    const handleSave = async () => {
        if (!formData.title || !formData.content) {
            toast.error("Title and Content are required");
            return;
        }

        const tags = tagsInput.split(/[,，]/).map(t => t.trim()).filter(Boolean);
        let slug = formData.slug?.trim();
        if (!slug) slug = generateSlug(formData.title);

        const payload = {
            ...formData,
            slug,
            tags,
            updated_at: new Date().toISOString(),
            published_at: formData.status === 'Published' && (!editingArticle || !editingArticle.published_at)
                ? new Date().toISOString()
                : (editingArticle?.published_at || null)
        };

        try {
            const promise = editingArticle
                ? supabase.from("garden_posts").update(payload).eq("id", editingArticle.id)
                : supabase.from("garden_posts").insert([payload]);

            const { error } = await promise;
            if (error) throw error;

            toast.success(editingArticle ? "Saved" : "Created");
            setIsEditing(false);
            refreshArticles();
        } catch (e: any) {
            toast.error("Save failed: " + e.message);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Delete this article?")) return;
        try {
            const { error } = await supabase.from("garden_posts").delete().eq("id", id);
            if (error) throw error;
            toast.success("Deleted");
            if (activeArticle > 0) setActiveArticle(a => a - 1);
            refreshArticles();
        } catch (e: any) {
            toast.error("Delete failed: " + e.message);
        }
    };


    // ============================================================
    // RENDER
    // ============================================================

    if (loading) {
        return (
            <div className="h-screen flex items-center justify-center bg-[#eef3f0] text-slate-800">
                <Loader2 size={32} className="animate-spin text-teal-600" />
            </div>
        );
    }

    return (
        <div className="h-screen flex flex-col bg-[#eef3f0] text-slate-800 font-sans selection:bg-teal-200/40 overflow-hidden">
            {/* ===== TOP BAR ===== */}
            <header className="flex-none flex items-center justify-between px-5 h-11 bg-[#2d3d35] text-white/80 z-30 select-none">
                <div className="flex items-center gap-4">
                    <Link href="/library" className="group flex items-center gap-1.5 hover:text-white transition-colors">
                        <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
                        <span className="text-[10px] font-mono font-bold uppercase tracking-widest">Library</span>
                    </Link>
                    <div className="w-px h-4 bg-white/15" />
                    <Sprout size={16} className="text-teal-400" />
                    <span className="text-sm font-serif tracking-wide">Digital <span className="text-teal-400">Garden</span></span>
                </div>

                <div className="flex items-center gap-4">
                    {isAuthenticated && !isEditing && (
                        <div className="flex items-center gap-2">
                            <Link href="/admin/library/garden" className="h-7 flex items-center text-[12px] bg-white/5 hover:bg-white/10 text-white/70 border border-white/10 hover:border-white/30 gap-1.5 px-3 rounded-md transition-all">
                                <FolderOpen size={13} /> Admin
                            </Link>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 text-[12px] bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 border border-teal-500/30 gap-1.5 px-3"
                                onClick={handleAdd}
                            >
                                <Plus size={13} /> New Note
                            </Button>
                        </div>
                    )}

                    {!isEditing && (
                        <>
                            <div className="w-px h-4 bg-white/15" />
                            <span className="text-sm font-mono tracking-wider text-white/50">{currentSpread + 1} / {actualTotalSpreads}</span>
                        </>
                    )}
                </div>
            </header>

            {/* ===== MAIN BODY ===== */}
            <div className="flex-1 flex min-h-0">

                {/* --- SIDEBAR --- */}
                <aside className={`flex-none w-56 bg-[#e4ece7] border-r border-[#ccd8d0] flex flex-col overflow-hidden select-none transition-opacity ${isEditing ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
                    <div className="px-4 py-3 border-b border-[#ccd8d0]">
                        <span className="text-[12px] font-mono font-bold uppercase tracking-[0.2em] text-[#6b8a7a]">目录</span>
                    </div>

                    <nav className="flex-1 overflow-y-auto py-1 custom-scrollbar">
                        {categories.map((board, bIdx) => {
                            const boardArticles = articlesMap[board.id] || [];
                            const Icon = getIconComponent(board.icon);

                            return (
                                <div key={board.id} className="mb-1">
                                    <div className="px-4 py-2 mt-2 flex items-center gap-2">
                                        <Icon size={14} className="text-[#6b8a7a]" />
                                        <span className="text-[13px] font-extrabold text-[#4a6b5a] uppercase tracking-wider">{board.title}</span>
                                    </div>

                                    {boardArticles.length === 0 ? (
                                        <div className="px-4 py-1 text-[10px] text-stone-400 italic pl-8">暂无文章</div>
                                    ) : (
                                        boardArticles.map((article, aIdx) => {
                                            const isActive = bIdx === activeBoard && aIdx === activeArticle && !(!editingArticle && isEditing);
                                            return (
                                                <button
                                                    key={article.id}
                                                    onClick={() => selectArticle(bIdx, aIdx)}
                                                    className={`
                                                        w-full text-left px-4 pl-8 py-2 text-[14px] leading-snug transition-colors group relative
                                                        ${isActive
                                                            ? 'bg-[#d0ddd5] text-[#2d4a3a] font-semibold'
                                                            : 'text-[#5a7a6a] hover:bg-[#dae6df] hover:text-[#3a5a4a]'
                                                        }
                                                    `}
                                                >
                                                    <span className="truncate block pr-2">{article.title}</span>
                                                    {article.status === 'Draft' && (
                                                        <span className="absolute right-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-amber-400" title="Draft" />
                                                    )}
                                                </button>
                                            );
                                        })
                                    )}
                                </div>
                            );
                        })}
                    </nav>
                </aside>

                {/* --- MAIN CONTENT --- */}
                <main className="flex-1 flex flex-col min-w-0 bg-[#eef3f0]">
                    {isEditing ? (
                        <div className="flex-1 flex flex-col h-full overflow-hidden">
                            {/* Editor Toolbar */}
                            <div className="flex-none px-8 py-4 border-b border-[#d5ddd8] bg-[#eef3f0] flex items-center justify-between">
                                <div className="flex items-center gap-4 flex-1 mr-8">
                                    <Input
                                        value={formData.title}
                                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                                        className="text-xl font-serif font-bold bg-transparent border-transparent hover:border-[#ccd8d0] focus:border-[#teal-400] px-2 h-auto py-1 shadow-none transition-all placeholder:text-stone-300"
                                        placeholder="Enter Title..."
                                    />
                                    <Badge variant={formData.status === 'Published' ? 'default' : 'secondary'} className="cursor-pointer select-none shrink-0" onClick={() => setFormData({ ...formData, status: formData.status === 'Published' ? 'Draft' : 'Published' })}>
                                        {formData.status}
                                    </Badge>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button variant="ghost" size="sm" onClick={handleCancelEdit} className="text-stone-500 hover:bg-stone-200">
                                        <X size={16} className="mr-1" /> Cancel
                                    </Button>
                                    <Button size="sm" onClick={handleSave} className="bg-teal-600 hover:bg-teal-700 text-white shadow-sm">
                                        <Save size={16} className="mr-1" /> Save
                                    </Button>
                                </div>
                            </div>

                            {/* Editor Configuration Row */}
                            <div className="flex-none px-10 py-3 bg-[#e4ece7]/50 border-b border-[#d5ddd8] grid grid-cols-3 gap-4">
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-mono text-stone-500 uppercase tracking-widest w-16">Category</span>
                                    <Select
                                        value={formData.category}
                                        onValueChange={v => setFormData({ ...formData, category: v })}
                                    >
                                        <SelectTrigger className="h-7 text-xs bg-white border-[#ccd8d0]">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {categories.map(b => (
                                                <SelectItem key={b.id} value={b.id}>{b.title}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="flex items-center gap-2 col-span-2">
                                    <span className="text-[10px] font-mono text-stone-500 uppercase tracking-widest w-16">Tags</span>
                                    <Input
                                        value={tagsInput}
                                        onChange={e => setTagsInput(e.target.value)}
                                        className="h-7 text-xs bg-white border-[#ccd8d0]"
                                        placeholder="Comma separated tags..."
                                    />
                                </div>
                            </div>
                            {/* Dual Page Editor Area */}
                            <div className="flex-1 p-8 overflow-hidden flex flex-col">
                                <div className="flex-1 max-w-6xl w-full mx-auto grid grid-cols-2 gap-8 relative">
                                    {/* Center line */}
                                    <div className="absolute top-4 bottom-4 left-1/2 w-px bg-[#b8c9bf] z-10 pointer-events-none" />

                                    {/* Left Page (Index: currentSpread * 2) */}
                                    <div className="h-full flex flex-col">
                                        <Textarea
                                            value={editPages[currentSpread * 2] || ""}
                                            onChange={e => updateEditPage(currentSpread * 2, e.target.value)}
                                            onPaste={e => handleHtmlTablePaste(e, e.currentTarget, (val) => updateEditPage(currentSpread * 2, val))}
                                            className="flex-1 bg-white/50 border-[#ccd8d0] focus:bg-white focus:ring-teal-500/20 font-mono text-sm leading-relaxed resize-none p-6 shadow-sm rounded-xl transition-all"
                                            placeholder="# Left page..."
                                        />
                                    </div>

                                    {/* Right Page (Index: currentSpread * 2 + 1) */}
                                    <div className="h-full flex flex-col">
                                        {editPages.length > currentSpread * 2 + 1 ? (
                                            <Textarea
                                                value={editPages[currentSpread * 2 + 1] || ""}
                                                onChange={e => updateEditPage(currentSpread * 2 + 1, e.target.value)}
                                                onPaste={e => handleHtmlTablePaste(e, e.currentTarget, (val) => updateEditPage(currentSpread * 2 + 1, val))}
                                                className="flex-1 bg-white/50 border-[#ccd8d0] focus:bg-white focus:ring-teal-500/20 font-mono text-sm leading-relaxed resize-none p-6 shadow-sm rounded-xl transition-all"
                                                placeholder="# Right page..."
                                            />
                                        ) : (
                                            <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-[#ccd8d0] rounded-xl bg-white/20 gap-3">
                                                <Button variant="ghost" onClick={addEditPage} className="text-[#6b8a7a] hover:bg-white/50 hover:text-teal-700">
                                                    <Plus size={16} className="mr-2" /> Add Next Page
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                {/* Editor Paging Controls */}
                                <div className="flex-none flex items-center justify-between mt-4">
                                    <button onClick={() => setCurrentSpread(s => Math.max(0, s - 1))} disabled={currentSpread === 0} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-mono text-[#6b8a7a] hover:bg-[#dae6df] disabled:opacity-25 transition-colors">
                                        <ChevronLeft size={16} /> Prev Spread
                                    </button>
                                    <div className="flex items-center gap-4">
                                        <span className="text-[10px] font-mono text-[#8aaa9a] tracking-[0.2em]">SPREAD {currentSpread + 1} / {editTotalSpreads}</span>
                                        {editPages.length % 2 === 0 && currentSpread === editTotalSpreads - 1 && (
                                            <Button variant="outline" size="sm" onClick={addEditPage} className="h-7 text-xs border-[#ccd8d0] text-[#6b8a7a]">
                                                <Plus size={12} className="mr-1" /> New Spread
                                            </Button>
                                        )}
                                    </div>
                                    <button onClick={() => setCurrentSpread(s => Math.min(editTotalSpreads - 1, s + 1))} disabled={currentSpread >= editTotalSpreads - 1} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-mono text-[#6b8a7a] hover:bg-[#dae6df] disabled:opacity-25 transition-colors">
                                        Next Spread <ChevronRight size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* Reader View */}
                            {currentArticleData ? (
                                <>
                                    <div className="flex-none px-10 py-4 border-b border-[#d5ddd8] bg-[#eef3f0]/80">
                                        <motion.div
                                            key={`${activeBoard}-${activeArticle}`}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ duration: 0.25 }}
                                            className="flex items-start justify-between"
                                        >
                                            <div>
                                                <h1 className="text-2xl font-serif font-bold text-stone-800 flex items-center gap-3">
                                                    {currentArticleData.title}
                                                    {currentArticleData.status === 'Draft' && <Badge variant="secondary" className="text-[10px] bg-amber-100 text-amber-700">DRAFT</Badge>}
                                                </h1>
                                                <div className="flex items-center gap-3 mt-2">
                                                    <span className="text-[12px] font-mono text-stone-400">{currentArticleData.date}</span>
                                                    <div className="flex gap-1.5">
                                                        {currentArticleData.tags.map(tag => (
                                                            <span key={tag} className="px-1.5 py-0.5 rounded bg-teal-50 text-teal-600 text-[9px] font-mono font-bold tracking-wider border border-teal-100/60">
                                                                {tag}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>

                                            {isAuthenticated && (
                                                <div className="flex items-center gap-1 bg-white/50 p-1 rounded-lg border border-white/60 shadow-sm">
                                                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-stone-500 hover:text-teal-600" onClick={() => handleEdit(currentArticleData)}>
                                                        <Pencil size={14} />
                                                    </Button>
                                                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-stone-500 hover:text-red-600" onClick={() => handleDelete(currentArticleData.id)}>
                                                        <Trash2 size={14} />
                                                    </Button>
                                                </div>
                                            )}
                                        </motion.div>
                                    </div>
                                    <div className="flex-1 relative min-h-0">
                                        <div ref={bookRef} className="absolute inset-0 overflow-hidden">
                                            <div className="absolute top-4 bottom-4 left-1/2 w-px bg-[#b8c9bf] z-10 pointer-events-none" />
                                            <motion.div
                                                ref={contentRef}
                                                key={`content-${activeBoard}-${activeArticle}-${currentSpread}`}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ duration: 0.3 }}
                                                className="h-full px-10 py-8 grid grid-cols-2 gap-20"
                                            >
                                                {/* Left Page */}
                                                <div className="text-[16px] text-stone-600 leading-[1.95] overflow-y-auto custom-scrollbar pr-4 [&>*:first-child]:mt-0">
                                                    <ReactMarkdown remarkPlugins={[remarkGfm]} components={MARKDOWN_COMPONENTS}>
                                                        {readPages[currentSpread * 2]?.replace(/\n(?!\n)/g, '  \n') || ''}
                                                    </ReactMarkdown>
                                                </div>

                                                {/* Right Page */}
                                                <div className="text-[16px] text-stone-600 leading-[1.95] overflow-y-auto custom-scrollbar pr-4 pl-4 [&>*:first-child]:mt-0">
                                                    {readPages.length > currentSpread * 2 + 1 && (
                                                        <ReactMarkdown remarkPlugins={[remarkGfm]} components={MARKDOWN_COMPONENTS}>
                                                            {readPages[currentSpread * 2 + 1]?.replace(/\n(?!\n)/g, '  \n') || ''}
                                                        </ReactMarkdown>
                                                    )}
                                                </div>
                                            </motion.div>
                                        </div>
                                    </div>
                                    <div className="flex-none flex items-center justify-between px-6 py-2 border-t border-[#d5ddd8] bg-[#eef3f0]/80">
                                        <button onClick={prevSpread} disabled={currentSpread === 0} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-mono text-[#6b8a7a] hover:bg-[#dae6df] disabled:opacity-25 transition-colors">
                                            <ChevronLeft size={16} /> Prev
                                        </button>
                                        <div className="text-[9px] font-mono text-[#8aaa9a] tracking-[0.2em]">GARDEN_SYS // READER</div>
                                        <button onClick={nextSpread} disabled={currentSpread >= actualTotalSpreads - 1} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-mono text-[#6b8a7a] hover:bg-[#dae6df] disabled:opacity-25 transition-colors">
                                            Next <ChevronRight size={16} />
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <div className="flex-1 flex flex-col items-center justify-center text-stone-400">
                                    <p>{Object.values(articlesMap).flat().length > 0 ? "Select a note" : "Empty Garden"}</p>
                                    {isAuthenticated && <Button variant="outline" onClick={handleAdd} className="mt-4 gap-2 border-dashed"> <Plus size={16} /> Write </Button>}
                                </div>
                            )}
                        </>
                    )}
                </main>
            </div>
        </div>
    );
}
