"use client";

import React from 'react';
import { motion } from 'framer-motion';
import {
    ArrowLeft,
    Calendar,
    Tag,
    BookOpen,
    Code,
    Palette,
} from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import ReactMarkdown from 'react-markdown';

// === Board metadata ===
const BOARD_META: Record<string, { title: string, icon: any, color: string }> = {
    learning: { title: '学习笔记', icon: BookOpen, color: 'text-teal-500' },
    programming: { title: 'AI与编程', icon: Code, color: 'text-emerald-500' },
    creative: { title: 'AI与创作', icon: Palette, color: 'text-cyan-500' },
};

// === Mock Article Content (To be replaced by Supabase later) ===
const MOCK_CONTENT: Record<string, Record<string, {
    title: string,
    date: string,
    tags: string[],
    content: string,
}>> = {
    learning: {
        'understanding-attention': {
            title: '理解注意力机制：从直觉到数学',
            date: '2026-02-10',
            tags: ['Transformer', 'Attention', '基础'],
            content: `## 为什么需要注意力？

在传统的 RNN 中，信息需要按顺序传递。这意味着当句子很长时，早期的信息很容易被"遗忘"。注意力机制的核心思想是：**让模型能够直接关注输入中任何位置的信息**，而不必依赖顺序传递。

## 直觉理解

想象你在阅读一段很长的文字。当你遇到代词"它"时，你会自然地回头看前文，找到"它"指代的名词。这就是注意力——**有选择地聚焦于相关信息**。

## Query, Key, Value

注意力的三个核心概念：

- **Query (Q)**：你的"问题"——当前位置想要了解什么
- **Key (K)**：其他位置的"标签"——它们能提供什么信息
- **Value (V)**：其他位置的"内容"——实际要传递的信息

## 数学表达

$$
\\text{Attention}(Q, K, V) = \\text{softmax}\\left(\\frac{QK^T}{\\sqrt{d_k}}\\right)V
$$

其中 $d_k$ 是 Key 的维度，除以 $\\sqrt{d_k}$ 是为了防止点积值过大导致 softmax 输出趋向极端值。

## 多头注意力

Multi-Head Attention 就是同时进行多组独立的注意力计算，每组关注不同的"方面"。就像你可以同时关注语法关系、语义关系和位置关系一样。

## 小结

- 注意力 = 有选择地聚焦
- Self-Attention 让每个位置都能"看到"所有位置
- 缩放因子防止梯度消失
- 多头机制捕获多维度关系`,
        },
        'first-finetune': {
            title: '第一次微调模型的踩坑记录',
            date: '2026-02-08',
            tags: ['Fine-tuning', '实践'],
            content: `## 背景

决定尝试用 LoRA 微调一个 7B 参数的 LLM，目标是让它在特定领域的问答上表现更好。

## 环境配置

第一个坑就出在环境上。\`bitsandbytes\` 在 Windows 上的安装非常不友好，最终选择了 WSL2 + CUDA 11.8 的组合。

## 数据准备

数据格式是最让人困惑的部分。不同框架期望的格式不同：

- **Alpaca 格式**：instruction + input + output
- **ShareGPT 格式**：conversations 数组
- **通用格式**：messages 数组（类似 OpenAI API）

最终选择了 ShareGPT 格式，因为更接近真实的对话场景。

## 训练参数

关键参数的选择：

- **LoRA rank**: 16（太大会过拟合，太小表现不够好）
- **Learning rate**: 2e-4（先用大一点快速摸索，再减小精调）
- **Epochs**: 3（小数据集上更多 epoch 反而会过拟合）

## 遇到的问题

1. **OOM**：batch size 设为 4 直接爆显存，改成 1 + gradient accumulation
2. **Loss 不下降**：发现是数据格式问题，模型根本没学到有效信息
3. **过拟合**：训练 loss 降到很低但验证效果差，加了 dropout 后好转

## 收获

- 微调不是魔法，数据质量 > 数据数量
- 先用小数据集快速验证 pipeline，再扩大规模
- 评估要用多维度指标，不能只看 loss`,
        },
        'random-thought-01': {
            title: '关于 AI 学习路径的一些想法',
            date: '2026-02-06',
            tags: ['随想'],
            content: `学习 AI 不应该从论文开始，而应该从建立直觉开始。

先理解"它在做什么"，再理解"它为什么这样做"。

太多人一上来就钻进数学公式里，结果是能推导但不理解。反过来，如果你先从宏观上理解了注意力机制就是"让模型自己选择关注什么"，那些公式就自然而然地有了意义。

学习路径建议：
1. 看直觉性的科普视频（3Blue1Brown, StatQuest）
2. 用代码动手实现简化版本
3. 回头看论文，对照实现理解细节
4. 在真实项目中应用`,
        },
    },
    programming: {
        'copilot-workflow': {
            title: 'AI辅助编程的个人工作流',
            date: '2026-02-09',
            tags: ['Copilot', '工作流', '效率'],
            content: `## 我的 AI 编程工作流

经过半年多的使用，我总结出了一套比较有效的 AI 辅助编程流程。

## 何时用 AI

- **适合**：写样板代码、生成测试、写文档注释、探索不熟悉的 API
- **不适合**：核心业务逻辑、安全相关代码、需要深度理解上下文的重构

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

当你发现自己在反复修改 AI 的输出，试图让它"理解"你要什么时——关掉它，自己写可能更快。`,
        },
        'ai-debug-note': {
            title: '让AI帮我Debug的有趣经历',
            date: '2026-02-05',
            tags: ['Debug', '趣事'],
            content: `今天遇到一个有趣的事情。

一个分页组件，第2页的数据总是和第1页相同。我盯着代码看了快两个小时，怎么都找不到问题。

把代码丢给 AI 后，它立刻指出：\`offset\` 的计算用了 \`page\` 而不是 \`page - 1\`，导致 offset 总是多了一页的量。

经典的 off-by-one 错误。

但有趣的是，AI 给出的**解释**完全是错的。它说"因为数组索引从0开始所以需要减1"——实际原因是我的 API 分页是从0开始的，而前端的页码是从1开始的。

**结论：AI 找 bug 很厉害，但理解 bug 的能力还有待提高。**`,
        },
    },
    creative: {
        'ai-music-experiment': {
            title: 'AI作曲实验：风格迁移的可能性',
            date: '2026-02-07',
            tags: ['音乐', 'Style Transfer'],
            content: `## 实验目标

将一首肖邦夜曲的"音乐风格"迁移到电子音乐的框架中，看看 AI 能否保留古典音乐的和声美感，同时赋予它电子音乐的节奏和音色。

## 工具选择

尝试了几个工具：

- **Suno**：生成质量不错，但风格控制精度不够
- **Udio**：在风格混合方面表现稍好
- **MusicGen**：开源，可控性强，但音质不如商业产品

最终选择了 MusicGen，因为我需要对生成过程有更多控制。

## 参数调节

关键发现：
- **Temperature 过高**（>1.2）会让音乐变得混乱
- **Top-k 设为 250** 在多样性和连贯性之间取得了较好平衡
- 给模型提供 **5秒的引导片段** 效果比纯文字描述好得多

## 结果

最终生成了3段各30秒的音乐。主观评价：
- 和声进行确实保留了一些"肖邦感"
- 但节奏转换处经常出现不自然的断裂
- 电子音色与古典风格的融合仍然很生硬

## 下一步

考虑尝试两步法：先让 AI 生成 MIDI，再手动调整音色和编排。这样可能比端到端生成的效果更好。`,
        },
    },
};

