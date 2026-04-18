import React, { useState, useMemo } from 'react';
import { Clock, Check, Trash2, Plus, Pencil, X, ChevronDown, ChevronRight, Archive } from 'lucide-react';
import { DeadlineCategory, DeadlineItem, DeadlineTimepoint, Activity, formatDateKey } from './types';
import { Reorder, AnimatePresence, motion } from 'framer-motion';
import { SafeDeleteDialog } from '@/components/ui/safe-delete-dialog';

interface DeadlinePanelProps {
    categories: DeadlineCategory[];
    items: DeadlineItem[];
    timepoints: DeadlineTimepoint[];
    allActivities: Activity[];
    isAdmin: boolean;
    onRefresh: () => void;
    onAddCategory: (name: string) => Promise<void>;
    onUpdateCategory: (id: number, name: string) => Promise<void>;
    onRemoveCategory: (id: number) => Promise<void>;
    onReorderCategories: (newOrder: DeadlineCategory[]) => Promise<void>;
    onAddItem: (categoryId: number, title: string) => Promise<void>;
    onUpdateItem: (id: number, updates: { title?: string; done?: boolean; is_archived?: boolean }) => Promise<void>;
    onRemoveItem: (id: number) => Promise<void>;
    onReorderItems: (categoryId: number, newOrder: DeadlineItem[]) => Promise<void>;
    onAddTimepoint: (itemId: number, label: string, date: string) => Promise<void>;
    onUpdateTimepoint: (id: number, updates: { label?: string; date?: string; done?: boolean }) => Promise<void>;
    onRemoveTimepoint: (id: number) => Promise<void>;
}

