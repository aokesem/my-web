import React from 'react';
import { Star, ChevronLeft, ChevronRight } from 'lucide-react';

// --- 评分星星 ---
export const RatingStars = ({ rating, size = 14 }: { rating: number; size?: number }) => (
    <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map(i => {
            const full = i <= Math.floor(rating);
            const half = !full && i - 0.5 <= rating;

            if (full) {
                return <Star key={i} size={size} className="fill-amber-400 text-amber-400" />;
            }
            if (half) {
                return (
                    <div key={i} className="relative" style={{ width: size, height: size }}>
                        <Star size={size} className="text-stone-300 absolute inset-0" />
                        <div className="absolute inset-0 overflow-hidden" style={{ width: size / 2 }}>
                            <Star size={size} className="fill-amber-400 text-amber-400" />
                        </div>
                    </div>
                );
            }
            return <Star key={i} size={size} className="text-stone-300" />;
        })}
    </div>
);

// --- 过滤胶囊 ---
export const FilterPill = ({ label, active, icon: Icon, onClick }: { label: string; active: boolean; icon?: React.ElementType; onClick: () => void }) => (
    <button
        onClick={onClick}
        className={`flex items-center gap-1.5 px-4 py-1.5 rounded-md text-sm font-medium transition-all duration-300 border ${active
            ? 'bg-stone-700 text-white border-stone-700 shadow-sm'
            : 'bg-white/60 text-stone-500 border-stone-200 hover:bg-stone-100 hover:text-stone-700'
            }`}
    >
        {Icon && <Icon size={14} className={active ? 'opacity-100' : 'opacity-60'} />}
        {label}
    </button>
);

// --- 分页组件 ---
export const Pagination = ({ page, totalPages, onPageChange }: { page: number; totalPages: number; onPageChange: (p: number) => void }) => {
    if (totalPages <= 1) return null;
    return (
        <div className="flex items-center justify-center gap-5 py-3 shrink-0">
            <button
                onClick={() => onPageChange(page - 1)}
                disabled={page === 0}
                className="p-1.5 rounded-lg border border-stone-200 text-stone-400 hover:text-stone-700 hover:bg-stone-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
                <ChevronLeft size={16} />
            </button>
            <span className="text-base font-mono text-stone-500 tabular-nums">
                {page + 1} / {totalPages}
            </span>
            <button
                onClick={() => onPageChange(page + 1)}
                disabled={page >= totalPages - 1}
                className="p-1.5 rounded-lg border border-stone-200 text-stone-400 hover:text-stone-700 hover:bg-stone-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
                <ChevronRight size={16} />
            </button>
        </div>
    );
};
