"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Wrench,
    ExternalLink,
    Box,
    FileText,
    ChevronLeft,
    ChevronRight
} from 'lucide-react';

// === 数据定义 ===
interface ToolItem {
    id: string;
    name: string;
    tagline: string;      // 短描述：工具定位
    usage: string;        // 详细描述：个人信息沉淀/使用习惯
    simpleIcon: string;   // 路径: /images/icons/simple/...
    colorfulIcon: string; // 路径: /images/icons/colorful/...
    url: string;
}

const TOOLS: ToolItem[] = [
    {
        id: 'notion',
        name: 'Notion',
        tagline: '第二大脑 // 知识库',
        usage: '这里记录了我的完整知识图谱。包含从 2023 年开始的 300+ 篇深度学习笔记、跨学科研究文档，以及所有的项目复盘记录。是我进行思维发散与逻辑归档的核心场所。',
        simpleIcon: '/images/icons/simple/notion.png',
        colorfulIcon: '/images/icons/colorful/notion.png',
        url: 'https://notion.so'
    },
    {
        id: 'zotero',
        name: 'Zotero',
        tagline: '论文文献库 // 引用管理',
        usage: '专门用于学术归档。目前分类管理了关于 LLM 架构、认知科学以及交互设计的 500+ 篇核心论文。通过插件实现了与 Notion 的无缝同步，所有的标注都会自动转化为我的笔记素材。',
        simpleIcon: '/images/icons/simple/zotero.png',
        colorfulIcon: '/images/icons/colorful/zotero.png',
        url: 'https://www.zotero.org'
    },
    {
        id: 'bilibili',
        name: 'Bilibili',
        tagline: '灵感源泉 // 内容创作',
        usage: '除了日常学习，也是我 MAD 制作的投稿地。收藏夹内沉淀了大量剪辑转场参考、审美趋势分析视频。同时也记录并关注着业界顶尖的视觉设计博主动向。',
        simpleIcon: '/images/icons/simple/bilibili.png',
        colorfulIcon: '/images/icons/colorful/bilibili.png',
        url: 'https://www.bilibili.com'
    },
    {
        id: 'calibre',
        name: 'Calibre',
        tagline: '电子书仓库 // 私有书架',
        usage: '本地书籍管理的终极方案。管理着我的 1000+ 本 ePub/PDF 藏书，涵盖了大量已经绝版的人文社科类书籍，并通过一键推送功能将书籍同步到全平台。',
        simpleIcon: '/images/icons/simple/calibreweb.png',
        colorfulIcon: '/images/icons/colorful/calibre.png',
        url: 'https://calibre-ebook.com/'
    },
    {
        id: 'bangumi',
        name: 'Bangumi',
        tagline: '番剧档案 // 评分系统',
        usage: '二次元生活的完整数字化记录。记录了我看过、正在看以及想看的所有番剧。每一部高分作品都附带了简短的个人锐评，是我构建角色与叙事审美参考的重要数据库。',
        simpleIcon: '/images/icons/simple/bangumi.png',
        colorfulIcon: '/images/icons/colorful/bangumi.png',
        url: 'https://bgm.tv'
    },
    {
        id: 'osm',
        name: 'OSM',
        tagline: '开放地图 // 地理信息',
        usage: '作为一个地理信息爱好者，OpenStreetMap 是我观察真实世界数字孪生的窗口。我在这里记录了自己旅行过的航迹信息，并关注着城市空间的微小变迁。',
        simpleIcon: '/images/icons/simple/openstreetmap.png',
        colorfulIcon: '/images/icons/colorful/openstreetmap.png',
        url: 'https://www.openstreetmap.org'
    },
    {
        id: 'letterboxd',
        name: 'Letterboxd',
        tagline: '电影日志 // 影评归档',
        usage: '作为影迷的自留地。详细记录了每部电影的观影日期、地点以及长篇影评。通过数据墙直观展示我的年度观影趋势，是分析个人叙述节奏与构图偏好的工具。',
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
    // 轮播状态：当前的起始索引
    const [startIndex, setStartIndex] = useState(0);
    const VISIBLE_COUNT = 5; // 每次展示 5 个

    const handleNext = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (startIndex + VISIBLE_COUNT < TOOLS.length) {
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
            className={`
                fixed flex flex-col backdrop-blur-xl bg-white/80 border border-white/60 
                rounded-2xl ring-1 ring-slate-900/5 overflow-hidden group 
                hover:bg-white/95 transition-[shadow,background-color] duration-300
                ${isActive
                    ? 'z-50 inset-10 md:inset-x-[15%] md:inset-y-[12%] shadow-2xl'
                    : 'z-30 top-[540px] right-[2.5%] w-[360px] h-[120px] cursor-pointer shadow-[0_20px_40px_-10px_rgba(0,0,0,0.2),inset_0_1px_4px_rgba(0,0,0,0.02)]'
                }
            `}
        >
            {/* === 背景点阵 (Dot Matrix) === */}
            <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1.5px,transparent_1.5px)] bg-size-[16px_16px] opacity-30 pointer-events-none" />

            {/* === 顶部栏 === */}
            <motion.div layout="position" className="flex items-center justify-between px-6 py-4 border-b border-slate-100/80 shrink-0 h-[64px] relative z-10">
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
            </motion.div>

            {/* === 内容区域 === */}
            <div className="flex-1 relative bg-slate-50/20 overflow-hidden">
                <AnimatePresence mode="wait">
                    {!isActive ? (
                        /* 1. 收起态：Logo 轮播 (Carousel View) */
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
                                <motion.div
                                    className="flex items-center justify-between"
                                    animate={{ x: 0 }} // 此处使用 flex 布局的自然排列，通过 startIndex 过滤展示
                                >
                                    <div className="flex items-center gap-3 mx-auto">
                                        {TOOLS.slice(startIndex, startIndex + VISIBLE_COUNT).map((tool) => (
                                            <motion.div
                                                layoutId={tool.id}
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
                            </div>

                            {/* 右切换按钮 */}
                            <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={handleNext}
                                disabled={startIndex + VISIBLE_COUNT >= TOOLS.length}
                                className={`p-1 rounded-full bg-white/80 shadow-sm border border-slate-100 text-slate-400 hover:text-blue-500 z-20 transition-opacity ${startIndex + VISIBLE_COUNT >= TOOLS.length ? 'opacity-0 cursor-default' : 'opacity-0 group-hover/carousel:opacity-100'}`}
                            >
                                <ChevronRight size={16} strokeWidth={3} />
                            </motion.button>
                        </motion.div>
                    ) : (
                        /* 2. 展开态：详细档案排版 (Personal Notes Style) */
                        <motion.div
                            key="active-view"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="h-full p-8 overflow-y-auto custom-scrollbar"
                        >
                            <div className="max-w-6xl mx-auto">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {TOOLS.map((tool) => (
                                        <div
                                            key={tool.id}
                                            className="group/card relative flex flex-col sm:flex-row gap-6 bg-white/40 border border-slate-100 rounded-2xl p-6 hover:bg-white hover:shadow-xl transition-all duration-300 overflow-hidden"
                                        >
                                            {/* 背景装饰 */}
                                            <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover/card:opacity-[0.08] transition-opacity">
                                                <FileText size={80} />
                                            </div>

                                            {/* 左侧：拟物图标 + 链接 */}
                                            <div className="flex flex-col items-center gap-4 shrink-0">
                                                <div className="w-20 h-20 rounded-2xl bg-white shadow-md border border-slate-50 flex items-center justify-center p-3 relative">
                                                    <img src={tool.colorfulIcon} alt={tool.name} className="w-full h-full object-contain" />
                                                </div>
                                                <a
                                                    href={tool.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="flex items-center gap-1.5 text-[10px] font-black text-blue-500 hover:text-blue-600 transition-colors uppercase tracking-[0.2em] bg-blue-50 px-3 py-1 rounded-full border border-blue-100/50"
                                                >
                                                    Access <ExternalLink size={10} />
                                                </a>
                                            </div>

                                            {/* 右侧：详细记录 */}
                                            <div className="flex-1 min-w-0 pt-1">
                                                <div className="flex items-baseline gap-2 mb-2">
                                                    <h3 className="text-lg font-black text-slate-800 tracking-tight">{tool.name}</h3>
                                                    <span className="text-[10px] font-mono font-bold text-slate-300 uppercase tracking-widest">{tool.tagline}</span>
                                                </div>
                                                <div className="relative">
                                                    {/* 修饰竖线 */}
                                                    <div className="absolute left-0 top-1 bottom-1 w-0.5 bg-blue-100/60 rounded-full" />
                                                    <p className="pl-4 text-xs text-slate-500 leading-relaxed font-medium">
                                                        {tool.usage}
                                                    </p>
                                                </div>

                                                {/* 底部装饰 */}
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