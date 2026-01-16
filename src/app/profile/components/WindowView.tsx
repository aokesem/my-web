"use client";

import React from 'react';
import { motion } from 'framer-motion';

interface WindowViewProps {
    isOpen: boolean;
    onToggle: () => void;
    isBlurred: boolean; // 核心属性：控制是否变模糊
}

export default function WindowView({ isOpen, onToggle, isBlurred }: WindowViewProps) {
    return (
        <div
            className="relative w-[60vw] max-w-[1000px] aspect-[4/3] shadow-2xl cursor-pointer group scale-90 md:scale-75 transition-all duration-700 ease-in-out"
            onClick={onToggle}
            style={{
                perspective: "2000px",
                // 模糊 + 变暗处理，营造“背景化”的感觉
                filter: isBlurred ? "blur(10px) brightness(0.6) grayscale(0.2)" : "none",
                // 当模糊时，稍微缩小一点点，增加景深感
                transform: isBlurred ? "scale(0.70)" : undefined
            }}
        >

            {/* --- 1. 窗外景色 --- */}
            <div className="absolute inset-0 overflow-hidden bg-[#73b9ff] z-0 rounded-sm">
                <div className="absolute inset-0 bg-gradient-to-b from-[#4da7ff] to-[#99ccff]" />
                <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.4)_0%,transparent_50%)] z-10 pointer-events-none" />

                <div className="absolute inset-0 z-0">
                    {[
                        { id: 1, top: '15%', scale: 1, duration: 45, delay: 0 },
                        { id: 2, top: '45%', scale: 0.8, duration: 60, delay: -15 },
                        { id: 3, top: '10%', scale: 0.5, duration: 80, delay: -40 },
                        { id: 4, top: '60%', scale: 1.2, duration: 55, delay: -10 }
                    ].map((cloud) => (
                        <motion.div
                            key={cloud.id}
                            initial={{ x: "-150%" }}
                            animate={{ x: "250%" }}
                            transition={{ duration: cloud.duration, repeat: Infinity, ease: "linear", delay: cloud.delay }}
                            className="absolute flex opacity-90"
                            style={{ top: cloud.top, scale: cloud.scale }}
                        >
                            <div className="w-20 h-20 bg-white rounded-full" />
                            <div className="w-28 h-28 bg-white rounded-full -ml-8 -mt-4 shadow-inner" />
                            <div className="w-20 h-20 bg-white rounded-full -ml-8" />
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* --- 2. 窗框与窗扇 --- */}
            <div className="absolute inset-[-15px] border-[15px] border-white rounded-sm z-30 shadow-[0_0_0_2px_rgba(0,0,0,0.05)] pointer-events-none" />

            <div className="relative w-full h-full flex z-20" style={{ transformStyle: "preserve-3d" }}>
                {/* 左窗扇 */}
                <motion.div
                    animate={{ rotateY: isOpen ? -115 : 0 }}
                    transition={{ type: "spring", stiffness: 45, damping: 15 }}
                    className="relative flex-1 h-full bg-white/5 border-r-[8px] border-white origin-left"
                    style={{ transformStyle: "preserve-3d", backfaceVisibility: "hidden" }}
                >
                    <div className="absolute inset-0 border-[12px] border-white flex items-center justify-center">
                        <div className="absolute w-full h-[8px] bg-white" />
                        <div className="absolute h-full w-[8px] bg-white" />
                        <div className="absolute top-0 left-4 w-4 h-full bg-white/20 -rotate-12" />
                    </div>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 w-2 h-16 bg-zinc-200 rounded-full border border-zinc-300" />
                </motion.div>

                {/* 右窗扇 */}
                <motion.div
                    animate={{ rotateY: isOpen ? 115 : 0 }}
                    transition={{ type: "spring", stiffness: 45, damping: 15 }}
                    className="relative flex-1 h-full bg-white/5 border-l-[8px] border-white origin-right"
                    style={{ transformStyle: "preserve-3d", backfaceVisibility: "hidden" }}
                >
                    <div className="absolute inset-0 border-[12px] border-white flex items-center justify-center">
                        <div className="absolute w-full h-[8px] bg-white" />
                        <div className="absolute h-full w-[8px] bg-white" />
                        <div className="absolute top-0 right-4 w-4 h-full bg-white/20 -rotate-12" />
                    </div>
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 w-2 h-16 bg-zinc-200 rounded-full border border-zinc-300" />
                </motion.div>
            </div>

            {/* 窗台 */}
            <div className="absolute -bottom-[25px] -left-[25px] -right-[25px] h-[25px] bg-[#f8f8f8] border border-zinc-200 shadow-xl rounded-b-sm z-40" />
        </div>
    );
}