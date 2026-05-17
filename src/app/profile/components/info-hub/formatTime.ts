export function formatHubRowTime(iso: string): string {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    const date = d.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
    });
    const time = d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    return `${date} ${time}`;
}

export function formatDeadlineCountdown(deadline: string): string {
    const end = new Date(deadline);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);
    const diff = Math.round((end.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
    if (diff < 0) return '已过期';
    if (diff === 0) return '今天截止';
    if (diff === 1) return '明天截止';
    return `${diff} 天后`;
}
