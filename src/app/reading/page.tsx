"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Quote, Calendar, Hash, X, ChevronLeft, ChevronRight, BookOpen, Bookmark } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';

// --- 1. 数据结构 (保持不变) ---
type Category = string;

interface BookQuote {
    text: string;
    chapter: string;
}

interface Book {
    id: number;
    title: string;
    category: Category;
    cover: string;
    period: { start: string; end: string };
    excerpt: string;
    quotes: BookQuote[];
}

// 模拟数据 (保持不变) - Replaced by Supabase
const BOOKS: Book[] = [];

const ITEMS_PER_PAGE = 4;

export default function ReadingArchive() {
    const [books, setBooks] = useState<Book[]>([]);
    const [currentPage, setCurrentPage] = useState(0);
    const [direction, setDirection] = useState(0);
    const [selectedBook, setSelectedBook] = useState<Book | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

    useEffect(() => {
        const fetchBooks = async () => {
            const { data, error } = await supabase
                .from('books')
                .select('*')
                .order('period_start', { ascending: false });

            if (data) {
                const mappedBooks: Book[] = data.map((item: any) => ({
                    id: item.id,
                    title: item.title,
                    category: item.category as Category,
                    cover: item.cover_url || '',
                    period: {
                        start: item.period_start || '',
                        end: item.period_end || 'Active'
                    },
                    excerpt: item.excerpt || '',
                    quotes: item.quotes as BookQuote[] || []
                }));
                setBooks(mappedBooks);

                // Initialize selected category if not set
                if (mappedBooks.length > 0) {
                    const uniqueCats = Array.from(new Set(mappedBooks.map(b => b.category)));
                    const predefinedOrder = ['Literature', 'LightNovel', 'SocialSci'];
                    uniqueCats.sort((a, b) => {
                        const idxA = predefinedOrder.indexOf(a);
                        const idxB = predefinedOrder.indexOf(b);
                        if (idxA !== -1 && idxB !== -1) return idxA - idxB;
                        if (idxA !== -1) return -1;
                        if (idxB !== -1) return 1;
                        return a.localeCompare(b);
                    });
                    setSelectedCategory(uniqueCats[0]);
                }
            }
        };
        fetchBooks();
    }, []);

    const categories = useMemo(() => {
        const uniqueCats = Array.from(new Set(books.map(b => b.category)));
        const predefinedOrder = ['Literature', 'LightNovel', 'SocialSci'];
        return uniqueCats.sort((a, b) => {
            const idxA = predefinedOrder.indexOf(a);
            const idxB = predefinedOrder.indexOf(b);
            if (idxA !== -1 && idxB !== -1) return idxA - idxB;
            if (idxA !== -1) return -1;
            if (idxB !== -1) return 1;
            return a.localeCompare(b);
        });
    }, [books]);

    const filteredBooks = useMemo(() => {
        if (!selectedCategory) return books;
        return books.filter(b => b.category === selectedCategory);
    }, [books, selectedCategory]);

    const sortedBooks = useMemo(() => {
        return [...filteredBooks].sort((a, b) => {
            return b.period.start.localeCompare(a.period.start);
        });
    }, [filteredBooks]);

    const totalPages = Math.ceil(sortedBooks.length / ITEMS_PER_PAGE);
    const currentBooks = sortedBooks.slice(currentPage * ITEMS_PER_PAGE, (currentPage + 1) * ITEMS_PER_PAGE);

    const jumpToCategory = (category: Category) => {
        if (selectedCategory === category) return;
        setDirection(categories.indexOf(category) > categories.indexOf(selectedCategory!) ? 1 : -1);
        setSelectedCategory(category);
        setCurrentPage(0);
    };

    const paginate = (newDirection: number) => {
        const nextPage = currentPage + newDirection;
        if (nextPage >= 0 && nextPage < totalPages) {
            setDirection(newDirection);
            setCurrentPage(nextPage);
        }
    };

    const slideVariants = {
        enter: (direction: number) => ({ x: direction > 0 ? 1200 : -1200, opacity: 0, scale: 0.95 }),
        center: { zIndex: 1, x: 0, opacity: 1, scale: 1 },
        exit: (direction: number) => ({ zIndex: 0, x: direction < 0 ? 1200 : -1200, opacity: 0, scale: 0.95 })
    };

    return (
        <div className="min-h-screen w-full bg-[#050505] text-gray-200 overflow-hidden flex flex-col font-serif relative">

            {/* --- 顶部左侧 --- */}
            <div className="absolute top-12 left-10 z-30 flex items-center gap-4">
                <Link href="/" className="p-3 border border-white/10 hover:border-white/30 rounded-full transition-all group bg-black/50 backdrop-blur-md">
                    <ArrowLeft size={18} className="text-gray-500 group-hover:text-gray-200" />
                </Link>
                <div>
                    <h1 className="text-4xl font-bold italic tracking-tighter uppercase text-white/90">
                        Reading<span className="text-gray-600">_Archive</span>
                    </h1>
                    <p className="text-[12px] font-mono text-blue-500/60 tracking-[0.4em] uppercase mt-1">
                        System Active
                    </p>
                </div>
            </div>

            {/* --- 顶部正中 --- */}
            <div className="absolute top-10 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center select-none w-full pointer-events-none">
                <div className="flex items-baseline gap-3 opacity-70 mb-2">
                    <span className="text-6xl font-black font-serif tracking-tighter text-white">
                        {String(currentPage + 1).padStart(2, '0')}
                    </span>
                    <span className="text-2xl font-mono text-gray-500 font-light">/ {String(totalPages).padStart(2, '0')}</span>
                </div>

                <div className="relative w-full max-w-4xl mt-4 overflow-hidden mask-fade-edges">
                    <div className="flex justify-center items-center h-20 overflow-x-auto no-scrollbar scroll-smooth">
                        <nav className="flex items-center gap-12 px-[25%] pointer-events-auto shrink-0">
                            {categories.map((cat) => {
                                const isActive = selectedCategory === cat;
                                return (
                                    <button
                                        key={cat}
                                        onClick={() => jumpToCategory(cat)}
                                        className={`relative whitespace-nowrap text-xl md:text-2xl font-serif italic tracking-wide transition-all duration-500 hover:scale-105 ${isActive
                                            ? 'text-blue-100 scale-110 drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]'
                                            : 'text-gray-700 hover:text-gray-500'
                                            }`}
                                    >
                                        {cat}
                                        {isActive && (
                                            <motion.div
                                                layoutId="categoryUnderline"
                                                className="absolute -bottom-1 left-0 right-0 h-px bg-blue-400/50"
                                            />
                                        )}
                                    </button>
                                );
                            })}
                        </nav>
                    </div>
                </div>
            </div>

            {/* --- Main Content --- */}
            <div className="flex-1 relative flex items-center justify-center w-full px-4 md:px-12 mt-32 md:mt-24">

                <button
                    onClick={() => paginate(-1)}
                    disabled={currentPage === 0}
                    className="absolute left-4 md:left-8 z-30 p-4 disabled:opacity-0 transition-all text-gray-700 hover:text-white/80 hover:scale-110"
                >
                    <ChevronLeft size={48} strokeWidth={0.8} />
                </button>
                <button
                    onClick={() => paginate(1)}
                    disabled={currentPage === totalPages - 1}
                    className="absolute right-4 md:right-8 z-30 p-4 disabled:opacity-0 transition-all text-gray-700 hover:text-white/80 hover:scale-110"
                >
                    <ChevronRight size={48} strokeWidth={0.8} />
                </button>

                <div className="w-full max-w-[1500px] h-[70vh] min-h-[500px] relative">
                    <AnimatePresence initial={false} custom={direction} mode="wait">
                        <motion.div
                            key={currentPage}
                            custom={direction}
                            variants={slideVariants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            transition={{ x: { type: "spring", stiffness: 200, damping: 28 }, opacity: { duration: 0.25 } }}
                            className="absolute inset-0 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 items-center justify-items-center"
                        >
                            {currentBooks.map((book) => (
                                <RealisticBookCard key={book.id} book={book} onClick={() => setSelectedBook(book)} />
                            ))}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>

            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.12] mix-blend-overlay pointer-events-none z-50"></div>

            <AnimatePresence>
                {selectedBook && (
                    <BookDetailModal book={selectedBook} onClose={() => setSelectedBook(null)} />
                )}
            </AnimatePresence>
        </div>
    );
}

