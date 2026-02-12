"use client";

import React from 'react';
import { motion } from 'framer-motion';
import {
    ArrowLeft,
    BookOpen,
    Code,
    Palette,
    Calendar,
    Tag,
    FileText,
    MessageCircle,
    ArrowRight
} from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

// === Board metadata ===
const BOARD_META: Record<string, { title: string, enTitle: string, icon: any, color: string, accentBg: string }> = {
    learning: {
        title: '学习笔记',
        enTitle: 'Learning Notes',
        icon: BookOpen,
        color: 'text-teal-500',
        accentBg: 'bg-teal-50',
    },
    programming: {
        title: 'AI与编程',
        enTitle: 'AI & Programming',
        icon: Code,
        color: 'text-emerald-500',
        accentBg: 'bg-emerald-50',
    },
    creative: {
        title: 'AI与创作',
        enTitle: 'AI & Creativity',
        icon: Palette,
        color: 'text-cyan-500',
        accentBg: 'bg-cyan-50',
    },
};

// === Mock Articles (To be replaced by Supabase later) ===
const MOCK_ARTICLES: Record<string, Array<{
    slug: string,
    title: string,
    date: string,
    tags: string[],
    type: 'long' | 'short',
    excerpt: string,
}>> = {
    learning: [
        {
            slug: 'understanding-attention',
            title: '理解注意力机制：从直觉到数学',
            date: '2026-02-10',
            tags: ['Transformer', 'Attention', '基础'],
            type: 'long',
            excerpt: '注意力机制是现代大语言模型的核心。本文从最直觉的角度出发，逐步推导出 Scaled Dot-Product Attention 的数学公式，并解释为什么它如此有效。',
        },
        {
            slug: 'first-finetune',
            title: '第一次微调模型的踩坑记录',
            date: '2026-02-08',
            tags: ['Fine-tuning', '实践'],
            type: 'long',
            excerpt: '尝试用 LoRA 微调一个 7B 参数的模型，从环境配置到数据准备、训练到评估，记录了整个过程中遇到的问题和解决方案。',
        },
        {
            slug: 'random-thought-01',
            title: '关于 AI 学习路径的一些想法',
            date: '2026-02-06',
            tags: ['随想'],
            type: 'short',
            excerpt: '学习AI不应该从论文开始，而应该从建立直觉开始。先理解"它在做什么"，再理解"它为什么这样做"。',
        },
    ],
    programming: [
        {
            slug: 'copilot-workflow',
            title: 'AI辅助编程的个人工作流',
            date: '2026-02-09',
            tags: ['Copilot', '工作流', '效率'],
            type: 'long',
            excerpt: '总结了自己在日常开发中如何高效使用 AI 编程助手，包括提示词策略、代码审查流程、以及何时应该关掉它。',
        },
        {
            slug: 'ai-debug-note',
            title: '让AI帮我Debug的有趣经历',
            date: '2026-02-05',
            tags: ['Debug', '趣事'],
            type: 'short',
            excerpt: 'AI找到了一个我盯了两小时都没发现的 off-by-one 错误，但它给出的解释完全是错的。',
        },
    ],
    creative: [
        {
            slug: 'ai-music-experiment',
            title: 'AI作曲实验：风格迁移的可能性',
            date: '2026-02-07',
            tags: ['音乐', 'Style Transfer'],
            type: 'long',
            excerpt: '尝试将一首古典钢琴曲的"风格"迁移到电子音乐上，记录工具选择、参数调节和最终效果。',
        },
    ],
};

