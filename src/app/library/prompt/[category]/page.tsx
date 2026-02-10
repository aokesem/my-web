"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowLeft,
    Copy,
    Check,
    FileText,
    ExternalLink,
    Terminal,
    MessageSquare,
    SearchCode,
    Sparkles,
    Cpu,
    Archive
} from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import ReactMarkdown from 'react-markdown';

// === Mock Data (To be replaced by Supabase later) ===
const MOCK_PROMPTS: Record<string, { title: string, icon: any, color: string, prompts: any[] }> = {
    search: {
        title: '信息搜索',
        icon: SearchCode,
        color: 'text-blue-500',
        prompts: [
            { id: 1, name: '深度学术研究', content: '## Role: 资深学术研究员\n\n### Task: 深度文献综述\n\n请针对 [关键词] 进行多维度的搜索与分析...\n\n### Constraints:\n- 引用必须包含 DOI\n- 区分核心期刊与普通期刊' },
            { id: 2, name: '多源结构化提取', content: '## Task: 结构化信息提取\n\n从以下原始文本中提取 [实体1], [实体2] 并以 JSON 格式输出...' }
        ]
    },
    chat: {
        title: '对话助手',
        icon: MessageSquare,
        color: 'text-emerald-500',
        prompts: [
            { id: 1, name: '多重格律对话器', content: '## Setting: 维多利亚时代学者\n\n请以极度礼貌且充满装饰性辞藻的方式回答我的问题...' }
        ]
    },
    coding: {
        title: '编程助手',
        icon: Terminal,
        color: 'text-orange-500',
        prompts: [
            { id: 1, name: 'TypeScript 架构重构', content: '## Role: 资深架构师\n\n### Task: 重构提供的 TS 代码\n\n**要求：**\n1. 遵守 SOLID 原则\n2. 减少冗余依赖\n3. 增加单元测试用例' },
            { id: 2, name: 'Git Commit 规范生成器', content: '根据以下代码变动，生成符合 Conventional Commits 规范的提交信息...' }
        ]
    },
    creative: {
        title: '创意写作',
        icon: Sparkles,
        color: 'text-purple-500',
        prompts: [
            { id: 1, name: '赛博朋克世界观构建', content: '请描述一个由大型企业统治的、充斥着霓虹灯与雨滴的贫民窟场景...' }
        ]
    },
    productivity: {
        title: '效率工具',
        icon: Cpu,
        color: 'text-slate-500',
        prompts: []
    },
    archive: {
        title: '历史存档',
        icon: Archive,
        color: 'text-stone-400',
        prompts: []
    }
};

