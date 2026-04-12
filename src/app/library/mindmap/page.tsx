"use client";

import React from 'react';
import useSWR from 'swr';
import { motion } from 'framer-motion';
import {
    ArrowLeft,
    Share2,
    Map as MapIcon,
    Compass,
    Zap,
    Coffee,
    Activity,
    Box,
    ChevronRight,
    Plus,
    Pencil,
    Trash2,
    Save,
    X
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { supabase } from '@/lib/supabaseClient';
import { getIconComponent } from '@/lib/iconMap';
import { toast } from 'sonner';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

import { MindMapCard } from './components/MindMapCard';
import { CreateNewCard } from './components/CreateNewCard';

export default function MindMapMatrixPage() {
    const router = useRouter();
    // SWR Data Fetching
    const { data: mindMaps = [], isLoading: loading, mutate } = useSWR('mind_maps', async () => {
        const { data, error } = await supabase
            .from('mind_maps')
            .select('*')
            .order('sort_order', { ascending: true });
        if (error) throw error;
        return data || [];
    });

    const setMindMaps = (updater: any) => mutate(updater, false);

    const [user, setUser] = React.useState<any>(null);
    const [checkingUser, setCheckingUser] = React.useState(true);
    const [isCreateOpen, setIsCreateOpen] = React.useState(false);
    const [newMapData, setNewMapData] = React.useState({ title: '', id: '', description: '' });
    const [isCreating, setIsCreating] = React.useState(false);

    const [isDeleteOpen, setIsDeleteOpen] = React.useState(false);
    const [mapToDelete, setMapToDelete] = React.useState<any>(null);
    const [isDeleting, setIsDeleting] = React.useState(false);

    const [isEditOpen, setIsEditOpen] = React.useState(false);
    const [mapToEdit, setMapToEdit] = React.useState<any>(null);
    const [editMapData, setEditMapData] = React.useState({ title: '', en_title: '', description: '', icon: '', status: '' });
    const [isUpdating, setIsUpdating] = React.useState(false);

    React.useEffect(() => {
        // Check User
        const checkUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);
            setCheckingUser(false);
        };
        checkUser();
    }, []);

    const handleCreate = async () => {
        if (!newMapData.title || !newMapData.id) {
            toast.error("Title and ID are required.");
            return;
        }
        if (!user) {
            toast.error("Please sign in to create maps.");
            return;
        }

        setIsCreating(true);
        try {
            const { error } = await supabase.from('mind_maps').insert([{
                id: newMapData.id,
                title: newMapData.title,
                description: newMapData.description || 'New Logic Canvas',
                icon: 'Zap',
                color: 'text-stone-500',
                status: 'Draft',
                sort_order: mindMaps.length + 1
            }]);

            if (error) throw error;

            toast.success("Mind Map created.");
            setIsCreateOpen(false);
            setNewMapData({ title: '', id: '', description: '' });
            mutate(); // Re-fetch data
            router.push(`/library/mindmap/${newMapData.id}`);
        } catch (err: any) {
            console.error(err);
            toast.error(err.message || "Failed to create.");
        } finally {
            setIsCreating(false);
        }
    };

    const confirmDelete = async () => {
        if (!mapToDelete) return;

        setIsDeleting(true);
        try {
            const { error } = await supabase
                .from('mind_maps')
                .delete()
                .eq('id', mapToDelete.id);

            if (error) throw error;

            toast.success("Mind Map deleted.");
            mutate((prev: any[] | undefined) => (prev || []).filter((m: any) => m.id !== mapToDelete.id), false);
            setIsDeleteOpen(false);
        } catch (err: any) {
            console.error(err);
            toast.error(err.message || "Failed to delete.");
        } finally {
            setIsDeleting(false);
        }
    };

    const handleEditOpen = (map: any) => {
        setMapToEdit(map);
        setEditMapData({
            title: map.title || '',
            en_title: map.en_title || '',
            description: map.description || '',
            icon: map.icon || 'Zap',
            status: map.status || 'Draft'
        });
        setIsEditOpen(true);
    };

    const confirmEdit = async () => {
        if (!mapToEdit) return;
        setIsUpdating(true);
        try {
            const { error } = await supabase
                .from('mind_maps')
                .update({
                    title: editMapData.title,
                    en_title: editMapData.en_title,
                    description: editMapData.description,
                    icon: editMapData.icon,
                    status: editMapData.status,
                })
                .eq('id', mapToEdit.id);

            if (error) throw error;
            toast.success("Mind Map updated.");
            setIsEditOpen(false);
            mutate(); // Re-fetch data
        } catch (err: any) {
            console.error(err);
            toast.error(err.message || "Failed to update.");
        } finally {
            setIsUpdating(false);
        }
    };

    return (
        <div className="relative min-h-screen bg-stone-50 text-slate-800 font-sans selection:bg-sky-100 overflow-x-hidden">
            {/* --- Simplistic Studio Background --- */}
            <div className="fixed inset-0 z-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] bg-size-[24px_24px] opacity-40 pointer-events-none" />
            <div className="fixed inset-0 bg-linear-to-b from-white via-transparent to-stone-50/80 z-0 pointer-events-none" />

            {/* --- Header --- */}
            <header className="relative z-20 max-w-7xl mx-auto px-6 py-12 flex justify-between items-end">
                <div className="space-y-4">
                    <Link
                        href="/library"
                        className="group inline-flex items-center gap-2 text-stone-400 hover:text-sky-600 transition-colors"
                    >
                        <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
                        <span className="text-[10px] font-mono font-bold uppercase tracking-[0.2em]">Exit to Library</span>
                    </Link>
                    <div className="space-y-1">
                        <h1 className="text-4xl font-serif font-bold tracking-tight text-stone-800">
                            MindMap <span className="text-sky-600">Studio</span>
                        </h1>
                        <p className="text-[10px] font-mono text-stone-400 uppercase tracking-[0.3em]">
                            Productivity_Workbench v2.0
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="hidden sm:flex px-4 py-1.5 bg-white rounded-full border border-stone-200 shadow-sm items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="text-[10px] font-mono font-bold text-stone-500 uppercase tracking-wider">
                            Sync_Connected: {mindMaps.length} Canvases
                        </span>
                    </div>
                </div>
            </header>

            {/* --- Studio Grid --- */}
            <main className="relative z-10 max-w-7xl mx-auto px-6 pb-20">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {loading || checkingUser ? (
                        Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="h-48 bg-white/50 animate-pulse rounded-2xl border border-stone-100" />
                        ))
                    ) : (
                        <>
                            {/* Create New Trigger - renders alongside data cards with idx 0 */}
                            {user && (
                                <CreateNewCard idx={0} onClick={() => setIsCreateOpen(true)} />
                            )}
                            {mindMaps.map((map, idx) => (
                                <MindMapCard
                                    key={map.id}
                                    idx={idx + 1}
                                    map={map}
                                    user={user}
                                    onOpen={() => router.push(`/library/mindmap/${map.id}`)}
                                    onEdit={() => handleEditOpen(map)}
                                    onDelete={() => {
                                        setMapToDelete(map);
                                        setIsDeleteOpen(true);
                                    }}
                                />
                            ))}
                        </>
                    )}
                </div>
            </main>

            {/* Minimal Info Bar */}
            <div className="fixed bottom-6 left-6 z-20 hidden md:flex items-center gap-4">
                <span className="text-[9px] font-mono text-stone-300 uppercase tracking-widest">Workspace_Status: Active</span>
                <div className="w-px h-3 bg-stone-200" />
                <span className="text-[9px] font-mono text-stone-300 uppercase tracking-widest">Engine: Vector_Core_v2</span>
            </div>
            {/* Create Dialog */}
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent className="bg-white border-stone-200 sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="font-serif text-2xl text-stone-800">New MindMap Canvas</DialogTitle>
                        <DialogDescription className="font-mono text-[10px] text-stone-400 uppercase tracking-wider">
                            Define parameters for a new logical space
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-6 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="title" className="text-xs font-bold text-stone-500 uppercase tracking-widest">项目标题</Label>
                            <Input
                                id="title"
                                placeholder="e.g. Neural Architecture v1"
                                className="bg-white border-stone-200 focus:border-sky-500 font-serif text-stone-900"
                                value={newMapData.title}
                                onChange={(e) => {
                                    const title = e.target.value;
                                    // Auto-generate ID if empty or matches previous auto-gen
                                    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                                    setNewMapData(prev => ({ ...prev, title, id: slug }));
                                }}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="id" className="text-xs font-bold text-stone-500 uppercase tracking-widest">系统ID (Slug)</Label>
                            <Input
                                id="id"
                                placeholder="neural-architecture-v1"
                                className="bg-stone-50 border-stone-200 font-mono text-xs text-stone-900"
                                value={newMapData.id}
                                onChange={(e) => setNewMapData({ ...newMapData, id: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="desc" className="text-xs font-bold text-stone-500 uppercase tracking-widest">描述</Label>
                            <Input
                                id="desc"
                                placeholder="Brief objective..."
                                className="bg-white border-stone-200 focus:border-sky-500 text-stone-900"
                                value={newMapData.description}
                                onChange={(e) => setNewMapData({ ...newMapData, description: e.target.value })}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsCreateOpen(false)} className="text-stone-500 hover:text-stone-800">Cancel</Button>
                        <Button onClick={handleCreate} disabled={isCreating} className="bg-stone-800 hover:bg-sky-600 text-white transition-colors">
                            {isCreating ? 'Initializing...' : 'Create_Canvas'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Dialog */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent className="bg-white border-stone-200 sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="font-serif text-2xl text-stone-800">Edit Map Settings</DialogTitle>
                        <DialogDescription className="font-mono text-[10px] text-stone-400 uppercase tracking-wider">
                            Modifying configuration for [ {mapToEdit?.id} ]
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-6 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-bold text-stone-500 uppercase tracking-widest">中文标题</Label>
                                <Input
                                    value={editMapData.title}
                                    onChange={e => setEditMapData({ ...editMapData, title: e.target.value })}
                                    className="bg-white border-stone-200 focus:border-sky-500 font-serif text-stone-900"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-bold text-stone-500 uppercase tracking-widest">英文标题</Label>
                                <Input
                                    value={editMapData.en_title}
                                    onChange={e => setEditMapData({ ...editMapData, en_title: e.target.value })}
                                    className="bg-white border-stone-200 focus:border-sky-500 font-mono text-xs text-stone-900"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-bold text-stone-500 uppercase tracking-widest">描述信息</Label>
                            <Input
                                value={editMapData.description}
                                onChange={e => setEditMapData({ ...editMapData, description: e.target.value })}
                                className="bg-white border-stone-200 focus:border-sky-500 text-stone-900"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-bold text-stone-500 uppercase tracking-widest">图标名 (Lucide)</Label>
                                <Input
                                    value={editMapData.icon}
                                    onChange={e => setEditMapData({ ...editMapData, icon: e.target.value })}
                                    className="bg-white border-stone-200 focus:border-sky-500 font-mono text-xs text-stone-900"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-bold text-stone-500 uppercase tracking-widest">发布状态</Label>
                                <select
                                    value={editMapData.status}
                                    onChange={e => setEditMapData({ ...editMapData, status: e.target.value })}
                                    className="w-full h-10 px-3 rounded-md border border-stone-200 bg-white text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                                >
                                    <option value="Draft">Draft</option>
                                    <option value="Operational">Operational</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsEditOpen(false)} disabled={isUpdating}>取消</Button>
                        <Button onClick={confirmEdit} disabled={isUpdating} className="bg-stone-800 hover:bg-sky-600 text-white">
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
                            此操作不可逆。确定要销毁逻辑空间 [ {mapToDelete?.title} ] 吗？
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
