import React from 'react';
import { motion } from 'framer-motion';
import { Sprout } from 'lucide-react';

interface ModuleProps {
    module: {
        id: string;
        title: string;
        description: string;
    };
}

export default function GardenCard({ module }: ModuleProps) {
    return (
        <div className="relative group-hover:-translate-y-2 transition-transform duration-500 ease-out h-full overflow-hidden">
            {/* Base with increased border width for structure */}
            <div className="absolute inset-0 bg-[#F0FAF4] rounded-2xl border-2 border-[#E0F2E9] shadow-[0_4px_12px_rgba(20,100,60,0.03)] group-hover:shadow-[0_20px_40px_rgba(20,100,60,0.08)] group-hover:border-teal-100/80 transition-all duration-500" />

            {/* Structure: Corner Brackets (The "Frame") */}
            <div className="absolute top-3 left-3 w-8 h-8 border-t-2 border-l-2 border-teal-200/40 rounded-tl-lg" />
            <div className="absolute top-3 right-3 w-8 h-8 border-t-2 border-r-2 border-teal-200/40 rounded-tr-lg" />
            <div className="absolute bottom-3 left-3 w-8 h-8 border-b-2 border-l-2 border-teal-200/40 rounded-bl-lg" />
            <div className="absolute bottom-3 right-3 w-8 h-8 border-b-2 border-r-2 border-teal-200/40 rounded-br-lg" />

            {/* Organic Background Texture */}
            <div className="absolute inset-0 opacity-[0.3]"
                style={{
                    backgroundImage: `radial-gradient(#10B981 0.5px, transparent 0.5px)`,
                    backgroundSize: '30px 30px'
                }}
            />

            {/* Data Layer: Environmental Stats */}
            <div className="absolute top-6 right-6 flex flex-col items-end gap-1 z-10 pointer-events-none">
                <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-[pulse_4s_ease-in-out_infinite]"></span>
                    <span className="text-[10px] font-mono text-teal-600/70 font-bold tracking-widest">LIVE_MONITOR</span>
                </div>
                <span className="text-[9px] font-mono text-teal-600/50">CYCLE: DAY 042</span>
            </div>

            <div className="absolute bottom-6 right-6 flex flex-col items-end gap-0.5 z-10 pointer-events-none text-[9px] font-mono text-teal-600/40">
                <span>HUMIDITY: 65%</span>
                <span>LIGHT: 1200lm</span>
                <span>CO2: 450ppm</span>
            </div>

            {/* Growing Vines Animation */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <svg className="absolute bottom-0 left-0 w-full h-full text-teal-200/50" viewBox="0 0 400 300" preserveAspectRatio="none">
                    <motion.path
                        d="M0,300 Q100,250 50,200 T150,100 T250,50"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        className="group-hover:text-teal-400/30 transition-colors duration-700"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 1.2, ease: "easeInOut" }}
                    />
                    <motion.path
                        d="M400,300 Q300,200 350,150 T200,100"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        className="group-hover:text-teal-300/30 transition-colors duration-700 delay-100"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 1.5, ease: "easeInOut", delay: 0.2 }}
                    />
                </svg>
            </div>

            {/* Scan Line Animation */}
            <motion.div
                className="absolute left-0 w-full h-px bg-linear-to-r from-transparent via-teal-300/20 to-transparent z-10 pointer-events-none"
                animate={{ top: ['0%', '100%'] }}
                transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
            />

            <div className="relative p-10 h-[360px] flex flex-col z-20">
                <div className="flex justify-between items-start">
                    <div className="flex flex-col">
                        <span className="text-[10px] font-mono font-bold text-teal-600/60 uppercase tracking-widest mb-2 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse"></span>
                            Syntropic Growth
                        </span>
                        <h2 className="text-3xl font-serif font-medium text-stone-800 group-hover:text-teal-700 transition-colors">
                            {module.title}
                        </h2>
                    </div>
                </div>

                <div className="flex-1 flex items-center justify-center relative">
                    {/* Centerpiece: Glowing Seed in Petri Dish with Drop-down Entrance */}
                    <motion.div 
                        initial={{ y: -60, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ 
                            type: "spring", 
                            stiffness: 40,   // 降低张力，使其起始不那么突兀
                            damping: 25,     // 显著增加阻尼，消除震荡感，使其缓缓归位
                            mass: 2,         // 增加质量，模拟物理抗性和重量感
                            restDelta: 0.001 
                        }}
                        className="relative w-32 h-32 flex items-center justify-center"
                    >
                        {/* Outer Glow */}
                        <div className="absolute inset-0 bg-teal-400/20 blur-3xl rounded-full group-hover:bg-teal-400/30 transition-[background-color,filter] duration-700" />

                        {/* Subtle Breathing Ripple */}
                        <motion.div
                            className="absolute inset-0 rounded-full border border-teal-200/30"
                            animate={{ scale: [1, 1.15, 1], opacity: [0, 0.4, 0] }}
                            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                        />

                        {/* Glass/Petri Dish Circle - INCREASED OPACITY to prevent greenish bleed and snap */}
                        <div className="absolute inset-2 rounded-full bg-linear-to-b from-white/90 to-white/60 border border-white/50 backdrop-blur-md shadow-[0_8px_32px_rgba(20,184,166,0.15)] group-hover:border-teal-200/60 transition-[border-color,shadow] duration-500 flex items-center justify-center">
                            {/* Inner Ring */}
                            <div className="absolute inset-1 rounded-full border border-teal-100/30" />
                        </div>

                        {/* Sprout with Growth Animation */}
                        <motion.div
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ 
                                delay: 1.1, // 略微提前，在归位稳定前一点点开始爆发，衔接更自然
                                type: "spring", 
                                stiffness: 200, 
                                damping: 15 
                            }}
                            className="relative z-10"
                        >
                            <motion.div
                                animate={{ y: [0, -4, 0] }}
                                transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                            >
                                <Sprout size={48} className="text-teal-600/80 fill-teal-50 group-hover:text-teal-600 group-hover:fill-teal-100 transition-colors duration-500 drop-shadow-sm" strokeWidth={1.5} />
                            </motion.div>
                        </motion.div>
                    </motion.div>
                </div>

                <div className="pt-4 border-t border-teal-100/50">
                    <p className="text-sm text-stone-500/80 font-medium leading-relaxed group-hover:text-stone-600 transition-colors">
                        {module.description}
                    </p>
                </div>
            </div>
        </div>
    );
}
