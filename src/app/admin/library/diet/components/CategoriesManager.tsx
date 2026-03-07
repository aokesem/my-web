"use client";

import React, { useState } from 'react';
import useSWR from 'swr';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Edit2, Plus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

type Category = {
    id: number;
    module: 'foods' | 'recipes' | 'restaurants';
    name: string;
    icon?: string;
    sort_order: number;
};

const MODULE_LABELS: Record<'foods' | 'recipes' | 'restaurants', string> = {
    foods: '食材库',
    recipes: '食谱大纲',
    restaurants: '合作餐厅'
};

const fetchCategories = async () => {
    const { data, error } = await supabase.from('diet_categories').select('*').order('module').order('sort_order').order('id');
    if (error) throw error;
    return data as Category[];
};

export default function CategoriesManager() {
    const { data: categories, error, isLoading, mutate } = useSWR('admin_diet_categories', fetchCategories);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [formData, setFormData] = useState<Partial<Category>>({
        module: 'foods',
        name: '',
        icon: '',
        sort_order: 10
    });

    const openCreateModal = () => {
        setEditingId(null);
        setFormData({ module: 'foods', name: '', icon: '', sort_order: 10 });
        setIsModalOpen(true);
    };

    const openEditModal = (cat: Category) => {
        setEditingId(cat.id);
        setFormData({ ...cat });
        setIsModalOpen(true);
    };

    const handleDelete = async (id: number) => {
        if (!confirm('确定要删除这个分类吗？系统已在使用的这些分类的旧数据仍会保留此文字，但日后筛选可能会出现未知影响。建议保留或重命名。')) return;
        try {
            const { error } = await supabase.from('diet_categories').delete().eq('id', id);
            if (error) throw error;
            toast.success('删除成功');
            mutate();
        } catch (e: any) {
            toast.error('删除失败: ' + e.message);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name || !formData.module) {
            toast.error('请填写完整必填项');
            return;
        }

        setIsSubmitting(true);
        try {
            if (editingId) {
                const { error } = await supabase.from('diet_categories').update({
                    module: formData.module,
                    name: formData.name,
                    icon: formData.icon || null,
                    sort_order: formData.sort_order
                }).eq('id', editingId);
                if (error) throw error;
                toast.success('更新成功');
            } else {
                const { error } = await supabase.from('diet_categories').insert([{
                    module: formData.module,
                    name: formData.name,
                    icon: formData.icon || null,
                    sort_order: formData.sort_order
                }]);
                if (error) throw error;
                toast.success('添加成功');
            }
            setIsModalOpen(false);
            mutate();
        } catch (e: any) {
            if (e.code === '23505') {
                toast.error('添加失败：在此模块下该分类名称已经存在！');
            } else {
                toast.error('提交失败: ' + e.message);
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) return <div className="flex flex-1 items-center justify-center text-zinc-500"><Loader2 className="animate-spin" /></div>;
    if (error) return <div className="text-red-500">加载失败</div>;

    // Grouping for better UI display
    const groupedData = categories?.reduce((acc, cat) => {
        if (!acc[cat.module]) acc[cat.module] = [];
        acc[cat.module].push(cat);
        return acc;
    }, {} as Record<string, Category[]>) || {};

    return (
        <div className="flex flex-col h-full overflow-hidden">
            <div className="flex justify-between items-center mb-4 shrink-0">
                <h2 className="text-lg font-bold text-white">分类字段设置</h2>
                <Button onClick={openCreateModal} size="sm" className="bg-amber-600 hover:bg-amber-700 text-white">
                    <Plus size={16} className="mr-1.5" /> 新增分类
                </Button>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar rounded-xl border border-zinc-800 bg-zinc-950/30 p-4 space-y-8">
                {(['foods', 'recipes', 'restaurants'] as const).map(mod => (
                    <div key={mod} className="space-y-3">
                        <div className="flex items-center gap-2 border-b border-zinc-800 pb-2">
                            <span className="text-sm font-bold text-zinc-300 uppercase tracking-wider">{MODULE_LABELS[mod]}</span>
                            <span className="text-xs text-zinc-600 px-2 py-0.5 bg-zinc-900 rounded-full">{groupedData[mod]?.length || 0} 项</span>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                            {groupedData[mod]?.map(cat => (
                                <div key={cat.id} className="flex flex-col justify-between bg-zinc-900 border border-zinc-800 rounded-lg p-3 group hover:border-zinc-700 transition-colors">
                                    <div className="flex items-center gap-2 mb-2">
                                        {(() => {
                                            const IconComponent = cat.icon ? (require('lucide-react') as any)[cat.icon] : null;
                                            return IconComponent ? <IconComponent size={16} className="text-zinc-400" /> : null;
                                        })()}
                                        <span className="font-medium text-zinc-200 truncate">{cat.name}</span>
                                        <span className="text-[10px] text-zinc-500 bg-zinc-950 px-1.5 py-0.5 rounded ml-auto">#{cat.sort_order}</span>
                                    </div>
                                    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity mt-2">
                                        <Button variant="secondary" size="icon" onClick={() => openEditModal(cat)} className="h-6 w-6 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white">
                                            <Edit2 size={12} />
                                        </Button>
                                        <Button variant="secondary" size="icon" onClick={() => handleDelete(cat.id)} className="h-6 w-6 bg-red-950/40 hover:bg-red-900 text-red-500 hover:text-white">
                                            <Trash2 size={12} />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                            {(!groupedData[mod] || groupedData[mod].length === 0) && (
                                <div className="text-xs text-zinc-600 italic py-2">暂无分类数据</div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="bg-zinc-900 border-zinc-800 text-zinc-200 max-w-sm">
                    <DialogHeader>
                        <DialogTitle>{editingId ? '修改分类' : '增加全局分类'}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                        <div className="space-y-2">
                            <Label>归属目标模块</Label>
                            <Select value={formData.module} onValueChange={(v: any) => setFormData({ ...formData, module: v })} disabled={!!editingId}>
                                <SelectTrigger className="bg-zinc-950 border-zinc-800">
                                    <SelectValue placeholder="选择所属模块" />
                                </SelectTrigger>
                                <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-200">
                                    <SelectItem value="foods">食材库</SelectItem>
                                    <SelectItem value="recipes">食谱大纲</SelectItem>
                                    <SelectItem value="restaurants">合作餐厅</SelectItem>
                                </SelectContent>
                            </Select>
                            {!!editingId && <p className="text-xs text-amber-500/70">分类的所属模块一旦确立无法变更，只能重新创建。</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="cat_name">显示名称</Label>
                            <Input id="cat_name" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="bg-zinc-950 border-zinc-800" required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="cat_icon">图标标识 (Lucide Icon 英文名称, 选填)</Label>
                            <div className="flex gap-2">
                                <Input id="cat_icon" value={formData.icon || ''} onChange={e => setFormData({ ...formData, icon: e.target.value })} placeholder="例如: Apple, Flame" className="bg-zinc-950 border-zinc-800 flex-1 font-mono text-sm" />
                                <div className="w-10 h-10 shrink-0 bg-zinc-950 border border-zinc-800 rounded-md flex items-center justify-center text-zinc-400">
                                    {(() => {
                                        if (!formData.icon) return <span className="opacity-30">?</span>;
                                        const LucideIcons = require('lucide-react') as any;
                                        const IconComponent = LucideIcons[formData.icon];
                                        return IconComponent ? <IconComponent size={18} /> : <span className="text-red-500 font-bold text-xs">!</span>;
                                    })()}
                                </div>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="sort_order">排序标识 (默认从小到大)</Label>
                            <Input id="sort_order" type="number" value={formData.sort_order} onChange={e => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })} className="bg-zinc-950 border-zinc-800" />
                        </div>
                        <DialogFooter className="pt-4">
                            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)} className="text-zinc-400 hover:text-white">取消</Button>
                            <Button type="submit" disabled={isSubmitting} className="bg-amber-600 hover:bg-amber-700 text-white">
                                {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                                保存分类
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
