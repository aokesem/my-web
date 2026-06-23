import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import type {
    HubCapture,
    HubCategoryType,
    HubFolderOption,
    HubFolderReminder,
    HubLongTermTask,
    HubQueuedBookmark,
    HubReminder,
} from './types';
import { buildHubReminders } from './hubReminders';
import { addCalendarDays, getHubDayKey } from './hubDay';
import { getDueFolderReminders } from '@/lib/infoItemReminder';
import { getDaysSinceDate } from '@/lib/profileSocialRecords';

export const DEFAULT_FRIEND_CONTACT_SNOOZE_DAYS = 30;

const QUEUED_BOOKMARK_SELECT_WITH_HUB =
    'id, title, category_type, created_at, parent_item_id, info_items(name)';
const QUEUED_BOOKMARK_SELECT_BASE = 'id, title, category_type, created_at, parent_item_id';

function logSupabaseError(label: string, error: unknown) {
    if (!error || typeof error !== 'object') {
        console.error(label, error);
        return;
    }
    const e = error as { message?: string; code?: string; details?: string; hint?: string };
    console.error(
        label,
        [e.message, e.code, e.details, e.hint].filter(Boolean).join(' · ') || error
    );
}

function mapQueuedRow(
    row: Record<string, unknown>,
    hubNameById: Map<number, string>
): HubQueuedBookmark {
    const items = row.info_items as { name?: string } | { name?: string }[] | null;
    const joinedName = Array.isArray(items) ? items[0]?.name : items?.name;
    const parentId = (row.parent_item_id as number | null) ?? null;
    return {
        id: row.id as number,
        title: row.title as string,
        category_type: row.category_type as HubCategoryType,
        created_at: row.created_at as string,
        parent_item_id: parentId,
        hub_name: joinedName ?? (parentId != null ? hubNameById.get(parentId) ?? null : null),
    };
}

async function fetchQueuedBookmarks(hubNameById: Map<number, string>) {
    const fetchSide = async (category: HubCategoryType, select: string) =>
        supabase
            .from('info_bookmarks')
            .select(select)
            .eq('category_type', category)
            .eq('is_queued', true)
            .order('created_at', { ascending: false });

    let studyRes = await fetchSide('study', QUEUED_BOOKMARK_SELECT_WITH_HUB);
    let lifeRes = await fetchSide('life', QUEUED_BOOKMARK_SELECT_WITH_HUB);

    if (studyRes.error || lifeRes.error) {
        studyRes = await fetchSide('study', QUEUED_BOOKMARK_SELECT_BASE);
        lifeRes = await fetchSide('life', QUEUED_BOOKMARK_SELECT_BASE);
    }

    const error = studyRes.error || lifeRes.error;
    if (error) {
        logSupabaseError('queued info_bookmarks', error);
        return { data: [], error };
    }

    const merged = [...(studyRes.data || []), ...(lifeRes.data || [])].map((row) =>
        mapQueuedRow(row as unknown as Record<string, unknown>, hubNameById)
    );
    merged.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return { data: merged, error: null };
}

async function fetchItemsForHubReminders() {
    const full = await supabase.from('info_items').select('*');
    if (!full.error) return full;

    logSupabaseError('info_items (reminders)', full.error);
    const basic = await supabase
        .from('info_items')
        .select('id, name, category_type, created_at');
    if (basic.error) {
        logSupabaseError('info_items (reminders fallback)', basic.error);
        return basic;
    }
    return {
        data: (basic.data || []).map((row) => ({
            ...row,
            reminder_interval_days: 0,
            last_reminder_cleared_at: null,
        })),
        error: null,
    };
}

