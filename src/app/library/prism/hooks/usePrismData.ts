import { useState, useEffect } from 'react';
import useSWR from 'swr';
import { supabase } from '@/lib/supabaseClient';
import { PaperDetail, ProjectData, ProjectCategory, ProjectInsight, ProjectOutcome, ProjectTimelineEvent } from '../types';

// ==========================================
// API FETCHERS
// ==========================================

const fetchPapers = async (): Promise<PaperDetail[]> => {
    // 1. 获取论文主表
    const { data: papers, error: papersError } = await supabase
        .from('prism_papers')
        .select('*')
        .order('created_at', { ascending: false });
    
    if (papersError) throw papersError;

    // 2. 获取所有关联的字典数据及关系表
    const [
        { data: figures, error: figErr },
        { data: relProj, error: relProjErr },
        { data: projects, error: projErr },
        { data: relDir, error: relDirErr },
        { data: directions, error: dirErr },
        { data: relType, error: relTypeErr },
        { data: types, error: typeErr },
    ] = await Promise.all([
        supabase.from('prism_paper_figures').select('*').order('sort_order'),
        supabase.from('prism_paper_projects').select('*'),
        supabase.from('prism_projects').select('id, name'),
        supabase.from('prism_paper_directions').select('*'),
        supabase.from('prism_directions').select('id, name'),
        supabase.from('prism_paper_types').select('*'),
        supabase.from('prism_types').select('id, name'),
    ]);

    if (figErr) throw figErr;
    if (relProjErr) throw relProjErr;
    if (projErr) throw projErr;
    if (relDirErr) throw relDirErr;
    if (dirErr) throw dirErr;
    if (relTypeErr) throw relTypeErr;
    if (typeErr) throw typeErr;

    // 建立映射表加速查询
    const projMap = new Map(projects.map((p: any) => [p.id, p.name]));
    const dirMap = new Map(directions.map((d: any) => [d.id, d.name]));
    const typeMap = new Map(types.map((t: any) => [t.id, t.name]));

    // 3. 组合数据
    return papers.map((p: any) => {
        // 图表
        const pFigs = figures
            .filter((f: any) => f.paper_id === p.id)
            .map((f: any) => ({ url: f.url, description: f.description }));
            
        // 提取关系
        const pProjects = relProj
            .filter((rel: any) => rel.paper_id === p.id)
            .map((rel: any) => projMap.get(rel.project_id))
            .filter(Boolean);
            
        const pDirections = relDir
            .filter((rel: any) => rel.paper_id === p.id)
            .map((rel: any) => dirMap.get(rel.direction_id))
            .filter(Boolean);
            
        const pTypes = relType
            .filter((rel: any) => rel.paper_id === p.id)
            .map((rel: any) => typeMap.get(rel.type_id))
            .filter(Boolean);

        return {
            ...p,
            projects: pProjects,
            directions: pDirections,
            types: pTypes,
            figures: pFigs.length > 0 ? pFigs : undefined,
        } as PaperDetail;
    });
};

const fetchProjects = async (): Promise<ProjectData[]> => {
    const results = await Promise.all([
        supabase.from('prism_projects').select('*').order('sort_order'),
        supabase.from('prism_project_timeline').select('*').order('sort_order'),
        supabase.from('prism_project_insights').select('*').order('sort_order'),
        supabase.from('prism_project_outcomes').select('*').order('sort_order'),
        supabase.from('prism_insight_papers').select('*'),
        supabase.from('prism_outcome_papers').select('*'),
    ]);

    const [
        { data: projects, error: pErr },
        { data: timeline, error: tErr },
        { data: insights, error: iErr },
        { data: outcomes, error: oErr },
        { data: insightPapers, error: ipErr },
        { data: outcomePapers, error: opErr },
    ] = results;

    if (pErr) throw pErr;
    if (tErr) throw tErr;
    if (iErr) throw iErr;
    if (oErr) throw oErr;
    if (ipErr) throw ipErr;
    if (opErr) throw opErr;

    return projects.map((proj: any) => {
        const pTimeline = timeline
            .filter((t: any) => t.project_id === proj.id)
            .map((t: any) => ({
                id: t.id,
                date: t.date,
                content: t.content
            }));

        const pInsightsData = insights.filter((i: any) => i.project_id === proj.id);
        const pOutcomesData = outcomes.filter((o: any) => o.project_id === proj.id);

        // Map junction data
        const insightIdToPapers = new Map();
        insightPapers.forEach((ip: any) => {
            if (!insightIdToPapers.has(ip.insight_id)) insightIdToPapers.set(ip.insight_id, []);
            insightIdToPapers.get(ip.insight_id).push(ip.paper_id);
        });

        const outcomeIdToPapers = new Map();
        outcomePapers.forEach((op: any) => {
            if (!outcomeIdToPapers.has(op.outcome_id)) outcomeIdToPapers.set(op.outcome_id, []);
            outcomeIdToPapers.get(op.outcome_id).push(op.paper_id);
        });

        // 分组启示
        const insCats = Array.from(new Set(pInsightsData.map((i: any) => i.category)));
        const pInsights: ProjectCategory<ProjectInsight>[] = insCats.map(cat => ({
            category: cat as string,
            items: pInsightsData.filter((i: any) => i.category === cat).map((i: any) => ({
                id: i.id,
                content: i.content,
                paper_ids: insightIdToPapers.get(i.id) || [],
                created_at: i.created_at
            }))
        }));

        // 分组现有成果
        const outCats = Array.from(new Set(pOutcomesData.map((o: any) => o.category)));
        const pOutcomes: ProjectCategory<ProjectOutcome>[] = outCats.map(cat => ({
            category: cat as string,
            items: pOutcomesData.filter((o: any) => o.category === cat).map((o: any) => ({
                id: o.id,
                content: o.content,
                paper_ids: outcomeIdToPapers.get(o.id) || [],
                created_at: o.created_at
            }))
        }));

        return {
            id: proj.id,
            name: proj.name,
            timeline: pTimeline,
            insights: pInsights,
            outcomes: pOutcomes
        };
    });
};

