"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

import { supabase } from "@/lib/supabaseClient";

interface TaskNode {
    id: string;
    title: string;
    parent_id?: string | null;
    sort_order?: number;
    children?: TaskNode[];
}

const TreeNode = ({ node, isRoot = false }: { node: TaskNode, isRoot?: boolean }) => {
    const hasChildren = node.children && node.children.length > 0;

    return (
        <div className="flex flex-col items-center">
            {/* The Node Card */}
            <div className={`
                relative z-10 flex flex-col justify-center items-center text-center p-3 sm:p-4 h-auto
                ${isRoot ? 'w-56 min-h-20 border-2 border-[#7A8B76]/50 bg-[#F9F7F1]' : 'w-44 min-h-16 border border-[#7A8B76]/30 bg-white/50 backdrop-blur-sm'} 
                rounded-md shadow-sm group hover:border-[#7A8B76]/80 transition-colors cursor-pointer max-w-full
            `}>
                <span className={`font-serif text-[#2c3e50] w-full wrap-break-word whitespace-pre-wrap ${isRoot ? 'text-lg font-bold tracking-wide' : 'text-sm'}`}>
                    {node.title}
                </span>
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
    const [currentTreeIndex, setCurrentTreeIndex] = useState(0);
    const [forest, setForest] = useState<TaskNode[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const fetchForest = async () => {
        setIsLoading(true);
        const { data, error } = await supabase
            .from('playbook_tasks')
            .select('*')
            .order('sort_order', { ascending: true });

        if (error) {
            console.error('Error fetching playbook_tasks:', error);
            setIsLoading(false);
            return;
        }

        if (data) {
            const taskMap = new Map<string, TaskNode>();
            const roots: TaskNode[] = [];

            // Build node map
            data.forEach((item: any) => {
                taskMap.set(item.id, { ...item, children: [] });
            });

            // Build tree
            data.forEach((item: any) => {
                const node = taskMap.get(item.id)!;
                if (item.parent_id) {
                    const parent = taskMap.get(item.parent_id);
                    if (parent) {
                        parent.children!.push(node);
                    }
                } else {
                    roots.push(node);
                }
            });

            setForest(roots);
        }
        setIsLoading(false);
    };

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

    // Manage resetting or fetching per open
    useEffect(() => {
        if (!isOpen) {
            setCurrentTreeIndex(0);
        } else {
            fetchForest();
        }
    }, [isOpen]);

    if (!mounted) return null;

    // currentTreeIndex now represents the *left* page index. It will advance by 1 to shift the spread.
    // Index 0: Manifesto (Left), Tree 1 (Right)
    // Index 1: Tree 1 (Left), Tree 2 (Right)
    const handlePrevPage = () => {
        setCurrentTreeIndex((prev: number) => Math.max(0, prev - 1));
    };

    const handleNextPage = () => {
        setCurrentTreeIndex((prev: number) => {
            const maxLeftIndex = Math.max(0, pages.length - 2);
            return Math.min(maxLeftIndex, prev + 1);
        });
    };

    // Combine Manifesto and forest into a single ordered "book pages" array
    // page 0 = manifesto
    // page 1..N = forest[0..N-1]
    const pages = ['manifesto', ...forest];
    const leftPageContent = pages[currentTreeIndex];
    const rightPageContent = pages[currentTreeIndex + 1];

    const isFirstSpread = currentTreeIndex === 0;
    const isLastSpread = currentTreeIndex >= pages.length - 2;

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

                        {/* Left Page (Index: currentTreeIndex) */}
                        <div className="flex-1 border-r border-slate-200/50 p-8 md:p-12 relative overflow-y-auto subtle-scrollbar flex flex-col">
                            {leftPageContent === 'manifesto' ? (
                                <div className="max-w-prose mx-auto mt-4 md:mt-8">
                                    <div className="mb-10 inline-block w-full max-w-sm">
                                        <h1 className="text-4xl font-serif text-slate-800 mb-4 tracking-wide">
                                            Manifesto
                                        </h1>
                                        <div className="h-[2px] bg-linear-to-r from-[#6B3A3A]/60 to-transparent w-full"></div>
                                    </div>
                                    <div className="space-y-6 text-slate-600 font-serif leading-relaxed text-[17px] text-justify">
                                        <p>
                                            This is the beginning of the reflection space. A place to gather scattered thoughts before meticulously organizing them into actionable tasks.
                                        </p>
                                        <p>
                                            In the quiet solitude of this room, absolute clarity emerges. The texture and typography here values quiet introspection over noisy notifications.
                                        </p>
                                        <p>
                                            Here, we outline the fundamental principles that govern our actions. We strip away the unnecessary and focus only on what truly matters.
                                        </p>
                                    </div>
                                    <div className="mt-16 text-right opacity-80 italic text-[#6B3A3A]/70 font-serif">
                                        <p>"Focus on the essential."</p>
                                    </div>
                                </div>
                            ) : leftPageContent ? (
                                <>
                                    <div className="w-full border-b border-[#7A8B76]/20 pb-4 mb-12 flex justify-between items-center px-4">
                                        <button
                                            onClick={handlePrevPage}
                                            disabled={isFirstSpread}
                                            className={`p-1 rounded-full transition-colors ${isFirstSpread ? 'opacity-0 cursor-default' : 'text-[#7A8B76]/60 hover:text-[#7A8B76] hover:bg-[#7A8B76]/10'}`}
                                        >
                                            <ChevronLeft size={20} />
                                        </button>
                                        <div className="flex flex-col items-center flex-1">
                                            <span className="font-serif font-bold text-[#2c3e50] tracking-wide mb-1 text-lg text-center leading-tight">
                                                {(leftPageContent as TaskNode).title}
                                            </span>
                                            <span className="font-mono text-[10px] tracking-widest text-[#7A8B76]">
                                                PAGE {currentTreeIndex}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex-1 flex flex-col items-center justify-center w-full min-h-0 relative">
                                        <AnimatePresence mode="wait">
                                            <motion.div
                                                key={(leftPageContent as TaskNode).id}
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: 10 }}
                                                transition={{ duration: 0.3 }}
                                                className="w-full flex justify-center pb-12"
                                            >
                                                <TreeNode node={leftPageContent as TaskNode} isRoot={true} />
                                            </motion.div>
                                        </AnimatePresence>
                                    </div>
                                </>
                            ) : null}
                        </div>

                        {/* Right Page (Index: currentTreeIndex + 1) */}
                        <div className="flex-1 bg-[#F9F7F1]/80 p-8 md:p-12 relative overflow-y-auto subtle-scrollbar flex flex-col">
                            {rightPageContent ? (
                                <>
                                    <div className="w-full border-b border-[#7A8B76]/20 pb-4 mb-12 flex justify-between items-center px-4">
                                        <div className="flex flex-col items-center flex-1 ml-8">
                                            <span className="font-serif font-bold text-[#2c3e50] tracking-wide mb-1 text-lg text-center leading-tight">
                                                {(rightPageContent as TaskNode).title}
                                            </span>
                                            <span className="font-mono text-[10px] tracking-widest text-[#7A8B76]">
                                                PAGE {currentTreeIndex + 1}
                                            </span>
                                        </div>
                                        <button
                                            onClick={handleNextPage}
                                            disabled={isLastSpread}
                                            className={`p-1 rounded-full transition-colors ml-4 ${isLastSpread ? 'opacity-0 cursor-default' : 'text-[#7A8B76]/60 hover:text-[#7A8B76] hover:bg-[#7A8B76]/10'}`}
                                        >
                                            <ChevronRight size={20} />
                                        </button>
                                    </div>
                                    <div className="flex-1 flex flex-col items-center justify-center w-full min-h-0 relative">
                                        {isLoading ? (
                                            <div className="text-[#7A8B76]/60 font-mono text-sm animate-pulse tracking-widest">
                                                FETCHING_BLUEPRINTS...
                                            </div>
                                        ) : (
                                            <AnimatePresence mode="wait">
                                                <motion.div
                                                    key={(rightPageContent as TaskNode).id}
                                                    initial={{ opacity: 0, x: 10 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    exit={{ opacity: 0, x: -10 }}
                                                    transition={{ duration: 0.3 }}
                                                    className="w-full flex justify-center pb-12"
                                                >
                                                    <TreeNode node={rightPageContent as TaskNode} isRoot={true} />
                                                </motion.div>
                                            </AnimatePresence>
                                        )}
                                    </div>
                                </>
                            ) : (
                                // Display an empty elegant page if there is no right page content
                                <div className="flex-1 flex flex-col items-center justify-center w-full h-full opacity-30 pointer-events-none">
                                    <div className="w-16 h-px bg-[#7A8B76]/40 mb-4" />
                                    <span className="font-serif italic text-sm text-[#7A8B76]">The end of current blueprints.</span>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );

    return createPortal(modalContent, document.body);
}
