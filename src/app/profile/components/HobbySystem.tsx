"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Cpu, Zap, Library, Ghost, Maximize2, Minimize2, ChevronDown, ChevronRight } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient'; // [新增]

// === 数据定义 ===
type Category = 'knowledge' | 'sports' | 'arts' | 'acgn';

// 1. 数据库数据接口
interface HobbyItem {
    id: number;
    category: string; // 数据库取回来是 string
    name: string;
    description: string;
    level: number;
}

// 2. 纯 UI 配置 (保留图标和颜色配置，不存具体数据)
const CATEGORY_UI_CONFIG: Record<Category, { label: string; icon: any; color: string; bg: string; activeColor: string }> = {
    knowledge: {
        label: "知识",
        icon: Cpu,
        color: "text-blue-600",
        bg: "bg-blue-50",
        activeColor: "bg-blue-500",
    },
    sports: {
        label: "运动",
        icon: Zap,
        color: "text-red-600",
        bg: "bg-red-50",
        activeColor: "bg-red-500",
    },
    arts: {
        label: "文艺",
        icon: Library,
        color: "text-emerald-600",
        bg: "bg-emerald-50",
        activeColor: "bg-emerald-500",
    },
    acgn: {
        label: "ACGN",
        icon: Ghost,
        color: "text-pink-400",
        bg: "bg-pink-50",
        activeColor: "bg-pink-500",
    }
};

interface HobbySystemProps {
    isActive: boolean;
    onToggle: () => void;
}

// 指示灯组件
const LevelIndicator = ({ level, activeColor }: { level: number, activeColor: string }) => (
    <div className="flex gap-1">
        {[1, 2, 3, 4].map((i) => (
            <div
                key={i}
                className={`h-2.5 w-1.5 rounded-sm transition-all duration-500 ${i <= level ? activeColor : 'bg-slate-200'}`}
            />
        ))}
    </div>
);

