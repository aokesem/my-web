"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
    ArrowLeft,
    BrainCircuit,
    Library,
    Database,
    Cpu,
    Search,
    Plus,
    Network
} from 'lucide-react';
import Link from 'next/link';

export default function WorkshopPage() {
    const [hoveredCard, setHoveredCard] = useState<string | null>(null);

    return (
        <div className="relative w-full h-screen overflow-hidden bg-slate-950 text-slate-200 selection:bg-cyan-500/30">
            {/* --- Blueprint Background --- */}
            {/* Grid Pattern */}
            <div className="absolute inset-0 z-0 opacity-20 pointer-events-none"
                style={{
                    backgroundImage: `
                        linear-gradient(to right, #334155 1px, transparent 1px),
                        linear-gradient(to bottom, #334155 1px, transparent 1px)
                    `,
                    backgroundSize: '40px 40px'
                }}
            />
            {/* Fine Sub-grid */}
            <div className="absolute inset-0 z-0 opacity-10 pointer-events-none"
                style={{
                    backgroundImage: `
                        linear-gradient(to right, #334155 0.5px, transparent 0.5px),
                        linear-gradient(to bottom, #334155 0.5px, transparent 0.5px)
                    `,
                    backgroundSize: '10px 10px'
                }}
            />
            {/* Vignette & Glow */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,transparent_0%,#020617_90%)] z-0 pointer-events-none" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-cyan-500/5 blur-[120px] pointer-events-none" />

            {/* --- Header --- */}
            <header className="absolute top-0 left-0 w-full p-8 flex justify-between items-start z-20">
                <Link
                    href="/profile"
                    className="group flex items-center gap-3 px-4 py-2 rounded-lg bg-slate-900/50 border border-slate-800 hover:border-cyan-500/50 transition-all duration-300 backdrop-blur-md"
                >
                    <ArrowLeft size={18} className="text-slate-400 group-hover:text-cyan-400 transition-colors" />
                    <span className="text-xs font-mono font-bold text-slate-500 group-hover:text-cyan-400 uppercase tracking-widest transition-colors">
                        Return_Base
                    </span>
                </Link>

                <div className="flex flex-col items-end">
                    <h1 className="text-4xl font-bold tracking-tighter text-slate-100 flex items-center gap-3">
                        <Database className="text-cyan-500" size={32} strokeWidth={1.5} />
                        DATA_WORKSHOP
                    </h1>
                    <div className="flex items-center gap-2 mt-2">
                        <div className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse" />
                        <span className="text-xs font-mono text-cyan-500/80 tracking-[0.3em]">SYSTEM_ONLINE</span>
                    </div>
                </div>
            </header>

            {/* --- Main Content: Card Grid --- */}
            <main className="relative z-10 w-full h-full flex items-center justify-center p-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-5xl w-full">

                    {/* Module 1: Prompt Library */}
                    <motion.div
                        className="relative group cursor-pointer"
                        onHoverStart={() => setHoveredCard('prompt')}
                        onHoverEnd={() => setHoveredCard(null)}
                        whileHover={{ scale: 1.02 }}
                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    >
                        {/* Blueprint Card Style */}
                        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md rounded-2xl border border-slate-700/50 group-hover:border-cyan-500/50 transition-colors duration-500" />

                        {/* Corner Decorations */}
                        <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-slate-600 group-hover:border-cyan-400 transition-colors rounded-tl-lg" />
                        <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-slate-600 group-hover:border-cyan-400 transition-colors rounded-tr-lg" />
                        <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-slate-600 group-hover:border-cyan-400 transition-colors rounded-bl-lg" />
                        <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-slate-600 group-hover:border-cyan-400 transition-colors rounded-br-lg" />

                        <div className="relative p-8 h-[320px] flex flex-col justify-between overflow-hidden">
                            {/* Decorative Background Icon */}
                            <Library
                                className="absolute -right-10 -bottom-10 text-slate-800/50 group-hover:text-cyan-900/20 transition-colors duration-500 rotate-12"
                                size={200}
                                strokeWidth={0.5}
                            />

                            {/* Header */}
                            <div className="flex justify-between items-start">
                                <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-700 group-hover:bg-cyan-950/30 group-hover:border-cyan-500/30 transition-colors">
                                    <Library className="text-slate-400 group-hover:text-cyan-400" size={32} />
                                </div>
                                <span className="font-mono text-[10px] text-slate-500 group-hover:text-cyan-500/70 border border-slate-700 px-2 py-0.5 rounded transition-colors">
                                    MOD_01
                                </span>
                            </div>

                            {/* Content */}
                            <div className="space-y-4 relative z-10">
                                <div>
                                    <h2 className="text-2xl font-bold text-slate-100 group-hover:text-cyan-50 transition-colors">Prompt Matrix</h2>
                                    <p className="text-sm text-slate-400 group-hover:text-slate-300 mt-2 leading-relaxed">
                                        Advanced storage for LLM instructions.
                                        Categorize, version control, and rapid-inject your cognitive protocols.
                                    </p>
                                </div>

                                {/* Mock Stats/Action */}
                                <div className="pt-4 border-t border-slate-700/50 flex items-center gap-4">
                                    <div className="flex items-center gap-2 text-xs font-mono text-slate-500">
                                        <Database size={12} />
                                        <span>128 ENTRIES</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs font-mono text-slate-500">
                                        <Search size={12} />
                                        <span>INDEXED</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Module 2: Mind Map */}
                    <motion.div
                        className="relative group cursor-pointer"
                        onHoverStart={() => setHoveredCard('mindmap')}
                        onHoverEnd={() => setHoveredCard(null)}
                        whileHover={{ scale: 1.02 }}
                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    >
                        {/* Blueprint Card Style */}
                        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md rounded-2xl border border-slate-700/50 group-hover:border-cyan-500/50 transition-colors duration-500" />

                        {/* Corner Decorations */}
                        <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-slate-600 group-hover:border-cyan-400 transition-colors rounded-tl-lg" />
                        <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-slate-600 group-hover:border-cyan-400 transition-colors rounded-tr-lg" />
                        <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-slate-600 group-hover:border-cyan-400 transition-colors rounded-bl-lg" />
                        <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-slate-600 group-hover:border-cyan-400 transition-colors rounded-br-lg" />

                        <div className="relative p-8 h-[320px] flex flex-col justify-between overflow-hidden">
                            {/* Decorative Background Icon */}
                            <Network
                                className="absolute -right-10 -bottom-10 text-slate-800/50 group-hover:text-cyan-900/20 transition-colors duration-500 -rotate-12"
                                size={200}
                                strokeWidth={0.5}
                            />

                            {/* Header */}
                            <div className="flex justify-between items-start">
                                <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-700 group-hover:bg-cyan-950/30 group-hover:border-cyan-500/30 transition-colors">
                                    <BrainCircuit className="text-slate-400 group-hover:text-cyan-400" size={32} />
                                </div>
                                <span className="font-mono text-[10px] text-slate-500 group-hover:text-cyan-500/70 border border-slate-700 px-2 py-0.5 rounded transition-colors">
                                    MOD_02
                                </span>
                            </div>

                            {/* Content */}
                            <div className="space-y-4 relative z-10">
                                <div>
                                    <h2 className="text-2xl font-bold text-slate-100 group-hover:text-cyan-50 transition-colors">Neural Cartography</h2>
                                    <p className="text-sm text-slate-400 group-hover:text-slate-300 mt-2 leading-relaxed">
                                        Infinite canvas for idea visualization.
                                        Map complex structures with auto-layout and XMind-compatible shortcuts.
                                    </p>
                                </div>

                                {/* Mock Stats/Action */}
                                <div className="pt-4 border-t border-slate-700/50 flex items-center gap-4">
                                    <div className="flex items-center gap-2 text-xs font-mono text-slate-500">
                                        <Cpu size={12} />
                                        <span>ACTIVE</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs font-mono text-slate-500">
                                        <Plus size={12} />
                                        <span>NEW MAP</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                </div>
            </main>

            {/* --- Footer Status Line --- */}
            <div className="absolute bottom-0 left-0 w-full p-4 border-t border-slate-800/50 flex justify-between items-center text-[10px] font-mono text-slate-600 bg-slate-950/50 backdrop-blur-sm z-20">
                <div className="flex gap-4">
                    <span>CPU_LOAD: 12%</span>
                    <span>MEM_ALLOC: 4096MB</span>
                    <span>NET_STATUS: CONNECTED</span>
                </div>
                <div>
                    SECURE_CONNECTION_ESTABLISHED // V.2.0.4
                </div>
            </div>
        </div>
    );
}
