"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
    ArrowLeft,
    BookOpen,
    Code,
    Palette,
    Sprout,
    ChevronLeft,
    ChevronRight,
} from 'lucide-react';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';

// ============================================================
// DATA
// ============================================================

const BOARDS = [
    { id: 'learning', title: '学习笔记', icon: BookOpen },
    { id: 'programming', title: 'AI与编程', icon: Code },
    { id: 'creative', title: 'AI与创作', icon: Palette },
];

interface Article {
    slug: string;
    title: string;
    date: string;
    tags: string[];
    content: string;
}

const ARTICLES: Record<string, Article[]> = {
    learning: [
        {
            slug: 'understanding-attention',
            title: '理解注意力机制：从直觉到数学',
            date: '2026-02-10',
            tags: ['Transformer', 'Attention', '基础'],
            content: `## 为什么需要注意力？

在传统的 RNN 中，信息需要按顺序传递。这意味着当句子很长时，早期的信息很容易被"遗忘"。注意力机制的核心思想是：**让模型能够直接关注输入中任何位置的信息**，而不必依赖顺序传递。

## 直觉理解

想象你在阅读一段很长的文字。当你遇到代词"它"时，你会自然地回头看前文，找到"它"指代的名词。这就是注意力——**有选择地聚焦于相关信息**。

在机器学习的语境中，这意味着模型可以学习到"当处理某个词时，应该更多地关注句子中的哪些其他词"。

## Query, Key, Value

注意力的三个核心概念可以用一个图书馆的类比来理解：

- **Query (Q)**：你的"问题"——你走进图书馆想要找的东西
- **Key (K)**：书架上每本书的"标签"——它们的主题分类
- **Value (V)**：书的"内容"——实际要获取的信息

你用你的 Query 去对比所有的 Key，找到最匹配的，然后取出对应的 Value。在 Self-Attention 中，Q、K、V 都来自同一个输入序列，只是通过不同的线性变换得到。

## 缩放点积注意力

核心公式：

\`\`\`
Attention(Q, K, V) = softmax(QK^T / √d_k) × V
\`\`\`

其中 d_k 是 Key 的维度。除以 √d_k 是一个关键的工程细节——当维度很大时，点积的值会变得很大，导致 softmax 输出趋向极端值（接近 0 或 1），这会让梯度消失。缩放因子解决了这个问题。

## 多头注意力

Multi-Head Attention 就是同时进行多组独立的注意力计算，每组关注不同的"方面"。就像你读一段文字时，可以同时关注语法关系、语义关系和位置关系。

| 维度 | 含义 | 示例 |
|------|------|------|
| 头 1 | 语法依赖 | 主语-谓语关系 |
| 头 2 | 语义相似 | 同义词关联 |
| 头 3 | 位置关系 | 上下文距离 |
| 头 4 | 指代关系 | 代词-实体链接 |

每个头独立计算后，结果拼接再经过一次线性变换。

## 小结

> 注意力机制的本质是一种**动态的、数据驱动的信息路由**。它让网络自己学习"在处理当前元素时，应该从哪里获取辅助信息"。

- Self-Attention 让每个位置都能"看到"所有位置
- 缩放因子防止梯度消失
- 多头机制捕获多维度关系
- 这就是 Transformer 能处理长距离依赖的关键`,
        },
        {
            slug: 'first-finetune',
            title: '第一次微调模型的踩坑记录',
            date: '2026-02-08',
            tags: ['Fine-tuning', '实践'],
            content: `## 背景

决定尝试用 LoRA 微调一个 7B 参数的 LLM，目标是让它在特定领域的问答上表现更好。这是一次从零开始的探索，记录了所有踩过的坑。

## 环境配置

第一个坑就出在环境上。\`bitsandbytes\` 在 Windows 上的安装非常不友好，折腾了大半天。

最终选择了 WSL2 + CUDA 11.8 的组合，一次成功。教训：**涉及 GPU 计算的项目，尽早切换到 Linux 环境**。

## 数据准备

数据格式是最让人困惑的部分。不同框架期望的格式完全不同：

| 格式 | 结构 | 适用场景 |
|------|------|----------|
| Alpaca | instruction + input + output | 指令跟随 |
| ShareGPT | conversations 数组 | 多轮对话 |
| OpenAI | messages 数组 | 通用对话 |

最终选择了 ShareGPT 格式，因为更接近真实的对话场景。

## 训练参数

关键参数的选择经验：

- **LoRA rank**: 16（太大会过拟合，太小表现不够好）
- **Learning rate**: 2e-4（先用大一点快速摸索，再减小精调）
- **Epochs**: 3（小数据集上更多 epoch 反而会过拟合）
- **Batch size**: 1 + gradient accumulation = 8

## 遇到的问题

**问题一：OOM**

Batch size 设为 4 直接爆显存。解决：改为 1 + gradient accumulation steps = 8，效果等价于 batch size 8 但显存占用大幅降低。

**问题二：Loss 不下降**

训了 200 步 loss 纹丝不动。排查发现是数据格式问题——模型根本没解析到有效的训练信号。修正格式后立刻正常。

**问题三：过拟合**

训练 loss 降到 0.1 以下，但验证效果很差。模型能完美复述训练数据，但稍微改一下问法就不行了。加了 dropout = 0.05 后明显好转。

## 收获

> 微调不是魔法。数据质量 > 数据数量 > 模型大小 > 训练技巧。

几条经验：
1. 先用 50 条数据跑通整个 pipeline
2. 评估要用多维度指标，不能只看 loss
3. 早停（early stopping）是你的好朋友
4. 记录每次实验的参数和结果，否则很快就会混乱`,
        },
        {
            slug: 'random-thought-01',
            title: '关于 AI 学习路径的一些想法',
            date: '2026-02-06',
            tags: ['随想'],
            content: `学习 AI 不应该从论文开始，而应该从建立直觉开始。

先理解"它在做什么"，再理解"它为什么这样做"。

太多人一上来就钻进数学公式里，结果是能推导但不理解。反过来，如果你先从宏观上理解了注意力机制就是"让模型自己选择关注什么"，那些公式就自然而然地有了意义。

## 我建议的学习路径

1. 看直觉性的科普视频（3Blue1Brown, StatQuest）
2. 用代码动手实现简化版本
3. 回头看论文，对照实现理解细节
4. 在真实项目中应用

每一步都会加深前一步的理解。跳过任何一步都会让后续的学习效率大打折扣。

> 最好的学习方式不是"读懂"，而是"做出来"。`,
        },
    ],
    programming: [
        {
            slug: 'copilot-workflow',
            title: 'AI辅助编程的个人工作流',
            date: '2026-02-09',
            tags: ['Copilot', '工作流', '效率'],
            content: `## 我的 AI 编程工作流

经过半年多的使用，我总结出了一套比较有效的 AI 辅助编程流程。核心原则是：**让 AI 做它擅长的，自己做需要深度理解的**。

## 何时用 AI

| 场景 | 推荐度 | 原因 |
|------|:------:|------|
| 样板代码 | ⭐⭐⭐ | AI 最擅长的领域 |
| 测试生成 | ⭐⭐⭐ | 重复性高，AI 效率远超手写 |
| 文档注释 | ⭐⭐⭐ | AI 能生成高质量的 JSDoc |
| API 探索 | ⭐⭐ | 快速了解不熟悉的库 |
| 核心逻辑 | ⭐ | 需要深度理解，AI 容易出错 |
| 安全代码 | ❌ | 绝对不能依赖 AI |

## 提示词策略

最重要的一点：**给 AI 足够的上下文**。

不好的提示：

> 帮我写一个排序函数

好的提示：

> 我需要一个函数，对 Product 对象数组按价格降序排序，相同价格时按名称字母序排列。Product 的类型定义是 \`{ name: string, price: number }\`。使用 TypeScript，不需要处理 null/undefined。

## 代码审查流程

1. AI 生成代码后，**一定要自己读一遍**
2. 关注边界条件和错误处理
3. 检查是否引入了不必要的依赖
4. 确认命名和风格与项目一致

## 何时关掉 AI

当你发现自己在反复修改 AI 的输出，试图让它"理解"你要什么时——关掉它，自己写可能更快。

> AI 是加速器，不是替代品。如果它在拖慢你，那就不需要它。`,
        },
        {
            slug: 'ai-debug-note',
            title: '让AI帮我Debug的有趣经历',
            date: '2026-02-05',
            tags: ['Debug', '趣事'],
            content: `今天遇到一个有趣的事情。

一个分页组件，第 2 页的数据总是和第 1 页相同。我盯着代码看了快两个小时，怎么都找不到问题。

把代码丢给 AI 后，它立刻指出：\`offset\` 的计算用了 \`page\` 而不是 \`page - 1\`，导致 offset 总是多了一页的量。

经典的 off-by-one 错误。

但有趣的是，AI 给出的**解释**完全是错的。它说"因为数组索引从 0 开始所以需要减 1"——实际原因是我的 API 分页是从 0 开始的，而前端的页码是从 1 开始的。

> **结论：AI 找 bug 很厉害，但"理解" bug 的能力还有待提高。**

它能快速定位模式上的异常，但对业务逻辑和上下文的理解仍然是浅层的。这也说明了为什么代码审查不能完全交给 AI。`,
        },
    ],
    creative: [
        {
            slug: 'ai-music-experiment',
            title: 'AI作曲实验：风格迁移的可能性',
            date: '2026-02-07',
            tags: ['音乐', 'Style Transfer'],
            content: `## 实验目标

将一首肖邦夜曲的"音乐风格"迁移到电子音乐的框架中，看看 AI 能否保留古典音乐的和声美感，同时赋予它电子音乐的节奏和音色。

## 工具对比

| 工具 | 优势 | 劣势 | 评分 |
|------|------|------|:----:|
| Suno | 生成质量好 | 风格控制差 | 7/10 |
| Udio | 风格混合好 | 一致性不足 | 7/10 |
| MusicGen | 可控性强 | 音质偏低 | 6/10 |

最终选择了 MusicGen，因为需要对生成过程有更多控制。

## 关键参数发现

- **Temperature > 1.2** 会让音乐变得混乱无序
- **Top-k = 250** 在多样性和连贯性之间取得较好平衡
- 给模型提供 **5 秒的引导片段** 效果比纯文字描述好得多
- 使用否定提示（"no drums, no bass drop"）能有效约束输出

## 结果评估

最终生成了 3 段各 30 秒的音乐。主观评价：

> 和声进行确实保留了一些"肖邦感"，但节奏转换处经常出现不自然的断裂。电子音色与古典风格的融合仍然很生硬。

整体来说是一个有趣的实验，但离实用还有距离。

## 下一步

考虑两步法：先让 AI 生成 MIDI，再手动调整音色和编排。分离"作曲"和"编曲"两个步骤，可能比端到端生成更可控。`,
        },
    ],
};

