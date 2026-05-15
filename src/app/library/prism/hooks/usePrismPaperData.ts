import useSWR from 'swr';
import { supabase } from '@/lib/supabaseClient';
import type { PaperDataLinks, PrismDataset, PrismMetric } from '../types';

export interface PaperDataBundle {
    datasets: PrismDataset[];
    metrics: PrismMetric[];
    /** paper_id -> links */
    linksByPaper: Record<string, PaperDataLinks>;
    /** paper_id -> data_notes */
    notesByPaper: Record<string, string>;
    /** dataset_id -> paper count */
    datasetUsageCount: Record<string, number>;
    metricUsageCount: Record<string, number>;
}

async function fetchPaperDataBundle(): Promise<PaperDataBundle> {
    const [
        { data: datasets, error: dErr },
        { data: metrics, error: mErr },
        { data: paperDatasets, error: pdErr },
        { data: paperMetrics, error: pmErr },
        { data: papers, error: pErr },
    ] = await Promise.all([
        supabase.from('prism_datasets').select('*').order('sort_order'),
        supabase.from('prism_metrics').select('*').order('sort_order'),
        supabase.from('prism_paper_datasets').select('paper_id, dataset_id'),
        supabase.from('prism_paper_metrics').select('paper_id, metric_id'),
        supabase.from('prism_papers').select('id, data_notes'),
    ]);

    if (dErr) throw dErr;
    if (mErr) throw mErr;
    if (pdErr) throw pdErr;
    if (pmErr) throw pmErr;
    if (pErr) throw pErr;

    const linksByPaper: Record<string, PaperDataLinks> = {};
    const notesByPaper: Record<string, string> = {};
    const datasetUsageCount: Record<string, number> = {};
    const metricUsageCount: Record<string, number> = {};

    (papers || []).forEach((p: { id: string; data_notes?: string }) => {
        linksByPaper[p.id] = { datasetIds: [], metricIds: [] };
        notesByPaper[p.id] = p.data_notes || '';
    });

    (paperDatasets || []).forEach((row: { paper_id: string; dataset_id: string }) => {
        if (!linksByPaper[row.paper_id]) {
            linksByPaper[row.paper_id] = { datasetIds: [], metricIds: [] };
        }
        linksByPaper[row.paper_id].datasetIds.push(row.dataset_id);
        datasetUsageCount[row.dataset_id] = (datasetUsageCount[row.dataset_id] || 0) + 1;
    });

    (paperMetrics || []).forEach((row: { paper_id: string; metric_id: string }) => {
        if (!linksByPaper[row.paper_id]) {
            linksByPaper[row.paper_id] = { datasetIds: [], metricIds: [] };
        }
        linksByPaper[row.paper_id].metricIds.push(row.metric_id);
        metricUsageCount[row.metric_id] = (metricUsageCount[row.metric_id] || 0) + 1;
    });

    return {
        datasets: (datasets || []) as PrismDataset[],
        metrics: (metrics || []) as PrismMetric[],
        linksByPaper,
        notesByPaper,
        datasetUsageCount,
        metricUsageCount,
    };
}

export function usePrismPaperData() {
    const { data, error, isLoading, mutate } = useSWR('prism_paper_data_bundle', fetchPaperDataBundle);

    return {
        bundle: data ?? {
            datasets: [],
            metrics: [],
            linksByPaper: {},
            notesByPaper: {},
            datasetUsageCount: {},
            metricUsageCount: {},
        },
        isLoading,
        isError: error,
        mutate,
    };
}

export async function savePaperDataNotes(paperId: string, dataNotes: string) {
    const { error } = await supabase.from('prism_papers').update({ data_notes: dataNotes }).eq('id', paperId);
    if (error) throw error;
}

export async function togglePaperDataset(paperId: string, datasetId: string, linked: boolean) {
    if (linked) {
        const { error } = await supabase
            .from('prism_paper_datasets')
            .delete()
            .eq('paper_id', paperId)
            .eq('dataset_id', datasetId);
        if (error) throw error;
    } else {
        const { error } = await supabase.from('prism_paper_datasets').insert({ paper_id: paperId, dataset_id: datasetId });
        if (error) throw error;
    }
}

export async function togglePaperMetric(paperId: string, metricId: string, linked: boolean) {
    if (linked) {
        const { error } = await supabase
            .from('prism_paper_metrics')
            .delete()
            .eq('paper_id', paperId)
            .eq('metric_id', metricId);
        if (error) throw error;
    } else {
        const { error } = await supabase.from('prism_paper_metrics').insert({ paper_id: paperId, metric_id: metricId });
        if (error) throw error;
    }
}

export async function createDataset(name: string, formatNote = '') {
    const { data, error } = await supabase
        .from('prism_datasets')
        .insert([{ name: name.trim(), format_note: formatNote }])
        .select()
        .single();
    if (error) throw error;
    return data as PrismDataset;
}

export async function createMetric(name: string, formatNote = '') {
    const { data, error } = await supabase
        .from('prism_metrics')
        .insert([{ name: name.trim(), format_note: formatNote }])
        .select()
        .single();
    if (error) throw error;
    return data as PrismMetric;
}

export async function updateDataset(id: string, payload: { name: string; format_note: string }) {
    const { error } = await supabase
        .from('prism_datasets')
        .update({ name: payload.name.trim(), format_note: payload.format_note })
        .eq('id', id);
    if (error) throw error;
}

export async function updateMetric(id: string, payload: { name: string; format_note: string }) {
    const { error } = await supabase
        .from('prism_metrics')
        .update({ name: payload.name.trim(), format_note: payload.format_note })
        .eq('id', id);
    if (error) throw error;
}

export async function deleteDataset(id: string) {
    const { error } = await supabase.from('prism_datasets').delete().eq('id', id);
    if (error) throw error;
}

export async function deleteMetric(id: string) {
    const { error } = await supabase.from('prism_metrics').delete().eq('id', id);
    if (error) throw error;
}

export function paperHasData(
    paperId: string,
    bundle: Pick<PaperDataBundle, 'notesByPaper' | 'linksByPaper'>,
): boolean {
    const notes = (bundle.notesByPaper[paperId] || '').trim();
    const links = bundle.linksByPaper[paperId];
    return Boolean(notes || (links?.datasetIds.length ?? 0) > 0 || (links?.metricIds.length ?? 0) > 0);
}
