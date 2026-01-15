"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
// 引入 Image 组件用于后续放置真实头像
import Image from 'next/image';

export default function ProfilePage() {
    const [isOpen, setIsOpen] = useState(false);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    if (!isMounted) return null;

    return (
        // 墙壁层 (主容器)
        <div className="relative w-screen h-screen overflow-hidden bg-[#eaf4ec] flex items-center justify-center">

            {/* =======================
          NEW: 1. 欢迎标题 (顶部居中)
         ======================= */}
            <div className="absolute top-[12%] z-10 text-center pointer-events-none">
                <h1 className="text-3xl md:text-5xl font-bold text-[#3a5a40] tracking-widest drop-shadow-sm font-serif opacity-90">
                    欢迎来到CYZ的小屋
                </h1>
            </div>

            {/* =======================
          NEW: 2. 个人信息区 (左上角)
         ======================= */}
            <div className="absolute top-8 left-8 z-50 flex flex-col items-center gap-3">
                {/* 头像框 (Avatar Frame) */}
                <div className="relative w-24 h-24 md:w-28 md:h-28 rounded-full border-[5px] border-white shadow-[0_4px_12px_rgba(0,0,0,0.1)] overflow-hidden bg-zinc-100 group hover:scale-105 transition-transform">
                    {/* 占位符：你可以把这里换成真实的 <Image src="..." /> */}
                    <div className="absolute inset-0 bg-linear-to-tr from-zinc-200 to-zinc-100 flex items-center justify-center text-zinc-400 font-bold text-2xl">
                        CYZ
                    </div>
                    {/* 可选：添加一个像之前那样的玻璃反光层 */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-white/30 to-transparent pointer-events-none" />
                </div>

                {/* 状态显示条 (Status Indicator) */}
                <div className="flex items-center gap-2 px-4 py-2 bg-white/90 backdrop-blur-sm rounded-full shadow-sm border border-white/50">
                    {/* 呼吸灯动画点 */}
                    <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                    </span>
                    {/* 状态文字 */}
                    <span className="text-sm font-bold text-zinc-700 tracking-wider">
                        活跃中 / Online
                    </span>
                </div>
            </div>


            {/* =======================
          原有内容: 远景窗户容器
          (保持不变，仅为了层级关系放在这里)
         ======================= */}
            <div
                className="relative w-[60vw] max-w-[1000px] aspect-[4/3] shadow-2xl cursor-pointer group scale-90 md:scale-75 mt-16" // 增加了一点 mt-16 让窗户稍微下移，避开标题
                onClick={() => setIsOpen(!isOpen)}
                style={{ perspective: "2000px" }}
            >

                {/* --- 1. 窗外景色 (云朵) --- */}
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
        </div>
    );
}