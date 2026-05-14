import useSWR from 'swr';
import { supabase } from '@/lib/supabaseClient';
import type {
    ProjectAgendaDriveItem,
    ProjectAgendaItemsBundle,
    ProjectAgendaSurveyItem,
    ProjectAgendaSynthesisItem,
    ProjectAgendaVersion,
} from '../types';

async function fetchAgendaVersions(projectId: string): Promise<ProjectAgendaVersion[]> {
    const { data, error } = await supabase
        .from('prism_project_agenda_versions')
        .select('id, project_id, label, sort_order, created_at')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as ProjectAgendaVersion[];
}

export function useProjectAgenda(projectId: string | null) {
    const { data, error, isLoading, mutate } = useSWR(
        projectId ? `prism_agenda_${projectId}` : null,
        () => fetchAgendaVersions(projectId!)
    );

    return {
        versions: data ?? [],
        isLoading,
        isError: error,
        mutate,
    };
}

async function fetchAgendaVersionItems(versionId: string): Promise<ProjectAgendaItemsBundle> {
    const [{ data: driveRows, error: dErr }, { data: surveyRows, error: sErr }, { data: synthRows, error: yErr }] =
        await Promise.all([
            supabase
                .from('prism_agenda_drive_items')
                .select('*')
                .eq('agenda_version_id', versionId)
                .order('sort_order', { ascending: true }),
            supabase
                .from('prism_agenda_survey_items')
                .select('*')
                .eq('agenda_version_id', versionId)
                .order('sort_order', { ascending: true }),
            supabase
                .from('prism_agenda_synthesis_items')
                .select('*')
                .eq('agenda_version_id', versionId)
                .order('sort_order', { ascending: true }),
        ]);

    if (dErr) throw dErr;
    if (sErr) throw sErr;
    if (yErr) throw yErr;

    const drive = (driveRows || []) as ProjectAgendaDriveItem[];
    const survey = (surveyRows || []) as ProjectAgendaSurveyItem[];
    const synthesisBase = (synthRows || []) as Omit<ProjectAgendaSynthesisItem, 'insight_ref_ids'>[];

    const synthIds = synthesisBase.map((r) => r.id);
    const insightBySynth = new Map<string, string[]>();
    if (synthIds.length > 0) {
        const { data: refRows, error: rErr } = await supabase
            .from('prism_synthesis_insight_refs')
            .select('synthesis_item_id, insight_id')
            .in('synthesis_item_id', synthIds);
        if (rErr) throw rErr;
        (refRows || []).forEach((row: { synthesis_item_id: string; insight_id: string }) => {
            if (!insightBySynth.has(row.synthesis_item_id)) insightBySynth.set(row.synthesis_item_id, []);
            insightBySynth.get(row.synthesis_item_id)!.push(row.insight_id);
        });
    }

    const synthesis: ProjectAgendaSynthesisItem[] = synthesisBase.map((row) => ({
        ...row,
        insight_ref_ids: insightBySynth.get(row.id) ?? [],
    }));

    return { drive, survey, synthesis };
}

export function useAgendaVersionItems(versionId: string | null) {
    const { data, error, isLoading, mutate } = useSWR(
        versionId ? `prism_agenda_items_${versionId}` : null,
        () => fetchAgendaVersionItems(versionId!)
    );

    return {
        bundle: data ?? { drive: [], survey: [], synthesis: [] },
        isLoading,
        isError: error,
        mutate,
    };
}