export default function HobbySystem({ isActive, onToggle }: HobbySystemProps) {
    const [expandedKeys, setExpandedKeys] = useState<Category[]>([]);
    // [新增] 存储所有爱好数据
    const [allHobbies, setAllHobbies] = useState<HobbyItem[]>([]);

    // [新增] 获取数据
    useEffect(() => {
        const fetchHobbies = async () => {
            const { data, error } = await supabase
                .from('profile_hobbies')
                .select('*')
                .order('id', { ascending: true }); // 或按 level 排序

            if (data) {
                setAllHobbies(data as HobbyItem[]);
            }
        };
        fetchHobbies();
    }, []);

    const handleCategoryClick = (key: Category, e: React.MouseEvent) => {
        e.stopPropagation();
        setExpandedKeys(prev =>
            prev.includes(key)
                ? prev.filter(k => k !== key)
                : [...prev, key]
        );
    };

    return (
        <motion.div
            layout
            transition={{
                type: "spring",
                stiffness: 100,
                damping: 20,
                mass: 1.2
            }}
            onClick={!isActive ? onToggle : undefined}
            className={`
        flex flex-col overflow-hidden backdrop-blur-3xl
        bg-white/70 
        shadow-[
            0_20px_50px_-12px_rgba(0,0,0,0.1),
            inset_0_0_0_1px_rgba(255,255,255,0.6),
            inset_0_1px_0_0_rgba(255,255,255,0.9),
            inset_0_-4px_4px_-2px_rgba(0,0,0,0.05)
        ]
        rounded-3xl
        fixed transition-all duration-500 ease-[cubic-bezier(0.25,0.1,0.25,1)]
        ${isActive
                    ? 'z-50 top-[10vh] left-[5vw] w-[90vw] h-[80vh] md:left-[calc(50%-350px)] md:w-[700px]'
                    : 'z-30 top-[calc(100%-520px)] left-[3%] w-80 md:w-96 h-[500px] hover:-translate-y-1 hover:shadow-[0_30px_60px_-15px_rgba(59,130,246,0.2),inset_0_0_0_1px_rgba(255,255,255,0.8)]'
                }
      `}
        >
            {/* 材质层保持不变 */}
            <div className="absolute -top-[20%] -left-[20%] w-[140%] h-[140%] opacity-40 pointer-events-none blur-3xl saturate-150 mix-blend-multiply bg-[conic-gradient(from_0deg_at_50%_50%,#e0f2fe_0deg,#f3e8ff_120deg,#ecfccb_240deg,#e0f2fe_360deg)]" />
            <div className="absolute inset-0 opacity-[0.06] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] pointer-events-none mix-blend-color-burn" />
            <div className="absolute top-0 left-6 right-6 h-px bg-linear-to-r from-transparent via-white to-transparent opacity-80 z-20" />

            {/* 顶部控制栏 */}
            <div className="relative flex justify-between items-center px-6 py-4 border-b border-slate-900/5 shrink-0 z-10 bg-white/20">
                <div className="flex items-center gap-3">
                    <Library size={20} className="text-slate-400" />
                    <span className="font-bold tracking-[0.2em] text-[15px] text-slate-500/80">
                        爱好档案 // HOBBYARCHIVE
                    </span>
                </div>
                <button
                    onClick={(e) => { e.stopPropagation(); onToggle(); }}
                    className="text-slate-400 hover:text-slate-800 transition-colors"
                >
                    {isActive ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                </button>
            </div>

            {/* 三层结构 */}
            <div className="flex-1 flex flex-col divide-y divide-slate-100 overflow-hidden relative z-10">
                {(Object.keys(CATEGORY_UI_CONFIG) as Category[]).map((key) => {
                    const uiConfig = CATEGORY_UI_CONFIG[key];
                    const Icon = uiConfig.icon;
                    const isExpanded = expandedKeys.includes(key);

                    // [新增] 动态筛选当前分类下的数据
                    const currentItems = allHobbies.filter(item => item.category === key);

                    return (
                        <motion.div
                            key={key}
                            layout
                            className={`
                                flex flex-col relative group overflow-hidden
                                ${isExpanded ? 'flex-1' : 'flex-none h-16'}
                            `}
                            transition={{
                                layout: { duration: 0.45, ease: [0.23, 1, 0.32, 1] }
                            }}
                            onClick={(e) => handleCategoryClick(key, e)}
                        >
                            {/* 标题栏 */}
                            <div className={`flex items-center justify-between px-6 py-0 cursor-pointer transition-all shrink-0 h-16 ${isExpanded ? 'bg-white/40 shadow-[inset_0_-1px_0_rgba(0,0,0,0.02)]' : 'hover:bg-white/30'}`}>
                                <div className="flex items-center gap-5">
                                    <div className={`p-2 rounded-xl shadow-sm border border-white/50 ${uiConfig.bg} backdrop-blur-sm`}>
                                        <Icon size={18} className={`${uiConfig.color}`} />
                                    </div>
                                    <span className={`text-base font-bold tracking-[0.2em] uppercase transition-colors ${isExpanded ? 'text-slate-800' : 'text-slate-500'}`}>
                                        {uiConfig.label}
                                    </span>
                                </div>
                                <div className="text-slate-400 group-hover:text-slate-600 transition-colors">
                                    {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                </div>
                            </div>

                            {/* 内容列表 */}
                            <div className={`flex-1 overflow-y-auto px-6 py-4 bg-slate-50/30 shadow-[inset_0_4px_12px_rgba(0,0,0,0.03)] ${!isExpanded ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>

                                <div className="flex items-center justify-between px-3 py-2 mb-2 border-b border-slate-200/50">
                                    <span className="text-[13px] font-bold text-slate-400 tracking-[0.2em] uppercase">内容详情/Details</span>
                                    <span className="text-[13px] font-bold text-slate-400 tracking-[0.2em] uppercase">爱好等级/Level</span>
                                </div>

                                <div className="space-y-2">
                                    {/* [修改] 使用筛选后的动态数据渲染 */}
                                    {currentItems.length > 0 ? (
                                        currentItems.map((item) => (
                                            <motion.div
                                                key={item.id}
                                                layout
                                                className="relative flex items-center justify-between py-3 px-4 rounded-xl bg-white border border-white/80 shadow-[0_2px_4px_rgba(0,0,0,0.02)] hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 group/item cursor-default"
                                            >
                                                <div className="flex items-baseline gap-4 flex-1 min-w-0">
                                                    <span className="text-lg font-bold text-slate-700 group-hover/item:text-slate-900 transition-colors whitespace-nowrap">
                                                        {item.name}
                                                    </span>
                                                    <span className="text-xs text-slate-400 truncate group-hover/item:text-slate-500 transition-colors">
                                                        {item.description}
                                                    </span>
                                                </div>

                                                <div className="pl-6">
                                                    <LevelIndicator level={item.level} activeColor={uiConfig.activeColor} />
                                                </div>
                                            </motion.div>
                                        ))
                                    ) : (
                                        <div className="py-4 text-center text-slate-400 text-xs">暂无数据 (No Data)</div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            {/* 底部装饰 */}
            <div className="h-10 bg-slate-50 border-t border-slate-100 shrink-0 flex items-center px-6 justify-between relative z-10">
                <div className="flex gap-2 opacity-50">
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-200" />
                </div>
                <div className="flex items-center gap-2">
                    <div className="h-1 w-12 bg-slate-200 rounded-full overflow-hidden">
                        <div className="h-full w-2/3 bg-blue-500/50" />
                    </div>
                    <span className="text-[9px] text-slate-400 tracking-widest font-bold">V3.14</span>
                </div>
            </div>
        </motion.div>
    );
}