import { useState, useEffect } from 'react';
import useSWR from 'swr';
import { supabase } from '@/lib/supabaseClient';
import { Food, Recipe, Restaurant, Category } from '../types';

// --- 数据获取函数 ---
const fetchFoods = async () => {
    const { data, error } = await supabase.from('diet_foods').select('*').order('id');
    if (error) throw error;
    return data.map(d => ({ ...d, image: d.image_url })) as Food[];
};

const fetchRecipes = async () => {
    const { data: recipes, error: recipesError } = await supabase.from('diet_recipes').select('*').order('id');
    if (recipesError) throw recipesError;
    const { data: relations, error: relError } = await supabase.from('diet_recipe_foods').select('*');
    if (relError) throw relError;

    return recipes.map(r => ({
        ...r,
        image: r.image_url,
        restaurantId: r.restaurant_id || undefined,
        linkedFoods: relations.filter((rel: any) => rel.recipe_id === r.id).map((rel: any) => rel.food_id)
    })) as Recipe[];
};

const fetchRestaurants = async () => {
    const { data: restaurants, error: restError } = await supabase.from('diet_restaurants').select('*').order('id');
    if (restError) throw restError;
    const { data: dishes, error: dishError } = await supabase.from('diet_restaurant_dishes').select('*').order('sort_order');
    if (dishError) throw dishError;

    return restaurants.map(r => ({
        ...r,
        dishes: dishes.filter((d: any) => d.restaurant_id === r.id)
            .map((d: any) => ({ ...d, image: d.image_url, recipeId: d.recipe_id || undefined }))
    })) as Restaurant[];
};

const fetchCategories = async () => {
    const { data, error } = await supabase.from('diet_categories').select('*').order('module').order('sort_order');
    if (error) throw error;
    return data as Category[];
};

// --- 自定义 Hooks ---

export function useDietData() {
    const { data: foods, error: errFoods } = useSWR('diet_foods', fetchFoods);
    const { data: recipes, error: errRecipes } = useSWR('diet_recipes', fetchRecipes);
    const { data: restaurants, error: errRests } = useSWR('diet_restaurants', fetchRestaurants);
    const { data: categories, error: errCats } = useSWR('diet_categories', fetchCategories);

    return {
        foods: foods || [],
        recipes: recipes || [],
        restaurants: restaurants || [],
        categories: categories || [],
        isLoading: !foods || !recipes || !restaurants || !categories,
        isError: errFoods || errRecipes || errRests || errCats
    };
}

// --- 自动计算分页 Hook ---
export function useAutoPageSize(containerRef: React.RefObject<HTMLDivElement | null>, estimatedRowHeight: number, columns: number, fallback: number) {
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
