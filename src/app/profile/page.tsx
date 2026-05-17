"use client";

import React, { useState, useEffect, useRef, useId } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Link from 'next/link';
import { Origami, Settings } from 'lucide-react';
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

/** 浅色胶囊用纸感噪点（与各 Library 卡片一致） */
const LIBRARY_NOISE_LIGHT =
    'data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.75\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\' opacity=\'0.55\'/%3E%3C/svg%3E';

type LibraryQuickPattern = 'noise-light' | 'noise-screen' | 'dots-teal' | 'none';

type LibraryQuickMotif = 'prompt' | 'mindmap' | 'diet' | 'info' | 'garden' | 'prism';

type LibraryQuickItem = {
    title: string;
    href: string;
    pill: string;
    text: string;
    pattern: LibraryQuickPattern;
    /** 胶囊内装饰花纹（可选） */
    motif?: LibraryQuickMotif;
};

/** Profile → Library 悬停快捷跳转：胶囊底 + 花纹 + 对比色字 */
const LIBRARY_QUICK_LINKS: LibraryQuickItem[] = [
    {
        title: '提示词仓库',
        href: '/library/prompt',
        pill: 'bg-[#f5e6c8] shadow-[inset_0_1px_0_rgba(255,255,255,0.4)] ring-1 ring-[#a67c52]/40',
        text: 'text-[#3d2912] drop-shadow-[0_0_6px_rgba(255,248,220,0.7)]',
        pattern: 'noise-light',
        motif: 'prompt',
    },
    {
        title: '思维导图',
        href: '/library/mindmap',
        pill: 'bg-[#faf9f6] shadow-[inset_0_1px_0_rgba(255,255,255,0.85)] ring-1 ring-indigo-200/45',
        text: 'text-indigo-950 drop-shadow-[0_0_6px_rgba(255,255,255,0.85)]',
        pattern: 'noise-light',
        motif: 'mindmap',
    },
    {
        title: '数字花园',
        href: '/library/garden',
        pill: 'bg-[#ecfdf5] ring-1 ring-emerald-300/40',
        text: 'text-emerald-950 drop-shadow-[0_0_8px_rgba(255,255,255,0.65)]',
        pattern: 'dots-teal',
        motif: 'garden',
    },
    {
        title: '认知棱镜',
        href: '/library/prism',
        pill: 'bg-gradient-to-br from-[#0c0514] via-[#1a0a28] to-fuchsia-950 ring-1 ring-fuchsia-500/30 shadow-[0_4px_20px_rgba(88,28,135,0.35)]',
        text: 'text-stone-100 drop-shadow-[0_1px_2px_rgba(0,0,0,0.85)]',
        pattern: 'noise-screen',
        motif: 'prism',
    },
    {
        title: '饮食手记',
        href: '/library/diet',
        pill: 'bg-[#fdfbf7] shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] ring-1 ring-[#cdb07c]/40',
        text: 'text-stone-800 drop-shadow-[0_0_5px_rgba(255,255,255,0.75)]',
        pattern: 'noise-light',
        motif: 'diet',
    },
    {
        title: '信息溯源',
        href: '/library/info-source',
        pill: 'bg-gradient-to-r from-[#0f172a] via-[#1a1620] to-[#2a2218] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] ring-1 ring-white/12',
        text: 'text-stone-100 drop-shadow-[0_1px_3px_rgba(0,0,0,0.95)]',
        pattern: 'none',
        motif: 'info',
    },
];

function LibraryQuickPatternLayer({ type }: { type: LibraryQuickPattern }) {
    if (type === 'none') return null;
    if (type === 'noise-light') {
        return (
            <span
                aria-hidden
                className="absolute inset-0 pointer-events-none opacity-[0.22] mix-blend-multiply"
                style={{ backgroundImage: `url("${LIBRARY_NOISE_LIGHT}")`, backgroundSize: '140px 140px' }}
            />
        );
    }
    if (type === 'noise-screen') {
        return (
            <span
                aria-hidden
                className="absolute inset-0 pointer-events-none opacity-[0.12] mix-blend-screen"
                style={{ backgroundImage: `url("${LIBRARY_NOISE_LIGHT}")`, backgroundSize: '100px 100px' }}
            />
        );
    }
    return (
        <span
            aria-hidden
            className="absolute inset-0 pointer-events-none opacity-[0.2] bg-[radial-gradient(#0d9488_0.42px,transparent_0.42px)] [background-size:10px_10px]"
        />
    );
}

