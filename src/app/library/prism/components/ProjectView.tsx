import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';

// ============================================================
// TYPES
// ============================================================
import { ProjectData, ProjectCategory, ProjectInsight, ProjectTimelineEvent, PaperDetail } from '../types';

// ============================================================
// SUB-COMPONENTS
// ============================================================
import { ProjectHeader } from './ProjectBoard/ProjectHeader';
import { ResearchAgendaColumn } from './ProjectBoard/ResearchAgendaColumn';
import { PapersColumn } from './ProjectBoard/PapersColumn';
import { InsightsColumn } from './ProjectBoard/InsightsColumn';
import { handleBoldShortcutUtil } from './ProjectBoard/utils';
import { useProjectAgenda, useAgendaVersionItems } from '../hooks/useProjectAgenda';

export type { ProjectData, ProjectCategory, ProjectInsight, ProjectTimelineEvent };

interface ProjectViewProps {
    projects: ProjectData[];
    allPapers: PaperDetail[];
    onOpenPaper: (id: string) => void;
    onUpdateProjects: () => Promise<void>;
    isAdmin: boolean;
}

export default function ProjectView({ projects, allPapers, onOpenPaper, onUpdateProjects, isAdmin }: ProjectViewProps) {
    const [activeProjectName, setActiveProjectName] = useState<string>(projects[0]?.name || '');
    const [isTimelineOpen, setIsTimelineOpen] = useState(false);
    const [selectedTimelineIndex, setSelectedTimelineIndex] = useState<number | null>(null);
    const [paperGroupMode, setPaperGroupMode] = useState<'direction' | 'type'>('direction');

    // Editing State
    const [editingId, setEditingId] = useState<string | null>(null);
    const [tempContent, setTempContent] = useState('');
    const [tempTitle, setTempTitle] = useState('');
    const [tempPaperIds, setTempPaperIds] = useState<string[]>([]);
    const [tempSurveyIds, setTempSurveyIds] = useState<string[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [selectedDirection, setSelectedDirection] = useState<string | null>(null);

    // Paper adding state
    const [isAddingPaper, setIsAddingPaper] = useState(false);
    const [addPaperDirection, setAddPaperDirection] = useState<string | null>(null);

    // New insight creation state
    const [creatingIn, setCreatingIn] = useState<{ category: string } | null>(null);
    const [newItemContent, setNewItemContent] = useState('');
    const [newItemTitle, setNewItemTitle] = useState('');
    const [newItemPaperIds, setNewItemPaperIds] = useState<string[]>([]);
    const [newItemSurveyIds, setNewItemSurveyIds] = useState<string[]>([]);
    const [newItemDirection, setNewItemDirection] = useState<string | null>(null);

    const requireAdmin = useCallback(() => {
        if (!isAdmin) {
            toast.warning('只有本人才能修改认知棱镜。');
            return false;
        }
        return true;
    }, [isAdmin]);

    const activeProject = projects.find(p => p.name === activeProjectName);

    const { versions: agendaVersions, isLoading: agendaVersionsLoading } = useProjectAgenda(activeProject?.id ?? null);
    const [agendaVersionId, setAgendaVersionId] = useState<string | null>(null);

    const agendaVersionKey = useMemo(() => agendaVersions.map((v) => v.id).join(','), [agendaVersions]);

    useEffect(() => {
        if (!activeProject) {
            setAgendaVersionId(null);
            return;
        }
        if (agendaVersions.length === 0) {
            setAgendaVersionId(null);
            return;
        }
        setAgendaVersionId((prev) =>
            prev && agendaVersions.some((v) => v.id === prev) ? prev : agendaVersions[0].id
        );
    }, [activeProject?.id, agendaVersionKey]);

    const { bundle: agendaBundle, mutate: mutateAgendaItems } = useAgendaVersionItems(agendaVersionId);

    const surveyItemOptions = useMemo(
        () => agendaBundle.survey.map((s) => ({ id: s.id, title: s.title?.trim() || '（无标题）' })),
        [agendaBundle.survey]
    );

    const allInsightTitles = useMemo(() => {
        if (!activeProject) return [];
        return activeProject.insights.flatMap((g) => g.items.map((i) => ({ id: i.id, title: i.title })));
    }, [activeProject]);

    // Shortcuts
    const handleBoldShortcut = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        handleBoldShortcutUtil(e, setTempContent);
    }, []);

    // === API Handlers ===
    const handleSave = async () => {
        if (!requireAdmin()) return;
        if (!editingId) return;
        setIsSaving(true);
        try {
            const { error: mainErr } = await supabase
                .from('prism_project_insights')
                .update({ content: tempContent, title: tempTitle.trim() })
                .eq('id', editingId);
            if (mainErr) throw mainErr;

            const { error: delErr } = await supabase
                .from('prism_insight_papers')
                .delete()
                .eq('insight_id', editingId);
            if (delErr) throw delErr;

            if (tempPaperIds.length > 0) {
                const { error: insErr } = await supabase
                    .from('prism_insight_papers')
                    .insert(tempPaperIds.map(pid => ({ insight_id: editingId, paper_id: pid })));
                if (insErr) throw insErr;
            }

            const { error: delS } = await supabase
                .from('prism_insight_survey_items')
                .delete()
                .eq('insight_id', editingId);
            if (delS) throw delS;

            if (tempSurveyIds.length > 0) {
                const { error: insS } = await supabase
                    .from('prism_insight_survey_items')
                    .insert(
                        tempSurveyIds.map((survey_item_id) => ({ insight_id: editingId, survey_item_id }))
                    );
                if (insS) throw insS;
            }

            toast.success('保存成功');
            await onUpdateProjects();
            await mutateAgendaItems();
            setEditingId(null);
        } catch (e: any) {
            toast.error('保存失败: ' + e.message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleAddPaperToProject = async (paperId: string) => {
        if (!requireAdmin()) return;
        if (!activeProject) return;
        setIsSaving(true);
        try {
            const { data: projRow, error: pErr } = await supabase
                .from('prism_projects')
                .select('id')
                .eq('name', activeProject.name)
                .single();
            if (pErr) throw pErr;

            const { error } = await supabase
                .from('prism_paper_projects')
                .insert([{ paper_id: paperId, project_id: projRow.id }]);
            if (error) throw error;

            toast.success('论文已关联');
            setIsAddingPaper(false);
            setAddPaperDirection(null);
            await onUpdateProjects();
        } catch (e: any) {
            toast.error('关联失败: ' + e.message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleCreateItem = async () => {
        if (!requireAdmin()) return;
        if (!creatingIn || !newItemContent.trim() || !activeProject) return;
        if (!newItemTitle.trim()) {
            toast.error('请填写启示标题');
            return;
        }
        setIsSaving(true);
        try {
            const { data: inserted, error: insErr } = await supabase
                .from('prism_project_insights')
                .insert([{
                    project_id: activeProject.id,
                    category: creatingIn.category,
                    content: newItemContent,
                    title: newItemTitle.trim(),
                    sort_order: 999
                }])
                .select('id')
                .single();
            if (insErr) throw insErr;

            if (newItemPaperIds.length > 0) {
                const { error: jpErr } = await supabase
                    .from('prism_insight_papers')
                    .insert(newItemPaperIds.map(pid => ({ insight_id: inserted.id, paper_id: pid })));
                if (jpErr) throw jpErr;
            }

            if (newItemSurveyIds.length > 0) {
                const { error: jsErr } = await supabase
                    .from('prism_insight_survey_items')
                    .insert(
                        newItemSurveyIds.map((survey_item_id) => ({ insight_id: inserted.id, survey_item_id }))
                    );
                if (jsErr) throw jsErr;
            }

            toast.success('添加成功');
            setCreatingIn(null);
            setNewItemContent('');
            setNewItemTitle('');
            setNewItemPaperIds([]);
            setNewItemSurveyIds([]);
            setNewItemDirection(null);
            await onUpdateProjects();
            await mutateAgendaItems();
        } catch (e: any) {
            toast.error('添加失败: ' + e.message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteItem = async (id: string) => {
        if (!requireAdmin()) return;
        if (!window.confirm('确定删除该条目吗？')) return;
        setIsSaving(true);
        try {
            const { error } = await supabase.from('prism_project_insights').delete().eq('id', id);
            if (error) throw error;
            toast.success('已删除');
            await onUpdateProjects();
        } catch (e: any) {
            toast.error('删除失败: ' + e.message);
        } finally {
            setIsSaving(false);
        }
    };

    // === Derived State (Memos) ===

    const activeTimeRange = useMemo(() => {
        if (!activeProject || selectedTimelineIndex === null) return null;
        const current = activeProject.timeline[selectedTimelineIndex];
        const next = activeProject.timeline[selectedTimelineIndex + 1];

        const start = new Date(current.date).getTime();
        const end = next ? new Date(next.date).getTime() : Infinity;

        return { start, end };
    }, [activeProject, selectedTimelineIndex]);

    const relatedPapers = useMemo(() => {
        if (!activeProject) return [];
        return allPapers.filter((p: PaperDetail) => p.projects?.includes(activeProject.name));
    }, [activeProject, allPapers]);

    const filteredPapers = useMemo(() => {
        if (!activeProject) return [];
        if (!activeTimeRange) return relatedPapers;

        return relatedPapers.filter(p => {
            if (!p.created_at) return false;
            const time = new Date(p.created_at).getTime();
            return time >= activeTimeRange.start && time < activeTimeRange.end;
        });
    }, [activeProject, relatedPapers, activeTimeRange]);

    const filteredInsights = useMemo(() => {
        if (!activeProject) return [];
        if (!activeTimeRange) return activeProject.insights;

        return activeProject.insights.map(group => ({
            ...group,
            items: group.items.filter(item => {
                if (!item.created_at) return false;
                const it = new Date(item.created_at).getTime();
                return it >= activeTimeRange.start && it < activeTimeRange.end;
            })
        })).filter(g => g.items.length > 0);
    }, [activeProject, activeTimeRange]);

    const availableDirections = useMemo(() => {
        const dirs = new Set<string>();
        relatedPapers.forEach((p: PaperDetail) => p.directions?.forEach((d: string) => dirs.add(d)));
        return Array.from(dirs).sort();
    }, [relatedPapers]);

    const filteredPapersForEdit = useMemo(() => {
        if (!selectedDirection) return relatedPapers;
        return relatedPapers.filter((p: PaperDetail) => p.directions?.includes(selectedDirection));
    }, [relatedPapers, selectedDirection]);

    /** 添加论文时的方向筛选项：仅来自「尚未加入本项目」的候选论文上的方向（全局标签、项目内展示范围） */
    const availableAllDirections = useMemo(() => {
        const dirs = new Set<string>();
        const relatedIds = new Set(relatedPapers.map((p: PaperDetail) => p.id));
        allPapers
            .filter((p: PaperDetail) => !relatedIds.has(p.id))
            .forEach((p: PaperDetail) => p.directions?.forEach((d: string) => dirs.add(d)));
        return Array.from(dirs).sort();
    }, [allPapers, relatedPapers]);

    const papersNotInProject = useMemo(() => {
        const relatedIds = new Set(relatedPapers.map((p: PaperDetail) => p.id));
        return allPapers.filter((p: PaperDetail) => !relatedIds.has(p.id));
    }, [allPapers, relatedPapers]);

    const papersGrouped = useMemo(() => {
        const groups: Record<string, PaperDetail[]> = {};
        const uncategorized: PaperDetail[] = [];

        filteredPapers.forEach(p => {
            let categories: string[] = [];
            if (paperGroupMode === 'direction') categories = p.directions;
            else if (paperGroupMode === 'type') categories = p.types;

            if (categories.length === 0) uncategorized.push(p);
            else {
                categories.forEach(c => {
                    if (!groups[c]) groups[c] = [];
                    if (!groups[c].find(ext => ext.id === p.id)) groups[c].push(p);
                });
            }
        });

        const result = Object.entries(groups).map(([cat, papers]) => ({ category: cat, papers }));
        if (uncategorized.length > 0) result.push({ category: '未分类', papers: uncategorized });
        return result.sort((a, b) => b.papers.length - a.papers.length);
    }, [filteredPapers, paperGroupMode]);

    if (!activeProject) {
        return <div className="flex-1 flex items-center justify-center text-stone-400 font-mono text-sm py-20">NO PROJECTS FOUND</div>;
    }

    return (
        <div className="flex-1 w-full max-w-[1400px] mx-auto px-18 pb-6 flex flex-col h-[calc(100vh-220px)] overflow-hidden">
            <div className="flex-1 bg-white rounded-3xl border border-stone-200/70 shadow-sm flex flex-col overflow-hidden min-h-0">
                <ProjectHeader
                    projects={projects}
                    activeProjectName={activeProjectName}
                    setActiveProjectName={setActiveProjectName}
                    isTimelineOpen={isTimelineOpen}
                    setIsTimelineOpen={setIsTimelineOpen}
                    selectedTimelineIndex={selectedTimelineIndex}
                    setSelectedTimelineIndex={setSelectedTimelineIndex}
                    activeProject={activeProject}
                    activeTimeRange={activeTimeRange}
                />

                <div className="flex-1 min-h-0 min-w-0 grid h-full [grid-template-columns:repeat(3,minmax(0,1fr))] overflow-x-auto custom-scrollbar-h bg-stone-50/10">
                    <ResearchAgendaColumn
                        activeTimeRange={activeTimeRange}
                        versions={agendaVersions}
                        versionId={agendaVersionId}
                        onVersionIdChange={setAgendaVersionId}
                        isLoadingVersions={agendaVersionsLoading}
                        allInsights={allInsightTitles}
                    />

                    <PapersColumn
                        relatedPapers={filteredPapers}
                        paperGroupMode={paperGroupMode}
                        setPaperGroupMode={setPaperGroupMode}
                        isAddingPaper={isAddingPaper}
                        setIsAddingPaper={setIsAddingPaper}
                        addPaperDirection={addPaperDirection}
                        setAddPaperDirection={setAddPaperDirection}
                        availableAllDirections={availableAllDirections}
                        papersNotInProject={papersNotInProject}
                        handleAddPaperToProject={handleAddPaperToProject}
                        isSaving={isSaving}
                        papersGrouped={papersGrouped}
                        onOpenPaper={onOpenPaper}
                    isAdmin={isAdmin}
                    />

                    <InsightsColumn
                        filteredInsights={filteredInsights}
                        editingId={editingId}
                        tempTitle={tempTitle}
                        tempContent={tempContent}
                        tempPaperIds={tempPaperIds}
                        tempSurveyIds={tempSurveyIds}
                        isSaving={isSaving}
                        creatingIn={creatingIn}
                        newItemTitle={newItemTitle}
                        newItemContent={newItemContent}
                        newItemPaperIds={newItemPaperIds}
                        newItemSurveyIds={newItemSurveyIds}
                        newItemDirection={newItemDirection}
                        allPapers={allPapers}
                        relatedPapers={relatedPapers}
                        availableDirections={availableDirections}
                        selectedDirection={selectedDirection}
                        filteredPapersForEdit={filteredPapersForEdit}
                        surveyItemOptions={surveyItemOptions}
                        setEditingId={setEditingId}
                        setTempTitle={setTempTitle}
                        setTempContent={setTempContent}
                        setTempPaperIds={setTempPaperIds}
                        setTempSurveyIds={setTempSurveyIds}
                        setSelectedDirection={setSelectedDirection}
                        handleSave={handleSave}
                        handleDeleteItem={handleDeleteItem}
                        setCreatingIn={setCreatingIn}
                        setNewItemTitle={setNewItemTitle}
                        setNewItemContent={setNewItemContent}
                        setNewItemPaperIds={setNewItemPaperIds}
                        setNewItemSurveyIds={setNewItemSurveyIds}
                        setNewItemDirection={setNewItemDirection}
                        handleCreateItem={handleCreateItem}
                        handleBoldShortcut={handleBoldShortcut}
                        onOpenPaper={onOpenPaper}
                    isAdmin={isAdmin}
                    />
                </div>
            </div>
        </div>
    );
}