export default function ArticlePage() {
    const params = useParams();
    const boardId = params.board as string;
    const slug = params.slug as string;
    const board = BOARD_META[boardId] || BOARD_META['learning'];
    const article = MOCK_CONTENT[boardId]?.[slug];

    if (!article) {
        return (
            <div className="min-h-screen bg-[#f8fbf9] flex items-center justify-center">
                <div className="text-center">
                    <p className="text-stone-400 font-mono text-sm uppercase tracking-widest mb-4">Article Not Found</p>
                    <Link href={`/library/garden/${boardId}`} className="text-teal-500 hover:text-teal-700 text-sm underline underline-offset-4">
                        Back to {board.title}
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="relative min-h-screen bg-[#f8fbf9] text-slate-800 selection:bg-teal-100 font-sans">
            {/* Background */}
            <div className="fixed inset-0 z-0 opacity-25 pointer-events-none mix-blend-multiply"
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.5'/%3E%3C/svg%3E")` }}
            />
            <div className="fixed inset-0 z-0 opacity-[0.03] pointer-events-none"
                style={{ backgroundImage: `radial-gradient(#2dd4bf 0.5px, transparent 0.5px)`, backgroundSize: '32px 32px' }}
            />

            {/* Header */}
            <header className="relative z-10 max-w-3xl mx-auto px-8 pt-16 pb-8">
                <Link
                    href={`/library/garden/${boardId}`}
                    className="group inline-flex items-center gap-2 mb-10 text-stone-400 hover:text-teal-600 transition-colors"
                >
                    <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                    <span className="text-xs font-mono font-bold uppercase tracking-widest">Back to {board.title}</span>
                </Link>

                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                >
                    {/* Tags */}
                    <div className="flex items-center gap-2 mb-4">
                        {article.tags.map(tag => (
                            <span key={tag} className="px-2.5 py-1 rounded-full bg-teal-50 text-teal-600 text-[10px] font-mono font-bold uppercase tracking-wider border border-teal-100/50">
                                {tag}
                            </span>
                        ))}
                    </div>

                    {/* Title */}
                    <h1 className="text-3xl md:text-4xl font-serif font-bold text-stone-800 leading-tight">
                        {article.title}
                    </h1>

                    {/* Date & Board */}
                    <div className="flex items-center gap-4 mt-5 text-[11px] font-mono text-stone-400">
                        <span className="flex items-center gap-1.5">
                            <Calendar size={12} />
                            {article.date}
                        </span>
                        <span className="text-stone-200">|</span>
                        <span className={`flex items-center gap-1.5 ${board.color}`}>
                            <board.icon size={12} />
                            {board.title}
                        </span>
                    </div>
                </motion.div>
            </header>

            {/* Content */}
            <main className="relative z-10 max-w-3xl mx-auto px-8 pb-32">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                >
                    {/* Article body with left accent line */}
                    <div className="relative pl-6 border-l-2 border-teal-100/60">
                        <div className="prose prose-stone max-w-none">
                            <div className="text-[15px] text-stone-600 leading-[1.85] font-normal">
                                <ReactMarkdown
                                    components={{
                                        h1: ({ node, ...props }) => <h1 className="text-2xl font-serif font-bold mt-10 mb-4 text-stone-800 first:mt-0" {...props} />,
                                        h2: ({ node, ...props }) => <h2 className="text-xl font-serif font-bold mt-8 mb-3 text-stone-700" {...props} />,
                                        h3: ({ node, ...props }) => <h3 className="text-lg font-serif font-bold mt-6 mb-2 text-stone-600" {...props} />,
                                        p: ({ node, ...props }) => <p className="mb-4 text-stone-600 leading-[1.85]" {...props} />,
                                        code: ({ node, className, ...props }) => {
                                            const isBlock = className?.includes('language-');
                                            if (isBlock) {
                                                return (
                                                    <code className="block bg-stone-800 text-stone-100 p-4 rounded-xl text-sm font-mono my-4 overflow-x-auto" {...props} />
                                                );
                                            }
                                            return <code className="bg-teal-50 text-teal-700 px-1.5 py-0.5 rounded border border-teal-100 text-[13px]" {...props} />;
                                        },
                                        strong: ({ node, ...props }) => <strong className="text-stone-800 font-bold" {...props} />,
                                        ul: ({ node, ...props }) => <ul className="list-disc pl-5 my-4 space-y-1.5" {...props} />,
                                        ol: ({ node, ...props }) => <ol className="list-decimal pl-5 my-4 space-y-1.5" {...props} />,
                                        li: ({ node, ...props }) => <li className="text-stone-600 leading-relaxed" {...props} />,
                                        blockquote: ({ node, ...props }) => (
                                            <blockquote className="border-l-3 border-teal-300 pl-4 my-4 italic text-stone-500 bg-teal-50/30 py-2 rounded-r-lg" {...props} />
                                        ),
                                        hr: ({ node, ...props }) => <hr className="border-stone-100 my-8" {...props} />,
                                    }}
                                >
                                    {article.content}
                                </ReactMarkdown>
                            </div>
                        </div>
                    </div>

                    {/* Bottom decoration */}
                    <div className="mt-16 pt-8 border-t border-stone-100 flex items-center justify-between">
                        <div className="text-[9px] font-mono text-stone-300 uppercase tracking-widest">
                            Observation Log // {boardId}/{slug}
                        </div>
                        <div className="text-[9px] font-mono text-teal-300 uppercase tracking-widest">
                            Status: Recorded
                        </div>
                    </div>
                </motion.div>
            </main>
        </div>
    );
}
