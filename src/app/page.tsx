"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { Tv, Film, BookOpen, ArrowUpRight } from 'lucide-react';

// ... (DiagonalPosterGrid 和 CinemaReel 组件代码保持不变，请保留之前的版本) ...
// 为了方便你复制，我会在下面把 TextStream 替换进去，前面的组件简写

// ==============================================
// 1. 动漫组件：斜向流动的海报墙 (保持不变)
// ==============================================
const DiagonalPosterGrid = () => {
  const myImages = [
    "/images/anime_poster/败犬女主.png",
    "/images/anime_poster/冰菓.png",
    "/images/anime_poster/冰海战记.png",
    "/images/anime_poster/芙莉莲.png",
    "/images/anime_poster/钢炼fa.png",
    "/images/anime_poster/高达0080.png",
    "/images/anime_poster/化物语.png",
    "/images/anime_poster/欢迎加入nhk.png",
    "/images/anime_poster/辉夜第三季.png",
    "/images/anime_poster/寄生兽.png",
    "/images/anime_poster/巨人第三季part2.png",
    "/images/anime_poster/来自新世界.png",
    "/images/anime_poster/凉宫春日的消失.png",
    "/images/anime_poster/琉璃的宝石.png",
    "/images/anime_poster/鲁鲁修.png",
    "/images/anime_poster/迷宫饭.png",
    "/images/anime_poster/命运石之门.png",
    "/images/anime_poster/末日后酒店.png",
    "/images/anime_poster/女高日常.png",
    "/images/anime_poster/千年女优.png",
    "/images/anime_poster/轻音少女第二季.png",
    "/images/anime_poster/小魔女学院.png",
    "/images/anime_poster/小樱.png",
    "/images/anime_poster/咲良田.png",
    "/images/anime_poster/悠哉日常大王.png",
    "/images/anime_poster/月色真美.png",
    "/images/anime_poster/mygo.png"
  ];

  // 1. 解决洗牌问题：使用 State 和 Effect 确保只在客户端洗牌
  const [shuffledImages, setShuffledImages] = useState<string[]>([]);

  useEffect(() => {
    // 经典的 Fisher-Yates 洗牌算法
    const shuffle = (array: string[]) => {
      let currentIndex = array.length, randomIndex;
      const newArray = [...array];
      while (currentIndex !== 0) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;
        [newArray[currentIndex], newArray[randomIndex]] = [
          newArray[randomIndex], newArray[currentIndex]
        ];
      }
      return newArray;
    };

    // 洗牌后再进行循环填充
    const shuffled = shuffle(myImages);
    setShuffledImages([...shuffled, ...shuffled]); // 双倍列表实现无缝
  }, []); // 空依赖数组确保只执行一次

  if (shuffledImages.length === 0) return null;

  return (
    <div className="absolute inset-0 overflow-hidden opacity-45 pointer-events-none group-hover:opacity-90 transition-opacity duration-700">
      <motion.div
        animate={{
          x: ["0%", "-50%"],
          y: ["0%", "-50%"],
        }}
        transition={{
          duration: 60,
          ease: "linear",
          repeat: Infinity,
        }}
        className="grid grid-cols-5 gap-0 w-[250%] md:w-[300%]"
      >
        {/* 修复报错2 & 3: 显式声明 map 参数的类型 (src: string, i: number) */}
        {shuffledImages.map((src: string, i: number) => (
          <div
            key={i}
            // 修复警告: 将 aspect-[2/3] 改为 aspect-[0.67] 或保持原样通常也可以，这里用标准写法
            className="relative aspect-2/3 w-full border-[0.5px] border-white/5 overflow-hidden bg-[#0A0A0A]"
          >
            <img
              src={src}
              loading="lazy"
              className="w-full h-full object-cover scale-105  transition-all duration-500"
              alt={`Poster ${i}`}
              onError={(e) => {
                e.currentTarget.style.opacity = '0';
              }}
            />
          </div>
        ))}
      </motion.div>

      <div className="absolute inset-0 bg-linear-to-b from-[#020202] via-transparent to-[#020202] z-10 opacity-80" />
      <div className="absolute inset-0 bg-linear-to-r from-[#020202] via-transparent to-[#020202] z-10 opacity-80" />
    </div>
  );
};

