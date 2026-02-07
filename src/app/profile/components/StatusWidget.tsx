"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, X, BookOpen, Heart, Brain, ChevronLeft, ChevronRight, Zap, Target, Smile, Users, Clock } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';

interface StatusWidgetProps {
    isActive: boolean;
    isIdle: boolean;
    onToggle: () => void;
}

type TabType = 'learning' | 'body' | 'mind';
const TAB_ORDER: TabType[] = ['learning', 'body', 'mind'];

// === 类型定义 ===
interface StatusItem {
    id: number;
    label: string;
    isActive: boolean;
    category?: string; // from DB
    sort_order?: number;
}

interface StatusCategory {
    id: string; // matches DB 'category' column
    title: string;
    subtitle: string;
    items: StatusItem[];
    icon: any;
    color: string;
    quote: string;
}

// === Initial Configuration (Skeleton) ===
// We keep the structure but items will be populated from DB
const INITIAL_DATA_STRUCTURE: Record<TabType, StatusCategory[]> = {
    learning: [
        {
            id: 'knowledge',
            title: 'Knowledge Exploration',
            subtitle: '知识探索',
            items: [],
            icon: BookOpen,
            color: 'text-blue-600 border-blue-200 bg-blue-50',
            quote: '想想那些不断努力的人，始终有无数知识等着我们'
        },
        {
            id: 'focus',
            title: 'Persistence & Focus',
            subtitle: '坚持专注',
            items: [],
            icon: Clock,
            color: 'text-indigo-600 border-indigo-200 bg-indigo-50',
            quote: '跑1km和跑10km是完全不一样的，但达成目标之前都一样'
        },
        {
            id: 'goals',
            title: 'Long-term Goals',
            subtitle: '长期目标',
            items: [],
            icon: Target,
            color: 'text-sky-600 border-sky-200 bg-sky-50',
            quote: '人无远虑，必有近忧'
        }
    ],
    body: [
        {
            id: 'health',
            title: 'Physical Health',
            subtitle: '身体健康',
            items: [],
            icon: Activity,
            color: 'text-emerald-600 border-emerald-200 bg-emerald-50',
            quote: '充足的休息，健康的精神，最好的状态'
        },
        {
            id: 'exercise',
            title: 'Exercise',
            subtitle: '运动锻炼',
            items: [],
            icon: Zap,
            color: 'text-green-600 border-green-200 bg-green-50',
            quote: '体验户外的空气，感受自己的汗水'
        },
        {
            id: 'diet',
            title: 'Diet & Routine',
            subtitle: '饮食起居',
            items: [],
            icon: Clock,
            color: 'text-teal-600 border-teal-200 bg-teal-50',
            quote: '体态仪表，环境氛围，都是自律的体现'
        }
    ],
    mind: [
        {
            id: 'emotion',
            title: 'Emotional Anchor',
            subtitle: '情感寄托',
            items: [],
            icon: Heart,
            color: 'text-rose-600 border-rose-200 bg-rose-50',
            quote: '沉入情绪当中！'
        },
        {
            id: 'social',
            title: 'Social Interaction',
            subtitle: '人际交流',
            items: [],
            icon: Users,
            color: 'text-pink-600 border-pink-200 bg-pink-50',
            quote: '只有在交流与沟通中才能真正成长'
        },
        {
            id: 'control',
            title: 'Emotional Control',
            subtitle: '情绪控制',
            items: [],
            icon: Brain,
            color: 'text-purple-600 border-purple-200 bg-purple-50',
            quote: '后悔、愤怒、绝望、颓废，外界的一切都不应该影响你自己'
        }
    ]
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
                // Merge DB data into our structure safely
                setStatusData(_prev => {
                    // Create a deep-ish copy by mapping, preserving the icon component references
                    const newData: Record<TabType, StatusCategory[]> = {
                        learning: INITIAL_DATA_STRUCTURE.learning.map(cat => ({ ...cat, items: [] })),
                        body: INITIAL_DATA_STRUCTURE.body.map(cat => ({ ...cat, items: [] })),
                        mind: INITIAL_DATA_STRUCTURE.mind.map(cat => ({ ...cat, items: [] }))
                    };

                    data.forEach((item: any) => {
                        const domain = item.domain as TabType;
                        const catId = item.category;

                        // Find the right category array
                        const domainCategories = newData[domain];
                        if (domainCategories) {
                            const category = domainCategories.find((c: StatusCategory) => c.id === catId);
                            if (category) {
                                category.items.push({
                                    id: item.id,
                                    label: item.label,
                                    isActive: item.is_active,
                                    sort_order: item.sort_order
                                });
                            }
                        }
                    });
                    return newData;
                });
                setHasLoaded(true);
            }
            if (error) {
                console.error("Failed to load status items:", error);
            }
        };

        if (isActive || !hasLoaded) {
            fetchData();
        }
    }, [isActive, hasLoaded]);

    // 如果既不是 active 也不是 idle（即其他模块打开了），则隐藏
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
        let newStatus = false;

        // 1. Optimistic Update
        setStatusData(prev => {
            const newData = { ...prev };
            const cats = [...newData[tab]];
            const cat = { ...cats[catIndex] };
            const items = cat.items.map(item => {
                if (item.id === itemId) {
                    newStatus = !item.isActive;
                    return { ...item, isActive: newStatus };
                }
                return item;
            });
            cat.items = items;
            cats[catIndex] = cat;
            newData[tab] = cats;
            return newData;
        });

        // 2. DB Update
        const { error } = await supabase
            .from('profile_status_items')
            .update({ is_active: newStatus })
            .eq('id', itemId);

        if (error) {
            toast.error("Update failed");
            // Revert logic could go here
        }
    };

    return (
        <>
            {/* 1. Idle Container */}
            {!isActive && isIdle && (
                <motion.div
                    onClick={onToggle}
                    layoutId="status-idle-pill-real"
                    className="relative z-40 cursor-pointer pointer-events-auto"
                >
                    <div className="flex items-center gap-4 bg-white/70 backdrop-blur-md px-6 py-2 rounded-full border border-slate-200 shadow-lg shadow-slate-200/50 hover:bg-white/90 transition-colors">
                        <div className="flex gap-2">
                            <div className="w-2 h-2 rounded-full bg-slate-300" />
                            <div className="w-2 h-2 rounded-full bg-slate-300" />
                            <div className={`w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)] animate-pulse`} />
                        </div>
                        <div className="w-px h-3 bg-slate-300" />
                        <span className="text-xs font-mono text-slate-500 tracking-widest uppercase whitespace-nowrap">
                            Status: <span className="text-blue-600 font-semibold">Daylight</span>
                        </span>
                    </div>
                </motion.div>
            )}

            {/* 2. Expanded Container (Portal-like root level) */}
            <AnimatePresence>
                {isActive && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
                        <motion.div
                            initial={{ y: -600, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: -600, opacity: 0 }}
                            transition={{
                                type: "spring",
                                stiffness: 80,
                                damping: 15,
                                mass: 1.1
                            }}
                            className="w-[90vw] md:w-[1000px] h-auto md:h-[800px] bg-white/90 backdrop-blur-xl rounded-2xl border border-white/60 shadow-2xl overflow-hidden pointer-events-auto flex flex-col relative"
                        >
                            {/* --- Header Area --- */}
                            <div className="flex items-center justify-between px-8 py-6 border-b border-slate-100/80 shrink-0">
                                <div className="flex items-center gap-3">
                                    <Activity size={20} className="text-slate-400" />
                                    <h3 className="font-mono font-bold text-slate-500 tracking-[0.2em] uppercase">Status Check</h3>
                                </div>

                                {/* Center Tabs */}
                                <div className="absolute left-1/2 -translate-x-1/2 bg-slate-100/50 p-1 rounded-full flex gap-1 items-center">
                                    <button
                                        onClick={() => setActiveTab('learning')}
                                        className={`px-6 py-1.5 rounded-full text-xs font-bold transition-all duration-300 tracking-wider ${activeTab === 'learning' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                    >
                                        学习
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('body')}
                                        className={`px-6 py-1.5 rounded-full text-xs font-bold transition-all duration-300 tracking-wider ${activeTab === 'body' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                    >
                                        身体
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('mind')}
                                        className={`px-6 py-1.5 rounded-full text-xs font-bold transition-all duration-300 tracking-wider ${activeTab === 'mind' ? 'bg-white text-purple-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                    >
                                        心绪
                                    </button>
                                </div>

                                <button
                                    onClick={(e) => { e.stopPropagation(); onToggle(); }}
                                    className="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {/* --- Main Content Area --- */}
                            <div className="flex-1 relative flex bg-slate-50/30">
                                {/* Left Nav Button */}
                                <button
                                    onClick={handlePrevTab}
                                    className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/50 border border-slate-100 shadow-sm text-slate-400 hover:text-blue-500 hover:scale-110 hover:bg-white transition-all z-20"
                                >
                                    <ChevronLeft size={24} />
                                </button>

                                {/* Right Nav Button */}
                                <button
                                    onClick={handleNextTab}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/50 border border-slate-100 shadow-sm text-slate-400 hover:text-blue-500 hover:scale-110 hover:bg-white transition-all z-20"
                                >
                                    <ChevronRight size={24} />
                                </button>

                                {/* Content Switcher */}
                                <div className="flex-1 p-8 md:p-12 overflow-y-auto custom-scrollbar">
                                    <AnimatePresence mode="wait">
                                        <motion.div
                                            key={activeTab}
                                            initial={{ opacity: 0, scale: 0.98 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.98 }}
                                            transition={{ duration: 0.3 }}
                                            className="h-full grid grid-cols-1 md:grid-cols-3 gap-6"
                                        >
                                            {statusData[activeTab].map((category: StatusCategory, catIndex: number) => (
                                                <div
                                                    key={category.id}
                                                    className="flex flex-col bg-white/60 rounded-2xl border border-white/60 shadow-sm p-1"
                                                >
                                                    {/* Column Header */}
                                                    <div className={`p-4 rounded-xl mb-2 flex flex-col items-center text-center ${category.color.replace('text-', 'bg-').replace('600', '50')} border-b border-dashed ${category.color.replace('text-', 'border-').replace('600', '200')}`}>
                                                        <category.icon size={24} className={`mb-2 ${category.color.split(' ')[0]}`} />
                                                        <h4 className="text-lg font-black text-slate-700">{category.subtitle}</h4>
                                                        <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">{category.title}</span>
                                                    </div>

                                                    {/* Items List */}
                                                    <div className="flex-1 p-2 space-y-2 overflow-y-auto custom-scroll-mini mb-4">
                                                        {category.items.length === 0 ? (
                                                            <div className="flex flex-col items-center justify-center p-8 text-slate-300 opacity-50">
                                                                <span className="text-xs font-mono uppercase tracking-widest">No Items</span>
                                                            </div>
                                                        ) : (
                                                            category.items.map((item: StatusItem) => (
                                                                <motion.button
                                                                    key={item.id}
                                                                    layout
                                                                    onClick={() => toggleItem(activeTab, catIndex, item.id)}
                                                                    whileHover={{ scale: 1.02 }}
                                                                    whileTap={{ scale: 0.98 }}
                                                                    className={`
                                                                        w-full p-3 rounded-xl border flex items-center justify-between group transition-all duration-300
                                                                        ${item.isActive
                                                                            ? `${category.color.replace('text-', 'bg-').replace('600', '50')} ${category.color.split(' ')[1]} shadow-sm`
                                                                            : 'bg-white/40 border-slate-100 text-slate-400 hover:bg-white hover:border-slate-200'
                                                                        }
                                                                    `}
                                                                >
                                                                    <span className={`text-sm font-bold tracking-wide ${item.isActive ? 'text-slate-700' : 'text-slate-400 line-through decoration-slate-300'}`}>
                                                                        {item.label}
                                                                    </span>

                                                                    {/* Status Indicator Dot */}
                                                                    <div className={`
                                                                        w-2.5 h-2.5 rounded-full transition-all duration-500
                                                                        ${item.isActive
                                                                            ? `${category.color.split(' ')[0].replace('text-', 'bg-')} shadow-[0_0_8px_currentColor]`
                                                                            : 'bg-slate-200'
                                                                        }
                                                                    `} />
                                                                </motion.button>
                                                            ))
                                                        )}
                                                    </div>

                                                    {/* Quote Footer - Hardcoded Theme Reminder */}
                                                    <div className="mt-auto pt-4 pb-2 text-center">
                                                        <p className="text-xs font-serif italic text-slate-400/80 tracking-widest">{category.quote}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </motion.div>
                                    </AnimatePresence>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="px-8 py-4 border-t border-slate-100/50 flex items-center justify-between text-[10px] font-mono text-slate-300 uppercase shrink-0 bg-white/50">
                                <span>ID: 29FF-76F1-1096</span>
                                <span>Active Mode: {activeTab.toUpperCase()}</span>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
}
