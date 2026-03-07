import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { LayoutGrid, SortAsc } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import Image from 'next/image';
import { Food, Category } from '../types';
import { useAutoPageSize } from '../hooks/useDietData';
import { FilterPill, RatingStars, Pagination } from './DietCommon';

export const FoodsTab = ({
    foods,
    categories,
    jumpTargetFoodId,
    onClearJump
}: {
    foods: Food[],
    categories: Category[],
    jumpTargetFoodId?: number | null,
    onClearJump?: () => void
}) => {
    const [activeCategory, setActiveCategory] = useState('全部');
    const [sortBy, setSortBy] = useState<'name' | 'rating'>('name');
    const [page, setPage] = useState(0);
    const gridRef = useRef<HTMLDivElement>(null);

    // 2列，横向卡片约 280px 高
    const itemsPerPage = useAutoPageSize(gridRef, 280, 2, 4);

    // 监听跳转请求，自动定位页码
    useEffect(() => {
        if (jumpTargetFoodId && itemsPerPage > 0) {
            setActiveCategory('全部');
            setSortBy('name');
            const sorted = [...foods].sort((a, b) => a.name.localeCompare(b.name, 'zh'));
            const index = sorted.findIndex(f => f.id === jumpTargetFoodId);
            if (index !== -1) {
                setPage(Math.floor(index / itemsPerPage));
            }
            // 2.5秒后清除高亮状态
            const timer = setTimeout(() => {
                if (onClearJump) onClearJump();
            }, 2500);
            return () => clearTimeout(timer);
        }
    }, [jumpTargetFoodId, itemsPerPage, onClearJump, foods]);

    const filtered = foods
        .filter(f => activeCategory === '全部' || f.category === activeCategory)
        .sort((a, b) => sortBy === 'rating' ? b.rating - a.rating : a.name.localeCompare(b.name, 'zh'));

    const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
    const safePage = Math.min(page, totalPages - 1);
    const pageItems = filtered.slice(safePage * itemsPerPage, (safePage + 1) * itemsPerPage);

    const handleCategoryChange = useCallback((cat: string) => {
        setActiveCategory(cat);
        setPage(0);
    }, []);

    const dynamicCategories = [
        { id: '全部', label: '全部', icon: LayoutGrid },
        ...categories.map(c => ({
            id: c.name,
            label: c.name,
            icon: c.icon ? (LucideIcons as any)[c.icon] : undefined
        }))
    ];

    return (
        <div className="h-full flex flex-col">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4 shrink-0">
                <div className="flex flex-wrap gap-2">
                    {dynamicCategories.map(cat => (
                        <FilterPill key={cat.id} label={cat.label} icon={cat.icon} active={activeCategory === cat.id} onClick={() => handleCategoryChange(cat.id)} />
                    ))}
                </div>
                <button
                    onClick={() => setSortBy(prev => prev === 'name' ? 'rating' : 'name')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-stone-500 hover:text-stone-700 hover:bg-stone-100 transition-colors border border-stone-200 bg-white"
                >
                    <SortAsc size={14} />
                    {sortBy === 'name' ? '按名称' : '按评分'}
                </button>
            </div>

            <div ref={gridRef} className="flex-1 overflow-hidden">
                <motion.div
                    key={safePage}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.25 }}
                    className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full content-start"
                >
                    {pageItems.map(food => (
                        <div key={food.id} className="group">
                            <div className={`bg-white rounded-2xl border ${jumpTargetFoodId === food.id ? 'border-amber-400 ring-4 ring-amber-400/20' : 'border-stone-200/80'} overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] transition-all duration-400 flex items-stretch h-[270px]`}>
                                <div className="relative w-[250px] shrink-0 overflow-hidden bg-stone-100">
                                    <Image
                                        src={food.image}
                                        alt={food.name}
                                        fill
                                        sizes="250px"
                                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                                    />
                                    <div className="absolute top-3 left-2 px-2 py-0.5 rounded-md bg-white/80 backdrop-blur-sm text-[13px] font-bold text-stone-600 tracking-wide flex items-center gap-1">
                                        {(() => {
                                            const cat = dynamicCategories.find(c => c.label === food.category);
                                            const Icon = cat?.icon;
                                            return Icon ? <Icon size={14} className="opacity-70" /> : <LayoutGrid size={14} className="opacity-70" />;
                                        })()}
                                        {food.category}
                                    </div>
                                </div>
                                <div className="flex-1 p-4 flex flex-col overflow-hidden">
                                    <div className="flex items-center justify-between mb-2 shrink-0">
                                        <h3 className="font-serif font-bold text-stone-800 text-base">{food.name}</h3>
                                        <RatingStars rating={food.rating} size={12} />
                                    </div>
                                    <div className="border-t border-dashed border-stone-200 pt-2 flex-1 overflow-y-auto no-scrollbar">
                                        <div className="text-xs text-stone-600 leading-relaxed whitespace-pre-line">
                                            {food.notes.replace(/\\n/g, '\n').replace(/### /g, '').replace(/- /g, '· ')}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </motion.div>
            </div>

            <Pagination page={safePage} totalPages={totalPages} onPageChange={setPage} />
        </div>
    );
};