// ==============================================
// 2. 新增电影组件：呼吸感幻灯片 (Cinema Reel)
// ==============================================
const CinemaReel = () => {
  const movieStills = [
    "/images/film_poster/埋藏黄金的墓地.png",
    "/images/film_poster/tuco的笑.png",
    "/images/film_poster/是你们武士.png",
    "/images/film_poster/怀抱孩子的竹千代.png",
  ];

  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % movieStills.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  return (
    // 修改点在这里：
    // 1. opacity-30: 默认亮度降低到 30%，变暗
    // 2. group-hover:opacity-100: 鼠标移上去恢复到 100% 亮度
    // 3. transition-opacity duration-700: 变化过程耗时 0.7秒，平滑过渡
    <div className="absolute inset-0 overflow-hidden bg-black opacity-50 group-hover:opacity-100 transition-opacity duration-700">
      <AnimatePresence mode="popLayout">
        <motion.img
          key={currentIndex}
          src={movieStills[currentIndex]}
          alt="Cinema Still"
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 0.7, scale: 1.2 }}
          exit={{ opacity: 0 }}
          transition={{
            opacity: { duration: 1.5, ease: "easeInOut" },
            scale: { duration: 6, ease: "linear" }
          }}
          // 图片本身的透明度稍微提高到 80%，配合外层的 opacity 变化
          className="absolute inset-0 w-full h-full object-cover opacity-80"
        />
      </AnimatePresence>

      <div className="absolute inset-0 opacity-[0.08] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')] brightness-100 contrast-150 mix-blend-overlay"></div>

      {/* 遮罩层也随之变暗，保持文字清晰 */}
      <div className="absolute inset-0 bg-linear-to-t from-[#020202] via-[#020202]/40 to-transparent z-10" />
    </div>
  );
};

// ==============================================
// 3. 读书组件：斜向流动的文字雨 (Reading)
// ==============================================
const TextStream = () => {
  // 定义一组充满“知性”的关键词，作为流动的纹理
  const words = [
    "春琦，重启吧",
    "魔女敲响了爱人的窗",
    "复杂又单纯，宛如大人般的少年持续怀抱某个期望的故事",
    "所谓的平凡生活，对我而言却是此生触不可及的奢侈品",
    "她的笑容比余晖还要耀眼，让本该枯燥的课桌染上了异彩",
    "除去那只寄宿着恶魔的左眼，我也只是个随处可见的高中生",
    "即便雨水冲刷掉所有痕迹，那个谎言依然在心底隐隐作痛",
    "哪怕前方是虚无的深渊，我也要去探寻藏在天空尽头的答案",
    "所谓的爱，大概是这个世界上最温柔也最残忍的一种诅咒吧",
  ];


  // 生成足够多的单词来填满网格
  // Array(80) 意味着我们会生成 80 个格子，保证覆盖面积
  const streamContent = Array.from({ length: 80 }, (_, i) => words[i % words.length]);

  return (
    // 默认 opacity-30 (暗)，悬停 hover:opacity-100 (亮)
    <div className="absolute inset-0 overflow-hidden bg-[#0A0A0A] opacity-30 group-hover:opacity-80 transition-opacity duration-700">
      <motion.div
        animate={{
          // X轴: 从 0% 移到 -50% (向左)
          // Y轴: 从 -50% 移到 0% (向下)
          // 组合起来就是：向左下角移动
          x: ["0%", "-50%"],
          y: ["-50%", "0%"],
        }}
        transition={{
          duration: 40, // 速度适中，营造一种平缓的“思考流”
          ease: "linear",
          repeat: Infinity,
        }}
        // grid-cols-4: 4列布局
        // w-[200%]: 宽度两倍，确保流动不断
        // -rotate-12: 稍微给文字本身加一点点微弱的旋转，增加艺术感（可选，这里我没加，保持文字水平易读）
        className="grid grid-cols-4 gap-8 w-[200%] h-[200%] p-10 -mt-[50%]"
      >
        {streamContent.map((word, i) => (
          <div key={i} className="flex items-center justify-center">
            <span className="text-[10px] md:text-xs font-mono font-bold tracking-[0.2em] text-white/40 whitespace-nowrap select-none">
              {word}
            </span>
          </div>
        ))}
      </motion.div>

      {/* 遮罩层：边缘渐变，让文字流仿佛从虚空中来 */}
      <div className="absolute inset-0 bg-radial-from-t from-transparent via-[#020202]/50 to-[#020202] z-10 pointer-events-none" />
      <div className="absolute inset-0 bg-linear-to-b from-[#020202] via-transparent to-[#020202] z-10" />
    </div>
  );
};