export function useInfoHubData(isOpen: boolean) {
    const [isLoading, setIsLoading] = useState(false);
    const [captures, setCaptures] = useState<HubCapture[]>([]);
    const [queuedBookmarks, setQueuedBookmarks] = useState<HubQueuedBookmark[]>([]);
    const [reminders, setReminders] = useState<HubReminder[]>([]);
    const [longTermTasks, setLongTermTasks] = useState<HubLongTermTask[]>([]);
    const [folderReminders, setFolderReminders] = useState<HubFolderReminder[]>([]);
    const [hubFolders, setHubFolders] = useState<HubFolderOption[]>([]);

    const fetchAll = useCallback(async () => {
        setIsLoading(true);
        try {
            const [capRes, itemsRes, routineRes, actsRes, tpRes, deadlineItemsRes, msRes, tasksRes, friendsRes] =
                await Promise.all([
                    supabase
                        .from('info_hub_captures')
                        .select('*')
                        .order('created_at', { ascending: false }),
                    fetchItemsForHubReminders(),
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
                    supabase
                        .from('profile_friends')
                        .select('id, name, last_contact_date, scheduled_contact_date, contact_reminder_muted')
                        .not('scheduled_contact_date', 'is', null)
                        .order('scheduled_contact_date', { ascending: true }),
                ]);

            const hubNameById = new Map<number, string>();
            if (itemsRes.data) {
                for (const item of itemsRes.data) {
                    hubNameById.set(item.id, item.name);
                }
            }

            const queuedRes = await fetchQueuedBookmarks(hubNameById);

            if (capRes.error) {
                logSupabaseError('info_hub_captures', capRes.error);
            } else if (capRes.data) {
                setCaptures(capRes.data as HubCapture[]);
            }

            if (queuedRes.error) {
                setQueuedBookmarks([]);
            } else {
                setQueuedBookmarks(queuedRes.data);
            }

            const nextReminders = buildHubReminders({
                    routineLogs: (routineRes.data || []) as {
                        date: string;
                        wake_time: string | null;
                        sleep_time: string | null;
                    }[],
                    activities: (actsRes.data || []) as {
                        date: string;
                        day_of_week: number | null;
                    }[],
                    timepoints: (tpRes.data || []) as {
                        id: number;
                        date: string;
                        label: string | null;
                        item_id: number;
                    }[],
                    deadlineItems: (deadlineItemsRes.data || []) as { id: number; title: string }[],
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
                });

            if (friendsRes.data) {
                const today = getHubDayKey();
                const friendReminders = friendsRes.data
                    .map((friend) => {
                        const scheduledDate = friend.scheduled_contact_date as string | null;
                        const isMuted = Boolean(friend.contact_reminder_muted);
                        if (!scheduledDate || isMuted || scheduledDate > today) return null;
                        const lastContact = friend.last_contact_date as string | null;
                        const days = lastContact ? getDaysSinceDate(lastContact, today) : null;
                        return {
                            id: `friend-contact-${friend.id}`,
                            message:
                                days == null
                                    ? `${friend.name} 已到预定联系日期`
                                    : `${friend.name} 已经 ${days} 天没有联系`,
                            kind: 'friend_contact' as const,
                            friendId: friend.id as number,
                            tone: 'warn' as const,
                        };
                    })
                    .filter(
                        (
                            item
                        ): item is {
                            id: string;
                            message: string;
                            kind: 'friend_contact';
                            friendId: number;
                            tone: 'warn';
                        } => item !== null
                    );

                nextReminders.push(...friendReminders);
            }

            setReminders(nextReminders);

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

            if (itemsRes.error) {
                setFolderReminders([]);
                setHubFolders([]);
            } else if (itemsRes.data) {
                setHubFolders(
                    itemsRes.data.map((row) => ({
                        id: row.id,
                        name: row.name,
                        category_type: row.category_type as HubCategoryType,
                    }))
                );
                const due = getDueFolderReminders(
                    itemsRes.data.map((row) => ({
                        id: row.id,
                        name: row.name,
                        category_type: row.category_type,
                        reminder_interval_days: row.reminder_interval_days ?? 0,
                        last_reminder_cleared_at: row.last_reminder_cleared_at ?? null,
                        created_at: row.created_at,
                    }))
                );
                setFolderReminders(
                    due.map((item) => ({
                        id: item.id,
                        name: item.name,
                        category_type: item.category_type as HubCategoryType,
                        reminder_interval_days: item.reminder_interval_days ?? 0,
                    }))
                );
            }
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!isOpen) return;
        fetchAll();
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

    const updateCapture = async (
        id: number,
        payload: { title: string; category_type: HubCategoryType }
    ) => {
        const { data, error } = await supabase
            .from('info_hub_captures')
            .update({ title: payload.title, category_type: payload.category_type })
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;
        setCaptures((prev) => prev.map((c) => (c.id === id ? (data as HubCapture) : c)));
    };

    const archiveCapture = async (
        capture: HubCapture,
        parentItemId: number | null
    ) => {
        const hubName =
            parentItemId != null
                ? hubFolders.find((f) => f.id === parentItemId)?.name ?? null
                : null;

        const { data: bookmark, error: insertError } = await supabase
            .from('info_bookmarks')
            .insert({
                category_type: capture.category_type,
                title: capture.title,
                source_id: null,
                parent_item_id: parentItemId,
                is_queued: true,
            })
            .select('id, title, category_type, created_at, parent_item_id')
            .single();
        if (insertError) throw insertError;

        const { error: deleteError } = await supabase
            .from('info_hub_captures')
            .delete()
            .eq('id', capture.id);
        if (deleteError) throw deleteError;

        setCaptures((prev) => prev.filter((c) => c.id !== capture.id));
        if (bookmark) {
            setQueuedBookmarks((prev) => [
                {
                    ...(bookmark as HubQueuedBookmark),
                    hub_name: hubName,
                },
                ...prev,
            ]);
        }
    };

    const unqueueBookmark = async (id: number) => {
        const { error } = await supabase.from('info_bookmarks').update({ is_queued: false }).eq('id', id);
        if (error) throw error;
        setQueuedBookmarks((prev) => prev.filter((b) => b.id !== id));
    };

    const clearFolderReminder = async (itemId: number) => {
        const today = getHubDayKey();
        const { error } = await supabase
            .from('info_items')
            .update({ last_reminder_cleared_at: today })
            .eq('id', itemId);
        if (error) throw error;
        setFolderReminders((prev) => prev.filter((f) => f.id !== itemId));
    };

    const dismissFriendReminder = async (friendId: number, snoozeDays = DEFAULT_FRIEND_CONTACT_SNOOZE_DAYS) => {
        const nextReminderDate = addCalendarDays(
            getHubDayKey(),
            snoozeDays
        );
        const { error } = await supabase
            .from('profile_friends')
            .update({ scheduled_contact_date: nextReminderDate })
            .eq('id', friendId);
        if (error) throw error;
        setReminders((prev) =>
            prev.filter(
                (reminder) =>
                    !(reminder.kind === 'friend_contact' && reminder.friendId === friendId)
            )
        );
    };

    return {
        isLoading,
        captures,
        queuedBookmarks,
        folderReminders,
        hubFolders,
        reminders,
        longTermTasks,
        refresh: fetchAll,
        addCapture,
        deleteCapture,
        updateCapture,
        archiveCapture,
        unqueueBookmark,
        clearFolderReminder,
        dismissFriendReminder,
    };
}
