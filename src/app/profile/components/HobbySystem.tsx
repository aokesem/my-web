"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Book, Palette, Dumbbell, Maximize2, Minimize2, ChevronDown, ChevronRight } from 'lucide-react';

// === 数据定义 (增加了部分数据以测试滚动) ===
type Category = 'knowledge' | 'sports' | 'arts';

interface HobbyItem {
    name: string;
    levelText: string;
}

const HOBBY_DATA: Record<Category, { label: string; icon: any; items: HobbyItem[] }> = {
    knowledge: {
        label: "KNOWLEDGE",
        icon: Book,
        items: [
            { name: "Next.js", levelText: "Master" },
            { name: "React Native", levelText: "Lv.3" },
            { name: "Python", levelText: "Lv.2" },
            { name: "UI Design", levelText: "Lv.3" },
            { name: "Database/SQL", levelText: "Lv.2" },
            { name: "System Arch", levelText: "Learning" },
        ]
    },
    sports: {
        label: "SPORTS",
        icon: Dumbbell,
        items: [
            { name: "5km Run", levelText: "Weekly" },
            { name: "Basketball", levelText: "Fan" },
            { name: "Swimming", levelText: "Summer" },
            { name: "Hiking", levelText: "Lv.1" },
        ]
    },
    arts: {
        label: "ARTS",
        icon: Palette,
        items: [
            { name: "Sci-Fi Reading", levelText: "Obsessed" },
            { name: "Photography", levelText: "Lv.2" },
            { name: "Guitar", levelText: "Beginner" },
            { name: "Movie Review", levelText: "Writer" },
        ]
    }
};

interface HobbySystemProps {
    isActive: boolean;
    onToggle: () => void;
}

export default function HobbySystem({ isActive, onToggle }: HobbySystemProps) {
    // 状态：哪些分类是展开的？默认全展开
    const [expandedKeys, setExpandedKeys] = useState<Category[]>(['knowledge', 'sports', 'arts']);

    const handleCategoryClick = (key: Category, e: React.MouseEvent) => {
        e.stopPropagation(); // 防止触发整体放大
        setExpandedKeys(prev =>
            prev.includes(key)
                ? prev.filter(k => k !== key) // 如果已展开则移除，实现折叠
                : [...prev, key]             // 如果未展开则添加，实现展开
        );
    };

    return (
        <motion.div
            layout
            onClick={!isActive ? onToggle : undefined}
            className={`
        flex flex-col overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.3)]
        bg-[#fdf6e3] text-[#4a3b2a] font-serif
        border-12 border-[#6b4226] rounded-lg
        /* 位置调整：left-[4%] 更靠左
           宽度调整：w-80 -> w-96 (更宽)
        */
        ${isActive
                    ? 'absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] md:w-[700px] h-[70vh] z-50 cursor-default'
                    : 'absolute bottom-[3%] left-[2%] translate-x-0 translate-y-0 w-80 md:w-96 h-[550px] z-30 cursor-pointer'
                }
      `}
        >
            {/* 纹理遮罩 */}
            <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/paper.png')] pointer-events-none" />

            {/* 顶部控制栏 */}
            <div className="flex justify-between items-center px-4 py-2 bg-[#5c3a21] text-[#e0c097] border-b-2 border-[#4a2e18] shrink-0">
                <span className="font-bold tracking-[0.2em] text-sm">ARCHIVE_SYS</span>
                <button onClick={(e) => { e.stopPropagation(); onToggle(); }} className="hover:text-white transition-colors">
                    {isActive ? <Minimize2 size={18} /> : <Maximize2 size={16} />}
                </button>
            </div>

            {/* 三层架子结构 (Flex 布局处理手风琴效果) */}
            <div className="flex-1 flex flex-col divide-y-4 divide-[#6b4226] overflow-hidden">
                {(['knowledge', 'sports', 'arts'] as Category[]).map((key) => {
                    const category = HOBBY_DATA[key];
                    const Icon = category.icon;

                    // 判断是否展开
                    const isExpanded = expandedKeys.includes(key);

                    return (
                        <motion.div
                            key={key}
                            layout
                            className={`
                flex flex-col relative group overflow-hidden transition-all duration-500 ease-in-out
                /* 高度分配逻辑：
                   - 已展开：flex-1 (平分剩余空间)
                   - 已折叠：flex-none h-14 (固定标题高度)
                */
                ${isExpanded ? 'flex-1' : 'flex-none h-14'}
              `}
                            onClick={(e) => handleCategoryClick(key, e)}
                        >

                            {/* 层标题 (Label) - 点击可展开/折叠 */}
                            <div className="flex items-center justify-between px-4 py-3 bg-[#e8dcc5] border-b border-[#d4c5a9] cursor-pointer hover:bg-[#decab0] transition-colors shrink-0 h-14">
                                <div className="flex items-center gap-3">
                                    <Icon size={20} className="text-[#8b5a2b]" />
                                    <span className="font-black text-lg tracking-wider uppercase opacity-80">{category.label}</span>
                                </div>
                                {/* 指示箭头 */}
                                <div className="text-[#8b5a2b] opacity-60">
                                    {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                                </div>
                            </div>

                            {/* 内容列表 */}
                            <div className={`flex-1 overflow-y-auto p-4 space-y-3 bg-[#fdf6e3] ${!isExpanded ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
                                {category.items.map((item, i) => (
                                    <div key={i} className="flex items-center justify-between border-b border-[#e6d0b3] pb-1 last:border-0 hover:pl-2 transition-all">
                                        <span className={`font-bold text-[#5c3a21] ${isActive ? 'text-xl' : 'text-lg'}`}>
                                            {item.name}
                                        </span>
                                        <span className="font-mono text-[#8b5a2b] font-bold text-sm bg-[#e8dcc5] px-2 py-0.5 rounded">
                                            {item.levelText}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            {/* 层阴影 */}
                            <div className="absolute top-14 left-0 w-full h-4 bg-linear-to-b from-black/5 to-transparent pointer-events-none" />
                        </motion.div>
                    );
                })}
            </div>

            {/* 底部装饰底座 */}
            <div className="h-4 bg-[#4a2e18] shrink-0" />
        </motion.div>
    );
}