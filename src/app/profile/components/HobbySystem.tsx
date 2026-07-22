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
    Check,
    BellOff,
    Tags,
    Image as ImageIcon,
    type LucideIcon,
} from 'lucide-react';
import {
    fetchProfileSocialRecords,
    type ProfileFriendRecord,
    type ProfileGroupRecord,
    type ProfileHobbyRecord,
} from '@/lib/profileSocialRecords';
import { supabase } from '@/lib/supabaseClient';

type Category = 'knowledge' | 'sports' | 'arts' | 'acgn';
type SocialTab = 'hobbies' | 'friends' | 'groups';

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

const CATEGORY_UI_CONFIG: Record<Category, { label: string; icon: LucideIcon; color: string; bg: string; activeColor: string }> = {
    knowledge: {
        label: "知识",
        icon: Cpu,
        color: "text-blue-600",
        bg: "bg-blue-50",
        activeColor: "bg-blue-500",
    },
    sports: {
        label: "运动",
        icon: Zap,
        color: "text-red-600",
        bg: "bg-red-50",
        activeColor: "bg-red-500",
    },
    arts: {
        label: "文艺",
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
    if (!date) return '尚未记录';
    return date.replace(/-/g, '.');
}

function formatScheduledContactDate(date: string | null) {
    if (!date) return '未设置';
    return date.replace(/-/g, '.');
}

function splitFriendHobbiesByCategory(hobbies: ProfileHobbyRecord[]) {
    const grouped: Record<Category, string[]> = {
        knowledge: [],
        sports: [],
        arts: [],
        acgn: [],
    };

    hobbies.forEach((hobby) => {
        const category = hobby.category ?? 'knowledge';
        grouped[category].push(hobby.name);
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

function buildFriendAuraStyle(friend: ProfileFriendRecord) {
    const grouped = splitFriendHobbiesByCategory(friend.hobbies);
    const counts: Record<Category, number> = {
        knowledge: grouped.knowledge.length,
        sports: grouped.sports.length,
        arts: grouped.arts.length,
        acgn: grouped.acgn.length,
    };
    const total = Object.values(counts).reduce((sum, value) => sum + value, 0) || 1;
    const seed = buildSeedFromText(`${friend.id}-${friend.name}`);
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
    const [allHobbies, setAllHobbies] = useState<ProfileHobbyRecord[]>([]);
    const [friends, setFriends] = useState<ProfileFriendRecord[]>([]);
    const [groups, setGroups] = useState<ProfileGroupRecord[]>([]);
    const [activeTab, setActiveTab] = useState<SocialTab>('hobbies');
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [editingContactFriendId, setEditingContactFriendId] = useState<number | null>(null);
    const [contactDraft, setContactDraft] = useState('');
    const [editingScheduledFriendId, setEditingScheduledFriendId] = useState<number | null>(null);
    const [scheduledDraft, setScheduledDraft] = useState('');
    const [isSavingContact, setIsSavingContact] = useState(false);
    const [isSavingScheduled, setIsSavingScheduled] = useState(false);
    const [selectedHobby, setSelectedHobby] = useState<string | null>(null);
    const [openFilterCategory, setOpenFilterCategory] = useState<Category | null>(null);

    const visibleActiveTab: SocialTab = !isActive ? 'hobbies' : isLoggedIn ? activeTab : 'hobbies';

    const filteredFriends = useMemo(() => {
        if (!selectedHobby) return friends;
        return friends.filter((f) => f.hobbies.some((h) => h.name === selectedHobby));
    }, [friends, selectedHobby]);

    useEffect(() => {
        const loadData = async () => {
            const [{ data: sessionData }, socialData] = await Promise.all([
                supabase.auth.getSession(),
                fetchProfileSocialRecords(),
            ]);

            setIsLoggedIn(!!sessionData.session);
            setAllHobbies(socialData.hobbies);
            setFriends(socialData.friends);
            setGroups(socialData.groups);
        };

        loadData();
    }, []);

    const visibleTabs = useMemo(
        () =>
            isLoggedIn
                ? [
                    { key: 'hobbies' as SocialTab, label: '爱好' },
                    { key: 'friends' as SocialTab, label: '朋友' },
                    { key: 'groups' as SocialTab, label: '团体' },
                ]
                : [{ key: 'hobbies' as SocialTab, label: '爱好' }],
        [isLoggedIn]
    );

    const handleCategoryClick = (key: Category, event: React.MouseEvent) => {
        event.stopPropagation();
        setExpandedKeys((prev) =>
            prev.includes(key) ? prev.filter((item) => item !== key) : [...prev, key]
        );
    };

    const startEditContactDate = (friend: ProfileFriendRecord, event: React.MouseEvent) => {
        event.stopPropagation();
        setEditingScheduledFriendId(null);
        setScheduledDraft('');
        setEditingContactFriendId(friend.id);
        setContactDraft(friend.last_contact_date ?? '');
    };

    const startEditScheduledDate = (friend: ProfileFriendRecord, event: React.MouseEvent) => {
        event.stopPropagation();
        setEditingContactFriendId(null);
        setContactDraft('');
        setEditingScheduledFriendId(friend.id);
        setScheduledDraft(friend.scheduled_contact_date ?? '');
    };

    const cancelEditContactDate = (event?: React.MouseEvent) => {
        event?.stopPropagation();
        setEditingContactFriendId(null);
        setContactDraft('');
    };

    const cancelEditScheduledDate = (event?: React.MouseEvent) => {
        event?.stopPropagation();
        setEditingScheduledFriendId(null);
        setScheduledDraft('');
    };

    const saveContactDate = async (friendId: number, event?: React.MouseEvent) => {
        event?.stopPropagation();
        setIsSavingContact(true);
        try {
            const nextValue = contactDraft || null;
            const { error } = await supabase
                .from('profile_friends')
                .update({
                    last_contact_date: nextValue,
                    contact_reminder_snoozed_until: null,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', friendId);

            if (error) throw error;

            setFriends((prev) =>
                prev.map((friend) =>
                    friend.id === friendId
                        ? { ...friend, last_contact_date: nextValue }
                        : friend
                )
            );
            setEditingContactFriendId(null);
            setContactDraft('');
        } finally {
            setIsSavingContact(false);
        }
    };

    const saveScheduledDate = async (friendId: number, event?: React.MouseEvent) => {
        event?.stopPropagation();
        setIsSavingScheduled(true);
        try {
            const nextValue = scheduledDraft || null;
            const { error } = await supabase
                .from('profile_friends')
                .update({
                    scheduled_contact_date: nextValue,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', friendId);

            if (error) throw error;

            setFriends((prev) =>
                prev.map((friend) =>
                    friend.id === friendId
                        ? { ...friend, scheduled_contact_date: nextValue }
                        : friend
                )
            );
            setEditingScheduledFriendId(null);
            setScheduledDraft('');
        } finally {
            setIsSavingScheduled(false);
        }
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
                    ? 'z-50 top-[9vh] left-[5vw] h-[82vh] w-[90vw] md:left-[calc(50%-440px)] md:w-220'
                    : 'z-30 top-[calc(100%-520px)] left-[3%] h-125 w-80 md:w-96 hover:-translate-y-1 hover:shadow-[0_30px_60px_-15px_rgba(59,130,246,0.2),inset_0_0_0_1px_rgba(255,255,255,0.8)]'
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
                        爱好档案 // HOBBYARCHIVE
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
                                                内容详情 / Details
                                            </span>
                                            <span className="text-[13px] font-bold uppercase tracking-[0.2em] text-slate-400">
                                                爱好等级 / Level
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
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <h3 className="text-lg font-serif font-bold tracking-tight text-slate-700">朋友</h3>
                                    <p className="mt-1 text-[11px] font-mono tracking-[0.15em] text-slate-400">
                                        PEOPLE ARCHIVE / STATIC PREVIEW
                                    </p>
                                </div>
                                {/* 按爱好筛选按钮区 */}
                                {isLoggedIn && (
                                    <div className="relative flex items-center gap-4 shrink-0 pt-1">
                                        {(Object.keys(CATEGORY_UI_CONFIG) as Category[]).map((cat) => {
                                            const cfg = CATEGORY_UI_CONFIG[cat];
                                            const isOpen = openFilterCategory === cat;
                                            const hobbiesInCat = allHobbies.filter((h) => h.category === cat);
                                            const isActiveFilter = selectedHobby != null && hobbiesInCat.some((h) => h.name === selectedHobby);

                                            return (
                                                <div key={cat} className="relative">
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setOpenFilterCategory(isOpen ? null : cat);
                                                        }}
                                                        className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-mono font-bold uppercase tracking-wider transition-all ${isActiveFilter || isOpen
                                                            ? `${cfg.bg} ${cfg.color} border-current/25 shadow-sm`
                                                            : `border-slate-200 bg-slate-50/80 text-slate-400 hover:${cfg.color} hover:border-current/20 hover:${cfg.bg}`
                                                            }`}
                                                    >
                                                        <div className={`w-2.5 h-2.5 rounded-full ${cfg.activeColor}`} />
                                                        {cfg.label}
                                                        <ChevronDown size={12} className={`transition-transform duration-150 ${isOpen ? 'rotate-180' : ''}`} />
                                                    </button>
                                                    {isOpen && (
                                                        <>
                                                            <div className="fixed inset-0 z-40" onClick={(e) => { e.stopPropagation(); setOpenFilterCategory(null); }} />
                                                            <div className="absolute right-0 top-full z-50 mt-1.5 min-w-35 rounded-xl border border-white/80 bg-white/95 backdrop-blur-xl shadow-lg py-1.5">
                                                                <button
                                                                    type="button"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setSelectedHobby(null);
                                                                        setOpenFilterCategory(null);
                                                                    }}
                                                                    className={`w-full px-4 py-2 text-left text-xs font-mono transition-colors hover:bg-slate-100 ${!selectedHobby ? 'text-slate-800 font-bold' : 'text-slate-500'}`}
                                                                >
                                                                    全部 ({friends.length})
                                                                </button>
                                                                {hobbiesInCat.map((hobby) => {
                                                                    const count = friends.filter((f) => f.hobbies.some((h) => h.name === hobby.name)).length;
                                                                    return (
                                                                        <button
                                                                            key={hobby.id}
                                                                            type="button"
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                setSelectedHobby(hobby.name);
                                                                                setOpenFilterCategory(null);
                                                                            }}
                                                                            className={`w-full px-4 py-2 text-left text-xs font-medium transition-colors hover:bg-slate-100 flex items-center justify-between gap-3 ${selectedHobby === hobby.name ? `${cfg.color} font-bold bg-slate-50` : 'text-slate-600'
                                                                                }`}
                                                                        >
                                                                            <span>{hobby.name}</span>
                                                                            <span className="text-[10px] font-mono text-slate-400 tabular-nums">{count}</span>
                                                                        </button>
                                                                    );
                                                                })}
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                            {/* 当前筛选标签 */}
                            {selectedHobby && (
                                <div className="mt-2 flex items-center gap-2">
                                    <span className="text-[10px] font-mono text-slate-400">按「{selectedHobby}」筛选</span>
                                    <button
                                        type="button"
                                        onClick={(e) => { e.stopPropagation(); setSelectedHobby(null); }}
                                        className="text-[10px] font-mono text-blue-500 hover:underline"
                                    >
                                        清除
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="space-y-4">
                            {filteredFriends.map((friend) => {
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
                                                <div className="relative flex gap-6">
                                                    <div className="flex w-56 shrink-0 flex-col">
                                                        {friend.image_url ? (
                                                            <div className="h-full min-h-62.5 overflow-hidden rounded-[24px] border border-white/70 bg-white/70 shadow-sm">
                                                                <img
                                                                    src={friend.image_url}
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
                                                                            {friend.tags.map((tag) => tag.name).join(' | ')}
                                                                        </p>
                                                                    </div>
                                                                )}
                                                            </div>

                                                            <div className="flex shrink-0 flex-col items-end gap-2 pt-1 text-right">
                                                                {isLoggedIn && editingContactFriendId === friend.id ? (
                                                                    <div className="flex items-center gap-2">
                                                                        <input
                                                                            type="date"
                                                                            value={contactDraft}
                                                                            onClick={(event) => event.stopPropagation()}
                                                                            onChange={(event) => setContactDraft(event.target.value)}
                                                                            className="rounded-full border border-white/75 bg-white/85 px-3 py-2 text-sm font-mono text-slate-600 shadow-sm outline-none"
                                                                        />
                                                                        <button
                                                                            type="button"
                                                                            onClick={(event) => saveContactDate(friend.id, event)}
                                                                            disabled={isSavingContact}
                                                                            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/75 bg-white/85 text-slate-600 shadow-sm transition-colors hover:text-slate-900 disabled:opacity-50"
                                                                        >
                                                                            {isSavingContact ? (
                                                                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600" />
                                                                            ) : (
                                                                                <Check size={15} />
                                                                            )}
                                                                        </button>
                                                                        <button
                                                                            type="button"
                                                                            onClick={(event) => cancelEditContactDate(event)}
                                                                            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/75 bg-white/85 text-slate-500 shadow-sm transition-colors hover:text-slate-800"
                                                                        >
                                                                            <Minimize2 size={14} />
                                                                        </button>
                                                                    </div>
                                                                ) : (
                                                                    <button
                                                                        type="button"
                                                                        onClick={(event) =>
                                                                            isLoggedIn
                                                                                ? startEditContactDate(friend, event)
                                                                                : event.stopPropagation()
                                                                        }
                                                                        className={`inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/70 px-4 py-2 text-base font-mono text-slate-600 shadow-sm ${isLoggedIn ? 'transition-colors hover:text-slate-900' : ''
                                                                            }`}
                                                                    >
                                                                        <CalendarDays size={15} className="text-slate-400" />
                                                                        <span>{formatContactDate(friend.last_contact_date)}</span>
                                                                    </button>
                                                                )}
                                                                <div className="flex flex-col items-end gap-1.5">
                                                                    {isLoggedIn && editingScheduledFriendId === friend.id ? (
                                                                        <div className="flex items-center gap-2">
                                                                            <input
                                                                                type="date"
                                                                                value={scheduledDraft}
                                                                                onClick={(event) => event.stopPropagation()}
                                                                                onChange={(event) => setScheduledDraft(event.target.value)}
                                                                                className="rounded-full border border-white/75 bg-white/85 px-3 py-2 text-sm font-mono text-slate-600 shadow-sm outline-none"
                                                                            />
                                                                            <button
                                                                                type="button"
                                                                                onClick={(event) => saveScheduledDate(friend.id, event)}
                                                                                disabled={isSavingScheduled}
                                                                                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/75 bg-white/85 text-slate-600 shadow-sm transition-colors hover:text-slate-900 disabled:opacity-50"
                                                                            >
                                                                                {isSavingScheduled ? (
                                                                                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600" />
                                                                                ) : (
                                                                                    <Check size={15} />
                                                                                )}
                                                                            </button>
                                                                            <button
                                                                                type="button"
                                                                                onClick={(event) => cancelEditScheduledDate(event)}
                                                                                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/75 bg-white/85 text-slate-500 shadow-sm transition-colors hover:text-slate-800"
                                                                            >
                                                                                <Minimize2 size={14} />
                                                                            </button>
                                                                        </div>
                                                                    ) : (
                                                                        <button
                                                                            type="button"
                                                                            onClick={(event) =>
                                                                                isLoggedIn
                                                                                    ? startEditScheduledDate(friend, event)
                                                                                    : event.stopPropagation()
                                                                            }
                                                                            className={`inline-flex items-center gap-2 rounded-full border border-white/65 bg-white/55 px-3 py-1.5 text-xs font-mono text-slate-500 shadow-sm ${isLoggedIn ? 'transition-colors hover:text-slate-800' : ''
                                                                                }`}
                                                                        >
                                                                            <CalendarDays size={13} className="text-blue-400" />
                                                                            <span>预定 {formatScheduledContactDate(friend.scheduled_contact_date)}</span>
                                                                        </button>
                                                                    )}
                                                                    {friend.contact_reminder_muted && (
                                                                        <div className="inline-flex items-center gap-1.5 rounded-full border border-slate-200/70 bg-slate-50/70 px-2.5 py-1 text-[11px] font-mono text-slate-500 shadow-sm">
                                                                            <BellOff size={12} className="text-slate-400" />
                                                                            <span>免提醒</span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="mt-6 rounded-[24px] border border-white/75 bg-white/58 px-4 py-5 shadow-[0_14px_24px_-20px_rgba(37,99,235,0.28)] backdrop-blur-sm">
                                                            <div className="mb-4 flex items-center gap-3 pl-[22px] pr-1">
                                                                <span className="text-sm font-semibold tracking-[0.12em] text-slate-600">
                                                                    关联爱好
                                                                </span>
                                                                <div className="h-px flex-1 bg-linear-to-r from-blue-200/70 to-transparent" />
                                                            </div>

                                                            <div className="grid grid-cols-2 gap-y-4 md:grid-cols-4 md:gap-x-0">
                                                                {orderedGroups.map((groupKey, index) => {
                                                                    const hobbies = hobbyGroups[groupKey];
                                                                    const style = HOBBY_GROUP_STYLES[groupKey];
                                                                    const showDivider = index < orderedGroups.length - 1;

                                                                    return (
                                                                        <div
                                                                            key={groupKey}
                                                                            className={`flex min-h-[172px] flex-col items-center px-2 text-center md:px-3 ${showDivider ? 'border-r-2 border-slate-300/70' : ''}`}
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
                                                                                            className={`inline-flex min-w-[104px] justify-center rounded-xl border-[0.5px] px-3 py-2.5 text-center text-[15px] font-medium shadow-[inset_0_1px_0_rgba(255,255,255,0.65)] ${style.shell} ${style.title}`}
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
                            {filteredFriends.length === 0 ? (
                                <div className="rounded-[26px] border border-dashed border-slate-200/80 bg-white/55 px-6 py-12 text-center text-sm text-slate-400">
                                    {selectedHobby ? `没有朋友关联了「${selectedHobby}」` : '还没有朋友记录'}
                                </div>
                            ) : null}
                        </div>
                    </div>
                ) : (
                    <div className="h-full overflow-y-auto px-5 py-5">
                        <div className="mb-4 px-1">
                            <div>
                                <h3 className="text-lg font-serif font-bold tracking-tight text-slate-700">团体</h3>
                                <p className="mt-1 text-[11px] font-mono tracking-[0.15em] text-slate-400">
                                    GROUP ARCHIVE / STATIC PREVIEW
                                </p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {groups.map((group, index) => (
                                <div
                                    key={group.id}
                                    className={`relative overflow-hidden rounded-[26px] border border-white/75 bg-linear-to-br ${index % 2 === 0
                                        ? 'from-amber-100/80 via-orange-50/70 to-white/80'
                                        : 'from-violet-100/80 via-indigo-50/70 to-white/80'
                                        } p-4 shadow-[0_10px_30px_-16px_rgba(15,23,42,0.22)]`}
                                >
                                    <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.18),transparent_40%)]" />

                                    <div className="relative flex gap-6">
                                        {group.image_url ? (
                                            <div className="h-32 w-36 shrink-0 overflow-hidden rounded-[24px] border border-white/70 bg-white/70 shadow-sm">
                                                <img
                                                    src={group.image_url}
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
                                                    成员名录
                                                </div>
                                                <div className="flex flex-wrap gap-2">
                                                    {group.members.map((member) => (
                                                        <span
                                                            key={member.id}
                                                            className="rounded-full border border-stone-200 bg-stone-50/90 px-2.5 py-1 text-[11px] font-medium text-stone-700"
                                                        >
                                                            {member.display_name}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {groups.length === 0 ? (
                                <div className="rounded-[26px] border border-dashed border-slate-200/80 bg-white/55 px-6 py-12 text-center text-sm text-slate-400">
                                    还没有团体记录
                                </div>
                            ) : null}
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

