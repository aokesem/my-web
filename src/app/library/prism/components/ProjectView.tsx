import React, { useState, useMemo, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';

// ============================================================
// TYPES
// ============================================================
import { ProjectData, ProjectCategory, ProjectInsight, ProjectOutcome, ProjectTimelineEvent, PaperDetail } from '../types';

// ============================================================
// SUB-COMPONENTS
// ============================================================
import { ProjectHeader } from './ProjectBoard/ProjectHeader';
import { PapersColumn } from './ProjectBoard/PapersColumn';
import { InsightsColumn } from './ProjectBoard/InsightsColumn';
import { OutcomesColumn } from './ProjectBoard/OutcomesColumn';
import { handleBoldShortcutUtil } from './ProjectBoard/utils';

export type { ProjectData, ProjectCategory, ProjectInsight, ProjectOutcome, ProjectTimelineEvent };

interface ProjectViewProps {
    projects: ProjectData[];
    allPapers: PaperDetail[];
    onOpenPaper: (id: string) => void;
    onUpdateProjects: () => Promise<void>;
}

export default function ProjectView({ projects, allPapers, onOpenPaper, onUpdateProjects }: ProjectViewProps) {
    const [activeProjectName, setActiveProjectName] = useState<string>(projects[0]?.name || '');
    const [isTimelineOpen, setIsTimelineOpen] = useState(false);
    const [selectedTimelineIndex, setSelectedTimelineIndex] = useState<number | null>(null);
    const [paperGroupMode, setPaperGroupMode] = useState<'direction' | 'type' | 'depth'>('direction');

    // Editing State
    const [editingId, setEditingId] = useState<string | null>(null);
    const [tempContent, setTempContent] = useState('');
    const [tempPaperIds, setTempPaperIds] = useState<string[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [selectedDirection, setSelectedDirection] = useState<string | null>(null);

    // Paper adding state
    const [isAddingPaper, setIsAddingPaper] = useState(false);
    const [addPaperDirection, setAddPaperDirection] = useState<string | null>(null);

    // New item creation state
    const [creatingIn, setCreatingIn] = useState<{ type: 'insight' | 'outcome'; category: string } | null>(null);
    const [newItemContent, setNewItemContent] = useState('');
    const [newItemPaperIds, setNewItemPaperIds] = useState<string[]>([]);
    const [newItemDirection, setNewItemDirection] = useState<string | null>(null);

    // Shortcuts
    const handleBoldShortcut = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        handleBoldShortcutUtil(e, setTempContent);
    }, []);

    // === API Handlers ===
    const handleSave = async (table: string, junctionTable: string, idField: string) => {
        if (!editingId) return;
        setIsSaving(true);
        try {
            const { error: mainErr } = await supabase
                .from(table)
                .update({ content: tempContent })
                .eq('id', editingId);
            if (mainErr) throw mainErr;

            const { error: delErr } = await supabase
                .from(junctionTable)
                .delete()
                .eq(idField, editingId);
            if (delErr) throw delErr;

            if (tempPaperIds.length > 0) {
                const { error: insErr } = await supabase
                    .from(junctionTable)
                    .insert(tempPaperIds.map(pid => ({ [idField]: editingId, paper_id: pid })));
                if (insErr) throw insErr;
            }

            toast.success('保存成功');
            await onUpdateProjects();
            setEditingId(null);
        } catch (e: any) {
            toast.error('保存失败: ' + e.message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleAddPaperToProject = async (paperId: string) => {
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
        if (!creatingIn || !newItemContent.trim() || !activeProject) return;
        setIsSaving(true);
        try {
            const table = creatingIn.type === 'insight' ? 'prism_project_insights' : 'prism_project_outcomes';
            const junctionTable = creatingIn.type === 'insight' ? 'prism_insight_papers' : 'prism_outcome_papers';
            const idField = creatingIn.type === 'insight' ? 'insight_id' : 'outcome_id';

            const { data: inserted, error: insErr } = await supabase
                .from(table)
                .insert([{
                    project_id: activeProject.id,
                    category: creatingIn.category,
                    content: newItemContent,
                    sort_order: 999
                }])
                .select('id')
                .single();
            if (insErr) throw insErr;

            if (newItemPaperIds.length > 0) {
                const { error: jpErr } = await supabase
                    .from(junctionTable)
                    .insert(newItemPaperIds.map(pid => ({ [idField]: inserted.id, paper_id: pid })));
                if (jpErr) throw jpErr;
            }

            toast.success('添加成功');
            setCreatingIn(null);
            setNewItemContent('');
            setNewItemPaperIds([]);
            setNewItemDirection(null);
            await onUpdateProjects();
        } catch (e: any) {
            toast.error('添加失败: ' + e.message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteItem = async (type: 'insight' | 'outcome', id: string) => {
        if (!window.confirm('确定删除该条目吗？')) return;
        setIsSaving(true);
        try {
            const table = type === 'insight' ? 'prism_project_insights' : 'prism_project_outcomes';
            const { error } = await supabase.from(table).delete().eq('id', id);
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
    const activeProject = projects.find(p => p.name === activeProjectName);

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

    const filteredOutcomes = useMemo(() => {
        if (!activeProject) return [];
        if (!activeTimeRange) return activeProject.outcomes;

        return activeProject.outcomes.map(group => ({
            ...group,
            items: group.items.filter(item => {
                if (!item.created_at) return false;
                const ot = new Date(item.created_at).getTime();
                return ot >= activeTimeRange.start && ot < activeTimeRange.end;
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

    const availableAllDirections = useMemo(() => {
        const dirs = new Set<string>();
        allPapers.forEach((p: PaperDetail) => p.directions?.forEach((d: string) => dirs.add(d)));
        return Array.from(dirs).sort();
    }, [allPapers]);

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
            else if (paperGroupMode === 'depth') categories = [p.read_depth];

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
        <div className="flex-1 w-full max-w-[1400px] mx-auto px-18 pb-12 flex h-[calc(100vh-220px)] overflow-hidden">
            <div className="flex-1 bg-white rounded-3xl border border-stone-200/70 shadow-sm flex flex-col overflow-hidden">
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

                <div className="flex-1 flex overflow-x-auto custom-scrollbar-h bg-stone-50/10">
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
                    />

                    <InsightsColumn 
                        filteredInsights={filteredInsights}
                        editingId={editingId}
                        tempContent={tempContent}
                        tempPaperIds={tempPaperIds}
                        isSaving={isSaving}
                        creatingIn={creatingIn}
                        newItemContent={newItemContent}
                        newItemPaperIds={newItemPaperIds}
                        newItemDirection={newItemDirection}
                        allPapers={allPapers}
                        relatedPapers={relatedPapers}
                        availableDirections={availableDirections}
                        selectedDirection={selectedDirection}
                        filteredPapersForEdit={filteredPapersForEdit}
                        setEditingId={setEditingId}
                        setTempContent={setTempContent}
                        setTempPaperIds={setTempPaperIds}
                        setSelectedDirection={setSelectedDirection}
                        handleSave={handleSave}
                        handleDeleteItem={handleDeleteItem}
                        setCreatingIn={setCreatingIn}
                        setNewItemContent={setNewItemContent}
                        setNewItemPaperIds={setNewItemPaperIds}
                        setNewItemDirection={setNewItemDirection}
                        handleCreateItem={handleCreateItem}
                        handleBoldShortcut={handleBoldShortcut}
                        onOpenPaper={onOpenPaper}
                    />

                    <OutcomesColumn 
                        filteredOutcomes={filteredOutcomes}
                        editingId={editingId}
                        tempContent={tempContent}
                        tempPaperIds={tempPaperIds}
                        isSaving={isSaving}
                        creatingIn={creatingIn}
                        newItemContent={newItemContent}
                        newItemPaperIds={newItemPaperIds}
                        newItemDirection={newItemDirection}
                        allPapers={allPapers}
                        relatedPapers={relatedPapers}
                        availableDirections={availableDirections}
                        selectedDirection={selectedDirection}
                        filteredPapersForEdit={filteredPapersForEdit}
                        setEditingId={setEditingId}
                        setTempContent={setTempContent}
                        setTempPaperIds={setTempPaperIds}
                        setSelectedDirection={setSelectedDirection}
                        handleSave={handleSave}
                        handleDeleteItem={handleDeleteItem}
                        setCreatingIn={setCreatingIn}
                        setNewItemContent={setNewItemContent}
                        setNewItemPaperIds={setNewItemPaperIds}
                        setNewItemDirection={setNewItemDirection}
                        handleCreateItem={handleCreateItem}
                        handleBoldShortcut={handleBoldShortcut}
                        onOpenPaper={onOpenPaper}
                    />
                </div>
            </div>
        </div>
    );
}
