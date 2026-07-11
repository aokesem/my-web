"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import type { HubCategoryType } from "../types";
import { CATEGORY_CONFIG, type Category } from "../../daily-protocol/types";

export function SectionBlock({
    title,
    count,
    isOpen,
    onToggle,
    children,
}: {
    title: string;
    count?: number;
    isOpen: boolean;
    onToggle: () => void;
    children: React.ReactNode;
}) {
    return (
        <section>
            <button
                type="button"
                onClick={onToggle}
                className="group mb-4 flex w-full items-center gap-3 rounded-lg -mx-2 px-2 py-1.5 text-left transition-colors hover:bg-white/45"
            >
                <ChevronDown
                    size={15}
                    className={`shrink-0 text-slate-400 transition-transform duration-200 ${isOpen ? "rotate-0" : "-rotate-90"}`}
                />
                <h2 className="text-sm font-bold text-slate-700 tracking-wide shrink-0">
                    {title}
                </h2>
                {typeof count === "number" && (
                    <span className="rounded-full border border-stone-200/80 bg-white/70 px-2 py-0.5 text-[10px] font-mono font-bold text-slate-400">
                        {count}
                    </span>
                )}
                <div className="flex-1 h-px bg-linear-to-r from-stone-300 via-stone-200 to-transparent transition-opacity group-hover:opacity-80" />
            </button>
            <AnimatePresence initial={false}>
                {isOpen && (
                    <motion.div
                        key="section-content"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2, ease: "easeInOut" }}
                        className="overflow-hidden"
                    >
                        {children}
                    </motion.div>
                )}
            </AnimatePresence>
        </section>
    );
}

export function TaskGroupBlock({
    title,
    count,
    isOpen,
    onToggle,
    children,
}: {
    title: string;
    count: number;
    isOpen: boolean;
    onToggle: () => void;
    children: React.ReactNode;
}) {
    return (
        <div className="mt-4 first:mt-0">
            <button
                type="button"
                onClick={onToggle}
                className="group mb-2 flex w-full items-center gap-2 rounded-md px-1.5 py-1 text-left transition-colors hover:bg-white/55"
            >
                <ChevronDown
                    size={13}
                    className={`shrink-0 text-slate-400 transition-transform duration-200 ${isOpen ? "rotate-0" : "-rotate-90"}`}
                />
                <h3 className="text-[11px] font-bold text-slate-500 tracking-wide">
                    {title}
                </h3>
                <span className="rounded-full bg-stone-100/80 px-1.5 py-0.5 text-[9px] font-mono font-bold text-slate-400">
                    {count}
                </span>
                <div className="h-px flex-1 bg-stone-200/70 opacity-0 transition-opacity group-hover:opacity-100" />
            </button>
            <AnimatePresence initial={false}>
                {isOpen && (
                    <motion.div
                        key="task-group-content"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.18, ease: "easeInOut" }}
                        className="overflow-hidden"
                    >
                        {children}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export function categoryTagStyles(type: HubCategoryType) {
    if (type === "study") {
        return "bg-blue-500/10 text-blue-600 border-blue-500/20";
    }
    return "bg-amber-500/10 text-amber-700 border-amber-500/20";
}

export function CategoryTag({ type }: { type: HubCategoryType }) {
    return (
        <span
            className={`text-[10px] font-mono uppercase shrink-0 px-1.5 py-0.5 rounded border ${categoryTagStyles(type)}`}
        >
            {type}
        </span>
    );
}

export function taskCategoryConfig(category: string) {
    if (category in CATEGORY_CONFIG) {
        return CATEGORY_CONFIG[category as Category];
    }
    return null;
}
