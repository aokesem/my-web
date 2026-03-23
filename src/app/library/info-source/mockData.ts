export type CategoryType = 'study' | 'life';

export interface InfoSource {
    id: number;
    name: string;
    image_url?: string;
}

export interface InfoCategory {
    id: number;
    category_type: CategoryType;
    name: string;
}

export interface InfoItem {
    id: number;
    category_type: CategoryType;
    name: string;
    description?: string;
    url?: string;
    source_id?: number;
    category_ids: number[];
    image_url?: string;
    info_date?: string; // YYYY-MM-DD
    sort_order: number;
    is_favorited: boolean;
    is_queued: boolean;
    created_at: string; // ISO String
}

export const mockSources: InfoSource[] = [
    { id: 1, name: 'Reddit', image_url: 'https://www.redditstatic.com/desktop2x/img/favicon/apple-icon-120x120.png' },
    { id: 2, name: 'YouTube', image_url: 'https://www.youtube.com/s/desktop/189bbd8b/img/favicon_144x144.png' },
    { id: 3, name: 'Bilibili', image_url: 'https://www.bilibili.com/favicon.ico?v=1' },
    { id: 4, name: 'Github', image_url: 'https://github.githubassets.com/favicons/favicon.svg' },
    { id: 5, name: 'Medium', image_url: 'https://miro.medium.com/v2/resize:fill:152:152/1*sHhtYhaCe2Uc3IU0IgKwIQ.png' },
];

export const mockCategories: InfoCategory[] = [
    // Study
    { id: 1, category_type: 'study', name: '大模型' },
    { id: 2, category_type: 'study', name: '前端开发' },
    { id: 3, category_type: 'study', name: '算法' },
    { id: 4, category_type: 'study', name: '实用工具' },
    // Life
    { id: 5, category_type: 'life', name: '美食菜谱' },
    { id: 6, category_type: 'life', name: '家居收纳' },
    { id: 7, category_type: 'life', name: '运动健康' },
    { id: 8, category_type: 'life', name: '数码硬件' },
];

export const mockItems: InfoItem[] = [
    // Study Items
    {
        id: 1,
        category_type: 'study',
        name: 'Next.js 15 App Router 最佳实践指南',
        description: 'Vercel 官方出品的深入理解服务器组件与缓存机制的好文。',
        url: 'https://nextjs.org/',
        source_id: 4,
        category_ids: [2, 4],
        image_url: 'https://assets.vercel.com/image/upload/v1662130559/nextjs/Icon_dark_background.png',
        info_date: '2025-10-15',
        sort_order: 10,
        is_favorited: true,
        is_queued: false,
        created_at: '2025-10-16T10:00:00Z',
    },
    {
        id: 2,
        category_type: 'study',
        name: '深入剖析 Transformer 架构在视觉领域的应用',
        description: '这篇论文解读非常到位，推荐反复阅读。',
        url: 'https://arxiv.org/',
        source_id: 1,
        category_ids: [1, 3],
        info_date: '2025-11-02',
        sort_order: 5,
        is_favorited: false,
        is_queued: true,
        created_at: '2025-11-03T14:30:00Z',
    },
    {
        id: 3,
        category_type: 'study',
        name: 'React 性能优化技巧：useMemo 与 useCallback 的真实场景',
        source_id: 2,
        category_ids: [2],
        image_url: 'https://react.dev/images/uwu.png',
        info_date: '2025-12-01',
        sort_order: 0,
        is_favorited: false,
        is_queued: true,
        created_at: '2025-12-05T09:12:00Z',
    },
    {
        id: 4,
        category_type: 'study',
        name: 'Cursor 进阶使用技巧',
        description: '如何利用 Cursor 提高 AI 辅助编程效率',
        url: 'https://cursor.sh/',
        source_id: 2,
        category_ids: [1, 4],
        info_date: '2026-01-20',
        sort_order: 0,
        is_favorited: true,
        is_queued: false,
        created_at: '2026-01-21T18:20:00Z',
    },

    // Life Items
    {
        id: 5,
        category_type: 'life',
        name: '极简桌面整理术：让线缆隐形的 5 个技巧',
        description: '买了新的魔术贴，周末试着整理一下桌底布线。',
        url: 'https://www.youtube.com/',
        source_id: 2,
        category_ids: [6, 8],
        image_url: 'https://images.unsplash.com/photo-1593640408182-31c70c8268f5?w=500&q=80',
        info_date: '2025-08-10',
        sort_order: 0,
        is_favorited: true,
        is_queued: false,
        created_at: '2025-08-11T20:15:00Z',
    },
    {
        id: 6,
        category_type: 'life',
        name: '空气炸锅 10 分钟快手早餐食谱合集',
        description: '早上起不来的时候救命用，特别是那个吐司披萨。',
        url: 'https://www.bilibili.com/',
        source_id: 3,
        category_ids: [5],
        info_date: '2025-09-05',
        sort_order: 2,
        is_favorited: false,
        is_queued: true,
        created_at: '2025-09-06T08:00:00Z',
    },
    {
        id: 7,
        category_type: 'life',
        name: '新手核心力量训练：避免下背部受伤的要点',
        source_id: 5,
        category_ids: [7],
        image_url: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=500&q=80',
        info_date: '2026-02-14',
        sort_order: 0,
        is_favorited: false,
        is_queued: true,
        created_at: '2026-02-15T15:40:00Z',
    },
    {
        id: 8,
        category_type: 'life',
        name: '2026年度人体工学椅选购指南',
        description: '准备换椅子了，重点关注腰托调节范围。',
        source_id: 1,
        category_ids: [6, 8],
        info_date: '2026-03-01',
        sort_order: 8,
        is_favorited: true,
        is_queued: false,
        created_at: '2026-03-05T22:10:00Z',
    }
];
