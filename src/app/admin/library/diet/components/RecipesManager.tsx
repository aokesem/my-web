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

type Recipe = {
    id: number;
    name: string;
    category: string;
    type: string;
    rating: number;
    image_url: string;
    notes: string;
    restaurant_id: number | null;
    linkedFoods: number[];
};

const TYPES = [{ id: 'can_cook', label: '我会做的' }, { id: 'favorite', label: '我爱吃的' }];

const fetchData = async () => {
    const [recipesRes, foodsRes, restsRes, relationsRes, catsRes] = await Promise.all([
        supabase.from('diet_recipes').select('*').order('id', { ascending: false }),
        supabase.from('diet_foods').select('id, name, category'),
        supabase.from('diet_restaurants').select('id, name'),
        supabase.from('diet_recipe_foods').select('*'),
        supabase.from('diet_categories').select('name').eq('module', 'recipes').order('sort_order')
    ]);

    if (recipesRes.error) throw recipesRes.error;
    if (foodsRes.error) throw foodsRes.error;
    if (restsRes.error) throw restsRes.error;
    if (relationsRes.error) throw relationsRes.error;
    if (catsRes.error) throw catsRes.error;

    const recipes = recipesRes.data.map(r => ({
        ...r,
        linkedFoods: relationsRes.data.filter((rel: any) => rel.recipe_id === r.id).map((rel: any) => rel.food_id)
    })) as Recipe[];

    return {
        recipes,
        foods: foodsRes.data,
        restaurants: restsRes.data,
        categories: catsRes.data.map(c => c.name) as string[]
    };
};

