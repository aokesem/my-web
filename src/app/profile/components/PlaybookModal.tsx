"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

// --- MOCK DATA ---
type TaskStatus = 'todo' | 'in-progress' | 'done';

interface TaskNode {
    id: string;
    title: string;
    description?: string;
    status: TaskStatus;
    children?: TaskNode[];
}

const MOCK_FOREST: TaskNode[] = [
    {
        id: "root-1",
        title: "个人网站重构与上线",
        status: "in-progress",
        children: [
            {
                id: "sub-1-1",
                title: "完成 Playbook 模块",
                status: "in-progress",
                children: [
                    { id: "sub-1-1-1", title: "设计展开态 UI", status: "done" },
                    { id: "sub-1-1-2", title: "实现任务森林连线", status: "in-progress" },
                ]
            },
            {
                id: "sub-1-2",
                title: "后端 Supabase 对接",
                status: "todo",
            }
        ]
    },
    {
        id: "root-2",
        title: "年度阅读计划",
        status: "todo",
        children: [
            { id: "sub-2-1", title: "阅读《设计心理学》", status: "todo" },
            { id: "sub-2-2", title: "深入学习 React 源码", status: "todo" }
        ]
    }
];

// --- RENDER HELPERS ---
const StatusIndicator = ({ status }: { status: TaskStatus }) => {
    switch (status) {
        case 'done':
            return <div className="w-2 h-2 rounded-full bg-[#7A8B76]" title="Done" />;
        case 'in-progress':
            return <div className="w-2 h-2 rounded-full border-2 border-[#7A8B76] bg-transparent" title="In Progress" />;
        case 'todo':
        default:
            return <div className="w-2 h-2 rounded-full bg-slate-200" title="To Do" />;
    }
};

