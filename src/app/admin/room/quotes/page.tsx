"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trash2, Plus, Quote } from 'lucide-react';
import { toast } from 'sonner';

export default function QuotesPage() {
    const [quotes, setQuotes] = useState<any[]>([]);
    const [newText, setNewText] = useState("");

    const fetchQuotes = async () => {
        const { data } = await supabase.from('profile_quotes').select('*').order('id', { ascending: true });
        if (data) setQuotes(data);
    };

    useEffect(() => { fetchQuotes(); }, []);

    const addQuote = async () => {
        if (!newText.trim()) return;
        const { error } = await supabase.from('profile_quotes').insert({ text: newText });
        if (!error) {
            setNewText("");
            fetchQuotes();
            toast.success("Quote added");
        }
    };

    const deleteQuote = async (id: number) => {
        if (!confirm("Are you sure?")) return;
        const { error } = await supabase.from('profile_quotes').delete().eq('id', id);
        if (!error) {
            fetchQuotes();
            toast.success("Quote deleted");
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
                    placeholder="Enter new quote..."
                    value={newText}
                    onChange={e => setNewText(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addQuote()}
                    className="bg-zinc-900 border-zinc-800 text-zinc-200 placeholder:text-zinc-600 focus-visible:ring-zinc-700"
                />
                <Button onClick={addQuote} className="bg-white text-black hover:bg-zinc-200"><Plus size={16} className="mr-2" /> Add</Button>
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
                            <TableRow key={q.id} className="border-zinc-800 hover:bg-zinc-900/30">
                                <TableCell className="font-mono text-zinc-600">{q.id}</TableCell>
                                <TableCell className="font-medium text-zinc-300">{q.text}</TableCell>
                                <TableCell className="text-right">
                                    <Button variant="ghost" size="sm" className="text-red-900 hover:text-red-400 hover:bg-red-950/30" onClick={() => deleteQuote(q.id)}>
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