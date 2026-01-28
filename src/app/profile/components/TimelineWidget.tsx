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
        <>
            {/* === 移植部分：动态背景样式 === */}
            <style jsx global>{`
                @keyframes aurora-flow {
                    0% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                    100% { background-position: 0% 50%; }
                }
                .animate-aurora {
                    background-size: 200% 200%;
                    animation: aurora-flow 15s ease infinite;
                }
            `}</style>

            <motion.div
                layout
                // === 保持原版动画参数 ===
                transition={{
                    type: "spring",
                    stiffness: 100,
                    damping: 22,
                    mass: 1.2
                }}
                onClick={!isActive ? onToggle : undefined}
                className={`
                    fixed flex flex-col overflow-hidden
                    /* === 移植部分：新版容器材质 === */
                    backdrop-blur-3xl 
                    border border-white/40
                    rounded-[2rem]
                    shadow-[0_8px_32px_0_rgba(31,38,135,0.15)]
                    
                    /* === 修复部分：移除 transition-all，改为针对性过渡以避免与 layout 冲突 === */
                    group transition-[shadow,background-color] duration-300
                    ${isActive
                        ? 'z-50 top-[10vh] left-[5vw] right-[5vw] h-[80vh] md:left-[calc(50%-425px)] md:w-[900px] md:right-auto ring-1 ring-white/50 bg-white/10'
                        : 'z-30 top-[4%] right-[2.5%] w-[360px] h-[280px] cursor-pointer hover:shadow-[0_20px_50px_rgba(8,112,184,0.2)] bg-white/5'
                    }
                `}
            >
                {/* === 移植部分：背景层 (极光 + 噪点 + 反光) === */}
                <div className="absolute inset-0 bg-linear-to-br from-blue-100/40 via-purple-100/40 to-emerald-100/40 animate-aurora opacity-60 z-0" />
                <div className="absolute inset-0 bg-linear-to-tr from-white/10 via-white/40 to-transparent opacity-50 z-0 pointer-events-none" />
                <div className="absolute inset-0 opacity-[0.08] z-0 pointer-events-none mix-blend-overlay"
                    style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}
                />

                {/* === 移植部分：年份大水印 === */}
                <motion.div
                    layout
                    className={`absolute font-black text-slate-900/4 pointer-events-none select-none z-0 tracking-tighter ${isActive ? 'top-4 right-8 text-8xl' : 'top-2 right-4 text-6xl'}`}
                >
                    {currentYear}
                </motion.div>

                {/* === 顶部标题栏 (结构保持原版，微调材质适配新背景) === */}
                <div className="px-5 py-3 border-b border-white/30 flex items-center justify-between relative z-10 shrink-0 bg-white/10">
                    <div className="flex items-center gap-2">
                        <GitCommit size={20} className="text-slate-400" />
                        <span className="text-[14px] font-mono font-bold text-slate-600 tracking-[0.2em] uppercase drop-shadow-sm">
                            时间线//Timeline
                        </span>
                    </div>
                    <button
                        onClick={(e) => { e.stopPropagation(); onToggle(); }}
                        className="p-1 rounded-full hover:bg-white/40 text-slate-500 transition-colors"
                    >
                        <div className="flex gap-1">
                            <div className={`w-1.5 h-1.5 rounded-full shadow-sm ${isActive ? 'bg-slate-400 scale-125' : 'bg-blue-400'}`} />
                            <div className={`w-1.5 h-1.5 rounded-full shadow-sm ${isActive ? 'bg-slate-400 scale-125' : 'bg-rose-400'}`} />
                            <div className={`w-1.5 h-1.5 rounded-full shadow-sm ${isActive ? 'bg-slate-400 scale-125' : 'bg-emerald-400'}`} />
                        </div>
                    </button>
                </div>

                {/* === 内容区域 (逻辑完全保持原版) === */}
                <div className="relative p-5 flex-1 overflow-hidden z-10">

                    {/* 1. 折叠态：单列混合时间线 (保持参考代码逻辑) */}
                    {!isActive && (
                        <div className="relative h-full overflow-y-auto custom-scrollbar pr-2">
                            <div className="relative min-h-full pb-16">
                                {/* 轴线：颜色变淡以适配背景 */}
                                <div className="absolute top-0 bottom-0 left-[66px] w-px bg-slate-400/30 z-0" />

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
                                                    <span className="text-[16px] font-mono font-bold text-slate-500 w-[45px] text-right shrink-0 pt-1 tracking-tight">{getDate(item.date)}</span>
                                                    <div className="relative flex flex-col items-center pt-2.5">
                                                        <div className={`relative z-10 w-2.5 h-2.5 rounded-full ${item.color} ring-4 ring-white/60 shadow-lg group-hover/item:scale-125 transition-transform`} />
                                                    </div>
                                                    {/* 卡片：增加磨砂玻璃感 */}
                                                    <div className="flex-1 px-3 py-2 rounded-xl bg-white/40 border border-white/50 hover:bg-white/80 hover:shadow-lg hover:border-white transition-all -mt-1 backdrop-blur-sm">
                                                        <div className="flex justify-between items-start">
                                                            <span className="text-base font-bold text-slate-800 leading-tight">{item.title}</span>
                                                            <item.icon size={16} className="text-slate-400 mt-1" />
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
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 2. 展开态：三轨并行垂直时间轴 (保持参考代码逻辑) */}
                    {isActive && (
                        <div className="relative h-full overflow-y-auto custom-scrollbar pr-2">
                            <div className="relative min-h-full pb-20">
                                {/* 背景：三条贯穿的主轨道 - 增加模糊光晕 */}
                                <div className="absolute top-0 bottom-0 left-0 right-0 flex justify-between px-30 pointer-events-none opacity-20">
                                    <div className="w-0.5 h-full bg-blue-500 blur-[1px]" />
                                    <div className="w-0.5 h-full bg-rose-500 blur-[1px]" />
                                    <div className="w-0.5 h-full bg-emerald-500 blur-[1px]" />
                                </div>

                                {/* 列头标识 - 增加磨砂背景 */}
                                <div className="sticky top-0 z-20 flex justify-between px-20 py-2 bg-white/40 backdrop-blur-md border-b border-white/30 mb-6 text-[20px] font-black text-slate-500/80 tracking-widest uppercase shadow-sm">
                                    <span className="w-20 text-center text-blue-600/80">知识</span>
                                    <span className="w-20 text-center text-rose-600/80">社交</span>
                                    <span className="w-20 text-center text-emerald-600/80">艺体</span>
                                </div>

                                {/* 事件流 (布局逻辑完全不变) */}
                                <div className="space-y-8 relative px-4 pb-12">
                                    {TIMELINE_DATA.map((item, index) => {
                                        const isLastInYear = index === TIMELINE_DATA.length - 1 || getYear(item.date) !== getYear(TIMELINE_DATA[index + 1].date);
                                        const itemYear = getYear(item.date);

                                        return (
                                            <React.Fragment key={item.id}>
                                                <div className="flex flex-col w-full items-center">
                                                    {/* 整个事件容器：根据类型平移 */}
                                                    <div className={`
                                                        relative flex flex-col items-center text-center max-w-[200px] transition-transform duration-500
                                                        ${item.type === 'knowledge' ? '-translate-x-[297px]' : ''}
                                                        ${item.type === 'social' ? '' : ''}
                                                        ${item.type === 'arts' ? 'translate-x-[297px]' : ''}
                                                    `}>
                                                        {/* 轨道上的点 */}
                                                        <div className={`w-3 h-3 rounded-full border-2 border-white shadow-sm mb-2 ${item.color} z-10`} />

                                                        {/* 内容卡片 - 增加磨砂质感 */}
                                                        <div className={`
                                                            p-3 rounded-xl bg-white/60 backdrop-blur-md border border-white/60 shadow-sm hover:shadow-md transition-all hover:bg-white w-full
                                                            ${item.type === 'social' ? 'rounded-t-none' : ''}
                                                        `}>
                                                            <div className="text-[16px] font-mono text-slate-500 mb-1">{getDate(item.date)}</div>
                                                            <div className="text-sm font-bold text-slate-800 leading-tight">{item.title}</div>
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

                    {/* 底部渐变遮罩 */}
                    {!isActive && (
                        <div className="absolute bottom-0 left-0 right-0 h-8 bg-linear-to-t from-white/60 to-transparent pointer-events-none" />
                    )}
                </div>
            </motion.div>
        </>
    );
}