// ==============================================
// 2. 拟物化卡片组件 (深邃渐变边框 + 摘录轮播)
// ==============================================
// ==============================================
// 2. 拟物化卡片组件 (修复 Hydration 报错版)
// ==============================================
const RealisticBookCard = ({ book, onClick }: { book: Book; onClick: () => void }) => {
    // 状态管理：控制当前显示的摘录索引
    const [quoteIndex, setQuoteIndex] = useState(0);

    // 效果：每 6 秒轮播一次摘录
    useEffect(() => {
        if (!book.quotes || book.quotes.length <= 1) return;

        const interval = setInterval(() => {
            setQuoteIndex((prev) => (prev + 1) % book.quotes.length);
        }, 6000); // 6秒切换一次

        return () => clearInterval(interval);
    }, [book.quotes]);

    // 获取当前展示的 Quote 对象
    const currentQuote = book.quotes && book.quotes.length > 0 ? book.quotes[quoteIndex] : { text: book.excerpt, chapter: '' };

    return (
        <motion.div
            onClick={onClick}
            // 外层容器：相对定位，用于放置绝对定位的渐变背景
            className="w-full max-w-[340px] h-[560px] relative group cursor-pointer rounded-sm z-0"
        >
            {/* --- 深邃渐变边框层 (修复点：移除了 className 内部的注释) --- */}
            <div
                className="absolute inset-0 rounded-sm -z-10 transition-all duration-500 bg-[conic-gradient(from_90deg_at_50%_50%,#1a1a1a_0%,#0a0a0a_50%,#1a1a1a_100%)] group-hover:bg-[conic-gradient(from_90deg_at_50%_50%,#334155_0%,#0a0a0a_50%,#475569_100%)] blur-[1px] group-hover:blur-[2px]"
            />

            {/* --- 卡片内容层 --- */}
            <div className="h-full w-full bg-[#0a0a0a] m-px rounded-[inherit] overflow-hidden flex flex-col shadow-[0_10px_30px_-10px_rgba(0,0,0,0.8)] transition-all group-hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.9)]">
                {/* --- A. 封面区域 --- */}
                <div className="relative h-[80%] w-full overflow-hidden bg-[#050505]">

                    <img
                        src={book.cover}
                        className="w-full h-full object-cover opacity-60 mix-blend-luminosity grayscale-40 contrast-125 transition-all duration-700 ease-out group-hover:opacity-100 group-hover:mix-blend-normal group-hover:grayscale-0 group-hover:scale-105"
                    />

                    <div className="absolute inset-0 shadow-[inset_0_0_40px_rgba(0,0,0,0.9)] pointer-events-none" />



                    {/* 时间周期：位置调整到右下 */}
                    <div className="absolute bottom-5 right-5 flex flex-col items-end gap-1">
                        <span className="px-2 py-[2px] bg-black/60 backdrop-blur-md border border-white/10 text-[8px] font-mono text-gray-300">
                            {book.period.start}
                        </span>
                        <span className="h-2 w-px bg-white/20 mr-2"></span>
                        <span className="px-2 py-[2px] bg-blue-500/20 backdrop-blur-md border border-blue-400/20 text-[8px] font-mono text-blue-200">
                            {book.period.end}
                        </span>
                    </div>
                </div>

                {/* --- B. 信息区域 --- */}
                <div className="h-[20%] px-6 py-5 flex flex-col justify-center border-t border-white/5 bg-[#0e0e0e] relative z-10">
                    <div className="flex justify-between items-baseline mb-2">
                        <h3 className="text-xl font-bold font-serif tracking-tight text-gray-300 group-hover:text-white transition-colors line-clamp-1">
                            {book.title}
                        </h3>
                    </div>

                    <div className="w-6 h-px bg-white/10 mb-3 group-hover:w-full transition-all duration-500 ease-out" />

                    <div className="relative pl-0 min-h-[3em]">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={quoteIndex}
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -5 }}
                                transition={{ duration: 0.5 }}
                                className="absolute top-0 left-0 w-full"
                            >
                                <p className="font-serif italic text-xs text-gray-500 leading-relaxed line-clamp-2 group-hover:text-gray-400 transition-colors">
                                    "{currentQuote.text}"
                                </p>
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

