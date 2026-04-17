import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

interface AccordionGroupProps {
    title: string;
    count: number;
    defaultOpen?: boolean;
    children: React.ReactNode;
}

export function AccordionGroup({ title, count, defaultOpen = false, children }: AccordionGroupProps) {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <div className="flex flex-col gap-2">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center justify-between w-full group py-1"
            >
                <div className="flex items-center gap-1.5">
                    <ChevronDown size={14} className={`text-stone-400 transition-transform duration-200 ${isOpen ? '' : '-rotate-90'}`} />
                    <span className="text-sm font-bold text-stone-600 group-hover:text-stone-900 transition-colors">
                        {title}
                    </span>
                </div>
                <span className="text-[10px] font-mono text-stone-300">
                    {count}
                </span>
            </button>

            <AnimatePresence initial={false}>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                    >
                        <div className="flex flex-col gap-2 pl-2">
                            {children}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
