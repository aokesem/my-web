"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ImageUpload } from "@/components/ui/image-upload";
import { deleteImageFromStorage } from "@/lib/imageUtils";
import {
    fetchProfileSocialRecords,
    type ProfileFriendRecord,
    type ProfileFriendTagRecord,
    type ProfileGroupRecord,
    type ProfileHobbyRecord,
    type SocialCategory,
} from "@/lib/profileSocialRecords";
import { supabase } from "@/lib/supabaseClient";
import {
    CalendarDays,
    Loader2,
    Pencil,
    Plus,
    Save,
    Tags,
    Trash2,
    Users,
    UsersRound,
    X,
} from "lucide-react";
import { toast } from "sonner";

type SocialAdminTab = "friends" | "groups" | "tags";

type FriendFormState = {
    name: string;
    last_contact_date: string;
    image_url: string;
    sort_order: number;
    hobby_ids: number[];
    tag_ids: number[];
};

type GroupDraftMember = {
    id?: number;
    temp_key: string;
    friend_id: number | null;
    display_name: string;
    sort_order: number;
};

type GroupFormState = {
    name: string;
    note: string;
    image_url: string;
    sort_order: number;
    members: GroupDraftMember[];
};

type TagFormState = {
    name: string;
    sort_order: number;
};

const CATEGORY_LABELS: Record<SocialCategory, string> = {
    knowledge: "知识",
    sports: "运动",
    arts: "文艺",
    acgn: "ACGN",
};

const CATEGORY_TONES: Record<SocialCategory, string> = {
    knowledge: "border-blue-900/50 bg-blue-950/20 text-blue-300",
    sports: "border-rose-900/50 bg-rose-950/20 text-rose-300",
    arts: "border-emerald-900/50 bg-emerald-950/20 text-emerald-300",
    acgn: "border-fuchsia-900/50 bg-fuchsia-950/20 text-fuchsia-300",
};

const TAB_META: Record<SocialAdminTab, { label: string; icon: typeof Users; hint: string }> = {
    friends: {
        label: "朋友管理",
        icon: Users,
        hint: "名称、最后联系日期、图片、爱好关联、标签关联",
    },
    groups: {
        label: "团体管理",
        icon: UsersRound,
        hint: "团体名称、备注、图片、成员与自定义成员",
    },
    tags: {
        label: "标签管理",
        icon: Tags,
        hint: "为朋友提供可复用的标签池与排序",
    },
};

function buildEmptyFriendForm(nextOrder: number): FriendFormState {
    return {
        name: "",
        last_contact_date: "",
        image_url: "",
        sort_order: nextOrder,
        hobby_ids: [],
        tag_ids: [],
    };
}

function buildEmptyGroupForm(nextOrder: number): GroupFormState {
    return {
        name: "",
        note: "",
        image_url: "",
        sort_order: nextOrder,
        members: [],
    };
}

function buildEmptyTagForm(nextOrder: number): TagFormState {
    return {
        name: "",
        sort_order: nextOrder,
    };
}

