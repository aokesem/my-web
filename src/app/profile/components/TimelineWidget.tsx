"use client";

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from "react-dom";
import { GitCommit, BookOpen, Users, Activity, X, ChevronLeft, ChevronRight, ImageIcon, Calendar } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

// === 数据定义 ===
interface DBTimelineItem {
    id: number;
    title: string;
    date: string;
    type: string;
    images?: string[];
}

interface TimelineItem extends DBTimelineItem {
    color: string;
    icon: any;
    images: string[];
}

const TYPE_CONFIG: Record<string, { color: string, icon: any }> = {
    knowledge: { color: 'bg-blue-500', icon: BookOpen },
    social: { color: 'bg-rose-500', icon: Users },
    arts: { color: 'bg-emerald-500', icon: Activity },
    default: { color: 'bg-slate-400', icon: GitCommit }
};

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'];

// 常量：可视范围内前后各保留的 item 数
const LazyLoadOffset = 6;

interface TimelineWidgetProps {
    isActive: boolean;
    onToggle: () => void;
}

// 带懒加载的图片组件
function LazyImage({ src, alt, className }: { src: string; alt: string; className?: string }) {
    const [loaded, setLoaded] = useState(false);
    const [inView, setInView] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setInView(true);
                    observer.disconnect();
                }
            },
            { rootMargin: '200px' }
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    return (
        <div ref={ref} className={`relative w-full aspect-4/3 rounded-lg overflow-hidden bg-slate-200/50 ${className || ''}`}>
            {inView ? (
                <>
                    {!loaded && (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-slate-500" />
                        </div>
                    )}
                    <img
                        src={src}
                        alt={alt}
                        className={`w-full h-full object-cover transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`}
                        onLoad={() => setLoaded(true)}
                    />
                </>
            ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                    <ImageIcon size={20} className="text-slate-300" />
                </div>
            )}
        </div>
    );
}

