"use client";

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Tv, Film, BookOpen, ArrowUpRight } from 'lucide-react';

const LabSection = ({ title, sub, icon: Icon, href, colorClass, delay }: any) => {
  return (
    <Link href={href} className="flex-1 relative group rounded-4xl overflow-hidden border border-white/5 bg-[#0A0A0A] h-[70vh] min-w-[300px] transition-all duration-500 hover:border-white/20">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay, duration: 0.8 }}
        className="h-full w-full p-10 flex flex-col justify-between relative z-10"
      >
        <div>
          <div className="flex justify-between items-start mb-12">
            <div className="p-3 rounded-2xl bg-white/5 border border-white/10 group-hover:border-white/30 transition-colors">
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
          <p className="text-sm text-gray-500 font-light leading-relaxed mb-8 group-hover:text-gray-300 transition-colors">
            {sub}
          </p>
          <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-white/5 border border-white/10 group-hover:bg-white/10 transition-all">
            <span className="text-[10px] font-mono tracking-widest uppercase">Enter Module</span>
            <ArrowUpRight size={14} />
          </div>
        </div>
      </motion.div>
      <div className={`absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-700 bg-linear-to-b ${colorClass}`} />
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)] bg-size-[30px_30px]"></div>
    </Link>
  );
};

export default function LabPortal() {
  return (
    <div className="min-h-screen bg-[#020202] text-white flex flex-col items-center justify-center p-8 overflow-hidden">
      <div className="w-full max-w-7xl mb-12 flex justify-between items-end">
        <div>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 mb-4">
            <span className="h-px w-6 bg-blue-500"></span>
            <span className="text-[10px] font-mono tracking-[0.3em] text-blue-500 uppercase">System Active</span>
          </motion.div>
          <h1 className="text-6xl md:text-7xl font-bold italic tracking-tighter">
            Private <span className="text-gray-700">Lab.</span>
          </h1>
        </div>
        <div className="hidden md:block text-[10px] font-mono text-gray-600 tracking-[0.4em] uppercase pb-2">
          Interests Archive / 2026
        </div>
      </div>
      <main className="flex flex-col md:flex-row gap-6 w-full max-w-7xl">
        <LabSection title="动漫 / ANIME" sub="ACGN文化与审美研究，记录那些触动灵魂的瞬间。" icon={Tv} href="/anime" colorClass="from-blue-500/50 to-transparent" delay={0.1} />
        <LabSection title="电影 / CINEMA" sub="第七艺术的私人放映，关于光影、构图与叙事的记忆。" icon={Film} href="/cinema" colorClass="from-purple-500/50 to-transparent" delay={0.2} />
        <LabSection title="读书 / READING" sub="思想的文字承载，在寂静中构建个人的精神乐园。" icon={BookOpen} href="/reading" colorClass="from-amber-500/50 to-transparent" delay={0.3} />
      </main>
      <footer className="mt-12 w-full max-w-7xl flex justify-between text-[10px] font-mono text-gray-700 tracking-widest uppercase">
        <div>Experimental UI v1.2</div>
        <div>Status: Standard Mode</div>
      </footer>
    </div>
  );
}