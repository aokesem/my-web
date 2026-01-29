"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trash2, Plus, GitCommitHorizontal } from 'lucide-react';
import { toast } from 'sonner';

export default function TimelinePage() {
    const [items, setItems] = useState<any[]>([]);
    const [form, setForm] = useState({ title: "", date: "", type: "knowledge" });

    const fetchItems = async () => {
        const { data } = await supabase.from('profile_timeline').select('*').order('date', { ascending: false });
        if (data) setItems(data);
    };

    useEffect(() => { fetchItems(); }, []);

    const addItem = async () => {
        if (!form.title || !form.date) return toast.warning("Missing fields");
        const { error } = await supabase.from('profile_timeline').insert(form);
        if (!error) {
            setForm({ title: "", date: "", type: "knowledge" });
            fetchItems();
            toast.success("Event added");
        }
    };

    const deleteItem = async (id: number) => {
        if (!confirm("Delete?")) return;
        const { error } = await supabase.from('profile_timeline').delete().eq('id', id);
        if (!error) { fetchItems(); toast.success("Deleted"); }
    };

    return (
        <div className="space-y-6 text-zinc-200">
            <div className="flex items-center gap-2 mb-6">
                <div className="p-2 bg-zinc-900 rounded-lg border border-zinc-800"><GitCommitHorizontal size={20} className="text-zinc-400" /></div>
                <h1 className="text-2xl font-bold tracking-tight">时间线管理 (Timeline)</h1>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end bg-zinc-900/30 p-5 rounded-xl border border-zinc-800">
                <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Date</label>
                    <Input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className="bg-black border-zinc-800 text-zinc-300 focus-visible:ring-zinc-700" />
                </div>
                <div className="space-y-2 md:col-span-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Title</label>
                    <Input placeholder="Event title..." value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="bg-black border-zinc-800 text-zinc-300 placeholder:text-zinc-700 focus-visible:ring-zinc-700" />
                </div>
                <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Type</label>
                    <select
                        className="flex h-10 w-full rounded-md border border-zinc-800 bg-black px-3 py-2 text-sm text-zinc-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-700"
                        value={form.type}
                        onChange={e => setForm({ ...form, type: e.target.value })}
                    >
                        <option value="knowledge">Knowledge</option>
                        <option value="social">Social</option>
                        <option value="arts">Arts</option>
                    </select>
                </div>
                <Button onClick={addItem} className="md:col-span-4 w-full bg-white text-black hover:bg-zinc-200"><Plus size={16} className="mr-2" /> Add to Timeline</Button>
            </div>

            <div className="border border-zinc-800 rounded-lg overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-zinc-900/50 hover:bg-zinc-900/50 border-zinc-800">
                            <TableHead className="w-[120px] text-zinc-500">Date</TableHead>
                            <TableHead className="text-zinc-400">Title</TableHead>
                            <TableHead className="text-zinc-400">Type</TableHead>
                            <TableHead className="text-right text-zinc-500">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {items.map((item) => (
                            <TableRow key={item.id} className="border-zinc-800 hover:bg-zinc-900/30">
                                <TableCell className="font-mono text-zinc-500">{item.date}</TableCell>
                                <TableCell className="font-bold text-zinc-300">{item.title}</TableCell>
                                <TableCell>
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border
                                        ${item.type === 'knowledge' ? 'bg-blue-950/30 text-blue-400 border-blue-900/50' :
                                            item.type === 'social' ? 'bg-rose-950/30 text-rose-400 border-rose-900/50' : 'bg-emerald-950/30 text-emerald-400 border-emerald-900/50'}
                                    `}>
                                        {item.type}
                                    </span>
                                </TableCell>
                                <TableCell className="text-right">
                                    <Button variant="ghost" size="sm" className="text-red-900 hover:text-red-400 hover:bg-red-950/30" onClick={() => deleteItem(item.id)}>
                                        <Trash2 size={16} />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}