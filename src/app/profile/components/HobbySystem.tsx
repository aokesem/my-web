"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Book, Maximize2, Minimize2, ChevronDown, ChevronRight, Activity, Terminal, Aperture, Cpu, Zap, Library, Gamepad2, Ghost } from 'lucide-react';

// === 数据定义 ===
type Category = 'knowledge' | 'sports' | 'arts' | 'acgn';

interface HobbyItem {
    name: string;
    desc: string; // 原 levelText 改为 desc，作为中间的说明文字
    level: 1 | 2 | 3 | 4; // 新增等级 1-4
}

const HOBBY_DATA: Record<Category, { label: string; icon: any; items: HobbyItem[]; color: string; bg: string; activeColor: string }> = {
    knowledge: {
        label: "知识",
        icon: Cpu,
        color: "text-blue-600",
        bg: "bg-blue-50",
        activeColor: "bg-blue-500",
        items: [
            { name: "LLM", desc: "了解原理", level: 3 },
            { name: "Python", desc: "语法入门", level: 1 },
            { name: "英语提升", desc: "考虑提升听说中", level: 2 },
        ]
    },
    sports: {
        label: "运动",
        icon: Zap,
        color: "text-red-600",
        bg: "bg-red-50",
        activeColor: "bg-red-500",
        items: [
            { name: "跑步", desc: "5km-10km", level: 4 },
            { name: "篮球", desc: "只会投篮", level: 3 },
            { name: "健身", desc: "想去做，但一直没有开始", level: 1 },
        ]
    },
    arts: {
        label: "文艺",
        icon: Library,
        color: "text-emerald-600",
        bg: "bg-emerald-50",
        activeColor: "bg-emerald-500",
        items: [
            { name: "电影", desc: "喜欢经典的高分电影，重剧情", level: 4 },
            { name: "读书", desc: "小说和推理小说", level: 2 },
            { name: "桌游", desc: "喜欢与人博弈和合作的过程", level: 4 },
            { name: "口琴", desc: "刚买，希望日后能够熟练", level: 1 },
            { name: "拼图", desc: "考虑入坑中", level: 1 },
        ]
    },
    acgn: {
        label: "ACGN",
        icon: Ghost, // 这里使用了 Book 图标，你也可以换成别的
        color: "text-pink-400",
        bg: "bg-pink-50",
        activeColor: "bg-pink-500",
        items: [
            { name: "动漫", desc: "老二次元了😙", level: 4 },
            { name: "漫画", desc: "还有很多准备看的", level: 3 },
            { name: "游戏", desc: "现在自己不玩了，但依然关注", level: 2 },
            { name: "轻小说", desc: "目前只看过几本，但每本都印象深刻", level: 3 },
            { name: "MAD制作", desc: "重启咲良田MAD已上传B站，制作下一作中", level: 4 },
        ]
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
        flex flex-col overflow-hidden backdrop-blur-xl
        bg-white/95 text-slate-800 font-mono
        border border-white/60 rounded-2xl
        shadow-[0_8px_30px_rgba(0,0,0,0.12)]
        ring-1 ring-slate-900/5
        fixed transition-all duration-500 ease-[cubic-bezier(0.25,0.1,0.25,1)]
        ${isActive
                    ? 'z-50 top-[15vh] left-[5vw] w-[90vw] h-[70vh] md:left-[calc(50%-350px)] md:w-[700px]'
                    : 'z-30 top-[calc(100%-520px)] left-[3%] w-80 md:w-96 h-[500px] hover:border-slate-300 hover:bg-white hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.2)]'
                }
      `}
        >
            {/* 顶部控制栏 */}
            <div className="flex justify-between items-center px-5 py-3 bg-slate-50 border-b border-slate-100 shrink-0">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse shadow-[0_0_8px_#3b82f6]" />
                    <span className="font-bold tracking-[0.2em] text-[16px] text-slate-500"> 爱好档案 // HOBBY_ARCHIVE</span>
                </div>
                <button
                    onClick={(e) => { e.stopPropagation(); onToggle(); }}
                    className="text-slate-400 hover:text-slate-800 transition-colors"
                >
                    {isActive ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                </button>
            </div>

            {/* 三层结构 */}
            <div className="flex-1 flex flex-col divide-y divide-slate-100 overflow-hidden">
                {(['knowledge', 'sports', 'arts', 'acgn'] as Category[]).map((key) => {
                    const category = HOBBY_DATA[key];
                    const Icon = category.icon;
                    const isExpanded = expandedKeys.includes(key);

                    return (
                        <motion.div
                            key={key}
                            layout
                            className={`
                                flex flex-col relative group overflow-hidden
                                ${isExpanded ? 'flex-1' : 'flex-none h-14'}
                            `}
                            transition={{
                                layout: { duration: 0.45, ease: [0.23, 1, 0.32, 1] }
                            }}
                            onClick={(e) => handleCategoryClick(key, e)}
                        >
                            {/* 标题栏 */}
                            <div className={`flex items-center justify-between px-5 py-0 cursor-pointer transition-all shrink-0 h-14 group-hover:pl-6 ${isExpanded ? 'bg-white' : 'bg-slate-50/50 hover:bg-slate-100'}`}>
                                <div className="flex items-center gap-4">
                                    <div className={`p-1.5 rounded-md ${category.bg}`}>
                                        <Icon size={16} className={`${category.color}`} />
                                    </div>
                                    <span className={`text-base font-bold tracking-[0.2em] uppercase ${isExpanded ? 'text-slate-800' : 'text-slate-500'}`}>
                                        {category.label}
                                    </span>
                                </div>
                                <div className="text-slate-400 group-hover:text-slate-600 transition-colors">
                                    {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                </div>
                            </div>

                            {/* 内容列表 */}
                            <div className={`flex-1 overflow-y-auto px-5 py-2 bg-slate-50/30 ${!isExpanded ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>

                                {/* 新增：列表表头 */}
                                <div className="flex items-center justify-between px-3 py-2 mb-1 border-b border-slate-200/60 transition-opacity duration-500">
                                    <span className="text-[13px] font-bold text-slate-400 tracking-[0.2em] uppercase">内容详情/Details</span>
                                    <span className="text-[13px] font-bold text-slate-400 tracking-[0.2em] uppercase">爱好等级/Level</span>
                                </div>

                                <div className="space-y-1.5">
                                    {category.items.map((item, i) => (
                                        <motion.div
                                            key={i}
                                            layout
                                            className="flex items-center justify-between py-2.5 border-b border-slate-100 last:border-0 hover:bg-white hover:shadow-sm px-3 rounded-xl transition-all group/item cursor-default"
                                        >
                                            {/* 1. 左侧：名字与说明 (增大字号) */}
                                            <div className="flex items-baseline gap-4 flex-1 min-w-0">
                                                <span className="text-lg font-bold text-slate-700 group-hover/item:text-slate-900 transition-colors whitespace-nowrap">
                                                    {item.name}
                                                </span>

                                                {/* 2. 中间：补充说明 (由 10px 提升至 xs) */}
                                                <span className="text-xs text-slate-400 truncate group-hover/item:text-slate-500 transition-colors">
                                                    {item.desc}
                                                </span>
                                            </div>

                                            {/* 3. 右侧：等级指示灯 (增加左间距) */}
                                            <div className="pl-6">
                                                <LevelIndicator level={item.level} activeColor={category.activeColor} />
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            {/* 底部装饰 */}
            <div className="h-8 bg-slate-50 border-t border-slate-200 shrink-0 flex items-center px-4 justify-between">
                <div className="flex gap-1.5">
                    {[...Array(3)].map((_, i) => <div key={i} className="w-1 h-1 bg-slate-300 rounded-full" />)}
                </div>
                <div className="flex items-center gap-2">
                    <div className="h-1 w-12 bg-slate-200 rounded-full overflow-hidden">
                        <div className="h-full w-2/3 bg-blue-500/50" />
                    </div>
                    <span className="text-[9px] text-slate-400 tracking-widest font-bold">V2.4.1</span>
                </div>
            </div>
        </motion.div>
    );
}