import React from 'react';
import { motion } from 'framer-motion';

interface ModuleProps {
    module: {
        id: string;
        title: string;
        description: string;
    };
}

export default function ProjectorCard({ module }: ModuleProps) {
    return (
        <div className="relative group-hover:-translate-y-2 transition-transform duration-500 ease-out h-full">
            <div className="absolute inset-0 bg-stone-50/50 rounded-2xl border border-stone-200 shadow-[0_4px_12px_rgba(0,0,0,0.03)] group-hover:shadow-[0_20px_40px_rgba(0,0,0,0.06)] transition-all duration-500" />

            <div className="absolute inset-4 bg-white rounded-xl shadow-[inset_0_2px_8px_rgba(0,0,0,0.04)] overflow-hidden border border-stone-100/80">
                {/* Blueprint Grid Lines */}
                <div className="absolute inset-0 opacity-[0.05]"
                    style={{
                        backgroundImage: `linear-gradient(#000 0.5px, transparent 0.5px), linear-gradient(90deg, #000 0.5px, transparent 0.5px)`,
                        backgroundSize: '40px 40px'
                    }}
                />

                {/* Stylized L-Corners */}
                <div className="absolute top-4 left-4 w-4 h-4 border-t border-l border-stone-300" />
                <div className="absolute top-4 right-4 w-4 h-4 border-t border-r border-stone-300" />
                <div className="absolute bottom-4 left-4 w-4 h-4 border-b border-l border-stone-300" />
                <div className="absolute bottom-4 right-4 w-4 h-4 border-b border-r border-stone-300" />

                {/* Hand-drawn Scale Markers */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 flex gap-10">
                    {[0, 1, 2].map(n => <div key={n} className="w-px h-1.5 bg-stone-200" />)}
                </div>

                {/* Technical Notation */}
                <div className="absolute top-6 left-10 flex flex-col gap-0.5 pointer-events-none">
                    <span className="text-[7px] font-mono text-stone-300 leading-none">POS_X: 420.00</span>
                    <span className="text-[7px] font-mono text-stone-300 leading-none">POS_Y: 185.24</span>
                </div>

                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="relative w-32 h-32 flex items-center justify-center">
                        <div className="absolute inset-0 blur-2xl bg-orange-500/5 group-hover:bg-orange-500/10 transition-colors duration-700" />
                        <svg viewBox="0 0 100 100" className="w-32 h-32 relative z-10 overflow-visible">
                            {/* Connections */}
                            <motion.g
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.2, duration: 0.5 }}
                                className="text-stone-300 group-hover:text-orange-300 transition-colors duration-500"
                                stroke="currentColor"
                                strokeWidth="2"
                                fill="none"
                            >
                                <path d="M50 42 L50 28" />
                                <path d="M30 52 L25 52" />
                                <path d="M70 52 L75 52" />
                            </motion.g>

                            {/* Center Node */}
                            <motion.rect
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: "spring", stiffness: 200, damping: 20 }}
                                x="30" y="42" width="40" height="20" rx="4"
                                className="fill-white stroke-stone-400 group-hover:stroke-orange-500 transition-colors duration-500"
                                strokeWidth="2"
                            />

                            {/* Top Node */}
                            <motion.rect
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ delay: 0.1, type: "spring" }}
                                x="37.5" y="12" width="25" height="16" rx="3"
                                className="fill-stone-50 stroke-stone-300 group-hover:stroke-orange-300 transition-colors duration-500"
                                strokeWidth="1.5"
                            />

                            {/* Left Node */}
                            <motion.rect
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ delay: 0.2, type: "spring" }}
                                x="0" y="44" width="25" height="16" rx="3"
                                className="fill-stone-50 stroke-stone-300 group-hover:stroke-orange-300 transition-colors duration-500"
                                strokeWidth="1.5"
                            />

                            {/* Right Node */}
                            <motion.rect
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ delay: 0.3, type: "spring" }}
                                x="75" y="44" width="25" height="16" rx="3"
                                className="fill-stone-50 stroke-stone-300 group-hover:stroke-orange-300 transition-colors duration-500"
                                strokeWidth="1.5"
                            />
                        </svg>
                    </div>
                </div>
            </div>

            <div className="absolute top-0 left-0 right-0 h-12 flex items-center justify-between px-8 z-20">
                <div className="flex gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-orange-400/20" />
                    <div className="w-1.5 h-1.5 rounded-full bg-stone-300/30" />
                </div>
                <span className="text-[10px] font-mono font-bold text-stone-400 uppercase tracking-widest opacity-60">{module.id}_sys_v1</span>
            </div>

            <div className="absolute bottom-8 left-0 w-full text-center z-20 px-10">
                <h2 className="text-2xl font-serif font-medium text-stone-800 group-hover:text-orange-600 transition-colors">
                    {module.title}
                </h2>
                <div className="mt-2 text-xs text-stone-400 font-mono tracking-tight leading-relaxed max-w-[80%] mx-auto opacity-80">
                    {module.description}
                </div>
            </div>
        </div>
    );
}
