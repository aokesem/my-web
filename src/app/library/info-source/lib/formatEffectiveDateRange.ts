/** 将 YYYY-MM-DD 格式化为 YYYY.MM.DD */
export function formatDateKey(key: string): string {
    return key.replace(/-/g, '.');
}

export function formatEffectiveDateRange(
    start?: string | null,
    end?: string | null,
    /** 兼容旧字段 */
    legacySingle?: string | null
): string | null {
    const s = start?.slice(0, 10) || legacySingle?.slice(0, 10) || null;
    const e = end?.slice(0, 10) || null;

    if (!s && !e) return null;
    if (s && e) {
        if (s === e) return formatDateKey(s);
        return `${formatDateKey(s)} — ${formatDateKey(e)}`;
    }
    if (s) return formatDateKey(s);
    return `至 ${formatDateKey(e!)}`;
}

/** 排序用时间戳：优先起始日，否则创建日 */
export function effectiveDateSortKey(
    bookmark: {
        effective_date_start?: string | null;
        info_date?: string | null;
        created_at: string;
    }
): number {
    const key =
        bookmark.effective_date_start?.slice(0, 10) ||
        bookmark.info_date?.slice(0, 10) ||
        bookmark.created_at.slice(0, 10);
    return new Date(key).getTime();
}
