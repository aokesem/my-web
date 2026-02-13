"use client";

import React from 'react';
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
    ChevronRight
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

export default function MindMapMatrixPage() {
    const router = useRouter();
    const [mindMaps, setMindMaps] = React.useState<any[]>([]);
    const [loading, setLoading] = React.useState(true);

    const [user, setUser] = React.useState<any>(null);
    const [isCreateOpen, setIsCreateOpen] = React.useState(false);
    const [newMapData, setNewMapData] = React.useState({ title: '', id: '', description: '' });
    const [isCreating, setIsCreating] = React.useState(false);

    const fetchMindMaps = React.useCallback(async () => {
        try {
            const { data, error } = await supabase
                .from('mind_maps')
                .select('*')
                .order('sort_order', { ascending: true });

            if (error) throw error;
            setMindMaps(data || []);
        } catch (error) {
            console.error('Error fetching mind maps:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    React.useEffect(() => {
        fetchMindMaps();

        // Check User
        const checkUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);
        };
        checkUser();
    }, [fetchMindMaps]);

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
            fetchMindMaps();
            // Optional: Auto-navigate
            router.push(`/library/mindmap/${newMapData.id}`);
        } catch (err: any) {
            console.error(err);
            toast.error(err.message || "Failed to create.");
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <div className="relative min-h-screen bg-[#fdfbf7] text-slate-800 font-sans selection:bg-orange-100 overflow-x-hidden">
            {/* --- Blueprint Background --- */}
            <div className="fixed inset-0 z-0 opacity-40 pointer-events-none mix-blend-multiply"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.5'/%3E%3C/svg%3E")`,
                }}
            />
            <div className="fixed inset-0 z-0 opacity-[0.08] pointer-events-none"
                style={{
                    backgroundImage: `radial-gradient(#4a4a4a 1.5px, transparent 1.5px)`,
                    backgroundSize: '32px 32px'
                }}
            />
            <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_100%,transparent_0%,rgba(200,220,240,0.2)_100%)] z-0 pointer-events-none" />

            {/* --- Header --- */}
            <header className="relative z-20 max-w-7xl mx-auto px-8 py-16 flex justify-between items-start">
                <div className="space-y-6">
                    <Link
                        href="/library"
                        className="group inline-flex items-center gap-2 px-4 py-1.5 rounded-xl bg-white/60 border border-stone-200/50 hover:bg-white hover:shadow-sm transition-all"
                    >
                        <ArrowLeft size={14} className="text-stone-400 group-hover:text-stone-600" />
                        <span className="text-[10px] font-mono font-bold text-stone-500 uppercase tracking-widest">Return to Room</span>
                    </Link>
                    <div className="space-y-2">
                        <h1 className="text-6xl font-serif font-bold tracking-tighter text-stone-800 leading-none">
                            Mind Map <span className="text-sky-600">Projector</span>
                        </h1>
                        <p className="text-xs font-mono text-stone-400 uppercase tracking-[0.4em] pl-1">
                            Spatial_Logic // Vector_System_v1.0
                        </p>
                    </div>
                </div>

                <div className="flex flex-col items-end gap-3">
                    <button
                        onClick={() => setIsCreateOpen(true)}
                        className="flex items-center gap-2 px-5 py-2.5 bg-stone-800 text-white rounded-xl shadow-lg hover:bg-sky-600 hover:scale-105 transition-all group"
                    >
                        <Zap size={16} className="text-sky-400 group-hover:text-white transition-colors" />
                        <span className="text-xs font-serif font-bold tracking-wider">NEW_CANVAS</span>
                    </button>
                    <div className="px-4 py-2 bg-stone-100 rounded-lg border border-stone-200/60">
                        <span className="text-[10px] font-mono font-bold text-stone-500 uppercase tracking-widest flex items-center gap-2">
                            <Box size={12} /> Active_Canvases: {mindMaps.length}
                        </span>
                    </div>
                </div>
            </header>

            {/* --- Matrix Grid --- */}
            <main className="relative z-10 max-w-7xl mx-auto px-8 pb-40">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {loading ? (
                        <div className="col-span-full flex justify-center py-20 opacity-50">
                            <div className="animate-spin w-8 h-8 border-2 border-stone-300 border-t-stone-500 rounded-full" />
                        </div>
                    ) : mindMaps.length === 0 ? (
                        <div className="col-span-full text-center py-20 text-stone-400 font-mono text-xs uppercase tracking-widest">
                            No Mind Maps Found. Initialize Database...
                        </div>
                    ) : (
                        mindMaps.map((map, idx) => {
                            const Icon = getIconComponent(map.icon);
                            const nodeCount = map.nodes_data?.nodes?.length || 0;

                            return (
                                <motion.div
                                    key={map.id}
                                    initial={{ opacity: 0, x: idx % 2 === 0 ? -20 : 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.1, type: "spring", stiffness: 100 }}
                                    whileHover={{ scale: 1.01 }}
                                    onClick={() => router.push(`/library/mindmap/${map.id}`)}
                                    className="group relative bg-white border border-stone-200/80 rounded-3xl p-10 cursor-pointer overflow-hidden hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] hover:border-sky-200 transition-all duration-500"
                                >
                                    {/* Blueprint ID */}
                                    <div className="absolute top-8 right-10 text-[10px] font-mono text-stone-200 font-bold tracking-widest uppercase">
                                        MAP_UNIT_0{idx + 1}
                                    </div>

                                    {/* Node-like background decoration */}
                                    <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-sky-500/5 rounded-full blur-3xl group-hover:bg-sky-500/10 transition-colors" />

                                    <div className="relative z-10 flex flex-col h-full gap-8">
                                        <div className="flex items-center gap-6">
                                            <div className={`w-16 h-16 rounded-2xl ${map.bg_color || 'bg-stone-50'} ${map.color} flex items-center justify-center group-hover:rotate-12 transition-transform duration-500`}>
                                                <Icon size={32} strokeWidth={1.5} />
                                            </div>
                                            <div>
                                                <h2 className="text-3xl font-serif font-bold text-stone-800 group-hover:text-sky-600 transition-colors">
                                                    {map.title}
                                                </h2>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-[10px] font-mono text-stone-400 uppercase tracking-widest">{map.en_title}</span>
                                                    <div className="w-1 h-1 rounded-full bg-stone-200" />
                                                    <span className="text-[10px] font-mono text-sky-500 font-bold uppercase tracking-widest">{nodeCount} NODES</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="flex items-center gap-4">
                                                <div className="h-px flex-1 bg-stone-100" />
                                                <span className="text-[9px] font-mono text-stone-300 uppercase tracking-[0.2em]">Logical_Protocol</span>
                                                <div className="h-px w-10 bg-stone-100" />
                                            </div>
                                            <p className="text-base text-stone-500 leading-relaxed max-w-md">
                                                {map.description}
                                            </p>
                                        </div>

                                        <div className="mt-auto pt-6 flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className={`px-3 py-1 rounded-full border ${map.status === 'Operational' ? 'border-emerald-100 bg-emerald-50 text-emerald-600' : 'border-stone-100 bg-stone-50 text-stone-400'} text-[9px] font-mono font-bold uppercase tracking-widest`}>
                                                    {map.status}
                                                </div>
                                                <div className="flex -space-x-1.5 opacity-40">
                                                    {[1, 2, 3].map(i => (
                                                        <div key={i} className="w-4 h-4 rounded-full border-2 border-white bg-stone-200" />
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2 text-xs font-mono font-bold text-stone-300 group-hover:text-sky-500 transition-colors uppercase tracking-[0.2em]">
                                                Open_Canvas
                                                <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Stylized L-Corners */}
                                    <div className="absolute top-4 left-4 w-4 h-4 border-t border-l border-stone-100 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <div className="absolute bottom-4 right-4 w-4 h-4 border-b border-r border-stone-100 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </motion.div>
                            );
                        })
                    )}
                </div>
            </main>

            {/* Bottom Tech Overlay */}
            <div className="fixed bottom-10 left-10 z-20 hidden lg:flex flex-col gap-1">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-[2px] bg-sky-500" />
                    <span className="text-[10px] font-mono text-stone-400 font-bold uppercase tracking-[0.4em]">Rendering_Engine: GPU_ACCELERATED</span>
                </div>
                <div className="flex items-center gap-3">
                    <div className="w-6 h-[2px] bg-stone-200" />
                    <span className="text-[10px] font-mono text-stone-300 uppercase tracking-[0.4em]">Spatial_Grid_Sync: 12ms</span>
                </div>
            </div>
            {/* Create Dialog */}
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent className="bg-[#fdfbf7] border-stone-200 sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="font-serif text-2xl text-stone-800">初始化新导图</DialogTitle>
                        <DialogDescription className="font-mono text-xs text-stone-400 uppercase tracking-wider">
                            定义新逻辑空间的参数
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-6 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="title" className="text-xs font-bold text-stone-500 uppercase tracking-widest">项目标题</Label>
                            <Input
                                id="title"
                                placeholder="e.g. Neural Architecture v1"
                                className="bg-white border-stone-200 focus:border-sky-500 font-serif"
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
                                className="bg-stone-50 border-stone-200 font-mono text-xs text-stone-600"
                                value={newMapData.id}
                                onChange={(e) => setNewMapData({ ...newMapData, id: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="desc" className="text-xs font-bold text-stone-500 uppercase tracking-widest">描述</Label>
                            <Input
                                id="desc"
                                placeholder="Brief objective..."
                                className="bg-white border-stone-200 focus:border-sky-500"
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
        </div>
    );
}
