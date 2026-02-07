"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, X, BookOpen, Heart, Brain, ChevronLeft, ChevronRight, Zap, Target, Smile, Users, Clock } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';

// === 可调参数 (Adjustable Parameters) ===
const GLOW_BORDER_WIDTH = "border-[3px]";
const GLOW_RING_WIDTH = "ring-4";
const GLOW_INTENSITY = "shadow-[0_0_40px_rgba(0,0,0,0.15)]";
const GLOW_SCALE = 1.03;

interface StatusWidgetProps {
    isActive: boolean;
    isIdle: boolean;
    onToggle: () => void;
}

type TabType = 'learning' | 'body' | 'mind';
const TAB_ORDER: TabType[] = ['learning', 'body', 'mind'];

interface StatusItem {
    id: number;
    label: string;
    isActive: boolean;
    category?: string;
    sort_order?: number;
}

interface StatusCategory {
    id: string;
    title: string;
    subtitle: string;
    items: StatusItem[];
    icon: any;
    color: string;
    quote: string;
}

const INITIAL_DATA_STRUCTURE: Record<TabType, StatusCategory[]> = {
    learning: [
        { id: 'knowledge', title: 'Knowledge Exploration', subtitle: '知识探索', items: [], icon: BookOpen, color: 'blue', quote: '想想那些不断努力的人，始终有无数知识等着我们' },
        { id: 'focus', title: 'Persistence & Focus', subtitle: '坚持专注', items: [], icon: Clock, color: 'indigo', quote: '跑1km和跑10km是完全不一样的，但达成目标之前都一样' },
        { id: 'goals', title: 'Long-term Goals', subtitle: '长期目标', items: [], icon: Target, color: 'sky', quote: '人无远虑，必有近忧' }
    ],
    body: [
        { id: 'health', title: 'Physical Health', subtitle: '身体健康', items: [], icon: Activity, color: 'emerald', quote: '充足的休息，健康的精神，最好的状态' },
        { id: 'exercise', title: 'Exercise', subtitle: '运动锻炼', items: [], icon: Zap, color: 'green', quote: '体验户外的空气，感受自己的汗水' },
        { id: 'diet', title: 'Diet & Routine', subtitle: '饮食起居', items: [], icon: Clock, color: 'teal', quote: '体态仪表，环境氛围，都是自律的体现' }
    ],
    mind: [
        { id: 'emotion', title: 'Emotional Anchor', subtitle: '情感寄托', items: [], icon: Heart, color: 'rose', quote: '沉入情绪当中！' },
        { id: 'social', title: 'Social Interaction', subtitle: '人际交流', items: [], icon: Users, color: 'pink', quote: '只有在交流与沟通中才能真正成长' },
        { id: 'control', title: 'Emotional Control', subtitle: '情绪控制', items: [], icon: Brain, color: 'purple', quote: '后悔、愤怒、绝望、颓废，外界的一切都不应该影响你自己' }
    ]
};

const COLOR_CLASSES: Record<string, string> = {
    blue: "text-blue-600 border-blue-200 bg-blue-50",
    indigo: "text-indigo-600 border-indigo-200 bg-indigo-50",
    sky: "text-sky-600 border-sky-200 bg-sky-50",
    emerald: "text-emerald-600 border-emerald-200 bg-emerald-50",
    green: "text-green-600 border-green-200 bg-green-50",
    teal: "text-teal-600 border-teal-200 bg-teal-50",
    rose: "text-rose-600 border-rose-200 bg-rose-50",
    pink: "text-pink-600 border-pink-200 bg-pink-50",
    purple: "text-purple-600 border-purple-200 bg-purple-50",
};

const COMPLETION_GLOW_CLASSES: Record<string, string> = {
    blue: `border-blue-400 ring-blue-100/50 shadow-blue-500/20`,
    indigo: `border-indigo-400 ring-indigo-100/50 shadow-indigo-500/20`,
    sky: `border-sky-400 ring-sky-100/50 shadow-sky-500/20`,
    emerald: `border-emerald-400 ring-emerald-100/50 shadow-emerald-500/20`,
    green: `border-green-400 ring-green-100/50 shadow-green-500/20`,
    teal: `border-teal-400 ring-teal-100/50 shadow-teal-500/20`,
    rose: `border-rose-400 ring-rose-100/50 shadow-rose-500/20`,
    pink: `border-pink-400 ring-pink-100/50 shadow-pink-500/20`,
    purple: `border-purple-400 ring-purple-100/50 shadow-purple-500/20`,
};

