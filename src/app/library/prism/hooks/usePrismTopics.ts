import useSWR from 'swr';
import { supabase } from '@/lib/supabaseClient';
import type { PrismTopic, PrismTopicItemType, PrismTopicLink } from '../types';

export interface TopicCourseSummary {
    id: string;
    name: string;
    name_en?: string;
    sort_order: number;
}

export interface TopicProjectSummary {
    id: string;
    name: string;
    sort_order: number;
}

export interface TopicLanguageSummary {
    id: string;
    name: string;
    sort_order: number;
}

export interface PrismTopicMatrixData {
    topics: PrismTopic[];
    links: PrismTopicLink[];
    courses: TopicCourseSummary[];
    projects: TopicProjectSummary[];
    languages: TopicLanguageSummary[];
}

const EMPTY_MATRIX_DATA: PrismTopicMatrixData = {
    topics: [],
    links: [],
    courses: [],
    projects: [],
    languages: [],
};

async function fetchPrismTopicMatrix(): Promise<PrismTopicMatrixData> {
    const [
        { data: topics, error: topicsErr },
        { data: links, error: linksErr },
        { data: courses, error: coursesErr },
        { data: projects, error: projectsErr },
        { data: languages, error: languagesErr },
    ] = await Promise.all([
        supabase
            .from('prism_topics')
            .select('id, name, sort_order, created_at, updated_at')
            .order('sort_order', { ascending: true })
            .order('created_at', { ascending: true }),
        supabase
            .from('prism_topic_links')
            .select('id, topic_id, item_type, item_id, sort_order, created_at')
            .order('sort_order', { ascending: true })
            .order('created_at', { ascending: true }),
        supabase
            .from('prism_courses')
            .select('id, name, name_en, sort_order')
            .order('sort_order', { ascending: true })
            .order('created_at', { ascending: true }),
        supabase
            .from('prism_projects')
            .select('id, name, sort_order')
            .order('sort_order', { ascending: true })
            .order('created_at', { ascending: true }),
        supabase
            .from('prism_codebase_languages')
            .select('id, name, sort_order')
            .order('sort_order', { ascending: true })
            .order('created_at', { ascending: true }),
    ]);

    if (topicsErr) throw topicsErr;
    if (linksErr) throw linksErr;
    if (coursesErr) throw coursesErr;
    if (projectsErr) throw projectsErr;
    if (languagesErr) throw languagesErr;

    return {
        topics: (topics || []) as PrismTopic[],
        links: (links || []) as PrismTopicLink[],
        courses: (courses || []) as TopicCourseSummary[],
        projects: (projects || []) as TopicProjectSummary[],
        languages: (languages || []) as TopicLanguageSummary[],
    };
}

/** 按需拉取主题聚合矩阵及三大模块一级条目 */
export function usePrismTopicMatrix(enabled: boolean) {
    const { data, error, isLoading, mutate } = useSWR(
        enabled ? 'prism_topic_matrix' : null,
        fetchPrismTopicMatrix
    );

    return {
        data: data ?? EMPTY_MATRIX_DATA,
        isLoading,
        isError: error,
        mutate,
    };
}

export async function createPrismTopic(name: string, sortOrder: number): Promise<PrismTopic> {
    const { data, error } = await supabase
        .from('prism_topics')
        .insert({ name: name.trim(), sort_order: sortOrder })
        .select('id, name, sort_order, created_at, updated_at')
        .single();
    if (error) throw error;
    return data as PrismTopic;
}

export async function updatePrismTopic(
    id: string,
    updates: { name?: string; sort_order?: number }
) {
    const payload: { name?: string; sort_order?: number; updated_at: string } = {
        updated_at: new Date().toISOString(),
    };
    if (updates.name !== undefined) payload.name = updates.name.trim();
    if (updates.sort_order !== undefined) payload.sort_order = updates.sort_order;

    const { error } = await supabase.from('prism_topics').update(payload).eq('id', id);
    if (error) throw error;
}

/** 互换相邻两个主题的排序（topicA 原先在 topicB 之前；若 sort_order 相同则赋差异值确保生效） */
export async function swapPrismTopicOrder(topicA: PrismTopic, topicB: PrismTopic) {
    const nextOrderA = topicA.sort_order === topicB.sort_order ? topicB.sort_order + 1 : topicB.sort_order;
    const nextOrderB = topicA.sort_order;
    const now = new Date().toISOString();

    const [resA, resB] = await Promise.all([
        supabase.from('prism_topics').update({ sort_order: nextOrderA, updated_at: now }).eq('id', topicA.id),
        supabase.from('prism_topics').update({ sort_order: nextOrderB, updated_at: now }).eq('id', topicB.id),
    ]);
    if (resA.error) throw resA.error;
    if (resB.error) throw resB.error;
}

export async function addPrismTopicLink(
    topicId: string,
    itemType: PrismTopicItemType,
    itemId: string,
    sortOrder: number
): Promise<PrismTopicLink> {
    const { data, error } = await supabase
        .from('prism_topic_links')
        .insert({
            topic_id: topicId,
            item_type: itemType,
            item_id: itemId,
            sort_order: sortOrder,
        })
        .select('id, topic_id, item_type, item_id, sort_order, created_at')
        .single();
    if (error) throw error;
    return data as PrismTopicLink;
}

export async function removePrismTopicLink(linkId: string) {
    const { error } = await supabase.from('prism_topic_links').delete().eq('id', linkId);
    if (error) throw error;
}
