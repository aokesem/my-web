"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Tv } from "lucide-react";

// 准备素材：海报图片URL
const posters = [
    "/images/275612.jpg",
    "/images/275612.jpg",
];

const PosterMarquee = ({ images, direction = "left", speed = 40 }: any) => {
    return (
        <div className="flex overflow-hidden select-none gap-6">
            <motion.div
                initial={{ x: direction === "left" ? "0%" : "-50%" }}
                animate={{ x: direction === "left" ? "-50%" : "0%" }}
                transition={{
                    duration: speed,
                    ease: "linear",
                    repeat: Infinity,
                }}
                className="flex shrink-0 gap-6 items-center py-4"
            >
                {[...images, ...images].map((src, index) => (
                    <div
                        key={index}
                        className="relative w-[200px] h-[300px] md:w-[240px] md:h-[360px] rounded-2xl overflow-hidden border border-white/10 bg-white/5 shadow-2xl"
                    >
                        <img
                            src={src}
                            alt="Anime Poster"
                            className="w-full h-full object-cover opacity-60"
                        />
                        <div className="absolute inset-0 bg-black/40"></div>
                    </div>
                ))}
            </motion.div>
        </div>
    );
};

export default function AnimePage() {
    return (
        <div className="min-h-screen bg-[#050505] text-white relative overflow-hidden flex flex-col">

            {/* 背景层：流动的海报墙 */}
            <div className="absolute inset-0 z-0 flex flex-col justify-center opacity-60 blur-[1px] scale-110 pointer-events-none">
                <PosterMarquee images={posters} direction="left" speed={50} />
                <div className="mt-8">
                    <PosterMarquee images={posters} direction="right" speed={60} />
                </div>
                {/* Tailwind v4 语法: bg-linear-to-t */}
                <div className="absolute inset-0 bg-linear-to-t from-[#050505] via-[#050505]/80 to-transparent"></div>
            </div>

            {/* 内容层 */}
            <div className="relative z-10 p-8 md:p-16 flex-1 flex flex-col">
                <motion.header
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex justify-between items-center mb-20"
                >
                    <Link
                        href="/"
                        className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors group"
                    >
                        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                        <span className="text-xs font-mono uppercase tracking-widest">Back to Lab</span>
                    </Link>
                    <div className="flex items-center gap-2 text-blue-400/70">
                        <Tv size={18} />
                        <span className="text-[10px] font-mono tracking-[0.2em] uppercase">Module: Anime</span>
                    </div>
                </motion.header>

                <main className="max-w-4xl">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        <h1 className="text-6xl md:text-8xl font-bold tracking-tighter italic mb-8 leading-none text-transparent bg-clip-text bg-linear-to-br from-white to-blue-400/50">
                            ACGN <br /> Archive.
                        </h1>
                        <p className="text-xl text-gray-400 max-w-lg font-light leading-relaxed border-l-2 border-blue-500/50 pl-6">
                            记录那些触动灵魂的叙事、令人惊叹的作画，以及跨越次元的感动瞬间。
                        </p>
                    </motion.div>
                </main>
            </div>
        </div>
    );
}