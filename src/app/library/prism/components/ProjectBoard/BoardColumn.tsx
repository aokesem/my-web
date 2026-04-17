import React from 'react';

interface BoardColumnProps {
    title: string;
    icon: any;
    color: 'cyan' | 'amber' | 'emerald';
    count: number;
    action?: React.ReactNode;
    children: React.ReactNode;
}

export function BoardColumn({ title, icon: Icon, color, count, action, children }: BoardColumnProps) {
    const colorStyles = {
        cyan: 'bg-cyan-50 text-cyan-500 border-cyan-100',
        amber: 'bg-amber-50 text-amber-500 border-amber-100',
        emerald: 'bg-emerald-50 text-emerald-500 border-emerald-100',
    };

    return (
        <div className="flex-1 border-r border-stone-100 last:border-r-0 flex flex-col min-w-[260px]">
            <div className="shrink-0 p-4 border-b border-stone-100 flex items-center justify-between bg-white/50">
                <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-md border ${colorStyles[color]}`}>
                        <Icon size={14} />
                    </div>
                    <h3 className="text-base font-bold font-mono uppercase tracking-wider text-stone-800">
                        {title}
                    </h3>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold text-stone-400 bg-stone-100 px-1.5 py-0.5 rounded">
                        {count}
                    </span>
                    {action}
                </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-4 bg-stone-50/20">
                {children}
            </div>
        </div>
    );
}
