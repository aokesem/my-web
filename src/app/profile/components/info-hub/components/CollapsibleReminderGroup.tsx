"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";

export function CollapsibleReminderGroup({
    title,
    count,
    icon: IconComponent,
    themeClass,
    children,
}: {
    title: string;
    count: number;
    icon: React.ComponentType<{ size?: number; className?: string }>;
    themeClass: {
        row: string;
        icon: string;
    };
    children: React.ReactNode;
}) {
    const [isExpanded, setIsExpanded] = useState(true);

    if (count === 0) return null;

    return (
        <li className="rounded-lg border border-stone-200/90 bg-white shadow-sm overflow-hidden flex flex-col">
            <div
                onClick={() => setIsExpanded(!isExpanded)}
                className={`flex cursor-pointer items-center justify-between gap-3 px-3 py-2.5 hover:bg-slate-50 transition-colors ${themeClass.row}`}
            >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${themeClass.icon}`}>
                        <IconComponent size={15} />
                    </div>
                    <span className="flex-1 min-w-0">
                        <span className="block text-sm font-semibold text-slate-800 truncate">
                            {title}
                        </span>
                        <span className="text-[10px] font-mono mt-0.5 block text-slate-500">
                            {count} 项待处理
                        </span>
                    </span>
                </div>
                <ChevronDown 
                    size={16} 
                    className={`text-slate-400 transition-transform duration-200 shrink-0 ${isExpanded ? 'rotate-180' : ''}`} 
                />
            </div>

            <AnimatePresence initial={false}>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2, ease: "easeInOut" }}
                        className="overflow-hidden border-t border-stone-200/50 bg-stone-50/80 shadow-[inset_0_2px_5px_rgba(0,0,0,0.03)]"
                    >
                        <div className="p-3.5">
                            {children}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </li>
    );
}
