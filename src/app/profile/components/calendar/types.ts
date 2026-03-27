export type DayStatus = 'good' | 'ok' | 'bad' | null;

export interface Activity {
    id: number;
    content: string;
    duration: number | null; // 小时
    start_time?: string | null;
    end_time?: string | null;
    color?: string | null;
    day_of_week?: number | null;   // 0=周一 ... 6=周日
    recur_until?: string | null;   // 'YYYY-MM-DD' 重复截止日期
    date?: string;
    deadline_item_id?: number | null; // 关联的 deadline 条目
}

export interface DayData {
    status: DayStatus;
    comment: string;
    activities: Activity[];
}

// === 新 Deadline 三级层次 ===
export interface DeadlineCategory {
    id: number;
    name: string;
    sort_order: number;
    created_at?: string;
}

export interface DeadlineItem {
    id: number;
    category_id: number;
    title: string;
    done: boolean;
    sort_order: number;
    created_at?: string;
}

export interface DeadlineTimepoint {
    id: number;
    item_id: number;
    label: string;
    date: string; // 'YYYY-MM-DD'
    done: boolean;
    created_at?: string;
}

// 旧接口保留，过渡期兼容
export interface Deadline {
    id: number;
    title: string;
    date: string | null; // 'YYYY-MM-DD'
    done: boolean;
}

export const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
export const MONTH_ABBR = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
export const WEEKDAYS = ['一', '二', '三', '四', '五', '六', '日'];

export function formatDateKey(year: number, month: number, day: number): string {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function getMonthGrid(year: number, month: number) {
    const firstDay = new Date(year, month, 1).getDay();
    // 转换为周一起始: 0(Sun)->6, 1(Mon)->0, ...
    const startOffset = firstDay === 0 ? 6 : firstDay - 1;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    return { startOffset, daysInMonth };
}

// === 状态颜色映射 ===
export const STATUS_COLORS = {
    good: { bg: 'bg-emerald-500', ring: 'ring-emerald-400', text: 'text-emerald-700', dot: 'bg-emerald-500', label: '好' },
    ok: { bg: 'bg-amber-500', ring: 'ring-amber-400', text: 'text-amber-700', dot: 'bg-amber-500', label: '一般' },
    bad: { bg: 'bg-rose-500', ring: 'ring-rose-400', text: 'text-rose-700', dot: 'bg-rose-500', label: '差' },
};
