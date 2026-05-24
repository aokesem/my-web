"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
    Cpu,
    Zap,
    Library,
    Ghost,
    Maximize2,
    Minimize2,
    ChevronDown,
    ChevronRight,
    CalendarDays,
    Tags,
    Image as ImageIcon,
    type LucideIcon,
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

type Category = 'knowledge' | 'sports' | 'arts' | 'acgn';
type SocialTab = 'hobbies' | 'friends' | 'groups';

interface HobbyItem {
    id: number;
    category: string;
    name: string;
    description: string;
    level: number;
}

interface FriendCardItem {
    id: number;
    name: string;
    lastContact: string | null;
    hobbies: string[];
    tags: string[];
    image?: string;
}

interface GroupCardItem {
    id: number;
    name: string;
    note: string;
    members: string[];
    image?: string;
    accent: string;
}

const HOBBY_GROUP_STYLES: Record<Category, {
    label: string;
    shell: string;
    line: string;
    chip: string;
    title: string;
}> = {
    knowledge: {
        label: '知识',
        shell: 'border-blue-100/60 bg-blue-50/75',
        line: 'from-blue-200/80 to-transparent',
        chip: 'border-blue-100/90 bg-white/85 text-blue-700',
        title: 'text-blue-700',
    },
    sports: {
        label: '运动',
        shell: 'border-rose-100/60 bg-rose-50/75',
        line: 'from-rose-200/80 to-transparent',
        chip: 'border-rose-100/90 bg-white/85 text-rose-700',
        title: 'text-rose-700',
    },
    arts: {
        label: '文艺',
        shell: 'border-emerald-100/60 bg-emerald-50/75',
        line: 'from-emerald-200/80 to-transparent',
        chip: 'border-emerald-100/90 bg-white/85 text-emerald-700',
        title: 'text-emerald-700',
    },
    acgn: {
        label: 'ACGN',
        shell: 'border-fuchsia-100/60 bg-fuchsia-50/75',
        line: 'from-fuchsia-200/80 to-transparent',
        chip: 'border-fuchsia-100/90 bg-white/85 text-fuchsia-700',
        title: 'text-fuchsia-700',
    },
};

const FRIEND_HOBBY_CATEGORY_MAP: Record<string, Category> = {
    '阅读': 'knowledge',
    '地图': 'knowledge',
    '徒步': 'sports',
    '电影': 'arts',
    '摄影': 'arts',
    '动画': 'acgn',
    '游戏': 'acgn',
    '模型': 'acgn',
};

const CATEGORY_UI_CONFIG: Record<Category, { label: string; icon: LucideIcon; color: string; bg: string; activeColor: string }> = {
    knowledge: {
        label: "鐭ヨ瘑",
        icon: Cpu,
        color: "text-blue-600",
        bg: "bg-blue-50",
        activeColor: "bg-blue-500",
    },
    sports: {
        label: "杩愬姩",
        icon: Zap,
        color: "text-red-600",
        bg: "bg-red-50",
        activeColor: "bg-red-500",
    },
    arts: {
        label: "鏂囪壓",
        icon: Library,
        color: "text-emerald-600",
        bg: "bg-emerald-50",
        activeColor: "bg-emerald-500",
    },
    acgn: {
        label: "ACGN",
        icon: Ghost,
        color: "text-pink-400",
        bg: "bg-pink-50",
        activeColor: "bg-pink-500",
    },
};


const FRIENDS_MOCK: FriendCardItem[] = [
    {
        id: 1,
        name: '阿川',
        lastContact: '2026-04-18',
        hobbies: ['阅读', '地图', '徒步'],
        tags: ['老同学', '会认真聊天'],
        image: '/images/places/kei_asai_1.png',
    },
    {
        id: 2,
        name: '叶子',
        lastContact: '2026-05-07',
        hobbies: ['电影', '摄影'],
        tags: ['散步搭子', '审美稳定'],
    },
    {
        id: 3,
        name: 'K',
        lastContact: null,
        hobbies: ['动画', '游戏', '模型'],
        tags: ['网络认识', '聊作品很投缘'],
        image: '/images/places/saki_maino.jpg',
    },
];

