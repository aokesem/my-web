"use client";

import React, { useState } from 'react';
import useSWR from 'swr';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Edit2, Plus, Loader2, Image as ImageIcon, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { toast } from 'sonner';
import Image from 'next/image';
import { ImageUpload } from '@/components/ui/image-upload';

type Food = {
    id: number;
    name: string;
    category: string;
    rating: number;
    image_url: string;
    notes: string;
};

const fetchData = async () => {
    const [foodsRes, catsRes] = await Promise.all([
        supabase.from('diet_foods').select('*').order('id', { ascending: false }),
        supabase.from('diet_categories').select('name').eq('module', 'foods').order('sort_order')
    ]);
    if (foodsRes.error) throw foodsRes.error;
    if (catsRes.error) throw catsRes.error;

    return {
        foods: foodsRes.data as Food[],
        categories: catsRes.data.map(c => c.name) as string[]
    };
};

export default function FoodsManager() {
    const { data, error, isLoading, mutate } = useSWR('admin_diet_foods_with_cats', fetchData);

    // 弹窗与表单状态
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [formData, setFormData] = useState<Partial<Food>>({
        name: '',
        category: '', // 留空，待打开 modal 取第一个可用
        rating: 5,
        image_url: '',
        notes: ''
    });

    const openCreateModal = () => {
        setEditingId(null);
        setFormData({ name: '', category: data?.categories[0] || '', rating: 5, image_url: '', notes: '' });
        setIsModalOpen(true);
    };

    const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null);

    const handleSort = (key: string) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const sortedFoods = React.useMemo(() => {
        if (!data?.foods) return [];
        const sortableItems = [...data.foods];
        if (sortConfig !== null) {
            sortableItems.sort((a, b) => {
                const aValue = a[sortConfig.key as keyof Food];
                const bValue = b[sortConfig.key as keyof Food];
                if (aValue === bValue) return 0;
                if (aValue === null || aValue === undefined) return 1;
                if (bValue === null || bValue === undefined) return -1;
                if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }
        return sortableItems;
    }, [data, sortConfig]);

    const SortIcon = ({ sortKey }: { sortKey: string }) => {
        if (sortConfig?.key === sortKey) {
            return sortConfig.direction === 'asc' ? <ArrowUp size={14} className="inline ml-1" /> : <ArrowDown size={14} className="inline ml-1" />;
        }
        return <ArrowUpDown size={14} className="inline ml-1 opacity-30" />;
    };

    const openEditModal = (food: Food) => {
        setEditingId(food.id);
        setFormData({ ...food });
        setIsModalOpen(true);
    };

    const handleDelete = async (id: number) => {
        if (!confirm('确定要删除这个食材吗？如果有食谱正在使用它，关联数据可能受影响。')) return;

        try {
            const { error } = await supabase.from('diet_foods').delete().eq('id', id);
            if (error) throw error;
            toast.success('删除成功');
            mutate();
        } catch (e: any) {
            toast.error('删除失败: ' + e.message);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name || !formData.category) {
            toast.error('请填写完整必填项');
            return;
        }

        setIsSubmitting(true);
        try {
            if (editingId) {
                // Update
                const { error } = await supabase.from('diet_foods').update(formData).eq('id', editingId);
                if (error) throw error;
                toast.success('更新成功');
            } else {
                // Insert
                const { error } = await supabase.from('diet_foods').insert([formData]);
                if (error) throw error;
                toast.success('添加成功');
            }
            setIsModalOpen(false);
            mutate();
        } catch (e: any) {
            toast.error('提交失败: ' + e.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) return <div className="flex items-center justify-center h-40 text-zinc-500"><Loader2 className="animate-spin" /></div>;
    if (error) return <div className="text-red-500">加载失败</div>;

    return (
        <div className="flex flex-col h-full">
            <div className="flex justify-between items-center mb-4 shrink-0">
                <h2 className="text-lg font-bold text-white">食材列表</h2>
                <Button onClick={openCreateModal} size="sm" className="bg-amber-600 hover:bg-amber-700 text-white">
                    <Plus size={16} className="mr-1.5" /> 添加食材
                </Button>
            </div>

            <div className="flex-1 overflow-y-auto rounded-md border border-zinc-800 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-zinc-900/50">
                <table className="w-full text-sm text-left text-zinc-400">
                    <thead className="text-xs text-zinc-500 uppercase bg-zinc-900 sticky top-0 z-10 hidden md:table-header-group shadow-md border-b border-zinc-800">
                        <tr>
                            <th className="px-4 py-3 font-medium">封面</th>
                            <th className="px-4 py-3 font-medium cursor-pointer hover:text-zinc-300 transition-colors select-none" onClick={() => handleSort('name')}>
                                名称 <SortIcon sortKey="name" />
                            </th>
                            <th className="px-4 py-3 font-medium cursor-pointer hover:text-zinc-300 transition-colors select-none" onClick={() => handleSort('category')}>
                                分类 <SortIcon sortKey="category" />
                            </th>
                            <th className="px-4 py-3 font-medium cursor-pointer hover:text-zinc-300 transition-colors select-none" onClick={() => handleSort('rating')}>
                                评分 <SortIcon sortKey="rating" />
                            </th>
                            <th className="px-4 py-3 font-medium">笔记预览</th>
                            <th className="px-4 py-3 font-medium text-right">操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedFoods.map(food => (
                            <tr key={food.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors flex flex-col md:table-row">
                                <td className="px-4 py-3 flex items-center gap-3">
                                    <div className="relative w-10 h-10 rounded-md overflow-hidden bg-zinc-800 shrink-0">
                                        {food.image_url ? (
                                            <Image src={food.image_url} alt={food.name} fill sizes="40px" className="object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-zinc-600"><ImageIcon size={16} /></div>
                                        )}
                                    </div>
                                    <span className="md:hidden font-bold text-zinc-200">{food.name}</span>
                                </td>
                                <td className="px-4 py-2 md:py-3 font-medium text-zinc-200 hidden md:table-cell">{food.name}</td>
                                <td className="px-4 py-1.5 md:py-3 text-xs md:text-sm">
                                    <span className="bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded border border-zinc-700">{food.category}</span>
                                </td>
                                <td className="px-4 py-1.5 md:py-3 text-amber-500 text-xs md:text-sm">★ {food.rating}</td>
                                <td className="px-4 py-2 md:py-3">
                                    <p className="line-clamp-1 max-w-xs text-xs md:text-sm text-zinc-500 whitespace-pre-line">{food.notes?.replace(/\\n/g, ' ')}</p>
                                </td>
                                <td className="px-4 py-3 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <Button variant="ghost" size="icon" onClick={() => openEditModal(food)} className="h-8 w-8 text-zinc-400 hover:text-white hover:bg-zinc-800">
                                            <Edit2 size={14} />
                                        </Button>
                                        <Button variant="ghost" size="icon" onClick={() => handleDelete(food.id)} className="h-8 w-8 text-red-500/70 hover:text-red-400 hover:bg-red-500/10">
                                            <Trash2 size={14} />
                                        </Button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* 新增/编辑弹窗 */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="bg-zinc-900 border-zinc-800 text-zinc-200 max-w-md">
                    <DialogHeader>
                        <DialogTitle>{editingId ? '编辑食材' : '添加食材'}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">名称</Label>
                            <Input id="name" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="bg-zinc-950 border-zinc-800 focus-visible:ring-amber-600" required />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>分类</Label>
                                <Select value={formData.category} onValueChange={v => setFormData({ ...formData, category: v })}>
                                    <SelectTrigger className="bg-zinc-950 border-zinc-800">
                                        <SelectValue placeholder="选择分类" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-200">
                                        {data?.categories?.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="rating">评分 (1-5)</Label>
                                <Input id="rating" type="number" step="0.5" min="1" max="5" value={formData.rating} onChange={e => setFormData({ ...formData, rating: parseFloat(e.target.value) })} className="bg-zinc-950 border-zinc-800 focus-visible:ring-amber-600" required />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>封面图片</Label>
                            <ImageUpload
                                value={formData.image_url}
                                onChange={url => setFormData({ ...formData, image_url: url })}
                                bucket="food_images"
                                folder="foods"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="notes">笔记说明 (支持简单 Markdown 与 \n 换行)</Label>
                            <Textarea id="notes" rows={4} value={formData.notes || ''} onChange={e => setFormData({ ...formData, notes: e.target.value })} className="bg-zinc-950 border-zinc-800 focus-visible:ring-amber-600 resize-none font-mono text-sm leading-relaxed" />
                        </div>
                        <DialogFooter className="pt-4">
                            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)} className="text-zinc-400 hover:text-white">取消</Button>
                            <Button type="submit" disabled={isSubmitting} className="bg-amber-600 hover:bg-amber-700 text-white">
                                {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                                保存
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
