"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { Tv, Film, BookOpen, ArrowUpRight, LucideIcon } from 'lucide-react';

// ==============================================
// 0. 常量与工具函数定义 (优化点：数据分离与逻辑复用)
// ==============================================

// 动漫海报数据
const ANIME_IMAGES = [
  "/images/anime_poster/败犬女主.png", "/images/anime_poster/冰菓.png", "/images/anime_poster/冰海战记.png",
  "/images/anime_poster/芙莉莲.png", "/images/anime_poster/钢炼fa.png", "/images/anime_poster/高达0080.png",
  "/images/anime_poster/化物语.png", "/images/anime_poster/欢迎加入nhk.png", "/images/anime_poster/辉夜第三季.png",
  "/images/anime_poster/寄生兽.png", "/images/anime_poster/巨人第三季part2.png", "/images/anime_poster/来自新世界.png",
  "/images/anime_poster/凉宫春日的消失.png", "/images/anime_poster/琉璃的宝石.png", "/images/anime_poster/鲁鲁修.png",
  "/images/anime_poster/迷宫饭.png", "/images/anime_poster/命运石之门.png", "/images/anime_poster/末日后酒店.png",
  "/images/anime_poster/女高日常.png", "/images/anime_poster/千年女优.png", "/images/anime_poster/轻音少女第二季.png",
  "/images/anime_poster/小魔女学院.png", "/images/anime_poster/小樱.png", "/images/anime_poster/咲良田.png",
  "/images/anime_poster/悠哉日常大王.png", "/images/anime_poster/月色真美.png", "/images/anime_poster/mygo.png"
];

// 电影剧照数据
const MOVIE_STILLS = [
  "/images/film_poster/地狱的眼睛.png", "/images/film_poster/怀抱孩子的竹千代.png", "/images/film_poster/埋藏黄金的墓地.png",
  "/images/film_poster/面朝阳光.png", "/images/film_poster/狮子云.png", "/images/film_poster/是你们武士.png",
  "/images/film_poster/天国与地狱.png", "/images/film_poster/夕阳.png", "/images/film_poster/Micheal的沉思.png",
  "/images/film_poster/tuco的笑.png",
];

// 读书组件 - 背景文字雨数据
const RAIN_WORDS = [
  "春琦，重启吧", "于是，魔女敲响了爱人的窗", "髣髴兮若轻云之蔽月，飘飖兮若流风之回雪",
  "寄蜉蝣于天地，渺沧海之一粟", "有善始者实繁，能克终者盖寡", "虽复尘埋无所用，犹能夜夜气冲天",
  "悟已往之不谏，知来者之可追", "究天人之际，通古今之变，成一家之言", "念谁为之戕贼，亦何恨乎秋声",
  "重重碎锦，片片真花。纷披草树，散乱烟霞", "伤心桥下春波绿，曾是惊鸿照影来",
  "把吴钩看了，栏杆拍遍，无人会，登临意",
];

// 【新增】读书组件 - 核心书单展示数据
const READING_LIST = [
  { title: "I Think, Therefore I Am", author: "René Descartes" },
  { title: "The Old Man and the Sea", author: "Ernest Hemingway" },
  { title: "The Moon and Sixpence", author: "Somerset Maugham" },
  { title: "Moby Dick", author: "Herman Melville" },
  { title: "Crime and Punishment", author: "Fyodor Dostoevsky" },
  { title: "Brave New World", author: "Aldous Huxley" },
];