const GROUPS_MOCK: GroupCardItem[] = [
    {
        id: 1,
        name: '散步观察会',
        note: '偏安静的小圈子，常常是临时约出来走走，路线和气氛比目的地更重要。',
        members: ['阿川', '叶子', '阿彻', 'Momo'],
        image: '/images/places/kei_asai_1.png',
        accent: 'from-amber-100/80 via-orange-50/70 to-white/80',
    },
    {
        id: 2,
        name: '作品交换局',
        note: '会互相推荐电影、动画、书和零碎文章，也会顺手讲讲最近的生活感受。',
        members: ['K', '林木', '阿凉'],
        accent: 'from-violet-100/80 via-indigo-50/70 to-white/80',
    },
];

interface HobbySystemProps {
    isActive: boolean;
    onToggle: () => void;
}

const LevelIndicator = ({ level, activeColor }: { level: number; activeColor: string }) => (
    <div className="flex gap-1">
        {[1, 2, 3, 4].map((i) => (
            <div
                key={i}
                className={`h-2.5 w-1.5 rounded-sm transition-all duration-500 ${i <= level ? activeColor : 'bg-slate-200'}`}
            />
        ))}
    </div>
);

function formatContactDate(date: string | null) {
    if (!date) return '灏氭湭璁板綍';
    return date.replace(/-/g, '.');
}

function splitFriendHobbiesByCategory(hobbies: string[]) {
    const grouped: Record<Category, string[]> = {
        knowledge: [],
        sports: [],
        arts: [],
        acgn: [],
    };

    hobbies.forEach((hobby) => {
        const category = FRIEND_HOBBY_CATEGORY_MAP[hobby] ?? 'knowledge';
        grouped[category].push(hobby);
    });

    return grouped;
}

function buildSeedFromText(text: string) {
    let hash = 0;
    for (let i = 0; i < text.length; i += 1) {
        hash = (hash * 31 + text.charCodeAt(i)) >>> 0;
    }
    return hash;
}

function buildFriendAuraStyle(friend: FriendCardItem) {
    const grouped = splitFriendHobbiesByCategory(friend.hobbies);
    const counts: Record<Category, number> = {
        knowledge: grouped.knowledge.length,
        sports: grouped.sports.length,
        arts: grouped.arts.length,
        acgn: grouped.acgn.length,
    };
    const total = Object.values(counts).reduce((sum, value) => sum + value, 0) || 1;
    const seed = buildSeedFromText(friend.name);
    const hueShift = (seed % 11) - 5;
    const angle = 104 + (seed % 18);
    const lightOffset = (seed % 7) - 3;
    const alphaOffset = ((seed >> 3) % 8) / 100;

    const categoryHue: Record<Category, number> = {
        knowledge: 214,
        sports: 10,
        arts: 152,
        acgn: 304,
    };

    const colorStop = (category: Category) => {
        const weight = counts[category] / total;
        const alpha = 0.1 + weight * 0.34 + alphaOffset;
        const lightness = 94 - weight * 10 + lightOffset;
        return `hsla(${categoryHue[category] + hueShift}, 85%, ${lightness}%, ${alpha})`;
    };

    const accentGlow = (() => {
        const sorted = (Object.entries(counts) as [Category, number][])
            .sort((a, b) => b[1] - a[1]);
        const dominant = sorted[0]?.[0] ?? 'knowledge';
        const secondary = sorted[1]?.[0] ?? dominant;
        return `radial-gradient(circle at 82% 22%, ${colorStop(secondary)} 0%, transparent 32%), radial-gradient(circle at 16% 82%, ${colorStop(dominant)} 0%, transparent 30%)`;
    })();

    return {
        backgroundImage: `${accentGlow}, linear-gradient(${angle}deg, ${colorStop('knowledge')} 0%, ${colorStop('sports')} 30%, ${colorStop('arts')} 68%, ${colorStop('acgn')} 100%)`,
    };
}

function TabButton({
    active,
    onClick,
    label,
}: {
    active: boolean;
    onClick: (event: React.MouseEvent) => void;
    label: string;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`rounded-md px-2.5 py-1 text-xs font-mono font-bold uppercase tracking-wider transition-colors ${active
                ? 'bg-white text-slate-700 shadow-sm'
                : 'text-slate-400 hover:text-slate-600'
                }`}
        >
            {label}
        </button>
    );
}

