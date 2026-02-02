"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { Tv, Film, BookOpen, ArrowUpRight, LucideIcon, Lock, DoorOpen } from 'lucide-react';

// ... (0. 常量与工具函数定义 - 保持不变) ...
const ANIME_IMAGES = [
  "/images/anime_poster/败犬女主.png", "/images/anime_poster/冰菓.png", "/images/anime_poster/冰海战记.png",
  "/images/anime_poster/芙莉莲.png", "/images/anime_poster/钢炼fa.png", "/images/anime_poster/高达0080.png",
  "/images/anime_poster/化物语.png", "/images/anime_poster/高木第二季.png", "/images/anime_poster/欢迎加入nhk.png", "/images/anime_poster/辉夜第三季.png",
  "/images/anime_poster/寄生兽.png", "/images/anime_poster/少女歌剧.png", "/images/anime_poster/巨人第三季part2.png", "/images/anime_poster/来自新世界.png",
  "/images/anime_poster/凉宫春日的消失.png", "/images/anime_poster/琉璃的宝石.png", "/images/anime_poster/鲁鲁修.png",
  "/images/anime_poster/迷宫饭.png", "/images/anime_poster/女高中生的无所事事.png", "/images/anime_poster/命运石之门.png", "/images/anime_poster/赌博默示录.png", "/images/anime_poster/末日后酒店.png",
  "/images/anime_poster/女高日常.png", "/images/anime_poster/千年女优.png", "/images/anime_poster/轻音少女第二季.png", "/images/anime_poster/幸运星.png",
  "/images/anime_poster/小魔女学院.png", "/images/anime_poster/小樱.png", "/images/anime_poster/咲良田.png", "/images/anime_poster/斩服少女.png",
  "/images/anime_poster/悠哉日常大王.png", "/images/anime_poster/月色真美.png", "/images/anime_poster/mygo.png", "/images/anime_poster/EVA.png",
];
const MOVIE_STILLS = [
  "/images/film_poster/地狱的眼睛.png", "/images/film_poster/怀抱孩子的竹千代.png", "/images/film_poster/埋藏黄金的墓地.png",
  "/images/film_poster/面朝阳光.png", "/images/film_poster/狮子云.png", "/images/film_poster/是你们武士.png",
  "/images/film_poster/天国与地狱.png", "/images/film_poster/夕阳.png", "/images/film_poster/Micheal的沉思.png",
  "/images/film_poster/tuco的笑.png", "/images/film_poster/我很好.png", "/images/film_poster/追忆似水年华.png"
];
const RAIN_WORDS = [
  "春琦，重启吧", "于是，魔女敲响了爱人的窗", "髣髴兮若轻云之蔽月，飘飖兮若流风之回雪",
  "有善始者实繁，能克终者盖寡", "虽复尘埋无所用，犹能夜夜气冲天",
  "悟已往之不谏，知来者之可追", "究天人之际，通古今之变，成一家之言", "念谁为之戕贼，亦何恨乎秋声",
  "重重碎锦，片片真花。纷披草树，散乱烟霞", "伤心桥下春波绿，曾是惊鸿照影来",
  "把吴钩看了，栏杆拍遍，无人会，登临意", "推倒一世之智勇，开拓万古之心胸", "当时明月在，曾照彩云归",
  "鉴悬日月，词富山海。百龄影徂，千载心在", "花径不曾缘客扫，蓬门今始为君开", "暮春三月，江南草长。杂花生树，群莺乱飞",
  "有种活着的感觉", "因为我喜欢追寻着那个人的自己", "你选择的那个肯定才是正确答案", "不好，下雨了", "巴尼，已经不用再战斗了",
  "你将对名为绝望的希望微笑"
];
const READING_LIST = [
  { title: "重启咲良田", author: "河野 裕" },
  { title: "付丧堂古董店", author: " 御堂 彰彦" },
  { title: "地中海与菲利普二世时代的地中海世界", author: "Fernand Braudel" },
  { title: "蓝熊船长的十三条半命", author: "Walter Moers" },
  { title: "华丽人生", author: "伊坂 幸太郎" },
  { title: "枯树赋", author: "庾 信" },
];

