"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Pencil, Trash, X, ArrowUp, ArrowDown } from 'lucide-react';
import { toast } from 'sonner';
import { ImageUpload } from '@/components/ui/image-upload';

interface Book {
    id: number;
    title: string;
    category: string;
    cover_url: string;
    period_start: string | null;
    period_end: string | null;
    excerpt: string | null;
    quotes: { text: string; chapter: string }[] | null;
    display_order: number; // [新增] 排序字段
}

export default function BooksAdmin() {
    const [books, setBooks] = useState<Book[]>([]);
    const [loading, setLoading] = useState(true);
    const [isOpen, setIsOpen] = useState(false);
    const [currentBook, setCurrentBook] = useState<Partial<Book>>({});

    useEffect(() => {
        fetchBooks();
    }, []);

    const fetchBooks = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('books')
            .select('*')
            // [修改] 优先按 display_order 升序排列 (0, 1, 2...)，相同的再按 ID 排
            .order('display_order', { ascending: true })
            .order('id', { ascending: true });

        if (error) {
            toast.error('Failed to fetch books');
        } else {
            setBooks(data || []);
        }
        setLoading(false);
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this book?')) return;

        const { error } = await supabase.from('books').delete().eq('id', id);
        if (error) {
            toast.error('Delete failed');
        } else {
            toast.success('Book deleted');
            fetchBooks();
        }
    };

    const handleSave = async () => {
        if (!currentBook.title || !currentBook.category) {
            toast.error('Title and Category are required');
            return;
        }

        try {
            const payload = {
                title: currentBook.title,
                category: currentBook.category,
                cover_url: currentBook.cover_url,
                period_start: currentBook.period_start || null,
                period_end: currentBook.period_end || 'Active',
                excerpt: currentBook.excerpt,
                quotes: currentBook.quotes || [],
                display_order: Number(currentBook.display_order) || 0 // [新增] 保存排序权重
            };

            if (currentBook.id) {
                const { error } = await supabase
                    .from('books')
                    .update(payload)
                    .eq('id', currentBook.id);
                if (error) throw error;
                toast.success('Book updated');
            } else {
                const { error } = await supabase
                    .from('books')
                    .insert([payload]);
                if (error) throw error;
                toast.success('Book created');
            }

            setIsOpen(false);
            setCurrentBook({});
            fetchBooks();
        } catch (error: any) {
            toast.error('Operation failed: ' + error.message);
        }
    };

    const addQuote = () => {
        const quotes = currentBook.quotes || [];
        setCurrentBook({ ...currentBook, quotes: [...quotes, { text: '', chapter: '' }] });
    };

    const removeQuote = (index: number) => {
        const quotes = [...(currentBook.quotes || [])];
        quotes.splice(index, 1);
        setCurrentBook({ ...currentBook, quotes });
    };

    const updateQuote = (index: number, field: 'text' | 'chapter', value: string) => {
        const quotes = [...(currentBook.quotes || [])];
        quotes[index] = { ...quotes[index], [field]: value };
        setCurrentBook({ ...currentBook, quotes });
    };

    const openEdit = (book: Book) => {
        setCurrentBook(book);
        setIsOpen(true);
    };

    const openCreate = () => {
        // [新增] 自动设置 display_order 为当前最大值 + 10，方便排在最后
        const maxOrder = books.length > 0 ? Math.max(...books.map(b => b.display_order)) : 0;
        setCurrentBook({ category: 'Literature', quotes: [], display_order: maxOrder + 10 });
        setIsOpen(true);
    };

    const uniqueCategories = Array.from(new Set(books.map(b => b.category)));

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold tracking-tight text-white">书籍管理</h2>
                <Dialog open={isOpen} onOpenChange={setIsOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={openCreate} className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
                            <Plus size={16} /> 添加书籍
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-zinc-950 border-zinc-800 text-gray-100 max-w-2xl max-h-[85vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>{currentBook.id ? '编辑书籍' : '添加新书籍'}</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>书名</Label>
                                    <Input
                                        value={currentBook.title || ''}
                                        onChange={e => setCurrentBook({ ...currentBook, title: e.target.value })}
                                        className="bg-black border-zinc-800"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>分类</Label>
                                    <Input
                                        list="categories-list"
                                        value={currentBook.category || ''}
                                        onChange={e => setCurrentBook({ ...currentBook, category: e.target.value })}
                                        className="bg-black border-zinc-800"
                                        placeholder="选择或输入分类"
                                    />
                                    <datalist id="categories-list">
                                        <option value="Literature" />
                                        <option value="LightNovel" />
                                        <option value="SocialSci" />
                                        {uniqueCategories.map(cat => (
                                            <option key={cat} value={cat} />
                                        ))}
                                    </datalist>
                                </div>
                            </div>

                            {/* [新增] 排序权重设置 */}
                            <div className="space-y-2">
                                <Label className="text-blue-400">排序权重 (数字越小越靠前)</Label>
                                <Input
                                    type="number"
                                    value={currentBook.display_order ?? ''}
                                    onChange={e => setCurrentBook({ ...currentBook, display_order: Number(e.target.value) })}
                                    className="bg-black border-zinc-800"
                                    placeholder="例如: 1, 2, 3..."
                                />
                                <p className="text-[10px] text-zinc-500">提示：可以设置 10, 20, 30 这样留出中间插入的空间。</p>
                            </div>

                            <div className="space-y-2">
                                <Label>封面</Label>
                                <ImageUpload
                                    bucket="covers"
                                    folder="book_cover"
                                    value={currentBook.cover_url || ''}
                                    onChange={(url) => setCurrentBook({ ...currentBook, cover_url: url })}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>开始阅读日期</Label>
                                    <Input
                                        type="date"
                                        value={currentBook.period_start || ''}
                                        onChange={e => setCurrentBook({ ...currentBook, period_start: e.target.value })}
                                        className="bg-black border-zinc-800 block"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>结束日期</Label>
                                    <Input
                                        value={currentBook.period_end || ''}
                                        onChange={e => setCurrentBook({ ...currentBook, period_end: e.target.value })}
                                        className="bg-black border-zinc-800"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>摘要 / 短评</Label>
                                <Textarea
                                    value={currentBook.excerpt || ''}
                                    onChange={e => setCurrentBook({ ...currentBook, excerpt: e.target.value })}
                                    className="bg-black border-zinc-800 h-20"
                                />
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <Label>摘录 (Quotes)</Label>
                                    <Button type="button" variant="outline" size="sm" onClick={addQuote} className="h-7 text-xs border-zinc-700 bg-zinc-900 hover:bg-zinc-800">
                                        <Plus size={12} className="mr-1" /> 添加摘录
                                    </Button>
                                </div>
                                <div className="space-y-3">
                                    {currentBook.quotes?.map((quote, idx) => (
                                        <div key={idx} className="flex gap-2 items-start bg-zinc-900/50 p-2 rounded-md border border-zinc-800">
                                            <div className="grid gap-2 flex-1">
                                                <Input
                                                    placeholder="摘录内容..."
                                                    value={quote.text}
                                                    onChange={e => updateQuote(idx, 'text', e.target.value)}
                                                    className="bg-black border-zinc-800 h-8 text-xs"
                                                />
                                                <Input
                                                    placeholder="章节 / 页码"
                                                    value={quote.chapter}
                                                    onChange={e => updateQuote(idx, 'chapter', e.target.value)}
                                                    className="bg-black border-zinc-800 h-8 text-xs w-1/2"
                                                />
                                            </div>
                                            <Button type="button" variant="ghost" size="icon" onClick={() => removeQuote(idx)} className="h-6 w-6 text-zinc-500 hover:text-red-400">
                                                <X size={14} />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 mt-4">
                                <Button variant="outline" onClick={() => setIsOpen(false)} className="border-zinc-700 bg-transparent hover:bg-zinc-800 text-gray-300">取消</Button>
                                <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white">保存更改</Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="rounded-md border border-zinc-800 bg-zinc-950/50">
                <Table>
                    <TableHeader>
                        <TableRow className="border-zinc-800 hover:bg-zinc-900/50">
                            {/* [修改] 增加顺序显示列 */}
                            <TableHead className="text-zinc-400 w-[60px]">序号</TableHead>
                            <TableHead className="text-zinc-400">书名</TableHead>
                            <TableHead className="text-zinc-400">分类</TableHead>
                            <TableHead className="text-zinc-400">阅读周期</TableHead>
                            <TableHead className="text-zinc-400 text-right">操作</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-10 text-zinc-500">加载中...</TableCell>
                            </TableRow>
                        ) : books.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-10 text-zinc-500">暂无书籍。</TableCell>
                            </TableRow>
                        ) : (
                            books.map((book) => (
                                <TableRow key={book.id} className="border-zinc-800 hover:bg-zinc-900/50">
                                    <TableCell className="font-mono text-blue-400 font-bold">{book.display_order}</TableCell>
                                    <TableCell className="font-medium text-gray-200">{book.title}</TableCell>
                                    <TableCell>
                                        <span className="px-2 py-1 rounded-full bg-blue-500/10 text-blue-400 text-xs border border-blue-500/20">
                                            {book.category}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-zinc-400 text-sm">{book.period_start} → {book.period_end}</TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button variant="ghost" size="icon" onClick={() => openEdit(book)} className="h-8 w-8 text-zinc-400 hover:text-white hover:bg-zinc-800">
                                                <Pencil size={14} />
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => handleDelete(book.id)} className="h-8 w-8 text-zinc-400 hover:text-red-400 hover:bg-red-950/50">
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