import type { HubReminder } from './types';
import { addCalendarDays, getHubDayKey } from './hubDay';

type RoutineLog = { date: string; wake_time: string | null; sleep_time: string | null };
type CalendarActivity = { date: string; day_of_week: number | null; content?: string };
type DeadlineTimepoint = { id: number; date: string; label: string | null; item_id: number };
type DeadlineItem = { id: number; title: string };
type MilestoneRow = {
    id: number;
    title: string;
    date: string;
    task_id: number;
    profile_tasks?: { title: string } | null;
};

function daysBetween(fromKey: string, toKey: string): number {
    const [fy, fm, fd] = fromKey.split('-').map(Number);
    const [ty, tm, td] = toKey.split('-').map(Number);
    const a = new Date(fy, fm - 1, fd).getTime();
    const b = new Date(ty, tm - 1, td).getTime();
    return Math.round((b - a) / (24 * 60 * 60 * 1000));
}

export function buildHubReminders(input: {
    routineLogs: RoutineLog[];
    activities: CalendarActivity[];
    timepoints: DeadlineTimepoint[];
    deadlineItems: DeadlineItem[];
    milestones: MilestoneRow[];
}): HubReminder[] {
    const hubToday = getHubDayKey();
    const hubYesterday = addCalendarDays(hubToday, -1);
    const hubTomorrow = addCalendarDays(hubToday, 1);
    const out: HubReminder[] = [];

    const todayLog = input.routineLogs.find((l) => l.date === hubToday);
    const yesterdayLog = input.routineLogs.find((l) => l.date === hubYesterday);

    if (!todayLog?.wake_time) {
        out.push({
            id: 'routine-wake',
            message: '今日尚未记录起床时间（日界 7:00 起）',
            action: 'calendar',
            tone: 'warn',
        });
    }
    if (!yesterdayLog?.sleep_time) {
        out.push({
            id: 'routine-sleep',
            message: '昨日尚未记录休息时间',
            action: 'calendar',
            tone: 'warn',
        });
    }

    const hasTomorrowOneOff = input.activities.some(
        (a) => a.date === hubTomorrow && a.day_of_week == null
    );
    if (!hasTomorrowOneOff) {
        out.push({
            id: 'calendar-tomorrow-plan',
            message: `明日（${hubTomorrow}）尚未安排单次活动`,
            action: 'calendar',
            tone: 'info',
        });
    }

    const itemTitle = new Map(input.deadlineItems.map((i) => [i.id, i.title]));
    const upcoming = input.timepoints
        .filter((tp) => {
            const d = daysBetween(hubToday, tp.date);
            return d >= 0 && d <= 7;
        })
        .sort((a, b) => a.date.localeCompare(b.date));

    for (const tp of upcoming.slice(0, 5)) {
        const d = daysBetween(hubToday, tp.date);
        const itemName = itemTitle.get(tp.item_id) || 'Deadline';
        const label = tp.label ? ` · ${tp.label}` : '';
        const when =
            d === 0 ? '今天' : d === 1 ? '明天' : `${d} 天后`;
        out.push({
            id: `deadline-${tp.id}`,
            message: `${itemName}${label}（${when} · ${tp.date}）`,
            action: 'calendar',
            tone: d <= 2 ? 'warn' : 'info',
        });
    }

    const upcomingMs = input.milestones
        .filter((m) => {
            const d = daysBetween(hubToday, m.date);
            return d >= 0 && d <= 14;
        })
        .sort((a, b) => a.date.localeCompare(b.date));

    for (const ms of upcomingMs.slice(0, 5)) {
        const d = daysBetween(hubToday, ms.date);
        const taskName = ms.profile_tasks?.title;
        const when = d === 0 ? '今天' : d === 1 ? '明天' : `${d} 天后`;
        const prefix = taskName ? `「${taskName}」` : '';
        out.push({
            id: `milestone-${ms.id}`,
            message: `${prefix}里程碑：${ms.title}（${when} · ${ms.date}）`,
            action: 'protocol',
            tone: d <= 3 ? 'warn' : 'info',
        });
    }

    return out;
}
