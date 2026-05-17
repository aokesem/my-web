import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import type {
    HubCapture,
    HubCategoryType,
    HubLongTermTask,
    HubQueuedBookmark,
    HubReminder,
} from './types';
import { buildHubReminders } from './hubReminders';

const QUEUED_BOOKMARK_SELECT = 'id, title, category_type, created_at';

async function fetchQueuedBookmarks(): Promise<{
    data: HubQueuedBookmark[];
    error: { message: string } | null;
}> {
    const [studyRes, lifeRes] = await Promise.all([
        supabase
            .from('info_bookmarks')
            .select(QUEUED_BOOKMARK_SELECT)
            .eq('category_type', 'study')
            .eq('is_queued', true)
            .order('created_at', { ascending: false }),
        supabase
            .from('info_bookmarks')
            .select(QUEUED_BOOKMARK_SELECT)
            .eq('category_type', 'life')
            .eq('is_queued', true)
            .order('created_at', { ascending: false }),
    ]);

    const error = studyRes.error || lifeRes.error;
    if (error) {
        return { data: [], error };
    }

    const merged = [...(studyRes.data || []), ...(lifeRes.data || [])] as HubQueuedBookmark[];
    merged.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return { data: merged, error: null };
}

export function useInfoHubData(isOpen: boolean) {
    const [isLoading, setIsLoading] = useState(false);
    const [captures, setCaptures] = useState<HubCapture[]>([]);
    const [queuedBookmarks, setQueuedBookmarks] = useState<HubQueuedBookmark[]>([]);
    const [reminders, setReminders] = useState<HubReminder[]>([]);
    const [longTermTasks, setLongTermTasks] = useState<HubLongTermTask[]>([]);

    const fetchAll = useCallback(async () => {
        setIsLoading(true);
        try {
            const [
                capRes,
                queuedRes,
                routineRes,
                actsRes,
                tpRes,
                itemsRes,
                msRes,
                tasksRes,
            ] = await Promise.all([
                supabase
                    .from('info_hub_captures')
                    .select('*')
                    .order('created_at', { ascending: false }),
                fetchQueuedBookmarks(),
                supabase.from('calendar_routine_logs').select('date, wake_time, sleep_time'),
                supabase
                    .from('calendar_activities')
                    .select('date, day_of_week, content'),
                supabase.from('deadline_timepoints').select('id, date, label, item_id'),
                supabase.from('deadline_items').select('id, title'),
                supabase
                    .from('profile_task_milestones')
                    .select('id, title, date, is_completed, task_id, profile_tasks(title)')
                    .eq('is_completed', false)
                    .order('date', { ascending: true }),
                supabase
                    .from('profile_tasks')
                    .select('id, title, deadline, category, status')
                    .eq('status', 'in_progress')
                    .not('deadline', 'is', null)
                    .order('deadline', { ascending: true }),
            ]);

            if (capRes.error) {
                console.error('info_hub_captures:', capRes.error);
            } else if (capRes.data) {
                setCaptures(capRes.data as HubCapture[]);
            }

            if (queuedRes.error) {
                console.error('queued info_bookmarks:', queuedRes.error);
                setQueuedBookmarks([]);
            } else {
                setQueuedBookmarks(queuedRes.data);
            }

            setReminders(
                buildHubReminders({
                    routineLogs: (routineRes.data || []) as { date: string; wake_time: string | null; sleep_time: string | null }[],
                    activities: (actsRes.data || []) as { date: string; day_of_week: number | null }[],
                    timepoints: (tpRes.data || []) as { id: number; date: string; label: string | null; item_id: number }[],
                    deadlineItems: (itemsRes.data || []) as { id: number; title: string }[],
                    milestones: (msRes.data || []).map((m: Record<string, unknown>) => {
                        const pt = m.profile_tasks;
                        const taskTitle = Array.isArray(pt)
                            ? (pt[0] as { title?: string })?.title
                            : (pt as { title?: string } | null)?.title;
                        return {
                            id: m.id as number,
                            title: m.title as string,
                            date: m.date as string,
                            task_id: m.task_id as number,
                            profile_tasks: taskTitle ? { title: taskTitle } : null,
                        };
                    }),
                })
            );

            if (tasksRes.data) {
                setLongTermTasks(
                    tasksRes.data.map((t) => ({
                        id: t.id,
                        title: t.title,
                        deadline: t.deadline,
                        category: t.category,
                        sortTime: new Date(t.deadline).getTime(),
                    }))
                );
            } else {
                setLongTermTasks([]);
            }
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!isOpen) return;
        fetchAll();
    }, [isOpen, fetchAll]);

    useEffect(() => {
        if (!isOpen) return;
        const onVisible = () => {
            if (document.visibilityState === 'visible') fetchAll();
        };
        document.addEventListener('visibilitychange', onVisible);
        return () => document.removeEventListener('visibilitychange', onVisible);
    }, [isOpen, fetchAll]);

    const addCapture = async (title: string, category_type: HubCategoryType) => {
        const { data, error } = await supabase
            .from('info_hub_captures')
            .insert({ title, category_type })
            .select()
            .single();
        if (error) throw error;
        setCaptures((prev) => [data as HubCapture, ...prev]);
    };

    const deleteCapture = async (id: number) => {
        const { error } = await supabase.from('info_hub_captures').delete().eq('id', id);
        if (error) throw error;
        setCaptures((prev) => prev.filter((c) => c.id !== id));
    };

    const archiveCapture = async (capture: HubCapture) => {
        const { data: bookmark, error: insertError } = await supabase
            .from('info_bookmarks')
            .insert({
                category_type: capture.category_type,
                title: capture.title,
                source_id: null,
                group_id: null,
                parent_item_id: null,
                is_queued: true,
            })
            .select('id, title, category_type, created_at')
            .single();
        if (insertError) throw insertError;

        const { error: deleteError } = await supabase
            .from('info_hub_captures')
            .delete()
            .eq('id', capture.id);
        if (deleteError) throw deleteError;

        setCaptures((prev) => prev.filter((c) => c.id !== capture.id));
        if (bookmark) {
            setQueuedBookmarks((prev) => [bookmark as HubQueuedBookmark, ...prev]);
        }
    };

    const unqueueBookmark = async (id: number) => {
        const { error } = await supabase.from('info_bookmarks').update({ is_queued: false }).eq('id', id);
        if (error) throw error;
        setQueuedBookmarks((prev) => prev.filter((b) => b.id !== id));
    };

    return {
        isLoading,
        captures,
        queuedBookmarks,
        reminders,
        longTermTasks,
        refresh: fetchAll,
        addCapture,
        deleteCapture,
        archiveCapture,
        unqueueBookmark,
    };
}