/** 数字花园：底部流线生长曲线（简化的 GardenCard 藤蔓感） */
function LibraryGardenVineMotif() {
    return (
        <svg
            aria-hidden
            className="pointer-events-none absolute inset-0 z-[5] h-full w-full"
            viewBox="0 0 320 40"
            preserveAspectRatio="none"
        >
            <path
                d="M -48 36 Q 52 30 96 22 T 200 16 T 360 20"
                fill="none"
                stroke="rgb(15 118 110 / 0.3)"
                strokeWidth="1.1"
                strokeLinecap="round"
            />
            <path
                d="M 360 34 Q 220 26 150 18 T 40 14 T -36 18"
                fill="none"
                stroke="rgb(13 148 136 / 0.24)"
                strokeWidth="0.95"
                strokeLinecap="round"
            />
            <path
                d="M -20 28 Q 120 8 220 15 T 340 11"
                fill="none"
                stroke="rgb(20 184 166 / 0.2)"
                strokeWidth="0.75"
                strokeLinecap="round"
            />
        </svg>
    );
}

/** 认知棱镜：入射光扇 + 七彩折射带 + 四边形棱镜轮廓 */
function LibraryPrismSpectrumMotif() {
    const id = useId().replace(/:/g, '');
    const gid = `lpm-${id}`;
    return (
        <svg
            aria-hidden
            className="pointer-events-none absolute inset-0 z-[5] h-full w-full opacity-[0.95]"
            viewBox="0 0 260 36"
            preserveAspectRatio="none"
        >
            <defs>
                <linearGradient id={`${gid}-spec`} x1="0%" y1="50%" x2="100%" y2="50%">
                    <stop offset="0%" stopColor="rgba(248,113,113,0.85)" />
                    <stop offset="22%" stopColor="rgba(250,204,21,0.75)" />
                    <stop offset="44%" stopColor="rgba(74,222,128,0.65)" />
                    <stop offset="66%" stopColor="rgba(34,211,238,0.65)" />
                    <stop offset="88%" stopColor="rgba(192,132,252,0.75)" />
                    <stop offset="100%" stopColor="rgba(244,114,182,0.45)" />
                </linearGradient>
                <linearGradient id={`${gid}-beam`} x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="rgba(255,255,255,0)" />
                    <stop offset="45%" stopColor="rgba(255,255,255,0.45)" />
                    <stop offset="100%" stopColor="rgba(255,255,255,0.06)" />
                </linearGradient>
            </defs>
            <g style={{ mixBlendMode: 'screen' }} opacity={0.5}>
                <path d="M -8 18 L 72 11 L 72 25 Z" fill={`url(#${gid}-beam)`} />
                <path d="M 64 18 L 210 5 L 210 31 Z" fill={`url(#${gid}-spec)`} opacity={0.72} />
            </g>
            <g opacity={0.92}>
                <polygon
                    points="112,6 158,18 112,30 66,18"
                    fill="rgba(255,255,255,0.05)"
                    stroke="rgba(255,255,255,0.45)"
                    strokeWidth="0.5"
                />
                <polygon
                    points="112,6 142,11.5 142,24.5 112,30"
                    fill="rgba(34,211,238,0.25)"
                    style={{ mixBlendMode: 'screen' }}
                    stroke="rgba(255,255,255,0.22)"
                    strokeWidth="0.35"
                />
                <polygon
                    points="142,11.5 158,18 142,24.5"
                    fill="rgba(192,132,252,0.32)"
                    style={{ mixBlendMode: 'screen' }}
                    stroke="rgba(255,255,255,0.18)"
                    strokeWidth="0.3"
                />
                <line x1="112" y1="6" x2="142" y2="11.5" stroke="rgba(255,255,255,0.4)" strokeWidth="0.4" />
                <line x1="142" y1="11.5" x2="158" y2="18" stroke="rgba(255,255,255,0.28)" strokeWidth="0.4" />
            </g>
        </svg>
    );
}

