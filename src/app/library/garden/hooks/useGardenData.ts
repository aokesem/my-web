import useSWR from 'swr';
import { supabase } from '@/lib/supabaseClient';
import type { GardenCategory, GardenPost, GardenChapter } from '../types';

// ============================================================
// API FETCHERS
// ============================================================

const fetchCategories = async (): Promise<GardenCategory[]> => {
    const { data, error } = await supabase
        .from('garden_categories')
        .select('*')
        .order('sort_order', { ascending: true });
    if (error) throw error;
    return data as GardenCategory[];
};

const fetchPosts = async (isAdmin: boolean): Promise<GardenPost[]> => {
    let query = supabase
        .from('garden_posts')
        .select('id, slug, title, tags, category, status, created_at, published_at')
        .order('created_at', { ascending: false });

    if (!isAdmin) {
        query = query.eq('status', 'Published');
    }

    const { data, error } = await query;
    if (error) throw error;
    return data as GardenPost[];
};

const fetchChapters = async (postId: string): Promise<GardenChapter[]> => {
    // 列表查询不含 notes 重字段
    const { data, error } = await supabase
        .from('garden_chapters')
        .select('id, post_id, title, sort_order, created_at')
        .eq('post_id', postId)
        .order('sort_order', { ascending: true });
    if (error) throw error;
    return data as GardenChapter[];
};

const fetchChapterContent = async (chapterId: string): Promise<GardenChapter> => {
    const { data, error } = await supabase
        .from('garden_chapters')
        .select('*')
        .eq('id', chapterId)
        .single();
    if (error) throw error;
    return data as GardenChapter;
};

// ============================================================
// CUSTOM HOOKS
// ============================================================

export function useGardenCategories() {
    const { data, error, isLoading, mutate } = useSWR(
        'garden_categories',
        fetchCategories
    );
    return { categories: data || [], isLoading, isError: error, mutate };
}

export function useGardenPosts(isAdmin: boolean) {
    const { data, error, isLoading, mutate } = useSWR(
        `garden_posts_${isAdmin ? 'admin' : 'public'}`,
        () => fetchPosts(isAdmin)
    );
    return { posts: data || [], isLoading, isError: error, mutate };
}

export function useGardenChapters(postId: string | null) {
    const { data, error, isLoading, mutate } = useSWR(
        postId ? `garden_chapters_${postId}` : null,
        () => fetchChapters(postId!)
    );
    return { chapters: data || [], isLoading, isError: error, mutate };
}

export function useChapterContent(chapterId: string | null) {
    const { data, error, isLoading, mutate } = useSWR(
        chapterId ? `garden_chapter_content_${chapterId}` : null,
        () => fetchChapterContent(chapterId!)
    );
    return { chapter: data || null, isLoading, isError: error, mutate };
}