// ==========================================
// CUSTOM HOOKS
// ==========================================

export function usePrismPapers() {
    const { data: papers, error, isLoading, mutate } = useSWR('prism_papers_all', fetchPapers);
    return { 
        papers: papers || [], 
        isLoading, 
        isError: error, 
        mutate 
    };
}

export function usePrismProjects() {
    const { data: projects, error, isLoading, mutate } = useSWR('prism_projects_all', fetchProjects);
    return { 
        projects: projects || [], 
        isLoading, 
        isError: error, 
        mutate 
    };
}

// ==========================================
// COURSE NOTES - API FETCHERS
// ==========================================

import { Course, CourseChapter, CourseFormula } from '../types';

const fetchCourses = async (): Promise<Course[]> => {
    const { data, error } = await supabase
        .from('prism_courses')
        .select('*')
        .order('sort_order');
    if (error) throw error;
    return data as Course[];
};

const fetchCourseChapters = async (courseId: string): Promise<CourseChapter[]> => {
    // Only fetch id, title, sort_order, created_at — NOT the heavy notes field
    const { data, error } = await supabase
        .from('prism_course_chapters')
        .select('id, course_id, title, sort_order, created_at')
        .eq('course_id', courseId)
        .order('sort_order');
    if (error) throw error;
    return data as CourseChapter[];
};

const fetchChapterContent = async (chapterId: string): Promise<CourseChapter> => {
    const { data, error } = await supabase
        .from('prism_course_chapters')
        .select('*')
        .eq('id', chapterId)
        .single();
    if (error) throw error;
    return data as CourseChapter;
};

const fetchCourseFormulas = async (courseId: string): Promise<CourseFormula[]> => {
    const { data, error } = await supabase
        .from('prism_course_formulas')
        .select('*')
        .eq('course_id', courseId)
        .order('sort_order');
    if (error) throw error;
    return data as CourseFormula[];
};

// ==========================================
// COURSE NOTES - CUSTOM HOOKS
// ==========================================

export function useCourses() {
    const { data, error, isLoading, mutate } = useSWR('prism_courses_all', fetchCourses);
    return { courses: data || [], isLoading, isError: error, mutate };
}

export function useCourseChapters(courseId: string | null) {
    const { data, error, isLoading, mutate } = useSWR(
        courseId ? `prism_chapters_${courseId}` : null,
        () => fetchCourseChapters(courseId!)
    );
    return { chapters: data || [], isLoading, isError: error, mutate };
}

export function useChapterContent(chapterId: string | null) {
    const { data, error, isLoading, mutate } = useSWR(
        chapterId ? `prism_chapter_content_${chapterId}` : null,
        () => fetchChapterContent(chapterId!)
    );
    return { chapter: data || null, isLoading, isError: error, mutate };
}

export function useCourseFormulas(courseId: string | null) {
    const { data, error, isLoading, mutate } = useSWR(
        courseId ? `prism_formulas_${courseId}` : null,
        () => fetchCourseFormulas(courseId!)
    );
    return { formulas: data || [], isLoading, isError: error, mutate };
}
