"use client";

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
    ArrowLeft,
    Archive,
    LayoutGrid,
    Search
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { getIconComponent } from '@/lib/iconMap';
import { toast } from 'sonner';
import {
    Pencil,
    Trash2,
    Plus,
    X,
    Save
} from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";



export default function PromptWarehousePage() {
    const router = useRouter();
    const [categories, setCategories] = useState<any[]>([]);
    const [promptCounts, setPromptCounts] = useState<Record<string, number>>({});
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<any>(null);

    // Edit/Delete States
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [catToEdit, setCatToEdit] = useState<any>(null);
    const [editData, setEditData] = useState({ title: '', en_title: '', description: '', icon: '', status: '', color: '', bg: '' });
    const [isUpdating, setIsUpdating] = useState(false);

    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [catToDelete, setCatToDelete] = useState<any>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const fetchCategories = React.useCallback(async () => {
        try {
            // 1. Fetch Categories
            const { data: cats, error: catError } = await supabase
                .from('prompt_categories')
                .select('*')
                .order('sort_order', { ascending: true });

            if (catError) throw catError;
            setCategories(cats || []);

            // 2. Fetch Prompt Counts
            const { data: prompts, error: promptError } = await supabase
                .from('prompts')
                .select('category_id');

            if (promptError) throw promptError;

            const counts = (prompts || []).reduce((acc: Record<string, number>, curr: any) => {
                acc[curr.category_id] = (acc[curr.category_id] || 0) + 1;
                return acc;
            }, {});
            setPromptCounts(counts);

        } catch (error) {
            console.error('Error fetching data:', error);
            toast.error("Failed to load categories");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchCategories();

        // Check Auth
        const checkUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);
        };
        checkUser();
    }, [fetchCategories]);

    const handleEditOpen = (cat: any) => {
        setCatToEdit(cat);
        setEditData({
            title: cat.title || '',
            en_title: cat.en_title || '',
            description: cat.description || '',
            icon: cat.icon || 'Zap',
            status: cat.status || 'Operational',
            color: cat.color || 'text-orange-500',
            bg: cat.bg || 'bg-orange-50'
        });
        setIsEditOpen(true);
    };

    const confirmEdit = async () => {
        if (!catToEdit) return;
        setIsUpdating(true);
        try {
            const { error } = await supabase
                .from('prompt_categories')
                .update({
                    title: editData.title,
                    en_title: editData.en_title,
                    description: editData.description,
                    icon: editData.icon,
                    status: editData.status,
                    color: editData.color,
                    bg: editData.bg
                })
                .eq('id', catToEdit.id);

            if (error) throw error;
            toast.success("Category updated");
            setIsEditOpen(false);
            fetchCategories();
        } catch (err: any) {
            console.error(err);
            toast.error(err.message || "Failed to update");
        } finally {
            setIsUpdating(false);
        }
    };

    const confirmDelete = async () => {
        if (!catToDelete) return;
        setIsDeleting(true);
        try {
            const { error } = await supabase
                .from('prompt_categories')
                .delete()
                .eq('id', catToDelete.id);

            if (error) throw error;
            toast.success("Category deleted");
            setCategories(prev => prev.filter(c => c.id !== catToDelete.id));
            setIsDeleteOpen(false);
        } catch (err: any) {
            console.error(err);
            toast.error(err.message || "Failed to delete");
        } finally {
            setIsDeleting(false);
        }
    };

    // Loading Skeleton
    if (loading) {
        return (
            <div className="min-h-screen bg-[#fdfbf7] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4 animate-pulse">
                    <div className="w-12 h-12 bg-stone-200 rounded-full" />
                    <div className="h-4 w-32 bg-stone-200 rounded" />
                </div>
            </div>
        );
    }

    return (
        <div className="relative min-h-screen bg-[#fdfbf7] text-slate-800 font-sans selection:bg-orange-100 overflow-x-hidden">
            {/* --- White Canvas Background (Shared Logic) --- */}
            <div className="fixed inset-0 z-0 opacity-40 pointer-events-none mix-blend-multiply"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.5'/%3E%3C/svg%3E")`,
                }}
            />
            <div className="fixed inset-0 z-0 opacity-[0.08] pointer-events-none"
                style={{
                    backgroundImage: `radial-gradient(#4a4a4a 1px, transparent 1px)`,
                    backgroundSize: '24px 24px'
                }}
            />
            <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_50%,transparent_0%,rgba(240,230,220,0.4)_100%)] z-0 pointer-events-none" />

            {/* --- Header --- */}
            <header className="relative z-20 max-w-7xl mx-auto px-8 py-12 flex justify-between items-end">
                <div className="space-y-4">
                    <Link
                        href="/library"
                        className="group inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/60 border border-stone-200/50 hover:bg-white hover:shadow-sm transition-all"
                    >
                        <ArrowLeft size={14} className="text-stone-400 group-hover:text-stone-600" />
                        <span className="text-[10px] font-mono font-bold text-stone-500 uppercase tracking-widest">Back to Library</span>
                    </Link>
                    <div className="space-y-1">
                        <h1 className="text-5xl font-serif font-bold tracking-tight text-stone-800">
                            Prompt <span className="text-orange-600">Warehouse</span>
                        </h1>
                        <p className="text-sm font-mono text-stone-400 uppercase tracking-[0.2em]">
                            System_Control // Logic_Matrix_v2.0
                        </p>
                    </div>
                </div>

                <div className="flex flex-col items-end gap-6 h-full justify-between">
                    <div className="flex items-center gap-4 bg-stone-100/50 p-1.5 rounded-xl border border-stone-200/40 backdrop-blur-sm">
                        <div className="px-3 py-1 bg-white rounded-lg shadow-sm border border-stone-200/60">
                            <span className="text-[10px] font-mono font-bold text-orange-600 uppercase tracking-widest items-center flex gap-1.5">
                                <LayoutGrid size={10} /> Matrix_Mode
                            </span>
                        </div>
                        <div className="px-3 py-1 flex items-center gap-2 text-stone-400 opacity-50 hover:opacity-100 transition-opacity cursor-pointer">
                            <Search size={14} />
                            <span className="text-[10px] font-mono font-bold uppercase tracking-widest">Global_Search</span>
                        </div>
                    </div>
                </div>
            </header>

            {/* --- Category Matrix (Task Manager Style) --- */}
            <main className="relative z-10 max-w-7xl mx-auto px-8 pb-32">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {categories.map((cat, idx) => {
                        const Icon = getIconComponent(cat.icon);
                        return (
                            <motion.div
                                key={cat.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                whileHover={{ y: -4 }}
                                onClick={() => router.push(`/library/prompt/${cat.id}`)}
                                className="group relative bg-white/60 backdrop-blur-md border border-stone-200/60 rounded-2xl overflow-hidden cursor-pointer hover:bg-white hover:shadow-xl hover:shadow-orange-900/5 hover:border-orange-200/50 transition-all duration-300"
                            >
                                {/* Blueprint ID Marker */}
                                <div className="absolute top-0 right-0 px-3 py-1 bg-stone-100 rounded-bl-xl border-l border-b border-stone-200/40">
                                    <span className="text-[9px] font-mono text-stone-400 font-bold uppercase tracking-tighter">IDX_0{idx + 1}</span>
                                </div>

                                <div className="p-8 h-full flex flex-col">
                                    <div className="flex items-start justify-between mb-8">
                                        <div className={`p-4 rounded-2xl ${cat.bg || 'bg-stone-50'} ${cat.color} group-hover:scale-110 transition-transform duration-500`}>
                                            <Icon size={28} strokeWidth={1.5} />
                                        </div>
                                        <div className="text-right">
                                            <div className={`text-[10px] font-mono font-bold uppercase tracking-[0.2em] mb-1 ${cat.status === 'Operational' ? 'text-emerald-500' : 'text-stone-400'}`}>
                                                ● {cat.status}
                                            </div>
                                            <span className="text-[8px] font-mono text-stone-300 uppercase">{promptCounts[cat.id] || 0} ITEMS</span>
                                        </div>
                                    </div>

                                    <div className="space-y-4 flex-1">
                                        <div>
                                            <h2 className="text-2xl font-serif font-bold text-stone-800 group-hover:text-orange-600 transition-colors">
                                                {cat.title}
                                            </h2>
                                            <p className="text-[10px] font-mono text-stone-400 uppercase tracking-widest mt-1">
                                                {cat.en_title}
                                            </p>
                                        </div>

                                        <div className="h-px w-full bg-stone-100" />

                                        <p className="text-sm text-stone-500 leading-relaxed font-medium">
                                            {cat.description}
                                        </p>
                                    </div>

                                    <div className="mt-8 flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="flex gap-1">
                                                {[1, 2, 3].map(i => (
                                                    <div key={i} className="w-6 h-1 rounded-full bg-stone-100 group-hover:bg-orange-100 transition-colors" />
                                                ))}
                                            </div>
                                            {user && (
                                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleEditOpen(cat);
                                                        }}
                                                        className="p-1.5 rounded-lg text-stone-300 hover:text-orange-500 hover:bg-orange-50 transition-all"
                                                        title="Edit"
                                                    >
                                                        <Pencil size={14} />
                                                    </button>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setCatToDelete(cat);
                                                            setIsDeleteOpen(true);
                                                        }}
                                                        className="p-1.5 rounded-lg text-stone-300 hover:text-red-500 hover:bg-red-50 transition-all"
                                                        title="Delete"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 text-xs font-mono font-bold text-stone-300 group-hover:text-orange-500 transition-colors">
                                            ENTER_MODULE
                                            <div className="w-5 h-5 rounded-full border border-stone-200 flex items-center justify-center group-hover:border-orange-500 group-hover:translate-x-1 transition-all">
                                                <ArrowLeft size={10} className="rotate-180" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </main>

            {/* --- Technical Sidebar Detail --- */}
            <div className="fixed right-6 bottom-6 z-20 flex flex-col items-end gap-2 text-[10px] font-mono text-stone-300 select-none">
                <span>COORD_X: 1024.00</span>
                <span>COORD_Y: 768.42</span>
                <span className="text-stone-400 font-bold mt-2 tracking-[0.3em]">SCHEME_B // MATRIX_CANVAS</span>
            </div>

            {/* Edit Dialog */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent className="bg-[#fdfbf7] border-stone-200 sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="font-serif text-2xl text-stone-800">编辑分类信息</DialogTitle>
                        <DialogDescription className="font-mono text-xs text-stone-400 uppercase tracking-wider">
                            正在修改 [ {catToEdit?.id} ] 的外观配置
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-6 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-bold text-stone-500 uppercase tracking-widest">中文标题</Label>
                                <Input
                                    value={editData.title}
                                    onChange={e => setEditData({ ...editData, title: e.target.value })}
                                    className="bg-white border-stone-200 focus:border-orange-500 font-serif"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-bold text-stone-500 uppercase tracking-widest">代码标识 (en_title)</Label>
                                <Input
                                    value={editData.en_title}
                                    onChange={e => setEditData({ ...editData, en_title: e.target.value })}
                                    className="bg-white border-stone-200 focus:border-orange-500 font-mono text-xs"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-bold text-stone-500 uppercase tracking-widest">描述信息</Label>
                            <Input
                                value={editData.description}
                                onChange={e => setEditData({ ...editData, description: e.target.value })}
                                className="bg-white border-stone-200 focus:border-orange-500"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-bold text-stone-500 uppercase tracking-widest">图标名 (Lucide)</Label>
                                <Input
                                    value={editData.icon}
                                    onChange={e => setEditData({ ...editData, icon: e.target.value })}
                                    className="bg-white border-stone-200 focus:border-orange-500 font-mono text-xs"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-bold text-stone-500 uppercase tracking-widest">发布状态</Label>
                                <select
                                    value={editData.status}
                                    onChange={e => setEditData({ ...editData, status: e.target.value })}
                                    className="w-full h-10 px-3 rounded-md border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                                >
                                    <option value="Operational">Operational</option>
                                    <option value="Maintenance">Maintenance</option>
                                    <option value="Draft">Draft</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsEditOpen(false)} disabled={isUpdating}>取消</Button>
                        <Button onClick={confirmEdit} disabled={isUpdating} className="bg-stone-800 hover:bg-orange-600 text-white">
                            {isUpdating ? 'Saving...' : '保存更改'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                <DialogContent className="bg-white border-stone-200 sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="font-serif text-2xl text-stone-800">确认删除</DialogTitle>
                        <DialogDescription className="font-mono text-xs text-stone-400 uppercase tracking-wider">
                            此操作不可逆。确定要销毁提示词分类 [ {catToDelete?.title} ] 吗？
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button
                            variant="ghost"
                            onClick={() => setIsDeleteOpen(false)}
                            className="text-stone-500 hover:text-stone-800"
                            disabled={isDeleting}
                        >
                            取消
                        </Button>
                        <Button
                            onClick={confirmDelete}
                            disabled={isDeleting}
                            className="bg-red-500 hover:bg-red-600 text-white transition-colors"
                        >
                            {isDeleting ? 'Deleting...' : '确认销毁'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