const TreeNode = ({ node, isRoot = false }: { node: TaskNode, isRoot?: boolean }) => {
    const hasChildren = node.children && node.children.length > 0;

    return (
        <div className="flex flex-col items-center">
            {/* The Node Card */}
            <div className={`
                relative z-10 flex flex-col justify-center items-center text-center p-3 sm:p-4 
                ${isRoot ? 'w-56 min-h-20 border-2 border-[#7A8B76]/50 bg-[#F9F7F1]' : 'w-44 min-h-16 border border-[#7A8B76]/30 bg-white/50 backdrop-blur-sm'} 
                rounded-md shadow-sm group hover:border-[#7A8B76]/80 transition-colors cursor-pointer max-w-full
            `}>
                <div className="absolute top-2 right-2">
                    <StatusIndicator status={node.status} />
                </div>
                <span className={`font-serif text-[#2c3e50] w-full wrap-break-word whitespace-pre-wrap ${isRoot ? 'text-sm font-bold tracking-wide' : 'text-xs'}`}>
                    {node.title}
                </span>
                {node.description && (
                    <span className="text-[10px] text-slate-400 mt-2 font-mono truncate w-full">{node.description}</span>
                )}
            </div>

            {/* Recursively render children if they exist */}
            {hasChildren && (
                <div className="flex flex-col items-center -mt-px">
                    {/* Vertical line down from parent */}
                    <svg width="2" height="24" className="text-[#7A8B76]/40 z-0">
                        <line x1="1" y1="0" x2="1" y2="24" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" />
                    </svg>

                    {/* Horizontal connecting line for siblings (if more than 1 child) */}
                    {node.children!.length > 1 && (
                        <div className="w-full flex justify-center relative h-[2px] bg-[#5C7A8A]/40 z-0"
                            style={{
                                width: `calc(100% - ${100 / node.children!.length}%)`
                            }}
                        />
                    )}

                    {/* Children Container */}
                    <div className="flex gap-8 items-start pt-6 relative">
                        {/* If multiple children, draw the little vertical stubs down to them */}
                        {node.children!.length > 1 && node.children!.map((child, idx) => (
                            <svg key={`stub-${child.id}`} width="2" height="24" className="absolute top-0 text-[#7A8B76]/40 z-0"
                                style={{
                                    left: `calc(${(idx + 0.5) * (100 / node.children!.length)}%)`,
                                    transform: 'translateX(-50%)'
                                }}>
                                <line x1="1" y1="0" x2="1" y2="24" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" />
                            </svg>
                        ))}

                        {/* If single child, the main vertical line just continues */}
                        {node.children!.length === 1 && (
                            <svg width="2" height="24" className="absolute top-0 left-1/2 -translate-x-1/2 text-[#7A8B76]/40 z-0">
                                <line x1="1" y1="0" x2="1" y2="24" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" />
                            </svg>
                        )}

                        {node.children!.map(child => (
                            <div key={child.id} className="flex-1 flex justify-center relative">
                                <TreeNode node={child} />
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

interface PlaybookModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function PlaybookModal({ isOpen, onClose }: PlaybookModalProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Prevent body scrolling when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
        }
        return () => {
            document.body.style.overflow = "unset";
        };
    }, [isOpen]);

    if (!mounted) return null;

    const modalContent = (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-100 flex items-center justify-center pointer-events-auto">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.4 }}
                        className="absolute inset-0 bg-black/40 backdrop-blur-md"
                        onClick={(e) => {
                            e.stopPropagation();
                            onClose();
                        }}
                    />

                    {/* Book Container */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="relative w-[90vw] max-w-7xl h-[85vh] bg-[#fdfbf7] rounded-sm shadow-2xl overflow-hidden flex"
                        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.7' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E")` }}
                        onClick={(e) => e.stopPropagation()} // Prevent bubbling to backdrop
                    >
                        {/* Close Button */}
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onClose();
                            }}
                            className="absolute top-4 right-4 z-50 p-2 text-slate-400 hover:text-slate-800 transition-colors rounded-full hover:bg-black/5"
                        >
                            <X size={24} />
                        </button>

                        {/* Central Spine (Book Fold) */}
                        <div className="absolute left-1/2 top-0 bottom-0 w-12 -translate-x-1/2 bg-linear-to-r from-transparent via-black/10 to-transparent shadow-[inset_0_0_15px_rgba(0,0,0,0.1)] pointer-events-none z-10" />

                        {/* Left Page: Reflection Notes */}
                        <div className="flex-1 border-r border-slate-200/50 p-12 md:p-16 relative overflow-y-auto subtle-scrollbar">
                            <div className="max-w-prose mx-auto">
                                <div className="mb-10 inline-block w-full max-w-sm">
                                    <h1 className="text-4xl font-serif text-slate-800 mb-4 tracking-wide">
                                        Manifesto
                                    </h1>
                                    <div className="h-[2px] bg-linear-to-r from-[#6B3A3A]/60 to-transparent w-full"></div>
                                </div>
                                <div className="space-y-6 text-slate-600 font-serif leading-relaxed text-lg text-justify">
                                    <p>
                                        This is the beginning of the reflection space. A place to gather scattered thoughts before meticulously organizing them into actionable tasks.
                                    </p>
                                    <p>
                                        In the quiet solitude of this room, absolute clarity emerges. The texture and typography here values quiet introspection over noisy notifications.
                                    </p>
                                    <p>
                                        Here, we outline the fundamental principles that govern our actions. We strip away the unnecessary and focus only on what truly matters. This left page exists as an anchor—a set of philosophical guidelines to keep the "Task Forest" on the right grounded in reality and purpose.
                                    </p>
                                </div>
                                <div className="mt-16 text-right opacity-80 italic text-[#6B3A3A]/70 font-serif">
                                    <p>"Focus on the essential."</p>
                                </div>
                            </div>
                        </div>

                        {/* Right Page: Task Forest Blueprint */}
                        <div className="flex-1 bg-[#F9F7F1]/80 p-8 md:p-12 relative overflow-y-auto subtle-scrollbar">
                            <div className="min-h-full w-full flex flex-col items-center">
                                {/* Decorator Header */}
                                <div className="w-full border-b border-[#7A8B76]/20 pb-2 mb-12 flex justify-between items-end opacity-60">
                                    <span className="font-mono text-xs tracking-widest text-[#7A8B76]">PRIORITY_FOREST_V1</span>
                                    <span className="font-mono text-[10px] text-[#7A8B76]">SYSTEM.PLANNING</span>
                                </div>

                                {/* Render the forest (multiple roots) */}
                                <div className="flex flex-col gap-24 items-center w-full">
                                    {MOCK_FOREST.map(rootNode => (
                                        <TreeNode key={rootNode.id} node={rootNode} isRoot={true} />
                                    ))}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );

    return createPortal(modalContent, document.body);
}