function SelectionChip({
    active,
    onClick,
    children,
}: {
    active: boolean;
    onClick: () => void;
    children: React.ReactNode;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
                active
                    ? "border-white bg-white text-black"
                    : "border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
            }`}
        >
            {children}
        </button>
    );
}

export default function FriendsAdminPage() {
    const [activeTab, setActiveTab] = useState<SocialAdminTab>("friends");
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const [hobbies, setHobbies] = useState<ProfileHobbyRecord[]>([]);
    const [tags, setTags] = useState<ProfileFriendTagRecord[]>([]);
    const [friends, setFriends] = useState<ProfileFriendRecord[]>([]);
    const [groups, setGroups] = useState<ProfileGroupRecord[]>([]);

    const [editingFriendId, setEditingFriendId] = useState<number | null>(null);
    const [editingGroupId, setEditingGroupId] = useState<number | null>(null);
    const [editingTagId, setEditingTagId] = useState<number | null>(null);

    const [friendForm, setFriendForm] = useState<FriendFormState>(buildEmptyFriendForm(1));
    const [groupForm, setGroupForm] = useState<GroupFormState>(buildEmptyGroupForm(1));
    const [tagForm, setTagForm] = useState<TagFormState>(buildEmptyTagForm(1));
    const [customMemberName, setCustomMemberName] = useState("");
    const friendDateInputRef = useRef<HTMLInputElement | null>(null);

    const nextFriendOrder = useMemo(
        () => (friends.length > 0 ? Math.max(...friends.map((item) => item.sort_order || 0)) + 1 : 1),
        [friends]
    );
    const nextGroupOrder = useMemo(
        () => (groups.length > 0 ? Math.max(...groups.map((item) => item.sort_order || 0)) + 1 : 1),
        [groups]
    );
    const nextTagOrder = useMemo(
        () => (tags.length > 0 ? Math.max(...tags.map((item) => item.sort_order || 0)) + 1 : 1),
        [tags]
    );

    const hobbiesByCategory = useMemo(() => {
        const grouped: Record<SocialCategory, ProfileHobbyRecord[]> = {
            knowledge: [],
            sports: [],
            arts: [],
            acgn: [],
        };
        hobbies.forEach((item) => {
            grouped[item.category].push(item);
        });
        return grouped;
    }, [hobbies]);

    const refreshAll = async () => {
        setIsLoading(true);
        try {
            const data = await fetchProfileSocialRecords();
            setHobbies(data.hobbies);
            setTags(data.tags);
            setFriends(data.friends);
            setGroups(data.groups);
        } catch (error) {
            const message = error instanceof Error ? error.message : "加载朋友记录失败";
            toast.error(message);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        refreshAll();
    }, []);

    const resetFriendForm = () => {
        setEditingFriendId(null);
        setFriendForm(buildEmptyFriendForm(nextFriendOrder));
    };

    const resetGroupForm = () => {
        setEditingGroupId(null);
        setCustomMemberName("");
        setGroupForm(buildEmptyGroupForm(nextGroupOrder));
    };

    const resetTagForm = () => {
        setEditingTagId(null);
        setTagForm(buildEmptyTagForm(nextTagOrder));
    };

    const toggleFriendFormId = (field: "hobby_ids" | "tag_ids", id: number) => {
        setFriendForm((prev) => ({
            ...prev,
            [field]: prev[field].includes(id)
                ? prev[field].filter((item) => item !== id)
                : [...prev[field], id],
        }));
    };

    const handleEditFriend = (friend: ProfileFriendRecord) => {
        setEditingFriendId(friend.id);
        setFriendForm({
            name: friend.name,
            last_contact_date: friend.last_contact_date ?? "",
            image_url: friend.image_url ?? "",
            sort_order: friend.sort_order ?? 0,
            hobby_ids: friend.hobby_ids,
            tag_ids: friend.tag_ids,
        });
        setActiveTab("friends");
    };

    const handleEditGroup = (group: ProfileGroupRecord) => {
        setEditingGroupId(group.id);
        setCustomMemberName("");
        setGroupForm({
            name: group.name,
            note: group.note ?? "",
            image_url: group.image_url ?? "",
            sort_order: group.sort_order ?? 0,
            members: group.members.map((member) => ({
                id: member.id,
                temp_key: `member-${member.id}`,
                friend_id: member.friend_id,
                display_name: member.display_name,
                sort_order: member.sort_order,
            })),
        });
        setActiveTab("groups");
    };

    const handleEditTag = (tag: ProfileFriendTagRecord) => {
        setEditingTagId(tag.id);
        setTagForm({
            name: tag.name,
            sort_order: tag.sort_order ?? 0,
        });
        setActiveTab("tags");
    };

    const saveFriend = async () => {
        const name = friendForm.name.trim();
        if (!name) {
            toast.warning("朋友名称不能为空");
            return;
        }

        setIsSaving(true);
        try {
            const currentEditingFriend = editingFriendId
                ? friends.find((item) => item.id === editingFriendId) ?? null
                : null;
            const dateChanged =
                (currentEditingFriend?.last_contact_date ?? "") !==
                (friendForm.last_contact_date || "");
            const payload = {
                name,
                last_contact_date: friendForm.last_contact_date || null,
                image_url: friendForm.image_url || null,
                sort_order: Number(friendForm.sort_order) || 0,
                updated_at: new Date().toISOString(),
                ...(!editingFriendId || dateChanged
                    ? { contact_reminder_snoozed_until: null }
                    : {}),
            };

            let friendId = editingFriendId;
            if (editingFriendId) {
                const { error } = await supabase
                    .from("profile_friends")
                    .update(payload)
                    .eq("id", editingFriendId);
                if (error) throw error;
            } else {
                const { data, error } = await supabase
                    .from("profile_friends")
                    .insert({
                        ...payload,
                        updated_at: new Date().toISOString(),
                    })
                    .select("id")
                    .single();
                if (error || !data) throw error || new Error("创建朋友失败");
                friendId = data.id;
            }

            if (!friendId) throw new Error("保存朋友失败");

            await Promise.all([
                supabase.from("profile_friend_tag_links").delete().eq("friend_id", friendId),
                supabase.from("profile_friend_hobby_links").delete().eq("friend_id", friendId),
            ]);

            if (friendForm.tag_ids.length > 0) {
                const { error } = await supabase.from("profile_friend_tag_links").insert(
                    friendForm.tag_ids.map((tagId) => ({
                        friend_id: friendId,
                        tag_id: tagId,
                    }))
                );
                if (error) throw error;
            }

            if (friendForm.hobby_ids.length > 0) {
                const { error } = await supabase.from("profile_friend_hobby_links").insert(
                    friendForm.hobby_ids.map((hobbyId) => ({
                        friend_id: friendId,
                        hobby_id: hobbyId,
                    }))
                );
                if (error) throw error;
            }

            toast.success(editingFriendId ? "朋友已更新" : "朋友已添加");
            resetFriendForm();
            await refreshAll();
        } catch (error) {
            const message = error instanceof Error ? error.message : "保存朋友失败";
            toast.error(message);
        } finally {
            setIsSaving(false);
        }
    };

    const deleteFriend = async (friend: ProfileFriendRecord) => {
        if (!confirm(`删除朋友「${friend.name}」？`)) return;
        try {
            if (friend.image_url) {
                await deleteImageFromStorage(friend.image_url);
            }
            const { error } = await supabase.from("profile_friends").delete().eq("id", friend.id);
            if (error) throw error;
            if (editingFriendId === friend.id) resetFriendForm();
            toast.success("朋友已删除");
            await refreshAll();
        } catch (error) {
            const message = error instanceof Error ? error.message : "删除朋友失败";
            toast.error(message);
        }
    };

    const toggleGroupFriendMember = (friend: ProfileFriendRecord) => {
        setGroupForm((prev) => {
            const existing = prev.members.find((member) => member.friend_id === friend.id);
            if (existing) {
                return {
                    ...prev,
                    members: prev.members
                        .filter((member) => member.friend_id !== friend.id)
                        .map((member, index) => ({ ...member, sort_order: index })),
                };
            }

            return {
                ...prev,
                members: [
                    ...prev.members,
                    {
                        temp_key: `friend-${friend.id}`,
                        friend_id: friend.id,
                        display_name: friend.name,
                        sort_order: prev.members.length,
                    },
                ],
            };
        });
    };

    const addCustomMember = () => {
        const name = customMemberName.trim();
        if (!name) return;
        setGroupForm((prev) => ({
            ...prev,
            members: [
                ...prev.members,
                {
                    temp_key: `custom-${Date.now()}`,
                    friend_id: null,
                    display_name: name,
                    sort_order: prev.members.length,
                },
            ],
        }));
        setCustomMemberName("");
    };

    const removeGroupMember = (tempKey: string) => {
        setGroupForm((prev) => ({
            ...prev,
            members: prev.members
                .filter((member) => member.temp_key !== tempKey)
                .map((member, index) => ({ ...member, sort_order: index })),
        }));
    };

    const moveGroupMember = (index: number, offset: number) => {
        setGroupForm((prev) => {
            const target = index + offset;
            if (target < 0 || target >= prev.members.length) return prev;
            const next = [...prev.members];
            const [current] = next.splice(index, 1);
            next.splice(target, 0, current);
            return {
                ...prev,
                members: next.map((member, memberIndex) => ({
                    ...member,
                    sort_order: memberIndex,
                })),
            };
        });
    };

    const saveGroup = async () => {
        const name = groupForm.name.trim();
        if (!name) {
            toast.warning("团体名称不能为空");
            return;
        }

        setIsSaving(true);
        try {
            const payload = {
                name,
                note: groupForm.note.trim() || null,
                image_url: groupForm.image_url || null,
                sort_order: Number(groupForm.sort_order) || 0,
                updated_at: new Date().toISOString(),
            };

            let groupId = editingGroupId;
            if (editingGroupId) {
                const { error } = await supabase
                    .from("profile_groups")
                    .update(payload)
                    .eq("id", editingGroupId);
                if (error) throw error;
            } else {
                const { data, error } = await supabase
                    .from("profile_groups")
                    .insert(payload)
                    .select("id")
                    .single();
                if (error || !data) throw error || new Error("创建团体失败");
                groupId = data.id;
            }

            if (!groupId) throw new Error("保存团体失败");

            const { error: clearError } = await supabase
                .from("profile_group_members")
                .delete()
                .eq("group_id", groupId);
            if (clearError) throw clearError;

            if (groupForm.members.length > 0) {
                const { error } = await supabase.from("profile_group_members").insert(
                    groupForm.members.map((member, index) => ({
                        group_id: groupId,
                        friend_id: member.friend_id,
                        display_name: member.display_name.trim() || null,
                        sort_order: index,
                    }))
                );
                if (error) throw error;
            }

            toast.success(editingGroupId ? "团体已更新" : "团体已添加");
            resetGroupForm();
            await refreshAll();
        } catch (error) {
            const message = error instanceof Error ? error.message : "保存团体失败";
            toast.error(message);
        } finally {
            setIsSaving(false);
        }
    };

    const deleteGroup = async (group: ProfileGroupRecord) => {
        if (!confirm(`删除团体「${group.name}」？`)) return;
        try {
            if (group.image_url) {
                await deleteImageFromStorage(group.image_url);
            }
            const { error } = await supabase.from("profile_groups").delete().eq("id", group.id);
            if (error) throw error;
            if (editingGroupId === group.id) resetGroupForm();
            toast.success("团体已删除");
            await refreshAll();
        } catch (error) {
            const message = error instanceof Error ? error.message : "删除团体失败";
            toast.error(message);
        }
    };

    const saveTag = async () => {
        const name = tagForm.name.trim();
        if (!name) {
            toast.warning("标签名称不能为空");
            return;
        }

        setIsSaving(true);
        try {
            const payload = {
                name,
                sort_order: Number(tagForm.sort_order) || 0,
            };
            if (editingTagId) {
                const { error } = await supabase
                    .from("profile_friend_tags")
                    .update(payload)
                    .eq("id", editingTagId);
                if (error) throw error;
            } else {
                const { error } = await supabase.from("profile_friend_tags").insert(payload);
                if (error) throw error;
            }

            toast.success(editingTagId ? "标签已更新" : "标签已添加");
            resetTagForm();
            await refreshAll();
        } catch (error) {
            const message = error instanceof Error ? error.message : "保存标签失败";
            toast.error(message);
        } finally {
            setIsSaving(false);
        }
    };

    const deleteTag = async (tag: ProfileFriendTagRecord) => {
        if (!confirm(`删除标签「${tag.name}」？`)) return;
        try {
            const { error } = await supabase.from("profile_friend_tags").delete().eq("id", tag.id);
            if (error) throw error;
            if (editingTagId === tag.id) resetTagForm();
            toast.success("标签已删除");
            await refreshAll();
        } catch (error) {
            const message = error instanceof Error ? error.message : "删除标签失败";
            toast.error(message);
        }
    };

    const renderFriendsTab = () => (
        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
            <section className="rounded-2xl border border-zinc-800 bg-zinc-950/40 p-5 space-y-5">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-semibold text-zinc-100">
                            {editingFriendId ? "编辑朋友" : "新增朋友"}
                        </h2>
                        <p className="mt-1 text-sm text-zinc-500">
                            这里管理朋友主体信息，以及爱好和标签关联。
                        </p>
                    </div>
                    {editingFriendId ? (
                        <Button variant="ghost" onClick={resetFriendForm} className="text-zinc-400 hover:text-white">
                            <X size={16} className="mr-2" />
                            取消编辑
                        </Button>
                    ) : null}
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">名称</label>
                        <Input
                            value={friendForm.name}
                            onChange={(event) => setFriendForm((prev) => ({ ...prev, name: event.target.value }))}
                            className="bg-black border-zinc-800 text-zinc-200"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">排序</label>
                        <Input
                            type="number"
                            value={friendForm.sort_order}
                            onChange={(event) =>
                                setFriendForm((prev) => ({
                                    ...prev,
                                    sort_order: parseInt(event.target.value || "0", 10),
                                }))
                            }
                            className="bg-black border-zinc-800 text-zinc-200"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">最后联系日期</label>
                        <div className="flex gap-2">
                            <Input
                                ref={friendDateInputRef}
                                type="date"
                                value={friendForm.last_contact_date}
                                onChange={(event) =>
                                    setFriendForm((prev) => ({ ...prev, last_contact_date: event.target.value }))
                                }
                                className="bg-black border-zinc-800 text-zinc-200"
                            />
                            <Button
                                type="button"
                                variant="secondary"
                                className="shrink-0"
                                onClick={() => friendDateInputRef.current?.showPicker?.()}
                                title="open-calendar"
                            >
                                <CalendarDays size={16} />
                            </Button>
                            <Button
                                type="button"
                                variant="secondary"
                                className="shrink-0"
                                onClick={() =>
                                    setFriendForm((prev) => ({
                                        ...prev,
                                        last_contact_date: new Date().toISOString().slice(0, 10),
                                    }))
                                }
                            >
                                Today
                            </Button>
                        </div>
                    </div>
                    <div className="space-y-2 md:col-span-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">图片</label>
                        <ImageUpload
                            value={friendForm.image_url}
                            onChange={(url) => setFriendForm((prev) => ({ ...prev, image_url: url }))}
                            bucket="images"
                            folder="profile/friends"
                        />
                    </div>
                </div>

                <div className="space-y-3">
                    <div className="text-xs font-bold uppercase tracking-wider text-zinc-500">关联爱好</div>
                    <div className="space-y-4">
                        {(Object.keys(hobbiesByCategory) as SocialCategory[]).map((category) => (
                            <div key={category} className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <span className={`rounded-full border px-2.5 py-0.5 text-[11px] ${CATEGORY_TONES[category]}`}>
                                        {CATEGORY_LABELS[category]}
                                    </span>
                                    <div className="h-px flex-1 bg-zinc-800" />
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {hobbiesByCategory[category].map((hobby) => (
                                        <SelectionChip
                                            key={hobby.id}
                                            active={friendForm.hobby_ids.includes(hobby.id)}
                                            onClick={() => toggleFriendFormId("hobby_ids", hobby.id)}
                                        >
                                            {hobby.name}
                                        </SelectionChip>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="space-y-3">
                    <div className="text-xs font-bold uppercase tracking-wider text-zinc-500">自定义标签</div>
                    <div className="flex flex-wrap gap-2">
                        {tags.length > 0 ? (
                            tags.map((tag) => (
                                <SelectionChip
                                    key={tag.id}
                                    active={friendForm.tag_ids.includes(tag.id)}
                                    onClick={() => toggleFriendFormId("tag_ids", tag.id)}
                                >
                                    {tag.name}
                                </SelectionChip>
                            ))
                        ) : (
                            <span className="text-sm text-zinc-500">还没有标签，可以先去“标签管理”里添加。</span>
                        )}
                    </div>
                </div>

                <div className="flex justify-end">
                    <Button onClick={saveFriend} disabled={isSaving} className="bg-white text-black hover:bg-zinc-200">
                        {isSaving ? (
                            <Loader2 size={16} className="mr-2 animate-spin" />
                        ) : editingFriendId ? (
                            <Save size={16} className="mr-2" />
                        ) : (
                            <Plus size={16} className="mr-2" />
                        )}
                        {editingFriendId ? "保存修改" : "添加朋友"}
                    </Button>
                </div>
            </section>

            <section className="rounded-2xl border border-zinc-800 bg-zinc-950/40 p-5">
                <div className="mb-4 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-semibold text-zinc-100">朋友列表</h2>
                        <p className="mt-1 text-sm text-zinc-500">共 {friends.length} 位朋友，按排序值升序展示。</p>
                    </div>
                </div>

                <div className="space-y-3">
                    {friends.map((friend) => (
                        <div key={friend.id} className="rounded-2xl border border-zinc-800 bg-black/30 p-4">
                            <div className="flex items-start gap-4">
                                <div className="h-20 w-16 shrink-0 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900">
                                    {friend.image_url ? (
                                        <img src={friend.image_url} alt={friend.name} className="h-full w-full object-cover" />
                                    ) : (
                                        <div className="flex h-full w-full items-center justify-center text-[10px] text-zinc-600">
                                            无图
                                        </div>
                                    )}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <div className="text-lg font-semibold text-zinc-100">{friend.name}</div>
                                            <div className="mt-1 text-xs text-zinc-500">
                                                最后联系：{friend.last_contact_date ? friend.last_contact_date : "未记录"}
                                            </div>
                                        </div>
                                        <div className="text-xs font-mono text-zinc-500">#{friend.sort_order}</div>
                                    </div>
                                    <div className="mt-3 flex flex-wrap gap-2">
                                        {friend.tags.map((tag) => (
                                            <span key={tag.id} className="rounded-full border border-zinc-700 bg-zinc-900 px-2.5 py-1 text-[11px] text-zinc-300">
                                                {tag.name}
                                            </span>
                                        ))}
                                    </div>
                                    <div className="mt-3 flex flex-wrap gap-2">
                                        {friend.hobbies.map((hobby) => (
                                            <span
                                                key={hobby.id}
                                                className={`rounded-full border px-2.5 py-1 text-[11px] ${CATEGORY_TONES[hobby.category]}`}
                                            >
                                                {hobby.name}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div className="mt-4 flex justify-end gap-2">
                                <Button variant="ghost" size="sm" onClick={() => handleEditFriend(friend)} className="text-zinc-400 hover:text-white">
                                    <Pencil size={14} className="mr-2" />
                                    编辑
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => deleteFriend(friend)} className="text-red-400 hover:text-red-300">
                                    <Trash2 size={14} className="mr-2" />
                                    删除
                                </Button>
                            </div>
                        </div>
                    ))}
                    {friends.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-zinc-800 px-4 py-10 text-center text-sm text-zinc-500">
                            还没有朋友记录。
                        </div>
                    ) : null}
                </div>
            </section>
        </div>
    );

    const renderGroupsTab = () => (
        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            <section className="rounded-2xl border border-zinc-800 bg-zinc-950/40 p-5 space-y-5">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-semibold text-zinc-100">
                            {editingGroupId ? "编辑团体" : "新增团体"}
                        </h2>
                        <p className="mt-1 text-sm text-zinc-500">
                            团体可以同时放入已添加朋友和纯自定义成员。
                        </p>
                    </div>
                    {editingGroupId ? (
                        <Button variant="ghost" onClick={resetGroupForm} className="text-zinc-400 hover:text-white">
                            <X size={16} className="mr-2" />
                            取消编辑
                        </Button>
                    ) : null}
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">名称</label>
                        <Input
                            value={groupForm.name}
                            onChange={(event) => setGroupForm((prev) => ({ ...prev, name: event.target.value }))}
                            className="bg-black border-zinc-800 text-zinc-200"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">排序</label>
                        <Input
                            type="number"
                            value={groupForm.sort_order}
                            onChange={(event) =>
                                setGroupForm((prev) => ({
                                    ...prev,
                                    sort_order: parseInt(event.target.value || "0", 10),
                                }))
                            }
                            className="bg-black border-zinc-800 text-zinc-200"
                        />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">备注</label>
                        <textarea
                            value={groupForm.note}
                            onChange={(event) => setGroupForm((prev) => ({ ...prev, note: event.target.value }))}
                            className="min-h-[110px] w-full rounded-md border border-zinc-800 bg-black px-3 py-2 text-sm text-zinc-200 outline-none focus:ring-2 focus:ring-zinc-700"
                        />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">图片</label>
                        <ImageUpload
                            value={groupForm.image_url}
                            onChange={(url) => setGroupForm((prev) => ({ ...prev, image_url: url }))}
                            bucket="images"
                            folder="profile/groups"
                        />
                    </div>
                </div>

                <div className="space-y-3">
                    <div className="text-xs font-bold uppercase tracking-wider text-zinc-500">加入已添加朋友</div>
                    <div className="flex flex-wrap gap-2">
                        {friends.map((friend) => (
                            <SelectionChip
                                key={friend.id}
                                active={groupForm.members.some((member) => member.friend_id === friend.id)}
                                onClick={() => toggleGroupFriendMember(friend)}
                            >
                                {friend.name}
                            </SelectionChip>
                        ))}
                    </div>
                </div>

                <div className="space-y-3">
                    <div className="text-xs font-bold uppercase tracking-wider text-zinc-500">新增自定义成员</div>
                    <div className="flex gap-3">
                        <Input
                            value={customMemberName}
                            onChange={(event) => setCustomMemberName(event.target.value)}
                            onKeyDown={(event) => {
                                if (event.key === "Enter") {
                                    event.preventDefault();
                                    addCustomMember();
                                }
                            }}
                            className="bg-black border-zinc-800 text-zinc-200"
                            placeholder="输入成员名称"
                        />
                        <Button type="button" onClick={addCustomMember} variant="secondary">
                            <Plus size={16} className="mr-2" />
                            添加
                        </Button>
                    </div>
                </div>

                <div className="space-y-3">
                    <div className="text-xs font-bold uppercase tracking-wider text-zinc-500">成员顺序</div>
                    <div className="space-y-2">
                        {groupForm.members.map((member, index) => (
                            <div
                                key={member.temp_key}
                                className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-black/30 px-3 py-3"
                            >
                                <div className="min-w-0 flex-1">
                                    <div className="text-sm font-medium text-zinc-100">{member.display_name}</div>
                                    <div className="mt-1 text-[11px] text-zinc-500">
                                        {member.friend_id ? "已关联朋友" : "自定义成员"}
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => moveGroupMember(index, -1)}
                                        disabled={index === 0}
                                        className="text-zinc-400 hover:text-white"
                                    >
                                        上移
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => moveGroupMember(index, 1)}
                                        disabled={index === groupForm.members.length - 1}
                                        className="text-zinc-400 hover:text-white"
                                    >
                                        下移
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => removeGroupMember(member.temp_key)}
                                        className="text-red-400 hover:text-red-300"
                                    >
                                        删除
                                    </Button>
                                </div>
                            </div>
                        ))}
                        {groupForm.members.length === 0 ? (
                            <div className="rounded-xl border border-dashed border-zinc-800 px-4 py-6 text-sm text-zinc-500">
                                还没有成员。
                            </div>
                        ) : null}
                    </div>
                </div>

                <div className="flex justify-end">
                    <Button onClick={saveGroup} disabled={isSaving} className="bg-white text-black hover:bg-zinc-200">
                        {isSaving ? (
                            <Loader2 size={16} className="mr-2 animate-spin" />
                        ) : editingGroupId ? (
                            <Save size={16} className="mr-2" />
                        ) : (
                            <Plus size={16} className="mr-2" />
                        )}
                        {editingGroupId ? "保存修改" : "添加团体"}
                    </Button>
                </div>
            </section>

            <section className="rounded-2xl border border-zinc-800 bg-zinc-950/40 p-5">
                <div className="mb-4">
                    <h2 className="text-xl font-semibold text-zinc-100">团体列表</h2>
                    <p className="mt-1 text-sm text-zinc-500">共 {groups.length} 个团体，展示当前成员名录。</p>
                </div>
                <div className="space-y-3">
                    {groups.map((group) => (
                        <div key={group.id} className="rounded-2xl border border-zinc-800 bg-black/30 p-4">
                            <div className="flex items-start gap-4">
                                {group.image_url ? (
                                    <div className="h-24 w-28 shrink-0 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900">
                                        <img src={group.image_url} alt={group.name} className="h-full w-full object-cover" />
                                    </div>
                                ) : null}
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <div className="text-lg font-semibold text-zinc-100">{group.name}</div>
                                            {group.note ? (
                                                <p className="mt-2 text-sm leading-relaxed text-zinc-400">{group.note}</p>
                                            ) : null}
                                        </div>
                                        <div className="text-xs font-mono text-zinc-500">#{group.sort_order}</div>
                                    </div>
                                    <div className="mt-3 flex flex-wrap gap-2">
                                        {group.members.map((member) => (
                                            <span key={member.id} className="rounded-full border border-zinc-700 bg-zinc-900 px-2.5 py-1 text-[11px] text-zinc-300">
                                                {member.display_name}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div className="mt-4 flex justify-end gap-2">
                                <Button variant="ghost" size="sm" onClick={() => handleEditGroup(group)} className="text-zinc-400 hover:text-white">
                                    <Pencil size={14} className="mr-2" />
                                    编辑
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => deleteGroup(group)} className="text-red-400 hover:text-red-300">
                                    <Trash2 size={14} className="mr-2" />
                                    删除
                                </Button>
                            </div>
                        </div>
                    ))}
                    {groups.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-zinc-800 px-4 py-10 text-center text-sm text-zinc-500">
                            还没有团体记录。
                        </div>
                    ) : null}
                </div>
            </section>
        </div>
    );

    const renderTagsTab = () => (
        <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
            <section className="rounded-2xl border border-zinc-800 bg-zinc-950/40 p-5 space-y-5">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-semibold text-zinc-100">
                            {editingTagId ? "编辑标签" : "新增标签"}
                        </h2>
                        <p className="mt-1 text-sm text-zinc-500">标签会作为朋友卡片中名字下方的补充信息。</p>
                    </div>
                    {editingTagId ? (
                        <Button variant="ghost" onClick={resetTagForm} className="text-zinc-400 hover:text-white">
                            <X size={16} className="mr-2" />
                            取消编辑
                        </Button>
                    ) : null}
                </div>

                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">标签名称</label>
                        <Input
                            value={tagForm.name}
                            onChange={(event) => setTagForm((prev) => ({ ...prev, name: event.target.value }))}
                            className="bg-black border-zinc-800 text-zinc-200"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">排序</label>
                        <Input
                            type="number"
                            value={tagForm.sort_order}
                            onChange={(event) =>
                                setTagForm((prev) => ({
                                    ...prev,
                                    sort_order: parseInt(event.target.value || "0", 10),
                                }))
                            }
                            className="bg-black border-zinc-800 text-zinc-200"
                        />
                    </div>
                </div>

                <div className="flex justify-end">
                    <Button onClick={saveTag} disabled={isSaving} className="bg-white text-black hover:bg-zinc-200">
                        {isSaving ? (
                            <Loader2 size={16} className="mr-2 animate-spin" />
                        ) : editingTagId ? (
                            <Save size={16} className="mr-2" />
                        ) : (
                            <Plus size={16} className="mr-2" />
                        )}
                        {editingTagId ? "保存修改" : "添加标签"}
                    </Button>
                </div>
            </section>

            <section className="rounded-2xl border border-zinc-800 bg-zinc-950/40 p-5">
                <div className="mb-4">
                    <h2 className="text-xl font-semibold text-zinc-100">标签列表</h2>
                    <p className="mt-1 text-sm text-zinc-500">这些标签会提供给朋友表单复用。</p>
                </div>
                <div className="space-y-3">
                    {tags.map((tag) => (
                        <div key={tag.id} className="flex items-center justify-between rounded-2xl border border-zinc-800 bg-black/30 px-4 py-4">
                            <div>
                                <div className="text-sm font-medium text-zinc-100">{tag.name}</div>
                                <div className="mt-1 text-xs text-zinc-500">排序值：{tag.sort_order}</div>
                            </div>
                            <div className="flex gap-2">
                                <Button variant="ghost" size="sm" onClick={() => handleEditTag(tag)} className="text-zinc-400 hover:text-white">
                                    <Pencil size={14} className="mr-2" />
                                    编辑
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => deleteTag(tag)} className="text-red-400 hover:text-red-300">
                                    <Trash2 size={14} className="mr-2" />
                                    删除
                                </Button>
                            </div>
                        </div>
                    ))}
                    {tags.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-zinc-800 px-4 py-10 text-center text-sm text-zinc-500">
                            还没有标签。
                        </div>
                    ) : null}
                </div>
            </section>
        </div>
    );

    return (
        <div className="space-y-8 text-zinc-200">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
                <div>
                    <h1 className="mb-2 flex items-center gap-3 text-3xl font-bold tracking-tight text-white">
                        <Users size={28} className="text-zinc-400" />
                        朋友记录
                    </h1>
                    <p className="max-w-3xl text-sm text-zinc-400">
                        统一管理朋友、团体与标签，并为 profile 页与信息清单提供真实数据。
                    </p>
                </div>
            </div>

            <section className="rounded-2xl border border-zinc-800 bg-zinc-950/40 p-5 space-y-5">
                <div className="flex flex-wrap gap-1 rounded-xl border border-zinc-800 bg-zinc-900 p-1 w-fit">
                    {(Object.keys(TAB_META) as SocialAdminTab[]).map((tab) => {
                        const meta = TAB_META[tab];
                        return (
                            <button
                                key={tab}
                                type="button"
                                className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                                    activeTab === tab
                                        ? "bg-zinc-800 text-white shadow-sm"
                                        : "text-zinc-400 hover:text-zinc-200"
                                }`}
                                onClick={() => setActiveTab(tab)}
                            >
                                {meta.label}
                            </button>
                        );
                    })}
                </div>

                <div className="space-y-2 border-b border-zinc-800 pb-4">
                    <h2 className="text-xl font-semibold text-zinc-100">{TAB_META[activeTab].label}</h2>
                    <p className="text-sm text-zinc-500">{TAB_META[activeTab].hint}</p>
                </div>

                {isLoading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 size={28} className="animate-spin text-zinc-500" />
                    </div>
                ) : activeTab === "friends" ? (
                    renderFriendsTab()
                ) : activeTab === "groups" ? (
                    renderGroupsTab()
                ) : (
                    renderTagsTab()
                )}
            </section>
        </div>
    );
}
