import React from 'react';
import { motion } from 'framer-motion';

interface ModuleProps {
    module: {
        id: string;
        title: string;
        description: string;
    };
}

export default function PressCard({ module }: ModuleProps) {
    return (
        <div className="relative group-hover:-translate-y-2 transition-transform duration-500 ease-out h-[360px] w-full bg-[#eee9df] rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.04)] group-hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)] border border-stone-300 overflow-hidden flex flex-col p-5">

            {/* Paper Texture Overlay */}
            <div className="absolute inset-0 opacity-[0.25] mix-blend-multiply pointer-events-none" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}></div>

            {/* The Masthead (Top Row) */}
            <div className="relative z-10 flex justify-between items-end pb-3 border-b-2 border-stone-800 shrink-0">
                <div className="flex flex-col">
                    <div className="flex items-center gap-1.5 mb-1 opacity-70">
                        <div className="w-2 h-2 bg-stone-800 rounded-sm" />
                        <span className="text-[9px] font-bold tracking-[0.2em] text-stone-800 uppercase">INFO_PROTOCOL</span>
                    </div>
                    <h3 className="text-3xl font-black font-serif tracking-tight text-stone-900 leading-none">
                        {module.title}
                    </h3>
                </div>
                <div className="flex items-center gap-2 mb-1">
                    <div className="flex items-center gap-1.5 px-2 py-0.5 bg-stone-200/50 rounded-full border border-stone-300">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_4px_rgba(16,185,129,0.8)]" />
                        <span className="text-[10px] font-bold text-stone-600 uppercase tracking-widest">Active</span>
                    </div>
                </div>
            </div>

            {/* Main Grid Area */}
            <div className="relative flex-1 mt-3 z-10">
                {/* Animated Grid Lines */}
                <div className="absolute inset-0 pointer-events-none">
                    {/* Vertical Divider */}
                    <motion.div initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} transition={{ duration: 0.6, ease: "circOut", delay: 0.1 }} className="absolute top-0 bottom-0 left-[55%] w-px bg-stone-800/80 origin-top" />
                    {/* Horizontal Divider Left */}
                    <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 0.5, delay: 0.3, ease: "circOut" }} className="absolute top-[65%] left-0 w-[55%] h-px bg-stone-800/80 origin-left" />
                    {/* Horizontal Divider Right */}
                    <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 0.5, delay: 0.4, ease: "circOut" }} className="absolute top-[45%] right-0 w-[45%] h-px bg-stone-800/80 origin-left" />
                </div>

                {/* Top Left: Deep Reading / Node Tree -> Forum Hub */}
                <div className="absolute top-0 left-0 w-[55%] h-[65%] p-4 flex items-center justify-center overflow-hidden">
                    <div className="relative w-full h-full">
                        {/* SVG Connection Lines */}
                        <svg className="absolute inset-0 w-full h-full text-stone-800/60 pointer-events-none" style={{ vectorEffect: 'non-scaling-stroke' }}>
                            {[
                                { path: "M 30 95 Q 75 95 120 70", delay: 0.6, dash: false },
                                { path: "M 70 25 Q 100 25 120 70", delay: 0.7, dash: true },
                                { path: "M 210 35 Q 165 35 120 70", delay: 0.8, dash: false },
                                { path: "M 190 120 Q 155 120 120 70", delay: 0.9, dash: false },
                            ].map((p, i) => (
                                <motion.path key={i} initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.2, delay: p.delay, ease: "easeInOut" }} d={p.path} fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray={p.dash ? "3 3" : "none"} />
                            ))}
                        </svg>

                        {/* Outer Nodes & Avatar Placeholders */}
                        {[
                            { x: 30, y: 95, ax: -2, ay: 83, delay: 0.6 },
                            { x: 70, y: 25, ax: 38, ay: 13, delay: 0.7 },
                            { x: 210, y: 35, ax: 218, ay: 23, delay: 0.8 },
                            { x: 190, y: 120, ax: 198, ay: 108, delay: 0.9 },
                        ].map((node, i) => (
                            <React.Fragment key={i}>
                                {/* Node */}
                                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: node.delay, type: "spring" }} className="absolute bg-stone-900 w-2 h-2 rounded-full z-10" style={{ top: `${node.y - 4}px`, left: `${node.x - 4}px` }} />
                                {/* Avatar */}
                                <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: node.delay + 0.1, type: "spring", bounce: 0.5 }} className="absolute w-[22px] h-[22px] bg-stone-100 border border-stone-800 rounded-[6px] flex items-center justify-center overflow-hidden z-20 shadow-[1px_1px_0_rgba(0,0,0,0.8)]" style={{ left: `${node.ax}px`, top: `${node.ay}px` }}>
                                    <div className="absolute w-2 h-2 bg-stone-800 rounded-full top-[3px]" />
                                    <div className="absolute w-[16px] h-[7px] bg-stone-800 rounded-t-[8px] -bottom-px" />
                                </motion.div>
                            </React.Fragment>
                        ))}

                        {/* Central Hub Node (Us) */}
                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 1.2, type: "spring", bounce: 0.6 }} className="absolute z-20 flex items-center justify-center w-6 h-6 bg-[#eee9df] rounded-full border-[1.5px] border-stone-800 shadow-[0_0_0_2px_#eee9df,0_0_0_3px_#292524]" style={{ top: '58px', left: '108px' }}>
                            <div className="w-2.5 h-2.5 rounded-full bg-stone-800" />
                        </motion.div>
                    </div>
                </div>

                {/* Bottom Left: Chat / IM (WeChat/QQ style) */}
                <div className="absolute top-[65%] left-0 w-[55%] h-[35%] p-3 flex flex-col justify-center gap-2.5">
                    {/* Received Message */}
                    <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.8 }} className="flex items-end gap-2">
                        <div className="w-6 h-6 bg-stone-800 rounded-sm shrink-0" />
                        <div className="bg-white border border-stone-800 px-3 py-2 rounded-xl rounded-bl-sm shadow-[2px_2px_0_rgba(0,0,0,0.8)] max-w-[70%]">
                            <div className="w-16 h-1.5 bg-stone-800/80 rounded-sm mb-1.5" />
                            <div className="w-10 h-1.5 bg-stone-800/40 rounded-sm" />
                        </div>
                    </motion.div>
                    {/* Sent Message */}
                    <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.95 }} className="flex items-end gap-2 justify-end">
                        <div className="bg-[#002fa7] px-3 py-2 rounded-xl rounded-br-sm shadow-[2px_2px_0_rgba(0,0,0,0.8)] max-w-[70%]">
                            <div className="w-20 h-1.5 bg-white/90 rounded-sm" />
                        </div>
                        <div className="w-6 h-6 bg-stone-300 rounded-sm border border-stone-800 shrink-0" />
                    </motion.div>
                </div>

                {/* Top Right: Video / Waveform & Focus */}
                <div className="absolute top-0 right-0 w-[45%] h-[45%] flex items-center justify-center p-4">
                    <div className="relative w-full h-full max-w-[120px] max-h-[120px] flex items-center justify-center">
                        {/* Viewfinder Corners */}
                        <motion.div initial={{ opacity: 0, scale: 1.2 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, delay: 0.6, ease: "easeOut" }} className="absolute inset-0">
                            <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-stone-800" />
                            <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-stone-800" />
                            <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-stone-800" />
                            <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-stone-800" />
                        </motion.div>
                        {/* Central YouTube Play Button (Two-stage animation) */}
                        <div className="relative flex justify-center items-center w-12 h-8">
                            {/* Stage 1: Expanding Background (The "App Icon" revealing) */}
                            <motion.div
                                initial={{ scale: 0, opacity: 0, borderRadius: "50%" }}
                                animate={{ scale: 1, opacity: 1, borderRadius: "8px" }}
                                transition={{
                                    duration: 0.5,
                                    ease: [0.175, 0.885, 0.32, 1.275], // Custom spring-like easing
                                    delay: 0.6
                                }}
                                className="absolute inset-0 bg-stone-800 drop-shadow-[0_2px_4px_rgba(0,0,0,0.1)]"
                            />

                            {/* Stage 2: White Triangle (Fades in after background expands) */}
                            <motion.div
                                initial={{ opacity: 0, scale: 0.5 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{
                                    type: "spring",
                                    stiffness: 300,
                                    damping: 15,
                                    delay: 1.1 // Wait for Stage 1 to almost finish
                                }}
                                className="relative w-0 h-0 border-t-[5px] border-t-transparent border-l-8 border-l-[#eee9df] border-b-[5px] border-b-transparent ml-0.5 z-10"
                            />
                        </div>

                        {/* Right Side Bilibili Action Icons (Like, Coin, Favorite, Share) */}
                        <div className="absolute -right-8 top-0 bottom-0 flex flex-col justify-center gap-1.5 opacity-80">
                            {[
                                // Like (Thumbs up)
                                "M14 9V5a3 3 0 0 0-3-3l-4 9v11a2 2 0 0 0 2 2h8.28a2 2 0 0 0 1.94-1.5l2-9A2 2 0 0 0 19.28 9H14z M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3",
                                // Coin (Circle with slots)
                                "M12 22A10 10 0 1 0 12 2a10 10 0 0 0 0 20z M12 6v12 M9 9h6 M9 15h6",
                                // Favorite (Star)
                                "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z",
                                // Share (Forward/Share arrow)
                                "M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8 M16 6l-4-4-4 4 M12 2v13"
                            ].map((path, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, x: -5, scale: 0 }}
                                    animate={{ opacity: 1, x: 0, scale: 1 }}
                                    transition={{ delay: 1.1 + i * 0.15, type: "spring", stiffness: 300 }}
                                    className="text-stone-800 p-1 flex items-center justify-center rounded-md hover:bg-stone-800/5 transition-colors cursor-pointer"
                                >
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <path d={path} />
                                    </svg>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Bottom Right: Microblog / Twitter Layout */}
                <div className="absolute top-[45%] right-0 w-[45%] h-[55%] p-3.5 flex">
                    <div className="flex flex-col w-full h-full">

                        {/* Header: Avatar, Name & Check, Handle */}
                        <div className="flex items-center gap-2">
                            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.8, type: "spring" }} className="w-7 h-7 rounded-full bg-stone-300 shrink-0 border border-stone-800/10 flex flex-col items-center justify-end overflow-hidden">
                                <div className="w-3 h-3 rounded-full bg-stone-500 mb-px" />
                                <div className="w-5 h-2.5 rounded-t-full bg-stone-500" />
                            </motion.div>
                            <div className="flex flex-col justify-center gap-0.5">
                                <motion.div initial={{ opacity: 0, x: 5 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.9 }} className="flex items-center gap-1 leading-none">
                                    <span className="text-stone-900 font-bold text-[11px]">aokesem</span>
                                    <svg className="w-3 h-3 text-[#1d9bf0]" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M22.5 12.5l-1.58 1.95.36 2.47-2.45.41-1.18 2.18-2.38-1.01-1.95 1.58-1.95-1.58-2.38 1.01-1.18-2.18-2.45-.41.36-2.47-1.58-1.95 1.58-1.95-.36-2.47 2.45-.41 1.18-2.18 2.38 1.01 1.95-1.58 1.95 1.58 2.38-1.01 1.18 2.18 2.45.41-.36 2.47 1.58 1.95z" />
                                        <path d="M10.5 16.5l-4-4 1.5-1.5 2.5 2.5 6-6 1.5 1.5-7.5 7.5z" fill="white" />
                                    </svg>
                                </motion.div>
                                <motion.div initial={{ opacity: 0, x: 5 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.95 }} className="leading-none">
                                    <span className="text-stone-500 text-[9px]">@cyz314</span>
                                </motion.div>
                            </div>
                        </div>

                        {/* Abstract Text Lines (left aligned with avatar) */}
                        <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.0 }} className="flex flex-col gap-1 mt-2">
                            <div className="h-[4px] bg-stone-800/80 rounded-sm w-[95%]" />
                            <div className="h-[4px] bg-stone-800/80 rounded-sm w-[70%]" />
                        </motion.div>

                        {/* Image Box (2-color diagonal stripes) */}
                        <motion.div
                            initial={{ opacity: 0, scaleY: 0.8, transformOrigin: 'top' }}
                            animate={{ opacity: 1, scaleY: 1 }}
                            transition={{ delay: 1.1, type: "spring", stiffness: 200 }}
                            className="w-full flex-1 min-h-[30px] mt-1 rounded-md border border-stone-800/10 overflow-hidden"
                            style={{ backgroundImage: 'repeating-linear-gradient(-45deg, #e7e5e4 0, #e7e5e4 6px, #d6d3d1 6px, #d6d3d1 12px)' }}
                        />

                        {/* Date, Time, Views */}
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }} className="mt-1 whitespace-nowrap">
                            <span className="text-stone-400 text-[8px]">上午7:34 · 2026年2月25日 · </span>
                            <span className="text-stone-600 text-[8px] font-bold">59.9万</span>
                            <span className="text-stone-400 text-[8px]"> 查看</span>
                        </motion.div>

                        {/* Action Icons Panel */}
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.3 }} className="flex items-center justify-between w-full mt-0.5 text-stone-500 px-1">
                            {/* Reply */}
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" /></svg>
                            {/* Retweet */}
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 1l4 4-4 4 M3 11V9a4 4 0 0 1 4-4h14 M7 23l-4-4 4-4 M21 13v2a4 4 0 0 1-4 4H3" /></svg>
                            {/* Like */}
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>
                            {/* Share/Bookmark / View count symbol from previous tweet */}
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" /></svg>
                        </motion.div>
                    </div>
                </div>

            </div>
        </div>
    );
}