export default function RecipesManager() {
    const { data, error, isLoading, mutate } = useSWR('admin_diet_recipes_data', fetchData);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [formData, setFormData] = useState<Partial<Recipe>>({
        name: '', category: '', type: 'can_cook', rating: 5, image_url: '', notes: '', restaurant_id: null, linkedFoods: []
    });

    const openCreateModal = () => {
        setEditingId(null);
        setFormData({ name: '', category: data?.categories[0] || '', type: 'can_cook', rating: 5, image_url: '', notes: '', restaurant_id: null, linkedFoods: [] });
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

    const sortedRecipes = React.useMemo(() => {
        if (!data?.recipes) return [];
        const sortableItems = [...data.recipes];
        if (sortConfig !== null) {
            sortableItems.sort((a, b) => {
                let aValue: any = a[sortConfig.key as keyof Recipe];
                let bValue: any = b[sortConfig.key as keyof Recipe];

                // 如果按餐厅排序，出于直观体验应根据展开的对应餐厅中文名称来比对
                if (sortConfig.key === 'restaurant_id') {
                    aValue = data.restaurants?.find(r => r.id === a.restaurant_id)?.name || '';
                    bValue = data.restaurants?.find(r => r.id === b.restaurant_id)?.name || '';
                }

                if (aValue === bValue) return 0;
                if (aValue === null || aValue === undefined || aValue === '') return 1;
                if (bValue === null || bValue === undefined || bValue === '') return -1;
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

    const openEditModal = (recipe: Recipe) => {
        setEditingId(recipe.id);
        setFormData({ ...recipe });
        setIsModalOpen(true);
    };

    const handleDelete = async (id: number) => {
        if (!confirm('确定要删除这个食谱吗？关联的食材记录会被级联删除，但餐厅推荐菜单如果引用了它可能会受影响。')) return;
        try {
            const { error } = await supabase.from('diet_recipes').delete().eq('id', id);
            if (error) throw error;
            toast.success('删除成功');
            mutate();
        } catch (e: any) {
            toast.error('删除失败: ' + e.message);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name || !formData.category || !formData.type) {
            toast.error('请填写完整必填项');
            return;
        }

        setIsSubmitting(true);
        try {
            const recipeData = {
                name: formData.name,
                category: formData.category,
                type: formData.type,
                rating: formData.rating,
                image_url: formData.image_url,
                notes: formData.notes,
                restaurant_id: formData.restaurant_id
            };

            let newRecipeId = editingId;

            if (editingId) {
                // Update
                const { error } = await supabase.from('diet_recipes').update(recipeData).eq('id', editingId);
                if (error) throw error;

                // 删除旧关联
                await supabase.from('diet_recipe_foods').delete().eq('recipe_id', editingId);
            } else {
                // Insert
                const { data: newRow, error } = await supabase.from('diet_recipes').insert([recipeData]).select().single();
                if (error) throw error;
                newRecipeId = newRow.id;
            }

            // 插入新关联
            if (newRecipeId && formData.linkedFoods && formData.linkedFoods.length > 0) {
                const inserts = formData.linkedFoods.map(fid => ({ recipe_id: newRecipeId, food_id: fid }));
                const { error: relError } = await supabase.from('diet_recipe_foods').insert(inserts);
                if (relError) throw relError;
            }

            toast.success(editingId ? '更新成功' : '添加成功');
            setIsModalOpen(false);
            mutate();
        } catch (e: any) {
            toast.error('提交失败: ' + e.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const toggleFoodLink = (foodId: number) => {
        setFormData(prev => {
            const current = prev.linkedFoods || [];
            if (current.includes(foodId)) {
                return { ...prev, linkedFoods: current.filter(id => id !== foodId) };
            } else {
                return { ...prev, linkedFoods: [...current, foodId] };
            }
        });
    };

    if (isLoading) return <div className="flex items-center justify-center h-40 text-zinc-500"><Loader2 className="animate-spin" /></div>;
    if (error) return <div className="text-red-500">加载失败</div>;

    const { recipes, foods, restaurants, categories } = data!;

    return (
        <div className="flex flex-col h-full">
            <div className="flex justify-between items-center mb-4 shrink-0">
                <h2 className="text-lg font-bold text-white">食谱列表</h2>
                <Button onClick={openCreateModal} size="sm" className="bg-amber-600 hover:bg-amber-700 text-white">
                    <Plus size={16} className="mr-1.5" /> 添加食谱
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
                                类型/分类 <SortIcon sortKey="category" />
                            </th>
                            <th className="px-4 py-3 font-medium cursor-pointer hover:text-zinc-300 transition-colors select-none" onClick={() => handleSort('rating')}>
                                评分 <SortIcon sortKey="rating" />
                            </th>
                            <th className="px-4 py-3 font-medium cursor-pointer hover:text-zinc-300 transition-colors select-none" onClick={() => handleSort('restaurant_id')}>
                                关联餐厅 <SortIcon sortKey="restaurant_id" />
                            </th>
                            <th className="px-4 py-3 font-medium text-right">操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedRecipes.map(recipe => (
                            <tr key={recipe.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors flex flex-col md:table-row">
                                <td className="px-4 py-3 flex items-center gap-3">
                                    <div className="relative w-10 h-10 rounded-md overflow-hidden bg-zinc-800 shrink-0">
                                        {recipe.image_url ? (
                                            <Image src={recipe.image_url} alt={recipe.name} fill sizes="40px" className="object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-zinc-600"><ImageIcon size={16} /></div>
                                        )}
                                    </div>
                                    <span className="md:hidden font-bold text-zinc-200">{recipe.name}</span>
                                </td>
                                <td className="px-4 py-2 md:py-3 font-medium text-zinc-200 hidden md:table-cell">{recipe.name}</td>
                                <td className="px-4 py-1.5 md:py-3 text-xs md:text-sm">
                                    <span className="bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded border border-zinc-700 mr-1">{recipe.type === 'can_cook' ? '👩‍🍳 我会做' : '❤️ 我爱吃'}</span>
                                    <span className="bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded border border-zinc-700">{recipe.category}</span>
                                </td>
                                <td className="px-4 py-1.5 md:py-3 text-amber-500 text-xs md:text-sm">★ {recipe.rating}</td>
                                <td className="px-4 py-1.5 md:py-3 text-xs md:text-sm">
                                    {recipe.restaurant_id ? (
                                        <span className="text-indigo-400">{restaurants?.find(r => r.id === recipe.restaurant_id)?.name || '未知餐厅'}</span>
                                    ) : '-'}
                                </td>
                                <td className="px-4 py-3 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <Button variant="ghost" size="icon" onClick={() => openEditModal(recipe)} className="h-8 w-8 text-zinc-400 hover:text-white hover:bg-zinc-800">
                                            <Edit2 size={14} />
                                        </Button>
                                        <Button variant="ghost" size="icon" onClick={() => handleDelete(recipe.id)} className="h-8 w-8 text-red-500/70 hover:text-red-400 hover:bg-red-500/10">
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
                <DialogContent className="bg-zinc-900 border-zinc-800 text-zinc-200 max-w-2xl w-[90vw] max-h-[90vh] overflow-hidden flex flex-col p-0">
                    <DialogHeader className="p-6 pb-4 border-b border-zinc-800 shrink-0">
                        <DialogTitle>{editingId ? '编辑食谱' : '添加食谱'}</DialogTitle>
                    </DialogHeader>
                    <div className="p-6 overflow-y-auto flex-1">
                        <form id="recipe-form" onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">名称</Label>
                                    <Input id="name" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="bg-zinc-950 border-zinc-800 focus-visible:ring-amber-600" required />
                                </div>
                                <div className="space-y-2">
                                    <Label>食谱类型</Label>
                                    <Select value={formData.type} onValueChange={v => setFormData({ ...formData, type: v })}>
                                        <SelectTrigger className="bg-zinc-950 border-zinc-800">
                                            <SelectValue placeholder="选择类型" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-200">
                                            {TYPES.map(t => <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label>常规分类</Label>
                                    <Select value={formData.category} onValueChange={v => setFormData({ ...formData, category: v })}>
                                        <SelectTrigger className="bg-zinc-950 border-zinc-800">
                                            <SelectValue placeholder="分类" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-200">
                                            {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="rating">评分 (1-5)</Label>
                                    <Input id="rating" type="number" step="0.5" min="1" max="5" value={formData.rating} onChange={e => setFormData({ ...formData, rating: parseFloat(e.target.value) })} className="bg-zinc-950 border-zinc-800 focus-visible:ring-amber-600" required />
                                </div>
                                <div className="space-y-2">
                                    <Label>关联探店餐厅 (可选)</Label>
                                    <Select value={formData.restaurant_id ? formData.restaurant_id.toString() : 'none'} onValueChange={v => setFormData({ ...formData, restaurant_id: v === 'none' ? null : parseInt(v) })}>
                                        <SelectTrigger className="bg-zinc-950 border-zinc-800">
                                            <SelectValue placeholder="无关联" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-200 max-h-40">
                                            <SelectItem value="none">无关联</SelectItem>
                                            {restaurants?.map(r => <SelectItem key={r.id} value={r.id.toString()}>{r.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>封面图片</Label>
                                <ImageUpload
                                    value={formData.image_url}
                                    onChange={url => setFormData({ ...formData, image_url: url })}
                                    bucket="food_images"
                                    folder="recipes"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>关联食材 (多选)</Label>
                                <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-md max-h-32 overflow-y-auto flex flex-wrap gap-2">
                                    {foods?.map(f => {
                                        const isSelected = formData.linkedFoods?.includes(f.id);
                                        return (
                                            <button
                                                type="button"
                                                key={f.id}
                                                onClick={() => toggleFoodLink(f.id)}
                                                className={`px-2 py-1 text-xs rounded border transition-colors ${isSelected ? 'bg-amber-600 border-amber-500 text-white' : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:border-zinc-500'}`}
                                            >
                                                {f.name}
                                            </button>
                                        );
                                    })}
                                    {(!foods || foods.length === 0) && <span className="text-zinc-600 text-xs">暂无食材数据</span>}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="notes">食谱笔记 (支持简单 Markdown 与 \n 换行)</Label>
                                <Textarea id="notes" rows={5} value={formData.notes || ''} onChange={e => setFormData({ ...formData, notes: e.target.value })} className="bg-zinc-950 border-zinc-800 focus-visible:ring-amber-600 resize-none font-mono text-sm leading-relaxed" />
                            </div>
                        </form>
                    </div>
                    <DialogFooter className="p-6 pt-4 border-t border-zinc-800 shrink-0">
                        <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)} className="text-zinc-400 hover:text-white">取消</Button>
                        <Button type="submit" form="recipe-form" disabled={isSubmitting} className="bg-amber-600 hover:bg-amber-700 text-white">
                            {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                            保存食谱
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