// 【优化点：提取通用的 Fisher-Yates 洗牌算法】
function shuffleArray<T>(array: T[]): T[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

// ==============================================
// 1. 动漫组件：斜向流动的海报墙
// ==============================================
const DiagonalPosterGrid = () => {
  const [shuffledImages, setShuffledImages] = useState<string[]>([]);

  useEffect(() => {
    // 使用通用的洗牌函数
    const shuffled = shuffleArray(ANIME_IMAGES);
    setShuffledImages([...shuffled, ...shuffled]); // 双倍列表实现无缝
  }, []);

  if (shuffledImages.length === 0) return null;

  return (
    <div className="absolute inset-0 overflow-hidden opacity-65 pointer-events-none group-hover:opacity-95 transition-opacity duration-700">
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
        {shuffledImages.map((src: string, i: number) => (
          <div
            key={i}
            className="relative aspect-[2/3] w-full border-[0.5px] border-white/5 overflow-hidden bg-[#0A0A0A]"
          >
            <img
              src={src}
              loading="lazy"
              className="w-full h-full object-cover scale-105 transition-all duration-500"
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
// 2. 电影组件：呼吸感幻灯片
// ==============================================
const CinemaReel = () => {
  const [shuffledStills, setShuffledStills] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    // 使用通用的洗牌函数
    setShuffledStills(shuffleArray(MOVIE_STILLS));
  }, []);

  useEffect(() => {
    if (shuffledStills.length === 0) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % shuffledStills.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [shuffledStills]);

  if (shuffledStills.length === 0) return null;

  return (
    <div className="absolute inset-0 overflow-hidden bg-black opacity-50 group-hover:opacity-100 transition-opacity duration-700">
      <AnimatePresence mode="popLayout">
        <motion.img
          key={currentIndex}
          src={shuffledStills[currentIndex]}
          alt="Cinema Still"
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 0.7, scale: 1.2 }}
          exit={{ opacity: 0 }}
          transition={{
            opacity: { duration: 1.5, ease: "easeInOut" },
            scale: { duration: 6, ease: "linear" }
          }}
          className="absolute inset-0 w-full h-full object-cover opacity-80"
        />
      </AnimatePresence>
      <div className="absolute inset-0 opacity-[0.08] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')] brightness-100 contrast-150 mix-blend-overlay"></div>
      <div className="absolute inset-0 bg-linear-to-t from-[#020202] via-[#020202]/40 to-transparent z-10" />
    </div>
  );
};

// ==============================================
// 3. 读书组件：流动的文字雨 + 核心排版 (重构核心)
// ==============================================

// 3.1 单个文字雨列组件 (保持原样，效果很好)
const TextColumn = ({ colIndex, isHovered, requestToken, releaseToken }: {
  colIndex: number; isHovered: boolean; requestToken: () => boolean; releaseToken: () => void;
}) => {
  const [mounted, setMounted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [wordIndex, setWordIndex] = useState(0);
  const [animConfig, setAnimConfig] = useState({ duration: 15, initialY: "-20%" });

  useEffect(() => {
    setMounted(true);
    setWordIndex(Math.floor(Math.random() * RAIN_WORDS.length));
    const randomStartLine = (Math.random() * 120 - 20) + "%";
    setAnimConfig(prev => ({ ...prev, initialY: randomStartLine }));
  }, []);

  const tryStart = useCallback(() => {
    if (!isPlaying && requestToken()) {
      const currentWord = RAIN_WORDS[wordIndex];
      const newDuration = 3 + currentWord.length * 1.2;
      setAnimConfig({ duration: newDuration, initialY: "-20%" });
      setIsPlaying(true);
    }
  }, [isPlaying, wordIndex, requestToken]);

  useEffect(() => {
    if (mounted && !isPlaying) {
      const timer = setTimeout(tryStart, Math.random() * 2500 + 500);
      return () => clearTimeout(timer);
    }
  }, [mounted, isPlaying, tryStart]);

  const handleComplete = () => {
    setIsPlaying(false);
    releaseToken();
    setWordIndex((prev) => (prev + 1) % RAIN_WORDS.length);
  };

  if (!mounted) return <div className="w-12 h-full" />;

  return (
    <div className="relative h-full flex justify-center w-12">
      <AnimatePresence>
        {isPlaying && (
          <motion.span
            key={wordIndex}
            initial={{ y: animConfig.initialY, opacity: 0 }}
            animate={{ y: "120%", opacity: [0, 1, 1, 0] }}
            exit={{ opacity: 0 }}
            transition={{
              duration: isHovered ? animConfig.duration * 1.8 : animConfig.duration,
              ease: "linear",
            }}
            onAnimationComplete={handleComplete}
            className="absolute text-base md:text-lg font-serif italic tracking-[0.4em] text-white/40 group-hover:text-white/80 [writing-mode:vertical-rl] whitespace-nowrap select-none transition-colors duration-1000"
            style={{ textShadow: isHovered ? "0 0 8px rgba(255,255,255,0.4)" : "none" }}
          >
            {RAIN_WORDS[wordIndex]}
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
};

// 【新增】3.2 核心书名展示组件 (实现图中的排版风格)
const BookHero = () => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    // 每 6 秒切换一次书名
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % READING_LIST.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const currentBook = READING_LIST[index];

  return (
    // z-index 设置为 20，确保在文字雨和遮罩层之上
    <div className="absolute inset-0 flex flex-col items-center justify-center z-20 pointer-events-none select-none px-8">
      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          // 添加模糊(blur)和缩放(scale)的过渡效果，增加质感
          initial={{ opacity: 0, scale: 0.98, filter: "blur(8px)" }}
          animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
          exit={{ opacity: 0, scale: 1.02, filter: "blur(8px)" }}
          transition={{ duration: 0.8, ease: [0.33, 1, 0.68, 1] }} // 使用平滑的贝塞尔曲线
          className="text-center"
        >
          {/* 书名：复刻图中那种巨大的、紧凑的、全大写的粗体风格 */}
          <h2 className="text-4xl lg:text-5xl xl:text-6xl font-black tracking-tighter text-white leading-[0.9] uppercase drop-shadow-2xl">
            {currentBook.title}
          </h2>
          {/* 作者：使用衬线斜体，拉大间距，形成鲜明对比 */}
          <p className="mt-6 text-sm md:text-base font-serif italic text-white/60 tracking-[0.3em]">
            — {currentBook.author} —
          </p>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};


// 3.3 整合后的 TextStream 主组件
const TextStream = ({ isHovered }: { isHovered: boolean }) => {
  const totalCols = 6;
  const [activeCount, setActiveCount] = useState(0);

  const requestToken = useCallback(() => {
    if (activeCount < 3) {
      setActiveCount(prev => prev + 1);
      return true;
    }
    return false;
  }, [activeCount]);

  const releaseToken = useCallback(() => {
    setActiveCount(prev => Math.max(0, prev - 1));
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden bg-[#020202]">
      {/* 图层1：背景文字雨层 */}
      {/* 【关键点】保留了您要求的透明度设置：平时20%，悬停90% */}
      <div className={`absolute inset-0 flex justify-around h-full w-full px-4 py-16 transition-opacity duration-1000 ${isHovered ? 'opacity-90' : 'opacity-20'
        }`}>
        {Array.from({ length: totalCols }).map((_, i) => (
          <TextColumn
            key={i}
            colIndex={i}
            isHovered={isHovered}
            requestToken={requestToken}
            releaseToken={releaseToken}
          />
        ))}
      </div>

      {/* 图层2：视觉修饰层 - 中心暗角遮罩 */}
      {/* 使用径向渐变，让四周变暗，从而突出中心的 BookHero 文字 */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_10%,#020202_85%)] z-10 opacity-80 pointer-events-none" />
      {/* 原有的上下遮罩 */}
      <div className="absolute inset-0 bg-linear-to-b from-[#020202] via-transparent to-[#020202] z-10 pointer-events-none" />

      {/* 图层3：核心排版层 (在最上方 z-20) */}
      <BookHero />
    </div>
  );
};

// ==============================================
// 4. 通用卡片组件 (LabSection)
// ==============================================

// 【优化点：定义 Props 类型接口】
interface LabSectionProps {
  title: string;
  sub: string;
  icon: LucideIcon;
  href: string;
  delay: number;
  variant?: 'anime' | 'cinema' | 'reading';
}

const LabSection = ({ title, sub, icon: Icon, href, delay, variant = "anime" }: LabSectionProps) => {
  const [isHovered, setIsHovered] = React.useState(false);

  const themeColors = {
    anime: { text: "text-pink-400", border: "border-pink-500/40", glow: "shadow-pink-500/20", subText: "text-pink-400/80" },
    cinema: { text: "text-amber-400", border: "border-amber-500/40", glow: "shadow-amber-500/20", subText: "text-amber-400/80" },
    reading: { text: "text-blue-400", border: "border-blue-500/40", glow: "shadow-blue-500/20", subText: "text-blue-400/80" }
  }[variant] || { text: "text-white", border: "border-white/20", glow: "", subText: "text-gray-400" };

  return (
    <Link
      href={href}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      // 【调整】移除 min-w-[320px]，在小屏幕上允许卡片变窄以适应布局
      className={`flex-1 relative group rounded-[2.5rem] overflow-hidden border border-white/5 bg-[#0A0A0A] h-[75vh] transition-all duration-700 hover:border-white/20 hover:shadow-2xl ${isHovered ? themeColors.glow : ''}`}
    >
      {variant === "anime" && <DiagonalPosterGrid />}
      {variant === "cinema" && <CinemaReel />}
      {variant === "reading" && <TextStream isHovered={isHovered} />}

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay, duration: 0.8 }}
        className="h-full w-full p-10 flex flex-col justify-between relative z-30 pointer-events-none"
      >
        <div className="pointer-events-auto">
          <div className="flex justify-between items-start mb-12">
            <div className={`p-3 rounded-2xl bg-white/5 border border-white/10 transition-all duration-500 ${isHovered ? `bg-black/20 backdrop-blur-md border-white/30` : ''}`}>
              <Icon size={22} className={`transition-colors duration-500 ${isHovered ? themeColors.text : 'text-gray-400'}`} />
            </div>
            <span className="text-[10px] font-mono tracking-[0.3em] text-gray-600 group-hover:text-gray-400 uppercase">
              Archive-0{Math.floor(delay * 10)}
            </span>
          </div>
          <h2 className="text-4xl font-bold tracking-tighter text-white/90 group-hover:text-white leading-tight drop-shadow-lg">
            {title.split(' / ')[0]}
            <span className={`block text-lg font-light tracking-[0.2em] mt-2 mix-blend-plus-lighter transition-colors duration-700 ${isHovered ? themeColors.subText : 'text-gray-500'}`}>
              {title.split(' / ')[1]}
            </span>
          </h2>
        </div>

        <div className="pointer-events-auto">
          <p className="text-sm text-gray-400 font-light leading-relaxed mb-8 group-hover:text-gray-200 transition-colors drop-shadow-md">
            {sub}
          </p>
          <div className={`inline-flex items-center gap-3 px-6 py-3 rounded-full bg-white/5 border transition-all backdrop-blur-sm ${isHovered ? `${themeColors.border} ${themeColors.text}` : 'border-white/10'}`}>
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
      <main className="flex flex-col lg:flex-row gap-6 w-full max-w-7xl">
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
        <div>Experimental UI v1.3</div>
        <div>Status: Standard Mode</div>
      </footer>
    </div>
  );
}