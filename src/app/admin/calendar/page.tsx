"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Trash, Check, X, RotateCcw, Box, Archive, ListTree } from 'lucide-react';
import { toast } from 'sonner';
import { SafeDeleteDialog } from '@/components/ui/safe-delete-dialog';

// === 类型 ===
interface CalendarDay {
    id: number;
    date: string;
    status: string | null;
    comment: string;
}

interface CalendarActivity {
    id: number;
    date: string;
    content: string;
    duration: number | null;
    deadline_item_id?: number | null;
}

interface DeadlineCategory {
    id: number;
    name: string;
    sort_order: number;
}

interface DeadlineItem {
    id: number;
    category_id: number;
    title: string;
    sort_order: number;
    is_archived: boolean;
}

interface DeadlineTimepoint {
    id: number;
    item_id: number;
    date: string;
    label: string;
    done: boolean;
}

type TabKey = 'days' | 'activities' | 'deadlines' | 'archives';

const STATUS_BADGE: Record<string, string> = {
    good: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
    ok: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
    bad: 'text-rose-400 bg-rose-500/10 border-rose-500/30',
};

export default function CalendarAdmin() {
    const [tab, setTab] = useState<TabKey>('days');

    // === Days ===
    const [days, setDays] = useState<CalendarDay[]>([]);
    const [daysLoading, setDaysLoading] = useState(true);
    const [newDayDate, setNewDayDate] = useState('');
    const [newDayStatus, setNewDayStatus] = useState('good');
    const [newDayComment, setNewDayComment] = useState('');

    // === Activities ===
    const [activities, setActivities] = useState<CalendarActivity[]>([]);
    const [actLoading, setActLoading] = useState(true);
    const [newActDate, setNewActDate] = useState('');
    const [newActContent, setNewActContent] = useState('');
    const [newActDuration, setNewActDuration] = useState('');

    // === Deadlines (New) ===
    const [categories, setCategories] = useState<DeadlineCategory[]>([]);
    const [items, setItems] = useState<DeadlineItem[]>([]);
    const [timepoints, setTimepoints] = useState<DeadlineTimepoint[]>([]);
    const [dlLoading, setDlLoading] = useState(true);

    // === Fetch ===
    const fetchDays = async () => {
        setDaysLoading(true);
        const { data, error } = await supabase.from('calendar_days').select('*').order('date', { ascending: false });
        if (error) toast.error('加载日期数据失败');
        else setDays(data || []);
        setDaysLoading(false);
    };

    const fetchActivities = async () => {
        setActLoading(true);
        const { data, error } = await supabase.from('calendar_activities').select('*').order('date', { ascending: false }).order('created_at', { ascending: true });
        if (error) toast.error('加载事项数据失败');
        else setActivities(data || []);
        setActLoading(false);
    };

    const fetchDeadlines = async () => {
        setDlLoading(true);
        const [catsRes, itemsRes, tpsRes] = await Promise.all([
            supabase.from('deadline_categories').select('*').order('sort_order', { ascending: true }),
            supabase.from('deadline_items').select('*').order('sort_order', { ascending: true }),
            supabase.from('deadline_timepoints').select('*').order('date', { ascending: true })
        ]);

        if (catsRes.error || itemsRes.error || tpsRes.error) {
            toast.error('加载 Deadline 数据失败');
        } else {
            setCategories(catsRes.data || []);
            setItems(itemsRes.data || []);
            setTimepoints(tpsRes.data || []);
        }
        setDlLoading(false);
    };

    useEffect(() => {
        fetchDays();
        fetchActivities();
        fetchDeadlines();
    }, []);

    // === Days CRUD ===
    const handleAddDay = async () => {
        if (!newDayDate) { toast.error('请选择日期'); return; }
        const { error } = await supabase.from('calendar_days').insert({
            date: newDayDate, status: newDayStatus || null, comment: newDayComment
        });
        if (error) toast.error('添加失败: ' + error.message);
        else { toast.success('已添加'); setNewDayDate(''); setNewDayComment(''); fetchDays(); }
    };

    const handleUpdateDayStatus = async (id: number, status: string | null) => {
        const { error } = await supabase.from('calendar_days').update({ status }).eq('id', id);
        if (error) toast.error('更新失败');
        else { setDays(prev => prev.map(d => d.id === id ? { ...d, status } : d)); }
    };

    // === Activities CRUD ===
    const handleAddActivity = async () => {
        if (!newActDate || !newActContent.trim()) { toast.error('日期和内容必填'); return; }
        const { error } = await supabase.from('calendar_activities').insert({
            date: newActDate, content: newActContent.trim(), duration: newActDuration ? parseFloat(newActDuration) : null
        });
        if (error) toast.error('添加失败: ' + error.message);
        else { toast.success('已添加'); setNewActContent(''); setNewActDuration(''); fetchActivities(); }
    };

    // === Archives Actions ===
    const handleRestoreItem = async (id: number) => {
        const { error } = await supabase.from('deadline_items').update({ is_archived: false }).eq('id', id);
        if (error) toast.error('还原失败');
        else { toast.success('条目已还原至日历'); fetchDeadlines(); }
    };

    // === Tab 样式 ===
    const tabClass = (t: TabKey) =>
        `px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 ${tab === t
            ? 'bg-white/10 text-white'
            : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'
        }`;

    const activeItems = items.filter(i => !i.is_archived);
    const archivedItems = items.filter(i => i.is_archived);

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold tracking-tight text-white">日历管理</h2>

            {/* Tab 切换 */}
            <div className="flex gap-2 border-b border-zinc-800 pb-3">
                <button className={tabClass('days')} onClick={() => setTab('days')}>日期状态</button>
                <button className={tabClass('activities')} onClick={() => setTab('activities')}>事项记录</button>
                <button className={tabClass('deadlines')} onClick={() => setTab('deadlines')}>
                    <ListTree size={14} /> 结构
                </button>
                <button className={tabClass('archives')} onClick={() => setTab('archives')}>
                    <Archive size={14} /> 归档仓库
                    {archivedItems.length > 0 && <span className="px-1.5 py-0.5 rounded-full bg-rose-500 text-[10px] text-white font-bold">{archivedItems.length}</span>}
                </button>
            </div>

            {/* ===== 日期状态 Tab ===== */}
            {tab === 'days' && (
                <div className="space-y-4">
                    {/* 添加表单 */}
                    <div className="flex items-end gap-3 p-4 rounded-lg border border-zinc-800 bg-zinc-950/50">
                        <div className="space-y-1">
                            <label className="text-xs text-zinc-500">日期</label>
                            <Input type="date" value={newDayDate} onChange={e => setNewDayDate(e.target.value)}
                                className="bg-black border-zinc-800 w-40" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs text-zinc-500">状态</label>
                            <select value={newDayStatus} onChange={e => setNewDayStatus(e.target.value)}
                                className="flex h-10 rounded-md border border-zinc-800 bg-black px-3 py-2 text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-600">
                                <option value="good">好 (Good)</option>
                                <option value="ok">一般 (OK)</option>
                                <option value="bad">差 (Bad)</option>
                            </select>
                        </div>
                        <div className="space-y-1 flex-1">
                            <label className="text-xs text-zinc-500">评语</label>
                            <Input value={newDayComment} onChange={e => setNewDayComment(e.target.value)}
                                placeholder="当日评语..." className="bg-black border-zinc-800" />
                        </div>
                        <Button onClick={handleAddDay} className="bg-blue-600 hover:bg-blue-700 text-white gap-1 shrink-0">
                            <Plus size={14} /> 添加
                        </Button>
                    </div>

                    <div className="rounded-md border border-zinc-800 bg-zinc-950/50">
                        <Table>
                            <TableHeader>
                                <TableRow className="border-zinc-800 hover:bg-zinc-900/50">
                                    <TableHead className="text-zinc-400 w-[120px]">日期</TableHead>
                                    <TableHead className="text-zinc-400 w-[100px]">状态</TableHead>
                                    <TableHead className="text-zinc-400">评语</TableHead>
                                    <TableHead className="text-zinc-400 text-right w-[120px]">操作</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {daysLoading ? (
                                    <TableRow><TableCell colSpan={4} className="text-center py-10 text-zinc-500">加载中...</TableCell></TableRow>
                                ) : days.length === 0 ? (
                                    <TableRow><TableCell colSpan={4} className="text-center py-10 text-zinc-500">暂无记录</TableCell></TableRow>
                                ) : days.map(d => (
                                    <TableRow key={d.id} className="border-zinc-800 hover:bg-zinc-900/50">
                                        <TableCell className="font-mono text-zinc-300 text-sm">{d.date}</TableCell>
                                        <TableCell>
                                            {d.status ? (
                                                <div className="flex items-center gap-2">
                                                    <span className={`px-2 py-0.5 rounded-full border text-[11px] ${STATUS_BADGE[d.status] || 'text-zinc-400'}`}>
                                                        {d.status}
                                                    </span>
                                                    <button onClick={() => handleUpdateDayStatus(d.id, null)} className="text-zinc-600 hover:text-zinc-300">
                                                        <X size={12} />
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="flex gap-1">
                                                    {['good', 'ok', 'bad'].map(s => (
                                                        <button key={s} onClick={() => handleUpdateDayStatus(d.id, s)}
                                                            className={`w-5 h-5 rounded-full opacity-30 hover:opacity-80 transition-opacity ${s === 'good' ? 'bg-emerald-400' : s === 'ok' ? 'bg-amber-400' : 'bg-rose-400'}`}
                                                        />
                                                    ))}
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-zinc-400 text-sm max-w-[300px] truncate">{d.comment || '—'}</TableCell>
                                        <TableCell className="text-right">
                                            <SafeDeleteDialog table="calendar_days" recordId={d.id} title={`删除 ${d.date} 的记录？`} onSuccess={fetchDays}>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-red-400 hover:bg-red-950/50">
                                                    <Trash size={14} />
                                                </Button>
                                            </SafeDeleteDialog>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            )}

            {/* ===== 事项记录 Tab ===== */}
            {tab === 'activities' && (
                <div className="space-y-4">
                    <div className="flex items-end gap-3 p-4 rounded-lg border border-zinc-800 bg-zinc-950/50">
                        <div className="space-y-1">
                            <label className="text-xs text-zinc-500">日期</label>
                            <Input type="date" value={newActDate} onChange={e => setNewActDate(e.target.value)}
                                className="bg-black border-zinc-800 w-40" />
                        </div>
                        <div className="space-y-1 flex-1">
                            <label className="text-xs text-zinc-500">内容</label>
                            <Input value={newActContent} onChange={e => setNewActContent(e.target.value)}
                                placeholder="做了什么..." className="bg-black border-zinc-800" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs text-zinc-500">时长(h)</label>
                            <Input type="number" step="0.5" value={newActDuration} onChange={e => setNewActDuration(e.target.value)}
                                placeholder="可选" className="bg-black border-zinc-800 w-24" />
                        </div>
                        <Button onClick={handleAddActivity} className="bg-blue-600 hover:bg-blue-700 text-white gap-1 shrink-0">
                            <Plus size={14} /> 添加
                        </Button>
                    </div>

                    <div className="rounded-md border border-zinc-800 bg-zinc-950/50">
                        <Table>
                            <TableHeader>
                                <TableRow className="border-zinc-800 hover:bg-zinc-900/50">
                                    <TableHead className="text-zinc-400 w-[120px]">日期</TableHead>
                                    <TableHead className="text-zinc-400">内容</TableHead>
                                    <TableHead className="text-zinc-400 w-[80px]">时长</TableHead>
                                    <TableHead className="text-zinc-400 text-right w-[80px]">操作</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {actLoading ? (
                                    <TableRow><TableCell colSpan={4} className="text-center py-10 text-zinc-500">加载中...</TableCell></TableRow>
                                ) : activities.length === 0 ? (
                                    <TableRow><TableCell colSpan={4} className="text-center py-10 text-zinc-500">暂无记录</TableCell></TableRow>
                                ) : activities.map(a => (
                                    <TableRow key={a.id} className="border-zinc-800 hover:bg-zinc-900/50">
                                        <TableCell className="font-mono text-zinc-300 text-sm">{a.date}</TableCell>
                                        <TableCell className="text-gray-200 font-medium">{a.content}</TableCell>
                                        <TableCell className="text-zinc-400 font-mono text-sm">{a.duration !== null ? `${a.duration}h` : '—'}</TableCell>
                                        <TableCell className="text-right">
                                            <SafeDeleteDialog table="calendar_activities" recordId={a.id} title={`彻底删除该记录？`} onSuccess={fetchActivities}>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-red-400 hover:bg-red-950/50">
                                                    <Trash size={14} />
                                                </Button>
                                            </SafeDeleteDialog>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            )}

            {/* ===== Deadline 结构 Tab ===== */}
            {tab === 'deadlines' && (
                <div className="space-y-4">
                    <div className="rounded-md border border-zinc-800 bg-zinc-950/50 p-6 overflow-x-auto">
                        <div className="flex flex-wrap gap-8 items-start">
                            {categories.map(cat => {
                                const catItems = activeItems.filter(i => i.category_id === cat.id);
                                return (
                                    <div key={cat.id} className="w-64 shrink-0 bg-black/40 border border-zinc-800 rounded-xl p-4 self-start">
                                        <div className="flex items-center justify-between mb-4 pb-2 border-b border-zinc-800">
                                            <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">{cat.name}</span>
                                            <span className="text-[10px] font-mono text-zinc-600">{catItems.length} ITEMS</span>
                                        </div>
                                        <div className="space-y-1.5">
                                            {catItems.map(item => (
                                                <div key={item.id} className="flex items-center justify-between text-sm group">
                                                    <span className="text-zinc-300 truncate pr-2">{item.title}</span>
                                                    <SafeDeleteDialog table="deadline_items" recordId={item.id} title={`删除条目 "${item.title}"？`} description="此操作不可恢复。" onSuccess={fetchDeadlines}>
                                                        <button className="opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-rose-400 transition-opacity">
                                                            <Trash size={12} />
                                                        </button>
                                                    </SafeDeleteDialog>
                                                </div>
                                            ))}
                                            {catItems.length === 0 && <div className="text-[10px] text-zinc-700 italic border border-dashed border-zinc-800/50 rounded p-2 text-center">空空如也</div>}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        {categories.length === 0 && <div className="py-20 text-center text-zinc-600 italic">尚未创建任何分类</div>}
                    </div>
                    <p className="text-[11px] text-zinc-500 italic">* 三级结构管理请至前台日历侧边栏进行可视化实时调整（支持拖拽与快速新增）。</p>
                </div>
            )}

            {/* ===== 归档管理 Tab ===== */}
            {tab === 'archives' && (
                <div className="space-y-4">
                    <div className="rounded-md border border-zinc-800 bg-zinc-950/50">
                        <Table>
                            <TableHeader>
                                <TableRow className="border-zinc-800 hover:bg-zinc-900/50">
                                    <TableHead className="text-zinc-400">所属分类</TableHead>
                                    <TableHead className="text-zinc-400">条目名称</TableHead>
                                    <TableHead className="text-zinc-400">累计时长</TableHead>
                                    <TableHead className="text-zinc-400">截止日期集</TableHead>
                                    <TableHead className="text-zinc-400 text-right w-[150px]">操作</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {dlLoading ? (
                                    <TableRow><TableCell colSpan={3} className="text-center py-10 text-zinc-500">加载中...</TableCell></TableRow>
                                ) : archivedItems.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={3} className="text-center py-20">
                                            <div className="flex flex-col items-center gap-3">
                                                <Box size={40} className="text-zinc-800" />
                                                <div className="text-zinc-600 text-sm">暂无已归档条目</div>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : archivedItems.map(item => {
                                    const cat = categories.find(c => c.id === item.category_id);
                                    const itemTimepoints = timepoints.filter(tp => tp.item_id === item.id);
                                    const itemDuration = activities
                                        .filter(a => a.deadline_item_id === item.id)
                                        .reduce((sum, a) => sum + (a.duration || 0), 0);

                                    return (
                                        <TableRow key={item.id} className="border-zinc-800 hover:bg-zinc-900/50">
                                            <TableCell className="text-zinc-500 font-medium">
                                                {cat?.name || '未分类'}
                                            </TableCell>
                                            <TableCell className="text-zinc-300 font-semibold tracking-wide">
                                                <span className="line-through decoration-zinc-700 decoration-2 mr-2 opacity-60">
                                                    {item.title}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-zinc-400 font-mono text-xs">
                                                {itemDuration > 0 ? (
                                                    <span className="text-amber-500/80 font-bold">{itemDuration.toFixed(1)}h</span>
                                                ) : '—'}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {itemTimepoints.length > 0 ? itemTimepoints.map(tp => (
                                                        <div key={tp.id} className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono ${tp.done ? 'bg-emerald-500/10 text-emerald-500/70' : 'bg-zinc-800 text-zinc-400'}`}>
                                                            {tp.date}
                                                            {tp.label && <span className="text-[8px] opacity-60">({tp.label})</span>}
                                                            {tp.done && <Check size={8} />}
                                                        </div>
                                                    )) : <span className="text-zinc-700 text-[10px] italic">无日期</span>}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleRestoreItem(item.id)}
                                                        className="h-8 text-emerald-500 hover:text-emerald-400 hover:bg-emerald-950/30 gap-1.5"
                                                    >
                                                        <RotateCcw size={14} /> 恢复
                                                    </Button>
                                                    <SafeDeleteDialog
                                                        table="deadline_items"
                                                        recordId={item.id}
                                                        title={`永久删除归档项 "${item.title}"？`}
                                                        description="删除后将无法恢复其数据统计与时间点。"
                                                        onSuccess={fetchDeadlines}
                                                    >
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-8 text-rose-500 hover:text-rose-400 hover:bg-rose-950/30 gap-1.5"
                                                        >
                                                            <Trash size={14} /> 彻底删除
                                                        </Button>
                                                    </SafeDeleteDialog>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            )}
        </div>
    );
}
