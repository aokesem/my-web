"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowLeft,
    Star,
    ChevronLeft,
    ChevronRight,
    SortAsc,
    X,
    MapPin,
    Leaf,
    CookingPot,
    Store,
    LayoutGrid,
    Apple,
    Beef,
    Carrot,
    Flame,
    Clock,
    UtensilsCrossed,
    Coffee,
    CakeSlice
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

// ============================================================
// 静态样例数据
// ============================================================

const EXAMPLE_IMG = '/images/example.jpg';

// --- 食物数据 ---
const FOOD_CATEGORIES = [
    { id: '全部', label: '全部', icon: LayoutGrid },
    { id: '水果', label: '水果', icon: Apple },
    { id: '肉类', label: '肉类', icon: Beef },
    { id: '蔬菜', label: '蔬菜', icon: Carrot },
    { id: '调味料', label: '调味料', icon: Flame },
];

const FOODS = [
    { id: 1, name: '苹果', category: '水果', rating: 4.5, image: EXAMPLE_IMG, notes: '### 挑选指南\n- 选择表面光滑、色泽均匀的\n- 轻轻按压有弹性最佳\n\n### 推荐搭配\n酸奶、蜂蜜、肉桂粉' },
    { id: 2, name: '蓝莓', category: '水果', rating: 5, image: EXAMPLE_IMG, notes: '### 保存方法\n冷藏保存，食用前再清洗\n\n### 口感\n酸甜多汁，果皮微涩' },
    { id: 3, name: '芒果', category: '水果', rating: 4, image: EXAMPLE_IMG, notes: '### 品种推荐\n- 贵妃芒：香甜浓郁\n- 小台芒：细腻丝滑' },
    { id: 4, name: '牛腩', category: '肉类', rating: 5, image: EXAMPLE_IMG, notes: '### 处理方法\n1. 冷水浸泡30分钟去血水\n2. 切块后焯水\n3. 加料酒、姜片去腥\n\n### 价格参考\n约 35-50 元/斤' },
    { id: 5, name: '三文鱼', category: '肉类', rating: 4.5, image: EXAMPLE_IMG, notes: '### 新鲜度判断\n- 色泽鲜亮的橙红色\n- 无腥味、有淡淡海洋气息\n- 按压后能迅速回弹' },
    { id: 6, name: '鸡胸肉', category: '肉类', rating: 3.5, image: EXAMPLE_IMG, notes: '### 烹饪技巧\n腌制后再煎，避免过于干柴\n\n### 搭配\n沙拉、三明治、炒饭' },
    { id: 7, name: '西兰花', category: '蔬菜', rating: 4, image: EXAMPLE_IMG, notes: '### 处理方法\n掰成小朵，盐水浸泡15分钟\n\n### 烹饪建议\n焯水后冰镇，保持翠绿' },
    { id: 8, name: '番茄', category: '蔬菜', rating: 4.5, image: EXAMPLE_IMG, notes: '### 品种\n- 大番茄：炒菜、炖汤\n- 小番茄：沙拉、零食' },
    { id: 9, name: '花椒', category: '调味料', rating: 4, image: EXAMPLE_IMG, notes: '### 使用方法\n热油爆香，提取麻味\n\n### 存放\n密封避光保存，保持香气' },
    { id: 10, name: '罗勒', category: '调味料', rating: 4, image: EXAMPLE_IMG, notes: '### 用途\n意面、披萨、沙拉的灵魂\n\n### 新鲜保存\n根部包湿纸巾，放入密封袋冷藏' },
    { id: 11, name: '罗勒', category: '调味料', rating: 4, image: EXAMPLE_IMG, notes: '### 用途\n意面、披萨、沙拉的灵魂\n\n### 新鲜保存\n根部包湿纸巾，放入密封袋冷藏' },
];

// --- 食谱数据 ---
const RECIPE_CATEGORIES = [
    { id: '全部', label: '全部', icon: LayoutGrid },
    { id: '简餐', label: '简餐', icon: Clock },
    { id: '正餐', label: '正餐', icon: UtensilsCrossed },
    { id: '饮料', label: '饮料', icon: Coffee },
    { id: '甜品', label: '甜品', icon: CakeSlice },
];

