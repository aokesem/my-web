"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { GitCommit, BookOpen, Users, Activity } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

// === 数据定义 ===
// 1. 数据库返回的原始结构
interface DBTimelineItem {
    id: number;
    title: string;
    date: string;
    type: string;
}

// 2. 前端展示用的结构 (增加了 icon 组件)
interface TimelineItem extends DBTimelineItem {
    color: string;
    icon: any;
}

// 映射配置：将数据库的 type 映射为颜色和图标
const TYPE_CONFIG: Record<string, { color: string, icon: any }> = {
    knowledge: { color: 'bg-blue-500', icon: BookOpen },
    social: { color: 'bg-rose-500', icon: Users },
    arts: { color: 'bg-emerald-500', icon: Activity },
    default: { color: 'bg-slate-400', icon: GitCommit } // 默认兜底
};

interface TimelineWidgetProps {
    isActive: boolean;
    onToggle: () => void;
}

export default function TimelineWidget({ isActive, onToggle }: TimelineWidgetProps) {
    // 状态管理
    const [timelineData, setTimelineData] = useState<TimelineItem[]>([]);

    // 获取数据
    useEffect(() => {
        const fetchTimeline = async () => {
            const { data, error } = await supabase
                .from('profile_timeline')
                .select('*')
                .order('date', { ascending: false }); // 按日期降序

            if (data) {
                // 数据转换：DB Data -> UI Data
                const mappedData = data.map((item: DBTimelineItem) => {
                    const config = TYPE_CONFIG[item.type] || TYPE_CONFIG.default;
                    return {
                        ...item,
                        color: config.color,
                        icon: config.icon
                    };
                });
                setTimelineData(mappedData);
            }
        };
        fetchTimeline();
    }, []);

    // 日期处理
    const getYear = (dateStr: string) => dateStr.split('-')[0];
    const getDate = (dateStr: string) => {
        const parts = dateStr.split('-');
        if (parts.length < 3) return dateStr;
        return `${parts[1]}.${parts[2]}`;
    };

    // 获取最新年份 (增加空数据保护)
    const currentYear = timelineData.length > 0
        ? getYear(timelineData[0].date)
        : new Date().getFullYear().toString();

    return (
        <motion.div
            layout
            transition={{
                type: "spring",
                stiffness: 100,
                damping: 22,
                mass: 1.2
            }}
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
            {/* 背景层 (依赖 globals.css 中的 .animate-aurora 类) */}
            <div className="absolute inset-0 bg-linear-to-br from-blue-100/40 via-purple-100/40 to-emerald-100/40 animate-aurora opacity-60 z-0" />
            <div className="absolute inset-0 bg-linear-to-tr from-white/10 via-white/40 to-transparent opacity-50 z-0 pointer-events-none" />
            <div className="absolute inset-0 opacity-[0.08] z-0 pointer-events-none mix-blend-overlay"
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}
            />

            {/* 年份水印 */}
            <motion.div
                layout
                className={`absolute font-black text-slate-900/4 pointer-events-none select-none z-0 tracking-tighter ${isActive ? 'top-4 right-8 text-8xl' : 'top-2 right-4 text-6xl'}`}
            >
                {currentYear}
            </motion.div>

            {/* 顶部标题栏 */}
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

            {/* 内容区域 */}
            <div className="relative p-5 flex-1 overflow-hidden z-10">

                {/* 1. 折叠态：单列混合时间线 */}
                {!isActive && (
                    <div className="relative h-full overflow-y-auto custom-scrollbar pr-2">
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

                                {timelineData.length === 0 && (
                                    <div className="p-4 text-center text-slate-400 text-xs font-mono">Loading Timeline...</div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* 2. 展开态：三轨并行垂直时间轴 */}
                {isActive && (
                    <div className="relative h-full overflow-y-auto custom-scrollbar pr-2">
                        <div className="relative min-h-full pb-20">
                            <div className="absolute top-0 bottom-0 left-0 right-0 flex justify-between px-30 pointer-events-none opacity-20">
                                <div className="w-0.5 h-full bg-blue-500 blur-[1px]" />
                                <div className="w-0.5 h-full bg-rose-500 blur-[1px]" />
                                <div className="w-0.5 h-full bg-emerald-500 blur-[1px]" />
                            </div>

                            <div className="sticky top-0 z-20 flex justify-between px-20 py-2 bg-white/40 backdrop-blur-md border-b border-white/30 mb-6 text-[20px] font-black text-slate-500/80 tracking-widest uppercase shadow-sm">
                                <span className="w-20 text-center text-blue-600/80">知识</span>
                                <span className="w-20 text-center text-rose-600/80">社交</span>
                                <span className="w-20 text-center text-emerald-600/80">艺体</span>
                            </div>

                            <div className="space-y-8 relative px-4 pb-12">
                                {timelineData.map((item, index) => {
                                    const isLastInYear = index === timelineData.length - 1 || getYear(item.date) !== getYear(timelineData[index + 1].date);
                                    const itemYear = getYear(item.date);

                                    return (
                                        <React.Fragment key={item.id}>
                                            <div className="flex flex-col w-full items-center">
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

                {!isActive && (
                    <div className="absolute bottom-0 left-0 right-0 h-8 bg-linear-to-t from-white/60 to-transparent pointer-events-none" />
                )}
            </div>
        </motion.div>
    );
}