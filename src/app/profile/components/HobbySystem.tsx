"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Book, Palette, Dumbbell, Maximize2, Minimize2, ChevronDown, ChevronRight, Activity, Terminal, Aperture } from 'lucide-react';

// === 数据定义 ===
type Category = 'knowledge' | 'sports' | 'arts';

interface HobbyItem {
    name: string;
    levelText: string;
}

const HOBBY_DATA: Record<Category, { label: string; icon: any; items: HobbyItem[]; color: string; bg: string }> = {
    knowledge: {
        label: "CORE_LOGIC",
        icon: Terminal,
        color: "text-blue-600",
        bg: "bg-blue-50",
        items: [
            { name: "Next.js", levelText: "MASTER" },
            { name: "React Native", levelText: "LV.3" },
            { name: "Python", levelText: "LV.2" },
            { name: "UI Design", levelText: "LV.3" },
            { name: "Database", levelText: "LV.2" },
            { name: "System Arch", levelText: "LEARNING" },
        ]
    },
    sports: {
        label: "PHYSICAL",
        icon: Activity,
        color: "text-emerald-600",
        bg: "bg-emerald-50",
        items: [
            { name: "5km Run", levelText: "WEEKLY" },
            { name: "Basketball", levelText: "FAN" },
            { name: "Swimming", levelText: "SUMMER" },
            { name: "Hiking", levelText: "LV.1" },
        ]
    },
    arts: {
        label: "CREATIVE",
        icon: Aperture,
        color: "text-purple-600",
        bg: "bg-purple-50",
        items: [
            { name: "Sci-Fi", levelText: "OBSESSED" },
            { name: "Photography", levelText: "LV.2" },
            { name: "Guitar", levelText: "BEGINNER" },
            { name: "Movie Review", levelText: "WRITER" },
        ]
    }
};

interface HobbySystemProps {
    isActive: boolean;
    onToggle: () => void;
}

export default function HobbySystem({ isActive, onToggle }: HobbySystemProps) {
    const [expandedKeys, setExpandedKeys] = useState<Category[]>(['knowledge', 'sports', 'arts']);

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
            onClick={!isActive ? onToggle : undefined}
            className={`
        flex flex-col overflow-hidden backdrop-blur-xl
        bg-white/90 text-slate-800 font-mono
        border border-white/50 rounded-2xl
        shadow-[0_20px_50px_rgba(0,0,0,0.1)]
        ring-1 ring-slate-200/50
        ${isActive
                    ? 'absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] md:w-[700px] h-[70vh] z-50 cursor-default'
                    : 'absolute bottom-[5%] left-[5%] translate-x-0 translate-y-0 w-80 md:w-96 h-[500px] z-30 cursor-pointer hover:border-slate-300 hover:bg-white transition-all hover:shadow-2xl'
                }
      `}
        >
            {/* 顶部控制栏 */}
            <div className="flex justify-between items-center px-5 py-3 bg-slate-50 border-b border-slate-100 shrink-0">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse shadow-[0_0_8px_#3b82f6]" />
                    <span className="font-bold tracking-[0.2em] text-[10px] text-slate-500">SYS_MODULE // HOBBY_ARCHIVE</span>
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
                {(['knowledge', 'sports', 'arts'] as Category[]).map((key) => {
                    const category = HOBBY_DATA[key];
                    const Icon = category.icon;
                    const isExpanded = expandedKeys.includes(key);

                    return (
                        <motion.div
                            key={key}
                            layout
                            className={`
                                flex flex-col relative group overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)]
                                ${isExpanded ? 'flex-1' : 'flex-none h-14'}
                            `}
                            onClick={(e) => handleCategoryClick(key, e)}
                        >
                            {/* 标题栏 */}
                            <div className={`flex items-center justify-between px-5 py-0 cursor-pointer transition-all shrink-0 h-14 group-hover:pl-6 ${isExpanded ? 'bg-white' : 'bg-slate-50/50 hover:bg-slate-100'}`}>
                                <div className="flex items-center gap-4">
                                    <div className={`p-1.5 rounded-md ${category.bg}`}>
                                        <Icon size={16} className={`${category.color}`} />
                                    </div>
                                    <span className={`text-sm font-bold tracking-[0.2em] uppercase ${isExpanded ? 'text-slate-800' : 'text-slate-500'}`}>
                                        {category.label}
                                    </span>
                                </div>
                                <div className="text-slate-400 group-hover:text-slate-600 transition-colors">
                                    {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                </div>
                            </div>

                            {/* 内容列表 */}
                            <div className={`flex-1 overflow-y-auto px-5 py-2 space-y-1 bg-slate-50/30 ${!isExpanded ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
                                {category.items.map((item, i) => (
                                    <div key={i} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0 hover:bg-white hover:shadow-sm px-3 rounded-lg transition-all group/item cursor-default">
                                        <span className={`text-sm tracking-wide text-slate-500 group-hover/item:text-slate-800 transition-colors font-medium`}>
                                            {item.name}
                                        </span>
                                        <span className="text-[10px] text-slate-400 font-bold bg-white px-2 py-1 rounded border border-slate-200 group-hover/item:text-blue-600 group-hover/item:border-blue-200 transition-all shadow-sm">
                                            {item.levelText}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            {/* 底部装饰 */}
            <div className="h-8 bg-slate-50 border-t border-slate-200 shrink-0 flex items-center px-4 justify-between">
                 <div className="flex gap-1.5">
                     {[...Array(3)].map((_,i) => <div key={i} className="w-1 h-1 bg-slate-300 rounded-full" />)}
                 </div>
                 <div className="flex items-center gap-2">
                     <div className="h-1 w-12 bg-slate-200 rounded-full overflow-hidden">
                         <div className="h-full w-2/3 bg-blue-500/50" />
                     </div>
                     <span className="text-[9px] text-slate-400 tracking-widest font-bold">V2.4.0</span>
                 </div>
            </div>
        </motion.div>
    );
}