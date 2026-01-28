"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Wrench,
    ExternalLink,
    Box
} from 'lucide-react';

// === 数据定义 ===
interface ToolItem {
    id: string;
    name: string;
    desc: string;
    simpleIcon: string;   // 路径: /images/icons/simple/...
    colorfulIcon: string; // 路径: /images/icons/colorful/...
    url: string;
}

const TOOLS: ToolItem[] = [
    {
        id: 'notion',
        name: 'Notion',
        desc: '第二大脑 / 知识库 / 个人笔记',
        simpleIcon: '/images/icons/simple/notion.png',
        colorfulIcon: '/images/icons/colorful/notion.png',
        url: 'https://notion.so'
    },
    {
        id: 'zotero',
        name: 'Zotero',
        desc: '论文文献库 / PDF 归档与引用',
        simpleIcon: '/images/icons/simple/zotero.png',
        colorfulIcon: '/images/icons/colorful/zotero.png',
        url: 'https://www.zotero.org'
    },
    {
        id: 'bilibili',
        name: 'Bilibili',
        desc: '学习资源 / 视频创作 / 灵感来源',
        simpleIcon: '/images/icons/simple/bilibili.png',
        colorfulIcon: '/images/icons/colorful/bilibili.png',
        url: 'https://www.bilibili.com'
    },
    {
        id: 'bangumi',
        name: 'Bangumi',
        desc: '动画档案 / 评分 / 番剧管理',
        simpleIcon: '/images/icons/simple/bangumi.png',
        colorfulIcon: '/images/icons/colorful/bangumi.png',
        url: 'https://bgm.tv'
    },
    {
        id: 'letterboxd',
        name: 'Letterboxd',
        desc: '电影日志 / 影评 / 观影记录',
        simpleIcon: '/images/icons/simple/letterboxd.png',
        colorfulIcon: '/images/icons/colorful/letterboxd.png',
        url: 'https://letterboxd.com'
    },
];

interface ToolboxWidgetProps {
    isActive: boolean;
    onToggle: () => void;
}

export default function ToolboxWidget({ isActive, onToggle }: ToolboxWidgetProps) {
    return (
        <motion.div
            layout
            transition={{
                type: "spring",
                stiffness: 120,
                damping: 25,
                mass: 1
            }}
            onClick={!isActive ? onToggle : undefined}
            className={`
                fixed flex flex-col backdrop-blur-xl bg-white/80 border border-white/60 
                rounded-2xl shadow-lg ring-1 ring-slate-900/5 overflow-hidden group 
                hover:bg-white/95 transition-[shadow,background-color] duration-300
                ${isActive
                    ? 'z-50 inset-10 md:inset-x-[20%] md:inset-y-[15%]'
                    : 'z-30 top-[540px] right-[2.5%] w-[360px] h-[140px] cursor-pointer hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.2)]'
                }
            `}
        >
            {/* === 背景网格 === */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-size-[20px_20px] opacity-30 pointer-events-none" />

            {/* === 顶部栏 === */}
            <motion.div layout="position" className="flex items-center justify-between px-5 py-4 border-b border-slate-100/80 shrink-0 h-[60px] relative z-10">
                <div className="flex items-center gap-3">
                    <Wrench size={20} className="text-slate-400" />
                    <span className="font-mono font-bold text-slate-500 tracking-[0.2em] uppercase text-sm">
                        工具箱 // TOOLBOX
                    </span>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={(e) => { e.stopPropagation(); onToggle(); }}
                        className="p-1.5 rounded-md hover:bg-slate-100 text-slate-400 transition-colors"
                    >
                        {isActive ? <div className="w-4 h-1 bg-slate-400 rounded-full" /> : <Box size={16} />}
                    </button>
                </div>
            </motion.div>

            {/* === 内容区域 === */}
            <div className="flex-1 relative bg-slate-50/30 overflow-hidden">
                <AnimatePresence mode="wait">
                    {!isActive ? (
                        /* 1. 收起态 (Simple Icons) */
                        <motion.div
                            key="idle-view"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 p-5 flex flex-col justify-center"
                        >
                            <div className="space-y-4">
                                <div className="flex items-center justify-between text-xs text-slate-400 font-mono tracking-wider mb-1">
                                    <span>UTILITY_STORAGE</span>
                                    <span>STABLE</span>
                                </div>

                                <div className="flex items-center justify-between px-2">
                                    {TOOLS.map((tool) => (
                                        <div key={tool.id} className="relative group/icon">
                                            <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-slate-100 shadow-sm opacity-60 grayscale group-hover/icon:grayscale-0 group-hover/icon:opacity-100 group-hover/icon:border-blue-200 transition-all duration-300">
                                                <img src={tool.simpleIcon} alt={tool.name} className="w-6 h-6 object-contain" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    ) : (
                        /* 2. 展开态 (Colorful Icons) */
                        <motion.div
                            key="active-view"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0, transition: { delay: 0.2 } }}
                            exit={{ opacity: 0 }}
                            className="h-full p-6 overflow-y-auto custom-scrollbar"
                        >
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {TOOLS.map((tool) => (
                                    <a
                                        key={tool.id}
                                        href={tool.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        onClick={(e) => e.stopPropagation()}
                                        className="group/card relative bg-white/50 backdrop-blur-sm border border-slate-200 rounded-2xl p-5 flex items-center gap-5 hover:bg-white hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                                    >
                                        {/* 图标槽位 */}
                                        <div className="w-16 h-16 shrink-0 rounded-2xl bg-white shadow-[inset_0_2px_8px_rgba(0,0,0,0.06)] border border-slate-100 flex items-center justify-center group-hover/card:shadow-md transition-shadow">
                                            <img src={tool.colorfulIcon} alt={tool.name} className="w-10 h-10 object-contain" />
                                        </div>

                                        {/* 文字信息 */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between mb-1">
                                                <h3 className="text-base font-bold text-slate-800">{tool.name}</h3>
                                                <ExternalLink size={14} className="text-slate-300 group-hover/card:text-blue-500 transition-colors" />
                                            </div>
                                            <p className="text-xs text-slate-500 leading-relaxed">
                                                {tool.desc}
                                            </p>
                                        </div>
                                    </a>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
}