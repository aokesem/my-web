"use client";

import { supabase } from "@/lib/supabaseClient";

export type SocialCategory = "knowledge" | "sports" | "arts" | "acgn";

export interface ProfileHobbyRecord {
    id: number;
    category: SocialCategory;
    name: string;
    description: string;
    level: number;
}

export interface ProfileFriendTagRecord {
    id: number;
    name: string;
    sort_order: number;
    created_at?: string;
}

export interface ProfileFriendRecord {
    id: number;
    name: string;
    last_contact_date: string | null;
    image_url: string | null;
    sort_order: number;
    created_at?: string;
    updated_at?: string;
    hobby_ids: number[];
    tag_ids: number[];
    hobbies: ProfileHobbyRecord[];
    tags: ProfileFriendTagRecord[];
}

export interface ProfileGroupMemberRecord {
    id: number;
    group_id: number;
    friend_id: number | null;
    display_name: string;
    sort_order: number;
}

export interface ProfileGroupRecord {
    id: number;
    name: string;
    note: string | null;
    image_url: string | null;
    sort_order: number;
    created_at?: string;
    updated_at?: string;
    members: ProfileGroupMemberRecord[];
}

type FriendRow = {
    id: number;
    name: string;
    last_contact_date: string | null;
    image_url: string | null;
    sort_order: number | null;
    created_at?: string;
    updated_at?: string;
};

type FriendTagLinkRow = {
    friend_id: number;
    tag_id: number;
};

type FriendHobbyLinkRow = {
    friend_id: number;
    hobby_id: number;
};

type GroupRow = {
    id: number;
    name: string;
    note: string | null;
    image_url: string | null;
    sort_order: number | null;
    created_at?: string;
    updated_at?: string;
};

type GroupMemberRow = {
    id: number;
    group_id: number;
    friend_id: number | null;
    display_name: string | null;
    sort_order: number | null;
};

function normalizeSupabaseError(error: unknown, fallback: string) {
    if (!error || typeof error !== "object") return fallback;
    const e = error as { message?: string; details?: string; hint?: string };
    return [e.message, e.details, e.hint].filter(Boolean).join(" | ") || fallback;
}

export function getTodayDateKey() {
    const now = new Date();
    const year = now.getFullYear();
    const month = `${now.getMonth() + 1}`.padStart(2, "0");
    const day = `${now.getDate()}`.padStart(2, "0");
    return `${year}-${month}-${day}`;
}

export function getDaysSinceDate(date: string, today = getTodayDateKey()) {
    const [fy, fm, fd] = date.split("-").map(Number);
    const [ty, tm, td] = today.split("-").map(Number);
    const from = new Date(fy, fm - 1, fd).getTime();
    const to = new Date(ty, tm - 1, td).getTime();
    return Math.round((to - from) / (24 * 60 * 60 * 1000));
}

export async function fetchProfileSocialRecords() {
    const [
        hobbiesRes,
        tagsRes,
        friendsRes,
        friendTagLinksRes,
        friendHobbyLinksRes,
        groupsRes,
        groupMembersRes,
    ] = await Promise.all([
        supabase
            .from("profile_hobbies")
            .select("*")
            .order("category", { ascending: true })
            .order("level", { ascending: false })
            .order("id", { ascending: true }),
        supabase
            .from("profile_friend_tags")
            .select("*")
            .order("sort_order", { ascending: true })
            .order("id", { ascending: true }),
        supabase
            .from("profile_friends")
            .select("*")
            .order("sort_order", { ascending: true })
            .order("created_at", { ascending: true })
            .order("id", { ascending: true }),
        supabase.from("profile_friend_tag_links").select("friend_id, tag_id"),
        supabase.from("profile_friend_hobby_links").select("friend_id, hobby_id"),
        supabase
            .from("profile_groups")
            .select("*")
            .order("sort_order", { ascending: true })
            .order("created_at", { ascending: true })
            .order("id", { ascending: true }),
        supabase
            .from("profile_group_members")
            .select("*")
            .order("group_id", { ascending: true })
            .order("sort_order", { ascending: true })
            .order("id", { ascending: true }),
    ]);

    const errors = [
        hobbiesRes.error,
        tagsRes.error,
        friendsRes.error,
        friendTagLinksRes.error,
        friendHobbyLinksRes.error,
        groupsRes.error,
        groupMembersRes.error,
    ].filter(Boolean);

    if (errors.length > 0) {
        throw new Error(normalizeSupabaseError(errors[0], "加载朋友记录失败"));
    }

    const hobbies = (hobbiesRes.data || []) as ProfileHobbyRecord[];
    const tags = (tagsRes.data || []) as ProfileFriendTagRecord[];
    const friendRows = (friendsRes.data || []) as FriendRow[];
    const friendTagLinks = (friendTagLinksRes.data || []) as FriendTagLinkRow[];
    const friendHobbyLinks = (friendHobbyLinksRes.data || []) as FriendHobbyLinkRow[];
    const groupRows = (groupsRes.data || []) as GroupRow[];
    const groupMemberRows = (groupMembersRes.data || []) as GroupMemberRow[];

    const hobbyById = new Map(hobbies.map((item) => [item.id, item]));
    const tagById = new Map(tags.map((item) => [item.id, item]));
    const friendNameById = new Map(friendRows.map((item) => [item.id, item.name]));

    const tagIdsByFriend = new Map<number, number[]>();
    friendTagLinks.forEach((link) => {
        const prev = tagIdsByFriend.get(link.friend_id) || [];
        prev.push(link.tag_id);
        tagIdsByFriend.set(link.friend_id, prev);
    });

    const hobbyIdsByFriend = new Map<number, number[]>();
    friendHobbyLinks.forEach((link) => {
        const prev = hobbyIdsByFriend.get(link.friend_id) || [];
        prev.push(link.hobby_id);
        hobbyIdsByFriend.set(link.friend_id, prev);
    });

    const friends: ProfileFriendRecord[] = friendRows.map((friend) => {
        const hobbyIds = hobbyIdsByFriend.get(friend.id) || [];
        const tagIds = tagIdsByFriend.get(friend.id) || [];
        return {
            ...friend,
            image_url: friend.image_url ?? null,
            last_contact_date: friend.last_contact_date ?? null,
            sort_order: friend.sort_order ?? 0,
            hobby_ids: hobbyIds,
            tag_ids: tagIds,
            hobbies: hobbyIds
                .map((id) => hobbyById.get(id))
                .filter((item): item is ProfileHobbyRecord => Boolean(item)),
            tags: tagIds
                .map((id) => tagById.get(id))
                .filter((item): item is ProfileFriendTagRecord => Boolean(item)),
        };
    });

    const membersByGroup = new Map<number, ProfileGroupMemberRecord[]>();
    groupMemberRows.forEach((member) => {
        const prev = membersByGroup.get(member.group_id) || [];
        prev.push({
            id: member.id,
            group_id: member.group_id,
            friend_id: member.friend_id ?? null,
            display_name:
                member.display_name?.trim() ||
                (member.friend_id ? friendNameById.get(member.friend_id) || "未命名成员" : "未命名成员"),
            sort_order: member.sort_order ?? 0,
        });
        membersByGroup.set(member.group_id, prev);
    });

    const groups: ProfileGroupRecord[] = groupRows.map((group) => ({
        ...group,
        note: group.note ?? "",
        image_url: group.image_url ?? null,
        sort_order: group.sort_order ?? 0,
        members: membersByGroup.get(group.id) || [],
    }));

    return {
        hobbies,
        tags,
        friends,
        groups,
    };
}
