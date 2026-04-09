import { useState, useCallback } from 'react';
import useSWR from 'swr';
import { supabase } from '@/lib/supabaseClient';
import { CodebaseLanguage, CodebaseNode } from '../types';

export function useCodebaseLanguages() {
    const fetcher = async () => {
        const { data, error } = await supabase
            .from('prism_codebase_languages')
            .select('*')
            .order('sort_order');
        if (error) throw error;
        return data as CodebaseLanguage[];
    };

    const { data, error, isLoading, mutate } = useSWR('prism_codebase_languages', fetcher);
    return { languages: data || [], isLoading, isError: error, mutate };
}

export function useCodebaseNodes(languageId: string | null) {
    const fetcher = async () => {
        if (!languageId) return [];
        const { data, error } = await supabase
            .from('prism_codebase_nodes')
            .select('*')
            .eq('language_id', languageId)
            .order('sort_order');
        if (error) throw error;
        return data as CodebaseNode[];
    };

    const { data, error, isLoading, mutate } = useSWR(
        languageId ? `prism_codebase_nodes_${languageId}` : null,
        fetcher
    );

    return { nodes: data || [], isLoading, isError: error, mutate };
}