/** 提示词仓库：暖光晕 + 虚线弧（魔法阵外环感）+ 星点 */
function LibraryPromptSigilMotif() {
    const id = useId().replace(/:/g, '');
    const gid = `lpr-${id}`;
    return (
        <svg
            aria-hidden
            className="pointer-events-none absolute inset-0 z-[5] h-full w-full"
            viewBox="0 0 280 36"
            preserveAspectRatio="none"
        >
            <defs>
                <radialGradient id={`${gid}-warm`} cx="22%" cy="0%" r="65%">
                    <stop offset="0%" stopColor="rgba(255,210,120,0.42)" />
                    <stop offset="55%" stopColor="rgba(255,200,100,0.08)" />
                    <stop offset="100%" stopColor="rgba(255,200,100,0)" />
                </radialGradient>
            </defs>
            <rect x="0" y="0" width="280" height="36" fill={`url(#${gid}-warm)`} />
            <path
                d="M 8 34 A 48 48 0 0 1 96 26"
                fill="none"
                stroke="rgba(120,75,35,0.28)"
                strokeWidth="0.9"
                strokeDasharray="4 6"
                strokeLinecap="round"
            />
            <path
                d="M 188 35 A 44 44 0 0 0 272 12"
                fill="none"
                stroke="rgba(100,65,30,0.22)"
                strokeWidth="0.75"
                strokeLinecap="round"
            />
            <circle cx="72" cy="9" r="1.1" fill="rgba(160,100,40,0.45)" />
            <circle cx="118" cy="14" r="0.75" fill="rgba(140,85,35,0.35)" />
            <circle cx="205" cy="11" r="0.85" fill="rgba(150,95,45,0.38)" />
            <circle cx="160" cy="12" r="1" fill="rgba(175,115,48,0.25)" />
        </svg>
    );
}

/** 思维导图：坐标格 + 虚线弧 + 十字准星 */
function LibraryMindmapChartMotif() {
    const id = useId().replace(/:/g, '');
    const gid = `lmm-${id}`;
    return (
        <svg
            aria-hidden
            className="pointer-events-none absolute inset-0 z-[5] h-full w-full"
            viewBox="0 0 260 36"
            preserveAspectRatio="none"
        >
            <defs>
                <pattern id={`${gid}-grid`} width="12" height="12" patternUnits="userSpaceOnUse">
                    <path d="M12 0 L0 0 0 12" fill="none" stroke="rgba(51,65,85,0.14)" strokeWidth="0.45" />
                </pattern>
            </defs>
            <rect x="0" y="0" width="260" height="36" fill={`url(#${gid}-grid)`} opacity={0.65} />
            <path
                d="M 198 6 A 26 26 0 0 1 248 28"
                fill="none"
                stroke="rgba(67,56,202,0.22)"
                strokeWidth="0.85"
                strokeDasharray="2.5 4.5"
                strokeLinecap="round"
            />
            <path d="M 214 14 L 238 14" fill="none" stroke="rgba(51,65,85,0.35)" strokeWidth="0.5" strokeLinecap="round" />
            <path d="M 226 6 L 226 22" fill="none" stroke="rgba(51,65,85,0.35)" strokeWidth="0.5" strokeLinecap="round" />
            <circle cx="226" cy="14" r="1.2" fill="none" stroke="rgba(67,56,202,0.25)" strokeWidth="0.45" />
        </svg>
    );
}