export default function DeadlinePanel({
    categories, items, timepoints, allActivities, isAdmin, onRefresh,
    onAddCategory, onUpdateCategory, onRemoveCategory, onReorderCategories,
    onAddItem, onUpdateItem, onRemoveItem, onReorderItems,
    onAddTimepoint, onUpdateTimepoint, onRemoveTimepoint,
}: DeadlinePanelProps) {
    const today = useMemo(() => new Date(), []);
    const todayStr = useMemo(() => formatDateKey(today.getFullYear(), today.getMonth(), today.getDate()), [today]);

    // 折叠状态
    const [collapsedCats, setCollapsedCats] = useState<Set<number>>(new Set());
    const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());

    // 新增表单状态
    const [newCatName, setNewCatName] = useState('');
    const [addingItemForCat, setAddingItemForCat] = useState<number | null>(null);
    const [newItemTitle, setNewItemTitle] = useState('');
    const [addingTpForItem, setAddingTpForItem] = useState<number | null>(null);
    const [newTpLabel, setNewTpLabel] = useState('');
    const [newTpDate, setNewTpDate] = useState('');

    // 视图模式
    const [viewMode, setViewMode] = useState<'categories' | 'schedule'>('categories');
    const [quickAddCatId, setQuickAddCatId] = useState<number | null>(null);
    const [quickAddItemTp, setQuickAddItemTp] = useState<number | null>(null);
    const [quickAddLabel, setQuickAddLabel] = useState('');
    const [quickAddDate, setQuickAddDate] = useState('');

    // 编辑状态
    const [editingCatId, setEditingCatId] = useState<number | null>(null);
    const [editCatName, setEditCatName] = useState('');
    const [editingItemId, setEditingItemId] = useState<number | null>(null);
    const [editItemTitle, setEditItemTitle] = useState('');
    const [editingTpId, setEditingTpId] = useState<number | null>(null);
    const [editTpLabel, setEditTpLabel] = useState('');
    const [editTpDate, setEditTpDate] = useState('');

    const toggleCatCollapse = (id: number) => {
        setCollapsedCats(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    const toggleItemExpand = (id: number) => {
        setExpandedItems(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    // 计算条目的总时长
    const getItemDuration = (itemId: number) => {
        return allActivities
            .filter(a => a.deadline_item_id === itemId && a.duration != null)
            .reduce((sum, a) => sum + (a.duration || 0), 0);
    };

    // 分类新增
    const handleAddCat = async () => {
        if (!newCatName.trim()) return;
        await onAddCategory(newCatName.trim());
        setNewCatName('');
    };

    // 条目新增
    const handleAddItem = async (catId: number) => {
        if (!newItemTitle.trim()) return;
        await onAddItem(catId, newItemTitle.trim());
        setNewItemTitle('');
        setAddingItemForCat(null);
    };

    // 时间点新增
    const handleAddTp = async (itemId: number) => {
        if (!newTpDate) return;
        await onAddTimepoint(itemId, newTpLabel.trim(), newTpDate);
        setNewTpLabel('');
        setNewTpDate('');
        setAddingTpForItem(null);
    };

    const handleQuickAdd = async () => {
        if (!quickAddItemTp || !quickAddDate) return;
        await onAddTimepoint(quickAddItemTp, quickAddLabel.trim(), quickAddDate);
        setQuickAddLabel('');
        setQuickAddDate('');
        setQuickAddItemTp(null);
        setQuickAddCatId(null);
    };

    const activeItems = useMemo(() => items.filter(i => !i.is_archived), [items]);
    const archivedItems = useMemo(() => items.filter(i => i.is_archived), [items]);

    return (
        <div className="w-[320px] bg-white/95 backdrop-blur-xl rounded-l-2xl border border-r-0 border-slate-200/80 flex flex-col overflow-hidden">
            {/* 标题栏 */}
            <div className="px-5 py-4 border-b border-slate-100 shrink-0 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Clock size={18} className="text-rose-400" />
                    <span className="font-mono font-bold text-slate-500 tracking-[0.15em] uppercase text-[13px]">Deadlines</span>
                </div>
                <div className="flex bg-slate-50 p-1 rounded-lg border border-slate-100">
                    <button
                        onClick={() => setViewMode(viewMode === 'categories' ? 'schedule' : 'categories')}
                        className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-white shadow-sm text-rose-500 hover:bg-rose-50 transition-all border border-rose-100/50"
                        title={viewMode === 'categories' ? '切换到安排视图' : '切换到分类视图'}
                    >
                        {viewMode === 'categories' ? <Clock size={14} /> : <Archive size={14} />}
                        <span className="text-[10px] font-bold uppercase tracking-wider">
                            {viewMode === 'categories' ? 'Schedule' : 'Folders'}
                        </span>
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
                {viewMode === 'categories' ? (
                    categories.length === 0 ? (
                        <div className="text-sm text-slate-300 italic py-6 text-center">暂无分类</div>
                    ) : (
                        <Reorder.Group axis="y" values={categories} onReorder={onReorderCategories} className="space-y-1">
                            {categories.map(cat => {
                                const catItems = activeItems.filter(i => i.category_id === cat.id).sort((a, b) => a.sort_order - b.sort_order);
                                const isCollapsed = collapsedCats.has(cat.id);
                                const isEditingCat = editingCatId === cat.id;

                                return (
                                    <Reorder.Item key={cat.id} value={cat} className="cursor-grab active:cursor-grabbing">
                                        {/* 分类标题行 */}
                                        <div className="flex items-center gap-1.5 px-2 py-2.5 rounded-lg hover:bg-slate-50 group transition-colors">
                                            <button onClick={() => toggleCatCollapse(cat.id)} className="text-slate-400 hover:text-slate-600 shrink-0">
                                                {isCollapsed ? <ChevronRight size={18} /> : <ChevronDown size={18} />}
                                            </button>

                                            {isEditingCat ? (
                                                <div className="flex-1 flex items-center gap-1">
                                                    <input
                                                        value={editCatName}
                                                        onChange={e => setEditCatName(e.target.value)}
                                                        onKeyDown={e => {
                                                            if (e.key === 'Enter' && editCatName.trim()) { onUpdateCategory(cat.id, editCatName.trim()); setEditingCatId(null); }
                                                            if (e.key === 'Escape') setEditingCatId(null);
                                                        }}
                                                        autoFocus
                                                        className="flex-1 bg-slate-50 border border-slate-200 rounded px-2 py-0.5 text-xs text-slate-800 focus:outline-none focus:border-blue-400"
                                                    />
                                                    <button onClick={() => { if (editCatName.trim()) { onUpdateCategory(cat.id, editCatName.trim()); setEditingCatId(null); } }} className="p-0.5 text-blue-500 hover:bg-blue-50 rounded"><Check size={14} /></button>
                                                    <button onClick={() => setEditingCatId(null)} className="p-0.5 text-slate-400 hover:text-rose-500 rounded"><X size={14} /></button>
                                                </div>
                                            ) : (
                                                <>
                                                    <span className="flex-1 text-[12px] font-bold text-slate-500 uppercase tracking-wider">{cat.name}</span>
                                                    <span className="text-[11px] text-slate-300 font-mono">{catItems.length}</span>
                                                    {isAdmin && (
                                                        <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 transition-opacity">
                                                            <button onClick={(e) => { e.stopPropagation(); setEditingCatId(cat.id); setEditCatName(cat.name); }} className="p-1 text-slate-300 hover:text-blue-500" title="编辑分类"><Pencil size={12} /></button>
                                                            <SafeDeleteDialog table="deadline_categories" recordId={cat.id} title={`确定要删除分类 "${cat.name}" 吗？`} description="其下的所有条目和时间点都将被永久移除。" onSuccess={onRefresh}>
                                                                <button onClick={(e) => e.stopPropagation()} className="p-1 text-slate-300 hover:text-rose-400" title="删除分类"><Trash2 size={12} /></button>
                                                            </SafeDeleteDialog>
                                                            <button onClick={(e) => { e.stopPropagation(); setAddingItemForCat(cat.id); setNewItemTitle(''); }} className="p-1 text-slate-300 hover:text-emerald-500" title="新增条目"><Plus size={12} /></button>
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                        </div>

                                        {/* 展开的条目列表 */}
                                        <AnimatePresence>
                                            {!isCollapsed && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: 'auto', opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    transition={{ duration: 0.25, ease: "easeInOut" }}
                                                    className="ml-5 space-y-0.5 overflow-hidden"
                                                >
                                                    {/* 新增条目表单 */}
                                                    {addingItemForCat === cat.id && (
                                                        <div className="flex items-center gap-1 px-2 py-1.5">
                                                            <input
                                                                value={newItemTitle}
                                                                onChange={e => setNewItemTitle(e.target.value)}
                                                                onKeyDown={e => {
                                                                    if (e.key === 'Enter') handleAddItem(cat.id);
                                                                    if (e.key === 'Escape') setAddingItemForCat(null);
                                                                }}
                                                                placeholder="条目名称..."
                                                                autoFocus
                                                                className="flex-1 bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs text-slate-700 placeholder:text-slate-300 focus:outline-none focus:border-blue-300"
                                                            />
                                                            <button onClick={() => handleAddItem(cat.id)} className="p-1 text-blue-500 hover:bg-blue-50 rounded"><Check size={14} /></button>
                                                            <button onClick={() => setAddingItemForCat(null)} className="p-1 text-slate-400 hover:text-rose-500 rounded"><X size={14} /></button>
                                                        </div>
                                                    )}

                                                    <Reorder.Group axis="y" values={catItems} onReorder={(newOrder) => onReorderItems(cat.id, newOrder)} className="space-y-0.5">
                                                        {catItems.map(item => {
                                                            const itemTps = timepoints.filter(tp => tp.item_id === item.id);
                                                            const isExpanded = expandedItems.has(item.id);
                                                            const totalDuration = getItemDuration(item.id);
                                                            const isEditingItem_ = editingItemId === item.id;

                                                            return (
                                                                <Reorder.Item key={item.id} value={item} className="cursor-grab active:cursor-grabbing">
                                                                    {/* 条目行 */}
                                                                    <div className="flex items-center gap-1.5 px-2 py-2 rounded-lg group transition-colors hover:bg-slate-50">
                                                                        <button onClick={() => toggleItemExpand(item.id)} className="text-slate-400 hover:text-slate-600 shrink-0">
                                                                            {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                                                        </button>

                                                                        {isEditingItem_ ? (
                                                                            <div className="flex-1 flex items-center gap-1">
                                                                                <input
                                                                                    value={editItemTitle}
                                                                                    onChange={e => setEditItemTitle(e.target.value)}
                                                                                    onKeyDown={e => {
                                                                                        if (e.key === 'Enter' && editItemTitle.trim()) { onUpdateItem(item.id, { title: editItemTitle.trim() }); setEditingItemId(null); }
                                                                                        if (e.key === 'Escape') setEditingItemId(null);
                                                                                    }}
                                                                                    autoFocus
                                                                                    className="flex-1 bg-slate-50 border border-slate-200 rounded px-2 py-0.5 text-xs text-slate-800 focus:outline-none focus:border-blue-400"
                                                                                />
                                                                                <button onClick={() => { if (editItemTitle.trim()) { onUpdateItem(item.id, { title: editItemTitle.trim() }); setEditingItemId(null); } }} className="p-0.5 text-blue-500"><Check size={12} /></button>
                                                                                <button onClick={() => setEditingItemId(null)} className="p-0.5 text-slate-400"><X size={12} /></button>
                                                                            </div>
                                                                        ) : (
                                                                            <>
                                                                                <span className="flex-1 text-[15px] font-semibold leading-tight text-slate-800">
                                                                                    {item.title}
                                                                                </span>
                                                                                {totalDuration > 0 && (
                                                                                    <span className="text-[11px] font-mono text-blue-400 bg-blue-50 px-1.5 py-0.5 rounded-full shrink-0">
                                                                                        {totalDuration.toFixed(1)}h
                                                                                    </span>
                                                                                )}
                                                                                {isAdmin && (
                                                                                    <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 transition-opacity shrink-0">
                                                                                        <button onClick={(e) => { e.stopPropagation(); setEditingItemId(item.id); setEditItemTitle(item.title); }} className="p-1 text-slate-300 hover:text-blue-500" title="编辑条目"><Pencil size={12} /></button>
                                                                                        <button onClick={(e) => { e.stopPropagation(); onUpdateItem(item.id, { is_archived: true }); }} className="p-1 text-slate-300 hover:text-amber-500" title="归档条目"><Archive size={12} /></button>
                                                                                        <SafeDeleteDialog table="deadline_items" recordId={item.id} title={`确定要永久删除条目 "${item.title}" 吗？`} onSuccess={onRefresh}>
                                                                                            <button onClick={(e) => e.stopPropagation()} className="p-1 text-slate-300 hover:text-rose-400" title="永久删除"><Trash2 size={12} /></button>
                                                                                        </SafeDeleteDialog>
                                                                                        <button onClick={(e) => { e.stopPropagation(); setAddingTpForItem(item.id); setNewTpLabel(''); setNewTpDate(''); }} className="p-1 text-slate-300 hover:text-emerald-500" title="新增时间点"><Plus size={12} /></button>
                                                                                    </div>
                                                                                )}
                                                                            </>
                                                                        )}
                                                                    </div>

                                                                    {/* 展开的时间点列表 */}
                                                                    <AnimatePresence>
                                                                        {isExpanded && (
                                                                            <motion.div
                                                                                initial={{ height: 0, opacity: 0 }}
                                                                                animate={{ height: 'auto', opacity: 1 }}
                                                                                exit={{ height: 0, opacity: 0 }}
                                                                                transition={{ duration: 0.15, ease: "easeOut" }}
                                                                                layout="position"
                                                                                className="ml-8 space-y-0.5 py-0.5"
                                                                            >

                                                                                {/* 新增时间点表单 */}
                                                                                {addingTpForItem === item.id && (
                                                                                    <div className="flex flex-col gap-1.5 px-2 py-1.5 bg-slate-50 rounded-lg">
                                                                                        <input
                                                                                            value={newTpLabel}
                                                                                            onChange={e => setNewTpLabel(e.target.value)}
                                                                                            placeholder="标签 (可选)"
                                                                                            className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-xs text-slate-700 placeholder:text-slate-300 focus:outline-none focus:border-blue-300"
                                                                                        />
                                                                                        <div className="flex items-center gap-1">
                                                                                            <input
                                                                                                type="date"
                                                                                                value={newTpDate}
                                                                                                onChange={e => setNewTpDate(e.target.value)}
                                                                                                className="flex-1 bg-white border border-slate-200 rounded px-2 py-1 text-xs text-slate-700 focus:outline-none focus:border-blue-300"
                                                                                            />
                                                                                            <button onClick={() => handleAddTp(item.id)} className="p-1 text-blue-500 hover:bg-blue-50 rounded"><Check size={14} /></button>
                                                                                            <button onClick={() => setAddingTpForItem(null)} className="p-1 text-slate-400 hover:text-rose-500 rounded"><X size={14} /></button>
                                                                                        </div>
                                                                                    </div>
                                                                                )}

                                                                                {itemTps.length === 0 && addingTpForItem !== item.id ? (
                                                                                    <div className="text-[10px] text-slate-300 italic px-2 py-1">暂无时间点</div>
                                                                                ) : (
                                                                                    itemTps.map(tp => {
                                                                                        const isEditingTp_ = editingTpId === tp.id;

                                                                                        return (
                                                                                            <div key={tp.id} className="flex items-center gap-1.5 px-2 py-1.5 group/tp transition-colors hover:bg-slate-50">
                                                                                                {isEditingTp_ ? (
                                                                                                    <div className="flex-1 flex flex-col gap-1">
                                                                                                        <input value={editTpLabel} onChange={e => setEditTpLabel(e.target.value)} placeholder="标签" className="w-full bg-white border border-slate-200 rounded px-1.5 py-0.5 text-[11px] focus:outline-none focus:border-blue-400" />
                                                                                                        <div className="flex items-center gap-1">
                                                                                                            <input type="date" value={editTpDate} onChange={e => setEditTpDate(e.target.value)} className="flex-1 bg-white border border-slate-200 rounded px-1.5 py-0.5 text-[11px] focus:outline-none focus:border-blue-400" />
                                                                                                            <button onClick={() => { onUpdateTimepoint(tp.id, { label: editTpLabel, date: editTpDate }); setEditingTpId(null); }} className="p-0.5 text-blue-500"><Check size={12} /></button>
                                                                                                            <button onClick={() => setEditingTpId(null)} className="p-0.5 text-slate-400"><X size={12} /></button>
                                                                                                        </div>
                                                                                                    </div>
                                                                                                ) : (
                                                                                                    <>
                                                                                                        {tp.label && (
                                                                                                            <span className="text-[13px] text-slate-600">
                                                                                                                {tp.label}
                                                                                                            </span>
                                                                                                        )}
                                                                                                        <span className="text-[13px] font-mono text-slate-400 flex-1">
                                                                                                            {tp.date.slice(5).replace('-', '/')}
                                                                                                        </span>
                                                                                                        {tp.label && <span className="flex-1" />}
                                                                                                        {isAdmin && (
                                                                                                            <div className="opacity-0 group-hover/tp:opacity-100 flex items-center gap-0.5 transition-opacity shrink-0">
                                                                                                                <button onClick={() => { setEditingTpId(tp.id); setEditTpLabel(tp.label); setEditTpDate(tp.date); }} className="p-1 text-slate-300 hover:text-blue-500" title="编辑时间点"><Pencil size={11} /></button>
                                                                                                                <SafeDeleteDialog table="deadline_timepoints" recordId={tp.id} title="确定要永久删除该时间点吗？" onSuccess={onRefresh}>
                                                                                                                    <button onClick={(e) => e.stopPropagation()} className="p-1 text-slate-300 hover:text-rose-400" title="删除时间点"><Trash2 size={11} /></button>
                                                                                                                </SafeDeleteDialog>
                                                                                                            </div>
                                                                                                        )}
                                                                                                    </>
                                                                                                )}
                                                                                            </div>
                                                                                        );
                                                                                    })
                                                                                )}
                                                                            </motion.div>
                                                                        )}
                                                                    </AnimatePresence>
                                                                </Reorder.Item>
                                                            );
                                                        })}
                                                    </Reorder.Group>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </Reorder.Item>
                                );
                            })}
                        </Reorder.Group>
                    )
                ) : (
                    <div className="space-y-2">
                        {(() => {
                            const sortedTps = timepoints.filter(tp => {
                                const item = items.find(i => i.id === tp.item_id);
                                return item && !item.is_archived && !tp.done;
                            }).sort((a, b) => a.date.localeCompare(b.date));

                            if (sortedTps.length === 0) {
                                return <div className="text-sm text-slate-300 italic py-6 text-center">近期暂无安排</div>;
                            }

                            return sortedTps.map(tp => {
                                const item = items.find(i => i.id === tp.item_id);
                                const diffTime = new Date(tp.date + 'T00:00:00').getTime() - new Date(todayStr + 'T00:00:00').getTime();
                                const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                                const isUrgent = daysLeft >= 0 && daysLeft <= 3;
                                const isPastDue = daysLeft < 0;

                                return (
                                    <div key={tp.id} className="flex items-center gap-2.5 px-3 py-3 rounded-xl bg-slate-50 border border-slate-100 hover:border-slate-200 hover:shadow-sm transition-all group">
                                        <div className={`w-8 h-8 rounded-lg flex flex-col items-center justify-center shrink-0 font-mono ${isPastDue ? 'bg-slate-200 text-slate-500' : isUrgent ? 'bg-rose-100 text-rose-500' : 'bg-blue-50 text-blue-500'}`}>
                                            <span className="text-[14px] font-black leading-none">{isPastDue ? '!' : daysLeft}</span>
                                            <span className="text-[7px] font-bold">DAYS</span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="mb-0.5">
                                                <div className="text-[11px] text-slate-400 font-medium truncate">
                                                    #{item?.title || "未关联项目"}
                                                </div>
                                                <div className="text-[15px] font-bold text-slate-800 leading-tight truncate">
                                                    {tp.label || "未命名阶段"}
                                                </div>
                                            </div>
                                            <div className="text-[11px] font-mono text-slate-400">{tp.date.slice(5).replace('-', '/')}</div>
                                        </div>
                                    </div>
                                );
                            });
                        })()}
                    </div>
                )}
            </div>

            {/* 底部功能区 */}
            {isAdmin && (
                <div className="p-3 border-t border-slate-100 bg-white shrink-0">
                    {viewMode === 'categories' ? (
                        <div className="flex gap-1.5 translate-y-0 animate-in fade-in slide-in-from-bottom-1">
                            <input
                                value={newCatName}
                                onChange={e => setNewCatName(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter') handleAddCat(); }}
                                placeholder="新分类..."
                                className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700 placeholder:text-slate-300 focus:outline-none focus:border-blue-300 transition-colors"
                            />
                            <button
                                onClick={handleAddCat}
                                className="px-3 py-1.5 rounded-lg bg-rose-50 text-rose-500 hover:bg-rose-100 transition-colors border border-rose-200/50 text-xs font-bold"
                            >
                                <Plus size={18} />
                            </button>
                        </div>
                    ) : (
                        <div className="bg-rose-50/50 border border-rose-100 rounded-xl p-2.5 space-y-2 animate-in fade-in slide-in-from-bottom-2">
                            <div className="flex items-center justify-between px-1">
                                <span className="text-[10px] font-bold text-rose-400 uppercase tracking-widest">快捷安排</span>
                                <Clock size={12} className="text-rose-300" />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <select
                                    value={quickAddCatId || ''}
                                    onChange={e => {
                                        setQuickAddCatId(e.target.value ? parseInt(e.target.value) : null);
                                        setQuickAddItemTp(null);
                                    }}
                                    className="w-full bg-white border border-rose-100 rounded-lg px-2 py-2 text-[10px] text-slate-700 focus:outline-none focus:border-rose-300 shadow-sm"
                                >
                                    <option value="">选择分类...</option>
                                    {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                                </select>
                                <select
                                    value={quickAddItemTp || ''}
                                    onChange={e => setQuickAddItemTp(e.target.value ? parseInt(e.target.value) : null)}
                                    disabled={!quickAddCatId}
                                    className="w-full bg-white border border-rose-100 rounded-lg px-2 py-2 text-[10px] text-slate-700 focus:outline-none focus:border-rose-300 shadow-sm disabled:opacity-50"
                                >
                                    <option value="">选择项目...</option>
                                    {activeItems
                                        .filter(item => item.category_id === quickAddCatId)
                                        .map(item => <option key={item.id} value={item.id}>{item.title}</option>)}
                                </select>
                            </div>
                            <div className="flex gap-1.5 h-9">
                                <input
                                    value={quickAddLabel}
                                    onChange={e => setQuickAddLabel(e.target.value)}
                                    placeholder="阶段标签..."
                                    className="flex-2 min-w-0 bg-white border border-rose-100 rounded-lg px-2 py-1.5 text-xs text-slate-700 placeholder:text-slate-300 focus:outline-none focus:border-rose-300 shadow-sm"
                                />
                                <input
                                    type="date"
                                    value={quickAddDate}
                                    onChange={e => setQuickAddDate(e.target.value)}
                                    className="flex-[1.2] min-w-0 bg-white border border-rose-100 rounded-lg px-1 py-1.5 text-[10px] text-slate-700 focus:outline-none focus:border-rose-300 shadow-sm"
                                />
                                <button
                                    onClick={handleQuickAdd}
                                    disabled={!quickAddItemTp || !quickAddDate}
                                    className="w-9 h-9 shrink-0 rounded-lg bg-rose-500 text-white flex items-center justify-center hover:bg-rose-600 disabled:bg-rose-200 transition-all shadow-sm active:scale-95"
                                >
                                    <Plus size={18} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
