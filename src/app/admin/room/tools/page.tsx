"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trash2, Plus, Wrench, Pencil, Save } from 'lucide-react';
import { toast } from 'sonner';

export default function ToolsPage() {
    const [tools, setTools] = useState<any[]>([]);
    const [form, setForm] = useState({
        name: "", tagline: "", usage_text: "", url: "",
        simple_icon: "/images/icons/simple/default.png",
        colorful_icon: "/images/icons/colorful/default.png",
        sort_order: 0
    });
    const [editingId, setEditingId] = useState<number | null>(null);

    const fetchTools = async () => {
        const { data } = await supabase.from('profile_tools').select('*').order('sort_order');
        if (data) setTools(data);
    };

    useEffect(() => { fetchTools(); }, []);

    const handleSave = async () => {
        if (!form.name) return toast.warning("Name required");

        if (editingId) {
            const { error } = await supabase.from('profile_tools').update(form).eq('id', editingId);
            if (!error) { toast.success("Updated"); cancelEdit(); fetchTools(); }
        } else {
            const { error } = await supabase.from('profile_tools').insert(form);
            if (!error) {
                setForm({ ...form, name: "", tagline: "", usage_text: "", sort_order: tools.length + 1 });
                fetchTools(); toast.success("Added");
            }
        }
    };

    const startEdit = (t: any) => {
        setEditingId(t.id);
        setForm({
            name: t.name, tagline: t.tagline, usage_text: t.usage_text, url: t.url,
            simple_icon: t.simple_icon, colorful_icon: t.colorful_icon, sort_order: t.sort_order
        });
    };

    const cancelEdit = () => {
        setEditingId(null);
        setForm({ name: "", tagline: "", usage_text: "", url: "", simple_icon: "/images/icons/simple/default.png", colorful_icon: "/images/icons/colorful/default.png", sort_order: 0 });
    };

    const deleteTool = async (id: number) => {
        if (!confirm("Delete?")) return;
        const { error } = await supabase.from('profile_tools').delete().eq('id', id);
        if (!error) { fetchTools(); toast.success("Deleted"); if (editingId === id) cancelEdit(); }
    };

    return (
        <div className="space-y-6 text-zinc-200">
            <div className="flex items-center gap-2 mb-6">
                <div className="p-2 bg-zinc-900 rounded-lg border border-zinc-800"><Wrench size={20} className="text-zinc-400" /></div>
                <h1 className="text-2xl font-bold tracking-tight">工具箱管理 (Tools)</h1>
            </div>

            <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 items-start bg-zinc-900/30 p-5 rounded-xl border ${editingId ? 'border-blue-900/50' : 'border-zinc-800'}`}>
                <div className="space-y-3">
                    <div className="grid grid-cols-4 gap-2">
                        <div className="col-span-3"><label className="text-xs font-bold text-zinc-500 uppercase">Name</label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="bg-black border-zinc-800 text-zinc-300" /></div>
                        <div><label className="text-xs font-bold text-zinc-500 uppercase">Sort</label><Input type="number" value={form.sort_order} onChange={e => setForm({ ...form, sort_order: parseInt(e.target.value) })} className="bg-black border-zinc-800 text-zinc-300" /></div>
                    </div>
                    <div><label className="text-xs font-bold text-zinc-500 uppercase">Tagline</label><Input value={form.tagline} onChange={e => setForm({ ...form, tagline: e.target.value })} className="bg-black border-zinc-800 text-zinc-300" /></div>
                    <div><label className="text-xs font-bold text-zinc-500 uppercase">URL</label><Input value={form.url} onChange={e => setForm({ ...form, url: e.target.value })} className="bg-black border-zinc-800 text-zinc-300" /></div>
                </div>
                <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                        <div><label className="text-xs font-bold text-zinc-500 uppercase">Simple Icon</label><Input value={form.simple_icon} onChange={e => setForm({ ...form, simple_icon: e.target.value })} className="bg-black border-zinc-800 text-zinc-300 text-xs" /></div>
                        <div><label className="text-xs font-bold text-zinc-500 uppercase">Color Icon</label><Input value={form.colorful_icon} onChange={e => setForm({ ...form, colorful_icon: e.target.value })} className="bg-black border-zinc-800 text-zinc-300 text-xs" /></div>
                    </div>
                    <div><label className="text-xs font-bold text-zinc-500 uppercase">Usage</label><Textarea value={form.usage_text} onChange={e => setForm({ ...form, usage_text: e.target.value })} className="bg-black border-zinc-800 text-zinc-300 h-[82px] resize-none" /></div>
                </div>
                <div className="md:col-span-2">
                    {editingId ? (
                        <div className="flex gap-2">
                            <Button onClick={handleSave} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"><Save size={16} className="mr-2" /> Update Tool</Button>
                            <Button onClick={cancelEdit} variant="secondary">Cancel</Button>
                        </div>
                    ) : (
                        <Button onClick={handleSave} className="w-full bg-white text-black hover:bg-zinc-200 mt-2"><Plus size={16} className="mr-2" /> Add Tool</Button>
                    )}
                </div>
            </div>

            <div className="border border-zinc-800 rounded-lg overflow-hidden">
                <Table>
                    <TableHeader><TableRow className="bg-zinc-900/50 border-zinc-800"><TableHead>Sort</TableHead><TableHead>Name</TableHead><TableHead>Tagline</TableHead><TableHead>Usage</TableHead><TableHead className="text-right">Act</TableHead></TableRow></TableHeader>
                    <TableBody>
                        {tools.map((t) => (
                            <TableRow key={t.id} className={`border-zinc-800 hover:bg-zinc-900/30 ${editingId === t.id ? 'bg-zinc-900/80' : ''}`}>
                                <TableCell className="text-zinc-500">{t.sort_order}</TableCell>
                                <TableCell className="font-bold text-zinc-300">{t.name}</TableCell>
                                <TableCell className="text-zinc-400 text-sm">{t.tagline}</TableCell>
                                <TableCell className="text-zinc-600 text-xs truncate max-w-[150px]">{t.usage_text}</TableCell>
                                <TableCell className="text-right space-x-2">
                                    <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-white" onClick={() => startEdit(t)}><Pencil size={14} /></Button>
                                    <Button variant="ghost" size="sm" className="text-red-900 hover:text-red-400" onClick={() => deleteTool(t.id)}><Trash2 size={14} /></Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}