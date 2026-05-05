"use client";

import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MapPin, Plus, Trash2, Pencil, Save, Image as ImageIcon, CalendarDays } from "lucide-react";
import { toast } from "sonner";

interface Place { id: number; name: string; sort_order: number; }
interface PlaceImage { id: number; place_id: number; image_path: string; sort_order: number; }
interface PlaceVisit { id: number; place_id: number; visit_date: string; }

export default function PlacesPage() {
    const [places, setPlaces] = useState<Place[]>([]);
    const [images, setImages] = useState<PlaceImage[]>([]);
    const [visits, setVisits] = useState<PlaceVisit[]>([]);
    const [selectedPlaceId, setSelectedPlaceId] = useState<number | null>(null);

    const [placeForm, setPlaceForm] = useState({ name: "", sort_order: 0 });
    const [editingPlaceId, setEditingPlaceId] = useState<number | null>(null);

    const [newImagePath, setNewImagePath] = useState("/images/places/xxx.png");
    const [newImageSortOrder, setNewImageSortOrder] = useState(0);
    const [newVisitDate, setNewVisitDate] = useState("");
    const [editingImageId, setEditingImageId] = useState<number | null>(null);
    const [editImagePath, setEditImagePath] = useState("");
    const [editImageSortOrder, setEditImageSortOrder] = useState(0);

    const fetchAll = async () => {
        const [placesRes, imagesRes, visitsRes] = await Promise.all([
            supabase.from("profile_places").select("*").order("sort_order", { ascending: true }),
            supabase.from("profile_place_images").select("*").order("sort_order", { ascending: true }),
            supabase.from("profile_place_visits").select("*").order("visit_date", { ascending: false }),
        ]);

        if (placesRes.data) setPlaces(placesRes.data as Place[]);
        if (imagesRes.data) setImages(imagesRes.data as PlaceImage[]);
        if (visitsRes.data) setVisits(visitsRes.data as PlaceVisit[]);

        const firstPlaceId = placesRes.data && placesRes.data.length > 0 ? placesRes.data[0].id : null;
        setSelectedPlaceId((prev) => {
            if (!prev) return firstPlaceId;
            const stillExists = (placesRes.data || []).some((p) => p.id === prev);
            return stillExists ? prev : firstPlaceId;
        });
    };

    useEffect(() => { fetchAll(); }, []);

    const selectedPlace = useMemo(() => places.find((p) => p.id === selectedPlaceId) || null, [places, selectedPlaceId]);
    const selectedPlaceImages = useMemo(
        () => images.filter((img) => img.place_id === selectedPlaceId).sort((a, b) => a.sort_order - b.sort_order),
        [images, selectedPlaceId]
    );
    const selectedPlaceVisits = useMemo(
        () => visits.filter((v) => v.place_id === selectedPlaceId).sort((a, b) => b.visit_date.localeCompare(a.visit_date)),
        [visits, selectedPlaceId]
    );

    const handleSavePlace = async () => {
        if (!placeForm.name.trim()) return toast.warning("地点名称不能为空");
        if (editingPlaceId) {
            const { error } = await supabase.from("profile_places").update({
                name: placeForm.name.trim(),
                sort_order: placeForm.sort_order,
                updated_at: new Date().toISOString(),
            }).eq("id", editingPlaceId);
            if (error) return toast.error("更新地点失败: " + error.message);
            toast.success("地点已更新");
        } else {
            const { error } = await supabase.from("profile_places").insert({
                name: placeForm.name.trim(),
                sort_order: placeForm.sort_order,
            });
            if (error) return toast.error("新增地点失败: " + error.message);
            toast.success("地点已新增");
        }
        setEditingPlaceId(null);
        setPlaceForm({ name: "", sort_order: places.length + 1 });
        fetchAll();
    };

    const startEditPlace = (place: Place) => {
        setEditingPlaceId(place.id);
        setPlaceForm({ name: place.name, sort_order: place.sort_order });
    };
    const cancelEditPlace = () => {
        setEditingPlaceId(null);
        setPlaceForm({ name: "", sort_order: places.length + 1 });
    };

    const handleDeletePlace = async (id: number) => {
        if (!confirm("删除该地点后，相关图片和到访记录也会一起删除，确认继续吗？")) return;
        const { error } = await supabase.from("profile_places").delete().eq("id", id);
        if (error) return toast.error("删除地点失败: " + error.message);
        toast.success("地点已删除");
        if (editingPlaceId === id) cancelEditPlace();
        fetchAll();
    };

    const handleAddImage = async () => {
        if (!selectedPlaceId) return toast.warning("请先选择地点");
        if (!newImagePath.trim()) return toast.warning("图片路径不能为空");
        const { error } = await supabase.from("profile_place_images").insert({
            place_id: selectedPlaceId, image_path: newImagePath.trim(), sort_order: newImageSortOrder,
        });
        if (error) return toast.error("新增图片路径失败: " + error.message);
        setNewImagePath("/images/places/xxx.png");
        setNewImageSortOrder(selectedPlaceImages.length + 1);
        toast.success("图片路径已新增");
        fetchAll();
    };

    const handleDeleteImage = async (id: number) => {
        if (!confirm("确认删除这条图片路径吗？")) return;
        const { error } = await supabase.from("profile_place_images").delete().eq("id", id);
        if (error) return toast.error("删除图片路径失败: " + error.message);
        toast.success("图片路径已删除");
        fetchAll();
    };

    const startEditImage = (img: PlaceImage) => {
        setEditingImageId(img.id);
        setEditImagePath(img.image_path);
        setEditImageSortOrder(img.sort_order);
    };

    const cancelEditImage = () => {
        setEditingImageId(null);
        setEditImagePath("");
        setEditImageSortOrder(0);
    };

    const handleSaveImage = async () => {
        if (!editingImageId) return;
        if (!editImagePath.trim()) return toast.warning("图片路径不能为空");
        const { error } = await supabase
            .from("profile_place_images")
            .update({
                image_path: editImagePath.trim(),
                sort_order: editImageSortOrder,
            })
            .eq("id", editingImageId);
        if (error) return toast.error("更新图片路径失败: " + error.message);
        toast.success("图片路径已更新");
        cancelEditImage();
        fetchAll();
    };

    const handleAddVisit = async () => {
        if (!selectedPlaceId) return toast.warning("请先选择地点");
        if (!newVisitDate) return toast.warning("请选择日期");
        const { error } = await supabase.from("profile_place_visits").insert({
            place_id: selectedPlaceId, visit_date: newVisitDate,
        });
        if (error) return toast.error("新增到访记录失败: " + error.message);
        setNewVisitDate("");
        toast.success("到访记录已新增");
        fetchAll();
    };

    const handleDeleteVisit = async (id: number) => {
        if (!confirm("确认删除这条到访记录吗？")) return;
        const { error } = await supabase.from("profile_place_visits").delete().eq("id", id);
        if (error) return toast.error("删除到访记录失败: " + error.message);
        toast.success("到访记录已删除");
        fetchAll();
    };

    return (
        <div className="space-y-6 text-zinc-200">
            <div className="flex items-center gap-2 mb-6">
                <div className="p-2 bg-zinc-900 rounded-lg border border-zinc-800"><MapPin size={20} className="text-zinc-400" /></div>
                <h1 className="text-2xl font-bold tracking-tight">地点管理 (Places)</h1>
            </div>

            <div className={`grid grid-cols-1 md:grid-cols-4 gap-3 items-end bg-zinc-900/30 p-5 rounded-xl border ${editingPlaceId ? "border-blue-900/50" : "border-zinc-800"}`}>
                <div className="md:col-span-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase">Name</label>
                    <Input value={placeForm.name} onChange={(e) => setPlaceForm({ ...placeForm, name: e.target.value })} className="bg-black border-zinc-800 text-zinc-300" />
                </div>
                <div>
                    <label className="text-xs font-bold text-zinc-500 uppercase">Sort</label>
                    <Input type="number" value={placeForm.sort_order} onChange={(e) => setPlaceForm({ ...placeForm, sort_order: parseInt(e.target.value || "0", 10) })} className="bg-black border-zinc-800 text-zinc-300" />
                </div>
                <div>
                    {editingPlaceId ? (
                        <div className="flex gap-2">
                            <Button onClick={handleSavePlace} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"><Save size={16} className="mr-2" />Update</Button>
                            <Button onClick={cancelEditPlace} variant="secondary">Cancel</Button>
                        </div>
                    ) : (
                        <Button onClick={handleSavePlace} className="w-full bg-white text-black hover:bg-zinc-200"><Plus size={16} className="mr-2" />Add Place</Button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <div className="lg:col-span-2 border border-zinc-800 rounded-lg overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-zinc-900/50 border-zinc-800">
                                <TableHead className="text-zinc-400">Sort</TableHead>
                                <TableHead className="text-zinc-400">Name</TableHead>
                                <TableHead className="text-right text-zinc-400">Act</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {places.map((p) => (
                                <TableRow key={p.id} className={`border-zinc-800 hover:bg-zinc-900/30 ${selectedPlaceId === p.id ? "bg-zinc-900/70" : ""}`} onClick={() => setSelectedPlaceId(p.id)}>
                                    <TableCell className="text-zinc-500">{p.sort_order}</TableCell>
                                    <TableCell className="font-bold text-zinc-300">{p.name}</TableCell>
                                    <TableCell className="text-right space-x-1">
                                        <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-white" onClick={(e) => { e.stopPropagation(); startEditPlace(p); }}><Pencil size={14} /></Button>
                                        <Button variant="ghost" size="sm" className="text-red-900 hover:text-red-400" onClick={(e) => { e.stopPropagation(); handleDeletePlace(p.id); }}><Trash2 size={14} /></Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>

                <div className="lg:col-span-3 space-y-6">
                    <div className="bg-zinc-900/30 border border-zinc-800 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-3"><ImageIcon size={16} className="text-zinc-400" /><h2 className="text-sm font-bold text-zinc-300">图片路径 {selectedPlace ? `- ${selectedPlace.name}` : ""}</h2></div>
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-2 mb-3">
                            <div className="md:col-span-4">
                                <Input value={newImagePath} onChange={(e) => setNewImagePath(e.target.value)} placeholder="/images/places/xxx/1.jpg" className="bg-black border-zinc-800 text-zinc-300" disabled={!selectedPlaceId} />
                            </div>
                            <div className="flex gap-2">
                                <Input type="number" value={newImageSortOrder} onChange={(e) => setNewImageSortOrder(parseInt(e.target.value || "0", 10))} className="bg-black border-zinc-800 text-zinc-300" disabled={!selectedPlaceId} />
                                <Button onClick={handleAddImage} disabled={!selectedPlaceId} className="bg-white text-black hover:bg-zinc-200"><Plus size={14} /></Button>
                            </div>
                        </div>
                        <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                            {selectedPlaceImages.length === 0 ? (
                                <div className="text-xs text-zinc-500">暂无图片路径</div>
                            ) : (
                                selectedPlaceImages.map((img) => (
                                    <div key={img.id} className="flex items-center gap-2 bg-black/40 border border-zinc-800 rounded-lg px-3 py-2">
                                        {editingImageId === img.id ? (
                                            <>
                                                <Input
                                                    value={editImagePath}
                                                    onChange={(e) => setEditImagePath(e.target.value)}
                                                    className="bg-black border-zinc-700 text-zinc-300 text-xs flex-1"
                                                />
                                                <Input
                                                    type="number"
                                                    value={editImageSortOrder}
                                                    onChange={(e) => setEditImageSortOrder(parseInt(e.target.value || "0", 10))}
                                                    className="bg-black border-zinc-700 text-zinc-300 text-xs w-20"
                                                />
                                                <Button variant="ghost" size="sm" className="text-emerald-400 hover:text-emerald-300" onClick={handleSaveImage}><Save size={13} /></Button>
                                                <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-zinc-200" onClick={cancelEditImage}>Cancel</Button>
                                            </>
                                        ) : (
                                            <>
                                                <span className="text-xs text-zinc-500 w-12">#{img.sort_order}</span>
                                                <code className="text-xs text-zinc-300 flex-1 truncate">{img.image_path}</code>
                                                <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-white" onClick={() => startEditImage(img)}><Pencil size={13} /></Button>
                                                <Button variant="ghost" size="sm" className="text-red-900 hover:text-red-400" onClick={() => handleDeleteImage(img.id)}><Trash2 size={13} /></Button>
                                            </>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    <div className="bg-zinc-900/30 border border-zinc-800 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-3"><CalendarDays size={16} className="text-zinc-400" /><h2 className="text-sm font-bold text-zinc-300">到访记录 {selectedPlace ? `- ${selectedPlace.name}` : ""}</h2></div>
                        <div className="flex gap-2 mb-3">
                            <div className="relative">
                                <Input
                                    id="visit-date-input"
                                    type="date"
                                    value={newVisitDate}
                                    onChange={(e) => setNewVisitDate(e.target.value)}
                                    className="bg-black border-zinc-800 text-zinc-300 max-w-[220px] pr-10"
                                    disabled={!selectedPlaceId}
                                />
                                <button
                                    type="button"
                                    onClick={() => {
                                        const el = document.getElementById("visit-date-input") as HTMLInputElement | null;
                                        if (el && typeof el.showPicker === "function") el.showPicker();
                                        else if (el) el.focus();
                                    }}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors disabled:opacity-50"
                                    disabled={!selectedPlaceId}
                                    title="打开日历"
                                >
                                    <CalendarDays size={14} />
                                </button>
                            </div>
                            <Button onClick={handleAddVisit} disabled={!selectedPlaceId} className="bg-white text-black hover:bg-zinc-200"><Plus size={14} className="mr-1" />Add</Button>
                        </div>
                        <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                            {selectedPlaceVisits.length === 0 ? (
                                <div className="text-xs text-zinc-500">暂无到访记录</div>
                            ) : (
                                selectedPlaceVisits.map((visit) => (
                                    <div key={visit.id} className="flex items-center gap-2 bg-black/40 border border-zinc-800 rounded-lg px-3 py-2">
                                        <span className="text-sm text-zinc-300 font-mono">{visit.visit_date}</span>
                                        <span className="ml-auto text-[10px] text-zinc-500">ID {visit.id}</span>
                                        <Button variant="ghost" size="sm" className="text-red-900 hover:text-red-400" onClick={() => handleDeleteVisit(visit.id)}><Trash2 size={13} /></Button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
