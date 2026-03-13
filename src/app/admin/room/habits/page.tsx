"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trash2, Plus, ListTodo, Pencil, Save } from 'lucide-react';
import { toast } from 'sonner';

import * as LucideIcons from 'lucide-react';

const DynamicIcon = ({ name, size = 16, className = "" }: { name: string, size?: number, className?: string }) => {
    if (!name) return <span className={`text-zinc-600 text-[${size}px]`}>?</span>;
    const pascalName = name.charAt(0).toUpperCase() + name.slice(1);
    const Icon = (LucideIcons as any)[name] || (LucideIcons as any)[pascalName];
    return Icon ? <Icon size={size} className={className} /> : <span className={`text-zinc-600 text-[${size}px] font-bold`}>?</span>;
};

export default function HabitsPage() {
    const [habits, setHabits] = useState<any[]>([]);
    const [form, setForm] = useState({ label: "", key: "", sort_order: 0 });
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
                setForm({ label: "", key: "", sort_order: habits.length + 1 });
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
        setForm({ label: "", key: "", sort_order: 0 });
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
                <div className="space-y-2 w-56"><label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Icon</label>
                    <div className="flex gap-2">
                        <Input value={form.key} onChange={e => setForm({ ...form, key: e.target.value })} placeholder="Lucide Icon (e.g. Flame)" className="bg-black border-zinc-800 text-zinc-300" />
                        <div className="w-10 h-10 shrink-0 bg-black border border-zinc-800 rounded-md flex items-center justify-center text-zinc-400">
                            <DynamicIcon name={form.key} size={18} />
                        </div>
                    </div>
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
                    <TableHeader><TableRow className="bg-zinc-900/50 border-zinc-800"><TableHead className="text-zinc-400">Order</TableHead><TableHead className="text-zinc-400">Label</TableHead><TableHead className="text-zinc-400">Key (Icon)</TableHead><TableHead className="text-right text-zinc-400">Action</TableHead></TableRow></TableHeader>
                    <TableBody>
                        {habits.map((h) => (
                            <TableRow key={h.id} className={`border-zinc-800 hover:bg-zinc-900/30 ${editingId === h.id ? 'bg-zinc-900/80' : ''}`}>
                                <TableCell className="font-mono text-zinc-500">{h.sort_order}</TableCell>
                                <TableCell className="font-bold text-zinc-300">{h.label}</TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <DynamicIcon name={h.key} size={16} className="text-zinc-400" />
                                        <span className="font-mono text-xs bg-zinc-800 text-zinc-400 px-2 py-1 rounded">{h.key}</span>
                                    </div>
                                </TableCell>
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