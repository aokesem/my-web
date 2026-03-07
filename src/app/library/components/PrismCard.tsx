import React from 'react';
import { motion } from 'framer-motion';
import { Triangle } from 'lucide-react';

interface ModuleProps {
    module: {
        id: string;
        title: string;
        description: string;
    };
}

export default function PrismCard({ module }: ModuleProps) {
    return (
        <div className="relative group hover:-translate-y-2 transition-transform duration-500 ease-out h-full overflow-hidden">
            {/* Base dark void background */}
            <div className="absolute inset-0 bg-[#0c0514] rounded-2xl border border-purple-900/30 shadow-[0_4px_20px_rgba(12,5,20,0.6)] group-hover:shadow-[0_20px_40px_rgba(168,85,247,0.15)] group-hover:border-purple-600/40 transition-all duration-700" />

            {/* Deep space grain/noise (optional, subtle) */}
            <div className="absolute inset-0 rounded-2xl opacity-[0.04] pointer-events-none mix-blend-screen"
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}
            />

            {/* Ambient Corner Glows - Entrance Animated */}
            <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1 }}
                className="absolute top-0 left-0 w-64 h-64 bg-fuchsia-600/10 rounded-full blur-[80px] pointer-events-none" />
            <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, delay: 0.2 }}
                className="absolute bottom-0 right-0 w-64 h-64 bg-cyan-600/10 rounded-full blur-[80px] pointer-events-none" />

            {/* Animated Spectrum Light Beam */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-10" viewBox="0 0 500 360" preserveAspectRatio="none">
                <defs>
                    <linearGradient id="white-beam" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="rgba(255,255,255,0)" />
                        <stop offset="50%" stopColor="rgba(255,255,255,0.2)" />
                        <stop offset="100%" stopColor="rgba(255,255,255,0.7)" />
                    </linearGradient>
                    <linearGradient id="spectrum-red" x1="0%" y1="0%" x2="100%" y2="50%">
                        <stop offset="0%" stopColor="rgba(239,68,68,0.7)" />
                        <stop offset="100%" stopColor="rgba(239,68,68,0)" />
                    </linearGradient>
                    <linearGradient id="spectrum-yellow" x1="0%" y1="0%" x2="100%" y2="50%">
                        <stop offset="0%" stopColor="rgba(234,179,8,0.7)" />
                        <stop offset="100%" stopColor="rgba(234,179,8,0)" />
                    </linearGradient>
                    <linearGradient id="spectrum-green" x1="0%" y1="0%" x2="100%" y2="50%">
                        <stop offset="0%" stopColor="rgba(34,197,94,0.7)" />
                        <stop offset="100%" stopColor="rgba(34,197,94,0)" />
                    </linearGradient>
                    <linearGradient id="spectrum-cyan" x1="0%" y1="0%" x2="100%" y2="50%">
                        <stop offset="0%" stopColor="rgba(6,182,212,0.7)" />
                        <stop offset="100%" stopColor="rgba(6,182,212,0)" />
                    </linearGradient>
                    <linearGradient id="spectrum-purple" x1="0%" y1="0%" x2="100%" y2="50%">
                        <stop offset="0%" stopColor="rgba(168,85,247,0.7)" />
                        <stop offset="100%" stopColor="rgba(168,85,247,0)" />
                    </linearGradient>

                    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation="5" result="blur" />
                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                    <clipPath id="beam-clip-in">
                        <motion.circle cx="-20" cy="-20" initial={{ r: 0 }} animate={{ r: 350 }} transition={{ duration: 0.6, delay: 0.3, ease: "easeInOut" }} />
                    </clipPath>
                    <clipPath id="beam-clip-out">
                        <motion.circle cx="105" cy="160" initial={{ r: 0 }} animate={{ r: 600 }} transition={{ duration: 0.8, delay: 0.7, ease: "easeOut" }} />
                    </clipPath>
                </defs>

                {/* Incoming White Light - Top Left to Center-Left */}
                <motion.path
                    d="M -20,-20 L 105,150 L 105,170 L -40,40 Z"
                    fill="url(#white-beam)"
                    filter="url(#glow)"
                    clipPath="url(#beam-clip-in)"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.7 }}
                    transition={{ duration: 0.3, delay: 0.3 }}
                />

                {/* Outgoing Spectrum - Center-Left to Bottom Right */}
                <motion.g
                    clipPath="url(#beam-clip-out)"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3, delay: 0.7 }}
                >
                    <path d="M 105,160 L 550,230 L 550,250 Z" fill="url(#spectrum-red)" filter="url(#glow)" className="mix-blend-screen" />
                    <path d="M 105,160 L 550,250 L 550,280 Z" fill="url(#spectrum-yellow)" filter="url(#glow)" className="mix-blend-screen" />
                    <path d="M 105,160 L 550,280 L 550,310 Z" fill="url(#spectrum-green)" filter="url(#glow)" className="mix-blend-screen" />
                    <path d="M 105,160 L 550,310 L 550,350 Z" fill="url(#spectrum-cyan)" filter="url(#glow)" className="mix-blend-screen" />
                    <path d="M 105,160 L 550,350 L 550,400 Z" fill="url(#spectrum-purple)" filter="url(#glow)" className="mix-blend-screen" />
                </motion.g>
            </svg>

            {/* Knowledge Nodes / Pages (Illuminated automatically with the spectrum) */}
            <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 1.0, ease: "easeOut" }}
                className="absolute right-16 bottom-16 w-64 h-48 pointer-events-none flex flex-col gap-5 justify-end items-end z-0"
            >
                <div className="w-32 h-14 border border-white/10 rounded-lg backdrop-blur-md bg-white/5 transform -skew-x-12 -rotate-6 flex flex-col justify-center px-4 shadow-[0_0_20px_rgba(255,255,255,0.05)]">
                    <div className="w-16 h-1 bg-white/20 rounded-full mb-2" />
                    <div className="w-10 h-1 bg-white/10 rounded-full" />
                </div>
                <div className="w-44 h-16 border border-white/15 rounded-lg backdrop-blur-md bg-white/10 transform -skew-x-12 -rotate-6 flex flex-col justify-center px-4 -mr-4 shadow-[0_0_30px_rgba(34,197,94,0.1)] relative">
                    <div className="w-20 h-1.5 bg-green-300/40 rounded-full mb-2" />
                    <div className="w-14 h-1 bg-green-300/20 rounded-full mb-2" />
                    <div className="w-8 h-1 bg-green-300/20 rounded-full" />
                </div>
                <div className="w-36 h-14 border border-purple-400/20 rounded-lg backdrop-blur-md bg-purple-500/10 transform -skew-x-12 -rotate-6 flex flex-col justify-center px-4 -mr-8 shadow-[0_0_30px_rgba(168,85,247,0.2)]">
                    <div className="w-24 h-1.5 bg-purple-300/40 rounded-full mb-2" />
                    <div className="w-16 h-1 bg-purple-300/30 rounded-full" />
                </div>
            </motion.div>

            {/* Animated Particle Dust */}
            <div className="absolute inset-0 z-10 pointer-events-none">
                {/* Incoming top-left particles */}
                <motion.div
                    className="absolute left-[10%] top-[10%] w-1.5 h-1.5 bg-white/80 rounded-full blur-[1px]"
                    animate={{ x: [0, 60], y: [0, 60], opacity: [0, 0.8, 0] }}
                    transition={{ repeat: Infinity, duration: 3, delay: 1.0, ease: "linear" }}
                />
                <motion.div
                    className="absolute left-[20%] top-[5%] w-1 h-1 bg-purple-200/80 rounded-full blur-[1px]"
                    animate={{ x: [0, 50], y: [0, 50], opacity: [0, 0.6, 0] }}
                    transition={{ repeat: Infinity, duration: 2.5, delay: 1.8, ease: "linear" }}
                />
                {/* Central particles (贯穿感) */}
                <motion.div
                    className="absolute left-[35%] top-[40%] w-1 h-1 bg-white/60 rounded-full blur-[1px]"
                    animate={{ x: [0, 60], y: [0, 40], opacity: [0, 0.9, 0] }}
                    transition={{ repeat: Infinity, duration: 2.2, delay: 1.5, ease: "linear" }}
                />
                <motion.div
                    className="absolute left-[45%] top-[55%] w-1 h-1 bg-cyan-200/70 rounded-full blur-[1px]"
                    animate={{ x: [0, 50], y: [0, 30], opacity: [0, 0.7, 0] }}
                    transition={{ repeat: Infinity, duration: 2.6, delay: 1.8, ease: "linear" }}
                />
                {/* Outgoing bottom-right particles */}
                <motion.div
                    className="absolute left-[60%] top-[70%] w-1 h-1 bg-green-300 rounded-full blur-[1px]"
                    animate={{ x: [0, 50], y: [0, 20], opacity: [0, 0.8, 0] }}
                    transition={{ repeat: Infinity, duration: 2.5, delay: 2.0, ease: "linear" }}
                />
                <motion.div
                    className="absolute left-[50%] top-[80%] w-1 h-1 bg-purple-300 rounded-full blur-[1px]"
                    animate={{ x: [0, 40], y: [0, 30], opacity: [0, 0.9, 0] }}
                    transition={{ repeat: Infinity, duration: 2.8, delay: 2.3, ease: "linear" }}
                />
            </div>

            {/* Main Content Layout */}
            <div className="relative p-10 h-[360px] flex z-20">

                {/* Prism and Data Label (Left Middle) */}
                <div className="flex flex-col">
                    {/* 3D Glass Prism Representation */}
                    <motion.div
                        className="relative w-28 h-40 flex items-center justify-center mt-6 cursor-pointer group/prism"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1, y: [-4, 4, -4] }}
                        transition={{
                            opacity: { duration: 0.6, delay: 0 },
                            scale: { duration: 0.6, delay: 0 },
                            y: { repeat: Infinity, duration: 4, ease: "easeInOut" }
                        }}
                    >
                        {/* Central Prism Base (Solid blur clip) */}
                        <motion.div
                            className="absolute inset-0 backdrop-blur-md shadow-[0_0_40px_rgba(255,255,255,0.05)] transition-all duration-700 group-hover/prism:bg-white/10 group-hover/prism:shadow-[0_0_60px_rgba(168,85,247,0.2)]"
                            style={{ clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' }}
                            initial={{ backgroundColor: "rgba(255,255,255,0)" }}
                            animate={{ backgroundColor: "rgba(255,255,255,0.03)" }}
                            transition={{ duration: 0.4, delay: 0.7 }}
                        />

                        {/* Sharp glass edges and inner facets via SVG */}
                        <svg className="absolute inset-0 w-full h-full pointer-events-none drop-shadow-lg" viewBox="0 0 112 160">
                            <defs>
                                <linearGradient id="prism-light-line" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="rgba(255,255,255,0)" />
                                    <stop offset="50%" stopColor="rgba(255,255,255,0.6)" />
                                    <stop offset="100%" stopColor="rgba(255,255,255,0)" />
                                </linearGradient>
                            </defs>
                            {/* Outer rhombus stroke */}
                            <polygon points="56,2 110,80 56,158 2,80" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" />
                            {/* Inner reflection diamond */}
                            <polygon points="56,14 96,80 56,146 16,80" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
                            {/* Vertical center axis */}
                            <line x1="56" y1="14" x2="56" y2="146" stroke="url(#prism-light-line)" strokeWidth="1.5" />
                            {/* Horizontal axis (fainter) */}
                            <line x1="16" y1="80" x2="96" y2="80" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
                        </svg>

                        {/* Floating Triangle Core */}
                        <motion.div
                            initial={{ filter: "drop-shadow(0 0 0px rgba(255,255,255,0))", color: "rgba(255,255,255,0.2)" }}
                            animate={{ filter: "drop-shadow(0 0 15px rgba(255,255,255,0.6))", color: "rgba(255,255,255,0.8)" }}
                            transition={{ duration: 0.4, delay: 0.7 }}
                            className="z-10 text-white"
                        >
                            <Triangle size={24} strokeWidth={1.5} className="group-hover/prism:text-white transition-colors duration-500 scale-y-125" style={{ color: "currentColor" }} />
                        </motion.div>
                    </motion.div>
                </div>

                {/* Floating Description at Bottom Left */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 1.2 }}
                    className="absolute bottom-13 left-14 text-[18px] leading-[1.8] font-serif text-white/50 tracking-[0.4em] pointer-events-none whitespace-pre-line"
                >
                    {module.description}
                </motion.div>

                {/* Large Asymmetrical Title on the Far Right */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 1, delay: 1 }}
                    className="absolute right-6 top-10 flex h-[280px] pointer-events-none"
                >
                    <h2
                        className="text-4xl font-serif text-white tracking-[0.3em] font-light z-30 opacity-90"
                        style={{ writingMode: 'vertical-rl' }}
                    >
                        {module.title}
                    </h2>
                    <div className="w-px h-full bg-linear-to-b from-purple-500/50 to-transparent ml-4" />
                </motion.div>
            </div>
        </div>
    );
}