/** 饮食手记：麻叶纹 + 和式角框 */
function LibraryDietBentoMotif() {
    const id = useId().replace(/:/g, '');
    const gid = `ldb-${id}`;
    return (
        <svg
            aria-hidden
            className="pointer-events-none absolute inset-0 z-[5] h-full w-full"
            viewBox="0 0 260 36"
            preserveAspectRatio="none"
        >
            <defs>
                <pattern id={`${gid}-asanoha`} width="22" height="22" patternUnits="userSpaceOnUse">
                    <path
                        d="M11 0 L22 19.05 11 12.73 0 19.05 Z M11 6.35 L16.5 15.87 H5.5 Z"
                        fill="none"
                        stroke="rgba(80,55,30,0.32)"
                        strokeWidth="0.55"
                    />
                </pattern>
            </defs>
            <rect
                x="0"
                y="0"
                width="260"
                height="36"
                fill={`url(#${gid}-asanoha)`}
                className="mix-blend-multiply"
                opacity={0.55}
            />
            <path
                d="M 6 28 L 6 20 M 6 28 L 14 28"
                fill="none"
                stroke="rgba(120,85,45,0.62)"
                strokeWidth="1.05"
                strokeLinecap="square"
            />
            <path
                d="M 254 8 L 246 8 M 254 8 L 254 16"
                fill="none"
                stroke="rgba(120,85,45,0.62)"
                strokeWidth="1.05"
                strokeLinecap="square"
            />
        </svg>
    );
}

/** 信息溯源：对齐 /library/info-source 入口 — 学习侧冷格 + 生活侧暖点 + 斜切蓝白琥珀缝 */
function LibraryInfoHubMotif() {
    const id = useId().replace(/:/g, '');
    const gid = `lih-${id}`;
    return (
        <svg
            aria-hidden
            className="pointer-events-none absolute inset-0 z-[5] h-full w-full"
            viewBox="0 0 260 36"
            preserveAspectRatio="none"
        >
            <defs>
                <clipPath id={`${gid}-clipL`}>
                    <rect x="0" y="0" width="124" height="36" />
                </clipPath>
                <clipPath id={`${gid}-clipR`}>
                    <rect x="124" y="0" width="136" height="36" />
                </clipPath>
                <pattern id={`${gid}-studyGrid`} width="9" height="9" patternUnits="userSpaceOnUse">
                    <path d="M9 0 H0 V9" fill="none" stroke="rgba(148,163,184,0.22)" strokeWidth="0.4" />
                </pattern>
                <pattern id={`${gid}-lifeDots`} width="12" height="12" patternUnits="userSpaceOnUse">
                    <circle cx="2.2" cy="2.2" r="0.55" fill="rgba(180,83,9,0.28)" />
                </pattern>
                <linearGradient id={`${gid}-seam`} x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="rgba(147,197,253,0.95)" />
                    <stop offset="48%" stopColor="rgba(255,255,255,0.98)" />
                    <stop offset="100%" stopColor="rgba(251,191,36,0.95)" />
                </linearGradient>
            </defs>
            <g clipPath={`url(#${gid}-clipL)`}>
                <rect x="0" y="0" width="124" height="36" fill={`url(#${gid}-studyGrid)`} opacity={0.55} />
            </g>
            <g clipPath={`url(#${gid}-clipR)`}>
                <rect x="124" y="0" width="136" height="36" fill={`url(#${gid}-lifeDots)`} opacity={0.5} />
            </g>
            <polygon
                points="112,-2 126,-2 138,38 124,38"
                fill={`url(#${gid}-seam)`}
                opacity={0.72}
            />
        </svg>
    );
}

function LibraryQuickCapsuleMotif({ motif }: { motif?: LibraryQuickMotif }) {
    switch (motif) {
        case 'garden':
            return <LibraryGardenVineMotif />;
        case 'prism':
            return <LibraryPrismSpectrumMotif />;
        case 'prompt':
            return <LibraryPromptSigilMotif />;
        case 'mindmap':
            return <LibraryMindmapChartMotif />;
        case 'diet':
            return <LibraryDietBentoMotif />;
        case 'info':
            return <LibraryInfoHubMotif />;
        default:
            return null;
    }
}

