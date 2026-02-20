"use client";

import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Link from 'next/link';
import { Origami, Settings, Database } from 'lucide-react';
import CalendarWidget from './components/CalendarWidget';
import { IoLibrary } from "react-icons/io5";
import { useRouter } from 'next/navigation';
import WindowView from './components/WindowView';
import HobbySystem from './components/HobbySystem';
import TimelineWidget from './components/TimelineWidget';
import DailyProtocol from './components/DailyProtocol';
import ToolboxWidget from './components/ToolboxWidget';
import CollectionCabinet from './components/CollectionCabinet';
import StatusWidget from './components/StatusWidget';

import { supabase } from '@/lib/supabaseClient';

interface QuoteItem {
    id: number;
    text: string;
}

export default function ProfilePage() {
    const router = useRouter();
    const [isWindowOpen, setIsWindowOpen] = useState(false);
    const [activeModule, setActiveModule] = useState<'idle' | 'hobby' | 'timeline' | 'protocol' | 'toolbox' | 'cabinet' | 'status' | 'calendar'>('idle');

    const [quotes, setQuotes] = useState<QuoteItem[]>([{ id: 0, text: "Loading data..." }]);
    const [quoteIndex, setQuoteIndex] = useState(0);
    const [backBtnHover, setBackBtnHover] = useState(false);
    const [libHover, setLibHover] = useState(false);

    // 依然保留 isAdmin 状态，为了传给子组件做内联编辑的权限控制
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        const initData = async () => {
            const { data } = await supabase.from('profile_quotes').select('*');
            if (data && data.length > 0) {
                // Fisher-Yates Shuffle
                const shuffled = [...data];
                for (let i = shuffled.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
                }
                setQuotes(shuffled);
            }

            const { data: { user } } = await supabase.auth.getUser();
            setIsAdmin(!!user);
        };
        initData();
    }, []);

    const handleNextQuote = () => {
        if (quotes.length === 0) return;
        setQuoteIndex((prev) => (prev + 1) % quotes.length);
    };

    useEffect(() => {
        if (quotes.length <= 1) return;
        const timer = setTimeout(() => {
            setQuoteIndex((prev) => (prev + 1) % quotes.length);
        }, 5000);
        return () => clearTimeout(timer);
    }, [quoteIndex, quotes.length]);

    return (
        <div className="relative w-full h-screen overflow-hidden bg-[#f8fafc] flex items-center justify-center text-slate-800 selection:bg-blue-200/50">
            <style dangerouslySetInnerHTML={{
                __html: `
                :root {
                    color-scheme: light !important;
                }
                ::-webkit-scrollbar {
                    width: 8px;
                    height: 8px;
                }
                ::-webkit-scrollbar-track {
                    background: transparent;
                }
                ::-webkit-scrollbar-thumb {
                    background: #e2e8f0 !important;
                    border-radius: 10px;
                    border: 2px solid transparent;
                    background-clip: content-box;
                }
                ::-webkit-scrollbar-thumb:hover {
                    background: #cbd5e1 !important;
                }
                * {
                    scrollbar-width: thin;
                    scrollbar-color: #e2e8f0 transparent !important;
                }
            ` }} />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,#ffffff_0%,#f1f5f9_70%)] opacity-100 pointer-events-none" />
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-size-[40px_40px] opacity-40 pointer-events-none" />

            {/* Header Container - Restore Flex Layout for correct positioning */}
            <div className="absolute top-[8%] z-40 flex flex-col items-center gap-6 pointer-events-none w-full">

                {/* Title Section Wrapper - Animates independently */}
                <motion.div
                    animate={{
                        opacity: activeModule === 'idle' ? 1 : 0,
                        y: activeModule === 'idle' ? 0 : -50,
                        pointerEvents: activeModule === 'idle' ? 'auto' : 'none'
                    }}
                    transition={{ duration: 0.5, ease: "easeInOut" }}
                    className="flex flex-col items-center gap-6 pointer-events-auto"
                >
                    <div className="relative flex items-center justify-center min-w-[300px] md:min-w-[600px]">

                        {/* Calendar Widget - Above Lab_Archive (Idle Only) */}
                        {activeModule !== 'calendar' && (
                            <div className="absolute right-[calc(50%+13.5rem)] hidden md:flex -translate-y-11">
                                <CalendarWidget
                                    isActive={false}
                                    onToggle={() => setActiveModule('calendar')}
                                    isAdmin={isAdmin}
                                />
                            </div>
                        )}


                        <Link
                            href="/"
                            onMouseEnter={() => setBackBtnHover(true)}
                            onMouseLeave={() => setBackBtnHover(false)}
                            className="absolute right-[calc(50%+12rem)] hidden md:flex items-center gap-4 px-5 py-2.5 rounded-2xl transition-all duration-500 group translate-y-8 overflow-hidden backdrop-blur-xl"
                            style={{ boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 10px 15px -3px rgba(0, 0, 0, 0.1), inset 0 1px 1px rgba(255,255,255,0.8)' }}
                        >
                            <motion.div className="absolute inset-0 bg-linear-to-b from-white/90 to-slate-50/80 rounded-2xl border-t border-l border-white border-b border-r transition-all duration-500"
                                animate={{ backgroundColor: backBtnHover ? 'rgba(239, 246, 255, 0.95)' : 'rgba(255, 255, 255, 0.9)', boxShadow: backBtnHover ? '0 20px 25px -5px rgba(0, 0, 0, 0.1)' : '0 10px 15px -3px rgba(0, 0, 0, 0.05)' }} />
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(59,130,246,0.05),transparent_70%)]" />
                            <motion.div className="absolute inset-0 z-20 pointer-events-none" initial={{ x: '-150%', skewX: -25 }} animate={{ x: backBtnHover ? '150%' : '-150%' }} transition={{ duration: 0.8, ease: "easeInOut" }} style={{ background: 'linear-gradient(90deg, transparent, rgba(59, 130, 246, 0.3), transparent)', }} />
                            <div className="flex flex-col items-end relative z-10">
                                <span className="text-[9px] font-mono text-slate-400 leading-none tracking-[0.2em] mb-1">SYSTEM_BACK</span>
                                <span className="text-[13px] font-bold text-slate-700 tracking-tighter uppercase whitespace-nowrap">
                                    [ <span className="text-blue-600/60 uppercase group-hover:text-blue-600 transition-colors">Lab_Archive</span> ]
                                </span>
                            </div>
                            <div className="relative z-10 text-slate-700/80 group-hover:text-slate-900 transition-colors">
                                <Origami size={28} className="stroke-[1.5] group-hover:rotate-12 transition-transform" />
                                <motion.div className="absolute -inset-1 bg-blue-400/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 2 }} />
                            </div>
                        </Link>

                        <h1 className="text-3xl md:text-5xl font-bold tracking-tighter text-slate-800 font-sans uppercase drop-shadow-sm px-10">
                            CYZ's <span className="font-mono text-blue-600">Room</span>
                        </h1>

                        {/* [Redesign v3] Admin Entry (Moved Up & Larger) */}
                        <div className="absolute left-[calc(50%+13.5rem)] hidden md:flex flex-col items-start gap-0.5 -translate-y-12 group">
                            <button
                                onClick={() => router.push('/admin/room')}
                                className="flex items-center gap-2 px-5 py-2 rounded-xl transition-all duration-500 relative overflow-hidden active:scale-95 group/btn opacity-60 hover:opacity-100"
                            >
                                <div className="flex items-center gap-2">
                                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-100/50 group-hover:bg-slate-200/50 transition-colors duration-500">
                                        <Settings size={16} className="text-slate-400 group-hover:text-slate-600 group-hover:rotate-45 transition-all duration-700" />
                                    </div>
                                    <span className="text-[12px] font-bold text-slate-400 group-hover:text-slate-600 tracking-wider transition-colors duration-500">
                                        ADMIN_ROOT
                                    </span>
                                </div>
                            </button>
                        </div>

                        {/* Library Entrance (Scheme B Style) */}
                        <button
                            onClick={() => router.push('/library')}
                            onMouseEnter={() => setLibHover(true)}
                            onMouseLeave={() => setLibHover(false)}
                            className="absolute left-[calc(50%+13.5rem)] hidden md:flex items-center gap-4 px-5 py-2.5 rounded-2xl transition-all duration-500 group translate-y-8 overflow-hidden backdrop-blur-xl"
                            style={{ boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 10px 15px -3px rgba(0, 0, 0, 0.1), inset 0 1px 1px rgba(255,255,255,0.8)' }}
                        >
                            {/* Glass Background */}
                            <motion.div className="absolute inset-0 bg-linear-to-b from-white/90 to-slate-50/80 rounded-2xl border-t border-l border-white border-b border-r transition-all duration-500"
                                animate={{ backgroundColor: libHover ? 'rgba(255, 247, 237, 0.95)' : 'rgba(255, 255, 255, 0.9)', boxShadow: libHover ? '0 20px 25px -5px rgba(0, 0, 0, 0.1)' : '0 10px 15px -3px rgba(0, 0, 0, 0.05)' }} />

                            {/* Inner Decoration */}
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(249,115,22,0.05),transparent_70%)]" />
                            <motion.div className="absolute inset-0 z-20 pointer-events-none" initial={{ x: '-150%', skewX: -25 }} animate={{ x: libHover ? '150%' : '-150%' }} transition={{ duration: 0.8, ease: "easeInOut" }} style={{ background: 'linear-gradient(90deg, transparent, rgba(249, 115, 22, 0.2), transparent)', }} />

                            {/* Content: Icon Left, Text Right */}
                            <div className="relative z-10 text-slate-700/80 group-hover:text-orange-600 transition-colors">
                                <IoLibrary size={24} className="group-hover:-rotate-12 transition-transform" />
                            </div>

                            <div className="flex flex-col items-start relative z-10">
                                <span className="text-[9px] font-mono text-slate-400 leading-none tracking-[0.2em] mb-1">DATA_NEXUS</span>
                                <span className="text-[13px] font-bold text-slate-700 tracking-tighter uppercase whitespace-nowrap">
                                    [ <span className="text-orange-500/60 uppercase group-hover:text-orange-500 transition-colors">Library</span> ]
                                </span>
                            </div>
                        </button>
                    </div>
                </motion.div>

                {/* Status Widget (Idle State Only) */}
                {/* Render here ONLY if not active status, so it's part of the proper layout flow */}
                {/* When activeModule === 'status', this unmounts and the Root one mounts, creating the morph */}
                {activeModule !== 'status' && (
                    <div className="pointer-events-auto">
                        <StatusWidget
                            isActive={false}
                            isIdle={activeModule === 'idle'}
                            onToggle={() => setActiveModule(prev => prev === 'status' ? 'idle' : 'status')}
                        />
                    </div>
                )}
            </div>

            {/* Status Widget (Expanded State Only) - Root Level z-index 50 */}
            <AnimatePresence>
                {activeModule === 'status' && (
                    <StatusWidget
                        isActive={true}
                        isIdle={false}
                        onToggle={() => setActiveModule('idle')}
                    />
                )}
            </AnimatePresence>

            {/* Calendar Widget (Expanded State Only) - Root Level z-index 50 */}
            <AnimatePresence>
                {activeModule === 'calendar' && (
                    <CalendarWidget
                        isActive={true}
                        onToggle={() => setActiveModule('idle')}
                        isAdmin={isAdmin}
                    />
                )}
            </AnimatePresence>

            {/* Profile 页面主体内容 */}
            <div className="absolute left-10 md:left-25 top-[2%] z-30 flex flex-col items-center">
                <motion.div className="relative w-32 h-32 md:w-65 md:h-45 cursor-pointer group" whileHover={{ scale: 1.05 }} transition={{ duration: 0.4 }}>
                    <div className="absolute -inset-0.5 bg-linear-to-tr from-blue-200 to-purple-200 rounded-xl blur-sm opacity-0 group-hover:opacity-100 transition-all duration-500" />
                    <div className="absolute inset-0 bg-white rounded-xl border border-slate-200 shadow-xl overflow-hidden ring-1 ring-slate-100">
                        <div className="relative w-full h-full bg-slate-100">
                            <img src="images/kei_asai.png" alt="Avatar" className="w-full h-full object-cover transition-all duration-700 filter grayscale contrast-125 group-hover:grayscale-0 group-hover:contrast-100" />
                            <div className="absolute inset-0 bg-blue-500/10 mix-blend-overlay transition-opacity duration-700 group-hover:opacity-0" />
                        </div>
                        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_50%,rgba(0,0,0,0.05)_50%)] bg-size-[100%_4px] pointer-events-none z-20 opacity-50" />
                        <div className="absolute top-2 left-2 w-1 h-1 bg-white rounded-full z-40 shadow-sm" />
                        <div className="absolute top-2 right-2 w-1 h-1 bg-white rounded-full z-40 shadow-sm" />
                    </div>
                    <div className="absolute left-[105%] top-2 flex flex-col gap-3 pointer-events-none whitespace-nowrap">
                        <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400/40 group-hover:text-slate-800 transition-colors duration-500">
                            <div className="w-1 h-3 bg-blue-500/20" />
                            <span className="tracking-[0.3em] uppercase">From</span>
                        </div>
                        <div className="flex flex-col text-[14px] font-medium text-slate-400/30 group-hover:text-blue-800 transition-colors duration-700 leading-relaxed">
                            <span className="tracking-widest [writing-mode:vertical-lr]">重启咲良田</span>
                            <div className="h-4 w-px bg-slate-200 my-1 ml-1.5" />
                            <span className="tracking-widest [writing-mode:vertical-lr]">浅井惠</span>
                        </div>
                    </div>
                </motion.div>
                <div className="h-10 w-px bg-linear-to-b from-slate-300 to-transparent mt-4" />
            </div>

            <div className="absolute left-10 md:left-12 top-[15.5%] z-20 select-none">
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1 }} className="relative flex items-start">
                    <svg width="40" height="120" className="opacity-35 overflow-visible pointer-events-none">
                        <line x1="52" y1="-70" x2="1" y2="-30" stroke="#3b82f6" strokeWidth="1" />
                        <line x1="1" y1="-30" x2="1" y2="80" stroke="#3b82f6" strokeWidth="1" />
                        <line x1="1" y1="80" x2="30" y2="110" stroke="#3b82f6" strokeWidth="1" />
                        <motion.circle key={quoteIndex} r="2" fill="#3b82f6" animate={{ cx: [52, 1, 1, 30], cy: [-70, -30, 80, 110], opacity: [0, 1, 1, 0] }} transition={{ duration: 5, repeat: Infinity, ease: "linear" }} />
                    </svg>
                    <div className="mt-20 -ml-2 pointer-events-auto cursor-pointer" onClick={handleNextQuote}>
                        <motion.div initial={{ x: -10, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.5 }} className="bg-white/20 backdrop-blur-xs p-5 border-l-2 border-blue-400 group hover:bg-white/10 transition-colors rounded-r-lg shadow-sm h-[140px] w-[320px] flex flex-col justify-between">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
                                <span className="text-[12px] font-mono text-slate-400 tracking-widest uppercase">Phrase Collection // 0{quoteIndex + 1}</span>
                            </div>
                            <div className="relative flex-1 flex flex-col justify-center">
                                <AnimatePresence mode="wait">
                                    <motion.div key={quoteIndex} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }} className="w-full">
                                        <p className="text-[22px] leading-snug text-slate-600 font-serif italic">
                                            {quotes.length > 0 && quotes[quoteIndex] ? quotes[quoteIndex].text : "Loading..."}
                                        </p>
                                    </motion.div>
                                </AnimatePresence>
                            </div>
                            <div className="flex gap-1 mt-4">
                                {quotes.map((_, i) => (
                                    <div key={i} className={`h-1 rounded-full transition-all duration-300 ${i === quoteIndex ? 'w-6 bg-blue-500' : 'w-2 bg-slate-200'}`} />
                                ))}
                            </div>
                        </motion.div>
                        <div className="h-10 ml-37 w-px bg-linear-to-b from-slate-300 to-transparent mt-0 relative z-50 -translate-y-[20px] pointer-events-none" />
                    </div>
                </motion.div>
            </div>

            <TimelineWidget isActive={activeModule === 'timeline'} onToggle={() => setActiveModule(prev => prev === 'timeline' ? 'idle' : 'timeline')} />
            <DailyProtocol isActive={activeModule === 'protocol'} onToggle={() => setActiveModule(prev => prev === 'protocol' ? 'idle' : 'protocol')} isAdmin={isAdmin} />
            <ToolboxWidget isActive={activeModule === 'toolbox'} onToggle={() => setActiveModule(prev => prev === 'toolbox' ? 'idle' : 'toolbox')} />
            <CollectionCabinet isActive={activeModule === 'cabinet'} onToggle={() => setActiveModule(prev => prev === 'cabinet' ? 'idle' : 'cabinet')} isAdmin={isAdmin} />
            <HobbySystem isActive={activeModule === 'hobby'} onToggle={() => setActiveModule(prev => prev === 'hobby' ? 'idle' : 'hobby')} />

            <div className={`transition-all duration-1000 ${activeModule !== 'idle' ? 'pointer-events-none' : ''}`}>
                <WindowView isOpen={isWindowOpen} onToggle={() => setIsWindowOpen(!isWindowOpen)} isBlurred={activeModule !== 'idle'} />
            </div>
            {activeModule !== 'idle' && (
                <div className="absolute inset-0 z-40 bg-white/40 backdrop-blur-sm transition-all duration-700" onClick={() => setActiveModule('idle')} />
            )}
        </div>
    );
}