const RECIPES = [
    { id: 1, name: '番茄炒蛋', category: '简餐', type: 'can_cook' as const, rating: 4.5, image: EXAMPLE_IMG, notes: '### 做法\n1. 鸡蛋打散加少许盐\n2. 番茄切块\n3. 先炒蛋盛出\n4. 炒番茄出汁后加蛋\n5. 加糖提鲜', linkedFoods: [8, 3], restaurantId: 1 },
    { id: 2, name: '清蒸鲈鱼', category: '正餐', type: 'favorite' as const, rating: 5, image: EXAMPLE_IMG, notes: '### 要点\n- 鱼要新鲜\n- 蒸6-8分钟即可\n- 浇热油是灵魂', linkedFoods: [], restaurantId: undefined },
    { id: 3, name: '红烧牛腩', category: '正餐', type: 'can_cook' as const, rating: 4.5, image: EXAMPLE_IMG, notes: '### 材料\n牛腩500g、土豆2个、胡萝卜1根\n\n### 要点\n小火慢炖2小时，入口即化', linkedFoods: [4], restaurantId: undefined },
    { id: 4, name: '抹茶拿铁', category: '饮料', type: 'can_cook' as const, rating: 4, image: EXAMPLE_IMG, notes: '### 配方\n- 抹茶粉 2g\n- 牛奶 200ml\n- 热水 30ml\n\n先用热水化开抹茶粉，打发牛奶后倒入', linkedFoods: [], restaurantId: 2 },
    { id: 5, name: '提拉米苏', category: '甜品', type: 'favorite' as const, rating: 5, image: EXAMPLE_IMG, notes: '### 经典配方\n马斯卡彭芝士、手指饼干、浓缩咖啡、可可粉\n\n### 最佳食用\n冷藏4小时以上', linkedFoods: [], restaurantId: undefined },
    { id: 6, name: '西兰花炒虾仁', category: '简餐', type: 'can_cook' as const, rating: 4, image: EXAMPLE_IMG, notes: '### 技巧\n虾仁用料酒腌制去腥，西兰花提前焯水', linkedFoods: [7], restaurantId: undefined },
];

// --- 餐厅数据 ---
const RESTAURANT_CATEGORIES = ['全部', '日料', '法餐', '火锅'];

const RESTAURANTS = [
    {
        id: 1, name: '和风亭', category: '日料', address: '上海市静安区南京西路 1266 号', rating: 4.5,
        notes: '环境幽静的日式料理店，推荐午市套餐',
        images: [EXAMPLE_IMG, EXAMPLE_IMG, EXAMPLE_IMG],
        dishes: [
            { id: 1, name: '鳗鱼饭', image: EXAMPLE_IMG, recipeId: undefined },
            { id: 2, name: '刺身拼盘', image: EXAMPLE_IMG, recipeId: undefined },
            { id: 3, name: '天妇罗', image: EXAMPLE_IMG, recipeId: undefined },
            { id: 4, name: '味噌汤', image: EXAMPLE_IMG, recipeId: undefined },
        ]
    },
    {
        id: 2, name: 'Café de Flore', category: '法餐', address: '北京市朝阳区三里屯路 19 号', rating: 4,
        notes: '法式小馆，适合周末 brunch',
        images: [EXAMPLE_IMG, EXAMPLE_IMG],
        dishes: [
            { id: 1, name: '法式吐司', image: EXAMPLE_IMG, recipeId: undefined },
            { id: 2, name: '凯撒沙拉', image: EXAMPLE_IMG, recipeId: undefined },
            { id: 3, name: '可颂', image: EXAMPLE_IMG, recipeId: undefined },
        ]
    },
    {
        id: 3, name: '老灶火锅', category: '火锅', address: '重庆市渝中区解放碑洪崖洞 88 号', rating: 5,
        notes: '正宗重庆老火锅，牛油锅底一绝',
        images: [EXAMPLE_IMG, EXAMPLE_IMG, EXAMPLE_IMG, EXAMPLE_IMG],
        dishes: [
            { id: 1, name: '毛肚', image: EXAMPLE_IMG, recipeId: undefined },
            { id: 2, name: '鸭肠', image: EXAMPLE_IMG, recipeId: undefined },
            { id: 3, name: '黄喉', image: EXAMPLE_IMG, recipeId: undefined },
            { id: 4, name: '麻辣牛肉', image: EXAMPLE_IMG, recipeId: undefined },
            { id: 5, name: '冰粉', image: EXAMPLE_IMG, recipeId: undefined },
        ]
    },
    {
        id: 4, name: '大吉烧肉', category: '日料', address: '广州市天河区天河路 208 号', rating: 4.5,
        notes: '适合朋友聚会的日式烧肉店',
        images: [EXAMPLE_IMG, EXAMPLE_IMG, EXAMPLE_IMG],
        dishes: [
            { id: 1, name: '鳗鱼饭', image: EXAMPLE_IMG, recipeId: undefined },
            { id: 2, name: '刺身拼盘', image: EXAMPLE_IMG, recipeId: undefined },
            { id: 3, name: '天妇罗', image: EXAMPLE_IMG, recipeId: undefined },
            { id: 4, name: '清蒸鲈鱼', image: EXAMPLE_IMG, recipeId: 2 },
        ]
    },
];