export default function ProfilePage() {
    const router = useRouter();
    const [isWindowOpen, setIsWindowOpen] = useState(false);
    const [openHubFromUrl, setOpenHubFromUrl] = useState(false);
    const [activeModule, setActiveModule] = useState<'idle' | 'hobby' | 'timeline' | 'protocol' | 'toolbox' | 'cabinet' | 'status' | 'calendar'>('idle');

    const [backBtnHover, setBackBtnHover] = useState(false);
    const [libHover, setLibHover] = useState(false);
    const libNavLeaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const openLibraryNav = () => {
        if (libNavLeaveTimer.current) {
            clearTimeout(libNavLeaveTimer.current);
            libNavLeaveTimer.current = null;
        }
        setLibHover(true);
    };

    const scheduleCloseLibraryNav = () => {
        if (libNavLeaveTimer.current) clearTimeout(libNavLeaveTimer.current);
        libNavLeaveTimer.current = setTimeout(() => {
            setLibHover(false);
            libNavLeaveTimer.current = null;
        }, 160);
    };

    // 依然保留 isAdmin 状态，为了传给子组件做内联编辑的权限控制
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        const initData = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setIsAdmin(!!user);
        };
        initData();
    }, []);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const params = new URLSearchParams(window.location.search);
        if (params.get('hub') === '1') {
            setOpenHubFromUrl(true);
            setIsWindowOpen(true);
        }
    }, []);

    useEffect(() => () => {
        if (libNavLeaveTimer.current) clearTimeout(libNavLeaveTimer.current);
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

                        {/* Library Entrance (Scheme B Style) + 悬停快捷模块 */}
                        <div
                            className="absolute left-[calc(50%+13.5rem)] hidden md:inline-block translate-y-8 z-[55] pointer-events-auto"
                            onMouseEnter={openLibraryNav}
                            onMouseLeave={scheduleCloseLibraryNav}
                        >
                            <button
                                type="button"
                                onClick={() => router.push('/library')}
                                className="relative flex items-center gap-4 px-5 py-2.5 rounded-2xl transition-all duration-500 group overflow-hidden backdrop-blur-xl"
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

                            {/* 下拉：总览 + 各模块（与鼠标移动间隙用 pt 承接） */}
                            <div
                                className={`absolute left-1/2 top-full z-[60] w-[min(288px,calc(100vw-2rem))] pt-2 transition-all duration-200 ease-out ${libHover ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'}`}
                                style={{ transform: libHover ? 'translate(-50%, 0)' : 'translate(-50%, -4px)' }}
                            >
                                <div className="rounded-xl border border-white/35 bg-white/45 shadow-[0_12px_40px_-8px_rgba(0,0,0,0.16)] backdrop-blur-lg backdrop-saturate-150 p-2.5 space-y-2">
                                    <Link
                                        href="/library"
                                        onClick={() => setLibHover(false)}
                                        className="relative block w-full overflow-hidden rounded-full py-2.5 px-4 text-center text-[13px] font-semibold tracking-tight text-white shadow-md transition duration-200 bg-gradient-to-r from-orange-500 to-amber-500 ring-1 ring-orange-300/60 hover:brightness-[1.06] hover:ring-2 hover:ring-orange-100/80"
                                    >
                                        <span className="relative z-10 drop-shadow-sm">Library 总览</span>
                                    </Link>
                                    {LIBRARY_QUICK_LINKS.map((mod) => (
                                        <Link
                                            key={mod.href}
                                            href={mod.href}
                                            onClick={() => setLibHover(false)}
                                            className={`relative block w-full overflow-hidden rounded-full py-2.5 px-4 text-center text-[13px] font-semibold tracking-tight transition duration-200 hover:brightness-[1.05] hover:ring-2 hover:ring-white/55 ${mod.pill} ${mod.text}`}
                                        >
                                            <LibraryQuickPatternLayer type={mod.pattern} />
                                            <LibraryQuickCapsuleMotif motif={mod.motif} />
                                            <span className="relative z-10">{mod.title}</span>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        </div>
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
                <WindowView
                    isOpen={isWindowOpen}
                    onToggle={() => setIsWindowOpen(!isWindowOpen)}
                    isBlurred={activeModule !== 'idle'}
                    onOpenCalendar={() => {
                        setIsWindowOpen(false);
                        setActiveModule('calendar');
                    }}
                    onOpenProtocol={() => {
                        setIsWindowOpen(false);
                        setActiveModule('protocol');
                    }}
                    requestOpenInfoHub={openHubFromUrl}
                />
            </div>
            {activeModule !== 'idle' && (
                <div className="absolute inset-0 z-40 bg-white/40 backdrop-blur-sm transition-all duration-700" onClick={() => setActiveModule('idle')} />
            )}
        </div>
    );
}