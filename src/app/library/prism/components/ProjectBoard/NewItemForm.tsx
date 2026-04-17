import React from 'react';
import { X, Save, Loader2 } from 'lucide-react';

interface NewItemFormProps {
    type: 'insight' | 'outcome';
    category: string;
    categories: string[];
    onChangeCategory: (cat: string) => void;
    content: string;
    onChangeContent: (val: string) => void;
    paperIds: string[];
    onChangePaperIds: (ids: string[]) => void;
    relatedPapers: any[];
    availableDirections: string[];
    selectedDirection: string | null;
    onChangeDirection: (dir: string | null) => void;
    isSaving: boolean;
    onSave: () => void;
    onCancel: () => void;
    handleBoldShortcut: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
}

export function NewItemForm({ 
    type, 
    category, 
    categories, 
    onChangeCategory, 
    content, 
    onChangeContent, 
    paperIds, 
    onChangePaperIds, 
    relatedPapers, 
    availableDirections, 
    selectedDirection, 
    onChangeDirection, 
    isSaving, 
    onSave, 
    onCancel, 
    handleBoldShortcut 
}: NewItemFormProps) {
    const isInsight = type === 'insight';
    
    // Explicit color mapping avoids dynamic Tailwind classes issues
    const colorTheme = isInsight 
        ? { primary: 'amber-600', bg: 'bg-amber-50/50', border: 'border-amber-200', text: 'text-amber-600', ring: 'focus:ring-amber-200', selectedBg: 'bg-amber-100', selectedBorder: 'border-amber-300', selectedText: 'text-amber-800' }
        : { primary: 'emerald-600', bg: 'bg-emerald-50/50', border: 'border-emerald-200', text: 'text-emerald-600', ring: 'focus:ring-emerald-200', selectedBg: 'bg-emerald-100', selectedBorder: 'border-emerald-300', selectedText: 'text-emerald-800' };

    const filteredPapers = selectedDirection
        ? relatedPapers.filter(p => p.directions?.includes(selectedDirection))
        : relatedPapers;

    return (
        <div className={`p-3 rounded-xl border ${colorTheme.border} ${colorTheme.bg} space-y-3 mb-2 shadow-sm`}>
            <div className="flex items-center justify-between">
                <span className={`text-[10px] font-mono font-bold ${colorTheme.text} uppercase`}>
                    新增{isInsight ? '启示' : '成果'}
                </span>
                <button onClick={onCancel} className="p-0.5 text-stone-400 hover:text-stone-600"><X size={12} /></button>
            </div>

            {/* Category selector */}
            {categories.length > 0 && (
                <div className="flex flex-wrap gap-1">
                    <span className="text-[10px] font-mono text-stone-400 w-full mb-0.5">分类：</span>
                    {categories.map(cat => {
                        const isSelected = category === cat;
                        return (
                            <button
                                key={cat}
                                onClick={() => onChangeCategory(cat)}
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold transition-all border ${
                                    isSelected
                                    ? `bg-${colorTheme.primary} border-${colorTheme.primary} text-white`
                                    : 'bg-white border-stone-200 text-stone-400 hover:border-stone-300'
                                }`}
                            >{cat}</button>
                        );
                    })}
                </div>
            )}

            {/* Content */}
            <textarea
                value={content}
                onChange={e => onChangeContent(e.target.value)}
                onKeyDown={handleBoldShortcut}
                className={`w-full bg-white border border-stone-200 rounded-lg p-2 text-sm text-stone-700 ${colorTheme.ring} outline-none min-h-[60px] resize-none`}
                placeholder="输入内容... (支持 Ctrl+B 加粗)"
                autoFocus
            />

            {/* Paper linking */}
            <div className="space-y-2">
                <label className="text-[10px] font-mono font-bold text-stone-400 uppercase">关联论文 (可选)</label>
                <div className="flex flex-wrap gap-1 mb-1">
                    <button
                        onClick={() => onChangeDirection(null)}
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold transition-all border ${
                            !selectedDirection
                            ? 'bg-stone-700 border-stone-700 text-white'
                            : 'bg-white border-stone-200 text-stone-400 hover:border-stone-300'
                        }`}
                    >全部</button>
                    {availableDirections.map(dir => {
                        const isSelected = selectedDirection === dir;
                        return (
                            <button
                                key={dir}
                                onClick={() => onChangeDirection(dir)}
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold transition-all border ${
                                    isSelected
                                    ? `bg-${colorTheme.primary} border-${colorTheme.primary} text-white`
                                    : 'bg-white border-stone-200 text-stone-400 hover:border-stone-300'
                                }`}
                            >{dir}</button>
                        );
                    })}
                </div>
                <div className="flex flex-wrap gap-1.5">
                    {filteredPapers.map(p => {
                        const isSelected = paperIds.includes(p.id);
                        return (
                            <button
                                key={p.id}
                                onClick={() => onChangePaperIds(isSelected ? paperIds.filter(id => id !== p.id) : [...paperIds, p.id])}
                                className={`px-2 py-1 rounded-md text-[11px] font-medium transition-all border ${
                                    isSelected 
                                    ? `${colorTheme.selectedBg} ${colorTheme.selectedBorder} ${colorTheme.selectedText}` 
                                    : 'bg-stone-50 border-stone-200 text-stone-500 hover:border-stone-300'
                                }`}
                            >
                                {p.nickname || p.title?.slice(0, 15)}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-1">
                <button onClick={onCancel} className="p-1.5 text-stone-400 hover:text-stone-600 transition-colors"><X size={14}/></button>
                <button 
                    onClick={onSave}
                    disabled={isSaving || !content.trim()}
                    className={`flex items-center gap-1 px-3 py-1 bg-${colorTheme.primary} text-white rounded-lg text-xs font-bold hover:brightness-110 transition-all disabled:opacity-50`}
                >
                    {isSaving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                    保存
                </button>
            </div>
        </div>
    );
}
