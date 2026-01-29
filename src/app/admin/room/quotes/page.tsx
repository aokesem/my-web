"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trash2, Plus, Quote, Pencil, X, Save } from 'lucide-react';
import { toast } from 'sonner';

export default function QuotesPage() {
    const [quotes, setQuotes] = useState<any[]>([]);
    const [newText, setNewText] = useState("");
    const [editingId, setEditingId] = useState<number | null>(null); // [新增] 编辑状态

    const fetchQuotes = async () => {
        const { data } = await supabase.from('profile_quotes').select('*').order('id', { ascending: true });
        if (data) setQuotes(data);
    };

    useEffect(() => { fetchQuotes(); }, []);

    // [修改] 统一处理保存（新增或更新）
    const handleSave = async () => {
        if (!newText.trim()) return;

        if (editingId) {
            // 更新模式
            const { error } = await supabase.from('profile_quotes').update({ text: newText }).eq('id', editingId);
            if (!error) {
                toast.success("Quote updated");
                cancelEdit();
                fetchQuotes();
            }
        } else {
            // 新增模式
            const { error } = await supabase.from('profile_quotes').insert({ text: newText });
            if (!error) {
                setNewText("");
                toast.success("Quote added");
                fetchQuotes();
            }
        }
    };

    // [新增] 进入编辑模式
    const startEdit = (quote: any) => {
        setEditingId(quote.id);
        setNewText(quote.text);
    };

    // [新增] 取消编辑
    const cancelEdit = () => {
        setEditingId(null);
        setNewText("");
    };

    const deleteQuote = async (id: number) => {
        if (!confirm("Are you sure?")) return;
        const { error } = await supabase.from('profile_quotes').delete().eq('id', id);
        if (!error) {
            fetchQuotes();
            toast.success("Quote deleted");
            if (editingId === id) cancelEdit(); // 如果删除了正在编辑的项
        }
    };

    return (
        <div className="space-y-6 text-zinc-200">
            <div className="flex items-center gap-2 mb-6">
                <div className="p-2 bg-zinc-900 rounded-lg border border-zinc-800"><Quote size={20} className="text-zinc-400" /></div>
                <h1 className="text-2xl font-bold tracking-tight">格言管理 (Quotes)</h1>
            </div>

            <div className="flex gap-4">
                <Input
                    placeholder="Enter quote text..."
                    value={newText}
                    onChange={e => setNewText(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSave()}
                    className="bg-zinc-900 border-zinc-800 text-zinc-200 placeholder:text-zinc-600 focus-visible:ring-zinc-700"
                />

                {/* [修改] 按钮组 */}
                {editingId ? (
                    <>
                        <Button onClick={handleSave} className="bg-blue-600 text-white hover:bg-blue-700"><Save size={16} className="mr-2" /> Update</Button>
                        <Button onClick={cancelEdit} variant="ghost" className="text-zinc-400 hover:text-white"><X size={16} /></Button>
                    </>
                ) : (
                    <Button onClick={handleSave} className="bg-white text-black hover:bg-zinc-200"><Plus size={16} className="mr-2" /> Add</Button>
                )}
            </div>

            <div className="border border-zinc-800 rounded-lg overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-zinc-900/50 hover:bg-zinc-900/50 border-zinc-800">
                            <TableHead className="w-[80px] text-zinc-500">ID</TableHead>
                            <TableHead className="text-zinc-400">Text</TableHead>
                            <TableHead className="text-right text-zinc-500">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {quotes.map((q) => (
                            <TableRow key={q.id} className={`border-zinc-800 hover:bg-zinc-900/30 ${editingId === q.id ? 'bg-zinc-900/80' : ''}`}>
                                <TableCell className="font-mono text-zinc-600">{q.id}</TableCell>
                                <TableCell className="font-medium text-zinc-300">{q.text}</TableCell>
                                <TableCell className="text-right space-x-2">
                                    <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-white hover:bg-zinc-800" onClick={() => startEdit(q)}>
                                        <Pencil size={14} />
                                    </Button>
                                    <Button variant="ghost" size="sm" className="text-red-900 hover:text-red-400 hover:bg-red-950/30" onClick={() => deleteQuote(q.id)}>
                                        <Trash2 size={14} />
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