// ==============================================
// 4. 通用卡片组件 (LabSection)
// ==============================================
const LabSection = ({ title, sub, icon: Icon, href, colorClass, delay, variant = "standard" }: any) => {
  return (
    <Link href={href} className="flex-1 relative group rounded-[2.5rem] overflow-hidden border border-white/5 bg-[#0A0A0A] h-[75vh] min-w-[320px] transition-all duration-700 hover:border-white/20 hover:shadow-2xl hover:shadow-blue-500/10">

      {variant === "anime" && <DiagonalPosterGrid />}
      {variant === "cinema" && <CinemaReel />}
      {variant === "reading" && <TextStream />}

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay, duration: 0.8 }}
        className="h-full w-full p-10 flex flex-col justify-between relative z-20"
      >
        <div>
          <div className="flex justify-between items-start mb-12">
            <div className={`p-3 rounded-2xl bg-white/5 border border-white/10 transition-all duration-500 ${variant === 'cinema' ? 'group-hover:border-white/50 bg-black/20 backdrop-blur-md' : 'group-hover:bg-white/10 group-hover:border-white/30'}`}>
              <Icon size={22} className="text-gray-400 group-hover:text-white" />
            </div>
            <span className="text-[10px] font-mono tracking-[0.3em] text-gray-600 group-hover:text-gray-400 uppercase">
              Archive-0{Math.floor(delay * 10)}
            </span>
          </div>
          <h2 className="text-4xl font-bold tracking-tighter text-white/90 group-hover:text-white leading-tight drop-shadow-lg">
            {title.split(' / ')[0]}
            <span className="block text-lg font-light tracking-[0.2em] text-gray-500 mt-2 mix-blend-plus-lighter">
              {title.split(' / ')[1]}
            </span>
          </h2>
        </div>
        <div>
          <p className="text-sm text-gray-400 font-light leading-relaxed mb-8 group-hover:text-gray-200 transition-colors drop-shadow-md">
            {sub}
          </p>
          <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-white/5 border border-white/10 group-hover:bg-white/10 transition-all backdrop-blur-sm">
            <span className="text-[10px] font-mono tracking-widest uppercase">Enter Module</span>
            <ArrowUpRight size={14} />
          </div>
        </div>
      </motion.div>
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)] bg-size-[30px_30px] z-10"></div>
    </Link>
  );
};

// ==============================================
// 5. 主页面 (LabPortal)
// ==============================================
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
        <div className="hidden md:block text-[10px] font-mono text-gray-600 tracking-[0.4em] uppercase pb-2">
          Ready to Explore © 2026
        </div>
      </div>
      <main className="flex flex-col md:flex-row gap-6 w-full max-w-7xl">
        <LabSection
          title="动漫 / ANIME"
          sub="ACGN文化与审美研究，记录那些触动灵魂的瞬间。"
          icon={Tv}
          href="/anime"
          variant="anime"
          delay={0.1}
        />
        <LabSection
          title="电影 / CINEMA"
          sub="第七艺术的私人放映，关于光影、构图与叙事的记忆。"
          icon={Film}
          href="/cinema"
          variant="cinema"
          delay={0.2}
        />
        <LabSection
          title="读书 / READING"
          sub="思想的文字承载，在寂静中构建个人的精神乐园。"
          icon={BookOpen}
          href="/reading"
          variant="reading"
          delay={0.3}
        />
      </main>
      <footer className="mt-12 w-full max-w-7xl flex justify-between text-[10px] font-mono text-gray-700 tracking-widest uppercase">
        <div>Experimental UI v1.2</div>
        <div>Status: Standard Mode</div>
      </footer>
    </div>
  );
}