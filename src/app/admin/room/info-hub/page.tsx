"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { ClipboardList, Trash2, Loader2, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

type HubCategoryType = 'study' | 'life';

interface HubCaptureRow {
    id: number;
    title: string;
    category_type: HubCategoryType;
    created_at: string;
}

export default function InfoHubAdminPage() {
    const [isLoading, setIsLoading] = useState(true);
    const [captures, setCaptures] = useState<HubCaptureRow[]>([]);
    const [queuedCount, setQueuedCount] = useState(0);
    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState<'all' | HubCategoryType>('all');

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [capRes, studyQueueRes, lifeQueueRes] = await Promise.all([
                supabase.from('info_hub_captures').select('*').order('created_at', { ascending: false }),
                supabase
                    .from('info_bookmarks')
                    .select('id', { count: 'exact', head: true })
                    .eq('category_type', 'study')
                    .eq('is_queued', true),
                supabase
                    .from('info_bookmarks')
                    .select('id', { count: 'exact', head: true })
                    .eq('category_type', 'life')
                    .eq('is_queued', true),
            ]);
            if (capRes.data) setCaptures(capRes.data as HubCaptureRow[]);
            setQueuedCount((studyQueueRes.count ?? 0) + (lifeQueueRes.count ?? 0));
        } catch (e) {
            console.error(e);
            toast.error('加载失败');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleDelete = async (id: number) => {
        if (!confirm('删除此捕获？（不会动信息溯源已归档数据）')) return;
        const { error } = await supabase.from('info_hub_captures').delete().eq('id', id);
        if (error) {
            toast.error('删除失败');
            return;
        }
        toast.success('已删除');
        setCaptures((prev) => prev.filter((c) => c.id !== id));
    };

    const filtered = captures.filter((c) => {
        const matchSearch = c.title.toLowerCase().includes(searchTerm.toLowerCase());
        const matchType = typeFilter === 'all' || c.category_type === typeFilter;
        return matchSearch && matchType;
    });

    return (
        <div className="space-y-6">
            <header>
                <h1 className="text-2xl font-bold flex items-center gap-2 text-zinc-100">
                    <ClipboardList className="text-violet-400" />
                    信息清单 · 桥梁捕获
                </h1>
                <p className="text-sm text-zinc-500 mt-1">
                    Profile 窗台「信息清单」中的未归档捕获；归档后写入信息条目并默认加入待看。
                    当前待看：<span className="text-zinc-300 font-mono">{queuedCount}</span> 条
                </p>
            </header>

            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                    <Input
                        placeholder="搜索标题..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 bg-zinc-900/50 border-zinc-800"
                    />
                </div>
                <div className="p-1 bg-zinc-900 rounded-lg flex gap-1 self-start">
                    {(['all', 'study', 'life'] as const).map((t) => (
                        <button
                            key={t}
                            type="button"
                            onClick={() => setTypeFilter(t)}
                            className={`px-3 py-1 text-[10px] font-bold rounded-md uppercase ${
                                typeFilter === t ? 'bg-zinc-800 text-white' : 'text-zinc-500'
                            }`}
                        >
                            {t}
                        </button>
                    ))}
                </div>
            </div>

            <div className="bg-zinc-900/30 rounded-2xl border border-zinc-800 overflow-hidden">
                {isLoading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="animate-spin text-violet-400" size={32} />
                    </div>
                ) : (
                    <table className="w-full text-left">
                        <thead className="bg-zinc-900/50 text-zinc-500 text-[10px] uppercase font-bold">
                            <tr>
                                <th className="px-6 py-4">标题</th>
                                <th className="px-6 py-4">Nexus</th>
                                <th className="px-6 py-4">创建时间</th>
                                <th className="px-6 py-4 text-right">操作</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800/50">
                            {filtered.map((row) => (
                                <tr key={row.id} className="hover:bg-white/5">
                                    <td className="px-6 py-4 text-zinc-200 font-medium">{row.title}</td>
                                    <td className="px-6 py-4">
                                        <span className="font-mono text-[10px] uppercase text-zinc-400">
                                            {row.category_type}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-xs text-zinc-500 font-mono">
                                        {new Date(row.created_at).toLocaleString('zh-CN')}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleDelete(row.id)}
                                            className="h-8 w-8 text-red-400 hover:text-red-300"
                                        >
                                            <Trash2 size={14} />
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                            {filtered.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="px-6 py-16 text-center text-zinc-500 text-sm">
                                        暂无捕获记录
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}