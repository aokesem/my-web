import React from 'react';
import { motion } from 'framer-motion';

interface ModuleProps {
    module: {
        id: string;
        title: string;
        description: string;
    };
}

export default function BentoCard({ module }: ModuleProps) {
    return (
        <div className="relative group-hover:-translate-y-2 transition-transform duration-500 ease-out h-[360px]">
            <div className="absolute inset-0 bg-[#fdfbf7] rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.03)] group-hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)] transition-all duration-500 border border-[#ece8df] overflow-hidden flex flex-row">

                {/* Left Side: Text and Asanoha Pattern */}
                <div className="relative w-1/2 h-full flex flex-col justify-between p-8 z-20">
                    <div className="absolute inset-0 opacity-[0.02] pointer-events-none"
                        style={{
                            backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M20 0l20 34.64-20-11.55L0 34.64 20 0zm0 17.32l10 17.32H10l10-17.32z' fill='%23000' fill-rule='evenodd'/%3E%3C/svg%3E")`,
                            backgroundSize: '30px 30px'
                        }}
                    />
                    <div className="relative z-10 w-full">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-2.5 h-2.5 bg-[#cdb07c] rotate-45 flex items-center justify-center shadow-sm">
                                <div className="w-1 h-1 bg-[#fdfbf7] rotate-45" />
                            </div>
                            <span className="text-[10px] font-mono font-bold text-stone-400 uppercase tracking-[0.2em]">{module.id}_protocol</span>
                        </div>
                        <h2 className="text-3xl font-serif text-stone-700 tracking-wide font-medium mt-6"
                            style={{ textShadow: '1px 1px 1px rgba(255,255,255,0.9), -1px -1px 1px rgba(0,0,0,0.06)' }}
                        >
                            {module.title}
                        </h2>
                        <p className="mt-4 text-sm text-stone-500 font-sans leading-relaxed">
                            {module.description}
                        </p>
                    </div>

                    <div className="relative z-10 grid grid-cols-2 gap-4 border-t border-stone-200/60 pt-6">
                        <div className="flex flex-col">
                            <span className="text-[10px] uppercase font-mono text-stone-400 mb-1 tracking-wider">Storage</span>
                            <span className="text-sm font-bold text-[#cdb07c]">Database</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] uppercase font-mono text-stone-400 mb-1 tracking-wider">State</span>
                            <span className="text-sm font-bold text-stone-600 flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-emerald-400" /> Active
                            </span>
                        </div>
                    </div>
                </div>

                {/* Right Side: Hinoki Wooden Box Base */}
                <div className="relative w-1/2 h-full bg-[#f7eedf] shadow-[inset_4px_0_15px_rgba(0,0,0,0.03)] border-l border-[#e8dac5]">
                    {/* Wood grain SVG texture */}
                    <div className="absolute inset-0 opacity-[0.3]"
                        style={{
                            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='wood'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.01 0.5' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23wood)' opacity='0.5'/%3E%3C/svg%3E")`
                        }}
                    />
                    {/* Inner Box Shadow / Depth */}
                    <div className="absolute inset-4 shadow-[inset_0_4px_15px_rgba(180,140,100,0.2),0_1px_0_rgba(255,255,255,0.8)] border border-[#d6c3a6] rounded-xl overflow-hidden bg-[#e8dac5]/20">

                        {/* Grid layout for Bento partitions */}
                        <div className="absolute inset-2 grid grid-cols-2 grid-rows-2 gap-2">

                            {/* Top Left: Salmon Sashimi Slices */}
                            <div className="bg-[#e8dac5]/40 rounded-lg shadow-[inset_0_1px_4px_rgba(0,0,0,0.02)] border border-[#d6c3a6]/30 flex flex-col items-center justify-center p-2 relative overflow-hidden">
                                {['rotate-[-5deg]', 'rotate-0', 'rotate-[6deg]'].map((rot, i) => (
                                    <motion.div key={i} className={`w-[85%] h-6 bg-linear-to-b from-[#ff8c75] to-[#ff5b42] rounded-md shadow-[0_2px_5px_rgba(0,0,0,0.15)] absolute transform ${rot}`}
                                        style={{ top: `${20 + i * 22}%`, zIndex: i }}
                                        initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 + i * 0.1, duration: 0.6, ease: "easeOut" }}
                                    >
                                        <div className="flex w-full h-full justify-evenly items-center opacity-60">
                                            {[...Array(4)].map((_, j) => (
                                                <div key={j} className="w-px h-full bg-white/90 rotate-12" />
                                            ))}
                                        </div>
                                    </motion.div>
                                ))}
                            </div>

                            {/* Top Right: Matcha Daifuku */}
                            <div className="bg-[#e8dac5]/40 rounded-lg shadow-[inset_0_1px_4px_rgba(0,0,0,0.02)] border border-[#d6c3a6]/30 flex items-center justify-center gap-1.5 relative overflow-hidden">
                                <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: 0.5, duration: 0.6 }} className="absolute top-[30%] -rotate-45 w-[90%] h-1 bg-[#d2b48c] rounded-full z-0 shadow-sm" />
                                {[...Array(2)].map((_, i) => (
                                    <motion.div key={i} className="w-10 h-10 bg-linear-to-tr from-[#88b04b] to-[#a3c966] rounded-full shadow-[inset_-2px_-2px_6px_rgba(0,0,0,0.15),0_3px_5px_rgba(0,0,0,0.1)] relative z-10"
                                        initial={{ y: 15, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 + i * 0.1, duration: 0.5, type: "spring" }}
                                    >
                                        <div className="absolute top-1 left-1.5 w-3 h-2 bg-white/40 rounded-full blur-[1px] -rotate-12" />
                                    </motion.div>
                                ))}
                            </div>

                            {/* Bottom: Onigiri on Sasa Leaf */}
                            <div className="col-span-2 bg-[#e8dac5]/40 rounded-lg shadow-[inset_0_1px_4px_rgba(0,0,0,0.02)] border border-[#d6c3a6]/30 flex items-end justify-center pb-3 gap-5 relative overflow-hidden">
                                <motion.svg initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.2, duration: 0.8 }} className="absolute w-[140%] h-[150%] text-[#7a9e35]/40 drop-shadow-sm -left-[20%] -top-[20%]" viewBox="0 0 100 100">
                                    <path d="M0 50 Q50 -10 100 50 Q60 90 0 50" fill="currentColor" />
                                    <path d="M0 50 Q50 30 100 50" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="0.5" />
                                </motion.svg>

                                {/* Onigiri 1 */}
                                <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.6, type: "spring", bounce: 0.4 }} className="relative w-24 h-24 flex items-end justify-center z-10 drop-shadow-[0_4px_6px_rgba(0,0,0,0.12)]">
                                    <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100">
                                        <path d="M50 8 C75 8, 95 40, 90 82 C85 98, 15 98, 10 82 C5 40, 25 8, 50 8" fill="#fdfcfb" />
                                        <path d="M50 8 C75 8, 95 40, 90 82 C85 98, 15 98, 10 82 C5 40, 25 8, 50 8" fill="none" stroke="rgba(0,0,0,0.04)" strokeWidth="4" />
                                        <g fill="rgba(0,0,0,0.025)">
                                            <rect x="30" y="25" width="8" height="3" rx="1.5" transform="rotate(45 30 25)" />
                                            <rect x="60" y="30" width="7" height="3" rx="1.5" transform="rotate(-30 60 30)" />
                                            <rect x="20" y="55" width="9" height="3" rx="1.5" transform="rotate(15 20 55)" />
                                            <rect x="75" y="60" width="8" height="3.5" rx="1.5" transform="rotate(-60 75 60)" />
                                            <rect x="45" y="20" width="7" height="3" rx="1.5" transform="rotate(-15 45 20)" />
                                            <rect x="80" y="45" width="9" height="3.5" rx="1.5" transform="rotate(-80 80 45)" />
                                            <rect x="22" y="70" width="7" height="3" rx="1.5" transform="rotate(40 22 70)" />
                                            <rect x="78" y="75" width="8" height="3" rx="1.5" transform="rotate(-20 78 75)" />
                                        </g>
                                    </svg>
                                    <div className="absolute bottom-[2px] w-[36px] h-12 bg-[#536441] rounded-t-lg shadow-[inset_0_2px_4px_rgba(255,255,255,0.08),0_-1px_3px_rgba(0,0,0,0.15)]" />
                                </motion.div>

                                {/* Onigiri 2 */}
                                <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.7, type: "spring", bounce: 0.4 }} className="relative w-24 h-24 flex items-end justify-center z-10 drop-shadow-[0_4px_6px_rgba(0,0,0,0.12)]">
                                    <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100">
                                        <path d="M50 8 C75 8, 95 40, 90 82 C85 98, 15 98, 10 82 C5 40, 25 8, 50 8" fill="#fdfcfb" />
                                        <path d="M50 8 C75 8, 95 40, 90 82 C85 98, 15 98, 10 82 C5 40, 25 8, 50 8" fill="none" stroke="rgba(0,0,0,0.04)" strokeWidth="4" />
                                        <g fill="rgba(0,0,0,0.025)">
                                            <rect x="32" y="25" width="8" height="3" rx="1.5" transform="rotate(-25 32 25)" />
                                            <rect x="62" y="32" width="7" height="3" rx="1.5" transform="rotate(40 62 32)" />
                                            <rect x="22" y="52" width="9" height="3" rx="1.5" transform="rotate(-15 22 52)" />
                                            <rect x="72" y="58" width="8" height="3.5" rx="1.5" transform="rotate(60 72 58)" />
                                            <rect x="48" y="22" width="7" height="3" rx="1.5" transform="rotate(15 48 22)" />
                                            <rect x="80" y="40" width="9" height="3.5" rx="1.5" transform="rotate(80 80 40)" />
                                            <rect x="25" y="70" width="7" height="3" rx="1.5" transform="rotate(-40 25 70)" />
                                            <rect x="75" y="75" width="8" height="3" rx="1.5" transform="rotate(20 75 75)" />
                                        </g>
                                    </svg>
                                    <div className="absolute bottom-[2px] w-[36px] h-12 bg-[#536441] rounded-t-lg shadow-[inset_0_2px_4px_rgba(255,255,255,0.08),0_-1px_3px_rgba(0,0,0,0.15)]" />
                                </motion.div>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