export default function CategoryDetailPage() {
    const params = useParams();
    const categoryId = params.category as string;
    const categoryData = MOCK_PROMPTS[categoryId] || MOCK_PROMPTS['archive'];

    const [copiedId, setCopiedId] = useState<number | null>(null);

    const handleCopy = (id: number, content: string) => {
        navigator.clipboard.writeText(content);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    return (
        <div className="relative min-h-screen bg-[#fdfbf7] text-slate-800 selection:bg-orange-100 font-sans">
            {/* Background Texture */}
            <div className="fixed inset-0 z-0 opacity-40 pointer-events-none mix-blend-multiply"
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.5'/%3E%3C/svg%3E")` }}
            />
            <div className="fixed inset-0 z-0 opacity-[0.05] pointer-events-none"
                style={{ backgroundImage: `radial-gradient(#4a4a4a 1px, transparent 1px)`, backgroundSize: '32px 32px' }}
            />

            {/* Header Area */}
            <header className="relative z-10 max-w-5xl mx-auto px-8 pt-16 pb-12">
                <Link
                    href="/library/prompt"
                    className="group inline-flex items-center gap-2 mb-8 text-stone-400 hover:text-stone-800 transition-colors"
                >
                    <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                    <span className="text-xs font-mono font-bold uppercase tracking-widest">Back to Warehouse</span>
                </Link>

                <div className="flex items-center gap-6">
                    <div className={`p-5 rounded-3xl bg-white shadow-sm border border-stone-100 ${categoryData.color}`}>
                        <categoryData.icon size={32} />
                    </div>
                    <div>
                        <h1 className="text-4xl font-serif font-bold text-stone-800">{categoryData.title}</h1>
                        <p className="text-sm font-mono text-stone-400 mt-1 uppercase tracking-widest">Module // {categoryId}_protocol</p>
                    </div>
                </div>
            </header>

            {/* Content List */}
            <main className="relative z-10 max-w-5xl mx-auto px-8 pb-32">
                <div className="grid grid-cols-1 gap-12">
                    {categoryData.prompts.length > 0 ? (
                        categoryData.prompts.map((prompt) => (
                            <motion.section
                                key={prompt.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="group relative"
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-xl font-serif font-bold text-stone-700 flex items-center gap-3">
                                        <div className="w-1.5 h-6 bg-orange-500 rounded-full" />
                                        {prompt.name}
                                    </h2>
                                    <button
                                        onClick={() => handleCopy(prompt.id, prompt.content)}
                                        className={`
                                            flex items-center gap-2 px-4 py-1.5 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider transition-all
                                            ${copiedId === prompt.id
                                                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200'
                                                : 'bg-white text-stone-400 border border-stone-200 hover:border-orange-300 hover:text-orange-500 shadow-sm'}
                                        `}
                                    >
                                        {copiedId === prompt.id ? <Check size={12} /> : <Copy size={12} />}
                                        {copiedId === prompt.id ? 'Copied' : 'Copy_Prompt'}
                                    </button>
                                </div>

                                <div className="relative rounded-2xl bg-white/70 backdrop-blur-sm border border-stone-100 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] group-hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.08)] transition-all overflow-hidden">
                                    {/* Decoration Lines */}
                                    <div className="absolute top-0 bottom-0 left-8 w-px bg-stone-100/50 hidden md:block" />

                                    <div className="p-8 md:pl-16 prose prose-stone max-w-none">
                                        <div className="font-mono text-sm text-stone-600 leading-relaxed break-words whitespace-pre-wrap selection:bg-orange-200">
                                            <ReactMarkdown
                                                components={{
                                                    h1: ({ node, ...props }) => <h1 className="text-2xl font-serif font-bold mt-6 mb-4 text-stone-800" {...props} />,
                                                    h2: ({ node, ...props }) => <h2 className="text-xl font-serif font-bold mt-5 mb-3 text-stone-700" {...props} />,
                                                    h3: ({ node, ...props }) => <h3 className="text-lg font-serif font-bold mt-4 mb-2 text-stone-600" {...props} />,
                                                    code: ({ node, ...props }) => <code className="bg-stone-50 text-orange-600 px-1.5 py-0.5 rounded border border-stone-200" {...props} />,
                                                    strong: ({ node, ...props }) => <strong className="text-stone-800 font-black" {...props} />,
                                                    ul: ({ node, ...props }) => <ul className="list-disc pl-5 my-4 space-y-2" {...props} />,
                                                    li: ({ node, ...props }) => <li className="text-stone-500" {...props} />,
                                                }}
                                            >
                                                {prompt.content}
                                            </ReactMarkdown>
                                        </div>
                                    </div>

                                    {/* Bottom Tech Bar */}
                                    <div className="px-8 py-3 bg-stone-50/50 border-t border-stone-100 flex justify-between items-center text-[9px] font-mono text-stone-300">
                                        <span>ENCODING: UTF-8</span>
                                        <span>STATUS: ACTIVE</span>
                                    </div>
                                </div>
                            </motion.section>
                        ))
                    ) : (
                        <div className="flex flex-col items-center justify-center py-32 border-2 border-dashed border-stone-200 rounded-3xl opacity-40">
                            <Archive size={48} className="mb-4 text-stone-300" />
                            <p className="font-mono text-sm tracking-widest uppercase">No Modules Loaded_</p>
                        </div>
                    )}
                </div>
            </main>

            {/* Floating Navigation Indicator */}
            <div className="fixed left-8 bottom-8 z-20 pointer-events-none md:block hidden">
                <div className="h-24 w-px bg-stone-200 ml-2" />
                <div className="text-[10px] font-mono text-stone-300 rotate-90 origin-left mt-4 uppercase tracking-[0.3em]">
                    Reading_Flow // Category: {categoryId}
                </div>
            </div>
        </div>
    );
}