export default function BoardPage() {
    const params = useParams();
    const router = useRouter();
    const boardId = params.board as string;
    const board = BOARD_META[boardId] || BOARD_META['learning'];
    const articles = MOCK_ARTICLES[boardId] || [];

    return (
        <div className="relative min-h-screen bg-[#f8fbf9] text-slate-800 selection:bg-teal-100 font-sans">
            {/* Background Texture */}
            <div className="fixed inset-0 z-0 opacity-30 pointer-events-none mix-blend-multiply"
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.5'/%3E%3C/svg%3E")` }}
            />
            <div className="fixed inset-0 z-0 opacity-[0.04] pointer-events-none"
                style={{ backgroundImage: `radial-gradient(#2dd4bf 0.5px, transparent 0.5px)`, backgroundSize: '32px 32px' }}
            />

            {/* Header */}
            <header className="relative z-10 max-w-4xl mx-auto px-8 pt-16 pb-12">
                <Link
                    href="/library/garden"
                    className="group inline-flex items-center gap-2 mb-8 text-stone-400 hover:text-teal-600 transition-colors"
                >
                    <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                    <span className="text-xs font-mono font-bold uppercase tracking-widest">Back to Garden</span>
                </Link>

                <div className="flex items-center gap-6">
                    <div className={`p-5 rounded-3xl bg-white shadow-sm border border-stone-100 ${board.color}`}>
                        <board.icon size={32} />
                    </div>
                    <div>
                        <h1 className="text-4xl font-serif font-bold text-stone-800">{board.title}</h1>
                        <p className="text-sm font-mono text-stone-400 mt-1 uppercase tracking-widest">
                            Specimen_Log // {boardId}_observations
                        </p>
                    </div>
                </div>

                {/* Horizontal rule with growth indicator */}
                <div className="mt-8 flex items-center gap-3">
                    <div className="flex-1 h-px bg-stone-200/60" />
                    <span className="text-[9px] font-mono text-teal-400 font-bold uppercase tracking-widest">
                        {articles.length} Entries Recorded
                    </span>
                    <div className="flex-1 h-px bg-stone-200/60" />
                </div>
            </header>

            {/* Article List */}
            <main className="relative z-10 max-w-4xl mx-auto px-8 pb-32">
                <div className="space-y-6">
                    {articles.length > 0 ? (
                        articles.map((article, idx) => (
                            <motion.article
                                key={article.slug}
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.06 }}
                                onClick={() => router.push(`/library/garden/${boardId}/${article.slug}`)}
                                className="group relative cursor-pointer"
                            >
                                <div className={`
                                    relative bg-white/70 backdrop-blur-sm border border-stone-100 rounded-2xl overflow-hidden
                                    hover:bg-white hover:shadow-lg hover:shadow-teal-900/5 hover:border-teal-200/50
                                    transition-all duration-300
                                    ${article.type === 'short' ? 'border-l-2 border-l-teal-200' : ''}
                                `}>
                                    {/* Type indicator */}
                                    <div className="absolute top-4 right-4">
                                        <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase tracking-wider
                                            ${article.type === 'long'
                                                ? 'bg-teal-50 text-teal-500'
                                                : 'bg-stone-50 text-stone-400'
                                            }`}
                                        >
                                            {article.type === 'long' ? <FileText size={10} /> : <MessageCircle size={10} />}
                                            {article.type === 'long' ? 'Article' : 'Note'}
                                        </div>
                                    </div>

                                    <div className={`p-6 ${article.type === 'long' ? 'py-8' : 'py-5'}`}>
                                        {/* Title */}
                                        <h2 className={`font-serif font-bold text-stone-800 group-hover:text-teal-600 transition-colors pr-20
                                            ${article.type === 'long' ? 'text-xl' : 'text-base'}
                                        `}>
                                            {article.title}
                                        </h2>

                                        {/* Meta row */}
                                        <div className="flex items-center gap-4 mt-3 text-[11px] font-mono text-stone-400">
                                            <span className="flex items-center gap-1">
                                                <Calendar size={11} />
                                                {article.date}
                                            </span>
                                            <div className="flex items-center gap-1.5">
                                                <Tag size={11} />
                                                {article.tags.map(tag => (
                                                    <span key={tag} className="px-1.5 py-0.5 rounded bg-stone-50 text-stone-400 text-[10px]">
                                                        {tag}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Excerpt */}
                                        <p className="mt-4 text-sm text-stone-500 leading-relaxed line-clamp-2">
                                            {article.excerpt}
                                        </p>

                                        {/* Read more indicator (long articles only) */}
                                        {article.type === 'long' && (
                                            <div className="mt-5 flex items-center gap-2 text-xs font-mono text-stone-300 group-hover:text-teal-500 transition-colors">
                                                <span className="font-bold uppercase tracking-wider">Read More</span>
                                                <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </motion.article>
                        ))
                    ) : (
                        <div className="flex flex-col items-center justify-center py-32 border-2 border-dashed border-teal-200/50 rounded-3xl opacity-50">
                            <BookOpen size={48} className="mb-4 text-teal-200" />
                            <p className="font-mono text-sm tracking-widest uppercase text-stone-400">No Observations Yet_</p>
                        </div>
                    )}
                </div>
            </main>

            {/* Side reading flow indicator */}
            <div className="fixed left-8 bottom-8 z-20 pointer-events-none md:block hidden">
                <div className="h-24 w-px bg-teal-200/40 ml-2" />
                <div className="text-[10px] font-mono text-teal-300/60 rotate-90 origin-left mt-4 uppercase tracking-[0.3em]">
                    Growth_Log // Board: {boardId}
                </div>
            </div>
        </div>
    );
}
