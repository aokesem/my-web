"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PlaybookModal from './PlaybookModal';
import EnglishModuleModal from './EnglishModuleModal';
import VocabularyListModal from './VocabularyListModal';

import { supabase } from '@/lib/supabaseClient';



interface WindowViewProps {
    isOpen: boolean;
    onToggle: () => void;
    isBlurred: boolean;
}

export default function WindowView({ isOpen, onToggle, isBlurred }: WindowViewProps) {
    // [新增] 解决 Hydration Error 的核心：挂载状态
    const [mounted, setMounted] = useState(false);
    // [新增] Playbook展开状态
    const [isPlaybookOpen, setIsPlaybookOpen] = useState(false);
    // [新增] EnglishModule展开状态
    const [isEnglishOpen, setIsEnglishOpen] = useState(false);
    // [新增] VocabularyList展开状态
    const [isListOpen, setIsListOpen] = useState(false);

    // [新增] 静止态滚动词：从数据库第1批的未掌握词中随机抽 30 个
    const [idleWords, setIdleWords] = useState<string[]>([]);

    useEffect(() => {
        const fetchIdleWords = async () => {
            const { data, error } = await supabase
                .from('vocabulary')
                .select('word')
                .eq('batch_id', 1)
                .neq('status', 'mastered')
                .limit(250);

            if (data && data.length > 0) {
                const shuffled = [...data].sort(() => Math.random() - 0.5);
                setIdleWords(shuffled.slice(0, 30).map(w => w.word));
            } else {
                setIdleWords(["SYSTEM_READY", "AWAITING_VOCABULARY", "CONNECTION_SECURED"]);
            }
        };

        fetchIdleWords();
    }, []);

    // [新增] 静止态滚动词引用的定时器状态
    const [idleWordIndex, setIdleWordIndex] = useState(0);

    // [新增] 仅在客户端执行
    useEffect(() => {
        setMounted(true);
    }, []);

    // [新增] 定时器：控制轮播
    useEffect(() => {
        if (!mounted || idleWords.length === 0) return;
        const timer = setInterval(() => {
            setIdleWordIndex(prev => (prev + 1) % idleWords.length);
        }, 4000); // 💡【动画调整】这里控制单词停留时间，3500代表3.5秒换一个词
        return () => clearInterval(timer);
    }, [mounted, idleWords]);

    return (
        <>
            <div
                className="relative w-[60vw] max-w-[1000px] aspect-4/3 shadow-2xl cursor-pointer group scale-90 md:scale-75 transition-all duration-700 ease-in-out"
                onClick={onToggle}
                style={{
                    perspective: "2000px",
                    filter: isBlurred ? "blur(12px) opacity(0.5) grayscale(0.2)" : "none",
                    transform: isBlurred ? "scale(0.70)" : undefined
                }}
            >
                {/* --- 1. 窗外景色 --- */}
                <div className="absolute inset-0 overflow-hidden bg-[#e0f2fe] z-0 rounded-sm">
                    {/* 天空渐变 */}
                    <div className="absolute inset-0 bg-linear-to-b from-[#0ea5e9] via-[#bae6fd] to-[#f0f9ff]" />

                    {/* 阳光 */}
                    <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-[radial-gradient(circle,rgba(255,255,255,0.6)_0%,transparent_70%)] translate-x-1/3 -translate-y-1/3 blur-3xl z-10" />

                    {/* [修改] 只有在 mounted 后才渲染随机粒子，避免服务端渲染不一致 */}
                    {mounted && (
                        <>
                            {/* --- A. 丁达尔光束 --- */}
                            <div className="absolute inset-0 z-20 pointer-events-none opacity-40">
                                {[...Array(3)].map((_, i) => (
                                    <motion.div
                                        key={`ray-${i}`}
                                        initial={{ rotate: -45, opacity: 0.3 }}
                                        animate={{
                                            rotate: [-45, -40, -45],
                                            opacity: [0.3, 0.5, 0.3],
                                            x: [0, 20, 0]
                                        }}
                                        transition={{
                                            duration: 10 + i * 5,
                                            repeat: Infinity,
                                            ease: "easeInOut"
                                        }}
                                        className="absolute top-[-50%] left-[20%] w-[100px] h-[200%] bg-linear-to-b from-white/30 via-white/10 to-transparent blur-xl origin-top"
                                        style={{ left: `${20 + i * 15}%` }}
                                    />
                                ))}
                            </div>

                            {/* --- B. 风中粒子 --- */}
                            <div className="absolute inset-0 z-20 pointer-events-none">
                                {[...Array(12)].map((_, i) => (
                                    <motion.div
                                        key={`particle-${i}`}
                                        initial={{ x: "-10vw", y: "110vh", opacity: 0 }}
                                        animate={{
                                            x: "110vw",
                                            y: "-10vh",
                                            opacity: [0, 0.8, 0],
                                            rotate: 360
                                        }}
                                        transition={{
                                            duration: Math.random() * 15 + 20,
                                            repeat: Infinity,
                                            ease: "linear",
                                            delay: Math.random() * -20
                                        }}
                                        className="absolute w-1 h-1 bg-white rounded-full blur-[1px]"
                                        style={{
                                            width: Math.random() > 0.5 ? '4px' : '2px',
                                            height: Math.random() > 0.5 ? '4px' : '2px',
                                        }}
                                    />
                                ))}
                            </div>

                            {/* 极简云朵/气流 */}
                            <div className="absolute inset-0 z-0 opacity-60">
                                {[...Array(6)].map((_, i) => (
                                    <motion.div
                                        key={`cloud-${i}`}
                                        initial={{ x: "-150%" }}
                                        animate={{ x: "250%" }}
                                        transition={{
                                            duration: Math.random() * 60 + 40,
                                            repeat: Infinity,
                                            ease: "linear",
                                            delay: Math.random() * -50
                                        }}
                                        className="absolute bg-white/50 blur-3xl rounded-full"
                                        style={{
                                            top: `${Math.random() * 80}%`,
                                            width: `${Math.random() * 400 + 200}px`,
                                            height: `${Math.random() * 100 + 50}px`,
                                        }}
                                    />
                                ))}
                            </div>
                        </>
                    )}
                </div>

                {/* --- 2. 窗框与窗扇 (保持不变，因为它们是静态的) --- */}
                <div className="absolute inset-[-15px] border-15 border-[#f1f5f9] rounded-sm z-30 shadow-[0_10px_40px_rgba(0,0,0,0.1)] pointer-events-none ring-1 ring-slate-200" />

                <div className="relative w-full h-full flex z-20" style={{ transformStyle: "preserve-3d" }}>
                    {/* 左窗扇 */}
                    <motion.div
                        animate={{ rotateY: isOpen ? -115 : 0 }}
                        transition={{ type: "spring", stiffness: 45, damping: 15 }}
                        className="relative flex-1 h-full bg-white/20 border-r-8 border-[#e2e8f0] origin-left backdrop-blur-[2px]"
                        style={{ transformStyle: "preserve-3d", backfaceVisibility: "hidden" }}
                    >
                        <div className="absolute inset-0 border-12 border-[#f8fafc] flex items-center justify-center shadow-inner">
                            <div className="absolute w-full h-[8px] bg-[#e2e8f0]" />
                            <div className="absolute h-full w-[8px] bg-[#e2e8f0]" />
                            <div className="absolute top-0 left-4 w-16 h-full bg-linear-to-r from-white/40 to-transparent -rotate-12 pointer-events-none" />
                        </div>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 w-2 h-16 bg-[#cbd5e1] rounded-full border border-[#94a3b8] shadow-sm" />
                    </motion.div>

                    {/* 右窗扇 */}
                    <motion.div
                        animate={{ rotateY: isOpen ? 115 : 0 }}
                        transition={{ type: "spring", stiffness: 45, damping: 15 }}
                        className="relative flex-1 h-full bg-white/20 border-l-8 border-[#e2e8f0] origin-right backdrop-blur-[2px]"
                        style={{ transformStyle: "preserve-3d", backfaceVisibility: "hidden" }}
                    >
                        <div className="absolute inset-0 border-12 border-[#f8fafc] flex items-center justify-center shadow-inner">
                            <div className="absolute w-full h-[8px] bg-[#e2e8f0]" />
                            <div className="absolute h-full w-[8px] bg-[#e2e8f0]" />
                            <div className="absolute top-0 right-4 w-16 h-full bg-linear-to-l from-white/40 to-transparent -rotate-12 pointer-events-none" />
                        </div>
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 w-2 h-16 bg-[#cbd5e1] rounded-full border border-[#94a3b8] shadow-sm" />
                    </motion.div>
                </div>

                <div className="absolute -bottom-[25px] -left-[25px] -right-[25px] h-[25px] bg-[#f1f5f9] border-t border-white shadow-lg rounded-b-sm z-40">
                    {/* --- 3. Playbook 入口 (A set of leaning books) --- */}
                    {/* 防止在 blur 状态下点击 */}
                    <div
                        className="absolute bottom-full left-8 mb-px flex items-end group/playbook cursor-pointer transition-transform duration-500 hover:scale-[1.03] z-50"
                        onClick={(e) => {
                            e.stopPropagation(); // 阻止触发 WindowView 的 toggle
                            if (!isBlurred) {
                                setIsPlaybookOpen(true);
                            }
                        }}
                    >
                        {/* Tooltip positioned relative to the entire group */}
                        <div className="absolute -top-13 left-1/2 -translate-x-1/2 opacity-0 group-hover/playbook:opacity-100 transition-opacity duration-300 pointer-events-none z-50">
                            <div className="bg-slate-800 text-white text-[16px] py-1.5 px-3 rounded-md font-mono tracking-widest whitespace-nowrap shadow-xl border border-white/10">
                                目标与任务森林
                            </div>
                            <div className="w-2 h-2 bg-slate-800 rotate-45 absolute -bottom-1 left-1/2 -translate-x-1/2 border-b border-r border-white/10"></div>
                        </div>

                        {/* Book 1: Upright, brown (Calibre style, thickest) */}
                        <div className="relative w-8 h-32 origin-bottom transition-all duration-300 group-hover/playbook:-translate-y-1 z-10 shrink-0">
                            <div className="absolute inset-0 bg-[#5C3A19] rounded-sm shadow-[3px_0_8px_rgba(0,0,0,0.3)] border-r border-white/10 flex flex-col items-center justify-between py-3 overflow-hidden">
                                <div className="w-6 h-2 bg-[#3A220F] rounded-sm shadow-inner"></div>
                                <span className="text-[10px] text-amber-500/90 font-serif font-bold tracking-widest [writing-mode:vertical-rl] opacity-90 rotate-180">PLAYBOOK</span>
                                <div className="w-6 h-2 bg-[#3A220F] rounded-sm shadow-inner"></div>
                            </div>
                            <div className="absolute -top-[2px] left-px right-px h-[2px] bg-[#fdfbf7] border-t border-slate-300 shadow-inner"></div>
                        </div>

                        {/* Book 2: Upright, slate */}
                        <div className="relative w-7 h-28 origin-bottom transition-all duration-300 group-hover/playbook:-translate-y-1 z-20 -ml-px shrink-0">
                            <div className="absolute inset-0 bg-[#647C88] rounded-sm shadow-[3px_0_8px_rgba(0,0,0,0.2)] border-r border-white/20 flex flex-col items-center justify-center overflow-hidden">
                                <div className="w-full h-px bg-white/30 mb-8"></div>
                                <div className="w-full h-px bg-white/30"></div>
                                <span className="absolute top-1/2 -translate-y-1/2 text-[10px] text-white/80 font-serif italic tracking-wider [writing-mode:vertical-rl] opacity-80 rotate-180">CyZ's Guide</span>
                            </div>
                            <div className="absolute -top-[2px] left-px right-px h-[2px] bg-[#fdfbf7] border-t border-slate-300 shadow-inner"></div>
                        </div>

                        {/* Book 3: Leaning softly to the LEFT (against the slate book), beige */}
                        <div className="relative w-7 h-[132px] origin-bottom -rotate-6 transition-all duration-300 group-hover/playbook:-rotate-3 group-hover/playbook:-translate-y-1 z-30 translate-x-[4px] shrink-0">
                            <div className="absolute inset-0 bg-[#D6B570] rounded-sm shadow-[2px_0_6px_rgba(0,0,0,0.2)] border-r border-white/30 flex flex-col items-center justify-between py-1.5 overflow-hidden">
                                <div className="w-full h-4 bg-[#4A3018] shadow-sm"></div>
                                <div className="w-full h-4 bg-[#4A3018] shadow-sm"></div>
                            </div>
                            <div className="absolute -top-[2px] left-px right-px h-[2px] bg-[#fdfbf7] border-t border-slate-300 transform skew-x-6 origin-bottom shadow-inner"></div>
                        </div>

                        {/* Book 4: Leaning more to the LEFT, blue with bookmark */}
                        <div className="relative w-8 h-24 origin-bottom -rotate-18 transition-all duration-300 group-hover/playbook:-rotate-12 group-hover/playbook:-translate-y-1 z-40 translate-x-[12px] shrink-0">
                            <div className="absolute inset-0 bg-[#6F9EF2] rounded-sm shadow-[2px_0_5px_rgba(0,0,0,0.2)] border-r border-white/40 flex justify-center overflow-hidden">
                                {/* Bookmark Ribbon */}
                                <div className="absolute top-0 w-3 h-14 bg-[#001F8F] shadow-[1px_0_3px_rgba(0,0,0,0.3)]">
                                    <div className="absolute bottom-0 w-0 h-0 border-solid border-l-[6px] border-r-[6px] border-b-[6px] border-b-[#6F9EF2] border-t-0 border-l-transparent border-r-transparent"></div>
                                </div>
                            </div>
                            <div className="absolute -top-[2px] left-px right-px h-[2px] bg-[#fdfbf7] border-t border-slate-300 transform skew-x-18 origin-bottom shadow-inner"></div>
                        </div>
                    </div>

                    {/* --- 4. English Module 入口 (Vintage E-Dictionary) --- */}
                    <div
                        className="absolute bottom-full left-[187px] mb-px flex items-end group/english cursor-pointer transition-transform duration-500 hover:scale-[1.03] z-50"
                        onClick={(e) => {
                            e.stopPropagation();
                            if (!isBlurred) {
                                setIsEnglishOpen(true);
                            }
                        }}
                    >
                        {/* Tooltip */}
                        <div className="absolute -top-13 left-1/2 -translate-x-1/2 opacity-0 group-hover/english:opacity-100 transition-opacity duration-300 pointer-events-none z-50">
                            <div className="bg-slate-800 text-white text-[16px] py-1.5 px-3 rounded-md font-mono tracking-widest whitespace-nowrap shadow-xl border border-white/10">
                                单词学习
                            </div>
                            <div className="w-2 h-2 bg-slate-800 rotate-45 absolute -bottom-1 left-1/2 -translate-x-1/2 border-b border-r border-white/10"></div>
                        </div>

                        {/* E-Dictionary Body */}
                        {/* 💡【外观调整】如需调整单词机物理大小，修改此处的 w-24 h-32（原本是 w-20 h-28） */}
                        <div className="relative w-32 h-32 origin-bottom transition-all duration-300 group-hover/english:-translate-y-1">
                            {/* Outer Shell */}
                            <div className="absolute inset-0 bg-[#2a2d35] rounded-[4px] shadow-[3px_2px_10px_rgba(0,0,0,0.4)] border border-slate-600/30 flex flex-col overflow-hidden">
                                {/* Top strip (brand area) */}
                                <div className="flex items-center justify-between px-1.5 py-1 bg-[#1e2028] border-b border-white/5">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400/70 animate-pulse" />
                                    <span className="text-[5px] font-mono text-slate-500 tracking-[0.15em]">LEXICON</span>
                                </div>

                                {/* LCD Screen */}
                                <div className="flex-1 mx-1.5 my-1 bg-[#1a1c22] rounded-sm border border-white/5 flex items-center justify-center overflow-hidden relative">
                                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(148,163,184,0.04),transparent_70%)]" />
                                    {mounted && idleWords.length > 0 && (
                                        <AnimatePresence mode="wait">
                                            <motion.div
                                                key={idleWordIndex}
                                                initial={{ y: 6, opacity: 0 }}
                                                animate={{ y: 0, opacity: 1 }}
                                                exit={{ y: -6, opacity: 0 }}
                                                transition={{ duration: 0.5 }} // 💡【动画调整】这里控制淡入淡出的速度，0.5代表0.5秒
                                                className="absolute inset-0 flex items-center justify-center"
                                            >
                                                {/* 💡【外观调整】如需调整屏幕内英文单词字号大小，修改此处的 text-xs（原本是 text-[8px]），或改成 text-[10px], text-sm 等 */}
                                                <span className="text-base font-mono font-bold text-slate-400/90 tracking-widest text-center px-1">
                                                    {idleWords[idleWordIndex]}
                                                </span>
                                            </motion.div>
                                        </AnimatePresence>
                                    )}
                                </div>

                                {/* Bottom buttons area */}
                                <div className="flex justify-center gap-1 px-1.5 py-1">
                                    <div className="w-4 h-1.5 rounded-full bg-slate-600/40" />
                                    <div className="w-4 h-1.5 rounded-full bg-slate-600/40" />
                                    <div className="w-4 h-1.5 rounded-full bg-slate-600/40" />
                                </div>
                            </div>
                            {/* Top edge highlight */}
                            <div className="absolute -top-px left-1 right-1 h-px bg-slate-500/20" />

                            {/* --- 新增：底部的两个支脚 (Little stands/feet) --- */}
                            <div className="absolute -bottom-1 left-2 w-3 h-2 bg-[#1e2028] border border-t-0 border-[#475569]/30 rounded-b-sm shadow-[0_2px_4px_rgba(0,0,0,0.5)] skew-x-6 z-[-1]"></div>
                            <div className="absolute -bottom-1 right-2 w-3 h-2 bg-[#1e2028] border border-t-0 border-[#475569]/30 rounded-b-sm shadow-[0_2px_4px_rgba(0,0,0,0.5)] -skew-x-6 z-[-1]"></div>
                        </div>
                    </div>
                </div>
            </div>

            {mounted && (
                <PlaybookModal
                    isOpen={isPlaybookOpen}
                    onClose={() => setIsPlaybookOpen(false)}
                />
            )}

            {mounted && (
                <EnglishModuleModal
                    isOpen={isEnglishOpen}
                    onClose={() => setIsEnglishOpen(false)}
                    onOpenList={() => {
                        setIsEnglishOpen(false);
                        setIsListOpen(true);
                    }}
                />
            )}

            {mounted && (
                <VocabularyListModal
                    isOpen={isListOpen}
                    onClose={() => setIsListOpen(false)}
                    onBackToDevice={() => {
                        setIsListOpen(false);
                        setIsEnglishOpen(true);
                    }}
                />
            )}
        </>
    );
}