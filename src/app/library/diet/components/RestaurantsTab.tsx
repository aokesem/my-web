import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Store, CookingPot, X, SortAsc } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import Image from 'next/image';
import { Restaurant, Category } from '../types';
import { FilterPill, RatingStars, Pagination } from './DietCommon';

export const RestaurantDetail = ({
    restaurant,
    onClose,
    onJumpToRecipe
}: {
    restaurant: Restaurant;
    onClose: () => void;
    onJumpToRecipe?: (id: number) => void
}) => (
    <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={onClose}
    >
        <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.98 }}
            transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
            className="relative bg-[#faf6f0] rounded-3xl max-w-6xl w-[95vw] max-h-[90vh] overflow-y-auto no-scrollbar shadow-2xl border border-stone-200"
            onClick={(e) => e.stopPropagation()}
        >
            <button
                onClick={onClose}
                className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/80 backdrop-blur-sm border border-stone-200 text-stone-500 hover:text-stone-800 hover:bg-white transition-all shadow-sm"
            >
                <X size={18} />
            </button>

            <div className="flex gap-2 p-4 overflow-x-auto no-scrollbar">
                {restaurant.images.map((img, i) => (
                    <div key={i} className={`relative shrink-0 rounded-2xl overflow-hidden bg-stone-200 ${i === 0 ? 'w-72 h-48' : 'w-48 h-48'}`}>
                        <Image src={img} alt={`${restaurant.name} ${i + 1}`} fill sizes="300px" className="object-cover" />
                        {i === 0 && (
                            <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-white/80 text-[10px] font-bold text-stone-600">
                                封面
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <div className="px-8 pb-2">
                <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-2xl font-serif font-bold text-stone-800">{restaurant.name}</h2>
                    <span className="px-2 py-0.5 rounded border border-stone-200 bg-white/60 text-[11px] font-bold text-stone-500 tracking-wide">
                        {restaurant.category}
                    </span>
                </div>
                <div className="flex items-center gap-4 mb-3">
                    <RatingStars rating={restaurant.rating} />
                    <div className="flex items-center gap-1.5 text-stone-500 text-sm">
                        <MapPin size={14} />
                        {restaurant.address}
                    </div>
                </div>
                {restaurant.notes && (
                    <p className="text-sm text-stone-500 italic mb-6 whitespace-pre-line">{restaurant.notes.replace(/\\n/g, '\n')}</p>
                )}
            </div>

            <div className="mx-8 border-t border-dashed border-stone-300 relative">
                <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-[#faf6f0] px-3 text-[10px] font-mono text-stone-400 uppercase tracking-widest">推荐菜品</span>
            </div>

            <div className="p-8 grid grid-cols-2 sm:grid-cols-3 gap-4">
                {restaurant.dishes.map(dish => dish.recipeId ? (
                    <button
                        key={dish.id}
                        onClick={() => onJumpToRecipe?.(dish.recipeId!)}
                        className="group relative cursor-pointer block focus:outline-none"
                    >
                        <div className="relative aspect-square rounded-xl overflow-hidden bg-stone-200 mb-2 shadow-[0_2px_8px_rgba(0,0,0,0.04)] ring-2 ring-transparent group-hover:ring-amber-300 transition-all duration-300 hover:shadow-lg">
                            <Image src={dish.image} alt={dish.name} fill sizes="200px" className="object-cover group-hover:scale-105 transition-transform duration-500" />
                            <div className="absolute inset-0 bg-linear-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2 justify-end">
                                <CookingPot size={16} className="text-white drop-shadow-md" />
                            </div>
                        </div>
                        <p className="text-sm font-medium text-amber-700 text-center flex items-center justify-center gap-1">
                            {dish.name}
                        </p>
                    </button>
                ) : (
                    <div key={dish.id} className="group">
                        <div className="relative aspect-square rounded-xl overflow-hidden bg-stone-200 mb-2 shadow-sm">
                            <Image src={dish.image} alt={dish.name} fill sizes="200px" className="object-cover group-hover:scale-105 transition-transform duration-500" />
                        </div>
                        <p className="text-sm font-medium text-stone-700 text-center">{dish.name}</p>
                    </div>
                ))}
            </div>

            <div className="mx-8 mb-6 p-4 bg-white/60 rounded-xl border border-stone-200/60 flex items-start gap-3">
                <MapPin size={16} className="text-stone-400 mt-0.5 shrink-0" />
                <div>
                    <p className="text-xs font-mono text-stone-400 uppercase tracking-wider mb-1">地址</p>
                    <p className="text-sm text-stone-700">{restaurant.address}</p>
                </div>
            </div>
        </motion.div>
    </motion.div>
);

export const RestaurantsTab = ({
    restaurants,
    categories,
    onSelect,
    onJumpToRecipe
}: {
    restaurants: Restaurant[];
    categories: Category[];
    onSelect: (r: Restaurant) => void;
    onJumpToRecipe?: (id: number) => void
}) => {
    const [activeCategory, setActiveCategory] = useState('全部');
    const [activeRegion, setActiveRegion] = useState('全部');
    const [sortBy, setSortBy] = useState<'name' | 'rating'>('name');
    const [page, setPage] = useState(0);

    const itemsPerPage = 3;

    const filtered = React.useMemo(() => {
        let result = [...restaurants];
        if (activeCategory !== '全部') {
            result = result.filter(r => r.category === activeCategory);
        }
        if (activeRegion !== '全部') {
            result = result.filter(r => r.region === activeRegion);
        }
        return result.sort((a, b) =>
            sortBy === 'rating' ? b.rating - a.rating : a.name.localeCompare(b.name, 'zh')
        );
    }, [activeCategory, activeRegion, sortBy, restaurants]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
    const safePage = Math.min(page, totalPages - 1);
    const pageItems = filtered.slice(safePage * itemsPerPage, (safePage + 1) * itemsPerPage);

    const handleCategoryChange = useCallback((cat: string) => {
        setActiveCategory(cat);
        setPage(0);
    }, []);

    const dynamicCategories = [
        { id: '全部', label: '全部', icon: Store },
        ...categories.filter(c => c.module === 'restaurants').map(c => ({
            id: c.name,
            label: c.name,
            icon: c.icon ? (LucideIcons as any)[c.icon] : undefined
        }))
    ];

    const regionCategories = [
        { id: '全部', label: '全部区域' },
        ...categories.filter(c => c.module === 'restaurant_regions').map(c => ({
            id: c.name,
            label: c.name
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

                <div className="flex items-center gap-2 shrink-0">
                    <button
                        onClick={() => {
                            const idx = regionCategories.findIndex(r => r.id === activeRegion);
                            const next = regionCategories[(idx + 1) % regionCategories.length];
                            setActiveRegion(next.id);
                            setPage(0);
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-stone-500 hover:text-stone-700 hover:bg-stone-100 transition-colors border border-stone-200 bg-white"
                    >
                        {regionCategories.find(r => r.id === activeRegion)?.label || '全部区域'}
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

            <div className="flex-1 overflow-hidden">
                <motion.div
                    key={safePage}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.25 }}
                    className="flex flex-col gap-7"
                >
                    {pageItems.map(restaurant => (
                        <div
                            key={restaurant.id}
                            className="bg-white rounded-2xl border border-stone-200/80 overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] transition-all duration-400 cursor-pointer group"
                            onClick={() => onSelect(restaurant)}
                        >
                            <div className="flex items-stretch">
                                <div className="relative w-1/3 min-w-[320px] max-w-[440px] shrink-0 overflow-hidden bg-stone-200">
                                    <Image
                                        src={restaurant.images[0]}
                                        alt={restaurant.name}
                                        fill
                                        sizes="400px"
                                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                                    />
                                </div>

                                <div className="flex-1 p-6 flex flex-col justify-between">
                                    <div>
                                        <div className="flex items-center gap-2 mb-2">
                                            <h3 className="font-serif font-bold text-stone-800 text-xl">{restaurant.name}</h3>
                                            <span className="px-1.5 py-0.5 rounded border border-stone-200 bg-stone-50 text-[12px] font-bold text-stone-500">
                                                {restaurant.category}
                                            </span>
                                            {restaurant.region && (
                                                <span className="px-1.5 py-0.5 rounded border border-stone-100 bg-stone-100 text-[12px] font-medium text-stone-400">
                                                    {restaurant.region}
                                                </span>
                                            )}
                                        </div>
                                        <div className="mb-2">
                                            <RatingStars rating={restaurant.rating} />
                                        </div>
                                        <div className="flex items-center gap-1.5 text-stone-400 text-sm">
                                            <MapPin size={13} />
                                            {restaurant.address}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 mt-4">
                                        <div className="flex items-center gap-1.5 flex-1 overflow-hidden">
                                            {restaurant.dishes.slice(0, 2).map((dish, idx) => dish.recipeId ? (
                                                <button
                                                    key={idx}
                                                    onClick={(e) => { e.stopPropagation(); onJumpToRecipe?.(dish.recipeId!); }}
                                                    className="px-2 py-0.5 bg-amber-50 rounded text-[11px] text-amber-700 font-medium border border-amber-200/60 hover:bg-amber-100 transition-colors flex items-center gap-1 focus:outline-none shrink-0"
                                                >
                                                    <CookingPot size={11} className="opacity-70" />
                                                    {dish.name}
                                                </button>
                                            ) : (
                                                <span key={idx} className="px-2 py-0.5 bg-stone-100 rounded text-[11px] text-stone-500 shrink-0">
                                                    {dish.name}
                                                </span>
                                            ))}
                                            {restaurant.dishes.length > 2 && (
                                                <span className="text-[11px] font-mono text-stone-400 shrink-0">+{restaurant.dishes.length - 2}</span>
                                            )}
                                        </div>
                                        <span className="text-stone-300 shrink-0">•</span>
                                        <span className="text-[11px] font-mono text-stone-400 shrink-0">{restaurant.images.length} 张照片</span>
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
