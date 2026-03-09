import { MapPin, Store, CookingPot, X, SortAsc } from 'lucide-react';

export type Food = {
    id: number;
    name: string;
    category: string;
    rating: number;
    image: string;
    notes: string;
};

export type Recipe = {
    id: number;
    name: string;
    category: string;
    type: 'can_cook' | 'favorite';
    rating: number;
    image: string;
    notes: string;
    restaurantId?: number;
    linkedFoods: number[];
};

export type RestaurantDish = {
    id: number;
    name: string;
    image: string;
    recipeId?: number;
};

export type Restaurant = {
    id: number;
    name: string;
    category: string;
    address: string;
    rating: number;
    notes: string;
    region: string;
    images: string[];
    dishes: RestaurantDish[];
};

export type Category = {
    id: number;
    module: string;
    name: string;
    icon?: string;
    sort_order: number;
};

export type TabId = 'foods' | 'recipes' | 'restaurants';
