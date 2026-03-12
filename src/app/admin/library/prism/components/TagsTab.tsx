"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";
import { Loader2, Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";

type TagItem = { id: string; name: string; sort_order: number };

export default function TagsTab() {
    const [directions, setDirections] = useState<TagItem[]>([]);
    const [types, setTypes] = useState<TagItem[]>([]);
    const [loading, setLoading] = useState(true);

    // Dialog state
    const [isOpen, setIsOpen] = useState(false);
    const [editMode, setEditMode] = useState<"direction" | "type" | null>(null);
    const [editingItem, setEditingItem] = useState<TagItem | null>(null);
    const [form, setForm] = useState({ name: "", sort_order: 0 });

    const fetchData = async () => {
        setLoading(true);
        const [dirRes, typeRes] = await Promise.all([
            supabase.from("prism_directions").select("*").order("sort_order"),
            supabase.from("prism_types").select("*").order("sort_order"),
        ]);
        if (dirRes.error) toast.error("加载方向失败");
        else setDirections(dirRes.data || []);

        if (typeRes.error) toast.error("加载性质失败");
        else setTypes(typeRes.data || []);
        
        setLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleOpen = (mode: "direction" | "type", item?: TagItem) => {
        setEditMode(mode);
        if (item) {
            setEditingItem(item);
            setForm({ name: item.name, sort_order: item.sort_order });
        } else {
            setEditingItem(null);
            setForm({ name: "", sort_order: (mode === "direction" ? directions.length : types.length) + 1 });
        }
        setIsOpen(true);
    };

    const handleSave = async () => {
        if (!form.name.trim()) return toast.error("名称不能为空");
        if (!editMode) return;

        const table = editMode === "direction" ? "prism_directions" : "prism_types";
        
        const promise = editingItem
            ? supabase.from(table).update(form).eq("id", editingItem.id)
            : supabase.from(table).insert([form]);

        const { error } = await promise;
        if (error) {
            toast.error(error.message);
        } else {
            toast.success("保存成功");
            setIsOpen(false);
            fetchData();
        }
    };

    const handleDelete = async (mode: "direction" | "type", id: string) => {
        if (!window.confirm("确认删除该标签吗？")) return;
        const table = mode === "direction" ? "prism_directions" : "prism_types";
        const { error } = await supabase.from(table).delete().eq("id", id);
        
        if (error) toast.error(error.message);
        else {
            toast.success("删除成功");
            fetchData();
        }
    };

    if (loading) return <div className="p-10 flex justify-center"><Loader2 className="animate-spin" /></div>;

    const renderList = (mode: "direction" | "type", items: TagItem[], title: string) => (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-950/50">
                <h3 className="font-semibold text-white">{title}</h3>
                <Button size="sm" variant="outline" className="h-8 gap-1 border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-white" onClick={() => handleOpen(mode)}>
                    <Plus size={14} /> 新增
                </Button>
            </div>
            <div className="p-2 space-y-1">
                {items.length === 0 ? (
                    <div className="p-4 text-center text-sm text-zinc-500">空空如也</div>
                ) : items.map(item => (
                    <div key={item.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-zinc-800/50 group transition-colors">
                        <div className="flex items-center gap-3">
                            <span className="text-xs text-zinc-500 font-mono w-4">{item.sort_order}</span>
                            <span className="text-sm font-medium text-zinc-300 group-hover:text-white transition-colors">{item.name}</span>
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button size="icon" variant="ghost" className="h-7 w-7 text-zinc-400 hover:text-white" onClick={() => handleOpen(mode, item)}>
                                <Pencil size={12} />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-7 w-7 text-zinc-400 hover:text-red-400" onClick={() => handleDelete(mode, item.id)}>
                                <Trash2 size={12} />
                            </Button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {renderList("direction", directions, "研究方向 (Directions)")}
                {renderList("type", types, "论文性质 (Types)")}
            </div>

            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="bg-zinc-900 border-zinc-800 text-white">
                    <DialogHeader>
                        <DialogTitle>{editingItem ? "编辑标签" : "新建标签"}</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label>名称</Label>
                            <Input 
                                value={form.name} 
                                onChange={e => setForm({ ...form, name: e.target.value })} 
                                className="bg-zinc-950 border-zinc-800" 
                                placeholder="输入标签名称"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label>显示排序</Label>
                            <Input 
                                type="number" 
                                value={form.sort_order} 
                                onChange={e => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })} 
                                className="bg-zinc-950 border-zinc-800"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsOpen(false)} className="border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-zinc-300">取消</Button>
                        <Button onClick={handleSave} className="bg-orange-600 hover:bg-orange-700 text-white">确认</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
