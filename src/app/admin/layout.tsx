"use client";

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';
import { BookOpen, Monitor, LogOut, LayoutDashboard, Database } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast, Toaster } from 'sonner';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        const checkUser = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session && pathname !== '/admin/login') {
                router.push('/admin/login');
            } else {
                setLoading(false);
            }
        };

        checkUser();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (!session && pathname !== '/admin/login') {
                router.push('/admin/login');
            }
        });

        return () => subscription.unsubscribe();
    }, [router, pathname]);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/admin/login');
        toast.success("Logged out");
    };

    // If on login page, render without layout shell
    if (pathname === '/admin/login') {
        return (
            <>
                {children}
                <Toaster />
            </>
        );
    }

    if (loading) {
        return <div className="h-screen w-full flex items-center justify-center bg-black text-white">加载中...</div>;
    }

    const navItems = [
        { name: '仪表盘', href: '/admin', icon: LayoutDashboard },
        { name: '书籍管理', href: '/admin/books', icon: BookOpen },
        { name: '番剧管理', href: '/admin/anime', icon: Monitor }, // Using Monitor for Anime/Videos
        { name: '电影管理', href: '/admin/movies', icon: Database }, // Temporary icon
    ];

    return (
        <div className="flex min-h-screen bg-black text-gray-100 font-sans">
            <Toaster />
            {/* Sidebar */}
            <aside className="w-64 border-r border-white/10 bg-zinc-950 flex flex-col">
                <div className="p-6 border-b border-white/10">
                    <h1 className="text-xl font-bold tracking-wider uppercase">后台管理系统</h1>
                </div>

                <nav className="flex-1 p-4 space-y-2">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
                        return (
                            <Link key={item.href} href={item.href}>
                                <Button
                                    variant={isActive ? "secondary" : "ghost"}
                                    className={`w-full justify-start gap-3 ${isActive ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white hover:bg-zinc-900'}`}
                                >
                                    <item.icon size={18} />
                                    {item.name}
                                </Button>
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-white/10">
                    <Button variant="ghost" className="w-full justify-start gap-3 text-red-400 hover:text-red-300 hover:bg-red-950/30" onClick={handleLogout}>
                        <LogOut size={18} />
                        退出登录
                    </Button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-8 overflow-y-auto bg-[#050505]">
                {children}
            </main>
        </div>
    );
}
