"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState, useMemo } from "react";
import { createPortal } from "react-dom";
import { X, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

interface WordEntry {
    id: number;
    word: string;
    translation: string;
    status: "unknown" | "vague" | "mastered";
    batch_id: number;
}

interface VocabularyListModalProps {
    isOpen: boolean;
    onClose: () => void;
    onBackToDevice: () => void;
}

export default function VocabularyListModal({ isOpen, onClose, onBackToDevice }: VocabularyListModalProps) {
    const [mounted, setMounted] = useState(false);
    const [activeTab, setActiveTab] = useState<"all" | "unknown" | "vague" | "mastered">("all");
    const [searchQuery, setSearchQuery] = useState("");
    // 💡【批次切换】当前显示的批次 ID
    const [currentBatchId, setCurrentBatchId] = useState(1);
    const [batchInput, setBatchInput] = useState("1");
    // 本地状态覆盖（点击状态标签时更新）
    const [statuses, setStatuses] = useState<Record<number, string>>({});

    // 数据源控制状态
    const [totalBatches, setTotalBatches] = useState(39);
    const [basePool, setBasePool] = useState<WordEntry[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // 加载核心数据 (按批次加载)
    const fetchBatch = async (batchId: number) => {
        setIsLoading(true);
        const { data, error } = await supabase
            .from('vocabulary')
            .select('*')
            .eq('batch_id', batchId)
            .order('id', { ascending: true });

        if (!error && data) {
            setBasePool(data as WordEntry[]);
        }

        // 仅获取一次最大总批次
        if (totalBatches === 39) {
            const { data: maxObj } = await supabase.from('vocabulary').select('batch_id').order('batch_id', { ascending: false }).limit(1).single();
            if (maxObj) setTotalBatches(maxObj.batch_id);
        }
        setIsLoading(false);
    };

    // 全局搜索调用
    const fetchSearch = async (query: string) => {
        setIsLoading(true);
        const { data, error } = await supabase
            .from('vocabulary')
            .select('*')
            .or(`word.ilike.%${query}%,translation.ilike.%${query}%`)
            .limit(100);

        if (!error && data) {
            setBasePool(data as WordEntry[]);
        }
        setIsLoading(false);
    };

    // 监听：搜索词变更和批次变更，包含防抖机制
    useEffect(() => {
        if (!isOpen) return;

        if (searchQuery.trim()) {
            const timeoutId = setTimeout(() => {
                fetchSearch(searchQuery.trim());
            }, 500);
            return () => clearTimeout(timeoutId);
        } else {
            fetchBatch(currentBatchId);
        }
    }, [searchQuery, currentBatchId, isOpen]);

    // Sync input with actual batch ID
    useEffect(() => {
        setBatchInput(currentBatchId.toString());
    }, [currentBatchId]);

    const handleBatchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setBatchInput(e.target.value);
    };

    const handleBatchInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') handleBatchInputBlur();
    };

    const handleBatchInputBlur = () => {
        let val = parseInt(batchInput);
        if (isNaN(val) || val < 1) val = 1;
        if (val > totalBatches) val = totalBatches;
        setCurrentBatchId(val);
        setBatchInput(val.toString());
    };

    // 获取某个词的有效状态（本地覆盖优先）
    const getStatus = (item: WordEntry) => {
        return (statuses[item.id] || item.status || "unknown") as "unknown" | "vague" | "mastered";
    };

    // 点击状态标签时轮换：unknown → vague → mastered → unknown
    const cycleStatus = async (item: WordEntry) => {
        const current = getStatus(item);
        const next = current === "unknown" ? "vague" : current === "vague" ? "mastered" : "unknown";

        // 乐观更新
        setStatuses(prev => ({ ...prev, [item.id]: next }));

        // 写回数据库
        await supabase
            .from('vocabulary')
            .update({ status: next })
            .eq('id', item.id);
    };

    // 统计各状态的数量
    const counts = useMemo(() => {
        let unknown = 0;
        let vague = 0;
        let mastered = 0;
        basePool.forEach(w => {
            const s = getStatus(w);
            if (s === "mastered") mastered++;
            else if (s === "vague") vague++;
            else unknown++;
        });
        return {
            all: basePool.length,
            unknown,
            vague,
            mastered
        };
    }, [basePool, statuses]);

    // Filter logic
    const filteredWords = useMemo(() => {
        let result = basePool;
        if (activeTab === "unknown") {
            result = result.filter(w => getStatus(w) === "unknown");
        } else if (activeTab === "vague") {
            result = result.filter(w => getStatus(w) === "vague");
        } else if (activeTab === "mastered") {
            result = result.filter(w => getStatus(w) === "mastered");
        }
        return result;
    }, [basePool, activeTab, statuses]);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Prevent body scroll
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
        }
        return () => { document.body.style.overflow = "unset"; };
    }, [isOpen]);

    if (!mounted) return null;

    const modalContent = (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-100 flex items-center justify-center pointer-events-auto p-4 sm:p-6">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="absolute inset-0 bg-[#0f1115]/80 backdrop-blur-md"
                        onClick={(e) => {
                            e.stopPropagation();
                            onClose();
                        }}
                    />

                    {/* Main Container */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.98, y: 10 }}
                        transition={{ type: "spring", damping: 30, stiffness: 350 }}
                        className="relative w-full max-w-4xl h-[85vh] bg-[#1a1c23] border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 bg-[#21232c] border-b border-white/5">
                            <div>
                                <h1 className="text-xl font-serif text-slate-200">Vocabulary Dashboard</h1>
                                {/* 💡【批次切换】左右箭头循环切换，兼具手动输入 */}
                                <div className="flex items-center gap-2 mt-1">
                                    <button
                                        onClick={() => setCurrentBatchId(prev => prev <= 1 ? totalBatches : prev - 1)}
                                        className="p-0.5 text-slate-500 hover:text-slate-300 transition-colors"
                                    >
                                        <ChevronLeft size={14} />
                                    </button>
                                    <div className="flex items-center text-xs font-mono text-slate-500 tracking-widest">
                                        BATCH
                                        <input
                                            type="text"
                                            value={batchInput}
                                            onChange={handleBatchInputChange}
                                            onBlur={handleBatchInputBlur}
                                            onKeyDown={handleBatchInputKeyDown}
                                            className="w-10 mx-1 bg-transparent border-b border-slate-600 focus:border-emerald-500 text-center outline-none text-slate-300 transition-colors"
                                        />
                                        / {totalBatches}
                                        {searchQuery.trim() ? (
                                            <span className="ml-2 text-emerald-400/80">
                                                • GLOBAL SEARCH
                                            </span>
                                        ) : (
                                            <span className="ml-2">
                                                • {isLoading ? '...' : basePool.length} WORDS
                                            </span>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => setCurrentBatchId(prev => prev >= totalBatches ? 1 : prev + 1)}
                                        className="p-0.5 text-slate-500 hover:text-slate-300 transition-colors"
                                    >
                                        <ChevronRight size={14} />
                                    </button>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={onBackToDevice}
                                    className="px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-sm font-mono rounded-lg transition-colors border border-emerald-500/20"
                                >
                                    ← Back to Device
                                </button>
                                <button
                                    onClick={onClose}
                                    className="p-2 text-slate-400 hover:text-white transition-colors rounded-lg hover:bg-white/5"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                        </div>

                        {/* Toolbar */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-6 py-4 gap-4 bg-[#1a1c23]">
                            {/* Tabs */}
                            <div className="flex bg-[#232630] p-1 rounded-lg">
                                <button
                                    onClick={() => setActiveTab("all")}
                                    className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${activeTab === "all" ? "bg-[#333745] text-white shadow-sm" : "text-slate-400 hover:text-slate-200"}`}
                                >
                                    所有 ({counts.all})
                                </button>
                                <button
                                    onClick={() => setActiveTab("unknown")}
                                    className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${activeTab === "unknown" ? "bg-[#333745] text-white shadow-sm" : "text-slate-400 hover:text-slate-200"}`}
                                >
                                    没见过 ({counts.unknown})
                                </button>
                                <button
                                    onClick={() => setActiveTab("vague")}
                                    className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${activeTab === "vague" ? "bg-[#333745] text-white shadow-sm" : "text-slate-400 hover:text-slate-200"}`}
                                >
                                    模糊 ({counts.vague})
                                </button>
                                <button
                                    onClick={() => setActiveTab("mastered")}
                                    className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${activeTab === "mastered" ? "bg-[#333745] text-white shadow-sm" : "text-slate-400 hover:text-slate-200"}`}
                                >
                                    已掌握 ({counts.mastered})
                                </button>
                            </div>

                            {/* Search */}
                            <div className="relative w-full sm:w-64">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                                    <Search size={16} />
                                </span>
                                <input
                                    type="text"
                                    placeholder="Search words..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full bg-[#232630] text-slate-200 text-sm rounded-lg pl-9 pr-4 py-2 border border-transparent focus:border-emerald-500/30 focus:outline-none transition-colors placeholder:text-slate-500"
                                />
                            </div>
                        </div>

                        {/* Table Header */}
                        {/* 💡【对齐调整】此处的 px-6 控制了距离左右边框的缩进，与下方数据行的 px-6 对应。 */}
                        {/* 💡 text-center 让 STATUS 居中，与下方数据行的 justify-center 对齐 */}
                        <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-[#1e2028] border-y border-white/5 text-xs font-mono text-slate-500 tracking-wider">
                            <div className="col-span-1 border-r border-white/5">#</div>
                            <div className="col-span-3 border-r border-white/5">WORD</div>
                            <div className="col-span-6 border-r border-white/5">TRANSLATION</div>
                            <div className="col-span-2 text-center">STATUS</div>
                        </div>

                        {/* List Body */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
                            {filteredWords.length > 0 ? (
                                <div className="flex flex-col gap-1">
                                    {filteredWords.map((item, index) => (
                                        <div
                                            key={item.id}
                                            className="grid grid-cols-12 gap-4 px-6 py-4 rounded-lg hover:bg-white/2 transition-colors items-center group"
                                        >
                                            <div className="col-span-1 border-r border-white/5 pr-2">
                                                <div className="text-slate-600 font-mono text-xs">
                                                    {String(item.id).padStart(4, '0')}
                                                </div>
                                                {searchQuery.trim() && (
                                                    <div className="text-[10px] text-emerald-500/50 mt-0.5">
                                                        B{item.batch_id}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="col-span-3">
                                                <span className="text-slate-200 font-serif text-lg tracking-wide group-hover:text-emerald-400 transition-colors">
                                                    {item.word}
                                                </span>
                                            </div>
                                            <div className="col-span-6 text-slate-400 text-sm truncate pr-4" title={item.translation}>
                                                {item.translation || <span className="text-slate-600 italic">No translation yet</span>}
                                            </div>
                                            {/* 💡【可点击状态】点击轮换 unknown→vague→mastered→unknown */}
                                            <div className="col-span-2 flex justify-center">
                                                <button
                                                    onClick={() => cycleStatus(item)}
                                                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border cursor-pointer hover:scale-105 active:scale-95 transition-all
                                                        ${getStatus(item) === "mastered" ? "text-emerald-400 bg-emerald-400/10 border-emerald-400/20 hover:bg-emerald-400/20" :
                                                            getStatus(item) === "vague" ? "text-amber-400 bg-amber-400/10 border-amber-400/20 hover:bg-amber-400/20" :
                                                                "text-slate-400 bg-slate-400/10 border-slate-400/20 hover:bg-slate-400/20"}`}
                                                    title="Click to change status"
                                                >
                                                    <span className={`w-1.5 h-1.5 rounded-full 
                                                        ${getStatus(item) === "mastered" ? "bg-emerald-400" :
                                                            getStatus(item) === "vague" ? "bg-amber-400" :
                                                                "bg-slate-400 animate-pulse"}`}
                                                    />
                                                    {getStatus(item) === "mastered" ? "Mastered" :
                                                        getStatus(item) === "vague" ? "Vague" : "Unknown"}
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-slate-500">
                                    <div className="w-12 h-12 mb-4 rounded-full bg-slate-800/50 flex items-center justify-center text-xl">🔍</div>
                                    <p>No words found matching your criteria</p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );

    return createPortal(modalContent, document.body);
}
