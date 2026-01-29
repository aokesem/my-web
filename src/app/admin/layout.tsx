"use client"; // 确保是 Client Component

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
    LayoutDashboard,
    Tv,
    Film,
    BookOpen,
    ArrowLeft,
    LogOut,
    // [新增] 引入 Room 管理相关的图标
    Quote,
    GitCommitHorizontal,
    ListTodo
} from "lucide-react";

// 定义原有导航菜单项 (Home Data)
const HOME_NAV_ITEMS = [
    { title: "概览", href: "/admin", icon: LayoutDashboard },
    { title: "番剧管理", href: "/admin/anime", icon: Tv },
    { title: "电影管理", href: "/admin/movies", icon: Film },
    { title: "读书管理", href: "/admin/books", icon: BookOpen },
];

// [新增] 定义 Room 管理菜单项
const ROOM_NAV_ITEMS = [
    { title: "格言管理", href: "/admin/room/quotes", icon: Quote },
    { title: "时间线", href: "/admin/room/timeline", icon: GitCommitHorizontal },
    { title: "习惯配置", href: "/admin/room/habits", icon: ListTodo },
];

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex min-h-screen bg-black text-white font-sans">
            {/* 左侧侧边栏 */}
            <aside className="fixed inset-y-0 left-0 z-50 w-64 border-r border-white/10 bg-[#0A0A0A] flex flex-col">

                {/* 1. 顶部区域：返回主页 + 标题 */}
                <div className="flex flex-col gap-4 p-6 border-b border-white/10">
                    {/* 返回主页按钮 - 放在最左上角 */}
                    <Link href="/">
                        <Button
                            variant="outline"
                            size="sm"
                            className="w-full justify-start gap-2 border-zinc-800 bg-zinc-900/50 text-zinc-400 hover:text-white hover:bg-zinc-800"
                        >
                            <ArrowLeft size={16} />
                            返回主页
                        </Button>
                    </Link>

                    <div className="text-lg font-bold tracking-tight px-1">
                        Private Lab <span className="text-zinc-500 font-normal">Admin</span>
                    </div>
                </div>

                {/* 2. 中间导航菜单区 */}
                <nav className="flex-1 flex flex-col gap-1 p-4 overflow-y-auto">
                    {/* 原有 Home 管理 */}
                    {HOME_NAV_ITEMS.map((item) => (
                        <Link key={item.href} href={item.href}>
                            <Button
                                variant="ghost"
                                className="w-full justify-start gap-3 text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
                            >
                                <item.icon size={18} />
                                {item.title}
                            </Button>
                        </Link>
                    ))}

                    {/* [新增] 分割线 */}
                    <div className="my-4 mx-2 border-t border-white/10" />

                    {/* [新增] Room Space 小标题 (可选，增加层级感) */}
                    <div className="px-4 mb-2 text-[10px] font-bold text-zinc-600 uppercase tracking-wider">
                        Room Space
                    </div>

                    {/* [新增] Room 管理项 */}
                    {ROOM_NAV_ITEMS.map((item) => (
                        <Link key={item.href} href={item.href}>
                            <Button
                                variant="ghost"
                                className="w-full justify-start gap-3 text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
                            >
                                <item.icon size={18} />
                                {item.title}
                            </Button>
                        </Link>
                    ))}
                </nav>

                {/* 3. 底部功能区：退出登录按钮 */}
                <div className="p-4 border-t border-white/10">
                    <Button
                        variant="ghost"
                        className="w-full justify-start gap-3 text-red-400 hover:text-red-300 hover:bg-red-950/30"
                    // onClick={() => ...} // 这里后续绑定退出登录逻辑
                    >
                        <LogOut size={18} />
                        退出登录
                    </Button>
                </div>
            </aside>

            {/* 右侧主要内容区 */}
            <main className="flex-1 ml-64 min-h-screen bg-[#020202]">
                <div className="container mx-auto max-w-6xl p-8">
                    {children}
                </div>
            </main>
        </div>
    );
}