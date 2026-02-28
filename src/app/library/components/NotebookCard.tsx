import React from 'react';
import { motion } from 'framer-motion';
import { PenTool, BookOpen, ArrowRight } from 'lucide-react';

interface ModuleProps {
    module: {
        id: string;
        title: string;
        description: string;
    };
}

export default function NotebookCard({ module }: ModuleProps) {
    return (
        <div className="relative group-hover:-translate-y-2 transition-transform duration-500 ease-out h-full">
            {/* Paper base with subtle texture */}
            <div className="absolute inset-0 bg-white rounded-tr-3xl rounded-bl-3xl rounded-tl-sm rounded-br-sm shadow-[0_2px_4px_rgba(0,0,0,0.05),0_10px_20px_rgba(0,0,0,0.05)] group-hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)] transition-all duration-500 border border-stone-100" />

            {/* Paper fiber texture */}
            <div className="absolute inset-0 rounded-tr-3xl rounded-bl-3xl rounded-tl-sm rounded-br-sm opacity-[0.06] pointer-events-none"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100' height='100' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`,
                    backgroundSize: '150px 150px'
                }}
            />

            {/* Bookmark / Fold corner */}
            <div className="absolute top-0 right-8 w-8 h-10 z-30 overflow-hidden">
                <div className="w-full h-full bg-orange-400/80 group-hover:bg-orange-500 transition-colors duration-300"
                    style={{ clipPath: 'polygon(0 0, 100% 0, 100% 70%, 50% 100%, 0 70%)' }} />
            </div>

            {/* Red binding line */}
            <div className="absolute top-0 bottom-0 left-6 w-[2px] bg-red-100/50 z-10" />

            <div className="relative p-10 h-[360px] flex flex-col justify-between overflow-hidden z-20">
                <div className="flex justify-between items-start pl-4">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <PenTool size={16} className="text-orange-500" />
                            <span className="text-xs font-bold text-stone-400 uppercase tracking-wider">Note_01</span>
                        </div>
                        <h2 className="text-3xl font-serif font-medium text-stone-800 group-hover:text-orange-600 transition-colors">
                            {module.title}
                        </h2>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-stone-50 flex items-center justify-center text-stone-300 group-hover:bg-orange-50 group-hover:text-orange-500 transition-colors">
                        <BookOpen size={20} />
                    </div>
                </div>

                {/* Notebook ruled lines */}
                <div className="pl-4 flex-1 mt-8 relative">
                    <div className="w-full h-px bg-stone-100 mb-4" />
                    <div className="space-y-3 opacity-60">
                        <motion.div className="w-3/4 h-2 bg-stone-100 rounded-full"
                            initial={{ scaleX: 0, originX: 0 }} animate={{ scaleX: 1 }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                        />
                        <motion.div className="w-full h-2 bg-stone-100 rounded-full"
                            initial={{ scaleX: 0, originX: 0 }} animate={{ scaleX: 1 }}
                            transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
                        />
                        <motion.div className="w-5/6 h-2 bg-stone-100 rounded-full"
                            initial={{ scaleX: 0, originX: 0 }} animate={{ scaleX: 1 }}
                            transition={{ duration: 0.9, ease: "easeOut", delay: 0.4 }}
                        />
                    </div>
                    <div className="mt-10">
                        <p className="text-sm text-stone-500 font-medium leading-relaxed">
                            {module.description}
                        </p>
                    </div>
                </div>

                <div className="pl-4 pt-6 flex items-center gap-3 text-xs font-mono text-stone-400 group-hover:text-stone-600 transition-colors">
                    <span className="underline decoration-stone-200 underline-offset-4 group-hover:decoration-orange-300 transition-all">
                        OPEN NOTEBOOK
                    </span>
                    <span className="translate-x-0 group-hover:translate-x-1 transition-transform duration-300">
                        <ArrowRight size={12} />
                    </span>
                </div>
            </div>
        </div>
    );
}
