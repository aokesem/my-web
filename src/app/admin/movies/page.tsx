"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Pencil, Trash } from 'lucide-react';
import { toast } from 'sonner';
import { ImageUpload } from '@/components/ui/image-upload';

interface Movie {
    id: number;
    title: string;
    title_en: string;
    cover_url: string;
    stills: string[]; // 多张剧照
    director: string;
    rating: number;
    year: string;
    tags: string[];
    comment: string;
    status: 'Watched' | 'Want to Watch';
}

export default function MoviesAdmin() {
    const [movies, setMovies] = useState<Movie[]>([]);
    const [loading, setLoading] = useState(true);
    const [isOpen, setIsOpen] = useState(false);
    const [currentMovie, setCurrentMovie] = useState<Partial<Movie> & { tagsString?: string }>({});

    useEffect(() => {
        fetchMovies();
    }, []);

    const fetchMovies = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('movies')
            .select('*')
            .order('id', { ascending: true });

        if (error) {
            toast.error('获取电影列表失败');
        } else {
            setMovies(data || []);
        }
        setLoading(false);
    };

    const handleDelete = async (id: number) => {
        if (!confirm('确定要删除这部电影吗？')) return;

        const { error } = await supabase.from('movies').delete().eq('id', id);
        if (error) {
            toast.error('删除失败');
        } else {
            toast.success('电影已删除');
            fetchMovies();
        }
    };

    const handleSave = async () => {
        if (!currentMovie.title) {
            toast.error('电影标题是必填项');
            return;
        }

        try {
            const tagsArray = currentMovie.tagsString
                ? currentMovie.tagsString.split(',').map(s => s.trim()).filter(Boolean)
                : currentMovie.tags || [];

            const payload = {
                title: currentMovie.title,
                title_en: currentMovie.title_en,
                cover_url: currentMovie.cover_url,
                stills: currentMovie.stills || [],
                director: currentMovie.director,
                rating: Number(currentMovie.rating) || 0,
                year: currentMovie.year,
                tags: tagsArray,
                comment: currentMovie.comment,
                status: currentMovie.status || 'Watched'
            };

            if (currentMovie.id) {
                const { error } = await supabase.from('movies').update(payload).eq('id', currentMovie.id);
                if (error) throw error;
                toast.success('电影已更新');
            } else {
                const { error } = await supabase.from('movies').insert([payload]);
                if (error) throw error;
                toast.success('电影已创建');
            }

            setIsOpen(false);
            setCurrentMovie({});
            fetchMovies();
        } catch (error: any) {
            toast.error('操作失败: ' + error.message);
        }
    };

    const openEdit = (movie: Movie) => {
        setCurrentMovie({
            ...movie,
            tagsString: movie.tags?.join(', ')
        });
        setIsOpen(true);
    };

    const openCreate = () => {
        setCurrentMovie({ status: 'Watched', tagsString: '' });
        setIsOpen(true);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold tracking-tight text-white">电影管理</h2>
                <Dialog open={isOpen} onOpenChange={setIsOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={openCreate} className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
                            <Plus size={16} /> 添加电影
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-zinc-950 border-zinc-800 text-gray-100 max-w-2xl max-h-[85vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>{currentMovie.id ? '编辑电影' : '添加新电影'}</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>标题 (中文)</Label>
                                    <Input
                                        value={currentMovie.title || ''}
                                        onChange={e => setCurrentMovie({ ...currentMovie, title: e.target.value })}
                                        className="bg-black border-zinc-800"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>标题 (原文/英文)</Label>
                                    <Input
                                        value={currentMovie.title_en || ''}
                                        onChange={e => setCurrentMovie({ ...currentMovie, title_en: e.target.value })}
                                        className="bg-black border-zinc-800"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>导演</Label>
                                    <Input
                                        value={currentMovie.director || ''}
                                        onChange={e => setCurrentMovie({ ...currentMovie, director: e.target.value })}
                                        className="bg-black border-zinc-800"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>电影海报 (竖版)</Label>
                                    <ImageUpload
                                        bucket="covers"
                                        folder="cinema_cover"
                                        value={currentMovie.cover_url || ''}
                                        onChange={(url) => setCurrentMovie({ ...currentMovie, cover_url: url })}
                                    />
                                </div>
                            </div>

                            {/* 剧照上传区 - 支持多张 */}
                            <div className="space-y-2">
                                <Label>电影剧照 (横版，可上传多张)</Label>
                                <div className="space-y-3">
                                    {(currentMovie.stills || []).map((still, idx) => (
                                        <div key={idx} className="flex items-center gap-2">
                                            <div className="flex-1">
                                                <ImageUpload
                                                    bucket="covers"
                                                    folder="cinema_photo"
                                                    value={still}
                                                    onChange={(url) => {
                                                        const newStills = [...(currentMovie.stills || [])];
                                                        newStills[idx] = url;
                                                        setCurrentMovie({ ...currentMovie, stills: newStills });
                                                    }}
                                                />
                                            </div>
                                            <Button
                                                type="button"
                                                variant="destructive"
                                                size="sm"
                                                onClick={() => {
                                                    const newStills = (currentMovie.stills || []).filter((_, i) => i !== idx);
                                                    setCurrentMovie({ ...currentMovie, stills: newStills });
                                                }}
                                            >
                                                删除
                                            </Button>
                                        </div>
                                    ))}
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                            setCurrentMovie({
                                                ...currentMovie,
                                                stills: [...(currentMovie.stills || []), '']
                                            });
                                        }}
                                        className="w-full"
                                    >
                                        + 添加剧照
                                    </Button>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label>评分 (0-100)</Label>
                                    <Input
                                        type="number"
                                        value={currentMovie.rating || ''}
                                        onChange={e => setCurrentMovie({ ...currentMovie, rating: Number(e.target.value) })}
                                        className="bg-black border-zinc-800"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>年份 (例如 2023)</Label>
                                    <Input
                                        value={currentMovie.year || ''}
                                        onChange={e => setCurrentMovie({ ...currentMovie, year: e.target.value })}
                                        className="bg-black border-zinc-800"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>状态</Label>
                                    <select
                                        className="flex h-10 w-full rounded-md border border-zinc-800 bg-black px-3 py-2 text-sm text-gray-100 focus:outline-hidden focus:ring-2 focus:ring-zinc-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        value={currentMovie.status || 'Watched'}
                                        onChange={e => setCurrentMovie({ ...currentMovie, status: e.target.value as any })}
                                    >
                                        <option value="Watched">已看</option>
                                        <option value="Want to Watch">想看</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>标签 (逗号分隔)</Label>
                                <Input
                                    value={currentMovie.tagsString || ''}
                                    onChange={e => setCurrentMovie({ ...currentMovie, tagsString: e.target.value })}
                                    className="bg-black border-zinc-800"
                                    placeholder="剧情, 科幻, 爱情"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>短评 / 感想</Label>
                                <Textarea
                                    value={currentMovie.comment || ''}
                                    onChange={e => setCurrentMovie({ ...currentMovie, comment: e.target.value })}
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
                            <TableHead className="text-zinc-400">导演</TableHead>
                            <TableHead className="text-zinc-400">评分</TableHead>
                            <TableHead className="text-zinc-400">状态</TableHead>
                            <TableHead className="text-zinc-400 text-right">操作</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-10 text-zinc-500">加载电影中...</TableCell>
                            </TableRow>
                        ) : movies.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-10 text-zinc-500">暂无电影数据。</TableCell>
                            </TableRow>
                        ) : (
                            movies.map((item) => (
                                <TableRow key={item.id} className="border-zinc-800 hover:bg-zinc-900/50">
                                    <TableCell className="font-mono text-zinc-500">{item.id}</TableCell>
                                    <TableCell className="font-medium text-gray-200">
                                        <div>{item.title}</div>
                                        <div className="text-xs text-zinc-500">{item.title_en}</div>
                                    </TableCell>
                                    <TableCell className="text-zinc-400">{item.director}</TableCell>
                                    <TableCell className="text-zinc-400">{item.rating}</TableCell>
                                    <TableCell>
                                        <span className={`px-2 py-1 rounded-full text-xs border ${item.status === 'Watched' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                                            'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                            }`}>
                                            {item.status === 'Watched' ? '已看' : '想看'}
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
