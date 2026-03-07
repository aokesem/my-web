import React, { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { LayoutGrid, SortAsc, Store, CookingPot } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import Image from 'next/image';
import { Food, Recipe, Restaurant, Category } from '../types';
import { useAutoPageSize } from '../hooks/useDietData';
import { FilterPill, RatingStars, Pagination } from './DietCommon';

export const RecipesTab = ({
    foods,
    recipes,
    restaurants,
    categories,
    onJumpToFood,
    jumpTargetRecipeId,
    onClearJump,
    onJumpToRestaurant
}: {
    foods: Food[];
    recipes: Recipe[];
    restaurants: Restaurant[];
    categories: Category[];
    onJumpToFood?: (id: number) => void;
    jumpTargetRecipeId?: number | null;
    onClearJump?: () => void;
    onJumpToRestaurant?: (id: number) => void;
}) => {
    const [activeCategory, setActiveCategory] = useState('全部');
    const [activeType, setActiveType] = useState<'all' | 'can_cook' | 'favorite'>('all');
    const [sortBy, setSortBy] = useState<'name' | 'rating'>('name');
    const [page, setPage] = useState(0);
    const gridRef = useRef<HTMLDivElement>(null);

    // 3列，每个卡片约 360px 高
    const itemsPerPage = useAutoPageSize(gridRef, 370, 3, 6);

    const filtered = recipes
        .filter(r => activeCategory === '全部' || r.category === activeCategory)
        .filter(r => activeType === 'all' || r.type === activeType)
        .sort((a, b) => sortBy === 'rating' ? b.rating - a.rating : a.name.localeCompare(b.name, 'zh'));

    const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
    const safePage = Math.min(page, totalPages - 1);
    const pageItems = filtered.slice(safePage * itemsPerPage, (safePage + 1) * itemsPerPage);

    const handleFilterChange = useCallback(() => setPage(0), []);

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
                        <FilterPill key={cat.id} label={cat.label} icon={cat.icon} active={activeCategory === cat.id} onClick={() => { setActiveCategory(cat.id); handleFilterChange(); }} />
                    ))}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    <button
                        onClick={() => {
                            setActiveType(prev => prev === 'all' ? 'can_cook' : prev === 'can_cook' ? 'favorite' : 'all');
                            handleFilterChange();
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-stone-500 hover:text-stone-700 hover:bg-stone-100 transition-colors border border-stone-200 bg-white"
                    >
                        {activeType === 'all' ? '全部菜单' : activeType === 'can_cook' ? '我会做的' : '我爱吃的'}
                    </button>

                    <button
                        onClick={() => setSortBy(prev => prev === 'name' ? 'rating' : 'name')}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-stone-500 hover:text-stone-700 hover:bg-stone-100 transition-colors border border-stone-200 bg-white"
                    >
                        <SortAsc size={14} />
                        {sortBy === 'name' ? '按名称' : '按评分'}
                    </button>
                </div>
            </div>

            <div ref={gridRef} className="flex-1 overflow-hidden">
                <motion.div
                    key={safePage}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.25 }}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
                >
                    {pageItems.map(recipe => (
                        <div key={recipe.id} className="group relative">
                            <div className={`bg-white rounded-2xl border ${jumpTargetRecipeId === recipe.id ? 'border-amber-400 ring-4 ring-amber-400/20' : 'border-stone-200/80'} overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] transition-all duration-400`}>
                                <div className="relative aspect-16/13 overflow-hidden bg-stone-100">
                                    <Image
                                        src={recipe.image}
                                        alt={recipe.name}
                                        fill
                                        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                                    />
                                    <div className="absolute top-3 left-2 px-2.5 py-1 rounded-md bg-white/80 backdrop-blur-sm text-[14px] font-bold text-stone-600 tracking-wide flex items-center gap-1.5 shadow-sm">
                                        {(() => {
                                            const cat = dynamicCategories.find(c => c.label === recipe.category);
                                            const Icon = cat?.icon;
                                            return Icon ? <Icon size={16} className="opacity-70" /> : <LayoutGrid size={16} className="opacity-70" />;
                                        })()}
                                        {recipe.category}
                                    </div>

                                    {recipe.restaurantId && (() => {
                                        const rest = restaurants.find(r => r.id === recipe.restaurantId);
                                        return rest ? (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); onJumpToRestaurant?.(rest.id); }}
                                                className="absolute top-3 right-2 flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-stone-800/80 backdrop-blur-sm text-[13px] font-bold text-stone-50 transition-colors hover:bg-amber-600 shadow-sm z-10"
                                            >
                                                <Store size={14} className="opacity-80" />
                                                {rest.name}
                                            </button>
                                        ) : null;
                                    })()}
                                </div>

                                <div className="p-4">
                                    <div className="flex items-start justify-between mb-2">
                                        <h3 className="font-serif font-bold text-stone-800 text-base">{recipe.name}</h3>
                                        <RatingStars rating={recipe.rating} size={12} />
                                    </div>

                                    <div className="flex flex-wrap gap-1.5 mb-2 min-h-[24px]">
                                        {recipe.linkedFoods.map(foodId => {
                                            const food = foods.find(f => f.id === foodId);
                                            if (!food) return null;

                                            const Icon = food.category ? (
                                                (() => {
                                                    const matchCat = categories.find(c => c.module === 'foods' && c.name === food.category);
                                                    return matchCat?.icon ? (LucideIcons as any)[matchCat.icon] : LayoutGrid;
                                                })()
                                            ) : LayoutGrid;

                                            return (
                                                <button
                                                    key={foodId}
                                                    onClick={(e) => { e.stopPropagation(); onJumpToFood?.(foodId); }}
                                                    className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-stone-100 text-stone-600 text-[11px] font-medium border border-stone-200/60 transition-colors hover:bg-stone-200 hover:text-stone-800 focus:outline-none"
                                                >
                                                    <Icon size={12} className="opacity-60" />
                                                    {food.name}
                                                </button>
                                            );
                                        })}
                                    </div>

                                    <p className="text-base text-stone-500 leading-relaxed line-clamp-4">
                                        {recipe.notes.replace(/\\n/g, ' ').replace(/\n/g, ' ').replace(/### /g, '').replace(/- /g, '· ')}
                                    </p>
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
