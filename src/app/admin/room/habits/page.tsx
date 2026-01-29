"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trash2, Plus, ListTodo, Pencil, Save } from 'lucide-react';
import { toast } from 'sonner';

export default function HabitsPage() {
    const [habits, setHabits] = useState<any[]>([]);
    const [form, setForm] = useState({ label: "", key: "default", sort_order: 0 });
    const [editingId, setEditingId] = useState<number | null>(null);

    const fetchHabits = async () => {
        const { data } = await supabase.from('profile_habits').select('*').order('sort_order');
        if (data) setHabits(data);
    };

    useEffect(() => { fetchHabits(); }, []);

    const handleSave = async () => {
        if (!form.label) return toast.warning("Label required");

        if (editingId) {
            const { error } = await supabase.from('profile_habits').update(form).eq('id', editingId);
            if (!error) {
                toast.success("Habit updated");
                cancelEdit();
                fetchHabits();
            }
        } else {
            const { error } = await supabase.from('profile_habits').insert(form);
            if (!error) {
                setForm({ label: "", key: "default", sort_order: habits.length + 1 });
                fetchHabits();
                toast.success("Habit added");
            }
        }
    };

    const startEdit = (h: any) => {
        setEditingId(h.id);
        setForm({ label: h.label, key: h.key, sort_order: h.sort_order });
    };

    const cancelEdit = () => {
        setEditingId(null);
        setForm({ label: "", key: "default", sort_order: 0 });
    };

    const deleteHabit = async (id: number) => {
        if (!confirm("Delete?")) return;
        const { error } = await supabase.from('profile_habits').delete().eq('id', id);
        if (!error) { fetchHabits(); toast.success("Deleted"); if (editingId === id) cancelEdit(); }
    };

    return (
        <div className="space-y-6 text-zinc-200">
            <div className="flex items-center gap-2 mb-6">
                <div className="p-2 bg-zinc-900 rounded-lg border border-zinc-800"><ListTodo size={20} className="text-zinc-400" /></div>
                <h1 className="text-2xl font-bold tracking-tight">习惯配置 (Habits)</h1>
            </div>

            <div className={`flex gap-4 items-end bg-zinc-900/30 p-5 rounded-xl border ${editingId ? 'border-blue-900/50' : 'border-zinc-800'}`}>
                <div className="space-y-2 flex-1"><label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Label</label>
                    <Input value={form.label} onChange={e => setForm({ ...form, label: e.target.value })} className="bg-black border-zinc-800 text-zinc-300" />
                </div>
                <div className="space-y-2 w-48"><label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Icon</label>
                    <select className="flex h-10 w-full rounded-md border border-zinc-800 bg-black px-3 py-2 text-sm text-zinc-300" value={form.key} onChange={e => setForm({ ...form, key: e.target.value })}>
                        <option value="default">Default</option><option value="walking">Walking</option><option value="drink">Drink</option><option value="fruit">Fruit</option><option value="sports">Sports</option><option value="reading">Reading</option><option value="media">Media</option>
                    </select>
                </div>
                <div className="space-y-2 w-24"><label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Order</label>
                    <Input type="number" value={form.sort_order} onChange={e => setForm({ ...form, sort_order: parseInt(e.target.value) })} className="bg-black border-zinc-800 text-zinc-300" />
                </div>

                {editingId ? (
                    <div className="flex gap-2">
                        <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white"><Save size={16} /></Button>
                        <Button onClick={cancelEdit} variant="secondary"><span className="text-xs">Cancel</span></Button>
                    </div>
                ) : (
                    <Button onClick={handleSave} className="bg-white text-black hover:bg-zinc-200"><Plus size={16} /></Button>
                )}
            </div>

            <div className="border border-zinc-800 rounded-lg overflow-hidden">
                <Table>
                    <TableHeader><TableRow className="bg-zinc-900/50 border-zinc-800"><TableHead>Order</TableHead><TableHead>Label</TableHead><TableHead>Key</TableHead><TableHead className="text-right">Action</TableHead></TableRow></TableHeader>
                    <TableBody>
                        {habits.map((h) => (
                            <TableRow key={h.id} className={`border-zinc-800 hover:bg-zinc-900/30 ${editingId === h.id ? 'bg-zinc-900/80' : ''}`}>
                                <TableCell className="font-mono text-zinc-500">{h.sort_order}</TableCell>
                                <TableCell className="font-bold text-zinc-300">{h.label}</TableCell>
                                <TableCell><span className="font-mono text-xs bg-zinc-800 text-zinc-400 px-2 py-1 rounded">{h.key}</span></TableCell>
                                <TableCell className="text-right space-x-2">
                                    <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-white" onClick={() => startEdit(h)}><Pencil size={14} /></Button>
                                    <Button variant="ghost" size="sm" className="text-red-900 hover:text-red-400" onClick={() => deleteHabit(h.id)}><Trash2 size={14} /></Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}