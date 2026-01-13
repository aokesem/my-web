"use client";

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { Link } from 'lucide-react';
import NextLink from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function AdminLogin() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            toast.error("Login failed: " + error.message);
            setLoading(false);
        } else {
            toast.success("登录成功!");
            router.push('/admin');
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-black relative">
            {/* Back to Home Button */}
            <NextLink href="/" className="absolute top-8 left-8 p-3 border border-white/10 hover:border-white/30 rounded-full transition-all group bg-black/50 backdrop-blur-md z-50">
                <ArrowLeft size={20} className="text-gray-500 group-hover:text-gray-200" />
            </NextLink>

            <Card className="w-full max-w-sm bg-zinc-900 border-zinc-800 text-white">
                <CardHeader>
                    <CardTitle className="text-2xl">管理员登录</CardTitle>
                    <CardDescription className="text-zinc-400">
                        请输入您的凭证以访问管理后台。
                    </CardDescription>
                </CardHeader>
                <form onSubmit={handleLogin}>
                    <CardContent className="grid gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="email">邮箱</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="m@example.com"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="bg-black border-zinc-700"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="password">密码</Label>
                            <Input
                                id="password"
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="bg-black border-zinc-700"
                            />
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button className="w-full bg-white text-black hover:bg-gray-200" type="submit" disabled={loading}>
                            {loading ? "登录中..." : "登录"}
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}