function shuffleArray<T>(array: T[]): T[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

const MotionImage = motion(Image);

// ... (1. 动漫组件 DiagonalPosterGrid - 保持不变) ...
const DiagonalPosterGrid = () => {
  const [shuffledImages, setShuffledImages] = useState<string[]>([]);

  useEffect(() => {
    const shuffled = shuffleArray(ANIME_IMAGES);
    setShuffledImages([...shuffled, ...shuffled]);
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
            className="relative aspect-2/3 w-full border-[0.5px] border-white/5 overflow-hidden bg-[#0A0A0A]"
          >
            <Image
              src={src}
              alt={`Poster ${i}`}
              fill
              sizes="(max-width: 768px) 33vw, 20vw"
              className="object-cover scale-105 transition-all duration-500"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.opacity = '0';
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

// ... (2. 电影组件 CinemaReel - 保持不变) ...
const CinemaReel = () => {
  const [shuffledStills, setShuffledStills] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
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
    <>
      <style jsx>{`
          @keyframes film-grain {
            0%, 100% { background-position: 0 0; }
            10% { background-position: -5% -10%; }
            20% { background-position: -15% 5%; }
            30% { background-position: 7% -25%; }
            40% { background-position: -5% 25%; }
            50% { background-position: -15% 10%; }
            60% { background-position: 15% 0%; }
            70% { background-position: 0% 15%; }
            80% { background-position: 3% 35%; }
            90% { background-position: -10% 10%; }
          }
          @keyframes film-scratch {
            0%, 100% { transform: translateX(0); opacity: 0.3; }
            10% { transform: translateX(-2px); }
            20% { transform: translateX(1px); opacity: 0.5; }
            30% { transform: translateX(-3px); }
            40% { transform: translateX(2px); opacity: 0.2;}
            50% { transform: translateX(-1px); }
            60% { transform: translateX(3px); opacity: 0.4; }
            70% { transform: translateX(-2px); }
            80% { transform: translateX(1px); opacity: 0.6; }
            90% { transform: translateX(-3px); }
          }
          .animate-film-grain {
             animation: film-grain 0.6s steps(1) infinite;
             background-size: 150% 150%; 
          }
          .film-scratches {
              background-image: repeating-linear-gradient(
                to right,
                transparent 0px,
                transparent 100px,
                rgba(255, 255, 255, 0.1) 100px, 
                transparent 101px,
                transparent 240px,
                rgba(255, 255, 255, 0.08) 240px,
                transparent 242px
              );
              animation: film-scratch 0.4s steps(1) infinite;
          }
        `}</style>

      <div className="absolute inset-0 overflow-hidden bg-black opacity-50 group-hover:opacity-100 transition-opacity duration-700">
        <AnimatePresence mode="popLayout">
          <MotionImage
            key={currentIndex}
            src={shuffledStills[currentIndex]}
            alt="Cinema Still"
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            priority={true}
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 0.7, scale: 1.2 }}
            exit={{ opacity: 0 }}
            transition={{
              opacity: { duration: 1.5, ease: "easeInOut" },
              scale: { duration: 6, ease: "linear" }
            }}
            className="object-cover opacity-80"
          />
        </AnimatePresence>

        <div
          className="absolute inset-0 pointer-events-none mix-blend-overlay animate-film-grain opacity-40 z-10"
          style={{ backgroundImage: `url('https://grainy-gradients.vercel.app/noise.svg')` }}
        ></div>

        <div className="absolute inset-0 pointer-events-none film-scratches mix-blend-screen z-10"></div>

        <div className="absolute inset-0 bg-linear-to-t from-[#020202] via-[#020202]/40 to-transparent z-20" />
      </div>
    </>
  );
};

// ... (3. 读书组件 TextStream - 保持不变) ...
const TextColumn = ({ colIndex, isHovered, requestToken, releaseToken }: {
  colIndex: number; isHovered: boolean; requestToken: () => number | null; releaseToken: (index: number) => void;
}) => {
  const [mounted, setMounted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [wordIndex, setWordIndex] = useState<number | null>(null);
  const [animConfig, setAnimConfig] = useState({ duration: 15, initialY: "-20%" });
  const isFirstRun = React.useRef(true);

  useEffect(() => {
    setMounted(true);
  }, []);

  const tryStart = useCallback(() => {
    if (!isPlaying) {
      const index = requestToken();
      if (index !== null) {
        setWordIndex(index);
        const currentWord = RAIN_WORDS[index];
        const newDuration = 3 + currentWord.length * 1.2;
        setAnimConfig({ duration: newDuration, initialY: "-20%" });
        setIsPlaying(true);
      }
    }
  }, [isPlaying, requestToken]);

  useEffect(() => {
    if (mounted && !isPlaying) {
      const delay = isFirstRun.current
        ? Math.random() * 400 + 100 // 首次快速启动: 100-500ms
        : Math.random() * 2500 + 500; // 后续正常节奏

      const timer = setTimeout(() => {
        tryStart();
        if (isFirstRun.current) isFirstRun.current = false;
      }, delay);
      return () => clearTimeout(timer);
    }
  }, [mounted, isPlaying, tryStart]);

  const handleComplete = () => {
    if (wordIndex !== null) {
      releaseToken(wordIndex);
      setIsPlaying(false);
      setWordIndex(null);
    }
  };

  if (!mounted) return <div className="w-12 h-full" />;

  return (
    <div className="relative h-full flex justify-center w-12">
      <AnimatePresence>
        {isPlaying && wordIndex !== null && (
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
            {RAIN_WORDS[wordIndex!]}
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
};

const BookHero = ({ isHovered }: { isHovered: boolean }) => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % READING_LIST.length);
    }, 9000);
    return () => clearInterval(timer);
  }, []);

  const currentBook = READING_LIST[index];

  return (
    <div className={`absolute inset-0 flex flex-col items-center justify-center z-20 pointer-events-none select-none px-8 transition-all duration-1000 ${isHovered ? "opacity-90 translate-y-11" : "opacity-35 translate-y-11"
      }`}>
      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          initial={{ opacity: 0, scale: 0.98, filter: "blur(12px)" }}
          animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
          exit={{ opacity: 0, scale: 1.02, filter: "blur(12px)" }}
          transition={{ duration: 1.2, ease: [0.33, 1, 0.68, 1] }}
          className="text-center"
        >
          <h2 className="text-4xl lg:text-5xl xl:text-6xl font-black tracking-tighter text-white leading-[0.9] uppercase drop-shadow-2xl">
            {currentBook.title}
          </h2>
          <p className="mt-8 text-sm md:text-base font-serif italic text-white/60 tracking-[0.4em]">
            — {currentBook.author} —
          </p>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

const TextStream = ({ isHovered }: { isHovered: boolean }) => {
  const totalCols = 6;
  const [activeIndices, setActiveIndices] = useState<number[]>([]);

  const requestToken = useCallback(() => {
    if (activeIndices.length >= 3) return null;

    // 获取当前未被使用的索引池
    const availableIndices = RAIN_WORDS.map((_, i) => i)
      .filter(i => !activeIndices.includes(i));

    if (availableIndices.length === 0) return null;

    const pickedIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)];
    setActiveIndices(prev => [...prev, pickedIndex]);
    return pickedIndex;
  }, [activeIndices]);

  const releaseToken = useCallback((index: number) => {
    setActiveIndices(prev => prev.filter(i => i !== index));
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden bg-[#020202]">
      <div className={`absolute inset-0 flex justify-around h-full w-full px-4 py-16 transition-opacity duration-1000 ${isHovered ? 'opacity-80' : 'opacity-55'
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
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_10%,#020202_85%)] z-10 opacity-80 pointer-events-none" />
      <div className="absolute inset-0 bg-linear-to-b from-[#020202] via-transparent to-[#020202] z-10 pointer-events-none" />
      <BookHero isHovered={isHovered} />
    </div>
  );
};

// ... (4. 通用卡片组件 LabSection - 保持不变) ...
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

      <div className={`absolute inset-0 pointer-events-none bg-[linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)] bg-size-[30px_30px] z-10 
        ${variant === 'reading' ? 'opacity-[0.05]' : 'opacity-[0.03]'}`}></div>
    </Link>
  );
};

// ==============================================
// 5. 主页面 (LabPortal)
// ==============================================
export default function LabPortal() {
  return (
    <div className="min-h-screen bg-[#020202] text-white flex flex-col items-center justify-center p-8 overflow-hidden relative">
      <Link
        href="/admin"
        className="absolute top-8 right-8 z-50 flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-900/50 border border-zinc-800 text-zinc-400 hover:text-amber-500 hover:border-amber-500/50 hover:bg-zinc-900/80 transition-all duration-300 backdrop-blur-sm group"
      >
        <Lock size={14} className="group-hover:rotate-12 transition-transform" />
        <span className="text-xs font-mono tracking-wider uppercase">Admin</span>
      </Link>

      <div className="w-full max-w-7xl mb-12 flex justify-between items-end relative">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="h-px w-6 bg-blue-500" />
            <span className="text-[10px] font-mono tracking-[0.3em] text-blue-500 uppercase">System Active</span>
          </div>

          {/* New Entry Point Implementation */}
          <div className="flex items-baseline gap-6 group/title">
            <h1 className="text-6xl md:text-7xl font-bold italic tracking-tighter">
              Private <span className="text-gray-700">Lab.</span>
            </h1>

            {/* The Invisible Door - visible on group hover or subtle default */}
            <Link
              href="/profile"
              className="opacity-50 hover:opacity-100 transition-all duration-500 flex items-center gap-2 text-yellow-500 -translate-y-1 hover:translate-x-2"
            >
              <span className="hidden md:inline text-[18px] font-mono tracking-widest uppercase text-yellow-500/70 hover:text-yellow-400">[ My Room ]</span>
              <DoorOpen size={32} className="stroke-[1.5]" />
            </Link>
          </div>
        </div>

        <div
          className="absolute left-[72%] -translate-x-1/2 -bottom-4 flex items-center gap-8"
        >
          {/* Bilibili */}
          <a
            href="https://space.bilibili.com/244067577"
            target="_blank"
            rel="noopener noreferrer"
            className="group flex flex-col items-center gap-2"
          >
            <div className="relative p-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all duration-300 hover:scale-110">
              <svg className="w-6 h-6 text-white/50 group-hover:text-[#FB7299] transition-colors duration-300" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.813 4.653h.854c1.51.054 2.769.578 3.773 1.574 1.004.995 1.524 2.249 1.56 3.76v7.36c-.036 1.51-.556 2.769-1.56 3.773s-2.262 1.524-3.773 1.56H5.333c-1.51-.036-2.769-.556-3.773-1.56S.036 18.858 0 17.347v-7.36c.036-1.511.556-2.765 1.56-3.76 1.004-.996 2.262-1.52 3.773-1.574h.774l-1.174-1.12a1.234 1.234 0 0 1-.373-.906c0-.356.124-.658.373-.907l.027-.027c.267-.249.573-.373.92-.373.347 0 .653.124.92.373L9.653 4.44c.071.071.134.142.187.213h4.267a.836.836 0 0 1 .16-.213l2.853-2.747c.267-.249.573-.373.92-.373.347 0 .662.151.929.4.267.249.391.551.391.907 0 .355-.124.657-.373.906zM5.333 7.24c-.746.018-1.373.276-1.88.773-.506.498-.769 1.13-.786 1.894v7.52c.017.764.28 1.395.786 1.893.507.498 1.134.756 1.88.773h13.334c.746-.017 1.373-.275 1.88-.773.506-.498.769-1.129.786-1.893v-7.52c-.017-.765-.28-1.396-.786-1.894-.507-.497-1.134-.755-1.88-.773zM8 11.107c.373 0 .684.124.933.373.25.249.383.569.4.96v1.173c-.017.391-.15.711-.4.96-.249.25-.56.374-.933.374s-.684-.125-.933-.374c-.25-.249-.383-.569-.4-.96V12.44c.017-.391.15-.711.4-.96.249-.249.56-.373.933-.373zm8 0c.373 0 .684.124.933.373.25.249.383.569.4.96v1.173c-.017.391-.15.711-.4.96-.249.25-.56.374-.933.374s-.684-.125-.933-.374c-.25-.249-.383-.569-.4-.96V12.44c.017-.391.15-.711.4-.96.249-.249.56-.373.933-.373z" />
              </svg>
              <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-[0_0_20px_rgba(251,114,153,0.3)]" />
            </div>
            <span className="text-[10px] font-mono text-gray-500 group-hover:text-gray-300 transition-colors uppercase tracking-widest">Bilibili</span>
          </a>
          <a
            href="https://bgm.tv/user/614830"
            target="_blank"
            rel="noopener noreferrer"
            className="group flex flex-col items-center gap-2"
          >
            <div className="relative p-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all duration-300 hover:scale-110">
              <svg className="w-6 h-6 text-white/50 group-hover:text-[#F09199] transition-colors duration-300" viewBox="0 0 24 24" fill="currentColor">
                <path d="M4 4h7v7H4V4zm0 9h7v7H4v-7zm9-9h7v7h-7V4zm0 9h7v7h-7v-7z" style={{ fillRule: 'evenodd' }} />
              </svg>
              <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-[0_0_20px_rgba(240,145,153,0.3)]" />
            </div>
            <span className="text-[10px] font-mono text-gray-500 group-hover:text-gray-300 transition-colors uppercase tracking-widest">Bangumi</span>
          </a>
          <a
            href="https://letterboxd.com/phantomreset/films/by/entry-rating/"
            target="_blank"
            rel="noopener noreferrer"
            className="group flex flex-col items-center gap-2"
          >
            <div className="relative p-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all duration-300 hover:scale-110">
              <svg className="w-6 h-6 text-white/50 group-hover:text-[#FF8000] transition-colors duration-300" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 12a5 5 0 1 1 0-10 5 5 0 0 1 0 10Zm0 2a5 5 0 1 1 0 10 5 5 0 0 1 0-10ZM5.5 8a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5Zm13 0a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5Z" />
              </svg>
              <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-[0_0_20px_rgba(255,128,0,0.3)]" />
            </div>
            <span className="text-[10px] font-mono text-gray-500 group-hover:text-gray-300 transition-colors uppercase tracking-widest">Letterboxd</span>
          </a>
        </div>

        <div className="hidden md:block text-[10px] font-mono text-gray-600 tracking-[0.4em] uppercase pb-2">
          Ready to Explore © 2026
        </div>
      </div>
      <main className="flex flex-col lg:flex-row gap-6 w-full max-w-7xl">
        <LabSection
          title="动漫 / ANIME"
          sub="那些想象力与演出的美好回忆"
          icon={Tv}
          href="/anime"
          variant="anime"
          delay={0.1}
        />
        <LabSection
          title="电影 / CINEMA"
          sub="关于光影、构图与叙事的流转"
          icon={Film}
          href="/cinema"
          variant="cinema"
          delay={0.2}
        />
        <LabSection
          title="读书 / READING"
          sub="最华美的词句和最深邃的思考"
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