// ============================================================
// COMPONENT
// ============================================================

export default function GardenPage() {
    const [activeBoard, setActiveBoard] = useState(0);
    const [activeArticle, setActiveArticle] = useState(0);
    const [currentSpread, setCurrentSpread] = useState(0);
    const [totalSpreads, setTotalSpreads] = useState(1);

    const contentRef = useRef<HTMLDivElement>(null);
    const bookRef = useRef<HTMLDivElement>(null);

    const currentBoard = BOARDS[activeBoard];
    const currentArticles = ARTICLES[currentBoard.id] || [];
    const currentArticleData = currentArticles[activeArticle];

    // Calculate spreads
    const calculateSpreads = useCallback(() => {
        if (!contentRef.current || !bookRef.current) return;
        const scrollW = contentRef.current.scrollWidth;
        const bookW = bookRef.current.clientWidth;
        if (bookW <= 0) return;
        setTotalSpreads(Math.max(1, Math.ceil(scrollW / bookW)));
    }, []);

    useEffect(() => {
        setCurrentSpread(0);
        const t = setTimeout(calculateSpreads, 120);
        return () => clearTimeout(t);
    }, [activeBoard, activeArticle, calculateSpreads]);

    useEffect(() => {
        window.addEventListener('resize', calculateSpreads);
        return () => window.removeEventListener('resize', calculateSpreads);
    }, [calculateSpreads]);

    const selectArticle = (bIdx: number, aIdx: number) => {
        setActiveBoard(bIdx);
        setActiveArticle(aIdx);
        setCurrentSpread(0);
    };

    const prevSpread = useCallback(() => setCurrentSpread(s => Math.max(0, s - 1)), []);
    const nextSpread = useCallback(() => setCurrentSpread(s => Math.min(totalSpreads - 1, s + 1)), [totalSpreads]);

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'ArrowRight') nextSpread();
            if (e.key === 'ArrowLeft') prevSpread();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [nextSpread, prevSpread]);

    return (
        <div className="h-screen flex flex-col bg-[#eef3f0] text-slate-800 font-sans selection:bg-teal-200/40 overflow-hidden">
            {/* ===== TOP BAR ===== */}
            <header className="flex-none flex items-center justify-between px-5 h-11 bg-[#2d3d35] text-white/80 z-30 select-none">
                <div className="flex items-center gap-4">
                    <Link href="/library" className="group flex items-center gap-1.5 hover:text-white transition-colors">
                        <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
                        <span className="text-[10px] font-mono font-bold uppercase tracking-widest">Library</span>
                    </Link>
                    <div className="w-px h-4 bg-white/15" />
                    <Sprout size={16} className="text-teal-400" />
                    <span className="text-sm font-serif tracking-wide">Digital <span className="text-teal-400">Garden</span></span>
                </div>

                {/* Page indicator */}
                <div className="flex items-center gap-3">
                    <span className="text-xs font-mono tracking-wider text-white/50">{currentSpread + 1} / {totalSpreads}</span>
                </div>
            </header>

            {/* ===== MAIN BODY ===== */}
            <div className="flex-1 flex min-h-0">

                {/* --- LEFT SIDEBAR --- */}
                <aside className="flex-none w-56 bg-[#e4ece7] border-r border-[#ccd8d0] flex flex-col overflow-hidden select-none">
                    {/* Sidebar title */}
                    <div className="px-4 py-3 border-b border-[#ccd8d0]">
                        <span className="text-[9px] font-mono font-bold uppercase tracking-[0.2em] text-[#6b8a7a]">目录</span>
                    </div>

                    {/* Board sections with articles */}
                    <nav className="flex-1 overflow-y-auto py-1 custom-scrollbar">
                        {BOARDS.map((board, bIdx) => {
                            const boardArticles = ARTICLES[board.id] || [];
                            return (
                                <div key={board.id} className="mb-1">
                                    {/* Board heading */}
                                    <div className="px-4 py-2 flex items-center gap-2">
                                        <board.icon size={12} className="text-[#6b8a7a]" />
                                        <span className="text-[11px] font-bold text-[#4a6b5a] uppercase tracking-wider">{board.title}</span>
                                    </div>

                                    {/* Article list */}
                                    {boardArticles.map((article, aIdx) => {
                                        const isActive = bIdx === activeBoard && aIdx === activeArticle;
                                        return (
                                            <button
                                                key={article.slug}
                                                onClick={() => selectArticle(bIdx, aIdx)}
                                                className={`
                                                    w-full text-left px-4 pl-8 py-2 text-[12.5px] leading-snug transition-colors
                                                    ${isActive
                                                        ? 'bg-[#d0ddd5] text-[#2d4a3a] font-semibold'
                                                        : 'text-[#5a7a6a] hover:bg-[#dae6df] hover:text-[#3a5a4a]'
                                                    }
                                                `}
                                            >
                                                {article.title}
                                            </button>
                                        );
                                    })}
                                </div>
                            );
                        })}
                    </nav>

                    {/* Sidebar footer */}
                    <div className="flex-none px-4 py-2.5 border-t border-[#ccd8d0] text-[9px] font-mono text-[#8aaa9a] tracking-wider">
                        {BOARDS.reduce((sum, b) => sum + (ARTICLES[b.id]?.length || 0), 0)} entries
                    </div>
                </aside>

                {/* --- READING AREA --- */}
                <main className="flex-1 flex flex-col min-w-0">

                    {/* Article title bar */}
                    {currentArticleData && (
                        <div className="flex-none px-10 py-4 border-b border-[#d5ddd8] bg-[#eef3f0]/80">
                            <motion.div
                                key={`${activeBoard}-${activeArticle}`}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.25 }}
                                className="flex items-baseline justify-between"
                            >
                                <div>
                                    <h1 className="text-xl font-serif font-bold text-stone-800">
                                        {currentArticleData.title}
                                    </h1>
                                    <div className="flex items-center gap-3 mt-1.5">
                                        <span className="text-[10px] font-mono text-stone-400">{currentArticleData.date}</span>
                                        <div className="flex gap-1.5">
                                            {currentArticleData.tags.map(tag => (
                                                <span key={tag} className="px-1.5 py-0.5 rounded bg-teal-50 text-teal-600 text-[9px] font-mono font-bold tracking-wider border border-teal-100/60">
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    )}

                    {/* Book content area */}
                    {currentArticleData && (
                        <div className="flex-1 relative min-h-0">
                            <div
                                ref={bookRef}
                                className="absolute inset-0 overflow-hidden"
                            >
                                {/* Center spine */}
                                <div className="absolute top-4 bottom-4 left-1/2 w-px bg-[#b8c9bf] z-10 pointer-events-none" />

                                {/* Content columns */}
                                <motion.div
                                    ref={contentRef}
                                    key={`content-${activeBoard}-${activeArticle}`}
                                    initial={{ opacity: 0 }}
                                    animate={{
                                        opacity: 1,
                                        x: -(currentSpread * 100) + '%',
                                    }}
                                    transition={{
                                        opacity: { duration: 0.25 },
                                        x: { duration: 0.45, ease: [0.25, 0.1, 0.25, 1] },
                                    }}
                                    className="h-full px-10 py-8"
                                    style={{
                                        columnCount: 2,
                                        columnGap: '5rem',
                                        columnFill: 'auto' as any,
                                    }}
                                >
                                    <div className="text-[14px] text-stone-600 leading-[1.95]">
                                        <ReactMarkdown
                                            components={{
                                                h2: ({ node, ...props }) => (
                                                    <h2 className="text-[17px] font-serif font-bold mt-6 mb-3 text-stone-800 break-after-avoid" {...props} />
                                                ),
                                                h3: ({ node, ...props }) => (
                                                    <h3 className="text-[15px] font-serif font-bold mt-5 mb-2 text-stone-700 break-after-avoid" {...props} />
                                                ),
                                                p: ({ node, ...props }) => (
                                                    <p className="mb-3 text-stone-600 leading-[1.95] break-inside-avoid-column" {...props} />
                                                ),
                                                code: ({ node, className, children, ...props }) => {
                                                    const isBlock = className?.includes('language-');
                                                    if (isBlock) {
                                                        return (
                                                            <code className="block bg-[#1e293b] text-stone-200 p-4 rounded-lg text-[12.5px] font-mono my-4 overflow-x-auto break-inside-avoid leading-relaxed" {...props}>
                                                                {children}
                                                            </code>
                                                        );
                                                    }
                                                    return (
                                                        <code className="bg-teal-50/80 text-teal-700 px-1.5 py-0.5 rounded text-[12.5px] border border-teal-100/60" {...props}>
                                                            {children}
                                                        </code>
                                                    );
                                                },
                                                strong: ({ node, ...props }) => <strong className="text-stone-800 font-semibold" {...props} />,
                                                em: ({ node, ...props }) => <em className="italic text-stone-500" {...props} />,
                                                ul: ({ node, ...props }) => <ul className="list-disc pl-5 my-3 space-y-1 break-inside-avoid" {...props} />,
                                                ol: ({ node, ...props }) => <ol className="list-decimal pl-5 my-3 space-y-1 break-inside-avoid" {...props} />,
                                                li: ({ node, ...props }) => <li className="text-stone-600 leading-relaxed" {...props} />,
                                                blockquote: ({ node, ...props }) => (
                                                    <blockquote className="border-l-2 border-teal-400/60 pl-4 my-4 text-stone-500 italic bg-teal-50/20 py-2 pr-3 rounded-r break-inside-avoid" {...props} />
                                                ),
                                                table: ({ node, ...props }) => (
                                                    <div className="my-4 break-inside-avoid">
                                                        <table className="w-full text-[12.5px] border-collapse" {...props} />
                                                    </div>
                                                ),
                                                thead: ({ node, ...props }) => <thead className="bg-[#e8f0eb]" {...props} />,
                                                th: ({ node, ...props }) => (
                                                    <th className="text-left px-3 py-2 text-[10px] font-mono font-bold uppercase tracking-wider text-[#4a6b5a] border-b border-[#ccd8d0]" {...props} />
                                                ),
                                                td: ({ node, ...props }) => (
                                                    <td className="px-3 py-2 border-b border-stone-100/80 text-stone-600" {...props} />
                                                ),
                                                hr: ({ node, ...props }) => <hr className="border-stone-200/50 my-6" {...props} />,
                                            }}
                                        >
                                            {currentArticleData.content}
                                        </ReactMarkdown>
                                    </div>
                                </motion.div>
                            </div>
                        </div>
                    )}

                    {/* Bottom navigation bar */}
                    <div className="flex-none flex items-center justify-between px-6 py-2 border-t border-[#d5ddd8] bg-[#eef3f0]/80">
                        <button
                            onClick={prevSpread}
                            disabled={currentSpread === 0}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-mono text-[#6b8a7a] hover:bg-[#dae6df] hover:text-[#3a5a4a] disabled:opacity-25 disabled:hover:bg-transparent disabled:hover:text-[#6b8a7a] transition-colors"
                        >
                            <ChevronLeft size={14} /> Prev
                        </button>

                        <div className="text-[9px] font-mono text-[#8aaa9a] tracking-[0.2em]">
                            GARDEN_SYS // READER
                        </div>

                        <button
                            onClick={nextSpread}
                            disabled={currentSpread >= totalSpreads - 1}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-mono text-[#6b8a7a] hover:bg-[#dae6df] hover:text-[#3a5a4a] disabled:opacity-25 disabled:hover:bg-transparent disabled:hover:text-[#6b8a7a] transition-colors"
                        >
                            Next <ChevronRight size={14} />
                        </button>
                    </div>
                </main>
            </div>
        </div>
    );
}
