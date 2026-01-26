"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { GitCommit, BookOpen, Users, Activity } from 'lucide-react';

// === 数据定义 ===
interface TimelineItem {
    id: number;
    type: 'knowledge' | 'social' | 'arts';
    date: string; // YYYY-MM-DD
    title: string;
    color: string;
    icon: any;
}

const TIMELINE_DATA: TimelineItem[] = [
    { id: 1, type: 'knowledge', date: '2026-06-13', title: 'Master Degree', color: 'bg-blue-500', icon: BookOpen },
    { id: 2, type: 'social', date: '2025-02-14', title: 'Lab Team Building', color: 'bg-rose-500', icon: Users },
    { id: 3, type: 'social', date: '2024-12-25', title: 'Joined Lab', color: 'bg-rose-500', icon: Users },
    { id: 4, type: 'arts', date: '2024-10-05', title: 'First Marathon', color: 'bg-emerald-500', icon: Activity },
    { id: 5, type: 'knowledge', date: '2023-11-20', title: 'Published Paper', color: 'bg-blue-500', icon: BookOpen },
];

interface TimelineWidgetProps {
    isActive: boolean;
    onToggle: () => void;
}

export default function TimelineWidget({ isActive, onToggle }: TimelineWidgetProps) {
    // 简单的日期处理
    const getYear = (dateStr: string) => dateStr.split('-')[0];
    const getDate = (dateStr: string) => {
        const [_, m, d] = dateStr.split('-');
        return `${m}.${d}`;
    };

    // 获取最新年份作为水印
    const currentYear = getYear(TIMELINE_DATA[0].date);

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
                fixed flex flex-col backdrop-blur-xl bg-white/80 border border-white/60 rounded-2xl shadow-lg ring-1 ring-slate-900/5 overflow-hidden group hover:bg-white/95 transition-all duration-300
                ${isActive
                    ? 'z-50 top-[15vh] left-[5vw] right-[5vw] h-[70vh] md:left-[calc(50%-300px)] md:w-[600px] md:right-auto'
                    : 'z-30 top-[4%] right-[2.5%] w-[360px] h-[280px] cursor-pointer hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.2)]'
                }
            `}
        >

            {/* 右上角年份水印 */}
            <motion.div
                layout
                className={`absolute font-black text-slate-100/80 pointer-events-none select-none z-0 tracking-tighter ${isActive ? 'top-4 right-8 text-8xl' : 'top-2 right-4 text-6xl'}`}
            >
                {currentYear}
            </motion.div>

            {/* 顶部标题栏 */}
            <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between relative z-10 shrink-0">
                <div className="flex items-center gap-2">
                    <GitCommit size={14} className="text-slate-400" />
                    <span className="text-[14px] font-mono font-bold text-slate-500 tracking-[0.2em] uppercase">
                        时间线//Timeline
                    </span>
                </div>
                {/* 展开/收起按钮 - 仅在激活时显示或始终显示但样式不同 */}
                <button
                    onClick={(e) => { e.stopPropagation(); onToggle(); }}
                    className="p-1 rounded-full hover:bg-slate-100 text-slate-400 transition-colors"
                >
                    <div className="flex gap-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-400" title="Knowledge" />
                        <div className="w-1.5 h-1.5 rounded-full bg-rose-400" title="Social" />
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" title="Arts/Sports" />
                    </div>
                </button>
            </div>

            {/* 时间线轨道区域 */}
            <div className="relative p-5 flex-1 overflow-hidden z-10">
                {/* 背景装饰：左侧轴线 */}
                <div className="absolute top-0 bottom-0 left-[70px] w-px bg-slate-200 border-l border-dashed border-slate-300" />

                {/* 滚动容器 */}
                <div className="relative h-full overflow-y-auto custom-scrollbar space-y-4 pr-2">
                    {TIMELINE_DATA.map((item, index) => {
                        // 判断是否是该年份的最后一项：如果是最后一个元素，或者下一个元素的年份不同
                        const isLastInYear = index === TIMELINE_DATA.length - 1 || getYear(item.date) !== getYear(TIMELINE_DATA[index + 1].date);
                        const itemYear = getYear(item.date);

                        return (
                            <React.Fragment key={item.id}>
                                <motion.div
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    className="relative flex items-start gap-4 group/item cursor-default"
                                >
                                    {/* 左侧：日期标签 (MM.DD) */}
                                    <span className="text-[16px] font-mono text-slate-400 w-[45px] text-right shrink-0 pt-1">
                                        {getDate(item.date)}
                                    </span>

                                    {/* 中间：节点点 */}
                                    <div className="relative flex flex-col items-center pt-2.5">
                                        <div className={`
                                            relative z-10 w-2.5 h-2.5 rounded-full ${item.color} 
                                            ring-4 ring-white shadow-sm group-hover/item:scale-125 transition-transform
                                        `} />
                                        {/* 连线：只有不是最后一个总元素才显示向下连线 */}
                                        {index !== TIMELINE_DATA.length - 1 && (
                                            <div className="absolute top-full left-1/2 -translate-x-1/2 w-px h-8 bg-slate-200 -z-10" />
                                        )}
                                    </div>

                                    {/* 右侧：内容卡片 */}
                                    <div className="flex-1 px-3 py-2 rounded-lg bg-white/50 border border-white/60 hover:bg-white hover:shadow-md transition-all -mt-1">
                                        <div className="flex justify-between items-start">
                                            <span className="text-base font-bold text-slate-700 leading-tight">
                                                {item.title}
                                            </span>
                                            <item.icon size={16} className="text-slate-300 mt-1" />
                                        </div>
                                        <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider block mt-1">
                                            {item.type}
                                        </span>
                                    </div>
                                </motion.div>

                                {/* 年份分割线：显示在当前年份所有事件之后 */}
                                {isLastInYear && (
                                    <div className="flex items-center gap-4 py-4 opacity-60">
                                        <div className="h-px w-16 bg-slate-300" />
                                        <span className="text-sm font-black text-slate-400 tracking-tighter">{itemYear}</span>
                                        <div className="h-px flex-1 bg-slate-300" />
                                    </div>
                                )}
                            </React.Fragment>
                        );
                    })}

                    {/* 底部渐变遮罩 */}
                    <div className="absolute bottom-0 left-0 right-0 h-8 bg-linear-to-t from-white/90 to-transparent pointer-events-none" />
                </div>
            </div>
        </motion.div>
    );
}