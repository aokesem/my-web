"use client";

import React, { useState } from 'react';
import useSWR from 'swr';
import { supabase } from '@/lib/supabaseClient';
import { Loader2, Plus, Edit2, Trash2, Utensils, Search, UtensilsCrossed, Store, Settings2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import FoodsManager from './components/FoodsManager';
import RecipesManager from './components/RecipesManager';
import RestaurantsManager from './components/RestaurantsManager';
import CategoriesManager from './components/CategoriesManager';

// 定义Tab枚举
type TabId = 'foods' | 'recipes' | 'restaurants' | 'categories';

export default function AdminDietPage() {
    const [activeTab, setActiveTab] = useState<TabId>('foods');

    return (
        <div className="flex flex-col h-[calc(100vh-4rem)]">
            {/* Header */}
            <div className="flex items-center justify-between mb-6 shrink-0">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-zinc-900 border border-zinc-800 rounded-xl shadow-sm">
                        <Utensils className="text-zinc-400" size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-white tracking-tight">饮食手记</h1>
                        <p className="text-zinc-400 text-sm mt-1">管理食物、食谱与合作餐厅的元数据及全局分类。</p>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-6 border-b border-zinc-800 pb-2 shrink-0">
                <Button
                    variant={activeTab === 'foods' ? 'secondary' : 'ghost'}
                    onClick={() => setActiveTab('foods')}
                    className={activeTab === 'foods' ? 'bg-zinc-800 text-white' : 'text-zinc-400'}
                >
                    <Utensils size={16} className="mr-2" />
                    食材库
                </Button>
                <Button
                    variant={activeTab === 'recipes' ? 'secondary' : 'ghost'}
                    onClick={() => setActiveTab('recipes')}
                    className={activeTab === 'recipes' ? 'bg-zinc-800 text-white' : 'text-zinc-400'}
                >
                    <UtensilsCrossed size={16} className="mr-2" />
                    食谱大纲
                </Button>
                <Button
                    variant={activeTab === 'restaurants' ? 'secondary' : 'ghost'}
                    onClick={() => setActiveTab('restaurants')}
                    className={activeTab === 'restaurants' ? 'bg-zinc-800 text-white' : 'text-zinc-400'}
                >
                    <Store size={16} className="mr-2" />
                    合作餐厅
                </Button>
                <Button
                    variant={activeTab === 'categories' ? 'secondary' : 'ghost'}
                    onClick={() => setActiveTab('categories')}
                    className={activeTab === 'categories' ? 'bg-amber-900/40 text-amber-500' : 'text-zinc-400'}
                >
                    <Settings2 size={16} className="mr-2" />
                    分类设置
                </Button>
            </div>

            {/* Content Area */}
            <div className="flex-1 bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden p-6 flex flex-col">
                {activeTab === 'foods' && <FoodsManager />}
                {activeTab === 'recipes' && <RecipesManager />}
                {activeTab === 'restaurants' && <RestaurantsManager />}
                {activeTab === 'categories' && <CategoriesManager />}
            </div>
        </div>
    );
}
