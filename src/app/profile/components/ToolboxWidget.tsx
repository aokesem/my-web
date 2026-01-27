"use client";

import React from 'react';
import { motion } from 'framer-motion';
import {
    Database,
    BookMarked,
    Github,
    Figma,
    Cloud,
    Bot,
    Box,
    ExternalLink,
    Wrench
} from 'lucide-react';

// === 数据定义 ===
interface ToolItem {
    id: string;
    name: string;
    desc: string; // 存储内容的说明
    icon: any;
    color: string; // 品牌色/强调色
    bg: string;    // 背景色
    url?: string;  // 跳转链接
}

const TOOLS: ToolItem[] = [
    {
        id: 'notion',
        name: 'Notion',
        desc: '第二大脑 / 知识库 / 读书笔记',
        icon: Database,
        color: 'text-slate-800',
        bg: 'bg-slate-100',
        url: 'https://notion.so'
    },
    {
        id: 'zotero',
        name: 'Zotero',
        desc: '论文文献库 / PDF 归档',
        icon: BookMarked,
        color: 'text-rose-600',
        bg: 'bg-rose-50',
        url: '#'
    },
    {
        id: 'github',
        name: 'GitHub',
        desc: '代码仓库 / 开源项目贡献',
        icon: Github,
        color: 'text-slate-900',
        bg: 'bg-slate-200',
        url: 'https://github.com'
    },
    {
        id: 'figma',
        name: 'Figma',
        desc: 'UI 设计稿 / 灵感碎片',
        icon: Figma,
        color: 'text-purple-500',
        bg: 'bg-purple-50',
        url: 'https://figma.com'
    },
    {
        id: 'vercel',
        name: 'Vercel',
        desc: '项目部署 / 域名管理',
        icon: Cloud,
        color: 'text-black',
        bg: 'bg-white border-slate-200',
        url: 'https://vercel.com'
    },
    {
        id: 'gpt',
        name: 'ChatGPT',
        desc: 'AI 辅助 / 创意激荡',
        icon: Bot,
        color: 'text-emerald-600',
        bg: 'bg-emerald-50',
        url: 'https://chat.openai.com'
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
                    ? 'z-50 inset-x-4 bottom-4 h-[350px] md:inset-x-[20%] md:bottom-[10%] md:h-[400px] md:w-auto'
                    // ^ 展开时：位于屏幕下方中央的大面板
                    : 'z-30 top-[540px] right-[2.5%] w-[360px] h-[100px] cursor-pointer hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.2)]'
                // ^ 收起时：紧凑的长条，放在计划板(DailyProtocol)下方
                }
            `}
        >
            {/* === 顶部栏 === */}
            <motion.div layout="position" className="flex items-center justify-between px-5 py-3 border-b border-slate-100/80 shrink-0 h-[50px]">
                <div className="flex items-center gap-3">
                    <Wrench size={18} className="text-slate-400" />
                    <span className="font-mono font-bold text-slate-500 tracking-[0.2em] uppercase text-xs">
                        工具箱 // TOOLBOX
                    </span>
                </div>

                {/* 装饰性的小灯 */}
                <div className="flex gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                    <div className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-amber-400 animate-pulse' : 'bg-slate-300'}`} />
                </div>
            </motion.div>

            {/* === 内容区域 === */}
            <div className="flex-1 relative bg-slate-50/50 p-4 overflow-hidden">

                {/* 1. 收起态：快速启动栏 */}
                {!isActive && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 flex items-center justify-between px-6"
                    >
                        {TOOLS.slice(0, 5).map((tool, i) => (
                            <div key={tool.id} className="relative group/icon">
                                <div className={`p-2 rounded-lg ${tool.bg} opacity-70 grayscale group-hover/icon:grayscale-0 group-hover/icon:opacity-100 transition-all`}>
                                    <tool.icon size={18} className={tool.color} />
                                </div>
                            </div>
                        ))}
                        <div className="w-px h-6 bg-slate-200" />
                        <Box size={18} className="text-slate-300" />
                    </motion.div>
                )}

                {/* 2. 展开态：详细网格 */}
                {isActive && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="grid grid-cols-2 md:grid-cols-3 gap-4 h-full overflow-y-auto custom-scrollbar content-start"
                    >
                        {TOOLS.map((tool) => (
                            <a
                                key={tool.id}
                                href={tool.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()} // 防止点击跳转时关闭窗口
                                className="relative flex flex-col p-4 bg-white border border-slate-100 rounded-xl hover:shadow-md hover:border-blue-200 hover:-translate-y-1 transition-all group/card cursor-pointer"
                            >
                                {/* 头部：图标 + 名字 */}
                                <div className="flex items-center justify-between mb-3">
                                    <div className={`p-2.5 rounded-lg ${tool.bg}`}>
                                        <tool.icon size={20} className={tool.color} />
                                    </div>
                                    <ExternalLink size={14} className="text-slate-300 opacity-0 group-hover/card:opacity-100 transition-opacity" />
                                </div>

                                {/* 名字 */}
                                <h3 className="text-sm font-bold text-slate-700 mb-1">{tool.name}</h3>

                                {/* 说明文字 */}
                                <p className="text-[11px] text-slate-400 font-medium leading-relaxed">
                                    {tool.desc}
                                </p>

                                {/* 装饰角标 */}
                                <div className="absolute bottom-2 right-2 w-1 h-1 bg-slate-200 rounded-full opacity-0 group-hover/card:opacity-100 transition-opacity" />
                            </a>
                        ))}
                    </motion.div>
                )}
            </div>
        </motion.div>
    );
}