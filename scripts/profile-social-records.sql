-- profile social records
-- 朋友 / 团体 / 标签 / 爱好关联 / 团体成员

create table if not exists public.profile_friends (
    id bigint generated always as identity primary key,
    name text not null,
    last_contact_date date null,
    contact_reminder_snoozed_until date null,
    image_url text null,
    sort_order integer not null default 0,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

alter table if exists public.profile_friends
    add column if not exists contact_reminder_snoozed_until date null;

create table if not exists public.profile_friend_tags (
    id bigint generated always as identity primary key,
    name text not null unique,
    sort_order integer not null default 0,
    created_at timestamptz not null default now()
);

create table if not exists public.profile_friend_tag_links (
    id bigint generated always as identity primary key,
    friend_id bigint not null references public.profile_friends(id) on delete cascade,
    tag_id bigint not null references public.profile_friend_tags(id) on delete cascade,
    created_at timestamptz not null default now(),
    constraint profile_friend_tag_links_unique unique (friend_id, tag_id)
);

create table if not exists public.profile_friend_hobby_links (
    id bigint generated always as identity primary key,
    friend_id bigint not null references public.profile_friends(id) on delete cascade,
    hobby_id bigint not null references public.profile_hobbies(id) on delete cascade,
    created_at timestamptz not null default now(),
    constraint profile_friend_hobby_links_unique unique (friend_id, hobby_id)
);

create table if not exists public.profile_groups (
    id bigint generated always as identity primary key,
    name text not null,
    note text null,
    image_url text null,
    sort_order integer not null default 0,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table if not exists public.profile_group_members (
    id bigint generated always as identity primary key,
    group_id bigint not null references public.profile_groups(id) on delete cascade,
    friend_id bigint null references public.profile_friends(id) on delete set null,
    display_name text null,
    sort_order integer not null default 0,
    created_at timestamptz not null default now(),
    constraint profile_group_members_name_or_friend check (
        friend_id is not null or display_name is not null
    )
);

create unique index if not exists profile_group_members_friend_unique
    on public.profile_group_members (group_id, friend_id)
    where friend_id is not null;

create index if not exists profile_friends_sort_order_idx
    on public.profile_friends (sort_order asc, created_at asc, id asc);

create index if not exists profile_friend_tags_sort_order_idx
    on public.profile_friend_tags (sort_order asc, id asc);

create index if not exists profile_friend_tag_links_friend_idx
    on public.profile_friend_tag_links (friend_id asc);

create index if not exists profile_friend_tag_links_tag_idx
    on public.profile_friend_tag_links (tag_id asc);

create index if not exists profile_friend_hobby_links_friend_idx
    on public.profile_friend_hobby_links (friend_id asc);

create index if not exists profile_friend_hobby_links_hobby_idx
    on public.profile_friend_hobby_links (hobby_id asc);

create index if not exists profile_groups_sort_order_idx
    on public.profile_groups (sort_order asc, created_at asc, id asc);

create index if not exists profile_group_members_group_sort_idx
    on public.profile_group_members (group_id asc, sort_order asc, id asc);
