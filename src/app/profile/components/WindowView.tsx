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
            className="relative w-[60vw] max-w-[1000px] aspect-4/3 shadow-2xl cursor-pointer group scale-90 md:scale-75 transition-all duration-700 ease-in-out"
            onClick={onToggle}
            style={{
                perspective: "2000px",
                // 模糊 + 变暗 (在亮色主题下，变暗程度可以轻一点，主要是模糊)
                filter: isBlurred ? "blur(12px) opacity(0.5) grayscale(0.2)" : "none",
                transform: isBlurred ? "scale(0.70)" : undefined
            }}
        >

            {/* --- 1. 窗外景色 (清晨天空 / 极简白昼) --- */}
            <div className="absolute inset-0 overflow-hidden bg-[#e0f2fe] z-0 rounded-sm">
                {/* 天空渐变 */}
                <div className="absolute inset-0 bg-linear-to-b from-[#38bdf8] via-[#bae6fd] to-[#f0f9ff]" />

                {/* 阳光/光晕 */}
                <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-[radial-gradient(circle,rgba(255,255,255,0.4)_0%,transparent_70%)] translate-x-1/3 -translate-y-1/3 blur-3xl" />

                {/* 极简云朵/气流 */}
                <div className="absolute inset-0 z-0 opacity-60">
                    {[...Array(6)].map((_, i) => (
                        <motion.div
                            key={i}
                            initial={{ x: "-150%" }}
                            animate={{ x: "250%" }}
                            transition={{
                                duration: Math.random() * 60 + 40,
                                repeat: Infinity,
                                ease: "linear",
                                delay: Math.random() * -50
                            }}
                            className="absolute bg-white/40 blur-2xl rounded-full"
                            style={{
                                top: `${Math.random() * 80}%`,
                                width: `${Math.random() * 400 + 200}px`,
                                height: `${Math.random() * 100 + 50}px`,
                            }}
                        />
                    ))}
                </div>
            </div>

            {/* --- 2. 窗框与窗扇 (白色铝合金/银色) --- */}
            <div className="absolute inset-[-15px] border-15 border-[#f1f5f9] rounded-sm z-30 shadow-[0_10px_40px_rgba(0,0,0,0.1)] pointer-events-none ring-1 ring-slate-200" />

            <div className="relative w-full h-full flex z-20" style={{ transformStyle: "preserve-3d" }}>
                {/* 左窗扇 */}
                <motion.div
                    animate={{ rotateY: isOpen ? -115 : 0 }}
                    transition={{ type: "spring", stiffness: 45, damping: 15 }}
                    className="relative flex-1 h-full bg-white/20 border-r-8 border-[#e2e8f0] origin-left backdrop-blur-[2px]"
                    style={{ transformStyle: "preserve-3d", backfaceVisibility: "hidden" }}
                >
                    <div className="absolute inset-0 border-12 border-[#f8fafc] flex items-center justify-center shadow-inner">
                        <div className="absolute w-full h-[8px] bg-[#e2e8f0]" />
                        <div className="absolute h-full w-[8px] bg-[#e2e8f0]" />
                        {/* 玻璃反光 */}
                        <div className="absolute top-0 left-4 w-16 h-full bg-linear-to-r from-white/40 to-transparent -rotate-12 pointer-events-none" />
                    </div>
                    {/* 把手 (银色) */}
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 w-2 h-16 bg-[#cbd5e1] rounded-full border border-[#94a3b8] shadow-sm" />
                </motion.div>

                {/* 右窗扇 */}
                <motion.div
                    animate={{ rotateY: isOpen ? 115 : 0 }}
                    transition={{ type: "spring", stiffness: 45, damping: 15 }}
                    className="relative flex-1 h-full bg-white/20 border-l-8 border-[#e2e8f0] origin-right backdrop-blur-[2px]"
                    style={{ transformStyle: "preserve-3d", backfaceVisibility: "hidden" }}
                >
                    <div className="absolute inset-0 border-12 border-[#f8fafc] flex items-center justify-center shadow-inner">
                        <div className="absolute w-full h-[8px] bg-[#e2e8f0]" />
                        <div className="absolute h-full w-[8px] bg-[#e2e8f0]" />
                        {/* 玻璃反光 */}
                        <div className="absolute top-0 right-4 w-16 h-full bg-linear-to-l from-white/40 to-transparent -rotate-12 pointer-events-none" />
                    </div>
                    {/* 把手 */}
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 w-2 h-16 bg-[#cbd5e1] rounded-full border border-[#94a3b8] shadow-sm" />
                </motion.div>
            </div>

            {/* 窗台 (浅灰石材) */}
            <div className="absolute -bottom-[25px] -left-[25px] -right-[25px] h-[25px] bg-[#f1f5f9] border-t border-white shadow-lg rounded-b-sm z-40" />
        </div>
    );
}