"use client";

import React from 'react';
import { motion } from 'framer-motion';

export default function AvatarProfile() {
    return (
        <div className="absolute left-10 md:left-25 top-[2%] z-30 flex flex-col items-center">
            <motion.div className="relative w-32 h-32 md:w-65 md:h-45 cursor-pointer group" whileHover={{ scale: 1.05 }} transition={{ duration: 0.4 }}>
                <div className="absolute -inset-0.5 bg-linear-to-tr from-blue-200 to-purple-200 rounded-xl blur-sm opacity-0 group-hover:opacity-100 transition-all duration-500" />
                <div className="absolute inset-0 bg-white rounded-xl border border-slate-200 shadow-xl overflow-hidden ring-1 ring-slate-100">
                    <div className="relative w-full h-full bg-slate-100">
                        <img src="images/kei_asai.png" alt="Avatar" className="w-full h-full object-cover transition-all duration-700 filter grayscale contrast-125 group-hover:grayscale-0 group-hover:contrast-100" />
                        <div className="absolute inset-0 bg-blue-500/10 mix-blend-overlay transition-opacity duration-700 group-hover:opacity-0" />
                    </div>
                    <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_50%,rgba(0,0,0,0.05)_50%)] bg-size-[100%_4px] pointer-events-none z-20 opacity-50" />
                    <div className="absolute top-2 left-2 w-1 h-1 bg-white rounded-full z-40 shadow-sm" />
                    <div className="absolute top-2 right-2 w-1 h-1 bg-white rounded-full z-40 shadow-sm" />
                </div>
                <div className="absolute left-[105%] top-2 flex flex-col gap-3 pointer-events-none whitespace-nowrap">
                    <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400/40 group-hover:text-slate-800 transition-colors duration-500">
                        <div className="w-1 h-3 bg-blue-500/20" />
                        <span className="tracking-[0.3em] uppercase">From</span>
                    </div>
                    <div className="flex flex-col text-[14px] font-medium text-slate-400/30 group-hover:text-blue-800 transition-colors duration-700 leading-relaxed">
                        <span className="tracking-widest [writing-mode:vertical-lr]">重启咲良田</span>
                        <div className="h-4 w-px bg-slate-200 my-1 ml-1.5" />
                        <span className="tracking-widest [writing-mode:vertical-lr]">浅井惠</span>
                    </div>
                </div>
            </motion.div>
            <div className="h-10 w-px bg-linear-to-b from-slate-300 to-transparent mt-4" />
        </div>
    );
}
