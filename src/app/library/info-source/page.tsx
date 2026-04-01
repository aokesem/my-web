"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, GraduationCap, Sparkles } from 'lucide-react';

export default function InfoSourcePage() {
    const router = useRouter();
    const [hovered, setHovered] = useState<'none' | 'study' | 'life'>('none');

    const split = {
        top: hovered === 'study' ? 65 : hovered === 'life' ? 45 : 55,
        bottom: hovered === 'study' ? 55 : hovered === 'life' ? 35 : 45,
    };

    const clipTransition = 'clip-path 0.7s cubic-bezier(0.33, 1, 0.68, 1)';

    return (
        <div className="relative w-full h-screen overflow-hidden select-none">
            {/* 底层 */}
            <div className="absolute inset-0 bg-neutral-900" />

            {/* ===== 学习侧 (左) ===== */}
            <div
                className="absolute inset-0 cursor-pointer z-1"
                style={{
                    clipPath: `polygon(0 0, ${split.top}% 0, ${split.bottom}% 100%, 0 100%)`,
                    transition: clipTransition,
                }}
                onClick={() => router.push('/library/info-source/study')}
                onMouseEnter={() => setHovered('study')}
                onMouseLeave={() => setHovered('none')}
            >
                {/* 背景: 深邃冷色调 */}
                <div className="absolute inset-0 bg-linear-to-br from-[#0c1526] via-[#162544] to-[#0f1b33]" />

                {/* 网格纹理 */}
                <div
                    className="absolute inset-0 opacity-[0.03]"
                    style={{
                        backgroundImage:
                            'linear-gradient(rgba(148,163,184,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.8) 1px, transparent 1px)',
                        backgroundSize: '36px 36px',
                    }}
                />

                {/* 冷色光晕 */}
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_35%_50%,rgba(59,130,246,0.08),transparent_70%)]" />

                {/* 内容 */}
                <div className="absolute inset-0 flex items-center justify-center" style={{ paddingRight: '18%' }}>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2, duration: 0.6 }}
                        className="flex flex-col items-center"
                    >
                        {/* 图标 */}
                        <div
                            className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-8 border transition-all duration-500 ${hovered === 'study'
                                ? 'bg-blue-500/15 border-blue-400/30 shadow-[0_0_40px_rgba(59,130,246,0.15)]'
                                : 'bg-white/5 border-white/10'
                                }`}
                        >
                            <GraduationCap
                                size={30}
                                className={`transition-colors duration-500 ${hovered === 'study' ? 'text-blue-400' : 'text-slate-500'}`}
                            />
                        </div>

                        {/* 标题 */}
                        <h2
                            className={`text-6xl font-bold tracking-tight mb-3 transition-all duration-500 ${hovered === 'study' ? 'text-white scale-[1.02]' : 'text-white/75'
                                }`}
                        >
                            学习
                        </h2>

                        {/* 英文副标题 */}
                        <span
                            className={`text-xs font-mono tracking-[0.5em] uppercase mb-8 transition-colors duration-500 ${hovered === 'study' ? 'text-blue-300/60' : 'text-slate-500/40'
                                }`}
                        >
                            Study
                        </span>

                        {/* 说明 */}
                        <p
                            className={`text-sm max-w-[240px] text-center leading-relaxed transition-colors duration-500 ${hovered === 'study' ? 'text-slate-300/80' : 'text-slate-500/50'
                                }`}
                        >
                            系统的知识收集与技术沉淀
                        </p>

                        {/* 进入按钮 */}
                        <div
                            className={`mt-10 flex items-center gap-2 px-5 py-2 rounded-full border text-xs font-mono tracking-widest uppercase transition-all duration-500 ${hovered === 'study'
                                ? 'border-blue-400/40 text-blue-300/80 bg-blue-500/10'
                                : 'border-white/10 text-white/20'
                                }`}
                        >
                            <span>进入</span>
                            <ArrowRight size={12} />
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* ===== 生活侧 (右) ===== */}
            <div
                className="absolute inset-0 cursor-pointer z-2"
                style={{
                    clipPath: `polygon(${split.top}% 0, 100% 0, 100% 100%, ${split.bottom}% 100%)`,
                    transition: clipTransition,
                }}
                onClick={() => router.push('/library/info-source/life')}
                onMouseEnter={() => setHovered('life')}
                onMouseLeave={() => setHovered('none')}
            >
                {/* 背景: 温暖色调 */}
                <div className="absolute inset-0 bg-linear-to-br from-[#fefce8] via-[#fef3c7] to-[#ecfccb]" />

                {/* 点状纹理 */}
                <div
                    className="absolute inset-0 opacity-[0.06]"
                    style={{
                        backgroundImage: 'radial-gradient(circle, #78350f 1px, transparent 1px)',
                        backgroundSize: '28px 28px',
                    }}
                />

                {/* 暖色光晕 */}
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_65%_50%,rgba(245,158,11,0.1),transparent_70%)]" />

                {/* 内容 */}
                <div className="absolute inset-0 flex items-center justify-center" style={{ paddingLeft: '18%' }}>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3, duration: 0.6 }}
                        className="flex flex-col items-center"
                    >
                        {/* 图标 */}
                        <div
                            className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-8 border transition-all duration-500 ${hovered === 'life'
                                ? 'bg-amber-400/15 border-amber-400/30 shadow-[0_0_40px_rgba(245,158,11,0.12)]'
                                : 'bg-stone-800/5 border-stone-300/20'
                                }`}
                        >
                            <Sparkles
                                size={30}
                                className={`transition-colors duration-500 ${hovered === 'life' ? 'text-amber-500' : 'text-stone-400/50'}`}
                            />
                        </div>

                        {/* 标题 */}
                        <h2
                            className={`text-6xl font-bold tracking-tight mb-3 transition-all duration-500 ${hovered === 'life' ? 'text-stone-800 scale-[1.02]' : 'text-stone-600/70'
                                }`}
                        >
                            生活
                        </h2>

                        {/* 英文副标题 */}
                        <span
                            className={`text-xs font-mono tracking-[0.5em] uppercase mb-8 transition-colors duration-500 ${hovered === 'life' ? 'text-amber-600/60' : 'text-stone-400/30'
                                }`}
                        >
                            Life
                        </span>

                        {/* 说明 */}
                        <p
                            className={`text-sm max-w-[240px] text-center leading-relaxed transition-colors duration-500 ${hovered === 'life' ? 'text-stone-600/90' : 'text-stone-400/40'
                                }`}
                        >
                            日常出行与生活信息的集散地
                        </p>

                        {/* 进入按钮 */}
                        <div
                            className={`mt-10 flex items-center gap-2 px-5 py-2 rounded-full border text-xs font-mono tracking-widest uppercase transition-all duration-500 ${hovered === 'life'
                                ? 'border-amber-400/50 text-amber-600/80 bg-amber-400/10'
                                : 'border-stone-300/20 text-stone-400/20'
                                }`}
                        >
                            <span>进入</span>
                            <ArrowRight size={12} />
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* ===== 斜切边缘发光线 ===== */}
            <div
                className="absolute inset-0 pointer-events-none z-3"
                style={{
                    clipPath: `polygon(${split.top - 0.15}% 0, ${split.top + 0.15}% 0, ${split.bottom + 0.15}% 100%, ${split.bottom - 0.15}% 100%)`,
                    background: 'linear-gradient(to bottom, rgba(147,197,253,0.5), rgba(255,255,255,0.7), rgba(251,191,36,0.5))',
                    transition: clipTransition,
                }}
            />

            {/* ===== 返回 Library ===== */}
            <Link
                href="/library"
                className="absolute top-8 left-8 z-20 group flex items-center gap-3 px-5 py-2.5 rounded-xl bg-black/20 border border-white/15 hover:bg-black/40 hover:border-white/30 transition-all duration-300 backdrop-blur-md"
            >
                <ArrowLeft size={16} className="text-white/60 group-hover:text-white transition-colors" />
                <span className="text-[11px] font-mono font-bold text-white/60 group-hover:text-white uppercase tracking-widest transition-colors">
                    Library
                </span>
            </Link>

            {/* ===== 页面标题 ===== */}
            <div className="absolute top-8 left-1/2 -translate-x-1/2 z-20 pointer-events-none flex flex-col items-center px-10 py-5 rounded-3xl bg-black/15 backdrop-blur-md shadow-2xl border border-white/10 transition-all duration-700">
                <h1 className="text-3xl md:text-5xl font-serif font-bold tracking-tight shadow-sm drop-shadow-xl">
                    <span className="text-slate-100">信息</span><span className="text-orange-500">溯源</span>
                </h1>
                <div className="flex items-center gap-3 mt-3">
                    <div className="h-px w-5 bg-orange-500/50" />
                    <span className="text-[10px] md:text-xs font-mono tracking-widest text-slate-300 uppercase drop-shadow-md">
                        Information Source
                    </span>
                    <div className="h-px w-5 bg-orange-500/50" />
                </div>
            </div>

            {/* ===== 底部标签 ===== */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 pointer-events-none px-6 py-2 rounded-full bg-black/15 backdrop-blur-md shadow-lg border border-white/10">
                <span className="text-[10px] font-mono text-slate-700 tracking-[0.3em] uppercase drop-shadow-md">
                    Info Source • Select Category
                </span>
            </div>
        </div>
    );
}
