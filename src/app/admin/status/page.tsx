"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Plus, Pencil, Trash, CheckCircle2, Circle } from 'lucide-react';
import { toast } from 'sonner';
// import { Switch } from '@/components/ui/switch'; // Switch component not available, using native checkbox

// === 类型定义 ===
interface StatusItem {
    id: number;
    domain: string;
    category: string;
    label: string;
    is_active: boolean;
    sort_order: number;
}

const DOMAIN_OPTIONS = [
    { value: 'learning', label: '学习 (Learning)' },
    { value: 'body', label: '身体 (Body)' },
    { value: 'mind', label: '心绪 (Mind)' }
];

const CATEGORY_OPTIONS: Record<string, { value: string; label: string }[]> = {
    learning: [
        { value: 'knowledge', label: '知识探索' },
        { value: 'focus', label: '坚持专注' },
        { value: 'goals', label: '长期目标' }
    ],
    body: [
        { value: 'health', label: '身体健康' },
        { value: 'exercise', label: '运动锻炼' },
        { value: 'diet', label: '饮食起居' }
    ],
    mind: [
        { value: 'emotion', label: '情感寄托' },
        { value: 'social', label: '人际交流' },
        { value: 'control', label: '情绪控制' }
    ]
};

export default function StatusAdmin() {
    const [items, setItems] = useState<StatusItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [isOpen, setIsOpen] = useState(false);
    const [currentItem, setCurrentItem] = useState<Partial<StatusItem>>({});

    useEffect(() => {
        fetchItems();
    }, []);

    const fetchItems = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('profile_status_items')
            .select('*')
            .order('domain', { ascending: true })
            .order('category', { ascending: true })
            .order('sort_order', { ascending: true })
            .order('id', { ascending: true });

        if (error) {
            toast.error('Failed to fetch items');
            console.error(error);
        } else {
            setItems(data || []);
        }
        setLoading(false);
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this item?')) return;

        const { error } = await supabase.from('profile_status_items').delete().eq('id', id);
        if (error) {
            toast.error('Delete failed');
        } else {
            toast.success('Item deleted');
            fetchItems();
        }
    };

    const handleSave = async () => {
        if (!currentItem.domain || !currentItem.category || !currentItem.label) {
            toast.error('Domain, Category and Label are required');
            return;
        }

        try {
            const payload = {
                domain: currentItem.domain,
                category: currentItem.category,
                label: currentItem.label,
                is_active: currentItem.is_active || false,
                sort_order: Number(currentItem.sort_order) || 0
            };

            if (currentItem.id) {
                const { error } = await supabase
                    .from('profile_status_items')
                    .update(payload)
                    .eq('id', currentItem.id);
                if (error) throw error;
                toast.success('Item updated');
            } else {
                const { error } = await supabase
                    .from('profile_status_items')
                    .insert([payload]);
                if (error) throw error;
                toast.success('Item created');
            }

            setIsOpen(false);
            setCurrentItem({});
            fetchItems();
        } catch (error: any) {
            toast.error('Operation failed: ' + error.message);
        }
    };

    const openEdit = (item: StatusItem) => {
        setCurrentItem(item);
        setIsOpen(true);
    };

    const openCreate = () => {
        // Default to first domain/Category
        setCurrentItem({
            domain: 'learning',
            category: 'knowledge',
            is_active: true,
            sort_order: 0
        });
        setIsOpen(true);
    };

    const toggleStatus = async (item: StatusItem) => {
        const newStatus = !item.is_active;
        // Optimistic update
        setItems(prev => prev.map(i => i.id === item.id ? { ...i, is_active: newStatus } : i));

        const { error } = await supabase
            .from('profile_status_items')
            .update({ is_active: newStatus })
            .eq('id', item.id);

        if (error) {
            toast.error('Status update failed');
            fetchItems(); // revert
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold tracking-tight text-white">状态管理 (Status Items)</h2>
                <Dialog open={isOpen} onOpenChange={setIsOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={openCreate} className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
                            <Plus size={16} /> 添加条目
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-zinc-950 border-zinc-800 text-gray-100 max-w-md">
                        <DialogHeader>
                            <DialogTitle>{currentItem.id ? '编辑条目' : '添加新条目'}</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="space-y-2">
                                <Label>领域 (Domain)</Label>
                                <select
                                    value={currentItem.domain || ''}
                                    onChange={e => setCurrentItem({ ...currentItem, domain: e.target.value, category: CATEGORY_OPTIONS[e.target.value]?.[0]?.value || '' })}
                                    className="flex h-10 w-full rounded-md border border-zinc-800 bg-black px-3 py-2 text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-600"
                                >
                                    {DOMAIN_OPTIONS.map(opt => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <Label>分类 (Category)</Label>
                                <select
                                    value={currentItem.category || ''}
                                    onChange={e => setCurrentItem({ ...currentItem, category: e.target.value })}
                                    className="flex h-10 w-full rounded-md border border-zinc-800 bg-black px-3 py-2 text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-600"
                                    disabled={!currentItem.domain}
                                >
                                    {currentItem.domain && CATEGORY_OPTIONS[currentItem.domain]?.map(opt => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <Label>内容 (Label)</Label>
                                <Input
                                    value={currentItem.label || ''}
                                    onChange={e => setCurrentItem({ ...currentItem, label: e.target.value })}
                                    className="bg-black border-zinc-800"
                                    placeholder="例如: 早睡早起"
                                />
                            </div>

                            <div className="flex gap-4">
                                <div className="space-y-2 flex-1">
                                    <Label>排序权重</Label>
                                    <Input
                                        type="number"
                                        value={currentItem.sort_order ?? 0}
                                        onChange={e => setCurrentItem({ ...currentItem, sort_order: Number(e.target.value) })}
                                        className="bg-black border-zinc-800"
                                    />
                                </div>
                                <div className="space-y-2 flex items-center pt-8">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={currentItem.is_active || false}
                                            onChange={e => setCurrentItem({ ...currentItem, is_active: e.target.checked })}
                                            className="w-4 h-4 rounded border-zinc-700 bg-zinc-900 text-blue-600 focus:ring-blue-600"
                                        />
                                        <span className="text-sm font-medium text-gray-300">默认激活</span>
                                    </label>
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 mt-4">
                                <Button variant="outline" onClick={() => setIsOpen(false)} className="border-zinc-700 bg-transparent hover:bg-zinc-800 text-gray-300">取消</Button>
                                <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white">保存</Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="rounded-md border border-zinc-800 bg-zinc-950/50">
                <Table>
                    <TableHeader>
                        <TableRow className="border-zinc-800 hover:bg-zinc-900/50">
                            <TableHead className="text-zinc-400 w-[80px]">Domain</TableHead>
                            <TableHead className="text-zinc-400 w-[120px]">Category</TableHead>
                            <TableHead className="text-zinc-400">Content</TableHead>
                            <TableHead className="text-zinc-400 w-[80px]">Status</TableHead>
                            <TableHead className="text-zinc-400 w-[60px]">Sort</TableHead>
                            <TableHead className="text-zinc-400 text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-10 text-zinc-500">加载中...</TableCell>
                            </TableRow>
                        ) : items.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-10 text-zinc-500">
                                    暂无条目。请点击右上角添加。
                                </TableCell>
                            </TableRow>
                        ) : (
                            items.map((item) => (
                                <TableRow key={item.id} className="border-zinc-800 hover:bg-zinc-900/50">
                                    <TableCell className="font-mono text-zinc-500 text-xs uppercase">{item.domain}</TableCell>
                                    <TableCell>
                                        <span className="px-2 py-1 rounded-md bg-zinc-900 border border-zinc-800 text-xs text-zinc-300">
                                            {CATEGORY_OPTIONS[item.domain]?.find(c => c.value === item.category)?.label || item.category}
                                        </span>
                                    </TableCell>
                                    <TableCell className="font-medium text-gray-200">{item.label}</TableCell>
                                    <TableCell>
                                        <button onClick={() => toggleStatus(item)} className="transition-transform active:scale-90">
                                            {item.is_active ? (
                                                <CheckCircle2 size={20} className="text-green-500" />
                                            ) : (
                                                <Circle size={20} className="text-zinc-600" />
                                            )}
                                        </button>
                                    </TableCell>
                                    <TableCell className="text-zinc-500 text-xs">{item.sort_order}</TableCell>
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
