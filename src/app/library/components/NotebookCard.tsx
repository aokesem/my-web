import React from 'react';
import { motion } from 'framer-motion';
import { Sparkle } from 'lucide-react';
import { BookOpenText } from 'lucide-react';

interface ModuleProps {
    module: {
        id: string;
        title: string;
        description: string;
    };
}

export default function NotebookCard({ module }: ModuleProps) {
    return (
        <div className="relative group-hover:-translate-y-2 transition-transform duration-500 ease-out h-full overflow-hidden">
            {/* Parchment Base */}
            <div className="absolute inset-0 bg-[#f5e6c8] rounded-2xl border border-[#d4b896] shadow-[0_4px_12px_rgba(120,80,30,0.08)] group-hover:shadow-[0_20px_40px_rgba(120,80,30,0.15)] transition-all duration-500" />

            {/* Aged parchment texture */}
            <div className="absolute inset-0 rounded-2xl opacity-[0.35] mix-blend-multiply pointer-events-none"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.7' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.6'/%3E%3C/svg%3E")`,
                    backgroundSize: '200px 200px'
                }}
            />

            {/* Burnt/aged edges vignette */}
            <div className="absolute inset-0 rounded-2xl pointer-events-none"
                style={{
                    background: 'radial-gradient(ellipse at center, transparent 50%, rgba(139,90,43,0.15) 85%, rgba(80,40,10,0.3) 100%)'
                }}
            />

            {/* Warm candlelight glow - top left */}
            <motion.div
                className="absolute -top-10 -left-10 w-48 h-48 rounded-full pointer-events-none"
                style={{ background: 'radial-gradient(circle, rgba(255,200,100,0.15) 0%, transparent 70%)' }}
                animate={{ opacity: [0.6, 1, 0.6], scale: [1, 1.05, 1] }}
                transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
            />

            {/* Subtle second glow - bottom right */}
            <motion.div
                className="absolute -bottom-8 -right-8 w-40 h-40 rounded-full pointer-events-none"
                style={{ background: 'radial-gradient(circle, rgba(255,180,80,0.1) 0%, transparent 70%)' }}
                animate={{ opacity: [0.4, 0.8, 0.4] }}
                transition={{ repeat: Infinity, duration: 4, ease: "easeInOut", delay: 1 }}
            />

            {/* Central Magic Circle / Sigil */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="relative w-36 h-36">
                    {/* Outer rotating ring */}
                    <motion.div
                        className="absolute inset-0"
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
                    >
                        <svg viewBox="0 0 144 144" className="w-full h-full">
                            <motion.circle
                                cx="72" cy="72" r="68"
                                fill="none"
                                stroke="rgba(139,90,43,0.15)"
                                strokeWidth="1.5"
                                initial={{ pathLength: 0, opacity: 0 }}
                                animate={{ pathLength: 1, opacity: 1 }}
                                transition={{ duration: 1.2, ease: "easeInOut" }}
                            />
                            {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg, i) => {
                                const rad = (deg * Math.PI) / 180;
                                const x = 72 + 65 * Math.cos(rad);
                                const y = 72 + 65 * Math.sin(rad);
                                return (
                                    <motion.circle
                                        key={i}
                                        cx={x} cy={y} r="1.5"
                                        fill="rgba(139,90,43,0.25)"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: [0.2, 0.6, 0.2] }}
                                        transition={{ repeat: Infinity, duration: 2.5, delay: i * 0.15 + 1.5, ease: "easeInOut" }}
                                    />
                                );
                            })}
                        </svg>
                    </motion.div>

                    {/* Inner counter-rotating ring */}
                    <motion.div
                        className="absolute inset-4"
                        animate={{ rotate: -360 }}
                        transition={{ repeat: Infinity, duration: 30, ease: "linear" }}
                    >
                        <svg viewBox="0 0 112 112" className="w-full h-full">
                            <motion.circle
                                cx="56" cy="56" r="52"
                                fill="none"
                                stroke="rgba(139,90,43,0.12)"
                                strokeWidth="1.5"
                                strokeDasharray="4 8"
                                initial={{ pathLength: 0, opacity: 0 }}
                                animate={{ pathLength: 1, opacity: 1 }}
                                transition={{ duration: 1.2, delay: 0.5, ease: "easeInOut" }}
                            />
                            <motion.polygon
                                points="56,12 96,80 16,80"
                                fill="none"
                                stroke="rgba(160,100,40,0.1)"
                                strokeWidth="2"
                                initial={{ pathLength: 0, opacity: 0 }}
                                animate={{ pathLength: 1, opacity: 1 }}
                                transition={{ duration: 2, delay: 0.8, ease: "easeInOut" }}
                            />
                            <motion.polygon
                                points="56,100 96,32 16,32"
                                fill="none"
                                stroke="rgba(160,100,40,0.08)"
                                strokeWidth="2"
                                initial={{ pathLength: 0, opacity: 0 }}
                                animate={{ pathLength: 1, opacity: 1 }}
                                transition={{ duration: 2, delay: 1.2, ease: "easeInOut" }}
                            />
                        </svg>
                    </motion.div>

                    {/* Center icon with glow */}
                    <div className="absolute inset-0 flex items-center justify-center">
                        <motion.div
                            animate={{ scale: [1, 1.08, 1], opacity: [0.6, 1, 0.6] }}
                            transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                        >
                            <Sparkle size={28} className="text-[#8b5a2b]/40 group-hover:text-[#8b5a2b]/70 transition-colors duration-500" strokeWidth={1.5} />
                        </motion.div>
                    </div>
                </div>
            </div>

            {/* Rising Rune Particles from the magic circle */}
            <div className="absolute inset-0 pointer-events-none">
                {[
                    { left: '45%', bottom: '42%', size: 3, dur: 3.5, delay: 0 },
                    { left: '52%', bottom: '40%', size: 2, dur: 4, delay: 1.2 },
                    { left: '48%', bottom: '44%', size: 2.5, dur: 3, delay: 2.0 },
                    { left: '55%', bottom: '38%', size: 2, dur: 3.8, delay: 0.8 },
                    { left: '42%', bottom: '40%', size: 1.5, dur: 4.5, delay: 1.5 },
                ].map((p, i) => (
                    <motion.div
                        key={i}
                        className="absolute rounded-full"
                        style={{
                            left: p.left,
                            bottom: p.bottom,
                            width: p.size,
                            height: p.size,
                            background: 'radial-gradient(circle, rgba(200,150,60,0.8) 0%, rgba(200,150,60,0) 100%)',
                        }}
                        animate={{
                            y: [0, -80, -120],
                            x: [0, (i % 2 === 0 ? 10 : -10), (i % 2 === 0 ? 15 : -20)],
                            opacity: [0, 0.7, 0],
                        }}
                        transition={{ repeat: Infinity, duration: p.dur, delay: p.delay, ease: "easeOut" }}
                    />
                ))}
            </div>

            {/* Floating Spell Scroll Fragments */}
            {/* Scroll 1 - top right area */}
            <motion.div
                className="absolute top-14 right-10 w-20 h-14 pointer-events-none z-10"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: [0, -3, 0] }}
                transition={{
                    opacity: { duration: 0.8, delay: 0.4 },
                    y: { repeat: Infinity, duration: 4, ease: "easeInOut" }
                }}
            >
                <div className="w-full h-full bg-[#f0dfc0]/70 rounded-sm border border-[#c9a870]/30 backdrop-blur-sm shadow-[0_2px_8px_rgba(120,80,30,0.1)] rotate-6 group-hover:rotate-3 transition-transform duration-500 p-2 flex flex-col justify-center gap-1.5">
                    <div className="w-[85%] h-[2px] bg-[#8b5a2b]/15 rounded-full" />
                    <div className="w-[60%] h-[2px] bg-[#8b5a2b]/12 rounded-full" />
                    <div className="w-[75%] h-[2px] bg-[#8b5a2b]/10 rounded-full" />
                </div>
            </motion.div>

            {/* Scroll 2 - left middle area */}
            <motion.div
                className="absolute top-[45%] left-6 w-16 h-12 pointer-events-none z-10"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: [0, -4, 0] }}
                transition={{
                    opacity: { duration: 0.8, delay: 0.7 },
                    y: { repeat: Infinity, duration: 5, ease: "easeInOut", delay: 0.8 }
                }}
            >
                <div className="w-full h-full bg-[#eedcb5]/60 rounded-sm border border-[#c9a870]/25 backdrop-blur-sm shadow-[0_2px_6px_rgba(120,80,30,0.08)] rotate-[-8deg] group-hover:rotate-[-4deg] transition-transform duration-500 p-1.5 flex flex-col justify-center gap-1">
                    <div className="w-[80%] h-[2px] bg-[#8b5a2b]/12 rounded-full" />
                    <div className="w-[50%] h-[2px] bg-[#8b5a2b]/10 rounded-full" />
                </div>
            </motion.div>

            {/* Scroll 3 - bottom right, slightly larger */}
            <motion.div
                className="absolute bottom-24 right-8 w-24 h-11 pointer-events-none z-10"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: [0, -2, 0] }}
                transition={{
                    opacity: { duration: 0.8, delay: 1.0 },
                    y: { repeat: Infinity, duration: 3.5, ease: "easeInOut", delay: 0.5 }
                }}
            >
                <div className="w-full h-full bg-[#f2e2c6]/55 rounded-sm border border-[#c9a870]/20 backdrop-blur-sm shadow-[0_2px_6px_rgba(120,80,30,0.1)] rotate-3 group-hover:rotate-0 transition-transform duration-500 p-2 flex flex-col justify-center gap-1.5">
                    <div className="w-[90%] h-[2px] bg-[#8b5a2b]/12 rounded-full" />
                    <div className="w-[70%] h-[2px] bg-[#8b5a2b]/10 rounded-full" />
                    <div className="w-[45%] h-[2px] bg-[#8b5a2b]/08 rounded-full" />
                </div>
            </motion.div>

            {/* Decorative corner ornaments */}
            <div className="absolute top-4 left-4 w-6 h-6 border-t border-l border-[#8b5a2b]/20 rounded-tl-sm" />
            <div className="absolute top-4 right-4 w-6 h-6 border-t border-r border-[#8b5a2b]/20 rounded-tr-sm" />
            <div className="absolute bottom-4 left-4 w-6 h-6 border-b border-l border-[#8b5a2b]/20 rounded-bl-sm" />
            <div className="absolute bottom-4 right-4 w-6 h-6 border-b border-r border-[#8b5a2b]/20 rounded-br-sm" />

            {/* Main Content Layout */}
            <div className="relative p-10 h-[360px] flex flex-col z-20">
                {/* Header */}
                <div className="flex justify-between items-start">
                    <div className="flex flex-col">
                        <span className="text-[10px] font-mono font-bold text-[#8b5a2b]/50 uppercase tracking-[0.2em] mb-2 flex items-center gap-1.5">
                            <motion.span
                                className="inline-block w-1.5 h-1.5 rounded-full bg-amber-600/40"
                                animate={{ opacity: [0.3, 0.8, 0.3] }}
                                transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                            />
                            Arcane Archive
                        </span>
                        <h2 className="text-3xl font-serif font-medium text-[#3a2510] group-hover:text-[#8b5a2b] transition-colors duration-500">
                            {module.title}
                        </h2>
                    </div>
                </div>

                {/* Spacer */}
                <div className="flex-1" />

                {/* Bottom Nameplate */}
                <div className="relative pt-4">
                    {/* Decorative double-line border */}
                    <div className="flex items-center gap-3 mb-3">
                        <div className="flex-1 flex flex-col gap-[2px]">
                            <div className="w-full h-px bg-[#8b5a2b]/20" />
                            <div className="w-full h-px bg-[#8b5a2b]/10" />
                        </div>
                        <BookOpenText size={14} className="text-[#8b5a2b]/25 shrink-0" />
                        <div className="flex-1 flex flex-col gap-[2px]">
                            <div className="w-full h-px bg-[#8b5a2b]/20" />
                            <div className="w-full h-px bg-[#8b5a2b]/10" />
                        </div>
                    </div>
                    <p className="text-sm text-[#6b4a2a]/60 font-medium leading-relaxed text-center group-hover:text-[#6b4a2a]/80 transition-colors">
                        {module.description}
                    </p>
                </div>
            </div>
        </div>
    );
}
