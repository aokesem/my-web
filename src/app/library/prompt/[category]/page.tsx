"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
    ArrowLeft,
    Copy,
    Check,
    ChevronLeft,
    ChevronRight,
    Archive,
    Pencil,
    X,
    Save
} from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import { supabase } from '@/lib/supabaseClient';
import { getIconComponent } from '@/lib/iconMap';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

// === Mock Data (To be replaced by Supabase later) ===



export default function CategoryDetailPage() {
    const params = useParams();
    const router = useRouter();
    const categoryId = params.category as string;

    const [category, setCategory] = useState<any>(null);
    const [prompts, setPrompts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const [copiedId, setCopiedId] = useState<number | null>(null);
    const [bookmarkOpen, setBookmarkOpen] = useState(true);

    // Edit Mode State
    const [user, setUser] = useState<any>(null);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editForm, setEditForm] = useState<{ name: string, content: string }>({ name: '', content: '' });

    // Check Auth
    React.useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user || null);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user || null);
        });

        return () => subscription.unsubscribe();
    }, []);

    // Fetch Data
    React.useEffect(() => {
        const fetchData = async () => {
            try {
                // 1. Fetch Category Info
                const { data: catData, error: catError } = await supabase
                    .from('prompt_categories')
                    .select('*')
                    .eq('id', categoryId)
                    .single();

                if (catError) {
                    console.error('Category not found:', catError);
                    // Handle 404 or redirect? For now just log
                    setLoading(false);
                    return;
                }
                setCategory(catData);

                // 2. Fetch Prompts
                const { data: promptList, error: promptError } = await supabase
                    .from('prompts')
                    .select('*')
                    .eq('category_id', categoryId)
                    .order('sort_order', { ascending: true });

                if (promptError) throw promptError;
                setPrompts(promptList || []);

            } catch (error) {
                console.error('Error loading detail:', error);
            } finally {
                setLoading(false);
            }
        };

        if (categoryId) {
            fetchData();
        }
    }, [categoryId]);

    const handleCopy = (id: number, content: string) => {
        navigator.clipboard.writeText(content);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const startEditing = (prompt: any) => {
        setEditingId(prompt.id);
        setEditForm({ name: prompt.name, content: prompt.content });
    };

    const cancelEditing = () => {
        setEditingId(null);
        setEditForm({ name: '', content: '' });
    };

    const saveEditing = async (id: number) => {
        try {
            const { error } = await supabase
                .from('prompts')
                .update({
                    name: editForm.name,
                    content: editForm.content,
                    updated_at: new Date().toISOString()
                })
                .eq('id', id);

            if (error) throw error;

            // Update local state
            setPrompts(prev => prev.map(p => p.id === id ? { ...p, ...editForm } : p));
            toast.success('Prompt updated successfully');
            setEditingId(null);
        } catch (error) {
            console.error('Update failed:', error);
            toast.error('Failed to update prompt');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#fdfbf7] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4 animate-pulse">
                    <div className="w-16 h-16 bg-stone-200 rounded-2xl rotate-3" />
                    <div className="h-4 w-40 bg-stone-200 rounded" />
                </div>
            </div>
        );
    }

    if (!category) {
        return (
            <div className="min-h-screen bg-[#fdfbf7] flex items-col justify-center pt-40">
                <div className="text-stone-400 font-mono">Category Not Found</div>
            </div>
        );
    }

    const Icon = getIconComponent(category.icon);

    return (
        <div className="relative min-h-screen bg-[#fdfbf7] text-slate-800 selection:bg-orange-100 font-sans">
            {/* Background Texture */}
            <div className="fixed inset-0 z-0 opacity-40 pointer-events-none mix-blend-multiply"
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.5'/%3E%3C/svg%3E")` }}
            />
            <div className="fixed inset-0 z-0 opacity-[0.05] pointer-events-none"
                style={{ backgroundImage: `radial-gradient(#4a4a4a 1px, transparent 1px)`, backgroundSize: '32px 32px' }}
            />

            {/* --- Left Bookmark Nav --- */}
            {prompts.length > 0 && (
                <nav className="fixed left-0 top-24 z-30 hidden lg:flex items-stretch">
                    {/* Orange accent edge - self-stretch to match content height */}
                    <div className="w-1.5 bg-linear-to-b from-orange-400 via-orange-500 to-amber-500 rounded-r-sm shrink-0" />

                    {/* Content panel - always in DOM, width animates */}
                    <motion.div
                        animate={{ width: bookmarkOpen ? 'auto' : 0, opacity: bookmarkOpen ? 1 : 0 }}
                        initial={false}
                        transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
                        className="overflow-hidden"
                    >
                        <div className="py-4 px-5 pr-8 bg-white/75 backdrop-blur-md border-y border-r border-stone-200/50 rounded-r-2xl shadow-[4px_4px_20px_-6px_rgba(0,0,0,0.08)] min-w-[210px]">
                            {/* Category label */}
                            <div className="flex items-center gap-2 text-[15px] font-bold text-orange-500 mb-3">
                                <Icon size={17} />
                                <span className="tracking-wide whitespace-nowrap">{category.title}</span>
                            </div>

                            {/* Prompt links */}
                            <div className="border-t border-stone-100/60 pt-2 space-y-0.5">
                                {prompts.map((prompt, idx) => (
                                    <a
                                        key={prompt.id}
                                        href={`#prompt-${prompt.id}`}
                                        className="group/item flex items-center gap-2.5 px-2 py-2 text-[15px] text-stone-500 hover:text-orange-600 rounded-lg transition-all hover:bg-orange-50/50 whitespace-nowrap"
                                        title={prompt.name}
                                    >
                                        <span className="w-6 text-[13px] font-mono text-stone-300 group-hover/item:text-orange-400 transition-colors shrink-0">
                                            {String(idx + 1).padStart(2, '0')}
                                        </span>
                                        <span className="truncate max-w-[170px]">{prompt.name}</span>
                                    </a>
                                ))}
                            </div>
                        </div>
                    </motion.div>

                    {/* Toggle button - always visible, full circle */}
                    <button
                        onClick={() => setBookmarkOpen(!bookmarkOpen)}
                        className="ml-2 w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm border border-stone-200/50 shadow-md flex items-center justify-center text-stone-400 hover:text-orange-500 hover:border-orange-300 hover:shadow-lg transition-all self-center"
                    >
                        {bookmarkOpen ? <ChevronLeft size={22} /> : <ChevronRight size={22} />}
                    </button>
                </nav>
            )}

            {/* Header Area */}
            <header className="relative z-10 max-w-5xl mx-auto px-8 pt-16 pb-12">
                <Link
                    href="/library/prompt"
                    className="group inline-flex items-center gap-2 mb-8 text-stone-400 hover:text-stone-800 transition-colors"
                >
                    <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                    <span className="text-xs font-mono font-bold uppercase tracking-widest">Back to Warehouse</span>
                </Link>

                <div className="flex items-center gap-6">
                    <div className={`p-5 rounded-3xl bg-white shadow-sm border border-stone-100 ${category.color}`}>
                        <Icon size={32} />
                    </div>
                    <div>
                        <h1 className="text-4xl font-serif font-bold text-stone-800">{category.title}</h1>
                        <p className="text-sm font-mono text-stone-400 mt-1 uppercase tracking-widest">Module // {categoryId}_protocol</p>
                    </div>
                </div>
            </header>

            {/* Content List */}
            <main className="relative z-10 max-w-5xl mx-auto px-8 pb-32">
                <div className="grid grid-cols-1 gap-12">
                    {prompts.length > 0 ? (
                        prompts.map((prompt) => (
                            <motion.section
                                key={prompt.id}
                                id={`prompt-${prompt.id}`}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="group relative scroll-mt-8"
                            >
                                <div className="flex items-center justify-between mb-4">
                                    {editingId === prompt.id ? (
                                        <div className="flex-1 mr-4">
                                            <Input
                                                value={editForm.name}
                                                onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                                                className="font-serif font-bold text-lg bg-white/80"
                                            />
                                        </div>
                                    ) : (
                                        <h2 className="text-xl font-serif font-bold text-stone-700 flex items-center gap-3">
                                            <div className="w-1.5 h-6 bg-orange-500 rounded-full" />
                                            {prompt.name}
                                        </h2>
                                    )}

                                    <div className="flex items-center gap-2">
                                        {user && editingId !== prompt.id && (
                                            <button
                                                onClick={() => startEditing(prompt)}
                                                className="p-1.5 rounded-lg text-stone-400 hover:text-orange-500 hover:bg-orange-50 transition-colors"
                                                title="Edit Prompt"
                                            >
                                                <Pencil size={14} />
                                            </button>
                                        )}
                                        {/* Copy Button (only show if not editing) */}
                                        {editingId !== prompt.id && (
                                            <button
                                                onClick={() => handleCopy(prompt.id, prompt.content)}
                                                className={`
                                                    flex items-center gap-2 px-4 py-1.5 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider transition-all
                                                    ${copiedId === prompt.id
                                                        ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200'
                                                        : 'bg-white text-stone-400 border border-stone-200 hover:border-orange-300 hover:text-orange-500 shadow-sm'}
                                                `}
                                            >
                                                {copiedId === prompt.id ? <Check size={12} /> : <Copy size={12} />}
                                                {copiedId === prompt.id ? 'Copied' : 'Copy_Prompt'}
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {editingId === prompt.id ? (
                                    <div className="relative rounded-2xl bg-white border border-orange-200 shadow-lg p-6">
                                        <Textarea
                                            value={editForm.content}
                                            onChange={(e) => setEditForm(prev => ({ ...prev, content: e.target.value }))}
                                            className="min-h-[400px] font-mono text-sm leading-relaxed bg-stone-50/50 mb-4"
                                            placeholder="Markdown content..."
                                        />
                                        <div className="flex justify-end gap-3">
                                            <Button variant="ghost" size="sm" onClick={cancelEditing} className="text-stone-500 hover:text-stone-800">
                                                Cancel
                                            </Button>
                                            <Button size="sm" onClick={() => saveEditing(prompt.id)} className="bg-orange-500 hover:bg-orange-600 text-white gap-2">
                                                <Save size={14} /> Save Changes
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="relative rounded-2xl bg-white/70 backdrop-blur-sm border border-stone-100 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] group-hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.08)] transition-all overflow-hidden">
                                        {/* Decoration Lines */}
                                        <div className="absolute top-0 bottom-0 left-8 w-px bg-stone-100/50 hidden md:block" />

                                        <div className="p-8 md:pl-16 prose prose-stone max-w-none">
                                            <div className="font-mono text-sm text-stone-600 leading-relaxed wrap-break-word whitespace-pre-wrap selection:bg-orange-200">
                                                <ReactMarkdown
                                                    components={{
                                                        h1: ({ node, ...props }) => <h1 className="text-2xl font-serif font-bold mt-6 mb-4 text-stone-800" {...props} />,
                                                        h2: ({ node, ...props }) => <h2 className="text-xl font-serif font-bold mt-5 mb-3 text-stone-700" {...props} />,
                                                        h3: ({ node, ...props }) => <h3 className="text-lg font-serif font-bold mt-4 mb-2 text-stone-600" {...props} />,
                                                        code: ({ node, ...props }) => <code className="bg-stone-50 text-orange-600 px-1.5 py-0.5 rounded border border-stone-200" {...props} />,
                                                        strong: ({ node, ...props }) => <strong className="text-stone-800 font-black" {...props} />,
                                                        ul: ({ node, ...props }) => <ul className="list-disc pl-5 my-4 space-y-2" {...props} />,
                                                        li: ({ node, ...props }) => <li className="text-stone-500" {...props} />,
                                                    }}
                                                >
                                                    {prompt.content}
                                                </ReactMarkdown>
                                            </div>
                                        </div>

                                        {/* Bottom Tech Bar */}
                                        <div className="px-8 py-3 bg-stone-50/50 border-t border-stone-100 flex justify-between items-center text-[9px] font-mono text-stone-300">
                                            <span>ENCODING: UTF-8</span>
                                            <span>STATUS: ACTIVE</span>
                                        </div>
                                    </div>
                                )}
                            </motion.section>
                        ))
                    ) : (
                        <div className="flex flex-col items-center justify-center py-32 border-2 border-dashed border-stone-200 rounded-3xl opacity-40">
                            <Archive size={48} className="mb-4 text-stone-300" />
                            <p className="font-mono text-sm tracking-widest uppercase">No Modules Loaded_</p>
                        </div>
                    )}
                </div>
            </main>

            {/* Floating Navigation Indicator - hidden when sidebar is visible */}
            <div className="fixed left-8 bottom-8 z-20 pointer-events-none md:block lg:hidden hidden">
                <div className="h-24 w-px bg-stone-200 ml-2" />
                <div className="text-[10px] font-mono text-stone-300 rotate-90 origin-left mt-4 uppercase tracking-[0.3em]">
                    Reading_Flow // Category: {categoryId}
                </div>
            </div>
        </div>
    );
}
