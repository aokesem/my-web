"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Trash, Check, X } from 'lucide-react';
import { toast } from 'sonner';

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
}

interface CalendarDeadline {
    id: number;
    title: string;
    date: string;
    done: boolean;
}

type TabKey = 'days' | 'activities' | 'deadlines';

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

    // === Deadlines ===
    const [deadlines, setDeadlines] = useState<CalendarDeadline[]>([]);
    const [dlLoading, setDlLoading] = useState(true);
    const [newDlTitle, setNewDlTitle] = useState('');
    const [newDlDate, setNewDlDate] = useState('');

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
        const { data, error } = await supabase.from('calendar_deadlines').select('*').order('date', { ascending: true });
        if (error) toast.error('加载 Deadline 数据失败');
        else setDeadlines(data || []);
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

    const handleDeleteDay = async (id: number) => {
        if (!confirm('确定删除该日期记录？')) return;
        const { error } = await supabase.from('calendar_days').delete().eq('id', id);
        if (error) toast.error('删除失败');
        else { toast.success('已删除'); fetchDays(); }
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

    const handleDeleteActivity = async (id: number) => {
        if (!confirm('确定删除？')) return;
        const { error } = await supabase.from('calendar_activities').delete().eq('id', id);
        if (error) toast.error('删除失败');
        else { toast.success('已删除'); fetchActivities(); }
    };

    // === Deadlines CRUD ===
    const handleAddDeadline = async () => {
        if (!newDlTitle.trim() || !newDlDate) { toast.error('标题和日期必填'); return; }
        const { error } = await supabase.from('calendar_deadlines').insert({
            title: newDlTitle.trim(), date: newDlDate, done: false
        });
        if (error) toast.error('添加失败: ' + error.message);
        else { toast.success('已添加'); setNewDlTitle(''); setNewDlDate(''); fetchDeadlines(); }
    };

    const handleDeleteDeadline = async (id: number) => {
        if (!confirm('确定删除？')) return;
        const { error } = await supabase.from('calendar_deadlines').delete().eq('id', id);
        if (error) toast.error('删除失败');
        else { toast.success('已删除'); fetchDeadlines(); }
    };

    const handleToggleDeadline = async (id: number, done: boolean) => {
        const { error } = await supabase.from('calendar_deadlines').update({ done: !done }).eq('id', id);
        if (error) toast.error('更新失败');
        else { setDeadlines(prev => prev.map(d => d.id === id ? { ...d, done: !done } : d)); }
    };

    // === Tab 样式 ===
    const tabClass = (t: TabKey) =>
        `px-4 py-2 text-sm font-medium rounded-lg transition-colors ${tab === t
            ? 'bg-white/10 text-white'
            : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'
        }`;

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold tracking-tight text-white">日历管理</h2>

            {/* Tab 切换 */}
            <div className="flex gap-2 border-b border-zinc-800 pb-3">
                <button className={tabClass('days')} onClick={() => setTab('days')}>日期状态</button>
                <button className={tabClass('activities')} onClick={() => setTab('activities')}>事项记录</button>
                <button className={tabClass('deadlines')} onClick={() => setTab('deadlines')}>Deadlines</button>
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
                                            <Button variant="ghost" size="icon" onClick={() => handleDeleteDay(d.id)}
                                                className="h-8 w-8 text-zinc-400 hover:text-red-400 hover:bg-red-950/50">
                                                <Trash size={14} />
                                            </Button>
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
                                            <Button variant="ghost" size="icon" onClick={() => handleDeleteActivity(a.id)}
                                                className="h-8 w-8 text-zinc-400 hover:text-red-400 hover:bg-red-950/50">
                                                <Trash size={14} />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            )}

            {/* ===== Deadlines Tab ===== */}
            {tab === 'deadlines' && (
                <div className="space-y-4">
                    <div className="flex items-end gap-3 p-4 rounded-lg border border-zinc-800 bg-zinc-950/50">
                        <div className="space-y-1 flex-1">
                            <label className="text-xs text-zinc-500">标题</label>
                            <Input value={newDlTitle} onChange={e => setNewDlTitle(e.target.value)}
                                placeholder="Deadline 事项名称..." className="bg-black border-zinc-800" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs text-zinc-500">截止日期</label>
                            <Input type="date" value={newDlDate} onChange={e => setNewDlDate(e.target.value)}
                                className="bg-black border-zinc-800 w-40" />
                        </div>
                        <Button onClick={handleAddDeadline} className="bg-blue-600 hover:bg-blue-700 text-white gap-1 shrink-0">
                            <Plus size={14} /> 添加
                        </Button>
                    </div>

                    <div className="rounded-md border border-zinc-800 bg-zinc-950/50">
                        <Table>
                            <TableHeader>
                                <TableRow className="border-zinc-800 hover:bg-zinc-900/50">
                                    <TableHead className="text-zinc-400 w-[50px]">完成</TableHead>
                                    <TableHead className="text-zinc-400">标题</TableHead>
                                    <TableHead className="text-zinc-400 w-[120px]">截止日期</TableHead>
                                    <TableHead className="text-zinc-400 text-right w-[80px]">操作</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {dlLoading ? (
                                    <TableRow><TableCell colSpan={4} className="text-center py-10 text-zinc-500">加载中...</TableCell></TableRow>
                                ) : deadlines.length === 0 ? (
                                    <TableRow><TableCell colSpan={4} className="text-center py-10 text-zinc-500">暂无 Deadline</TableCell></TableRow>
                                ) : deadlines.map(dl => {
                                    const isExpired = dl.date < new Date().toISOString().split('T')[0] && !dl.done;
                                    return (
                                        <TableRow key={dl.id} className={`border-zinc-800 hover:bg-zinc-900/50 ${dl.done ? 'opacity-40' : ''}`}>
                                            <TableCell>
                                                <button onClick={() => handleToggleDeadline(dl.id, dl.done)} className="transition-transform active:scale-90">
                                                    {dl.done ? (
                                                        <Check size={18} className="text-emerald-500" />
                                                    ) : (
                                                        <div className="w-4 h-4 rounded border border-zinc-600 hover:border-zinc-400 transition-colors" />
                                                    )}
                                                </button>
                                            </TableCell>
                                            <TableCell className={`font-medium ${dl.done ? 'line-through text-zinc-500' : isExpired ? 'text-rose-400' : 'text-gray-200'}`}>
                                                {dl.title}
                                            </TableCell>
                                            <TableCell className={`font-mono text-sm ${isExpired ? 'text-rose-400' : 'text-zinc-400'}`}>
                                                {dl.date}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="icon" onClick={() => handleDeleteDeadline(dl.id)}
                                                    className="h-8 w-8 text-zinc-400 hover:text-red-400 hover:bg-red-950/50">
                                                    <Trash size={14} />
                                                </Button>
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
