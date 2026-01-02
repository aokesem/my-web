"use client";

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Tv, Film, BookOpen, ArrowUpRight } from 'lucide-react';


// --- 45度斜向流动的无缝海报墙组件 ---
const DiagonalPosterGrid = () => {
    // 1. 在这里列出你 images 文件夹下所有的图片名
    const myImages = [
        "/images/败犬女主.png",
        "/images/冰菓.png",
        "/images/冰海战记.png",
        "/images/芙莉莲.png",
        "/images/钢炼fa.png",
        "/images/高达0080.png",
        "/images/化物语.png",
        "/images/欢迎加入nhk.png",
        "/images/辉夜第三季.png",
        "/images/寄生兽.png",
        "/images/巨人第三季part2.png",
        "/images/来自新世界.png",
        "/images/凉宫春日的消失.png",
        "/images/琉璃的宝石.png",
        "/images/鲁鲁修.png",
        "/images/迷宫饭.png",
        "/images/命运石之门.png",
        "/images/末日后酒店.png",
        "/images/女高日常.png",
        "/images/千年女优.png",
        "/images/轻音少女第二季.png",
        "/images/小魔女学院.png",
        "/images/小樱.png",
        "/images/咲良田.png",
        "/images/悠哉日常大王.png",
        "/images/月色真美.png",
        "/images/mygo.png"
    ];


    // 2. 逻辑：无论你提供了多少张图，我们都通过“取余运算 (%)”把它们均匀分发到 24 个格子里
    // 这样即使你只有 3 张图，它也会 1-2-3-1-2-3 地排满，不会留空
    const gridImages = Array.from({ length: 24 }, (_, i) => myImages[i % myImages.length]);

    return (
        <div className="absolute inset-0 overflow-hidden opacity-20 pointer-events-none group-hover:opacity-40 transition-opacity duration-700">
            <motion.div
                animate={{
                    x: [0, -100, -200],
                    y: [0, -150, -300],
                }}
                transition={{
                    duration: 30,
                    ease: "linear",
                    repeat: Infinity,
                }}
                className="grid grid-cols-4 gap-0 w-[200%] md:w-[250%]"
            >
                {gridImages.map((src, i) => (
                    <div
                        key={i}
                        className="relative aspect-2/3 w-full border-[0.5px] border-white/5 overflow-hidden"
                    >
                        <img
                            src={src}
                            className="w-full h-full object-cover scale-110" // 稍微放大防止边缘露白
                            alt={`Poster ${i}`}
                        />
                    </div>
                ))}
            </motion.div>

            {/* 遮罩逻辑保持不变 */}
            <div className="absolute inset-0 bg-linear-to-b from-[#020202] via-transparent to-[#020202] z-10" />
            <div className="absolute inset-0 bg-linear-to-r from-[#020202]/50 via-transparent to-[#020202]/50 z-10" />
        </div>
    );
};

const LabSection = ({ title, sub, icon: Icon, href, colorClass, delay, showPosterWall = false }: any) => {
    return (
        <Link href={href} className="flex-1 relative group rounded-[2.5rem] overflow-hidden border border-white/5 bg-[#0A0A0A] h-[75vh] min-w-[320px] transition-all duration-700 hover:border-white/20 hover:shadow-2xl hover:shadow-blue-500/10">

            {/* 如果是动漫卡片，显示 45 度流动海报背景 */}
            {showPosterWall && <DiagonalPosterGrid />}

            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay, duration: 0.8 }}
                className="h-full w-full p-10 flex flex-col justify-between relative z-10"
            >
                <div>
                    <div className="flex justify-between items-start mb-12">
                        <div className="p-3 rounded-2xl bg-white/5 border border-white/10 group-hover:bg-white/10 group-hover:border-white/30 transition-all duration-500">
                            <Icon size={22} className="text-gray-400 group-hover:text-white" />
                        </div>
                        <span className="text-[10px] font-mono tracking-[0.3em] text-gray-600 group-hover:text-gray-400 uppercase">
                            Archive-01
                        </span>
                    </div>

                    <h2 className="text-4xl font-bold tracking-tighter text-white/90 group-hover:text-white leading-tight">
                        {title.split(' / ')[0]}
                        <span className="block text-lg font-light tracking-[0.2em] text-gray-500 mt-2">
                            {title.split(' / ')[1]}
                        </span>
                    </h2>
                </div>

                <div>
                    <p className="text-sm text-gray-400 font-light leading-relaxed mb-8 group-hover:text-gray-200 transition-colors">
                        {sub}
                    </p>
                    <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-white/5 border border-white/10 group-hover:bg-white/10 transition-all">
                        <span className="text-[10px] font-mono tracking-widest uppercase">Enter Module</span>
                        <ArrowUpRight size={14} />
                    </div>
                </div>
            </motion.div>

            {/* 渐变装饰底色 */}
            {!showPosterWall && (
                <div className={`absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-1000 bg-linear-to-b ${colorClass}`} />
            )}

            <div className="absolute inset-0 opacity-[0.03] pointer-events-none [background-image:linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)] [background-size:30px_30px]"></div>
        </Link>
    );
};

export default function LabPortal() {
    return (
        <div className="min-h-screen bg-[#020202] text-white flex flex-col items-center justify-center p-8 overflow-hidden">

            <div className="w-full max-w-7xl mb-12 flex justify-between items-end">
                <div>
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 mb-4">
                        <div className="h-px w-6 bg-blue-500" />
                        <span className="text-[10px] font-mono tracking-[0.3em] text-blue-500 uppercase">System Active</span>
                    </motion.div>
                    <h1 className="text-6xl md:text-7xl font-bold italic tracking-tighter">
                        Private <span className="text-gray-700">Lab.</span>
                    </h1>
                </div>
            </div>

            <main className="flex flex-col md:flex-row gap-6 w-full max-w-7xl">
                <LabSection
                    title="动漫 / ANIME"
                    sub="ACGN文化与审美研究，记录那些触动灵魂的瞬间。"
                    icon={Tv}
                    href="/anime"
                    showPosterWall={true} // 开启海报墙
                    delay={0.1}
                />
                <LabSection
                    title="电影 / CINEMA"
                    sub="第七艺术的私人放映，关于光影、构图与叙事的记忆。"
                    icon={Film}
                    href="/cinema"
                    colorClass="from-purple-500/50 to-transparent"
                    delay={0.2}
                />
                <LabSection
                    title="读书 / READING"
                    sub="思想的文字承载，在寂静中构建个人的精神乐园。"
                    icon={BookOpen}
                    href="/reading"
                    colorClass="from-amber-500/50 to-transparent"
                    delay={0.3}
                />
            </main>

            <footer className="mt-12 w-full max-w-7xl flex justify-between text-[10px] font-mono text-gray-700 tracking-widest uppercase">
                <div>Experimental UI v1.2</div>
                <div>Ready to Explore © 2026</div>
            </footer>
        </div>
    );
}