// ============================================================
// 工具组件
// ============================================================

const RatingStars = ({ rating, size = 14 }: { rating: number; size?: number }) => (
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

const FilterPill = ({ label, active, icon: Icon, onClick }: { label: string; active: boolean; icon?: React.ElementType; onClick: () => void }) => (
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
const Pagination = ({ page, totalPages, onPageChange }: { page: number; totalPages: number; onPageChange: (p: number) => void }) => {
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

// --- 自动计算分页 Hook ---
function useAutoPageSize(containerRef: React.RefObject<HTMLDivElement | null>, estimatedRowHeight: number, columns: number, fallback: number) {
    const [itemsPerPage, setItemsPerPage] = useState(fallback);

    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;

        const calculate = () => {
            const height = el.clientHeight;
            const rows = Math.max(1, Math.floor(height / estimatedRowHeight));
            setItemsPerPage(rows * columns);
        };

        calculate();
        const observer = new ResizeObserver(calculate);
        observer.observe(el);
        return () => observer.disconnect();
    }, [containerRef, estimatedRowHeight, columns, fallback]);

    return itemsPerPage;
}

// ============================================================
// 食物 Tab
// ============================================================

type Food = typeof FOODS[number];

const FoodsTab = ({ jumpTargetFoodId, onClearJump }: { jumpTargetFoodId?: number | null, onClearJump?: () => void }) => {
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
            const sorted = [...FOODS].sort((a, b) => a.name.localeCompare(b.name, 'zh'));
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
    }, [jumpTargetFoodId, itemsPerPage, onClearJump]);

    const filtered = FOODS
        .filter(f => activeCategory === '全部' || f.category === activeCategory)
        .sort((a, b) => sortBy === 'rating' ? b.rating - a.rating : a.name.localeCompare(b.name, 'zh'));

    const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
    const safePage = Math.min(page, totalPages - 1);
    const pageItems = filtered.slice(safePage * itemsPerPage, (safePage + 1) * itemsPerPage);

    const handleCategoryChange = useCallback((cat: string) => {
        setActiveCategory(cat);
        setPage(0);
    }, []);

    return (
        <div className="h-full flex flex-col">
            {/* 工具栏 */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4 shrink-0">
                <div className="flex flex-wrap gap-2">
                    {FOOD_CATEGORIES.map(cat => (
                        <FilterPill key={cat.id} label={cat.label} icon={cat.icon} active={activeCategory === cat.id} onClick={() => handleCategoryChange(cat.id)} />
                    ))}
                </div>
                <button
                    onClick={() => setSortBy(prev => prev === 'name' ? 'rating' : 'name')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-stone-500 hover:text-stone-700 hover:bg-stone-100 transition-colors border border-stone-200"
                >
                    <SortAsc size={14} />
                    {sortBy === 'name' ? '按名称' : '按评分'}
                </button>
            </div>

            {/* 网格区域 */}
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
                                {/* 图片 - 左侧 */}
                                <div className="relative w-[200px] shrink-0 overflow-hidden bg-stone-100">
                                    <Image
                                        src={food.image}
                                        alt={food.name}
                                        fill
                                        sizes="200px"
                                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                                    />
                                    <div className="absolute top-3 left-2 px-2 py-0.5 rounded-md bg-white/80 backdrop-blur-sm text-[13px] font-bold text-stone-600 tracking-wide flex items-center gap-1">
                                        {(() => {
                                            const cat = FOOD_CATEGORIES.find(c => c.label === food.category);
                                            const Icon = cat?.icon;
                                            return Icon ? <Icon size={14} className="opacity-70" /> : null;
                                        })()}
                                        {food.category}
                                    </div>
                                </div>

                                {/* 信息 + 笔记 - 右侧 */}
                                <div className="flex-1 p-4 flex flex-col overflow-hidden">
                                    <div className="flex items-center justify-between mb-2 shrink-0">
                                        <h3 className="font-serif font-bold text-stone-800 text-base">{food.name}</h3>
                                        <RatingStars rating={food.rating} size={12} />
                                    </div>
                                    <div className="border-t border-dashed border-stone-200 pt-2 flex-1 overflow-y-auto no-scrollbar">
                                        <div className="text-xs text-stone-600 leading-relaxed whitespace-pre-line">
                                            {food.notes.replace(/### /g, '').replace(/- /g, '· ')}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </motion.div>
            </div>

            {/* 翻页 */}
            <Pagination page={safePage} totalPages={totalPages} onPageChange={setPage} />
        </div>
    );
};


// ============================================================
// 食谱 Tab
// ============================================================

const RecipesTab = ({
    onJumpToFood,
    jumpTargetRecipeId,
    onClearJump,
    onJumpToRestaurant
}: {
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

    const filtered = RECIPES
        .filter(r => activeCategory === '全部' || r.category === activeCategory)
        .filter(r => activeType === 'all' || r.type === activeType)
        .sort((a, b) => sortBy === 'rating' ? b.rating - a.rating : a.name.localeCompare(b.name, 'zh'));

    const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
    const safePage = Math.min(page, totalPages - 1);
    const pageItems = filtered.slice(safePage * itemsPerPage, (safePage + 1) * itemsPerPage);

    const handleFilterChange = useCallback(() => setPage(0), []);

    return (
        <div className="h-full flex flex-col">
            {/* 工具栏 */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4 shrink-0">
                <div className="flex flex-wrap gap-2">
                    {RECIPE_CATEGORIES.map(cat => (
                        <FilterPill key={cat.id} label={cat.label} icon={cat.icon} active={activeCategory === cat.id} onClick={() => { setActiveCategory(cat.id); handleFilterChange(); }} />
                    ))}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    {/* 类型切换（循环按钮） */}
                    <button
                        onClick={() => {
                            setActiveType(prev => prev === 'all' ? 'can_cook' : prev === 'can_cook' ? 'favorite' : 'all');
                            handleFilterChange();
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-stone-500 hover:text-stone-700 hover:bg-stone-100 transition-colors border border-stone-200 bg-white"
                    >
                        {activeType === 'all' ? '全部菜单' : activeType === 'can_cook' ? '我会做的' : '我爱吃的'}
                    </button>

                    {/* 排序切换 */}
                    <button
                        onClick={() => setSortBy(prev => prev === 'name' ? 'rating' : 'name')}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-stone-500 hover:text-stone-700 hover:bg-stone-100 transition-colors border border-stone-200"
                    >
                        <SortAsc size={14} />
                        {sortBy === 'name' ? '按名称' : '按评分'}
                    </button>
                </div>
            </div>

            {/* 卡片区域 */}
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
                                {/* 图片 */}
                                <div className="relative aspect-16/13 overflow-hidden bg-stone-100">
                                    <Image
                                        src={recipe.image}
                                        alt={recipe.name}
                                        fill
                                        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                                    />
                                    {/* 分类标签 */}
                                    <div className="absolute top-3 left-2 px-2.5 py-1 rounded-md bg-white/80 backdrop-blur-sm text-[14px] font-bold text-stone-600 tracking-wide flex items-center gap-1.5 shadow-sm">
                                        {(() => {
                                            const cat = RECIPE_CATEGORIES.find(c => c.label === recipe.category);
                                            const Icon = cat?.icon;
                                            return Icon ? <Icon size={16} className="opacity-70" /> : null;
                                        })()}
                                        {recipe.category}
                                    </div>

                                    {/* 来源餐厅 (可选) */}
                                    {recipe.restaurantId && (() => {
                                        const rest = RESTAURANTS.find(r => r.id === recipe.restaurantId);
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

                                {/* 信息区 */}
                                <div className="p-4">
                                    <div className="flex items-start justify-between mb-2">
                                        <h3 className="font-serif font-bold text-stone-800 text-base">{recipe.name}</h3>
                                        <RatingStars rating={recipe.rating} size={12} />
                                    </div>

                                    {/* 关联食材（始终占位） */}
                                    <div className="flex flex-wrap gap-1.5 mb-2 min-h-[24px]">
                                        {recipe.linkedFoods.map(foodId => {
                                            const food = FOODS.find(f => f.id === foodId);
                                            if (!food) return null;
                                            const cat = FOOD_CATEGORIES.find(c => c.label === food.category);
                                            const Icon = cat?.icon;
                                            return (
                                                <button
                                                    key={foodId}
                                                    onClick={(e) => { e.stopPropagation(); onJumpToFood?.(foodId); }}
                                                    className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-stone-100 text-stone-600 text-[11px] font-medium border border-stone-200/60 transition-colors hover:bg-stone-200 hover:text-stone-800 focus:outline-none"
                                                >
                                                    {Icon && <Icon size={12} className="opacity-60" />}
                                                    {food.name}
                                                </button>
                                            );
                                        })}
                                    </div>

                                    {/* 笔记摘要 */}
                                    <p className="text-base text-stone-500 leading-relaxed line-clamp-4">
                                        {recipe.notes.replace(/### /g, '').replace(/- /g, '· ').replace(/\n/g, ' ')}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </motion.div>
            </div>

            {/* 翻页 */}
            <Pagination page={safePage} totalPages={totalPages} onPageChange={setPage} />
        </div>
    );
};

// ============================================================
// 餐厅 Tab
// ============================================================

type Restaurant = typeof RESTAURANTS[number];

const RestaurantDetail = ({ restaurant, onClose, onJumpToRecipe }: { restaurant: Restaurant; onClose: () => void; onJumpToRecipe?: (id: number) => void }) => (
    <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-100 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={onClose}
    >
        <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.98 }}
            transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
            className="relative bg-[#faf6f0] rounded-3xl max-w-6xl w-[95vw] max-h-[90vh] overflow-y-auto shadow-2xl border border-stone-200"
            onClick={(e) => e.stopPropagation()}
        >
            {/* 关闭按钮 */}
            <button
                onClick={onClose}
                className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/80 backdrop-blur-sm border border-stone-200 text-stone-500 hover:text-stone-800 hover:bg-white transition-all shadow-sm"
            >
                <X size={18} />
            </button>

            {/* 餐厅照片组 */}
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

            {/* 餐厅信息 */}
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
                    <p className="text-sm text-stone-500 italic mb-6">{restaurant.notes}</p>
                )}
            </div>

            {/* 分割线装饰 */}
            <div className="mx-8 border-t border-dashed border-stone-300 relative">
                <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-[#faf6f0] px-3 text-[10px] font-mono text-stone-400 uppercase tracking-widest">推荐菜品</span>
            </div>

            {/* 菜品网格 */}
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

            {/* 底部地址 */}
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

const RestaurantsTab = ({ onSelect, onJumpToRecipe }: { onSelect: (r: Restaurant) => void; onJumpToRecipe?: (id: number) => void }) => {
    const [activeCategory, setActiveCategory] = useState('全部');
    const [sortBy, setSortBy] = useState<'name' | 'rating'>('name');
    const [page, setPage] = useState(0);

    // 固定每页 3 条
    const itemsPerPage = 3;

    const filtered = React.useMemo(() => {
        let result = [...RESTAURANTS];
        if (activeCategory !== '全部') {
            result = result.filter(r => r.category === activeCategory);
        }
        return result.sort((a, b) =>
            sortBy === 'rating' ? b.rating - a.rating : a.name.localeCompare(b.name, 'zh')
        );
    }, [activeCategory, sortBy]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
    const safePage = Math.min(page, totalPages - 1);
    const pageItems = filtered.slice(safePage * itemsPerPage, (safePage + 1) * itemsPerPage);

    const handleCategoryChange = useCallback((cat: string) => {
        setActiveCategory(cat);
        setPage(0);
    }, []);

    return (
        <div className="h-full flex flex-col">
            {/* 工具栏 */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4 shrink-0">
                <div className="flex flex-wrap gap-2">
                    {RESTAURANT_CATEGORIES.map(cat => (
                        <FilterPill key={cat} label={cat} active={activeCategory === cat} onClick={() => handleCategoryChange(cat)} />
                    ))}
                </div>
                <button
                    onClick={() => setSortBy(prev => prev === 'name' ? 'rating' : 'name')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-stone-500 hover:text-stone-700 hover:bg-stone-100 transition-colors border border-stone-200"
                >
                    <SortAsc size={14} />
                    {sortBy === 'name' ? '按名称' : '按评分'}
                </button>
            </div>

            {/* 餐厅列表 */}
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
                                {/* 封面图 */}
                                <div className="relative w-1/3 min-w-[320px] max-w-[440px] shrink-0 overflow-hidden bg-stone-200">
                                    <Image
                                        src={restaurant.images[0]}
                                        alt={restaurant.name}
                                        fill
                                        sizes="400px"
                                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                                    />
                                </div>

                                {/* 信息 */}
                                <div className="flex-1 p-6 flex flex-col justify-between">
                                    <div>
                                        <div className="flex items-center gap-2 mb-2">
                                            <h3 className="font-serif font-bold text-stone-800 text-xl">{restaurant.name}</h3>
                                            <span className="px-1.5 py-0.5 rounded border border-stone-200 bg-stone-50 text-[12px] font-bold text-stone-500">
                                                {restaurant.category}
                                            </span>
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

            {/* 翻页 */}
            <Pagination page={safePage} totalPages={totalPages} onPageChange={setPage} />
        </div>
    );
};

// ============================================================
// 主页面
// ============================================================

type TabId = 'foods' | 'recipes' | 'restaurants';

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
    { id: 'foods', label: '食物', icon: Leaf },
    { id: 'recipes', label: '食谱', icon: CookingPot },
    { id: 'restaurants', label: '餐厅', icon: Store },
];

export default function DietPage() {
    const [activeTab, setActiveTab] = useState<TabId>('foods');
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
        const rest = RESTAURANTS.find(r => r.id === restId);
        if (rest) {
            setActiveTab('restaurants');
            // 打开弹窗以完整展示选中的餐厅信息
            setSelectedRestaurant(rest);
        }
    }, []);

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

            {/* Header — 缩小间距 */}
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

            {/* Tab 切换 — 缩小间距 */}
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

            {/* 主内容区 — flex-1 填满剩余空间 */}
            <main className="relative z-10 max-w-6xl w-full mx-auto px-8 flex-1 overflow-hidden pb-2">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.25 }}
                        className="h-full"
                    >
                        {activeTab === 'foods' && <FoodsTab jumpTargetFoodId={jumpTargetFoodId} onClearJump={() => setJumpTargetFoodId(null)} />}
                        {activeTab === 'recipes' && (
                            <RecipesTab
                                jumpTargetRecipeId={jumpTargetRecipeId}
                                onClearJump={() => setJumpTargetRecipeId(null)}
                                onJumpToFood={handleJumpToFood}
                                onJumpToRestaurant={handleJumpToRestaurant}
                            />
                        )}
                        {activeTab === 'restaurants' && <RestaurantsTab onSelect={setSelectedRestaurant} onJumpToRecipe={handleJumpToRecipe} />}
                    </motion.div>
                </AnimatePresence>
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
