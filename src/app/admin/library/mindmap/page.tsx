"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { getIconComponent } from "@/lib/iconMap";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea"; // Assuming Textarea exists
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
    Plus,
    Pencil,
    Trash2,
    Search,
    Loader2,
    Layers
} from "lucide-react";

type MindMap = {
    id: string;
    title: string;
    en_title: string;
    description: string;
    icon: string;
    color: string;
    bg_color: string;
    status: string;
    sort_order: number;
    nodes_data?: any;
};

export default function MindMapAdminPage() {
    const [maps, setMaps] = useState<MindMap[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    // Dialog States
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [currentMap, setCurrentMap] = useState<MindMap | null>(null);

    // Forms
    const [formData, setFormData] = useState<Partial<MindMap>>({
        id: "",
        title: "",
        en_title: "",
        description: "",
        icon: "Compass",
        color: "text-sky-500",
        bg_color: "bg-sky-50/50",
        status: "Draft",
        sort_order: 0
    });

    const fetchMaps = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from("mind_maps")
            .select("*")
            .order("sort_order", { ascending: true });

        if (error) {
            toast.error("Failed to load mind maps");
            console.error(error);
        } else {
            setMaps(data || []);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchMaps();
    }, []);

    const handleCreate = async () => {
        if (!formData.id || !formData.title || !formData.icon) {
            toast.error("Please fill in required fields (ID, Title, Icon)");
            return;
        }

        const { error } = await supabase.from("mind_maps").insert([formData]);

        if (error) {
            toast.error("Failed to create mind map: " + error.message);
        } else {
            toast.success("Mind map created successfully");
            setIsAddOpen(false);
            fetchMaps();
            setFormData({
                id: "",
                title: "",
                en_title: "",
                description: "",
                icon: "Compass",
                color: "text-sky-500",
                bg_color: "bg-sky-50/50",
                status: "Draft",
                sort_order: 0
            });
        }
    };

    const handleEditClick = (map: MindMap) => {
        setCurrentMap(map);
        setFormData(map);
        setIsEditOpen(true);
    };

    const handleUpdate = async () => {
        if (!currentMap) return;

        const { error } = await supabase
            .from("mind_maps")
            .update({
                title: formData.title,
                en_title: formData.en_title,
                description: formData.description,
                icon: formData.icon,
                color: formData.color,
                bg_color: formData.bg_color,
                status: formData.status,
                sort_order: formData.sort_order
            })
            .eq("id", currentMap.id);

        if (error) {
            toast.error("Failed to update mind map");
        } else {
            toast.success("Mind map updated");
            setIsEditOpen(false);
            fetchMaps();
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this mind map? This action cannot be undone.")) return;

        const { error } = await supabase.from("mind_maps").delete().eq("id", id);

        if (error) {
            toast.error("Failed to delete mind map");
        } else {
            toast.success("Mind map deleted");
            fetchMaps();
        }
    };

    const filteredMaps = maps.filter(m =>
        m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.id.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-zinc-50 mb-2">思维导图</h1>
                    <p className="text-zinc-400">管理逻辑画布和空间图</p>
                </div>
                <Button onClick={() => setIsAddOpen(true)} className="bg-sky-600 hover:bg-sky-700 text-white gap-2">
                    <Plus size={16} /> 新建导图
                </Button>
            </div>

            {/* Toolbar */}
            <div className="flex items-center gap-4 bg-[#18181b] p-4 rounded-xl border border-zinc-800">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                    <Input
                        placeholder="Search maps..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="pl-9 bg-zinc-950 border-zinc-700 text-zinc-200 placeholder:text-zinc-600"
                    />
                </div>
            </div>

            {/* List */}
            <div className="rounded-xl border border-zinc-800 bg-[#18181b] overflow-hidden">
                <Table>
                    <TableHeader className="bg-zinc-900/50">
                        <TableRow className="border-zinc-800 hover:bg-transparent">
                            <TableHead className="text-zinc-400">ID / Info</TableHead>
                            <TableHead className="text-zinc-400">Appearance</TableHead>
                            <TableHead className="text-zinc-400">Status</TableHead>
                            <TableHead className="text-zinc-400 text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={4} className="h-24 text-center text-zinc-500">
                                    <div className="flex justify-center items-center gap-2">
                                        <Loader2 className="animate-spin" size={16} /> Loading...
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : filteredMaps.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="h-32 text-center text-zinc-500">
                                    No mind maps found. Create one to get started.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredMaps.map((map) => {
                                const Icon = getIconComponent(map.icon);
                                return (
                                    <TableRow key={map.id} className="border-zinc-800 hover:bg-zinc-800/30">
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 rounded-lg bg-zinc-900 border border-zinc-700 text-zinc-400`}>
                                                    <Icon size={18} />
                                                </div>
                                                <div>
                                                    <div className="font-medium text-zinc-200">{map.title}</div>
                                                    <div className="text-xs text-zinc-500 font-mono">{map.id}</div>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col gap-1 text-xs">
                                                <span className="text-zinc-400">Icon: <span className="font-mono text-zinc-300">{map.icon}</span></span>
                                                <span className="text-zinc-400">Color: <span className="font-mono text-zinc-300">{map.color}</span></span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="bg-zinc-900 text-zinc-400 border-zinc-700">
                                                {map.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Button variant="ghost" size="icon" onClick={() => handleEditClick(map)} className="h-8 w-8 text-zinc-400 hover:text-white hover:bg-zinc-800">
                                                    <Pencil size={15} />
                                                </Button>
                                                <Button variant="ghost" size="icon" onClick={() => handleDelete(map.id)} className="h-8 w-8 text-zinc-400 hover:text-red-400 hover:bg-red-950/20">
                                                    <Trash2 size={15} />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Create Dialog */}
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                <DialogContent className="bg-zinc-900 border-zinc-800 text-white sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Create Mind Map</DialogTitle>
                        <DialogDescription className="text-zinc-400">
                            Create a new canvas for thinking.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="id" className="text-right text-zinc-400">ID (Slug)</Label>
                            <Input id="id" value={formData.id} onChange={e => setFormData({ ...formData, id: e.target.value })} className="col-span-3 bg-zinc-950 border-zinc-800" placeholder="e.g. travel-guide" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="title" className="text-right text-zinc-400">Title</Label>
                            <Input id="title" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} className="col-span-3 bg-zinc-950 border-zinc-800" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="en_title" className="text-right text-zinc-400">EN Title</Label>
                            <Input id="en_title" value={formData.en_title} onChange={e => setFormData({ ...formData, en_title: e.target.value })} className="col-span-3 bg-zinc-950 border-zinc-800" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="icon" className="text-right text-zinc-400">Icon Name</Label>
                            <Input id="icon" value={formData.icon} onChange={e => setFormData({ ...formData, icon: e.target.value })} className="col-span-3 bg-zinc-950 border-zinc-800" placeholder="Lucide icon name" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="color" className="text-right text-zinc-400">Color Class</Label>
                            <Input id="color" value={formData.color} onChange={e => setFormData({ ...formData, color: e.target.value })} className="col-span-3 bg-zinc-950 border-zinc-800" placeholder="text-sky-500" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="desc" className="text-right text-zinc-400">Description</Label>
                            <Textarea id="desc" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="col-span-3 bg-zinc-950 border-zinc-800" rows={3} />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsAddOpen(false)} className="text-zinc-400 hover:text-white">Cancel</Button>
                        <Button onClick={handleCreate} className="bg-sky-600 hover:bg-sky-700 text-white">Create</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Dialog */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent className="bg-zinc-900 border-zinc-800 text-white sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Edit Mind Map</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right text-zinc-500">ID</Label>
                            <div className="col-span-3 text-zinc-300 font-mono text-sm">{currentMap?.id}</div>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="edit_title" className="text-right text-zinc-400">Title</Label>
                            <Input id="edit_title" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} className="col-span-3 bg-zinc-950 border-zinc-800" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="edit_en" className="text-right text-zinc-400">EN Title</Label>
                            <Input id="edit_en" value={formData.en_title} onChange={e => setFormData({ ...formData, en_title: e.target.value })} className="col-span-3 bg-zinc-950 border-zinc-800" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="edit_icon" className="text-right text-zinc-400">Icon</Label>
                            <Input id="edit_icon" value={formData.icon} onChange={e => setFormData({ ...formData, icon: e.target.value })} className="col-span-3 bg-zinc-950 border-zinc-800" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="edit_color" className="text-right text-zinc-400">Color</Label>
                            <Input id="edit_color" value={formData.color} onChange={e => setFormData({ ...formData, color: e.target.value })} className="col-span-3 bg-zinc-950 border-zinc-800" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="edit_status" className="text-right text-zinc-400">Status</Label>
                            <Input id="edit_status" value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })} className="col-span-3 bg-zinc-950 border-zinc-800" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="edit_sort" className="text-right text-zinc-400">Sort</Label>
                            <Input id="edit_sort" type="number" value={formData.sort_order || 0} onChange={e => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })} className="col-span-3 bg-zinc-950 border-zinc-800" />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsEditOpen(false)} className="text-zinc-400 hover:text-white">Cancel</Button>
                        <Button onClick={handleUpdate} className="bg-sky-600 hover:bg-sky-700 text-white">Save Changes</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
