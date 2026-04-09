"use client";

import React, { useState } from "react";
import { CodebaseLanguage } from "../../types";
import { Plus, Trash2, Edit2, Code2, Save, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";

interface LanguageSidebarProps {
    languages: CodebaseLanguage[];
    selectedLanguageId: string | null;
    onSelectLanguage: (id: string) => void;
    isLoading: boolean;
    onDataChange: () => void;
}

export function LanguageSidebar({ languages, selectedLanguageId, onSelectLanguage, isLoading, onDataChange }: LanguageSidebarProps) {
    const [isEditing, setIsEditing] = useState<string | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [editName, setEditName] = useState("");

    const handleCreate = async () => {
        if (!editName.trim()) return;
        const { error } = await supabase.from('prism_codebase_languages').insert([{
            name: editName,
            sort_order: languages.length + 1
        }]);
        if (error) toast.error("添加失败");
        else {
            setEditName("");
            setIsCreating(false);
            onDataChange();
        }
    };

    const handleUpdate = async (id: string) => {
        if (!editName.trim()) return;
        const { error } = await supabase.from('prism_codebase_languages').update({ name: editName }).eq('id', id);
        if (error) toast.error("更新失败");
        else {
            setIsEditing(null);
            onDataChange();
        }
    };

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!window.confirm("确定删除该语言及其所有内容吗？")) return;
        const { error } = await supabase.from('prism_codebase_languages').delete().eq('id', id);
        if (error) toast.error("删除失败");
        else onDataChange();
    };

    return (
        <div className="w-[18%] min-w-[200px] h-full bg-stone-100/80 text-stone-700 flex flex-col border-r border-stone-200/60 shrink-0 pt-24 pb-4 px-4 z-10 transition-all">
            <div className="flex items-center justify-between mb-6 px-2">
                <span className="text-xs font-mono font-bold tracking-[0.2em] uppercase text-zinc-500">Libraries</span>
                <Button size="icon" variant="ghost" className="h-6 w-6 text-stone-400 hover:text-stone-700" onClick={() => {setIsCreating(true); setEditName("");}}>
                    <Plus size={14} />
                </Button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-1.5 custom-scrollbar pr-1">
                {isLoading && <div className="flex justify-center p-4"><Loader2 className="animate-spin w-4 h-4 text-zinc-500" /></div>}
                
                {isCreating && (
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-white border border-stone-200">
                        <Input value={editName} onChange={e => setEditName(e.target.value)} placeholder="Name..." className="h-7 text-xs bg-transparent border-0 px-1 text-stone-800 focus-visible:ring-0" autoFocus onKeyDown={e => e.key === 'Enter' && handleCreate()} />
                        <Button size="icon" variant="ghost" className="h-5 w-5 text-stone-400 hover:text-stone-700" onClick={handleCreate}><Save size={12} /></Button>
                        <Button size="icon" variant="ghost" className="h-5 w-5 text-stone-400 hover:text-stone-700" onClick={() => setIsCreating(false)}><X size={12} /></Button>
                    </div>
                )}

                {languages.map(lang => (
                    <div key={lang.id} className={`group flex items-center justify-between p-2 rounded-xl cursor-pointer transition-colors ${selectedLanguageId === lang.id ? 'bg-purple-50 text-purple-700 font-medium border border-purple-200/60' : 'hover:bg-stone-200/50 hover:text-stone-900 border border-transparent'}`} onClick={() => onSelectLanguage(lang.id)}>
                        {isEditing === lang.id ? (
                            <div className="flex items-center gap-2 w-full" onClick={e => e.stopPropagation()}>
                                <Input value={editName} onChange={e => setEditName(e.target.value)} className="h-7 text-xs bg-white border-stone-200 px-2 text-stone-800 p-0 focus-visible:ring-0" autoFocus onKeyDown={e => e.key === 'Enter' && handleUpdate(lang.id)}/>
                                <Button size="icon" variant="ghost" className="h-5 w-5 text-green-600" onClick={() => handleUpdate(lang.id)}><Save size={12} /></Button>
                            </div>
                        ) : (
                            <>
                                <div className="flex items-center gap-2.5 overflow-hidden">
                                    <Code2 size={14} className={selectedLanguageId === lang.id ? "text-purple-500" : "text-stone-400"} />
                                    <span className="text-sm truncate">{lang.name}</span>
                                </div>
                                <div className="opacity-0 group-hover:opacity-100 flex items-center transition-opacity shrink-0">
                                    <Button size="icon" variant="ghost" className="h-6 w-6 text-stone-400 hover:text-stone-700" onClick={(e) => {e.stopPropagation(); setIsEditing(lang.id); setEditName(lang.name);}}><Edit2 size={12}/></Button>
                                    <Button size="icon" variant="ghost" className="h-6 w-6 text-stone-400 hover:text-red-500" onClick={(e) => handleDelete(lang.id, e)}><Trash2 size={12}/></Button>
                                </div>
                            </>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
