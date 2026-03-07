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
import { Trash2, Edit2, Plus, Loader2, Image as ImageIcon, ArrowLeft, MenuSquare, ArrowUp, ArrowDown, ArrowUpDown, X } from 'lucide-react';
import { toast } from 'sonner';
import Image from 'next/image';
import { ImageUpload } from '@/components/ui/image-upload';
import { deleteImageFromStorage } from '@/lib/imageUtils';

type Restaurant = {
    id: number;
    name: string;
    category: string;
    address: string;
    rating: number;
    notes: string;
    image_urls: string[];
};

type Dish = {
    id: number;
    restaurant_id: number;
    name: string;
    image_url: string;
    recipe_id: number | null;
    sort_order: number;
};

const fetchRestaurants = async () => {
    const [restRes, catsRes] = await Promise.all([
        supabase.from('diet_restaurants').select('*').order('id', { ascending: false }),
        supabase.from('diet_categories').select('name').eq('module', 'restaurants').order('sort_order')
    ]);
    if (restRes.error) throw restRes.error;
    if (catsRes.error) throw catsRes.error;

    return {
        restaurants: restRes.data as Restaurant[],
        categories: catsRes.data.map(c => c.name) as string[]
    };
};

export default function RestaurantsManager() {
    const { data, error, isLoading, mutate } = useSWR('admin_diet_restaurants_with_cats', fetchRestaurants);

    // 视图状态
    const [managingRestaurantData, setManagingRestaurantData] = useState<Restaurant | null>(null);

    // 餐厅表单状态
    const [isRestModalOpen, setIsRestModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [restEditingId, setRestEditingId] = useState<number | null>(null);
    const [restFormData, setRestFormData] = useState<Partial<Restaurant>>({
        name: '', category: '', address: '', rating: 5, notes: '', image_urls: []
    });
    // 简单处理多图：用逗号分隔的字符串在输入框编辑，保存时拆分
    const [imageUrlsString, setImageUrlsString] = useState('');

    const openCreateRestModal = () => {
        setRestEditingId(null);
        setRestFormData({ name: '', category: data?.categories[0] || '', address: '', rating: 5, notes: '', image_urls: [] });
        setImageUrlsString('');
        setIsRestModalOpen(true);
    };

    const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null);

    const handleSort = (key: string) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const sortedRestaurants = React.useMemo(() => {
        if (!data?.restaurants) return [];
        const sortableItems = [...data.restaurants];
        if (sortConfig !== null) {
            sortableItems.sort((a, b) => {
                const aValue = a[sortConfig.key as keyof Restaurant];
                const bValue = b[sortConfig.key as keyof Restaurant];
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

    const openEditRestModal = (r: Restaurant) => {
        setRestEditingId(r.id);
        setRestFormData({ ...r });
        setImageUrlsString(r.image_urls?.join(',\n') || '');
        setIsRestModalOpen(true);
    };

    const handleRestDelete = async (id: number) => {
        if (!confirm('确定要删除这家餐厅吗？关联的菜品菜单会被一同删除。')) return;
        const itemToDelete = data?.restaurants.find((r: Restaurant) => r.id === id);
        try {
            const { error } = await supabase.from('diet_restaurants').delete().eq('id', id);
            if (error) throw error;

            // 清理餐厅关联的多张图片
            if (itemToDelete?.image_urls && itemToDelete.image_urls.length > 0) {
                for (const url of itemToDelete.image_urls) {
                    await deleteImageFromStorage(url);
                }
            }

            toast.success('删除成功');
            mutate();
        } catch (e: any) {
            toast.error('删除失败: ' + e.message);
        }
    };

    const handleRestSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!restFormData.name || !restFormData.category) {
            toast.error('请填写完整必填项');
            return;
        }

        setIsSubmitting(true);
        try {
            const urls = imageUrlsString.split(',').map(s => s.trim()).filter(s => s.length > 0);
            const dataToSave = {
                name: restFormData.name,
                category: restFormData.category,
                address: restFormData.address,
                rating: restFormData.rating,
                notes: restFormData.notes,
                image_urls: urls
            };

            if (restEditingId) {
                const { error } = await supabase.from('diet_restaurants').update(dataToSave).eq('id', restEditingId);
                if (error) throw error;
                toast.success('更新成功');
            } else {
                const { error } = await supabase.from('diet_restaurants').insert([dataToSave]);
                if (error) throw error;
                toast.success('添加成功');
            }
            setIsRestModalOpen(false);
            mutate();
        } catch (e: any) {
            toast.error('提交失败: ' + e.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) return <div className="flex items-center justify-center h-40 text-zinc-500"><Loader2 className="animate-spin" /></div>;
    if (error) return <div className="text-red-500">加载失败</div>;

    if (managingRestaurantData) {
        return <DishManager restaurant={managingRestaurantData} onBack={() => setManagingRestaurantData(null)} />;
    }

    return (
        <div className="flex flex-col h-full">
            <div className="flex justify-between items-center mb-4 shrink-0">
                <h2 className="text-lg font-bold text-white">餐厅列表</h2>
                <Button onClick={openCreateRestModal} size="sm" className="bg-amber-600 hover:bg-amber-700 text-white">
                    <Plus size={16} className="mr-1.5" /> 添加餐厅
                </Button>
            </div>

            <div className="flex-1 overflow-y-auto rounded-md border border-zinc-800 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-zinc-900/50">
                <table className="w-full text-sm text-left text-zinc-400">
                    <thead className="text-xs text-zinc-500 uppercase bg-zinc-900 sticky top-0 z-10 hidden md:table-header-group shadow-md border-b border-zinc-800">
                        <tr>
                            <th className="px-4 py-3 font-medium w-16">封面</th>
                            <th className="px-4 py-3 font-medium cursor-pointer hover:text-zinc-300 transition-colors select-none" onClick={() => handleSort('name')}>
                                名称 <SortIcon sortKey="name" />
                            </th>
                            <th className="px-4 py-3 font-medium cursor-pointer hover:text-zinc-300 transition-colors select-none" onClick={() => handleSort('category')}>
                                分类 <SortIcon sortKey="category" />
                            </th>
                            <th className="px-4 py-3 font-medium cursor-pointer hover:text-zinc-300 transition-colors select-none" onClick={() => handleSort('rating')}>
                                评分 <SortIcon sortKey="rating" />
                            </th>
                            <th className="px-4 py-3 font-medium hidden lg:table-cell">地址</th>
                            <th className="px-4 py-3 font-medium text-right">操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedRestaurants.map(r => (
                            <tr key={r.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors flex flex-col md:table-row">
                                <td className="px-4 py-3 flex items-center gap-3">
                                    <div className="relative w-10 h-10 rounded-md overflow-hidden bg-zinc-800 shrink-0">
                                        {r.image_urls?.[0] ? (
                                            <Image src={r.image_urls[0]} alt={r.name} fill sizes="40px" className="object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-zinc-600"><ImageIcon size={16} /></div>
                                        )}
                                    </div>
                                    <span className="md:hidden font-bold text-zinc-200">{r.name}</span>
                                </td>
                                <td className="px-4 py-2 md:py-3 font-bold text-zinc-200 hidden md:table-cell">{r.name}</td>
                                <td className="px-4 py-1.5 md:py-3 text-xs md:text-sm">
                                    <span className="bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded border border-zinc-700">{r.category}</span>
                                </td>
                                <td className="px-4 py-1.5 md:py-3 text-amber-500 text-xs md:text-sm">★ {r.rating}</td>
                                <td className="px-4 py-1.5 md:py-3 text-xs md:text-sm text-zinc-500 line-clamp-1 hidden lg:table-cell">{r.address}</td>
                                <td className="px-4 py-3 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <Button variant="secondary" size="sm" onClick={() => setManagingRestaurantData(r)} className="h-8 bg-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-700 border border-zinc-700">
                                            <MenuSquare size={14} className="mr-1.5" /> 菜单配置
                                        </Button>
                                        <Button variant="ghost" size="icon" onClick={() => openEditRestModal(r)} className="h-8 w-8 text-zinc-400 hover:text-white hover:bg-zinc-800">
                                            <Edit2 size={14} />
                                        </Button>
                                        <Button variant="ghost" size="icon" onClick={() => handleRestDelete(r.id)} className="h-8 w-8 text-red-500/70 hover:text-red-400 hover:bg-red-500/10">
                                            <Trash2 size={14} />
                                        </Button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* 新增/编辑餐厅弹窗 */}
            <Dialog open={isRestModalOpen} onOpenChange={setIsRestModalOpen}>
                <DialogContent className="bg-zinc-900 border-zinc-800 text-zinc-200 max-w-md max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{restEditingId ? '编辑餐厅信息' : '添加餐厅'}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleRestSubmit} className="space-y-4 mt-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">餐厅名称</Label>
                                <Input id="name" value={restFormData.name} onChange={e => setRestFormData({ ...restFormData, name: e.target.value })} className="bg-zinc-950 border-zinc-800" required />
                            </div>
                            <div className="space-y-2">
                                <Label>分类</Label>
                                <Select value={restFormData.category} onValueChange={v => setRestFormData({ ...restFormData, category: v })}>
                                    <SelectTrigger className="bg-zinc-950 border-zinc-800">
                                        <SelectValue placeholder="选择分类" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-200">
                                        {data?.categories?.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="address">详细地址</Label>
                            <Input id="address" value={restFormData.address} onChange={e => setRestFormData({ ...restFormData, address: e.target.value })} className="bg-zinc-950 border-zinc-800" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="rating">体验评分 (1-5)</Label>
                            <Input id="rating" type="number" step="0.5" min="1" max="5" value={restFormData.rating} onChange={e => setRestFormData({ ...restFormData, rating: parseFloat(e.target.value) })} className="bg-zinc-950 border-zinc-800" required />
                        </div>
                        <div className="space-y-2">
                            <Label>餐厅照片 (支持多张)</Label>
                            <div className="grid grid-cols-3 gap-2 mb-2">
                                {imageUrlsString.split(',').map(s => s.trim()).filter(s => s).map((url, index) => (
                                    <div key={index} className="relative aspect-square rounded-md overflow-hidden border border-zinc-800 group">
                                        <Image src={url} alt={`Preview ${index}`} fill className="object-cover" />
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const urls = imageUrlsString.split(',').map(s => s.trim()).filter(s => s);
                                                urls.splice(index, 1);
                                                setImageUrlsString(urls.join(',\n'));
                                            }}
                                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <X size={10} />
                                        </button>
                                    </div>
                                ))}
                                <div className="aspect-square">
                                    <ImageUpload
                                        onChange={(url) => {
                                            const current = imageUrlsString.trim();
                                            setImageUrlsString(current ? `${current},\n${url}` : url);
                                        }}
                                        bucket="food_images"
                                        folder="restaurants"
                                        className="h-full!"
                                    />
                                </div>
                            </div>
                            <p className="text-[10px] text-zinc-500 italic">提示：支持从剪贴板直接粘贴图片。点击上方按钮或拖入图片即可上传。</p>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="notes">餐厅评价/随笔笔记</Label>
                            <Textarea id="notes" rows={3} value={restFormData.notes || ''} onChange={e => setRestFormData({ ...restFormData, notes: e.target.value })} className="bg-zinc-950 border-zinc-800 resize-none font-mono text-sm leading-relaxed" />
                        </div>
                        <DialogFooter className="pt-4">
                            <Button type="button" variant="ghost" onClick={() => setIsRestModalOpen(false)} className="text-zinc-400 hover:text-white">取消</Button>
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

// -------------------------------------------------------------
// 子组件：特定餐厅菜单管理视图
// -------------------------------------------------------------
function DishManager({ restaurant, onBack }: { restaurant: Restaurant; onBack: () => void }) {
    const { data: dishes, error, isLoading, mutate } = useSWR(`admin_diet_dishes_${restaurant.id}`, async () => {
        const { data, error } = await supabase.from('diet_restaurant_dishes').select('*').eq('restaurant_id', restaurant.id).order('sort_order');
        if (error) throw error;
        return data as Dish[];
    });

    const { data: recipes } = useSWR('admin_diet_recipes_summary', async () => {
        const { data, error } = await supabase.from('diet_recipes').select('id, name');
        if (error) throw error;
        return data;
    });

    const [isDishModalOpen, setIsDishModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [dishEditingId, setDishEditingId] = useState<number | null>(null);
    const [dishFormData, setDishFormData] = useState<Partial<Dish>>({
        name: '', image_url: '', recipe_id: null, sort_order: 0
    });
    const [linkedRecipeName, setLinkedRecipeName] = useState('');

    const openCreateDishModal = () => {
        setDishEditingId(null);
        setDishFormData({ name: '', image_url: '', recipe_id: null, sort_order: (dishes?.length || 0) * 10 });
        setLinkedRecipeName('');
        setIsDishModalOpen(true);
    };

    const openEditDishModal = (d: Dish) => {
        setDishEditingId(d.id);
        setDishFormData({ ...d });
        const matched = recipes?.find(r => r.id === d.recipe_id);
        setLinkedRecipeName(matched ? matched.name : '');
        setIsDishModalOpen(true);
    };

    const handleDishDelete = async (id: number) => {
        if (!confirm('确定要移出这道菜？')) return;
        const itemToDelete = dishes?.find((d: Dish) => d.id === id);
        try {
            const { error } = await supabase.from('diet_restaurant_dishes').delete().eq('id', id);
            if (error) throw error;

            // 清理菜品图片
            if (itemToDelete?.image_url) {
                await deleteImageFromStorage(itemToDelete.image_url);
            }

            toast.success('删除成功');
            mutate();
        } catch (e: any) {
            toast.error('删除失败: ' + e.message);
        }
    };

    const handleDishSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!dishFormData.name) {
            toast.error('请填写菜品名称');
            return;
        }

        let finalRecipeId = null;
        if (linkedRecipeName.trim()) {
            const match = recipes?.find(r => r.name === linkedRecipeName.trim());
            if (match) {
                finalRecipeId = match.id;
            } else {
                toast.error(`找不到名为 "${linkedRecipeName.trim()}" 的食谱，请检查输入或先去食谱库创建。`);
                return;
            }
        }

        setIsSubmitting(true);
        try {
            const dataToSave = {
                restaurant_id: restaurant.id,
                name: dishFormData.name,
                image_url: dishFormData.image_url,
                recipe_id: finalRecipeId,
                sort_order: dishFormData.sort_order || 0
            };

            if (dishEditingId) {
                const { error } = await supabase.from('diet_restaurant_dishes').update(dataToSave).eq('id', dishEditingId);
                if (error) throw error;
                toast.success('菜品更新成功');
            } else {
                const { error } = await supabase.from('diet_restaurant_dishes').insert([dataToSave]);
                if (error) throw error;
                toast.success('菜品添加成功');
            }
            setIsDishModalOpen(false);
            mutate();
        } catch (e: any) {
            toast.error('提交失败: ' + e.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex flex-col h-full animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 mb-4 shrink-0">
                <Button variant="ghost" size="icon" onClick={onBack} className="text-zinc-400 hover:text-white hover:bg-zinc-800">
                    <ArrowLeft size={18} />
                </Button>
                <div>
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        <span>{restaurant.name}</span>
                        <span className="text-sm font-normal text-zinc-500">的菜单管理</span>
                    </h2>
                </div>
                <div className="ml-auto">
                    <Button onClick={openCreateDishModal} size="sm" className="bg-zinc-100 hover:bg-white text-zinc-900">
                        <Plus size={16} className="mr-1.5" /> 录入菜品
                    </Button>
                </div>
            </div>

            {isLoading ? (
                <div className="flex flex-1 items-center justify-center text-zinc-500"><Loader2 className="animate-spin" /></div>
            ) : error ? (
                <div className="text-red-500">加载失败</div>
            ) : (
                <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-zinc-900/50 pr-2 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 content-start">
                    {dishes?.map(dish => (
                        <div key={dish.id} className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden group">
                            <div className="relative aspect-square w-full bg-zinc-800">
                                {dish.image_url ? (
                                    <Image src={dish.image_url} alt={dish.name} fill sizes="200px" className="object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-zinc-600"><ImageIcon size={24} /></div>
                                )}
                                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button variant="secondary" size="icon" onClick={() => openEditDishModal(dish)} className="h-7 w-7 bg-black/60 hover:bg-black/90 text-white backdrop-blur-sm shadow-sm border border-white/10">
                                        <Edit2 size={12} />
                                    </Button>
                                    <Button variant="secondary" size="icon" onClick={() => handleDishDelete(dish.id)} className="h-7 w-7 bg-red-950/80 hover:bg-red-900 text-white backdrop-blur-sm shadow-sm border border-white/10">
                                        <Trash2 size={12} />
                                    </Button>
                                </div>
                            </div>
                            <div className="p-3">
                                <h4 className="text-sm font-medium text-zinc-200 truncate">{dish.name}</h4>
                                <div className="mt-1 text-xs text-zinc-500 flex justify-between items-center">
                                    <span>
                                        {dish.recipe_id ? (
                                            <span className="text-indigo-400">⚡ 关联: {recipes?.find(r => r.id === dish.recipe_id)?.name || `ID ${dish.recipe_id}`}</span>
                                        ) : '无关联跳转'}
                                    </span>
                                    <span className="text-[10px] font-mono opacity-50"># {dish.sort_order}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                    {dishes?.length === 0 && (
                        <div className="col-span-full py-12 text-center border-2 border-dashed border-zinc-800 rounded-xl text-zinc-500 text-sm">
                            这个餐厅还没有添加推荐菜品
                        </div>
                    )}
                </div>
            )}

            {/* 编辑子菜品弹窗 */}
            <Dialog open={isDishModalOpen} onOpenChange={setIsDishModalOpen}>
                <DialogContent className="bg-zinc-900 border-zinc-800 text-zinc-200 max-w-sm">
                    <DialogHeader>
                        <DialogTitle>{dishEditingId ? '编辑菜品' : '新增推荐菜品'}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleDishSubmit} className="space-y-4 mt-4">
                        <div className="space-y-2">
                            <Label htmlFor="dish_name">菜品名称</Label>
                            <Input id="dish_name" value={dishFormData.name} onChange={e => setDishFormData({ ...dishFormData, name: e.target.value })} className="bg-zinc-950 border-zinc-800" required />
                        </div>
                        <div className="space-y-2">
                            <Label>菜品图片</Label>
                            <ImageUpload
                                value={dishFormData.image_url}
                                onChange={url => setDishFormData({ ...dishFormData, image_url: url })}
                                bucket="food_images"
                                folder="dishes"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="linked_recipe_name">关联馆内食谱名称 (严格匹配/选填)</Label>
                            <Input
                                id="linked_recipe_name"
                                value={linkedRecipeName}
                                onChange={e => setLinkedRecipeName(e.target.value)}
                                placeholder="如: 番茄炒蛋 (留空则不联动)"
                                className="bg-zinc-950 border-zinc-800"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="dish_sort">排序优先级 (数字越小越靠前)</Label>
                            <Input id="dish_sort" type="number" value={dishFormData.sort_order} onChange={e => setDishFormData({ ...dishFormData, sort_order: parseInt(e.target.value) || 0 })} className="bg-zinc-950 border-zinc-800" />
                        </div>
                        <DialogFooter className="pt-4">
                            <Button type="button" variant="ghost" onClick={() => setIsDishModalOpen(false)} className="text-zinc-400 hover:text-white">取消</Button>
                            <Button type="submit" disabled={isSubmitting} className="bg-zinc-100 hover:bg-white text-zinc-900">
                                {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                                保存单品
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
