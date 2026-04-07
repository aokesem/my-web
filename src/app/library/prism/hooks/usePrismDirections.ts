import useSWR from 'swr';
import { supabase } from '@/lib/supabaseClient';
import { ResearchQuestion, InnovationPoint, DirectionNote } from '../types';

export interface NoteGroup {
    title: DirectionNote;       // parent_id = null → this is the group title
    children: DirectionNote[];  // parent_id = title.id
}

interface DirectionData {
    questions: ResearchQuestion[];
    innovationPoints: InnovationPoint[];
    leftNotes: DirectionNote[];
    rightNoteGroups: NoteGroup[];
}

const fetchDirectionData = async (projectId: string): Promise<DirectionData> => {
    const [
        { data: questions, error: qErr },
        { data: questionPapers, error: qpErr },
        { data: innovations, error: iErr },
        { data: notes, error: nErr },
    ] = await Promise.all([
        supabase.from('prism_research_questions').select('*').eq('project_id', projectId).order('sort_order'),
        supabase.from('prism_question_papers').select('*'),
        supabase.from('prism_innovation_points').select('*').order('sort_order'),
        supabase.from('prism_direction_notes').select('*').eq('project_id', projectId).order('sort_order'),
    ]);

    if (qErr) throw qErr;
    if (qpErr) throw qpErr;
    if (iErr) throw iErr;
    if (nErr) throw nErr;

    // Build question → paper_ids mapping
    const qIds = new Set((questions || []).map((q: any) => q.id));
    const qPaperMap = new Map<string, string[]>();
    (questionPapers || []).forEach((qp: any) => {
        if (!qIds.has(qp.question_id)) return;
        if (!qPaperMap.has(qp.question_id)) qPaperMap.set(qp.question_id, []);
        qPaperMap.get(qp.question_id)!.push(qp.paper_id);
    });

    const mappedQuestions: ResearchQuestion[] = (questions || []).map((q: any) => ({
        ...q,
        paper_ids: qPaperMap.get(q.id) || [],
    }));

    // Filter innovations to current project's questions
    const mappedInnovations: InnovationPoint[] = (innovations || []).filter((i: any) => qIds.has(i.question_id));

    const allNotes = (notes || []) as DirectionNote[];
    const leftNotes = allNotes.filter(n => n.column_side === 'left');

    // Build grouped right notes
    const rightAll = allNotes.filter(n => n.column_side === 'right');
    const titles = rightAll.filter(n => !n.parent_id);
    const childMap = new Map<string, DirectionNote[]>();
    rightAll.filter(n => n.parent_id).forEach(n => {
        if (!childMap.has(n.parent_id!)) childMap.set(n.parent_id!, []);
        childMap.get(n.parent_id!)!.push(n);
    });
    const rightNoteGroups: NoteGroup[] = titles.map(t => ({
        title: t,
        children: childMap.get(t.id) || [],
    }));

    return {
        questions: mappedQuestions,
        innovationPoints: mappedInnovations,
        leftNotes,
        rightNoteGroups,
    };
};

export function usePrismDirections(projectId: string | null) {
    const { data, error, isLoading, mutate } = useSWR(
        projectId ? `prism_directions_${projectId}` : null,
        () => fetchDirectionData(projectId!)
    );

    return {
        questions: data?.questions || [],
        innovationPoints: data?.innovationPoints || [],
        leftNotes: data?.leftNotes || [],
        rightNoteGroups: data?.rightNoteGroups || [],
        isLoading,
        isError: error,
        mutate,
    };
}
