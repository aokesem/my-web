import React from 'react';
import { motion } from 'framer-motion';
import { Compass } from 'lucide-react';

interface ModuleProps {
    module: {
        id: string;
        title: string;
        description: string;
    };
}

export default function ProjectorCard({ module }: ModuleProps) {
    return (
        <div className="relative group-hover:-translate-y-2 transition-transform duration-500 ease-out h-full overflow-hidden">
            {/* Paper Base - Off-white / Ivory */}
            <div className="absolute inset-0 bg-[#faf9f6] rounded-2xl border border-[#e8e6e1] shadow-[0_4px_12px_rgba(0,0,0,0.03)] group-hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)] transition-all duration-500" />

            {/* Paper Texture Overlay */}
            <div className="absolute inset-0 rounded-2xl opacity-[0.2] mix-blend-multiply pointer-events-none"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.4'/%3E%3C/svg%3E")`,
                    backgroundSize: '200px 200px'
                }}
            />

            {/* Celestial Navigation Background (Concentric Circles & Lines) */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.15]">
                <motion.div
                    className="relative w-[300px] h-[300px]"
                    animate={{ rotate: [0, 360] }}
                    transition={{ repeat: Infinity, duration: 60, ease: "linear" }}
                    style={{ willChange: 'transform' }}
                >
                    <svg viewBox="0 0 200 200" className="w-full h-full text-indigo-900">
                        {/* Circles */}
                        <mask id="projector-dash-mask">
                            <motion.circle cx="100" cy="100" r="95" fill="none" stroke="white" strokeWidth="2"
                                initial={{ pathLength: 0 }}
                                animate={{ pathLength: 1 }}
                                transition={{ duration: 2, ease: "easeInOut", delay: 0.2 }}
                            />
                        </mask>
                        <circle cx="100" cy="100" r="95" fill="none" stroke="currentColor" strokeWidth="0.5" strokeDasharray="2 4" mask="url(#projector-dash-mask)" />

                        <motion.circle cx="100" cy="100" r="70" fill="none" stroke="currentColor" strokeWidth="0.3"
                            initial={{ pathLength: 0, opacity: 0 }}
                            animate={{ pathLength: 1, opacity: 1 }}
                            transition={{ duration: 1.8, ease: "easeInOut", delay: 0.5 }}
                        />
                        <motion.circle cx="100" cy="100" r="45" fill="none" stroke="currentColor" strokeWidth="0.3"
                            initial={{ pathLength: 0, opacity: 0 }}
                            animate={{ pathLength: 1, opacity: 1 }}
                            transition={{ duration: 1.5, ease: "easeInOut", delay: 0.8 }}
                        />

                        {/* Axis Lines */}
                        <motion.line x1="100" y1="0" x2="100" y2="200" stroke="currentColor" strokeWidth="0.2"
                            initial={{ pathLength: 0, opacity: 0 }}
                            animate={{ pathLength: 1, opacity: 1 }}
                            transition={{ duration: 1.5, ease: "easeInOut", delay: 1 }}
                        />
                        <motion.line x1="0" y1="100" x2="200" y2="100" stroke="currentColor" strokeWidth="0.2"
                            initial={{ pathLength: 0, opacity: 0 }}
                            animate={{ pathLength: 1, opacity: 1 }}
                            transition={{ duration: 1.5, ease: "easeInOut", delay: 1 }}
                        />
                        <motion.line x1="30" y1="30" x2="170" y2="170" stroke="currentColor" strokeWidth="0.2"
                            initial={{ pathLength: 0, opacity: 0 }}
                            animate={{ pathLength: 1, opacity: 1 }}
                            transition={{ duration: 1.5, ease: "easeInOut", delay: 1.2 }}
                        />
                        <motion.line x1="170" y1="30" x2="30" y2="170" stroke="currentColor" strokeWidth="0.2"
                            initial={{ pathLength: 0, opacity: 0 }}
                            animate={{ pathLength: 1, opacity: 1 }}
                            transition={{ duration: 1.5, ease: "easeInOut", delay: 1.2 }}
                        />

                        {/* Compass Marks */}
                        {[0, 90, 180, 270].map((deg, i) => (
                            <motion.text
                                key={deg}
                                x="100" y="10"
                                transform={`rotate(${deg}, 100, 100)`}
                                textAnchor="middle"
                                className="text-[6px] font-mono fill-indigo-900/60"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 1, delay: 1.5 + i * 0.2 }}
                            >
                                {deg}°
                            </motion.text>
                        ))}
                    </svg>
                </motion.div>
            </div>

            {/* Main Visual: Constellation Chart */}
            <div className="absolute inset-0 flex items-center justify-center p-12">
                <div className="relative w-full h-full">
                    {/* SVG Constellation Lines */}
                    <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full text-indigo-900/40 pointer-events-none">
                        <defs>
                            <filter id="star-glow">
                                <feGaussianBlur stdDeviation="1.5" result="blur" />
                                <feComposite in="SourceGraphic" in2="blur" operator="over" />
                            </filter>
                        </defs>

                        {/* Constellation Drawing Paths */}
                        {/* Constellation Drawing Paths - Hexagon Structure */}
                        <motion.path
                            d="M 50,20 L 75.98,35 L 75.98,65 L 50,80 L 24.02,65 L 24.02,35 Z"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="0.75"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            initial={{ pathLength: 0, opacity: 0 }}
                            animate={{ pathLength: 1, opacity: 1 }}
                            transition={{ duration: 2, ease: "easeInOut", delay: 0.5 }}
                        />
                        {/* Internal radial connections */}
                        <motion.path
                            d="M 50,20 L 50,50 M 75.98,35 L 50,50 M 75.98,65 L 50,50 M 50,80 L 50,50 M 24.02,65 L 50,50 M 24.02,35 L 50,50"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="0.5"
                            strokeDasharray="2 3"
                            initial={{ pathLength: 0, opacity: 0 }}
                            animate={{ pathLength: 1, opacity: 1 }}
                            transition={{ duration: 1.5, ease: "easeInOut", delay: 1.2 }}
                        />

                        {/* Star Nodes (Hexagon Vertices + Center) */}
                        {[
                            { cx: 50, cy: 20, delay: 0.5 },    // Top
                            { cx: 75.98, cy: 35, delay: 0.7 }, // Top Right
                            { cx: 75.98, cy: 65, delay: 0.9 }, // Bottom Right
                            { cx: 50, cy: 80, delay: 1.1 },    // Bottom
                            { cx: 24.02, cy: 65, delay: 1.3 }, // Bottom Left
                            { cx: 24.02, cy: 35, delay: 1.5 }, // Top Left
                            { cx: 50, cy: 50, delay: 1.7 },    // Center
                        ].map((star, i) => (
                            <motion.g key={i}>
                                {/* Pulse Effect */}
                                <motion.circle
                                    cx={star.cx} cy={star.cy} r="3"
                                    className="fill-amber-400/20"
                                    animate={{ scale: [1, 1.8, 1], opacity: [0, 0.4, 0] }}
                                    transition={{ repeat: Infinity, duration: 3, delay: star.delay }}
                                />
                                {/* Core Star */}
                                <motion.circle
                                    cx={star.cx} cy={star.cy} r="1.5"
                                    className="fill-amber-500 shadow-amber-200"
                                    style={{ filter: 'url(#star-glow)' }}
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: "spring", stiffness: 200, delay: star.delay + 0.2 }}
                                />
                            </motion.g>
                        ))}
                    </svg>
                </div>
            </div>

            {/* Corner Decorative Elements */}
            <div className="absolute top-6 left-6 flex flex-col gap-1 pointer-events-none">
                <Compass size={18} className="text-indigo-900/30" strokeWidth={1.5} />
                <span className="text-[8px] font-mono text-indigo-900/40 font-bold uppercase tracking-[0.2em] mt-1">AXIS_0.92</span>
            </div>

            <div className="absolute top-6 right-6 flex flex-col items-end pointer-events-none">
                <div className="flex gap-1.5 h-1 items-end">
                    {[0.4, 0.7, 1, 0.6, 0.8].map((h, i) => (
                        <motion.div
                            key={i}
                            className="w-0.5 bg-indigo-900/20"
                            style={{ height: h * 12 }}
                            animate={{ opacity: [0.3, 1, 0.3], height: [h * 12, h * 16, h * 12] }}
                            transition={{ repeat: Infinity, duration: 2, delay: i * 0.2 }}
                        />
                    ))}
                </div>
            </div>

            {/* Title & Description Overlay */}
            <div className="absolute bottom-8 left-0 w-full text-center z-20 px-10 flex flex-col items-center">
                {/* Decorative horizontal line for title */}
                <div className="w-12 h-px bg-indigo-900/15 mb-3" />

                <h2 className="text-2xl font-serif font-medium text-indigo-900 tracking-wide flex items-center gap-3">
                    <span>
                        {module.title.slice(0, 2)}
                    </span>
                    <span>
                        {module.title.slice(2)}
                    </span>
                </h2>

                <div className="mt-2 text-xs text-stone-500/80 font-sans tracking-tight leading-relaxed max-w-[85%] mx-auto font-medium">
                    {module.description}
                </div>

                <div className="mt-4 flex items-center gap-1.5 opacity-40 group-hover:opacity-100 transition-all duration-500">
                    <div className="w-8 h-[0.5px] bg-indigo-900/30" />
                    <span className="text-[9px] font-mono font-bold text-indigo-900 uppercase tracking-widest leading-none">Mapping Thoughts</span>
                    <div className="w-8 h-[0.5px] bg-indigo-900/30" />
                </div>
            </div>

            {/* Subtle Gradient Shadow At Bottom For Depth */}
            <div className="absolute bottom-0 left-0 w-full h-1/4 bg-linear-to-t from-indigo-900/5 to-transparent pointer-events-none" />
        </div>
    );
}