export default function TimelineWidget({ isActive, onToggle }: TimelineWidgetProps) {
    const [timelineData, setTimelineData] = useState<TimelineItem[]>([]);
    const [lightboxState, setLightboxState] = useState<{ itemId: number; imgIndex: number } | null>(null);
    // 可视范围 [startIndex, endIndex]
    const [visibleRange, setVisibleRange] = useState<[number, number]>([0, LazyLoadOffset * 2]);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const itemRefs = useRef<Map<number, HTMLDivElement>>(new Map());

    // 日期跳转日历
    const [calendarOpen, setCalendarOpen] = useState(false);
    const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());
    const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth());
    const calendarBtnRef = useRef<HTMLButtonElement>(null);

    // 获取数据
    useEffect(() => {
        const fetchTimeline = async () => {
            const { data } = await supabase
                .from('profile_timeline')
                .select('*')
                .order('date', { ascending: false });

            if (data) {
                const mappedData = data.map((item: DBTimelineItem) => {
                    const config = TYPE_CONFIG[item.type] || TYPE_CONFIG.default;
                    return {
                        ...item,
                        color: config.color,
                        icon: config.icon,
                        images: item.images || []
                    };
                });
                setTimelineData(mappedData);
            }
        };
        fetchTimeline();
    }, []);

    // 提取有记录的日期集合（YYYY-MM-DD）
    const datesWithRecords = useMemo(() => {
        const set = new Set<string>();
        timelineData.forEach((item) => set.add(item.date));
        return set;
    }, [timelineData]);

    // 提取当前日历月有记录的日期
    const monthDayFlags = useMemo(() => {
        const flags = new Set<number>();
        const ym = `${calendarYear}-${String(calendarMonth + 1).padStart(2, '0')}`;
        timelineData.forEach((item) => {
            if (item.date.startsWith(ym)) {
                flags.add(parseInt(item.date.split('-')[2], 10));
            }
        });
        return flags;
    }, [timelineData, calendarYear, calendarMonth]);

    // 日期处理
    const getYear = (dateStr: string) => dateStr.split('-')[0];
    const getDate = (dateStr: string) => {
        const parts = dateStr.split('-');
        if (parts.length < 3) return dateStr;
        return `${parts[1]}.${parts[2]}`;
    };

    const currentYear = timelineData.length > 0
        ? getYear(timelineData[0].date)
        : new Date().getFullYear().toString();

    // 生成日历网格
    const calendarGrid = useMemo(() => {
        const firstDay = new Date(calendarYear, calendarMonth, 1).getDay();
        const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();
        const today = new Date();
        const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

        const cells: Array<{ day: number | null; isToday: boolean; hasRecord: boolean }> = [];
        for (let i = 0; i < firstDay; i++) cells.push({ day: null, isToday: false, hasRecord: false });
        for (let d = 1; d <= daysInMonth; d++) {
            const dateStr = `${calendarYear}-${String(calendarMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            cells.push({ day: d, isToday: dateStr === todayStr, hasRecord: datesWithRecords.has(dateStr) });
        }
        return cells;
    }, [calendarYear, calendarMonth, datesWithRecords]);

    // 点击日期跳转（即时定位）
    const jumpToDate = (day: number) => {
        const dateStr = `${calendarYear}-${String(calendarMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const idx = timelineData.findIndex((item) => item.date === dateStr);
        if (idx === -1) return;
        setCalendarOpen(false);
        // 更新可见范围覆盖目标
        const start = Math.max(0, idx - LazyLoadOffset);
        const end = Math.min(timelineData.length - 1, idx + LazyLoadOffset);
        setVisibleRange([start, end]);
        // 直接定位，不使用平滑滚动
        requestAnimationFrame(() => {
            const el = itemRefs.current.get(timelineData[idx].id);
            const container = scrollContainerRef.current;
            if (el && container) {
                container.scrollTop = el.offsetTop - container.offsetHeight / 3;
            }
        });
    };

    // 懒加载：根据滚动更新可见范围
    const handleScroll = useCallback(() => {
        if (!scrollContainerRef.current) return;
        const container = scrollContainerRef.current;
        const containerTop = container.scrollTop;
        const containerHeight = container.clientHeight;
        const containerBottom = containerTop + containerHeight;

        let firstVisible = -1;
        let lastVisible = -1;

        itemRefs.current.forEach((el, id) => {
            const elTop = el.offsetTop;
            const elBottom = elTop + el.offsetHeight;
            if (elBottom >= containerTop - containerHeight && elTop <= containerBottom + containerHeight) {
                const idx = timelineData.findIndex((item) => item.id === id);
                if (idx !== -1) {
                    if (firstVisible === -1 || idx < firstVisible) firstVisible = idx;
                    if (lastVisible === -1 || idx > lastVisible) lastVisible = idx;
                }
            }
        });

        if (firstVisible !== -1 && lastVisible !== -1) {
            const start = Math.max(0, firstVisible - LazyLoadOffset);
            const end = Math.min(timelineData.length - 1, lastVisible + LazyLoadOffset);
            setVisibleRange((prev) => {
                if (prev[0] === start && prev[1] === end) return prev;
                return [start, end];
            });
        }
    }, [timelineData]);

    // Lightbox 逻辑
    const openLightbox = (itemId: number, index: number = 0) => {
        setLightboxState({ itemId, imgIndex: index });
    };

    const closeLightbox = () => {
        setLightboxState(null);
    };

    const navigateLightbox = useCallback((direction: 'prev' | 'next') => {
        if (!lightboxState) return;
        const item = timelineData.find(t => t.id === lightboxState.itemId);
        if (!item || item.images.length <= 1) return;
        let newIndex = lightboxState.imgIndex + (direction === 'next' ? 1 : -1);
        if (newIndex < 0) newIndex = item.images.length - 1;
        if (newIndex >= item.images.length) newIndex = 0;
        setLightboxState({ ...lightboxState, imgIndex: newIndex });
    }, [lightboxState, timelineData]);

    // 键盘支持
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!lightboxState) return;
            if (e.key === 'Escape') closeLightbox();
            if (e.key === 'ArrowLeft') navigateLightbox('prev');
            if (e.key === 'ArrowRight') navigateLightbox('next');
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [lightboxState, navigateLightbox]);

    // 获取当前 Lightbox 显示的数据
    const activeLightboxItem = lightboxState ? timelineData.find(t => t.id === lightboxState.itemId) : null;
    const activeImageSrc = activeLightboxItem ? activeLightboxItem.images[lightboxState!.imgIndex] : '';

    return (
        <>
            <motion.div
                layout
                transition={{ type: "spring", stiffness: 100, damping: 22, mass: 1.2 }}
                onClick={!isActive ? onToggle : undefined}
                className={`
                    fixed flex flex-col overflow-hidden
                    backdrop-blur-3xl
                    border border-white/40
                    rounded-[2rem]
                    shadow-[0_8px_32px_0_rgba(31,38,135,0.15)]
                    group transition-[shadow,background-color] duration-300
                    ${isActive
                        ? 'z-50 top-[10vh] left-[5vw] right-[5vw] h-[80vh] md:left-[calc(50%-425px)] md:w-[900px] md:right-auto ring-1 ring-white/50 bg-white/10'
                        : 'z-30 top-[4%] right-[2.5%] w-[360px] h-[280px] cursor-pointer hover:shadow-[0_20px_50px_rgba(8,112,184,0.2)] bg-white/5'
                    }
                `}
            >
                {/* 背景层 */}
                <div className="absolute inset-0 bg-linear-to-br from-blue-100/40 via-purple-100/40 to-emerald-100/40 animate-aurora opacity-60 z-0" />
                <div className="absolute inset-0 bg-linear-to-tr from-white/10 via-white/40 to-transparent opacity-50 z-0 pointer-events-none" />
                <div className="absolute inset-0 opacity-[0.08] z-0 pointer-events-none mix-blend-overlay"
                    style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}
                />

                {/* 年份水印 */}
                <motion.div layout className={`absolute font-black text-slate-900/4 pointer-events-none select-none z-0 tracking-tighter ${isActive ? 'top-4 right-8 text-8xl' : 'top-2 right-4 text-6xl'}`}>
                    {currentYear}
                </motion.div>

                {/* 顶部标题栏 */}
                <div className="px-5 py-3 border-b border-white/30 flex items-center justify-between relative z-10 shrink-0 bg-white/10">
                    <div className="flex items-center gap-3">
                        <GitCommit size={20} className="text-slate-400" />
                        <span className="text-[14px] font-mono font-bold text-slate-600 tracking-[0.2em] uppercase drop-shadow-sm">
                            时间线//Timeline
                        </span>
                        {/* 日期跳转按钮 - 仅在展开态显示 */}
                        {isActive && timelineData.length > 0 && (
                            <div className="relative ml-3">
                                <button
                                    ref={calendarBtnRef}
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setCalendarOpen(!calendarOpen);
                                    }}
                                    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-mono font-bold transition-all ${
                                        calendarOpen
                                            ? 'border-blue-300 bg-blue-50 text-blue-600'
                                            : 'border-white/50 bg-white/30 text-slate-500 hover:border-white/70 hover:bg-white/50'
                                    }`}
                                >
                                    <Calendar size={12} />
                                    {calendarYear}.{String(calendarMonth + 1).padStart(2, '0')}
                                </button>
                                {calendarOpen && createPortal(
                                    <>
                                        <div className="fixed inset-0 z-40" onClick={(e) => { e.stopPropagation(); setCalendarOpen(false); }} />
                                        <div className="fixed z-50 rounded-2xl border border-white/80 bg-white/95 backdrop-blur-xl shadow-xl p-4 w-[260px]" style={{ top: calendarBtnRef.current ? calendarBtnRef.current.getBoundingClientRect().bottom + 8 : '50%', left: calendarBtnRef.current ? calendarBtnRef.current.getBoundingClientRect().left : '50%' }} onClick={(e) => e.stopPropagation()}>
                                            {/* 月份导航 */}
                                            <div className="flex items-center justify-between mb-3">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        if (calendarMonth === 0) {
                                                            setCalendarMonth(11);
                                                            setCalendarYear((y) => y - 1);
                                                        } else {
                                                            setCalendarMonth((m) => m - 1);
                                                        }
                                                    }}
                                                    className="p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                                                >
                                                    <ChevronLeft size={16} />
                                                </button>
                                                <span className="text-sm font-bold text-slate-700 tracking-tight">
                                                    {calendarYear}年 {calendarMonth + 1}月
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        if (calendarMonth === 11) {
                                                            setCalendarMonth(0);
                                                            setCalendarYear((y) => y + 1);
                                                        } else {
                                                            setCalendarMonth((m) => m + 1);
                                                        }
                                                    }}
                                                    className="p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                                                >
                                                    <ChevronRight size={16} />
                                                </button>
                                            </div>
                                            {/* 星期标头 */}
                                            <div className="grid grid-cols-7 mb-1">
                                                {WEEKDAYS.map((w) => (
                                                    <div key={w} className="text-center text-[10px] font-bold text-slate-400 py-1">{w}</div>
                                                ))}
                                            </div>
                                            {/* 日期网格 */}
                                            <div className="grid grid-cols-7 gap-0.5">
                                                {calendarGrid.map((cell, i) => (
                                                    <button
                                                        key={i}
                                                        type="button"
                                                        disabled={!cell.day || !cell.hasRecord}
                                                        onClick={() => cell.day && jumpToDate(cell.day)}
                                                        className={`h-9 rounded-lg text-[12px] font-semibold transition-all relative flex items-center justify-center
                                                            ${!cell.day ? '' : cell.hasRecord
                                                                ? 'text-slate-700 hover:bg-blue-100 hover:text-blue-600 cursor-pointer'
                                                                : 'text-slate-300 cursor-default'
                                                            }
                                                            ${cell.isToday ? 'ring-2 ring-blue-400 font-bold' : ''}
                                                        `}
                                                    >
                                                        {cell.day}
                                                        {cell.hasRecord && (
                                                            <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-blue-400" />
                                                        )}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </>,
                                    document.body
                                )}
                            </div>
                        )}
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); onToggle(); }} className="p-1 rounded-full hover:bg-white/40 text-slate-500 transition-colors">
                        <div className="flex gap-1">
                            <div className={`w-1.5 h-1.5 rounded-full shadow-sm ${isActive ? 'bg-slate-400 scale-125' : 'bg-blue-400'}`} />
                            <div className={`w-1.5 h-1.5 rounded-full shadow-sm ${isActive ? 'bg-slate-400 scale-125' : 'bg-rose-400'}`} />
                            <div className={`w-1.5 h-1.5 rounded-full shadow-sm ${isActive ? 'bg-slate-400 scale-125' : 'bg-emerald-400'}`} />
                        </div>
                    </button>
                </div>

                {/* 内容区域 */}
                <div className="relative p-5 flex-1 overflow-hidden z-10">
                    {/* 1. 折叠态 */}
                    {!isActive && (
                        <div className="relative h-full overflow-y-auto overflow-x-hidden custom-scrollbar pr-2">
                            <div className="relative min-h-full pb-16">
                                <div className="absolute top-0 bottom-0 left-[66px] w-px bg-slate-400/30 z-0" />
                                <div className="relative space-y-4">
                                    {timelineData.map((item, index) => {
                                        const isLastInYear = index === timelineData.length - 1 || getYear(item.date) !== getYear(timelineData[index + 1].date);
                                        const itemYear = getYear(item.date);
                                        const ItemIcon = item.icon;

                                        return (
                                            <React.Fragment key={item.id}>
                                                <motion.div
                                                    initial={{ opacity: 0, x: 20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: index * 0.1 }}
                                                    className="relative flex items-start gap-4 group/item cursor-default"
                                                >
                                                    <span className="text-[16px] font-mono font-bold text-slate-500 w-[45px] text-right shrink-0 pt-1 tracking-tight">{getDate(item.date)}</span>
                                                    <div className="relative flex flex-col items-center pt-2.5">
                                                        <div className={`relative z-10 w-2.5 h-2.5 rounded-full ${item.color} ring-4 ring-white/60 shadow-lg group-hover/item:scale-125 transition-transform`} />
                                                    </div>
                                                    <div className="flex-1 px-3 py-2 rounded-xl bg-white/40 border border-white/50 hover:bg-white/80 hover:shadow-lg hover:border-white transition-all -mt-1 backdrop-blur-sm">
                                                        <div className="flex justify-between items-start">
                                                            <span className="text-base font-bold text-slate-800 leading-tight">{item.title}</span>
                                                            <ItemIcon size={16} className="text-slate-400 mt-1" />
                                                        </div>
                                                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mt-1 opacity-70">{item.type}</span>
                                                    </div>
                                                </motion.div>
                                                {isLastInYear && (
                                                    <div className="flex items-center gap-4 py-4 opacity-50">
                                                        <div className="h-px w-16 bg-slate-400/50" />
                                                        <span className="text-sm font-black text-slate-500 tracking-tighter">{itemYear}</span>
                                                        <div className="h-px flex-1 bg-slate-400/50" />
                                                    </div>
                                                )}
                                            </React.Fragment>
                                        );
                                    })}
                                    {timelineData.length === 0 && <div className="p-4 text-center text-slate-400 text-xs font-mono">Loading Timeline...</div>}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 2. 展开态 */}
                    {isActive && (
                        <div
                            ref={scrollContainerRef}
                            className="relative h-full overflow-y-auto overflow-x-hidden custom-scrollbar pr-2"
                            onScroll={handleScroll}
                        >
                            <div className="relative min-h-full pb-20">
                                {/* 三色轨道线 */}
                                <div className="absolute top-0 bottom-0 left-0 right-0 flex justify-between px-30 pointer-events-none opacity-20">
                                    <div className="w-0.5 h-full bg-blue-500 blur-[1px]" />
                                    <div className="w-0.5 h-full bg-rose-500 blur-[1px]" />
                                    <div className="w-0.5 h-full bg-emerald-500 blur-[1px]" />
                                </div>

                                <div className="sticky top-0 z-20 flex justify-between px-20 py-2 bg-white/40 backdrop-blur-md border-b border-white/30 mb-6 text-[20px] font-black text-slate-500/80 tracking-widest uppercase shadow-sm">
                                    <span className="w-20 text-center text-blue-600/80">知识</span>
                                    <span className="w-20 text-center text-rose-600/80">生活</span>
                                    <span className="w-20 text-center text-emerald-600/80">艺体</span>
                                </div>

                                <div className="space-y-8 relative px-4 pb-12">
                                    {timelineData.map((item, index) => {
                                        const isLastInYear = index === timelineData.length - 1 || getYear(item.date) !== getYear(timelineData[index + 1].date);
                                        const itemYear = getYear(item.date);
                                        const isInRange = index >= visibleRange[0] && index <= visibleRange[1];

                                        return (
                                            <React.Fragment key={item.id}>
                                                <div
                                                    ref={(el) => {
                                                        if (el) itemRefs.current.set(item.id, el);
                                                        else itemRefs.current.delete(item.id);
                                                    }}
                                                    className="flex flex-col w-full items-center"
                                                >
                                                    <div className={`
                                                        relative flex flex-col items-center text-center max-w-[200px] transition-transform duration-500
                                                        ${item.type === 'knowledge' ? '-translate-x-[297px]' : ''}
                                                        ${item.type === 'social' ? '' : ''}
                                                        ${item.type === 'arts' ? 'translate-x-[297px]' : ''}
                                                    `}>
                                                        <div className={`w-3 h-3 rounded-full border-2 border-white shadow-sm mb-2 ${item.color} z-10`} />

                                                        <div className={`
                                                            p-3 rounded-xl bg-white/60 backdrop-blur-md border border-white/60 shadow-sm hover:shadow-md transition-all hover:bg-white w-full
                                                            ${item.type === 'social' ? 'rounded-t-none' : ''}
                                                        `}>
                                                            <div className="text-[16px] font-mono text-slate-500 mb-1">{getDate(item.date)}</div>
                                                            <div className="text-sm font-bold text-slate-800 leading-tight">{item.title}</div>

                                                            {/* 封面图片展示（懒加载） */}
                                                            {item.images && item.images.length > 0 && isInRange && (
                                                                <div
                                                                    className="mt-3 relative w-full cursor-zoom-in"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        openLightbox(item.id, 0);
                                                                    }}
                                                                >
                                                                    <LazyImage src={item.images[0]} alt={item.title} className="group/img" />
                                                                    {/* 多图计数 Badge */}
                                                                    {item.images.length > 1 && (
                                                                        <div className="absolute top-1.5 right-1.5 bg-black/50 backdrop-blur-md text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5 border border-white/20 z-10">
                                                                            <ImageIcon size={8} /> +{item.images.length - 1}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                                {isLastInYear && (
                                                    <div className="flex items-center gap-4 py-6 opacity-40 w-full max-w-[800px] mx-auto">
                                                        <div className="h-px flex-1 bg-linear-to-r from-transparent to-slate-400" />
                                                        <span className="text-xl font-black text-slate-400 tracking-tighter italic">{itemYear}</span>
                                                        <div className="h-px flex-1 bg-linear-to-l from-transparent to-slate-400" />
                                                    </div>
                                                )}
                                            </React.Fragment>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </motion.div>

            {/* === 全屏 Lightbox === */}
            <AnimatePresence>
                {lightboxState && activeLightboxItem && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-100 bg-black/90 backdrop-blur-xl flex items-center justify-center p-4 md:p-10"
                        onClick={closeLightbox}
                    >
                        <button
                            className="absolute top-6 right-6 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
                            onClick={closeLightbox}
                        >
                            <X size={24} />
                        </button>

                        <div className="relative w-full max-w-5xl h-full flex flex-col items-center justify-center" onClick={e => e.stopPropagation()}>
                            <motion.img
                                key={activeImageSrc}
                                src={activeImageSrc}
                                alt="Gallery"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ type: "spring", stiffness: 200, damping: 20 }}
                                className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
                            />

                            <div className="mt-4 text-center">
                                <h3 className="text-white font-bold text-lg">{activeLightboxItem.title}</h3>
                                <p className="text-white/50 text-sm font-mono mt-1">
                                    {lightboxState.imgIndex + 1} / {activeLightboxItem.images.length}
                                </p>
                            </div>

                            {activeLightboxItem.images.length > 1 && (
                                <>
                                    <button
                                        className="absolute left-0 top-1/2 -translate-y-1/2 p-3 bg-black/50 hover:bg-white/20 text-white rounded-r-xl backdrop-blur-sm transition-all"
                                        onClick={(e) => { e.stopPropagation(); navigateLightbox('prev'); }}
                                    >
                                        <ChevronLeft size={32} />
                                    </button>
                                    <button
                                        className="absolute right-0 top-1/2 -translate-y-1/2 p-3 bg-black/50 hover:bg-white/20 text-white rounded-l-xl backdrop-blur-sm transition-all"
                                        onClick={(e) => { e.stopPropagation(); navigateLightbox('next'); }}
                                    >
                                        <ChevronRight size={32} />
                                    </button>
                                </>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
