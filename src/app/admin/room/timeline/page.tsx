"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trash2, Plus, GitCommitHorizontal, Pencil, Save, X, ImageIcon, Star } from 'lucide-react';
import { toast } from 'sonner';
import { ImageUpload } from '@/components/ui/image-upload'; // 引入已有的上传组件

// 定义接口
interface TimelineItem {
    id: number;
    title: string;
    date: string;
    type: string;
    images: string[];
}

export default function TimelinePage() {
    const [items, setItems] = useState<TimelineItem[]>([]);
    // [修改] 表单状态增加 images 数组
    const [form, setForm] = useState<{ title: string; date: string; type: string; images: string[] }>({
        title: "",
        date: "",
        type: "knowledge",
        images: []
    });
    const [editingId, setEditingId] = useState<number | null>(null);

    // [新增] 临时上传控件的状态（用于重置 ImageUpload）
    const [uploadKey, setUploadKey] = useState(0);

    const fetchItems = async () => {
        const { data } = await supabase.from('profile_timeline').select('*').order('date', { ascending: false });
        if (data) setItems(data);
    };

    useEffect(() => { fetchItems(); }, []);

    const handleSave = async () => {
        if (!form.title || !form.date) return toast.warning("Missing fields");

        const payload = {
            title: form.title,
            date: form.date,
            type: form.type,
            images: form.images // 保存图片数组
        };

        if (editingId) {
            const { error } = await supabase.from('profile_timeline').update(payload).eq('id', editingId);
            if (!error) {
                toast.success("Event updated");
                cancelEdit();
                fetchItems();
            } else {
                toast.error("Update failed: " + error.message);
            }
        } else {
            const { error } = await supabase.from('profile_timeline').insert(payload);
            if (!error) {
                // 重置表单
                setForm({ title: "", date: "", type: "knowledge", images: [] });
                setUploadKey(prev => prev + 1); // 强制重置上传组件
                fetchItems();
                toast.success("Event added");
            } else {
                toast.error("Add failed: " + error.message);
            }
        }
    };

    const startEdit = (item: TimelineItem) => {
        setEditingId(item.id);
        setForm({
            title: item.title,
            date: item.date,
            type: item.type,
            images: item.images || [] // 确保是数组
        });
        setUploadKey(prev => prev + 1);
    };

    const cancelEdit = () => {
        setEditingId(null);
        setForm({ title: "", date: "", type: "knowledge", images: [] });
        setUploadKey(prev => prev + 1);
    };

    const deleteItem = async (id: number) => {
        if (!confirm("Delete?")) return;
        const { error } = await supabase.from('profile_timeline').delete().eq('id', id);
        if (!error) {
            fetchItems();
            toast.success("Deleted");
            if (editingId === id) cancelEdit();
        }
    };

    // [新增] 图片处理逻辑
    const handleImageUpload = (url: string) => {
        if (url) {
            setForm(prev => ({ ...prev, images: [...prev.images, url] }));
            setUploadKey(prev => prev + 1); // 上传完一张后，重置控件以便上传下一张
        }
    };

    const removeImage = (indexToRemove: number) => {
        setForm(prev => ({
            ...prev,
            images: prev.images.filter((_, index) => index !== indexToRemove)
        }));
    };

    const setCoverImage = (index: number) => {
        if (index === 0) return; // 已经是封面
        setForm(prev => {
            const newImages = [...prev.images];
            const [movedImage] = newImages.splice(index, 1);
            newImages.unshift(movedImage); // 移到第一位
            return { ...prev, images: newImages };
        });
    };

    return (
        <div className="space-y-6 text-zinc-200">
            <div className="flex items-center gap-2 mb-6">
                <div className="p-2 bg-zinc-900 rounded-lg border border-zinc-800"><GitCommitHorizontal size={20} className="text-zinc-400" /></div>
                <h1 className="text-2xl font-bold tracking-tight">时间线管理 (Timeline)</h1>
            </div>

            <div className={`grid grid-cols-1 md:grid-cols-4 gap-4 items-start bg-zinc-900/30 p-5 rounded-xl border ${editingId ? 'border-blue-900/50 bg-blue-950/10' : 'border-zinc-800'}`}>
                {/* 左侧基本信息 */}
                <div className="md:col-span-1 space-y-4">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Date</label>
                        <Input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className="bg-black border-zinc-800 text-zinc-300 focus-visible:ring-zinc-700" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Type</label>
                        <select
                            className="flex h-10 w-full rounded-md border border-zinc-800 bg-black px-3 py-2 text-sm text-zinc-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-700"
                            value={form.type}
                            onChange={e => setForm({ ...form, type: e.target.value })}
                        >
                            <option value="knowledge">Knowledge</option>
                            <option value="social">Social</option>
                            <option value="arts">Arts</option>
                        </select>
                    </div>
                </div>

                {/* 中间标题 */}
                <div className="md:col-span-3 space-y-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Title</label>
                    <Input placeholder="Event title..." value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="bg-black border-zinc-800 text-zinc-300 placeholder:text-zinc-700 focus-visible:ring-zinc-700" />
                </div>

                {/* [新增] 图片管理区域 - 占据全宽 */}
                <div className="md:col-span-4 space-y-3 pt-2 border-t border-zinc-800/50">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
                        <ImageIcon size={14} /> Event Gallery ({form.images.length})
                    </label>

                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        {/* 1. 已上传图片列表 */}
                        {form.images.map((img, index) => (
                            <div key={index} className="relative group aspect-4/3 rounded-lg overflow-hidden border border-zinc-800 bg-black">
                                <img src={img} alt={`img-${index}`} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />

                                {/* 封面标记 */}
                                {index === 0 && (
                                    <div className="absolute top-1 left-1 bg-yellow-500/90 text-black text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm flex items-center gap-1">
                                        <Star size={10} fill="currentColor" /> Cover
                                    </div>
                                )}

                                {/* 操作遮罩 */}
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                                    {index !== 0 && (
                                        <button
                                            onClick={() => setCoverImage(index)}
                                            className="text-xs bg-white/10 hover:bg-white/30 text-white px-2 py-1 rounded transition-colors"
                                        >
                                            Set Cover
                                        </button>
                                    )}
                                    <button
                                        onClick={() => removeImage(index)}
                                        className="text-red-400 hover:text-red-300 p-1 bg-red-950/50 rounded-full"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}

                        {/* 2. 上传新图片按钮 (复用 ImageUpload) */}
                        <div className="aspect-4/3">
                            <ImageUpload
                                key={uploadKey} // key 变化会强制重置组件，清空预览图
                                value="" // 始终传空，因为我们是把上传好的 URL 拿走存到数组里
                                onChange={handleImageUpload}
                                bucket="timeline_images" // 请确保您 Supabase 有这个 bucket，或者改成您实际的 bucket 名 (如 'public')
                                folder="timeline"
                                className="w-full h-full"
                            />
                        </div>
                    </div>
                </div>

                {/* 按钮组 */}
                <div className="md:col-span-4 flex gap-2 pt-2 border-t border-zinc-800/50">
                    {editingId ? (
                        <>
                            <Button onClick={handleSave} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"><Save size={16} className="mr-2" /> Update Event</Button>
                            <Button onClick={cancelEdit} variant="secondary" className="bg-zinc-800 text-zinc-300 hover:bg-zinc-700">Cancel</Button>
                        </>
                    ) : (
                        <Button onClick={handleSave} className="w-full bg-white text-black hover:bg-zinc-200"><Plus size={16} className="mr-2" /> Add to Timeline</Button>
                    )}
                </div>
            </div>

            {/* 列表显示 */}
            <div className="border border-zinc-800 rounded-lg overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-zinc-900/50 hover:bg-zinc-900/50 border-zinc-800">
                            <TableHead className="w-[120px] text-zinc-500">Date</TableHead>
                            <TableHead className="text-zinc-400">Title</TableHead>
                            <TableHead className="text-zinc-400">Type</TableHead>
                            <TableHead className="text-zinc-400">Images</TableHead>
                            <TableHead className="text-right text-zinc-500">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {items.map((item) => (
                            <TableRow key={item.id} className={`border-zinc-800 hover:bg-zinc-900/30 ${editingId === item.id ? 'bg-zinc-900/80' : ''}`}>
                                <TableCell className="font-mono text-zinc-500">{item.date}</TableCell>
                                <TableCell className="font-bold text-zinc-300">{item.title}</TableCell>
                                <TableCell>
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border
                                        ${item.type === 'knowledge' ? 'bg-blue-950/30 text-blue-400 border-blue-900/50' :
                                            item.type === 'social' ? 'bg-rose-950/30 text-rose-400 border-rose-900/50' : 'bg-emerald-950/30 text-emerald-400 border-emerald-900/50'}
                                    `}>
                                        {item.type}
                                    </span>
                                </TableCell>
                                <TableCell>
                                    {item.images && item.images.length > 0 ? (
                                        <div className="flex items-center gap-1">
                                            <ImageIcon size={14} className="text-zinc-500" />
                                            <span className="text-xs text-zinc-400">{item.images.length}</span>
                                        </div>
                                    ) : (
                                        <span className="text-zinc-700">-</span>
                                    )}
                                </TableCell>
                                <TableCell className="text-right space-x-2">
                                    <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-white hover:bg-zinc-800" onClick={() => startEdit(item)}>
                                        <Pencil size={14} />
                                    </Button>
                                    <Button variant="ghost" size="sm" className="text-red-900 hover:text-red-400 hover:bg-red-950/30" onClick={() => deleteItem(item.id)}>
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