"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState, useMemo } from "react";
import { createPortal } from "react-dom";
import { X, List, ChevronLeft, ChevronRight } from "lucide-react";

import { supabase } from "@/lib/supabaseClient";

interface WordEntry {
    id: number;
    word: string;
    translation: string;
    status: "unknown" | "vague" | "mastered";
    batch_id: number;
}

interface EnglishModuleModalProps {
    isOpen: boolean;
    onClose: () => void;
    onOpenList: () => void;
}

export default function EnglishModuleModal({ isOpen, onClose, onOpenList }: EnglishModuleModalProps) {
    const [mounted, setMounted] = useState(false);

    // 💡【批次切换与数据源】
    const [totalBatches, setTotalBatches] = useState(39);
    const [currentBatchId, setCurrentBatchId] = useState(1);
    const [batchInput, setBatchInput] = useState("1");
    const [batch, setBatch] = useState<WordEntry[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const fetchBatch = async (batchId: number) => {
        setIsLoading(true);
        const { data, error } = await supabase
            .from('vocabulary')
            .select('*')
            .eq('batch_id', batchId)
            .order('id', { ascending: true });

        if (!error && data) {
            const words = data as WordEntry[];
            setBatch(words);
            // 切换批次时清空本地覆盖状态，使用远端真实状态
            setStatuses({});
            setShowTranslation(false);
            // 直接从拉取到的数据里抽第一个词，避免二次触发
            const pool = words.filter(w => w.status !== 'mastered');
            if (pool.length > 0) {
                setCurrentWord(pool[Math.floor(Math.random() * pool.length)]);
            } else {
                setCurrentWord(null);
            }
        }

        // 顺便更新一次总批次数
        const { data: maxObj } = await supabase
            .from('vocabulary')
            .select('batch_id')
            .order('batch_id', { ascending: false })
            .limit(1)
            .single();
        if (maxObj) setTotalBatches(maxObj.batch_id);

        setIsLoading(false);
    };

    // 监听批次切换，拉取新数据
    useEffect(() => {
        if (isOpen) {
            fetchBatch(currentBatchId);
        }
    }, [isOpen, currentBatchId]);

    // Sync batch input display
    useEffect(() => { setBatchInput(currentBatchId.toString()); }, [currentBatchId]);

    const handleBatchInputBlur = () => {
        let val = parseInt(batchInput);
        if (isNaN(val) || val < 1) val = 1;
        if (val > totalBatches) val = totalBatches;
        setCurrentBatchId(val);
        setBatchInput(val.toString());
    };

    // 本地学习状态
    const [statuses, setStatuses] = useState<Record<number, string>>({});
    // 当前单词索引（在未掌握的词中随机）
    const [currentWord, setCurrentWord] = useState<WordEntry | null>(null);
    // 是否显示译文
    const [showTranslation, setShowTranslation] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // 从未掌握的词中随机抽一个
    const pickNextWord = () => {
        const pool = batch.filter(w => {
            const s = statuses[w.id] || w.status;
            return s !== "mastered";
        });
        if (pool.length === 0) {
            setCurrentWord(null);
            return;
        }
        const idx = Math.floor(Math.random() * pool.length);
        setCurrentWord(pool[idx]);
        setShowTranslation(false);
    };

    // 数据加载完毕后无需额外抽词（已在 fetchBatch 中完成）

    // 处理用户反馈
    const handleFeedback = async (feedback: "vague" | "unknown" | "mastered") => {
        if (!currentWord) return;

        // 1. 本地乐观更新
        setStatuses(prev => ({ ...prev, [currentWord.id]: feedback }));
        pickNextWord(); // 反馈后立刻切到下一个词

        // 2. 远端静默保存
        await supabase
            .from('vocabulary')
            .update({ status: feedback })
            .eq('id', currentWord.id);
    };

    // 下一个词
    const handleNext = () => {
        pickNextWord();
    };

    // 防止 body 滚动
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
        }
        return () => { document.body.style.overflow = "unset"; };
    }, [isOpen]);

    // 关闭时重置
    useEffect(() => {
        if (!isOpen) {
            setCurrentWord(null);
            setShowTranslation(false);
        }
    }, [isOpen]);

    if (!mounted) return null;

    const masteredCount = Object.values(statuses).filter(s => s === "mastered").length;
    const totalInBatch = batch.length;

    const modalContent = (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-100 flex items-center justify-center pointer-events-auto">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="absolute inset-0 bg-black/35 backdrop-blur-sm"
                        onClick={(e) => {
                            e.stopPropagation();
                            onClose();
                        }}
                    />

                    {/* E-Dictionary Container */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.92, y: 16 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.96, y: 8 }}
                        transition={{ type: "spring", damping: 30, stiffness: 400, mass: 0.8 }}
                        className="relative w-[90vw] max-w-2xl bg-[#2a2d35] rounded-xl shadow-2xl overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Device Top Bar */}
                        <div className="flex items-center justify-between px-5 py-3 bg-[#1e2028] border-b border-white/5">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-emerald-400/80 animate-pulse" />
                                <span className="text-[10px] font-mono text-slate-400 tracking-widest">LEXICON_V1</span>
                                {/* 💡【批次选择器】循环箭头 + 手动输入 */}
                                <span className="text-slate-600 text-[10px]">—</span>
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => setCurrentBatchId(prev => prev <= 1 ? totalBatches : prev - 1)}
                                        className="p-0.5 text-slate-500 hover:text-slate-300 transition-colors"
                                    >
                                        <ChevronLeft size={12} />
                                    </button>
                                    <span className="text-[10px] font-mono text-slate-400 tracking-widest flex items-center">
                                        BATCH
                                        <input
                                            type="text"
                                            value={batchInput}
                                            onChange={e => setBatchInput(e.target.value)}
                                            onBlur={handleBatchInputBlur}
                                            onKeyDown={e => { if (e.key === 'Enter') handleBatchInputBlur(); }}
                                            className="w-7 mx-0.5 bg-transparent border-b border-slate-600 focus:border-emerald-500 text-center outline-none text-slate-300 text-[10px] font-mono transition-colors"
                                        />
                                        / {totalBatches}
                                    </span>
                                    <button
                                        onClick={() => setCurrentBatchId(prev => prev >= totalBatches ? 1 : prev + 1)}
                                        className="p-0.5 text-slate-500 hover:text-slate-300 transition-colors"
                                    >
                                        <ChevronRight size={12} />
                                    </button>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={(e) => { e.stopPropagation(); onOpenList(); }}
                                    className="p-1 text-slate-500 hover:text-slate-300 transition-colors rounded-full hover:bg-white/5"
                                    title="Vocabulary List"
                                >
                                    <List size={18} />
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); onClose(); }}
                                    className="p-1 text-slate-500 hover:text-slate-300 transition-colors rounded-full hover:bg-white/5"
                                >
                                    <X size={18} />
                                </button>
                            </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="px-5 pt-3 pb-1">
                            <div className="flex justify-between items-center mb-1.5">
                                <span className="text-[10px] font-mono text-slate-500 tracking-wider">MASTERY</span>
                                <span className="text-[10px] font-mono text-slate-500">{masteredCount} / {totalInBatch}</span>
                            </div>
                            <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                                <motion.div
                                    className="h-full bg-emerald-500/60 rounded-full"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${(masteredCount / totalInBatch) * 100}%` }}
                                    transition={{ duration: 0.5 }}
                                />
                            </div>
                        </div>

                        {/* LCD Screen Area */}
                        <div className="mx-5 my-4 bg-[#1a1c22] rounded-lg border border-white/5 p-12 min-h-[370px] flex flex-col items-center justify-center relative">
                            {/* Subtle screen glow */}
                            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(148,163,184,0.03),transparent_70%)] pointer-events-none rounded-lg" />

                            {currentWord ? (
                                <>
                                    <AnimatePresence mode="wait">
                                        <motion.div
                                            key={currentWord.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            transition={{ duration: 0.3 }}
                                            className="flex flex-col items-center gap-4 w-full"
                                        >
                                            {/* Word Display */}
                                            <h2 className="text-3xl md:text-6xl font-serif text-slate-200 tracking-wide text-center">
                                                {currentWord.word}
                                            </h2>

                                            {/* Translation Area */}
                                            <div className="min-h-[60px] flex items-center justify-center mt-2 w-full">
                                                {!showTranslation ? (
                                                    <button
                                                        onClick={() => setShowTranslation(true)}
                                                        className="px-4 py-1.5 rounded-md bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 text-slate-400 text-sm tracking-widest transition-all duration-300"
                                                    >
                                                        [ 查看翻译 ]
                                                    </button>
                                                ) : (
                                                    <AnimatePresence>
                                                        {currentWord.translation && (
                                                            <motion.p
                                                                initial={{ opacity: 0, height: 0 }}
                                                                animate={{ opacity: 1, height: "auto" }}
                                                                exit={{ opacity: 0, height: 0 }}
                                                                className="text-lg text-slate-400 font-sans text-center leading-relaxed"
                                                            >
                                                                {currentWord.translation}
                                                            </motion.p>
                                                        )}
                                                    </AnimatePresence>
                                                )}
                                            </div>
                                        </motion.div>
                                    </AnimatePresence>

                                    {/* Skip Button (Bottom Right corner，移出动画区域保持位置固定) */}
                                    <div className="absolute bottom-4 right-5 z-10">
                                        <button
                                            onClick={handleNext}
                                            className="text-base font-mono text-slate-500 hover:text-slate-300 transition-colors"
                                        >
                                            [ Skip ]
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <div className="text-center">
                                    <p className="text-slate-500 font-mono text-sm">ALL_WORDS_MASTERED</p>
                                    <p className="text-slate-600 text-xs mt-2">当前批次已全部掌握</p>
                                </div>
                            )}
                        </div>

                        {/* Action Buttons */}
                        <div className="px-5 pb-5">
                            {currentWord && (
                                <div className="grid grid-cols-3 gap-3">
                                    <button
                                        onClick={() => handleFeedback("vague")}
                                        className="flex flex-col items-center gap-1 py-3 px-2 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 hover:border-amber-500/40 transition-all duration-300 group"
                                    >
                                        <span className="text-amber-400 text-2xl">~</span>
                                        <span className="text-[15px] font-mono text-amber-400/80 tracking-wider">模糊</span>
                                    </button>
                                    <button
                                        onClick={() => handleFeedback("unknown")}
                                        className="flex flex-col items-center gap-1 py-3 px-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/40 transition-all duration-300 group"
                                    >
                                        <span className="text-red-400 text-2xl">?</span>
                                        <span className="text-[15px] font-mono text-red-400/80 tracking-wider">没见过</span>
                                    </button>
                                    <button
                                        onClick={() => handleFeedback("mastered")}
                                        className="flex flex-col items-center gap-1 py-3 px-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 hover:border-emerald-500/40 transition-all duration-300 group"
                                    >
                                        <span className="text-emerald-400 text-2xl">✓</span>
                                        <span className="text-[15px] font-mono text-emerald-400/80 tracking-wider">掌握</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div >
            )
            }
        </AnimatePresence >
    );

    return createPortal(modalContent, document.body);
}
