"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, CookingPot, Leaf, Store } from 'lucide-react';
import Link from 'next/link';
import { useDietData } from './hooks/useDietData';
import { Restaurant, TabId, Food, Category, Recipe } from './types';
import { FoodsTab } from './components/FoodsTab';
import { RecipesTab } from './components/RecipesTab';
import { RestaurantsTab, RestaurantDetail } from './components/RestaurantsTab';

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
    { id: 'foods', label: '食物', icon: Leaf },
    { id: 'recipes', label: '食谱', icon: CookingPot },
    { id: 'restaurants', label: '餐厅', icon: Store },
];

export default function DietPage() {
    const { foods, recipes, restaurants, categories, isLoading, isError } = useDietData();
    const [activeTab, setActiveTab] = useState('foods'); // Removed explicit <TabId> type annotation
    const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
    const [jumpTargetFoodId, setJumpTargetFoodId] = useState<number | null>(null);
    const [jumpTargetRecipeId, setJumpTargetRecipeId] = useState<number | null>(null);

    const handleJumpToFood = useCallback((foodId: number) => {
        setJumpTargetFoodId(foodId);
        setActiveTab('foods');
    }, []);

    const handleJumpToRecipe = useCallback((recipeId: number) => {
        setSelectedRestaurant(null); // 关闭弹窗(若在弹窗内点击)
        setJumpTargetRecipeId(recipeId);
        setActiveTab('recipes');
    }, []);

    const handleJumpToRestaurant = useCallback((restId: number) => {
        const rest = restaurants.find(r => r.id === restId);
        if (rest) {
            setActiveTab('restaurants');
            // 打开弹窗以完整展示选中的餐厅信息
            setSelectedRestaurant(rest);
        }
    }, [restaurants]);

    // 弹窗打开时锁定滚动
    useEffect(() => {
        if (selectedRestaurant) document.body.style.overflow = 'hidden';
        else document.body.style.overflow = 'auto';
        return () => { document.body.style.overflow = 'auto'; };
    }, [selectedRestaurant]);

    return (
        <div className="h-screen flex flex-col overflow-hidden bg-[#faf6f0] text-stone-800 selection:bg-amber-200/50">
            {/* Google Fonts */}
            {/* eslint-disable-next-line @next/next/no-page-custom-font */}
            <link href="https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@400;600;700&display=swap" rel="stylesheet" />
            <style dangerouslySetInnerHTML={{
                __html: `
                .font-serif { font-family: 'Noto Serif SC', serif !important; }
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            ` }} />

            {/* 纸张纹理背景 */}
            <div className="fixed inset-0 z-0 opacity-30 pointer-events-none mix-blend-multiply"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.4'/%3E%3C/svg%3E")`,
                }}
            />
            <div className="fixed inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,248,235,0.8),transparent_60%)] z-0 pointer-events-none" />

            {/* Header */}
            <header className="relative w-full px-8 pt-4 pb-2 flex justify-between items-start z-20 shrink-0">
                <Link
                    href="/library"
                    className="group flex items-center gap-3 px-4 py-2 rounded-xl bg-white/60 border border-stone-200/60 hover:bg-white hover:shadow-sm hover:border-stone-300 transition-all duration-300 backdrop-blur-sm"
                >
                    <ArrowLeft size={16} className="text-stone-400 group-hover:text-stone-600 transition-colors" />
                    <span className="text-xs font-mono font-bold text-stone-500 group-hover:text-stone-700 uppercase tracking-widest transition-colors">
                        Back to Library
                    </span>
                </Link>

                <div className="flex flex-col items-end">
                    <h1 className="text-2xl font-serif font-bold tracking-tight text-stone-800">
                        <span className="text-amber-700">饮食</span>手记
                    </h1>
                    <span className="text-[10px] font-mono text-stone-400 uppercase tracking-[0.2em] mt-0.5">
                        My Food Archive
                    </span>
                </div>
            </header>

            {/* Tab 切换 */}
            <div className="relative z-20 flex justify-center mb-5 shrink-0">
                <div className="flex items-center gap-1 p-1.5 bg-white/60 backdrop-blur-md rounded-full border border-stone-200/60 shadow-sm">
                    {TABS.map(tab => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`relative px-6 py-2 rounded-full text-sm font-bold transition-all duration-300 flex items-center gap-2 ${activeTab === tab.id
                                    ? 'bg-white text-stone-800 shadow-sm'
                                    : 'text-stone-500 hover:text-stone-700 hover:bg-white/40'
                                    }`}
                            >
                                <Icon size={16} />
                                <span>{tab.label}</span>
                                {activeTab === tab.id && (
                                    <motion.div
                                        layoutId="dietActiveTab"
                                        className="absolute inset-0 border border-stone-200 rounded-full -z-10 bg-white shadow-sm"
                                        transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                                    />
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* 装饰分割线 */}
            <div className="relative z-10 max-w-6xl mx-auto px-8 mb-5 shrink-0">
                <div className="border-t border-dashed border-stone-300/60 relative">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 flex gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-stone-300" />
                        <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                        <div className="w-1.5 h-1.5 rounded-full bg-stone-300" />
                    </div>
                </div>
            </div>

            {/* 主内容区 */}
            <main className="relative z-10 max-w-6xl w-full mx-auto px-8 flex-1 overflow-hidden pb-2">
                {isLoading ? (
                    <div className="h-full flex items-center justify-center">
                        <div className="flex flex-col items-center gap-4 text-stone-500">
                            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}>
                                <CookingPot size={32} className="opacity-80" />
                            </motion.div>
                            <span className="font-mono text-sm tracking-widest uppercase">Fetching Data...</span>
                        </div>
                    </div>
                ) : isError ? (
                    <div className="h-full flex items-center justify-center text-red-500 font-medium">
                        发生错误：未能加载厨房档案数据。请检查网络。
                    </div>
                ) : (
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.25 }}
                            className="h-full"
                        >
                            {activeTab === 'foods' && (
                                <FoodsTab
                                    foods={foods}
                                    categories={categories.filter(c => c.module === 'foods')}
                                    jumpTargetFoodId={jumpTargetFoodId}
                                    onClearJump={() => setJumpTargetFoodId(null)}
                                />
                            )}
                            {activeTab === 'recipes' && (
                                <RecipesTab
                                    foods={foods}
                                    recipes={recipes}
                                    restaurants={restaurants}
                                    categories={categories.filter(c => c.module === 'recipes')}
                                    jumpTargetRecipeId={jumpTargetRecipeId}
                                    onClearJump={() => setJumpTargetRecipeId(null)}
                                    onJumpToFood={handleJumpToFood}
                                    onJumpToRestaurant={handleJumpToRestaurant}
                                />
                            )}
                            {activeTab === 'restaurants' && (
                                <RestaurantsTab
                                    restaurants={restaurants}
                                    categories={categories.filter(c => c.module === 'restaurants' || c.module === 'restaurant_regions')}
                                    onSelect={setSelectedRestaurant}
                                    onJumpToRecipe={handleJumpToRecipe}
                                />
                            )}
                        </motion.div>
                    </AnimatePresence>
                )}
            </main>

            {/* 底部 */}
            <footer className="relative z-10 py-2 text-center shrink-0">
                <span className="text-[10px] font-mono text-stone-300 uppercase tracking-[0.3em]">
                    Kitchen Notes • Private Collection
                </span>
            </footer>

            {/* 全局弹窗 — 餐厅详情 */}
            <AnimatePresence>
                {selectedRestaurant && (
                    <RestaurantDetail
                        restaurant={selectedRestaurant}
                        onClose={() => setSelectedRestaurant(null)}
                        onJumpToRecipe={handleJumpToRecipe}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
