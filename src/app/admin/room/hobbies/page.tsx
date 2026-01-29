"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trash2, Plus, Cpu, Pencil, Save } from 'lucide-react';
import { toast } from 'sonner';

export default function HobbiesPage() {
    const [hobbies, setHobbies] = useState<any[]>([]);
    const [form, setForm] = useState({ category: "knowledge", name: "", description: "", level: 1 });
    const [editingId, setEditingId] = useState<number | null>(null);

    const fetchHobbies = async () => {
        const { data } = await supabase.from('profile_hobbies').select('*').order('category', { ascending: true }).order('level', { ascending: false });
        if (data) setHobbies(data);
    };

    useEffect(() => { fetchHobbies(); }, []);

    const handleSave = async () => {
        if (!form.name) return toast.warning("Name required");

        if (editingId) {
            const { error } = await supabase.from('profile_hobbies').update(form).eq('id', editingId);
            if (!error) { toast.success("Updated"); cancelEdit(); fetchHobbies(); }
        } else {
            const { error } = await supabase.from('profile_hobbies').insert(form);
            if (!error) { setForm({ ...form, name: "", description: "" }); fetchHobbies(); toast.success("Added"); }
        }
    };

    const startEdit = (h: any) => {
        setEditingId(h.id);
        setForm({ category: h.category, name: h.name, description: h.description, level: h.level });
    };

    const cancelEdit = () => {
        setEditingId(null);
        setForm({ category: "knowledge", name: "", description: "", level: 1 });
    };

    const deleteHobby = async (id: number) => {
        if (!confirm("Delete?")) return;
        const { error } = await supabase.from('profile_hobbies').delete().eq('id', id);
        if (!error) { fetchHobbies(); toast.success("Deleted"); if (editingId === id) cancelEdit(); }
    };

    return (
        <div className="space-y-6 text-zinc-200">
            <div className="flex items-center gap-2 mb-6">
                <div className="p-2 bg-zinc-900 rounded-lg border border-zinc-800"><Cpu size={20} className="text-zinc-400" /></div>
                <h1 className="text-2xl font-bold tracking-tight">爱好档案 (Hobbies)</h1>
            </div>

            <div className={`grid grid-cols-1 md:grid-cols-6 gap-4 items-end bg-zinc-900/30 p-5 rounded-xl border ${editingId ? 'border-blue-900/50' : 'border-zinc-800'}`}>
                <div className="space-y-2 md:col-span-1"><label className="text-xs font-bold text-zinc-500 uppercase">Category</label>
                    <select className="flex h-10 w-full rounded-md border border-zinc-800 bg-black px-3 py-2 text-sm text-zinc-300" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                        <option value="knowledge">Knowledge</option><option value="sports">Sports</option><option value="arts">Arts</option><option value="acgn">ACGN</option>
                    </select>
                </div>
                <div className="space-y-2 md:col-span-1"><label className="text-xs font-bold text-zinc-500 uppercase">Name</label>
                    <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="bg-black border-zinc-800 text-zinc-300" />
                </div>
                <div className="space-y-2 md:col-span-2"><label className="text-xs font-bold text-zinc-500 uppercase">Desc</label>
                    <Input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="bg-black border-zinc-800 text-zinc-300" />
                </div>
                <div className="space-y-2 md:col-span-1"><label className="text-xs font-bold text-zinc-500 uppercase">Level</label>
                    <select className="flex h-10 w-full rounded-md border border-zinc-800 bg-black px-3 py-2 text-sm text-zinc-300" value={form.level} onChange={e => setForm({ ...form, level: parseInt(e.target.value) })}>
                        <option value={1}>Lv.1</option><option value={2}>Lv.2</option><option value={3}>Lv.3</option><option value={4}>Lv.4</option>
                    </select>
                </div>
                <div className="md:col-span-1 flex gap-2">
                    {editingId ? (
                        <>
                            <Button onClick={handleSave} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"><Save size={16} /></Button>
                            <Button onClick={cancelEdit} variant="secondary" className="px-3"><span className="text-xs">X</span></Button>
                        </>
                    ) : (
                        <Button onClick={handleSave} className="w-full bg-white text-black hover:bg-zinc-200"><Plus size={16} className="mr-2" /> Add</Button>
                    )}
                </div>
            </div>

            <div className="border border-zinc-800 rounded-lg overflow-hidden">
                <Table>
                    <TableHeader><TableRow className="bg-zinc-900/50 border-zinc-800"><TableHead>Cat</TableHead><TableHead>Name</TableHead><TableHead>Desc</TableHead><TableHead>Lv</TableHead><TableHead className="text-right">Act</TableHead></TableRow></TableHeader>
                    <TableBody>
                        {hobbies.map((h) => (
                            <TableRow key={h.id} className={`border-zinc-800 hover:bg-zinc-900/30 ${editingId === h.id ? 'bg-zinc-900/80' : ''}`}>
                                <TableCell className="uppercase text-xs text-zinc-500">{h.category}</TableCell>
                                <TableCell className="font-bold text-zinc-300">{h.name}</TableCell>
                                <TableCell className="text-zinc-500 text-sm truncate max-w-[200px]">{h.description}</TableCell>
                                <TableCell>{h.level}</TableCell>
                                <TableCell className="text-right space-x-2">
                                    <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-white" onClick={() => startEdit(h)}><Pencil size={14} /></Button>
                                    <Button variant="ghost" size="sm" className="text-red-900 hover:text-red-400" onClick={() => deleteHobby(h.id)}><Trash2 size={14} /></Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}