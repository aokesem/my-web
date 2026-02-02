"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Wrench,
    ExternalLink,
    Box,
    FileText,
    ChevronLeft,
    ChevronRight
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

// === 数据定义 ===
// 1. 数据库结构
interface DBToolItem {
    id: number;
    name: string;
    tagline: string;
    usage_text: string; // 数据库字段名
    simple_icon: string;
    colorful_icon: string;
    url: string;
}

// 2. 前端组件使用的结构
interface ToolItem {
    id: number;
    name: string;
    tagline: string;
    usage: string;        // 映射后
    simpleIcon: string;   // 映射后
    colorfulIcon: string; // 映射后
    url: string;
}

interface ToolboxWidgetProps {
    isActive: boolean;
    onToggle: () => void;
}

export default function ToolboxWidget({ isActive, onToggle }: ToolboxWidgetProps) {
    const [startIndex, setStartIndex] = useState(0);
    const VISIBLE_COUNT = 5;

    // [修改] 状态管理
    const [tools, setTools] = useState<ToolItem[]>([]);

    // [新增] 获取数据
    useEffect(() => {
        const fetchTools = async () => {
            const { data, error } = await supabase
                .from('profile_tools')
                .select('*')
                .order('sort_order', { ascending: true }); // 按自定义顺序排序

            if (data) {
                // 字段映射：snake_case -> camelCase
                const mappedTools: ToolItem[] = data.map((item: DBToolItem) => ({
                    id: item.id,
                    name: item.name,
                    tagline: item.tagline,
                    usage: item.usage_text,
                    simpleIcon: item.simple_icon,
                    colorfulIcon: item.colorful_icon,
                    url: item.url
                }));
                setTools(mappedTools);
            }
        };
        fetchTools();
    }, []);

    const handleNext = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (startIndex + VISIBLE_COUNT < tools.length) {
            setStartIndex(prev => prev + 1);
        }
    };

    const handlePrev = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (startIndex > 0) {
            setStartIndex(prev => prev - 1);
        }
    };

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
            whileHover={!isActive ? { backgroundColor: "rgba(255, 255, 255, 0.95)" } : {}}
            className={`
                fixed flex flex-col backdrop-blur-xl bg-white/80 border border-white/60 
                rounded-2xl ring-1 ring-slate-900/5 overflow-hidden group 
                ${isActive
                    ? 'z-50 inset-10 md:inset-x-[15%] md:inset-y-[12%] shadow-2xl'
                    : 'z-30 top-[540px] right-[2.5%] w-[360px] h-[120px] cursor-pointer shadow-[0_20px_40px_-10px_rgba(0,0,0,0.2),inset_0_1px_4px_rgba(0,0,0,0.02)]'
                }
            `}
        >
            {/* 背景点阵 */}
            <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1.5px,transparent_1.5px)] bg-size-[16px_16px] opacity-30 pointer-events-none" />

            {/* 顶部栏 - [修改] 改为普通 div，移除 layout="position" 以消除抖动 */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100/80 shrink-0 h-[64px] relative z-10">
                <div className="flex items-center gap-3">
                    <Wrench size={20} className="text-slate-400" />
                    <span className="font-mono font-bold text-slate-500 tracking-[0.2em] uppercase text-sm">
                        工具箱 // TOOLBOX
                    </span>
                </div>

                <div className="flex items-center gap-4">
                    {isActive && (
                        <span className="text-[10px] font-mono font-black text-slate-300 tracking-widest uppercase hidden md:inline">Personal_Records_Vault</span>
                    )}
                    <button
                        onClick={(e) => { e.stopPropagation(); onToggle(); }}
                        className="p-1.5 rounded-md hover:bg-slate-100 text-slate-400 transition-colors"
                    >
                        {isActive ? <div className="w-4 h-1 bg-slate-400 rounded-full" /> : <Box size={16} />}
                    </button>
                </div>
            </div>

            {/* 内容区域 */}
            <div className="flex-1 relative bg-slate-50/20 overflow-hidden">
                <AnimatePresence mode="wait">
                    {!isActive ? (
                        /* 1. 收起态：Logo 轮播 */
                        <motion.div
                            key="idle-view"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 p-5 flex items-center justify-between group/carousel"
                        >
                            {/* 左切换按钮 */}
                            <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={handlePrev}
                                disabled={startIndex === 0}
                                className={`p-1 rounded-full bg-white/80 shadow-sm border border-slate-100 text-slate-400 hover:text-blue-500 z-20 transition-opacity ${startIndex === 0 ? 'opacity-0 cursor-default' : 'opacity-0 group-hover/carousel:opacity-100'}`}
                            >
                                <ChevronLeft size={16} strokeWidth={3} />
                            </motion.button>

                            {/* 窗口裁剪区域 */}
                            <div className="flex-1 overflow-hidden px-2">
                                {/* [修改] 增加空数据判断 */}
                                {tools.length > 0 ? (
                                    <motion.div
                                        className="flex items-center justify-between"
                                        animate={{ x: 0 }}
                                    >
                                        <div className="flex items-center gap-3 mx-auto">
                                            {tools.slice(startIndex, startIndex + VISIBLE_COUNT).map((tool) => (
                                                <motion.div
                                                    layoutId={`icon-${tool.id}`} // 确保 layoutId 唯一
                                                    key={tool.id}
                                                    className="relative group/icon shrink-0"
                                                >
                                                    <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-slate-100 shadow-sm opacity-60 grayscale group-hover/icon:grayscale-0 group-hover/icon:opacity-100 group-hover/icon:border-blue-200 transition-all duration-300">
                                                        <img src={tool.simpleIcon} alt={tool.name} className="w-6 h-6 object-contain" />
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </div>
                                    </motion.div>
                                ) : (
                                    <div className="text-center text-[10px] text-slate-400 font-mono">LOADING...</div>
                                )}
                            </div>

                            {/* 右切换按钮 */}
                            <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={handleNext}
                                disabled={startIndex + VISIBLE_COUNT >= tools.length}
                                className={`p-1 rounded-full bg-white/80 shadow-sm border border-slate-100 text-slate-400 hover:text-blue-500 z-20 transition-opacity ${startIndex + VISIBLE_COUNT >= tools.length ? 'opacity-0 cursor-default' : 'opacity-0 group-hover/carousel:opacity-100'}`}
                            >
                                <ChevronRight size={16} strokeWidth={3} />
                            </motion.button>
                        </motion.div>
                    ) : (
                        /* 2. 展开态：详细档案 */
                        <motion.div
                            key="active-view"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="h-full p-8 overflow-y-auto custom-scrollbar"
                        >
                            <div className="max-w-6xl mx-auto">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {tools.map((tool) => (
                                        <div
                                            key={tool.id}
                                            className="group/card relative flex flex-col sm:flex-row gap-6 bg-white/40 border border-slate-100 rounded-2xl p-6 hover:bg-white hover:shadow-xl transition-all duration-300 overflow-hidden"
                                        >
                                            <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover/card:opacity-[0.08] transition-opacity">
                                                <FileText size={80} />
                                            </div>

                                            <div className="flex flex-col items-center gap-4 shrink-0">
                                                <div className="w-20 h-20 rounded-2xl bg-white shadow-md border border-slate-50 flex items-center justify-center p-3 relative">
                                                    <img src={tool.colorfulIcon} alt={tool.name} className="w-full h-full object-contain" />
                                                </div>
                                                {tool.url ? (
                                                    <a
                                                        href={tool.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        onClick={(e) => e.stopPropagation()}
                                                        className="flex items-center gap-1.5 text-[10px] font-black text-blue-500 hover:text-blue-600 transition-colors uppercase tracking-[0.2em] bg-blue-50 px-3 py-1 rounded-full border border-blue-100/50"
                                                    >
                                                        Access <ExternalLink size={10} />
                                                    </a>
                                                ) : (
                                                    <span
                                                        className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 bg-slate-100/50 border border-slate-200/50 uppercase tracking-[0.2em] px-3 py-1 rounded-full cursor-not-allowed select-none"
                                                    >
                                                        No Link <ExternalLink size={10} />
                                                    </span>
                                                )}
                                            </div>

                                            <div className="flex-1 min-w-0 pt-1">
                                                <div className="flex items-baseline gap-2 mb-2">
                                                    <h3 className="text-lg font-black text-slate-800 tracking-tight">{tool.name}</h3>
                                                    <span className="text-[10px] font-mono font-bold text-slate-300 uppercase tracking-widest">{tool.tagline}</span>
                                                </div>
                                                <div className="relative">
                                                    <div className="absolute left-0 top-1 bottom-1 w-0.5 bg-blue-100/60 rounded-full" />
                                                    <p className="pl-4 text-xs text-slate-500 leading-relaxed font-medium">
                                                        {tool.usage}
                                                    </p>
                                                </div>

                                                <div className="mt-4 pt-3 border-t border-slate-100/50 flex items-center justify-between">
                                                    <span className="text-[9px] font-mono text-slate-300 font-bold uppercase">Archive_Status: ACTIVE</span>
                                                    <div className="flex gap-1">
                                                        {[1, 2, 3].map(i => <div key={i} className="w-1 h-1 rounded-full bg-slate-200" />)}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
}