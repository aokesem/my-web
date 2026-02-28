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
import AvatarProfile from './components/AvatarProfile';
import QuoteDisplay from './components/QuoteDisplay';

import { supabase } from '@/lib/supabaseClient';

export default function ProfilePage() {
    const router = useRouter();
    const [isWindowOpen, setIsWindowOpen] = useState(false);
    const [activeModule, setActiveModule] = useState<'idle' | 'hobby' | 'timeline' | 'protocol' | 'toolbox' | 'cabinet' | 'status' | 'calendar'>('idle');

    const [backBtnHover, setBackBtnHover] = useState(false);
    const [libHover, setLibHover] = useState(false);

    // 依然保留 isAdmin 状态，为了传给子组件做内联编辑的权限控制
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        const initData = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setIsAdmin(!!user);
        };
        initData();
    }, []);

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
            <AvatarProfile />

            <QuoteDisplay />

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