// ==============================================
// 3. 详情弹窗 (保持不变)
// ==============================================
const BookDetailModal = ({ book, onClose }: { book: Book; onClose: () => void }) => {
    return (
        <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8 bg-black/95 backdrop-blur-sm"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.98, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.98, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-6xl bg-[#0a0a0a] border border-white/10 overflow-hidden shadow-2xl flex flex-col md:flex-row h-[85vh] relative"
            >
                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 z-20 p-2 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-all"
                >
                    <X size={24} strokeWidth={1} />
                </button>

                <div className="w-full md:w-2/5 relative h-64 md:h-auto overflow-hidden bg-[#050505]">
                    <img src={book.cover} className="w-full h-full object-cover opacity-90" />
                    <div className="absolute inset-0 bg-linear-to-t from-[#0a0a0a] via-transparent to-transparent opacity-90" />

                    <div className="absolute bottom-12 left-12 right-12">
                        <div className="inline-flex items-center gap-2 text-blue-100/40 text-[10px] font-mono uppercase mb-4 tracking-widest border border-white/10 px-3 py-1 rounded-full">
                            <Bookmark size={10} /> {book.category}
                        </div>
                        <h2 className="text-5xl md:text-6xl font-black font-serif italic tracking-tighter text-gray-200 mb-6">
                            {book.title}
                        </h2>
                        <div className="flex items-center gap-3 text-gray-500 font-mono text-xs border-t border-white/10 pt-6">
                            <Calendar size={14} /> {book.period.start} → {book.period.end}
                        </div>
                    </div>
                </div>

                <div className="flex-1 p-12 md:p-20 overflow-y-auto custom-scrollbar bg-[#0c0c0c]">
                    <div className="max-w-2xl mx-auto">
                        <div className="flex items-center gap-3 mb-16 opacity-30">
                            <BookOpen size={16} />
                            <span className="text-[10px] font-mono tracking-[0.4em] uppercase">Fragmented_Notes</span>
                            <div className="h-px flex-1 bg-white/50" />
                        </div>

                        <div className="space-y-16">
                            {book.quotes && book.quotes.map((quote, idx) => (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.2 + idx * 0.1 }}
                                    className="relative pl-8 border-l border-blue-900/40"
                                >
                                    <Quote size={20} className="absolute -left-[11px] top-0 text-black fill-gray-800 stroke-none" />
                                    <p className="text-2xl md:text-3xl font-serif text-gray-300 leading-relaxed">
                                        {quote.text}
                                    </p>
                                    <div className="mt-6 text-right">
                                        <span className="text-[9px] font-mono text-gray-600 uppercase tracking-widest">
                                            — {quote.chapter}
                                        </span>
                                    </div>
                                </motion.div>
                            ))}
                            <div className="h-20" />
                        </div>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
};