const DOT_COLOR_CLASSES: Record<string, string> = {
    blue: "bg-blue-500 shadow-blue-400",
    indigo: "bg-indigo-500 shadow-indigo-400",
    sky: "bg-sky-500 shadow-sky-400",
    emerald: "bg-emerald-500 shadow-emerald-400",
    green: "bg-green-500 shadow-green-400",
    teal: "bg-teal-500 shadow-teal-400",
    rose: "bg-rose-500 shadow-rose-400",
    pink: "bg-pink-500 shadow-pink-400",
    purple: "bg-purple-500 shadow-purple-400",
};

const GRADIENT_OVERLAYS: Record<string, string> = {
    blue: "from-blue-100/30",
    indigo: "from-indigo-100/30",
    sky: "from-sky-100/30",
    emerald: "from-emerald-100/30",
    green: "from-green-100/30",
    teal: "from-teal-100/30",
    rose: "from-rose-100/30",
    pink: "from-pink-100/30",
    purple: "from-purple-100/30",
};

export default function StatusWidget({ isActive, isIdle, onToggle }: StatusWidgetProps) {
    const [activeTab, setActiveTab] = useState<TabType>('learning');
    const [statusData, setStatusData] = useState<Record<TabType, StatusCategory[]>>(INITIAL_DATA_STRUCTURE);
    const [hasLoaded, setHasLoaded] = useState(false);

    // Fetch Data from Supabase
    useEffect(() => {
        const fetchData = async () => {
            const { data, error } = await supabase
                .from('profile_status_items')
                .select('*')
                .order('sort_order', { ascending: true })
                .order('id', { ascending: true });

            if (data) {
                setStatusData(_prev => {
                    const newData: Record<TabType, StatusCategory[]> = {
                        learning: INITIAL_DATA_STRUCTURE.learning.map(cat => ({ ...cat, items: [] })),
                        body: INITIAL_DATA_STRUCTURE.body.map(cat => ({ ...cat, items: [] })),
                        mind: INITIAL_DATA_STRUCTURE.mind.map(cat => ({ ...cat, items: [] }))
                    };

                    data.forEach((item: any) => {
                        const domain = item.domain as TabType;
                        const catId = item.category;
                        const domainCategories = newData[domain];
                        if (domainCategories) {
                            const category = domainCategories.find((c: StatusCategory) => c.id === catId);
                            if (category) {
                                category.items.push({ id: item.id, label: item.label, isActive: item.is_active, sort_order: item.sort_order });
                            }
                        }
                    });
                    return newData;
                });
                setHasLoaded(true);
            }
            if (error) console.error("Failed to load status items:", error);
        };

        if (isActive || !hasLoaded) fetchData();
    }, [isActive, hasLoaded]);

    // --- Completion Statistics for Idle State ---
    const stats = useMemo(() => {
        const calculateStats = (tab: TabType) => {
            const categories = statusData[tab];
            let total = 0;
            let active = 0;
            categories.forEach(cat => {
                total += cat.items.length;
                active += cat.items.filter(i => i.isActive).length;
            });
            return total === 0 ? 0 : (active / total);
        };

        return {
            learning: calculateStats('learning'),
            body: calculateStats('body'),
            mind: calculateStats('mind')
        };
    }, [statusData]);

    const getDotStyle = (progress: number, baseColor: string) => {
        if (progress === 0) return "bg-slate-300 scale-90 opacity-50";

        // Grade 1: Very Dim (0-33%)
        if (progress <= 0.33) {
            if (baseColor === 'blue') return "bg-blue-500/20 scale-95";
            if (baseColor === 'green') return "bg-emerald-500/20 scale-95";
            return "bg-rose-500/20 scale-95";
        }

        // Grade 2: Solid but No Glow (33-66%)
        if (progress <= 0.66) {
            if (baseColor === 'blue') return "bg-blue-500/70 scale-100";
            if (baseColor === 'green') return "bg-emerald-500/70 scale-100";
            return "bg-rose-500/70 scale-100";
        }

        // Grade 3: Peak Intensity ( >66%)
        if (baseColor === 'blue') return "bg-blue-600 shadow-[0_0_10px_rgba(37,99,235,0.8)] scale-110 animate-pulse";
        if (baseColor === 'green') return "bg-emerald-600 shadow-[0_0_10px_rgba(5,150,105,0.8)] scale-110 animate-pulse";
        return "bg-rose-600 shadow-[0_0_10px_rgba(225,29,72,0.8)] scale-110 animate-pulse";
    };

    if (!isActive && !isIdle) return null;

    const handlePrevTab = () => {
        const currentIndex = TAB_ORDER.indexOf(activeTab);
        const prevIndex = (currentIndex - 1 + TAB_ORDER.length) % TAB_ORDER.length;
        setActiveTab(TAB_ORDER[prevIndex]);
    };

    const handleNextTab = () => {
        const currentIndex = TAB_ORDER.indexOf(activeTab);
        const nextIndex = (currentIndex + 1) % TAB_ORDER.length;
        setActiveTab(TAB_ORDER[nextIndex]);
    };

    const toggleItem = async (tab: TabType, catIndex: number, itemId: number) => {
        // Find the current status directly from the state
        const currentCategory = statusData[tab][catIndex];
        const currentItem = currentCategory.items.find(i => i.id === itemId);

        if (!currentItem) return;
        const newStatus = !currentItem.isActive;

        // 1. Update local state immediately for snappy UI
        setStatusData(prev => {
            const newData = { ...prev };
            const cats = [...newData[tab]];
            const cat = { ...cats[catIndex] };
            cat.items = cat.items.map(i => i.id === itemId ? { ...i, isActive: newStatus } : i);
            cats[catIndex] = cat;
            newData[tab] = cats;
            return newData;
        });

        // 2. Persist to database
        const { error } = await supabase
            .from('profile_status_items')
            .update({ is_active: newStatus })
            .eq('id', itemId);

        if (error) {
            toast.error("Update failed");
            // Optionally revert
            setStatusData(prev => {
                const newData = { ...prev };
                const cats = [...newData[tab]];
                const cat = { ...cats[catIndex] };
                cat.items = cat.items.map(i => i.id === itemId ? { ...i, isActive: !newStatus } : i);
                cats[catIndex] = cat;
                newData[tab] = cats;
                return newData;
            });
        }
    };

    return (
        <>
            {/* 1. Idle Pill Container */}
            {!isActive && isIdle && (
                <motion.div onClick={onToggle} layoutId="status-idle-pill-real" className="relative z-40 cursor-pointer pointer-events-auto">
                    <div className="flex items-center gap-4 bg-white/70 backdrop-blur-md px-6 py-2 rounded-full border border-slate-200 shadow-lg shadow-slate-200/50 hover:bg-white/90 transition-colors">
                        {/* Three Graded Dots */}
                        <div className="flex gap-2">
                            {/* Learning (Blue) */}
                            <div className={`w-2 h-2 rounded-full transition-all duration-500 ${getDotStyle(stats.learning, 'blue')}`}
                                title={`Learning: ${Math.round(stats.learning * 100)}%`} />
                            {/* Body (Green) */}
                            <div className={`w-2 h-2 rounded-full transition-all duration-500 ${getDotStyle(stats.body, 'green')}`}
                                title={`Body: ${Math.round(stats.body * 100)}%`} />
                            {/* Mind (Red) */}
                            <div className={`w-2 h-2 rounded-full transition-all duration-500 ${getDotStyle(stats.mind, 'red')}`}
                                title={`Mind: ${Math.round(stats.mind * 100)}%`} />
                        </div>
                        <div className="w-px h-3 bg-slate-200" />
                        <span className="text-xs font-mono text-slate-500 tracking-widest uppercase whitespace-nowrap">
                            Status: <span className="text-blue-600 font-semibold">Daylight</span>
                        </span>
                    </div>
                </motion.div>
            )}

            {/* 2. Expanded Dashboard Container */}
            <AnimatePresence>
                {isActive && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
                        <motion.div
                            initial={{ y: -600, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: -600, opacity: 0 }}
                            transition={{ type: "spring", stiffness: 80, damping: 15, mass: 1.1 }}
                            className="w-[90vw] md:w-[1000px] h-auto md:h-[800px] bg-white/90 backdrop-blur-xl rounded-2xl border border-white/60 shadow-2xl overflow-hidden pointer-events-auto flex flex-col relative"
                        >
                            {/* Dashboard Header */}
                            <div className="flex items-center justify-between px-8 py-6 border-b border-slate-100/80 shrink-0 bg-white/40">
                                <div className="flex items-center gap-3">
                                    <Activity size={20} className="text-slate-400 animate-pulse" />
                                    <h3 className="font-mono font-bold text-slate-500 tracking-[0.2em] uppercase">Status Check</h3>
                                </div>
                                <div className="absolute left-1/2 -translate-x-1/2 bg-slate-200/50 p-1.5 rounded-full flex gap-1 items-center">
                                    {['learning', 'body', 'mind'].map((tab) => (
                                        <button
                                            key={tab}
                                            onClick={() => setActiveTab(tab as TabType)}
                                            className={`px-7 py-2 rounded-full text-xs font-black transition-all duration-300 tracking-wider ${activeTab === tab ? 'bg-white text-slate-900 shadow-md scale-105' : 'text-slate-400 hover:text-slate-600'}`}
                                        >
                                            {tab === 'learning' ? '学习' : tab === 'body' ? '身体' : '心绪'}
                                        </button>
                                    ))}
                                </div>
                                <button onClick={onToggle} className="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-all hover:rotate-90">
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Main Content Area */}
                            <div className="flex-1 relative flex bg-slate-50/20">
                                <button onClick={handlePrevTab} className="absolute left-4 top-1/2 -translate-y-1/2 p-4 rounded-full bg-white/80 border border-slate-200 shadow-lg text-slate-400 hover:text-blue-500 hover:scale-110 transition-all z-20">
                                    <ChevronLeft size={28} />
                                </button>
                                <button onClick={handleNextTab} className="absolute right-4 top-1/2 -translate-y-1/2 p-4 rounded-full bg-white/80 border border-slate-200 shadow-lg text-slate-400 hover:text-blue-500 hover:scale-110 transition-all z-20">
                                    <ChevronRight size={28} />
                                </button>

                                <div className="flex-1 p-8 md:p-12 overflow-y-auto custom-scrollbar">
                                    <AnimatePresence mode="wait">
                                        <motion.div
                                            key={activeTab}
                                            initial={{ opacity: 0, scale: 0.97 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.97 }}
                                            transition={{ duration: 0.4 }}
                                            className="h-full grid grid-cols-1 md:grid-cols-3 gap-8"
                                        >
                                            {statusData[activeTab].map((category: StatusCategory, catIndex: number) => {
                                                const isAllActive = category.items.length > 0 && category.items.every(item => item.isActive);
                                                const colorKey = category.color;
                                                const baseColorClass = COLOR_CLASSES[colorKey] || "text-slate-600 border-slate-200 bg-slate-50";
                                                const completionGlow = COMPLETION_GLOW_CLASSES[colorKey] || "";

                                                return (
                                                    <motion.div
                                                        key={category.id}
                                                        animate={isAllActive ? {
                                                            scale: GLOW_SCALE,
                                                        } : { scale: 1 }}
                                                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                                        className={`
                                                            flex flex-col bg-white/70 rounded-[2rem] border transition-all duration-700 p-1 relative overflow-hidden group
                                                            ${isAllActive
                                                                ? `${GLOW_BORDER_WIDTH} ${GLOW_RING_WIDTH} ${GLOW_INTENSITY} ${completionGlow} saturate-[1.2] brightness-[1.02]`
                                                                : 'border-white/80 shadow-sm border'
                                                            }
                                                        `}
                                                    >
                                                        {isAllActive && (
                                                            <motion.div
                                                                initial={{ opacity: 0 }}
                                                                animate={{ opacity: 1 }}
                                                                className={`absolute inset-0 bg-linear-to-b ${GRADIENT_OVERLAYS[colorKey]} to-transparent pointer-events-none z-0`}
                                                            />
                                                        )}

                                                        {/* Category Header */}
                                                        <div className={`
                                                            p-5 rounded-2xl mb-2 flex flex-col items-center text-center border-b border-dashed z-10 transition-colors duration-500
                                                            ${baseColorClass.split(' ').filter(c => c.includes('bg-') || c.includes('border-')).join(' ')}
                                                            ${isAllActive ? 'bg-opacity-80' : 'bg-opacity-40'}
                                                        `}>
                                                            <category.icon size={28} className={`mb-2 ${baseColorClass.split(' ')[0]} ${isAllActive ? 'drop-shadow-md' : ''}`} />
                                                            <h4 className="text-xl font-black text-slate-800 tracking-tight">{category.subtitle}</h4>
                                                            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-[0.2em]">{category.title}</span>
                                                        </div>

                                                        {/* Items List */}
                                                        <div className="flex-1 p-3 space-y-3 overflow-y-auto custom-scroll-mini mb-6 z-10">
                                                            {category.items.length === 0 ? (
                                                                <div className="flex flex-col items-center justify-center p-12 text-slate-300 opacity-50 uppercase text-[10px] font-bold tracking-widest">NO ENTRIES</div>
                                                            ) : (
                                                                category.items.map((item: StatusItem) => (
                                                                    <motion.button
                                                                        key={item.id}
                                                                        onClick={() => toggleItem(activeTab, catIndex, item.id)}
                                                                        whileHover={{ scale: 1.03, x: 2 }}
                                                                        whileTap={{ scale: 0.97 }}
                                                                        className={`
                                                                            w-full p-4 rounded-2xl border flex items-center justify-between group transition-all duration-300
                                                                            ${item.isActive
                                                                                ? `${baseColorClass.split(' ').filter(c => c.includes('bg-') || c.includes('border-')).join(' ')} shadow-md border-opacity-50`
                                                                                : 'bg-white/40 border-slate-100 text-slate-400 hover:bg-white hover:border-slate-300'
                                                                            }
                                                                        `}
                                                                    >
                                                                        <span className={`text-[15px] font-bold tracking-tight ${item.isActive ? 'text-slate-800' : 'text-slate-400 line-through decoration-slate-300 opacity-60'}`}>
                                                                            {item.label}
                                                                        </span>
                                                                        <div className={`
                                                                            w-3 h-3 rounded-full transition-all duration-500
                                                                            ${item.isActive
                                                                                ? `${DOT_COLOR_CLASSES[colorKey]} ring-4 ring-white shadow-xl`
                                                                                : 'bg-slate-200'
                                                                            }
                                                                        `} />
                                                                    </motion.button>
                                                                ))
                                                            )}
                                                        </div>

                                                        <div className="mt-auto pt-4 pb-6 text-center px-6 z-10">
                                                            <p className={`text-[11px] font-serif italic tracking-widest leading-relaxed transition-all duration-500 ${isAllActive ? 'text-slate-900 font-black scale-105' : 'text-slate-400/70'}`}>
                                                                “{category.quote}”
                                                            </p>
                                                        </div>
                                                    </motion.div>
                                                );
                                            })}
                                        </motion.div>
                                    </AnimatePresence>
                                </div>
                            </div>

                            <div className="px-10 py-4 border-t border-slate-100 flex items-center justify-between text-[11px] font-mono text-slate-400 uppercase bg-white/60">
                                <div className="flex gap-6">
                                    <span className="flex items-center gap-2 font-black"><div className="w-2 h-2 rounded-full bg-blue-500 shadow-blue-400 animate-pulse" /> SYSTEM READY</span>
                                    <span>OPERATOR: AOKESEM</span>
                                </div>
                                <div className="flex gap-4 items-center">
                                    <span className="opacity-50">#29FF-76F1</span>
                                    <div className="w-px h-3 bg-slate-300" />
                                    <span className="text-slate-600 font-bold">MODE: {activeTab}</span>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
}
