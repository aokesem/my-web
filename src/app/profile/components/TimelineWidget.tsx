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
                fixed flex flex-col backdrop-blur-xl bg-white/80 border border-white/60 rounded-2xl shadow-lg ring-1 ring-slate-900/5 overflow-hidden group hover:bg-white/95 transition-[shadow,background-color] duration-300
                ${isActive
                    ? 'z-50 top-[10vh] left-[5vw] right-[5vw] h-[80vh] md:left-[calc(50%-425px)] md:w-[900px] md:right-auto'
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
                    <GitCommit size={26} className="text-slate-400" />
                    <span className="text-[17px] font-mono font-bold text-slate-500 tracking-[0.2em] uppercase">
                        时间线//Timeline
                    </span>
                </div>
                <button
                    onClick={(e) => { e.stopPropagation(); onToggle(); }}
                    className="p-1 rounded-full hover:bg-slate-100 text-slate-400 transition-colors"
                >
                    <div className="flex gap-1">
                        <div className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-slate-400 scale-125' : 'bg-blue-400'}`} />
                        <div className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-slate-400 scale-125' : 'bg-rose-400'}`} />
                        <div className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-slate-400 scale-125' : 'bg-emerald-400'}`} />
                    </div>
                </button>
            </div>

            {/* 内容区域 */}
            <div className="relative p-5 flex-1 overflow-hidden z-10">

                {/* 1. 折叠态：单列混合时间线 */}
                {!isActive && (
                    <div className="relative h-full overflow-y-auto custom-scrollbar pr-2">
                        {/* 包装层：确保轴线铺满整个滚动内容高度 */}
                        <div className="relative min-h-full pb-16">
                            {/* 贯穿始终的轴线 */}
                            <div className="absolute top-0 bottom-0 left-[66px] w-px bg-slate-200 z-0" />

                            <div className="relative space-y-4">
                                {TIMELINE_DATA.map((item, index) => {
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
                                                <span className="text-[16px] font-mono text-slate-400 w-[45px] text-right shrink-0 pt-1">{getDate(item.date)}</span>
                                                <div className="relative flex flex-col items-center pt-2.5">
                                                    <div className={`relative z-10 w-2.5 h-2.5 rounded-full ${item.color} ring-4 ring-white shadow-sm group-hover/item:scale-125 transition-transform`} />
                                                </div>
                                                <div className="flex-1 px-3 py-2 rounded-lg bg-white/50 border border-white/60 hover:bg-white hover:shadow-md transition-all -mt-1">
                                                    <div className="flex justify-between items-start">
                                                        <span className="text-base font-bold text-slate-700 leading-tight">{item.title}</span>
                                                        <item.icon size={16} className="text-slate-300 mt-1" />
                                                    </div>
                                                    <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider block mt-1">{item.type}</span>
                                                </div>
                                            </motion.div>

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
                            </div>
                        </div>
                    </div>
                )}

                {/* 2. 展开态：三轨并行垂直时间轴 */}
                {isActive && (
                    <div className="relative h-full overflow-y-auto custom-scrollbar pr-2">
                        {/* 包装层：确保三条线能撑满整个滚动内容的高度 */}
                        <div className="relative min-h-full pb-20">
                            {/* 背景：三条贯穿的主轨道 */}
                            <div className="absolute top-0 bottom-0 left-0 right-0 flex justify-between px-30 pointer-events-none opacity-20">
                                <div className="w-0.5 h-full bg-blue-500" />
                                <div className="w-0.5 h-full bg-rose-500" />
                                <div className="w-0.5 h-full bg-emerald-500" />
                            </div>

                            {/* 列头标识 */}
                            <div className="sticky top-0 z-20 flex justify-between px-20 py-2 bg-white/60 backdrop-blur-md border-b border-slate-100 mb-6 text-[20px] font-black text-slate-400 tracking-widest uppercase">
                                <span className="w-20 text-center text-blue-500">知识</span>
                                <span className="w-20 text-center text-rose-500">社交</span>
                                <span className="w-20 text-center text-emerald-500">艺体</span>
                            </div>

                            {/* 事件流 */}
                            <div className="space-y-8 relative px-4 pb-12">
                                {TIMELINE_DATA.map((item, index) => {
                                    const isLastInYear = index === TIMELINE_DATA.length - 1 || getYear(item.date) !== getYear(TIMELINE_DATA[index + 1].date);
                                    const itemYear = getYear(item.date);
                                    const textAlign = 'items-center text-center';

                                    return (
                                        <React.Fragment key={item.id}>
                                            <div className="flex flex-col w-full items-center">
                                                {/* 整个事件容器：根据类型平移到对应轨道中心 */}
                                                <div className={`
                                                    relative flex flex-col items-center text-center max-w-[200px] transition-transform duration-500
                                                    ${item.type === 'knowledge' ? '-translate-x-[297px]' : ''}
                                                    ${item.type === 'social' ? '' : ''}
                                                    ${item.type === 'arts' ? 'translate-x-[297px]' : ''}
                                                `}>
                                                    {/* 轨道上的点：不再手动偏移，跟随容器居中 */}
                                                    <div className={`w-3 h-3 rounded-full border-2 border-white shadow-sm mb-2 ${item.color} z-10`} />

                                                    {/* 内容卡片：宽度增加，文字居中 */}
                                                    <div className={`
                                                        p-3 rounded-xl bg-white/70 border border-white/60 shadow-sm hover:shadow-md transition-all hover:bg-white w-full
                                                        ${item.type === 'social' ? 'rounded-t-none' : ''}
                                                    `}>
                                                        <div className="text-[16px] font-mono text-slate-400 mb-1">{getDate(item.date)}</div>
                                                        <div className="text-sm font-bold text-slate-700 leading-tight">{item.title}</div>
                                                    </div>
                                                </div>
                                            </div>
                                            {isLastInYear && (
                                                <div className="flex items-center gap-4 py-6 opacity-40">
                                                    <div className="h-px flex-1 bg-slate-300" />
                                                    <span className="text-xl font-black text-slate-300 tracking-tighter">{itemYear}</span>
                                                    <div className="h-px flex-1 bg-slate-300" />
                                                </div>
                                            )}
                                        </React.Fragment>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}

                {/* 底部渐变遮罩 (仅在未展开时显示，展开时每列自带滚动) */}
                {!isActive && (
                    <div className="absolute bottom-0 left-0 right-0 h-8 bg-linear-to-t from-white/90 to-transparent pointer-events-none" />
                )}
            </div>
        </motion.div>
    );
}