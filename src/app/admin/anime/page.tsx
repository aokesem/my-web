"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Pencil, Trash, ArrowUpDown } from 'lucide-react';
import { toast } from 'sonner';
import { ImageUpload } from '@/components/ui/image-upload';

interface Anime {
    id: number;
    title: string;
    title_en: string;
    cover_url: string;
    rating: number;
    year: string;
    tags: string[]; // Handled as comma-separated string in form
    comment: string;
    status: 'Watched' | 'Watching' | 'Dropped';
}

export default function AnimeAdmin() {
    const [animes, setAnimes] = useState<Anime[]>([]);
    const [loading, setLoading] = useState(true);
    const [isOpen, setIsOpen] = useState(false);
    const [currentAnime, setCurrentAnime] = useState<Partial<Anime> & { tagsString?: string }>({});
    const [sortConfig, setSortConfig] = useState<{ key: keyof Anime | null; direction: 'asc' | 'desc' }>({ key: null, direction: 'asc' });

    useEffect(() => {
        fetchAnimes();
    }, []);

    const fetchAnimes = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('animes')
            .select('*')
            .order('id', { ascending: true });

        if (error) {
            toast.error('Failed to fetch animes');
        } else {
            setAnimes(data || []);
        }
        setLoading(false);
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this anime?')) return;

        const { error } = await supabase.from('animes').delete().eq('id', id);
        if (error) {
            toast.error('Delete failed');
        } else {
            toast.success('Anime deleted');
            fetchAnimes();
        }
    };

    const handleSave = async () => {
        if (!currentAnime.title) {
            toast.error('Title is required');
            return;
        }

        try {
            const tagsArray = currentAnime.tagsString
                ? currentAnime.tagsString.split(',').map(s => s.trim()).filter(Boolean)
                : currentAnime.tags || [];

            const payload = {
                title: currentAnime.title,
                title_en: currentAnime.title_en,
                cover_url: currentAnime.cover_url,
                rating: Number(currentAnime.rating) || 0,
                year: currentAnime.year,
                tags: tagsArray,
                comment: currentAnime.comment,
                status: currentAnime.status || 'Watched'
            };

            if (currentAnime.id) {
                const { error } = await supabase.from('animes').update(payload).eq('id', currentAnime.id);
                if (error) throw error;
                toast.success('Anime updated');
            } else {
                const { error } = await supabase.from('animes').insert([payload]);
                if (error) throw error;
                toast.success('Anime created');
            }

            setIsOpen(false);
            setCurrentAnime({});
            fetchAnimes();
        } catch (error: any) {
            toast.error('Operation failed: ' + error.message);
        }
    };

    const openEdit = (anime: Anime) => {
        setCurrentAnime({
            ...anime,
            tagsString: anime.tags?.join(', ')
        });
        setIsOpen(true);
    };

    const openCreate = () => {
        setCurrentAnime({ status: 'Watched', tagsString: '' });
        setIsOpen(true);
    };

    const handleSort = (key: keyof Anime) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const sortedAnimes = [...animes].sort((a, b) => {
        if (!sortConfig.key) return 0;

        const key = sortConfig.key;
        const direction = sortConfig.direction === 'asc' ? 1 : -1;

        const valA = a[key] ?? '';
        const valB = b[key] ?? '';

        if (valA < valB) return -1 * direction;
        if (valA > valB) return 1 * direction;
        return 0;
    });

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold tracking-tight text-white">番剧管理</h2>
                <Dialog open={isOpen} onOpenChange={setIsOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={openCreate} className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
                            <Plus size={16} /> 添加番剧
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-zinc-950 border-zinc-800 text-gray-100 max-w-2xl max-h-[85vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>{currentAnime.id ? '编辑番剧' : '添加新番剧'}</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>标题 (中文)</Label>
                                    <Input
                                        value={currentAnime.title || ''}
                                        onChange={e => setCurrentAnime({ ...currentAnime, title: e.target.value })}
                                        className="bg-black border-zinc-800"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>标题 (原文/英文)</Label>
                                    <Input
                                        value={currentAnime.title_en || ''}
                                        onChange={e => setCurrentAnime({ ...currentAnime, title_en: e.target.value })}
                                        className="bg-black border-zinc-800"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>封面</Label>
                                <ImageUpload
                                    bucket="covers"
                                    folder="anime_cover"
                                    value={currentAnime.cover_url || ''}
                                    onChange={(url) => setCurrentAnime({ ...currentAnime, cover_url: url })}
                                />
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label>评分 (0-100)</Label>
                                    <Input
                                        type="number"
                                        value={currentAnime.rating || ''}
                                        onChange={e => setCurrentAnime({ ...currentAnime, rating: Number(e.target.value) })}
                                        className="bg-black border-zinc-800"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>年份 (例如 2023)</Label>
                                    <Input
                                        value={currentAnime.year || ''}
                                        onChange={e => setCurrentAnime({ ...currentAnime, year: e.target.value })}
                                        className="bg-black border-zinc-800"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>状态</Label>
                                    <select
                                        className="flex h-10 w-full rounded-md border border-zinc-800 bg-black px-3 py-2 text-sm text-gray-100 focus:outline-hidden focus:ring-2 focus:ring-zinc-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        value={currentAnime.status || 'Watched'}
                                        onChange={e => setCurrentAnime({ ...currentAnime, status: e.target.value as any })}
                                    >
                                        <option value="Watched">已看</option>
                                        <option value="Watching">在看</option>
                                        <option value="Dropped">弃坑</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>标签 (逗号分隔)</Label>
                                <Input
                                    value={currentAnime.tagsString || ''}
                                    onChange={e => setCurrentAnime({ ...currentAnime, tagsString: e.target.value })}
                                    className="bg-black border-zinc-800"
                                    placeholder="Action, Fantasy, Drama"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>短评 / 感想</Label>
                                <Textarea
                                    value={currentAnime.comment || ''}
                                    onChange={e => setCurrentAnime({ ...currentAnime, comment: e.target.value })}
                                    className="bg-black border-zinc-800 h-24"
                                />
                            </div>

                            <div className="flex justify-end gap-2 mt-4">
                                <Button variant="outline" onClick={() => setIsOpen(false)} className="border-zinc-700 bg-transparent hover:bg-zinc-800 text-gray-300">取消</Button>
                                <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white">保存更改</Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="rounded-md border border-zinc-800 bg-zinc-950/50">
                <Table>
                    <TableHeader>
                        <TableRow className="border-zinc-800 hover:bg-zinc-900/50">
                            <TableHead className="text-zinc-400 w-[50px]">ID</TableHead>
                            <TableHead className="text-zinc-400">标题</TableHead>
                            <TableHead className="text-zinc-400 cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('year')}>
                                <div className="flex items-center gap-1">
                                    观看时间
                                    <ArrowUpDown size={14} className={sortConfig.key === 'year' ? 'text-blue-500' : 'opacity-30'} />
                                </div>
                            </TableHead>
                            <TableHead className="text-zinc-400 cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('rating')}>
                                <div className="flex items-center gap-1">
                                    评分
                                    <ArrowUpDown size={14} className={sortConfig.key === 'rating' ? 'text-blue-500' : 'opacity-30'} />
                                </div>
                            </TableHead>
                            <TableHead className="text-zinc-400 cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('status')}>
                                <div className="flex items-center gap-1">
                                    状态
                                    <ArrowUpDown size={14} className={sortConfig.key === 'status' ? 'text-blue-500' : 'opacity-30'} />
                                </div>
                            </TableHead>
                            <TableHead className="text-zinc-400 text-right">操作</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-10 text-zinc-500">加载中...</TableCell>
                            </TableRow>
                        ) : animes.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-10 text-zinc-500">暂无番剧。</TableCell>
                            </TableRow>
                        ) : (
                            sortedAnimes.map((item) => (
                                <TableRow key={item.id} className="border-zinc-800 hover:bg-zinc-900/50">
                                    <TableCell className="font-mono text-zinc-500">{item.id}</TableCell>
                                    <TableCell className="font-medium text-gray-200">
                                        <div>{item.title}</div>
                                        <div className="text-xs text-zinc-500">{item.title_en}</div>
                                    </TableCell>
                                    <TableCell className="text-zinc-400 font-mono">{item.year || '-'}</TableCell>
                                    <TableCell className="text-zinc-400">{item.rating}%</TableCell>
                                    <TableCell>
                                        <span className={`px-2 py-1 rounded-full text-xs border ${item.status === 'Watching' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                                            item.status === 'Dropped' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                                'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                            }`}>
                                            {item.status === 'Watched' ? '已看' : item.status === 'Watching' ? '在看' : '弃坑'}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button variant="ghost" size="icon" onClick={() => openEdit(item)} className="h-8 w-8 text-zinc-400 hover:text-white hover:bg-zinc-800">
                                                <Pencil size={14} />
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)} className="h-8 w-8 text-zinc-400 hover:text-red-400 hover:bg-red-950/50">
                                                <Trash size={14} />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