export default function HobbySystem({ isActive, onToggle }: HobbySystemProps) {
    const [expandedKeys, setExpandedKeys] = useState<Category[]>([]);
    const [allHobbies, setAllHobbies] = useState<HobbyItem[]>([]);
    const [activeTab, setActiveTab] = useState<SocialTab>('hobbies');
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    const visibleActiveTab: SocialTab = !isActive ? 'hobbies' : isLoggedIn ? activeTab : 'hobbies';

    useEffect(() => {
        const fetchHobbies = async () => {
            const { data } = await supabase
                .from('profile_hobbies')
                .select('*')
                .order('id', { ascending: true });

            if (data) {
                setAllHobbies(data as HobbyItem[]);
            }
        };

        const checkSession = async () => {
            const { data } = await supabase.auth.getSession();
            setIsLoggedIn(!!data.session);
        };

        fetchHobbies();
        checkSession();
    }, []);

    const visibleTabs = useMemo(
        () =>
            isLoggedIn
                ? [
                    { key: 'hobbies' as SocialTab, label: '鐖卞ソ' },
                    { key: 'friends' as SocialTab, label: '鏈嬪弸' },
                    { key: 'groups' as SocialTab, label: '鍥綋' },
                ]
                : [{ key: 'hobbies' as SocialTab, label: '鐖卞ソ' }],
        [isLoggedIn]
    );

    const handleCategoryClick = (key: Category, event: React.MouseEvent) => {
        event.stopPropagation();
        setExpandedKeys((prev) =>
            prev.includes(key) ? prev.filter((item) => item !== key) : [...prev, key]
        );
    };

    return (
        <motion.div
            layout
            transition={{
                type: "spring",
                stiffness: 100,
                damping: 20,
                mass: 1.2,
            }}
            onClick={!isActive ? onToggle : undefined}
            className={`
                fixed flex flex-col overflow-hidden rounded-3xl bg-white/70 backdrop-blur-3xl
                shadow-[
                    0_20px_50px_-12px_rgba(0,0,0,0.1),
                    inset_0_0_0_1px_rgba(255,255,255,0.6),
                    inset_0_1px_0_0_rgba(255,255,255,0.9),
                    inset_0_-4px_4px_-2px_rgba(0,0,0,0.05)
                ]
                transition-all duration-500 ease-[cubic-bezier(0.25,0.1,0.25,1)]
                ${isActive
                    ? 'z-50 top-[9vh] left-[5vw] h-[82vh] w-[90vw] md:left-[calc(50%-440px)] md:w-[880px]'
                    : 'z-30 top-[calc(100%-520px)] left-[3%] h-[500px] w-80 md:w-96 hover:-translate-y-1 hover:shadow-[0_30px_60px_-15px_rgba(59,130,246,0.2),inset_0_0_0_1px_rgba(255,255,255,0.8)]'
                }
            `}
        >
            <div className="absolute -top-[20%] -left-[20%] h-[140%] w-[140%] pointer-events-none bg-[conic-gradient(from_0deg_at_50%_50%,#e0f2fe_0deg,#f3e8ff_120deg,#ecfccb_240deg,#e0f2fe_360deg)] opacity-40 blur-3xl saturate-150 mix-blend-multiply" />
            <div className="absolute inset-0 pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.06] mix-blend-color-burn" />
            <div className="absolute top-0 left-6 right-6 z-20 h-px bg-linear-to-r from-transparent via-white to-transparent opacity-80" />

            <div className="relative z-10 flex shrink-0 items-center justify-between border-b border-slate-900/5 bg-white/20 px-6 py-4">
                <div className="flex items-center gap-3">
                    <Library size={20} className="text-slate-400" />
                    <span className="text-[15px] font-bold tracking-[0.2em] text-slate-500/80">
                        鐖卞ソ妗ｆ // HOBBYARCHIVE
                    </span>
                </div>

                <div className="flex items-center gap-4">
                    {isActive && (
                        <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-100/80 p-1">
                            {visibleTabs.map((tab) => (
                                <TabButton
                                    key={tab.key}
                                    active={visibleActiveTab === tab.key}
                                    label={tab.label}
                                    onClick={(event) => {
                                        event.stopPropagation();
                                        setActiveTab(tab.key);
                                    }}
                                />
                            ))}
                        </div>
                    )}

                    <button
                        onClick={(event) => {
                            event.stopPropagation();
                            onToggle();
                        }}
                        className="text-slate-400 transition-colors hover:text-slate-800"
                    >
                        {isActive ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                    </button>
                </div>
            </div>

            <div className="relative z-10 flex-1 overflow-hidden">
                {visibleActiveTab === 'hobbies' ? (
                    <div className="flex h-full flex-col divide-y divide-slate-100 overflow-hidden">
                        {(Object.keys(CATEGORY_UI_CONFIG) as Category[]).map((key) => {
                            const uiConfig = CATEGORY_UI_CONFIG[key];
                            const Icon = uiConfig.icon;
                            const isExpanded = expandedKeys.includes(key);
                            const currentItems = allHobbies.filter((item) => item.category === key);

                            return (
                                <motion.div
                                    key={key}
                                    layout
                                    className={`relative flex flex-col overflow-hidden group ${isExpanded ? 'flex-1' : 'flex-none h-16'
                                        }`}
                                    transition={{
                                        layout: { duration: 0.45, ease: [0.23, 1, 0.32, 1] },
                                    }}
                                    onClick={(event) => handleCategoryClick(key, event)}
                                >
                                    <div
                                        className={`flex h-16 shrink-0 cursor-pointer items-center justify-between px-6 transition-all ${isExpanded
                                            ? 'bg-white/40 shadow-[inset_0_-1px_0_rgba(0,0,0,0.02)]'
                                            : 'hover:bg-white/30'
                                            }`}
                                    >
                                        <div className="flex items-center gap-5">
                                            <div className={`rounded-xl border border-white/50 p-2 shadow-sm backdrop-blur-sm ${uiConfig.bg}`}>
                                                <Icon size={18} className={uiConfig.color} />
                                            </div>
                                            <span
                                                className={`text-base font-bold uppercase tracking-[0.2em] transition-colors ${isExpanded ? 'text-slate-800' : 'text-slate-500'
                                                    }`}
                                            >
                                                {uiConfig.label}
                                            </span>
                                        </div>

                                        <div className="text-slate-400 transition-colors group-hover:text-slate-600">
                                            {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                        </div>
                                    </div>

                                    <div
                                        className={`flex-1 overflow-y-auto bg-slate-50/30 px-6 py-4 shadow-[inset_0_4px_12px_rgba(0,0,0,0.03)] ${!isExpanded ? 'pointer-events-none opacity-0' : 'opacity-100'
                                            }`}
                                    >
                                        <div className="mb-2 flex items-center justify-between border-b border-slate-200/50 px-3 py-2">
                                            <span className="text-[13px] font-bold uppercase tracking-[0.2em] text-slate-400">
                                                鍐呭璇︽儏 / Details
                                            </span>
                                            <span className="text-[13px] font-bold uppercase tracking-[0.2em] text-slate-400">
                                                鐖卞ソ绛夌骇 / Level
                                            </span>
                                        </div>

                                        <div className="space-y-2">
                                            {currentItems.length > 0 ? (
                                                currentItems.map((item) => (
                                                    <motion.div
                                                        key={item.id}
                                                        layout
                                                        className="group/item relative flex cursor-default items-center justify-between rounded-xl border border-white/80 bg-white px-4 py-3 shadow-[0_2px_4px_rgba(0,0,0,0.02)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
                                                    >
                                                        <div className="flex min-w-0 flex-1 items-baseline gap-4">
                                                            <span className="whitespace-nowrap text-lg font-bold text-slate-700 transition-colors group-hover/item:text-slate-900">
                                                                {item.name}
                                                            </span>
                                                            <span className="truncate text-xs text-slate-400 transition-colors group-hover/item:text-slate-500">
                                                                {item.description}
                                                            </span>
                                                        </div>

                                                        <div className="pl-6">
                                                            <LevelIndicator level={item.level} activeColor={uiConfig.activeColor} />
                                                        </div>
                                                    </motion.div>
                                                ))
                                            ) : (
                                                <div className="py-4 text-center text-xs text-slate-400">鏆傛棤鏁版嵁 (No Data)</div>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                ) : visibleActiveTab === 'friends' ? (
                    <div className="h-full overflow-y-auto px-5 py-5">
                        <div className="mb-4 px-1">
                            <div>
                                <h3 className="text-lg font-serif font-bold tracking-tight text-slate-700">鏈嬪弸</h3>
                                <p className="mt-1 text-[11px] font-mono tracking-[0.15em] text-slate-400">
                                    PEOPLE ARCHIVE / STATIC PREVIEW
                                </p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {FRIENDS_MOCK.map((friend) => {
                                const cardAuraStyle = buildFriendAuraStyle(friend);

                                return (
                                    <div
                                        key={friend.id}
                                        className="relative overflow-hidden rounded-[26px] border border-white/75 p-6 shadow-[0_10px_30px_-16px_rgba(15,23,42,0.22)]"
                                        style={cardAuraStyle}
                                    >
                                        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.8),transparent_32%)]" />
                                        {(() => {
                                            const hobbyGroups = splitFriendHobbiesByCategory(friend.hobbies);
                                            const orderedGroups: Category[] = ['knowledge', 'sports', 'arts', 'acgn'];

                                            return (
                                                <div className="relative flex gap-8">
                                                    <div className="flex w-48 shrink-0 flex-col">
                                                        {friend.image ? (
                                                            <div className="h-full min-h-[250px] overflow-hidden rounded-[24px] border border-white/70 bg-white/70 shadow-sm">
                                                                <img
                                                                    src={friend.image}
                                                                    alt={friend.name}
                                                                    className="h-full w-full object-cover"
                                                                />
                                                            </div>
                                                        ) : (
                                                            <div className="flex h-full min-h-[250px] items-center justify-center rounded-[24px] border border-dashed border-slate-200/80 bg-white/45 text-slate-300">
                                                                <ImageIcon size={28} />
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="min-w-0 flex-1">
                                                        <div className="flex items-start justify-between gap-6">
                                                            <div className="min-w-0">
                                                                <h4 className="text-xl font-bold tracking-tight text-slate-800">
                                                                    {friend.name}
                                                                </h4>
                                                                {friend.tags.length > 0 && (
                                                                    <div className="mt-2 flex items-center gap-2 text-sm text-slate-500">
                                                                        <Tags size={13} className="shrink-0 text-slate-400" />
                                                                        <p className="min-w-0 leading-relaxed">
                                                                            {friend.tags.join(' | ')}
                                                                        </p>
                                                                    </div>
                                                                )}
                                                            </div>

                                                            <div className="shrink-0 pt-1 text-right">
                                                                <div className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/70 px-4 py-2 text-base font-mono text-slate-600 shadow-sm">
                                                                    <CalendarDays size={15} className="text-slate-400" />
                                                                    <span>{formatContactDate(friend.lastContact)}</span>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="mt-6 rounded-[24px] border border-white/75 bg-white/58 px-5 py-5 shadow-[0_14px_24px_-20px_rgba(37,99,235,0.28)] backdrop-blur-sm">
                                                            <div className="mb-4 flex items-center gap-3">
                                                                <span className="text-sm font-semibold tracking-[0.12em] text-slate-600">
                                                                    鍏宠仈鐖卞ソ
                                                                </span>
                                                                <div className="h-px flex-1 bg-linear-to-r from-blue-200/70 to-transparent" />
                                                            </div>

                                                            <div className="grid grid-cols-2 gap-y-4 pl-4 pr-1 md:grid-cols-4 md:gap-x-0 md:pl-5 md:pr-2">
                                                                {orderedGroups.map((groupKey, index) => {
                                                                    const hobbies = hobbyGroups[groupKey];
                                                                    const style = HOBBY_GROUP_STYLES[groupKey];
                                                                    const showDivider = index < orderedGroups.length - 1;

                                                                    return (
                                                                        <div
                                                                            key={groupKey}
                                                                            className={`flex min-h-[172px] flex-col items-center px-3 text-center md:px-5 ${showDivider ? 'border-r-2 border-slate-300/70' : ''}`}
                                                                        >
                                                                            <div className="mb-4 flex w-full justify-center">
                                                                                <span className={`text-lg font-semibold tracking-[0.08em] ${style.title}`}>
                                                                                    {style.label}
                                                                                </span>
                                                                            </div>

                                                                            {hobbies.length > 0 ? (
                                                                                <div className="flex w-full flex-col items-center space-y-2.5">
                                                                        {hobbies.map((hobby) => (
                                                                            <div
                                                                                key={hobby}
                                                                                className={`inline-flex min-w-[112px] justify-center rounded-xl border-[0.5px] px-3.5 py-2.5 text-center text-[15px] font-medium shadow-[inset_0_1px_0_rgba(255,255,255,0.65)] ${style.shell} ${style.title}`}
                                                                            >
                                                                                {hobby}
                                                                            </div>
                                                                        ))}
                                                                                </div>
                                                                            ) : (
                                                                                <div className="pt-3 text-xs text-slate-300">-</div>
                                                                            )}
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })()}
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                ) : (
                    <div className="h-full overflow-y-auto px-5 py-5">
                        <div className="mb-4 px-1">
                            <div>
                                <h3 className="text-lg font-serif font-bold tracking-tight text-slate-700">鍥綋</h3>
                                <p className="mt-1 text-[11px] font-mono tracking-[0.15em] text-slate-400">
                                    GROUP ARCHIVE / STATIC PREVIEW
                                </p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {GROUPS_MOCK.map((group) => (
                                <div
                                    key={group.id}
                                    className={`relative overflow-hidden rounded-[26px] border border-white/75 bg-gradient-to-br ${group.accent} p-4 shadow-[0_10px_30px_-16px_rgba(15,23,42,0.22)]`}
                                >
                                    <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.18),transparent_40%)]" />

                                    <div className="relative flex gap-6">
                                        {group.image ? (
                                            <div className="h-32 w-36 shrink-0 overflow-hidden rounded-[24px] border border-white/70 bg-white/70 shadow-sm">
                                                <img
                                                    src={group.image}
                                                    alt={group.name}
                                                    className="h-full w-full object-cover"
                                                />
                                            </div>
                                        ) : null}

                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-start justify-between gap-4">
                                                <div>
                                                    <h4 className="text-xl font-bold tracking-tight text-slate-800">
                                                        {group.name}
                                                    </h4>
                                                    <p className="mt-2 max-w-[460px] text-sm leading-relaxed text-slate-600">
                                                        {group.note}
                                                    </p>
                                                </div>
                                                <div className="rounded-full border border-white/75 bg-white/70 px-3 py-1 text-[10px] font-mono uppercase tracking-[0.16em] text-slate-400">
                                                    {group.members.length} Members
                                                </div>
                                            </div>

                                            <div className="mt-4 rounded-2xl border border-white/70 bg-white/60 px-4 py-3">
                                                <div className="mb-2 text-[10px] font-mono uppercase tracking-[0.18em] text-slate-400">
                                                    鎴愬憳鍚嶅綍
                                                </div>
                                                <div className="flex flex-wrap gap-2">
                                                    {group.members.map((member) => (
                                                        <span
                                                            key={member}
                                                            className="rounded-full border border-stone-200 bg-stone-50/90 px-2.5 py-1 text-[11px] font-medium text-stone-700"
                                                        >
                                                            {member}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <div className="relative z-10 flex h-10 shrink-0 items-center justify-between border-t border-slate-100 bg-slate-50 px-6">
                <div className="flex gap-2 opacity-50">
                    <div className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                    <div className="h-1.5 w-1.5 rounded-full bg-slate-300" />
                    <div className="h-1.5 w-1.5 rounded-full bg-slate-200" />
                </div>
                <div className="flex items-center gap-2">
                    <div className="h-1 w-12 overflow-hidden rounded-full bg-slate-200">
                        <div
                            className={`h-full ${visibleActiveTab === 'hobbies'
                                ? 'w-4/12 bg-blue-500/50'
                                : visibleActiveTab === 'friends'
                                    ? 'w-8/12 bg-emerald-500/50'
                                    : 'w-full bg-violet-500/50'
                                }`}
                        />
                    </div>
                    <span className="text-[9px] font-bold tracking-widest text-slate-400">V3.14</span>
                </div>
            </div>
        </motion.div>
    );
}

